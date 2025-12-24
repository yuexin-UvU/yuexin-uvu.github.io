我想增加游戏内容，即在第三栏加入侧导航，分【行政任务】和【日志】行政任务为聊天框，每个季度刷新【领导的任务】，任务下达后进行掷骰子判定，大于等于3时甩锅成功，小于3将开启【任务】，展览工作表盘被锁定，一个季度后重开。



gemini已经生成了修改的代码，我需要你帮我把代码更改到原文件中：

这以下是实现代码。分为 **UI结构 (HTML/CSS)** 和 **逻辑实现 (JS)** 两部分。

### 1. 修改 HTML 结构 (增加右侧第三栏)

你需要修改主界面的 Grid 布局，并添加右侧栏。

```html
<div id="app" class="game-container">
    <div class="col-left">...</div>

    <div class="col-center">...</div>

    <div class="col-right">
        <div class="right-tabs">
            <button class="right-tab-btn active" onclick="game.switchRightTab('admin')">行政任务</button>
            <button class="right-tab-btn" onclick="game.switchRightTab('log')">工作日志</button>
        </div>

        <div id="panel-admin" class="right-panel active">
            <div class="chat-container" id="admin-chat-box">
                <div class="chat-msg leader">
                    <div class="avatar">领</div>
                    <div class="bubble">小王啊，这有个紧急材料要写一下。</div>
                </div>
            </div>
            <div class="admin-actions" id="admin-actions">
                <button class="dice-btn" onclick="game.actionRollDice()">🎲 尝试甩锅 (Roll)</button>
            </div>
        </div>

        <div id="panel-log" class="right-panel">
            <div id="log-container">
                </div>
        </div>
    </div>
</div>

```

### 2. 添加 CSS (样式支持)

```css
/* style.css */

/* 修改主容器为 3 列布局 */
.game-container {
    display: grid;
    /* 左:260px, 中:自适应, 右:300px */
    grid-template-columns: 260px 1fr 300px; 
    gap: 20px;
    height: 100vh;
    padding: 20px;
    box-sizing: border-box;
}

/* 右栏样式 */
.col-right {
    background: var(--bg-panel);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.right-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
}

.right-tab-btn {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: bold;
    color: var(--text-sub);
}

.right-tab-btn.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
}

.right-panel {
    display: none;
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    position: relative;
}

.right-panel.active {
    display: flex;
    flex-direction: column;
}

/* 聊天框样式 */
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-bottom: 20px;
}

.chat-msg {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.chat-msg.leader .avatar { background: #ff9f43; } /* 领导头像色 */
.chat-msg.player .avatar { background: #54a0ff; } /* 玩家头像色 */
.chat-msg.system .avatar { background: #cfcfcf; font-size: 12px; } 

.chat-msg.player { flex-direction: row-reverse; }

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
}

.bubble {
    background: #f1f2f6;
    padding: 10px 14px;
    border-radius: 12px;
    border-top-left-radius: 2px;
    font-size: 14px;
    line-height: 1.4;
    color: #2f3542;
}

.chat-msg.player .bubble {
    background: var(--primary);
    color: white;
    border-top-left-radius: 12px;
    border-top-right-radius: 2px;
}

/* 底部操作区 */
.admin-actions {
    margin-top: auto;
    border-top: 1px solid var(--border);
    padding-top: 15px;
}

.dice-btn {
    width: 100%;
    padding: 12px;
    background: var(--warning); /* 橙色按钮代表风险 */
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.1s;
}

.dice-btn:active { transform: scale(0.98); }
.dice-btn:disabled { background: #ccc; cursor: not-allowed; }

/* 展览锁定覆盖层 */
.exhibit-locked-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    backdrop-filter: blur(2px);
}

.lock-icon { font-size: 40px; margin-bottom: 10px; }
.lock-text { color: var(--danger); font-weight: bold; }

```

### 3. JavaScript 逻辑实现 (data.js 和 game.js)

