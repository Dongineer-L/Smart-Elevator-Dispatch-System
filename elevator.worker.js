// elevator.worker.js

// === 常量定义 ===
const REQ_UP = 1;      // 二进制 001
const REQ_DOWN = 2;    // 二进制 010
const REQ_INSIDE = 4;  // 二进制 100 (代表内部乘客要出电梯)

// === 状态存储 ===
let state = {
    floor: 1,           // 当前楼层 (1-10)
    direction: 'idle',  // 物理运行方向: 'idle', 'up', 'down'
    serviceDirection: 'idle', // 业务服务方向: 'idle', 'up', 'down'
    // 数组索引 0-9 对应楼层 1-10。每个元素是该楼层所有请求的位叠加值
    requests: new Array(10).fill(0), 
    isMoving: false     
};

let doorTimer = null;
let isDoorOpen = false;

// === 消息监听 ===
self.onmessage = function(e) {
    const { type, payload } = e.data;
    switch (type) {
        case 'DISPATCH':
            handleDispatch(payload);
            break;
        case 'GET_STATUS':
            postStatus();
            break;
        case 'OPEN_DOOR':
            handleOpenDoor();
            break;
        case 'CLOSE_DOOR':
            handleCloseDoor();
            break;
    }
};

// 接收任务与确定业务方向
function handleDispatch(payload) {
    const targetFloor = payload.targetFloor; // 1-10
    const targetDirection = payload.targetDirection; // 'up', 'down' 或 undefined(内部)
    const index = targetFloor - 1; // 数组索引

    // 更新请求数组 (使用位运算 |= 叠加状态)
    if (targetDirection === 'up') {
        state.requests[index] |= REQ_UP;
    } else if (targetDirection === 'down') {
        state.requests[index] |= REQ_DOWN;
    } else {
        // 内部按钮
        state.requests[index] |= REQ_INSIDE;
    }

    // 确定业务服务方向
    // 只有当电梯目前是空闲 'idle' 状态时，这个新任务才决定了接下来的“主业务方向”
    if (state.serviceDirection === 'idle') {
        if (targetDirection) {
            // 情况 A: 外部召唤 
            // 业务方向 = 乘客想要去的方向
            state.serviceDirection = targetDirection;
        } else {
            // 情况 B: 内部按钮
            // 业务方向 = 物理位移方向
            state.serviceDirection = targetFloor > state.floor ? 'up' :  targetFloor < state.floor ? 'down' : 'idle';
        }
    }

    // 唤醒电梯
    if (!isDoorOpen && !state.isMoving) {
        decideDirection(); // 决策物理运行方向
        startEngine();
    }
}

// 决策物理方向 (LOOK 算法) 
function decideDirection() {
    const currentIdx = state.floor - 1;

    // 辅助函数：检查某范围内是否有任务
    const hasTask = (startIdx, endIdx) => {
        if (startIdx > endIdx) return false;
        for (let i = startIdx; i <= endIdx; i++) {
            if (state.requests[i] > 0) return true;
        }
        return false;
    };

    if (state.direction === 'up') {
        // 向上模式：如果上方有任何请求，继续向上
        if (hasTask(currentIdx + 1, 9)) {
            state.direction = 'up';
        } 
        // 到了顶端或上方无任务：检查当前层是否有反向或内部请求，或者下方有任务
        else if (hasTask(0, currentIdx)) {
            state.direction = 'down';
        } else {
            state.direction = 'idle';
        }
    } 
    else if (state.direction === 'down') {
        // 向下模式：如果下方有任何请求，继续向下
        if (hasTask(0, currentIdx - 1)) {
            state.direction = 'down';
        } 
        // 到了底端或下方无任务
        else if (hasTask(currentIdx, 9)) {
            state.direction = 'up';
        } else {
            state.direction = 'idle';
        }
    } 
    else { // idle
        if (hasTask(currentIdx + 1, 9)) state.direction = 'up';
        else if (hasTask(0, currentIdx - 1)) state.direction = 'down';
        else if (state.requests[currentIdx] > 0) {
            // 有请求在本层，物理方向 = 业务方向
            state.direction = state.serviceDirection; 
        }
    }

    // === 同步业务方向 ===
    // 如果物理方向彻底停止，业务方向也重置
    if (state.direction === 'idle') {
        state.serviceDirection = 'idle';
    } 
    // 如果物理方向发生了折返（例如从 Deadhead Up 变成了 Service Down），更新业务方向
    else if (state.direction === 'up' && state.serviceDirection === 'idle') {
        state.serviceDirection = 'up';
    }
    else if (state.direction === 'down' && state.serviceDirection === 'idle') {
        state.serviceDirection = 'down';
    }
}

