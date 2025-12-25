# <font style="color:rgb(31, 31, 31);">🏢</font><font style="color:rgb(31, 31, 31);"> 智能电梯调度模拟系统 (Smart Elevator Dispatch System)</font>
<font style="color:rgb(31, 31, 31);">一个基于原生 JavaScript 和 Web Workers 实现的高仿真电梯调度系统。该项目模拟了现代写字楼中多部电梯的协同运行，包含拟物化的 UI 界面、真实的物理运行逻辑以及高效的调度算法。</font>

## <font style="color:rgb(31, 31, 31);">✨</font><font style="color:rgb(31, 31, 31);"> 核心特性</font>
+ **<font style="color:rgb(31, 31, 31);">⚡</font><font style="color:rgb(31, 31, 31);">️ 多线程架构</font>**<font style="color:rgb(31, 31, 31);">: 每一部电梯都在独立的 </font><font style="color:rgb(68, 71, 70);">Web Worker</font><font style="color:rgb(31, 31, 31);"> 线程中运行，互不阻塞，模拟真实的独立控制器。</font>
+ **<font style="color:rgb(31, 31, 31);">🧠</font><font style="color:rgb(31, 31, 31);"> 智能调度算法</font>**<font style="color:rgb(31, 31, 31);">: 采用 </font>**<font style="color:rgb(31, 31, 31);">LOOK 算法</font>**<font style="color:rgb(31, 31, 31);">（扫描算法）作为单梯运行策略，结合主线程的“代价评估函数”进行多梯任务分配，实现最优响应。</font>
+ **<font style="color:rgb(31, 31, 31);">🎨</font><font style="color:rgb(31, 31, 31);"> 拟物化 UI 设计</font>**<font style="color:rgb(31, 31, 31);">:</font>
    - <font style="color:rgb(31, 31, 31);">纯 CSS 实现的 3D 质感电梯井与轿厢。</font>
    - <font style="color:rgb(31, 31, 31);">动态开关门动画与内部灯光效果。</font>
    - <font style="color:rgb(31, 31, 31);">实时高亮的楼层按钮与控制面板。</font>
+ **<font style="color:rgb(31, 31, 31);">💾</font><font style="color:rgb(31, 31, 31);"> 高效状态管理</font>**<font style="color:rgb(31, 31, 31);">: 使用 </font>**<font style="color:rgb(31, 31, 31);">位掩码 (Bitmask)</font>**<font style="color:rgb(31, 31, 31);"> (</font><font style="color:rgb(68, 71, 70);">001</font><font style="color:rgb(31, 31, 31);">, </font><font style="color:rgb(68, 71, 70);">010</font><font style="color:rgb(31, 31, 31);">, </font><font style="color:rgb(68, 71, 70);">100</font><font style="color:rgb(31, 31, 31);">) 在一个整型数组中管理同层楼的多种请求（上行、下行、内呼），极大优化了状态判断逻辑。</font>
+ **<font style="color:rgb(31, 31, 31);">🔄</font><font style="color:rgb(31, 31, 31);"> 业务意图分离</font>**<font style="color:rgb(31, 31, 31);">: 引入“业务方向”与“物理方向”分离机制，完美处理“顺路接客”与“空车赶路”的复杂场景。</font>

## <font style="color:rgb(31, 31, 31);">🚀</font><font style="color:rgb(31, 31, 31);"> 在线演示</font>