#### 第一步：在 `data.js` 添加行政任务库

```javascript
// data.js

const ADMIN_TASKS = [
    { text: "上面突然要检查党建材料，小王你今晚把这三年的会议记录整理一下，明天早上要。", failDesc: "通宵整理会议记录，累得像条狗。" },
    { text: "周末有个'行业赋能'的线上研讨会，没人想去，你代表咱们馆挂个号听一下。", failDesc: "挂了一周末的网课，电脑都烫了。" },
    { text: "馆里要搞'精神文明卫生评比'，你去负责检查各个办公室的垃圾桶分类。", failDesc: "翻了一天垃圾桶，身上都有味儿了。" },
    { text: "那个谁，把去年的报销单据重新贴一下，财务说胶水不合格。", failDesc: "贴发票贴到手抽筋，毫无意义的工作。" },
    { text: "有个兄弟单位来参观，缺个端茶倒水的，你形象好，去顶一下。", failDesc: "全程假笑端茶倒水，脸都僵了。" },
    { text: "领导要在年会上致辞，你给写个'既有高度又接地气'的稿子。", failDesc: "改了八百遍稿子，最后领导还是念了旧的。" }
];

```

#### 第二步：在 `game.js` 中添加逻辑

我们需要在 `game` 对象中添加右侧栏管理、任务生成、掷骰子逻辑以及修改展览渲染逻辑。

