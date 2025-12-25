// main.js

// 1. 生成楼层界面
function createFloors() {
    const container = document.querySelector('.floors-container');
    let floorsHTML = '';
    for (let i = 1; i <= 10; i++) {
        floorsHTML += `
            <div class="floor-label">
                <div class="floor-number">${i}F</div>
                <div class="button-group">
                    <button class="up-btn" data-floor="${i}" data-dir="up">▲</button>
                    <button class="down-btn" data-floor="${i}" data-dir="down">▼</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = floorsHTML;
    
    // 生成完 HTML 后，立即绑定点击事件
    setupButtonListeners();
}

function createElevators() {
    const container = document.querySelector('.shafts-container');
    let elevatorsHTML = '';
    
    for (let i = 1; i <= 4; i++) {
        // 生成楼层按钮 (10到1)
        let floorButtonsHTML = '';
        for (let f = 10; f >= 1; f--) {
            floorButtonsHTML += `<button class="internal-floor-btn" data-floor="${f}">${f}</button>`;
        }

        elevatorsHTML += `
            <div class="elevator-column">
                <div class="shaft" id="elevator-${i}">
                    <div class="cabin">${i}号梯</div>
                </div>
                <div class="elevator-controls" data-elevator-id="${i}">
                    <div class="floor-select">
                        ${floorButtonsHTML}
                    </div>
                    <div class="door-controls">
                        <button class="door-btn open-btn">开门</button>
                        <button class="door-btn close-btn">关门</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = elevatorsHTML;
    
    // 绑定内部按钮事件
    setupInternalListeners();
}

// 绑定按钮事件监听
function setupButtonListeners() {
    const container = document.querySelector('.floors-container');
    
    container.addEventListener('click', (e) => {
        // 利用事件委托，判断点击的是不是按钮
        if (e.target.tagName === 'BUTTON') {
            const btn = e.target;
            const floor = parseInt(btn.dataset.floor);
            const direction = btn.dataset.dir;

            // 点亮按钮 (视觉反馈)
            btn.classList.add('active');

            // 寻找最佳电梯
            const bestElevatorIndex = findBestElevator(floor, direction);

            // 发送指令
            if (bestElevatorIndex !== -1) {
                console.log(`调度中心：指派 ${bestElevatorIndex + 1}号梯 前往 ${floor}楼 (${direction})`);
                const worker = elevators[bestElevatorIndex];
                worker.postMessage({
                    type: 'DISPATCH',
                    payload: { targetFloor: floor, targetDirection: direction }
                });
            }
        }
    });
}

function setupInternalListeners() {
    const container = document.querySelector('.shafts-container');
    
    container.addEventListener('click', (e) => {
        const target = e.target;
        
        // 1. 内部楼层按钮
        if (target.classList.contains('internal-floor-btn')) {
            const floor = parseInt(target.dataset.floor);
            const controls = target.closest('.elevator-controls');
            const elevatorId = parseInt(controls.dataset.elevatorId);
            
            // 注意：elevatorId 是 1-based，数组是 0-based
            const state = elevatorStates[elevatorId - 1];

            // 电梯正在运行，且目标楼层与电梯当前楼层方向不一致
            if((floor - state.floor > 0 && state.direction === 'down') || (floor - state.floor < 0 && state.direction === 'up')){
                return;
            }

            // 视觉反馈：点亮
            target.classList.add('active');
            
            // 直接发送给对应电梯
            // 注意：elevatorId 是 1-based，数组是 0-based
            if (elevators[elevatorId - 1]) {
                const worker = elevators[elevatorId - 1];
                worker.postMessage({
                    type: 'DISPATCH',
                    payload: { targetFloor: floor }
                });
            }
        }
        
        // 2. 开关门按钮
        if (target.classList.contains('door-btn')) {
            const controls = target.closest('.elevator-controls');
            const elevatorId = parseInt(controls.dataset.elevatorId);
            
            if (elevators[elevatorId - 1]) {
                const worker = elevators[elevatorId - 1];
                if (target.classList.contains('open-btn')) {
                    console.log(`${elevatorId}号梯：按下开门键`);
                    worker.postMessage({ type: 'OPEN_DOOR' });
                } else if (target.classList.contains('close-btn')) {
                    console.log(`${elevatorId}号梯：按下关门键`);
                    worker.postMessage({ type: 'CLOSE_DOOR' });
                }
            }
        }
    });
}


// 智能调度算法：寻找成本最低的电梯
function findBestElevator(targetFloor, requestDirection) {
    let bestId = -1;
    let minCost = Infinity;

    for (let i = 0; i < elevatorStates.length; i++) {
        const state = elevatorStates[i];
        const id = i;
        let cost = Infinity;

        // 获取电梯当前的业务意图
        const currentServiceDir = state.serviceDirection;
        
        // 情况 A: 电梯空闲
        if (state.direction === 'idle') {
            cost = Math.abs(state.floor - targetFloor);
        }
        // 情况 B: 电梯正在运行
        else {
            if (currentServiceDir === 'idle') {
                // 如果电梯业务方向是空闲，说明是刚被唤醒，业务方向应该是运行方向
                cost = Math.abs(state.floor - targetFloor);
            } 
            // 只有当“业务方向”和“请求方向”一致时，才允许顺路接客。
            else if (currentServiceDir !== requestDirection) {
                // 意图相反（包括赶路状态），直接不可用
                cost = Infinity; 
            } else {
                // 意图相同，再检查物理位置是否顺路 (Scan 算法)
                const isIncoming = (state.direction === 'up' && state.floor < targetFloor) ||
                                   (state.direction === 'down' && state.floor > targetFloor);
                
                if (isIncoming) {
                    cost = Math.abs(state.floor - targetFloor);
                } else {
                    // 同向但已错过，代价极大
                    cost = Math.abs(state.floor - targetFloor) + 20;
                }
            }
        }

        if (cost < minCost) {
            minCost = cost;
            bestId = id;
        }
    }

    return bestId;
}

// 全局变量
const elevators = [];
// 新增：主线程维护的电梯状态镜像，用于调度决策
const elevatorStates = [
    { floor: 1, direction: 'idle', serviceDirection: 'idle', isMoving: false, isDoorOpen: false },
    { floor: 1, direction: 'idle', serviceDirection: 'idle', isMoving: false, isDoorOpen: false },
    { floor: 1, direction: 'idle', serviceDirection: 'idle', isMoving: false, isDoorOpen: false },
    { floor: 1, direction: 'idle', serviceDirection: 'idle', isMoving: false, isDoorOpen: false }
];

function initElevators() {
    createFloors(); // 生成楼层界面
    createElevators(); // 生成电梯界面

    for (let i = 0; i < 4; i++) {
        const worker = new Worker('elevator.worker.js');
        
        worker.onmessage = function(e) {
            const { type, payload } = e.data;
            const elevatorId = i + 1; // 1-based ID for view

            if (type === 'STATUS_UPDATE') {
                // 1. 更新主线程的状态镜像 (给调度算法用)
                elevatorStates[i] = payload; 
                // 2. 更新视觉
                updateElevatorView(elevatorId, payload);
            } 
            else if (type === 'ARRIVED') {
                console.log(`${elevatorId}号梯：到达 ${payload.floor}层`);

                // 熄灭该电梯内部的楼层按钮
                const internalBtn = document.querySelector(`.elevator-controls[data-elevator-id="${elevatorId}"] button[data-floor="${payload.floor}"]`);
                if (internalBtn) internalBtn.classList.remove('active');

                // 更新状态
                elevatorStates[i] = payload;
                updateElevatorView(elevatorId, payload);
                console.log("电梯运行方向：" + payload.direction)
                console.log("电梯业务方向：" + payload.serviceDirection)

                //电梯到达后，熄灭与电梯业务方向相同的该电梯外部的楼层按钮
                if(payload.serviceDirection !== 'idle'){
                    const btnClass = payload.serviceDirection + '-btn';
                    const btn = document.querySelector(`.floors-container button.${btnClass}[data-floor="${payload.floor}"]`);
                    btn.classList.remove('active')
                }
            }
        };

        elevators.push(worker);
    }
}

function updateElevatorView(id, status) {
    const cabin = document.querySelector(`#elevator-${id} .cabin`);
    // 视觉计算：楼层-1 乘以 高度负值
    const translateY = (status.floor - 1) * - 40;
    
    // 动态调整 transition
    cabin.style.transition = status.isMoving ? 'transform 1s linear' : 'none';
    cabin.style.transform = `translateY(${translateY}px)`;
    
    // 开门/关门 视觉状态
    if (status.isDoorOpen) {
        cabin.classList.add('open');
    } else {
        cabin.classList.remove('open');
    }

    let flag = "";
    if(status.direction === 'up'){
        flag = '↑';
    }else if(status.direction === 'down'){
        flag = '↓';
    }

    // 更新轿厢内的文字
    cabin.textContent = `${id}号梯 ${flag}`;
}

// 启动！
initElevators();