[<font style="color:rgb(11, 87, 208);">点击这里查看 Live Demo</font>](https://www.google.com/search?q=https://%E4%BD%A0%E7%9A%84%E7%94%A8%E6%88%B7%E5%90%8D.github.io/elevator-simulation/)

## <font style="color:rgb(31, 31, 31);">🛠️</font><font style="color:rgb(31, 31, 31);"> 技术栈</font>
+ **<font style="color:rgb(31, 31, 31);">HTML5 / CSS3</font>**<font style="color:rgb(31, 31, 31);">: 用于构建楼层结构、控制面板及动画效果。</font>
+ **<font style="color:rgb(31, 31, 31);">JavaScript (ES6+)</font>**<font style="color:rgb(31, 31, 31);">: 核心逻辑实现。</font>
+ **<font style="color:rgb(31, 31, 31);">Web Workers</font>**<font style="color:rgb(31, 31, 31);">: 实现多线程并行计算，模拟分布式控制系统。</font>

## <font style="color:rgb(31, 31, 31);">📂</font><font style="color:rgb(31, 31, 31);"> 项目结构</font>
```plain
elevator-simulation/
├── index.html            # 主页面
├── main.js               # 主线程逻辑：负责 UI 渲染、事件监听与任务分发
├── elevator.worker.js    # Worker 线程：负责单部电梯的状态机、LOOK 算法与位移计算
└── README.md             # 项目说明文档
```

## <font style="color:rgb(31, 31, 31);">📦</font><font style="color:rgb(31, 31, 31);"> 安装与运行</font>
<font style="color:rgb(31, 31, 31);">由于项目使用了 ES6 Modules 和 Web Workers，浏览器出于安全策略（CORS）限制，无法直接双击 </font><font style="color:rgb(68, 71, 70);">.html</font><font style="color:rgb(31, 31, 31);"> 文件打开，必须通过本地服务器运行。</font>

### <font style="color:rgb(31, 31, 31);">方法 1: 使用 Python (推荐)</font>
<font style="color:rgb(31, 31, 31);">如果您安装了 Python，只需在项目根目录下运行：</font>


```plain
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

<font style="color:rgb(31, 31, 31);">然后打开浏览器访问 </font><font style="color:rgb(68, 71, 70);">http://localhost:8000</font><font style="color:rgb(31, 31, 31);">。</font>

### <font style="color:rgb(31, 31, 31);">方法 2: 使用 VS Code</font>
1. <font style="color:rgb(31, 31, 31);">在 VS Code 中安装 </font>**<font style="color:rgb(31, 31, 31);">Live Server</font>**<font style="color:rgb(31, 31, 31);"> 插件。</font>
2. <font style="color:rgb(31, 31, 31);">右键点击 </font><font style="color:rgb(68, 71, 70);">index.html</font><font style="color:rgb(31, 31, 31);">。</font>
3. <font style="color:rgb(31, 31, 31);">选择 </font>**<font style="color:rgb(31, 31, 31);">"Open with Live Server"</font>**<font style="color:rgb(31, 31, 31);">。</font>

## <font style="color:rgb(31, 31, 31);">🧩</font><font style="color:rgb(31, 31, 31);"> 算法原理</font>
### <font style="color:rgb(31, 31, 31);">1. 任务分配 (主线程)</font>
<font style="color:rgb(31, 31, 31);">当用户点击外部按钮时，主线程会遍历所有电梯，计算“代价 (Cost)”：</font>

+ **<font style="color:rgb(31, 31, 31);">空闲电梯</font>**<font style="color:rgb(31, 31, 31);">: 代价 = </font><font style="color:rgb(68, 71, 70);">|电梯所在层 - 目标层|</font>
+ **<font style="color:rgb(31, 31, 31);">同向且顺路</font>**<font style="color:rgb(31, 31, 31);">: 代价 = </font><font style="color:rgb(68, 71, 70);">|电梯所在层 - 目标层|</font>
+ **<font style="color:rgb(31, 31, 31);">反向或已错过</font>**<font style="color:rgb(31, 31, 31);">: 代价 = </font><font style="color:rgb(68, 71, 70);">Infinity</font><font style="color:rgb(31, 31, 31);"> (不可用) 或 极高惩罚值</font>

### <font style="color:rgb(31, 31, 31);">2. 运行决策 (Worker 线程)</font>
<font style="color:rgb(31, 31, 31);">电梯内部维护一个长度为 10 的数组 </font><font style="color:rgb(68, 71, 70);">requests</font><font style="color:rgb(31, 31, 31);">，利用位运算存储状态：</font>

+ <font style="color:rgb(68, 71, 70);">REQ_UP (1)</font><font style="color:rgb(31, 31, 31);">: 外部向上请求</font>
+ <font style="color:rgb(68, 71, 70);">REQ_DOWN (2)</font><font style="color:rgb(31, 31, 31);">: 外部向下请求</font>
+ <font style="color:rgb(68, 71, 70);">REQ_INSIDE (4)</font><font style="color:rgb(31, 31, 31);">: 内部下车请求</font>

<font style="color:rgb(31, 31, 31);">每次移动前，电梯根据 </font>**<font style="color:rgb(31, 31, 31);">LOOK 算法</font>**<font style="color:rgb(31, 31, 31);"> 决策：</font>

1. <font style="color:rgb(31, 31, 31);">沿当前方向继续移动，直到前方无任务。</font>
2. <font style="color:rgb(31, 31, 31);">若前方无任务，但反向有任务，则通过“扫描”机制换向。</font>
3. <font style="color:rgb(31, 31, 31);">利用 </font><font style="color:rgb(68, 71, 70);">serviceDirection</font><font style="color:rgb(31, 31, 31);"> (业务方向) 锁定空闲电梯的接客意图，避免“空车赶路”时被错误的顺路请求打断。</font>

## <font style="color:rgb(31, 31, 31);">📝</font><font style="color:rgb(31, 31, 31);"> 待办事项 (To-Do)</font>
+ <font style="color:rgb(31, 31, 31);">[ ] 增加更多楼层和电梯数量的配置项。</font>
+ <font style="color:rgb(31, 31, 31);">[ ] 添加电梯超载模拟。</font>
+ <font style="color:rgb(31, 31, 31);">[ ] 增加高峰期模式（如早高峰上行优先）。</font>

## <font style="color:rgb(31, 31, 31);">📄</font><font style="color:rgb(31, 31, 31);"> 许可证</font>
<font style="color:rgb(31, 31, 31);">本项目采用 </font>[<font style="color:rgb(11, 87, 208);">MIT License</font>](https://www.google.com/search?q=LICENSE)<font style="color:rgb(31, 31, 31);"> 开源。</font>