```javascript
// game.js

const game = {
    // ... 原有状态 ...
    state: {
        // ... 原有属性 ...
        flags: {
            // ... 原有flag ...
            isPanelLocked: false, // 【新增】面板是否被锁定
            currentAdminTask: null, // 【新增】当前待处理的行政任务
            adminTaskDone: false    // 【新增】本季度是否已处理
        }
    },

    // ... 原有 init ...

    // 【新增】切换右侧 Tab
    switchRightTab(tabName) {
        document.querySelectorAll('.right-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.right-panel').forEach(panel => panel.classList.remove('active'));
        
        // 找到对应的按钮和面板添加 active
        // 这里需要简单的 DOM 查找逻辑，或者直接通过 onclick 传参控制 class
        const btns = document.querySelectorAll('.right-tab-btn');
        if(tabName === 'admin') btns[0].classList.add('active');
        else btns[1].classList.add('active');

        document.getElementById(`panel-${tabName}`).classList.add('active');
    },

    // 【新增】生成季度行政任务 (在 nextQuarter 中调用)
    generateAdminTask() {
        // 重置状态
        this.state.flags.isPanelLocked = false; 
        this.state.flags.adminTaskDone = false;
        
        // 随机抽取任务
        const task = ADMIN_TASKS[Math.floor(Math.random() * ADMIN_TASKS.length)];
        this.state.flags.currentAdminTask = task;

        // UI 清空聊天框并显示领导消息
        const chatBox = document.getElementById('admin-chat-box');
        chatBox.innerHTML = ''; 
        this.addChatMsg('leader', task.text);
        
        // 启用按钮
        const btn = document.querySelector('.dice-btn');
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = "🎲 尝试甩锅 (Roll)";
        }

        // 自动切回行政 Tab 提醒玩家
        this.switchRightTab('admin');
    },

    // 【新增】添加聊天消息
    addChatMsg(role, text) {
        const box = document.getElementById('admin-chat-box');
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        
        let avatarTxt = role === 'leader' ? '领' : (role === 'player' ? '我' : '统');
        
        div.innerHTML = `
            <div class="avatar">${avatarTxt}</div>
            <div class="bubble">${text}</div>
        `;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight; // 自动滚动到底部
    },

    // 【新增】掷骰子逻辑
    actionRollDice() {
        const btn = document.querySelector('.dice-btn');
        btn.disabled = true;

        // 简单的掷骰子动画效果
        let rollCount = 0;
        const maxRolls = 10;
        
        const interval = setInterval(() => {
            const tempRoll = Math.floor(Math.random() * 6) + 1;
            btn.innerHTML = `🎲 判定中... ${tempRoll}`;
            rollCount++;

            if (rollCount >= maxRolls) {
                clearInterval(interval);
                this.resolveDiceResult();
            }
        }, 100);
    },

    // 【新增】结算骰子结果
    resolveDiceResult() {
        const baseRoll = Math.floor(Math.random() * 6) + 1;
        // 简单的 EQ 加成逻辑 (每 20点 EQ +1 点数，但最大不超过 6)
        // const bonus = Math.floor(this.state.player.eq / 20); 
        // const finalRoll = Math.min(6, baseRoll + bonus);
        const finalRoll = baseRoll; // 暂时只用纯随机，你可以按需加入 EQ 修正

        const task = this.state.flags.currentAdminTask;
        this.state.flags.adminTaskDone = true;

        if (finalRoll >= 3) {
            // 成功：甩锅
            this.addChatMsg('player', `（掷出 ${finalRoll}）领导，这事儿我不熟啊，要不让隔壁小李去？他擅长这个。`);
            setTimeout(() => {
                this.addChatMsg('leader', "行吧行吧，那你忙你的展览去。");
                this.log("success", "🎲 甩锅成功！你避开了繁琐的行政任务。");
            }, 800);
            
            document.querySelector('.dice-btn').innerHTML = `🎲 判定 ${finalRoll} (成功)`;
        } else {
            // 失败：接锅 -> 锁定
            this.state.flags.isPanelLocked = true;
            this.addChatMsg('player', `（掷出 ${finalRoll}）好的领导...我马上办...（内心崩溃）`);
            setTimeout(() => {
                this.addChatMsg('system', `❌ 任务失败：${task.failDesc}`);
                this.addChatMsg('system', `🔒 本季度展览工作面板已被锁定！`);
                this.log("danger", `🎲 甩锅失败 (点数${finalRoll})，被迫处理行政任务，展览进度停滞。`);
                this.renderExhibitPanel(); // 重新渲染以显示锁
            }, 800);

            document.querySelector('.dice-btn').innerHTML = `🎲 判定 ${finalRoll} (失败)`;
        }
    },

    // 修改 nextQuarter 方法
    nextQuarter() {
        // ... 原有代码 ...
        
        const proceedEndQuarter = () => {
            // ... 原有结算代码 ...

            // 在进入新季度时，生成新的行政任务
            this.generateAdminTask(); 

            // ... 原有代码 ...
            this.renderExhibitPanel();
        };

        // ...
    },

    // 修改 renderExhibitPanel 方法，增加锁定逻辑
    renderExhibitPanel() {
        const c = document.getElementById('exhibits-container');
        c.innerHTML = "";

        // 【新增】检查锁定状态
        if (this.state.flags.isPanelLocked) {
            c.style.position = 'relative'; // 确保父容器定位
            const overlay = document.createElement('div');
            overlay.className = 'exhibit-locked-overlay';
            overlay.innerHTML = `
                <div class="lock-icon">🔒</div>
                <div class="lock-text">行政任务繁忙中...</div>
                <div style="font-size:12px; color:#666; margin-top:5px;">本季度无法推进展览工作</div>
            `;
            c.appendChild(overlay);
            
            // 即使锁定了，我们也渲染底下的卡片，但在 overlay 之下，增加真实感
        } else {
             c.style.position = 'static'; // 重置
        }

        // ... 原有渲染卡片逻辑 (保持不变) ...
        // 注意：如果是锁定状态，原有逻辑生成的按钮虽然在 DOM 里，但被 overlay 挡住无法点击
        // 为了安全起见，可以在锁定状态下给所有按钮加 disabled
    },
    
    // ... 其他代码
};

```

### 4. 整合说明