// 运行与停车判断
function processNextStep() {
    const currentIdx = state.floor - 1;
    const req = state.requests[currentIdx]; // 获取当前层的所有请求
    let shouldStop = false;
    
    // --- 停车判断逻辑 ---
    
    // 内部乘客要下车 (REQ_INSIDE 存在)
    if (req & REQ_INSIDE) { // 等同于req == REQ_INSIDE
        shouldStop = true;
        // 移除内部请求标记 (使用异或操作或取反与操作)
        state.requests[currentIdx] &= ~REQ_INSIDE; 
    }

    // 顺路接客
    if (state.direction === 'up') {
        // 只有当电梯也是去楼上 (Service Up) 或者是去接人途中(Service Down but Deadhead Up)，
        // 但为了严谨，我们通常只响应同向。
        
        // 如果这里有“向上”的请求，且我正在向上跑 -> 停
        if (req & REQ_UP) {
            // 【重要】检查业务方向：
            // 如果我是专程去楼上接向下的人 (Deadhead, Service=Down)，我不应该停下来接向上的。
            // 但如果我是空闲或也是去楼上，就停。
            if (state.serviceDirection === 'up' || state.serviceDirection === 'idle') {
                shouldStop = true;
                state.requests[currentIdx] &= ~REQ_UP;
            }
        }
        
        // 特殊情况：上方没任务了（折返点），且这里有向下的请求 -> 停
        const hasTaskAbove = state.requests.slice(currentIdx + 1).some(r => r > 0);
        if (!hasTaskAbove && (req & REQ_DOWN)) {
            shouldStop = true;
            state.requests[currentIdx] &= ~REQ_DOWN;
            // 稍后 decideDirection 会把物理方向改为 down
            state.serviceDirection = 'down'; // 更新业务方向
            state.direction = 'down'; // 把物理方向改为 down
        }
    } 
    else if (state.direction === 'down') {
        // 向下运行接向下的
        if (req & REQ_DOWN) {
            if (state.serviceDirection === 'down' || state.serviceDirection === 'idle') {
                shouldStop = true;
                state.requests[currentIdx] &= ~REQ_DOWN;
            }
        }
        // 特殊情况：下方没任务了（折返点），且这里有向上的请求 -> 停
        const hasTaskBelow = state.requests.slice(0, currentIdx).some(r => r > 0);
        if (!hasTaskBelow && (req & REQ_UP)) {
            shouldStop = true;
            state.requests[currentIdx] &= ~REQ_UP;
            state.serviceDirection = 'up';
            state.direction = 'up'; // 把物理方向改为 up
        }
    }
    else if (state.direction === 'idle') {
        // 静止时，有任何请求都开门
        if (req > 0) {
            shouldStop = true;
            state.requests[currentIdx] = 0; // 清空该层所有请求
        }
    }

    // 执行
    if (shouldStop) {
        arriveAtFloor(state.floor);
        return;
    }

    // 移动前再次确认方向
    decideDirection();

    if (state.direction === 'idle') {
        state.isMoving = false;
        postStatus();
        return;
    }

    // 移动
    if (state.direction === 'up') state.floor++;
    if (state.direction === 'down') state.floor--;

    postStatus();
    setTimeout(processNextStep, 1000);
}

// ... (startEngine, arriveAtFloor, closeDoorAndContinue, postStatus, handleOpen/CloseDoor 保持原样或微调) ...

function startEngine() {
    state.isMoving = true;
    processNextStep();
}

function arriveAtFloor(floor) {
    isDoorOpen = true;
    if (doorTimer) clearTimeout(doorTimer);
    self.postMessage({ 
        type: 'ARRIVED', 
        payload: { 
            floor: floor, 
            direction: state.direction, 
            serviceDirection: state.serviceDirection,
            isMoving: state.isMoving,
            isDoorOpen: true 
        } 
    });
    doorTimer = setTimeout(closeDoorAndContinue, 3000);
}

function closeDoorAndContinue() {
    isDoorOpen = false;
    doorTimer = null;
    postStatus();
    decideDirection();
    processNextStep();
}

function handleOpenDoor() {
    if (isDoorOpen) {
        if (doorTimer) clearTimeout(doorTimer);
        doorTimer = setTimeout(closeDoorAndContinue, 3000);
    } else if (!state.isMoving && state.direction === 'idle') {
        arriveAtFloor(state.floor);
    }
}

function handleCloseDoor() {
    if (isDoorOpen) {
        if (doorTimer) clearTimeout(doorTimer);
        closeDoorAndContinue();
    }
}

function postStatus() {
    self.postMessage({
        type: 'STATUS_UPDATE',
        payload: {
            floor: state.floor,
            direction: state.direction,
            serviceDirection: state.serviceDirection,
            isMoving: state.isMoving,
            isDoorOpen: isDoorOpen
        }
    });
}