1. **文件位置**：你需要将上述 HTML 插入到主布局中，CSS 放入样式表，JS 逻辑合并入 `game.js`。
2. **初始化**：记得在 `game.init()` 或 `startGame()` 时调用一次 `generateAdminTask()`，确保第一季度也有任务（或者你希望第一季度是新手保护期，可以不调用，只在 `nextQuarter` 调用）。
3. **Log容器**：注意把原先分散在页面各处的 log 输出容器 (`id="log-container"`) 移动到右侧栏的 Log Tab 下。

修改代码：game.js
请找到 showGuide 函数，并将 this.guideSteps 数组修改如下（我为你新增了 第 6 步）：
// 在 game.js 中找到 showGuide() 函数
    showGuide() {
        this.guideSteps = [
            {
                selector: "#status-panel",
                scene: "office",
                text: "👋 欢迎入职！\n展览工作和学业都会消耗【精力值】和【愉悦值】。\n【存款】由工资和项目奖金组成，用于个人消费和交学费。\n注意：【公款/经费】只能用于展览设计，不能混用哦！"
            },
            {
                selector: ".leisure-section",
                scene: "office",
                text: "☕ 摸鱼休息区\n工作累了可以在这里【闭目养神】或【聊八卦】。\n这是恢复精力值和愉悦值的主要途径（虽然偶尔会被抓包）。"
            },
            {
                selector: ".shop-section",
                scene: "office",
                text: "🛒 文创商店\n如果精力实在不够用，可以花点【个人存款】在这里买咖啡或套餐。\n这属于“钞能力”快速回血手段！"
            },
            {
                selector: "#research-block",
                scene: "office",
                text: "🔬 科研项目\n每年【Q1 (第一季度)】开启申报，【Q4】公布结果。\n成功立项能获得大量经费和声望，别错过窗口期！"
            },
            {
                selector: "#exhibit-block",
                scene: "office",
                text: "🏛️ 展览策划\n这是你的核心工作！\n点击【申请新展览】开始项目，随后推进搜集、研究、设计等环节。\n所有工作都会消耗精力，请量力而行。"
            },
            // ========== 【新增】行政任务引导 ==========
            {
                selector: "#panel-admin", // 指向右侧行政面板
                scene: "office",
                text: "🎲 行政甩锅 (高能预警)\n每个季度领导都会派发【行政杂活】。\n你可以点击【掷骰子】尝试甩锅：\n👉 点数≥3：甩锅成功，无事发生。\n👉 点数<3：甩锅失败，【展览面板】将被锁定一季度，无法推进工作！"
            },
            // ========================================
            {
                selector: "#tab-university",
                scene: "office",
                text: "🎓 大学导航\n点击这里可以切换到【大学/进修】界面。\n提升学历是当上馆长的必经之路。"
            },
            {
                selector: "#btn-study-course", 
                scene: "university",
                text: "📚 进修课程\n在这里可以选择短期课程进修，消耗金钱和精力，但能提升智商和声望。"
            },
            {
                selector: "#btn-apply-program", 
                scene: "university",
                text: "📜 学位申请\n只有每年的【Q2】可以申请硕士或博士！\n硕士学制3年，博士4年。记得攒够学费再来申请哦。"
            },
            {
                selector: "#tab-home",
                scene: "office", 
                text: "🏠 家庭系统\n（这部分还没来得及优化，大家可以忽略...）\n当你的存款超过1000万时，这里会自动解锁。"
            },
            {
                selector: "#btn-end-quarter",
                scene: "office",
                text: "🌙 结束季度\n当本季度没有体力或操作次数后，点击这里进入下一季度。\n工资会在此时发放，同时触发随机事件。"
            }
        ];
        
        // ... 后面的代码保持不变
        this.guideState = { index: 0 };
        this.renderGuideStep();
        if (!this._guideResizeHandler) {
            this._guideResizeHandler = () => {
                if (this.guideState) this.renderGuideStep(true);
            };
            window.addEventListener('resize', this._guideResizeHandler);
        }
    },