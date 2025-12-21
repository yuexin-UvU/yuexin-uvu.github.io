const UTILS = {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randArr: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (num, min, max) => Math.min(Math.max(num, min), max),
    formatMoney: (val) => val >= 10000 ? (val/10000).toFixed(2) + "万" : Math.floor(val) + "元",
    getStatName: (k) => k==='money'?'公款':(k==='savings'?'存款':(k==='rep'?'声望':(k==='iq'?'智商':(k==='eq'?'情商':(k==='health'?'精力':(k==='mood'?'愉悦':k))))))
};

// ==================== 事件管理器 ====================
const EventManager = {
    queue: [], // 事件队列

    // 触发季度末事件 (1-2个)
    triggerEndQuarter(game) {
        this.queue = []; // 清空旧队列
        const count = Math.random() < 0.5 ? 1 : 2; // 50%概率1个，50%概率2个
        
        // 1. 构建可用事件池
        let pool = ['life', 'audience', 'hall'];
        // 检查大学是否解锁 (假设 savings >= 10000 且智商 > 50 视为解锁了大学相关剧情，或者简单点，只要有钱就能触发)
        // 这里我们用一个简单判断：如果玩家智商 > 40，解锁学校事件
        if (game.state.player.iq >= 40) pool.push('school');

        for (let i = 0; i < count; i++) {
            const type = UTILS.randArr(pool);
            const category = RANDOM_EVENT_DB[type];
            
            // 50% 概率是被动，50% 是主动
            const isPassive = Math.random() < 0.5;
            const eventList = isPassive ? category.passive : category.active;
            const eventData = UTILS.randArr(eventList);

            this.queue.push({
                ...eventData,
                type: type,
                isPassive: isPassive
            });
        }

        // 开始处理队列
        this.processNext(game);
    },

    processNext(game) {
        if (this.queue.length === 0) return;

        const evt = this.queue.shift(); // 取出第一个
        
        if (evt.isPassive) {
            // 被动事件：直接结算并显示结果，点击关闭后处理下一个
            game.changeStat('money', evt.effect.money || 0); // 确保money变动被处理
            // 处理其他属性
            for(let k in evt.effect) {
                if(k !== 'money') game.changeStat(k, evt.effect[k]);
            }
            
            let effectText = "";
            for (let k in evt.effect) {
                let name = UTILS.getStatName(k);
                let val = evt.effect[k] > 0 ? `+${evt.effect[k]}` : evt.effect[k];
                effectText += `\n${name} ${val}`;
            }

            game.showModal(
                "📢 突发消息", 
                `${evt.desc}\n----------------${effectText}`, 
                [{
                    txt: "知道了",
                    cb: () => {
                        game.closeModal();
                        setTimeout(() => this.processNext(game), 300); // 延迟一点处理下一个
                    }
                }],
                true // 允许点击背景关闭
            );
            game.log("info", `[随机] ${evt.desc}`);
            game.updateUI();

        } else {
            // 主动事件：显示选项
            const choices = evt.choices.map(c => ({
                txt: c.txt,
                cb: () => {
                    game.closeModal();
                    // 结算效果
                    for(let k in c.effect) game.changeStat(k, c.effect[k]);
                    
                    let effectText = "";
                    for (let k in c.effect) {
                        let name = UTILS.getStatName(k);
                        let val = c.effect[k] > 0 ? `+${c.effect[k]}` : c.effect[k];
                        effectText += `\n${name} ${val}`;
                    }

                    // 显示结果弹窗，结果弹窗关闭后，继续处理队列
                    game.showModal(
                        "事件结果", 
                        `${c.res}\n----------------${effectText}`, 
                        [{
                            txt: "确定", 
                            cb: () => {
                                game.closeModal();
                                setTimeout(() => this.processNext(game), 300);
                            }
                        }], 
                        true
                    );
                    game.log("warning", `[抉择] ${evt.title}：${c.txt} -> ${c.res}`);
                    game.updateUI();
                }
            }));

            game.showModal(`❓ ${evt.title}`, evt.desc, choices);
        }
    }
};

const game = {
    state: null,
    history: null,
    isModalOpen: false, // 标记弹窗状态

    startGame() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('app').style.display = 'grid';
        this.init();
        this.showGuide();
    },

    init() {
        const edu = ["本科", "硕士"][Math.floor(Math.random()*2)];
        let baseRep = edu === "硕士" ? 5 : 0;
        const baseAge = edu === "硕士" ? 25 : 22;

        this.state = {
            player: {
                name: NAME_DB[Math.floor(Math.random()*NAME_DB.length)],
                edu: edu,
                age: baseAge,
                titleIdx: 0,
                health: 100, mood: 100,
                iq: Math.floor(Math.random()*11),
                eq: Math.floor(Math.random()*11),
                rep: baseRep,
                money: 130000,
                savings: 200
            },
            turn: { year: 1, quarter: 1 },
            limits: { leisure: 2 },
            exhibitions: [],
            flags: {
                quartersInTitle: 0,
                researchApplied: false,
                researchSuccessCount: 0,
                hasAppliedExhibitThisQuarter: false,
                hasStudiedThisQuarter: false,
                promotedThisYear: false,
                didActionThisQuarter: false
            }
        };
        
        this.saveState();
        this.log("system", `🎉 欢迎入职！这里是您的工位。新的一年，请多关照！`);
        this.updateUI();
        this.renderExhibitPanel();
    },

    saveState() { this.history = JSON.parse(JSON.stringify(this.state)); },
    markAction() { this.state.flags.didActionThisQuarter = true; },
    undoQuarter() {
        if (!this.history) return;
        this.state = JSON.parse(JSON.stringify(this.history));
        this.log("system", "↺ 时光倒流...回到了季度初，一切重新开始。");
        this.updateUI();
        this.renderExhibitPanel();
    },

    nextQuarter() {
        const proceedEndQuarter = () => {
            this.saveState();
            this.changeStat('money', 30000);
            this.log("success", "💰 季度经费已到账 (+30000)，新的预算周期开始了。");

            // 发放季度工资到个人存款（savings）
            const sal = (TITLES[this.state.player.titleIdx] && TITLES[this.state.player.titleIdx].salary) || 0;
            const quarterSalary = sal * 3;
            if (quarterSalary > 0) {
                this.changeStat('savings', quarterSalary);
                this.log("success", `💵 工资已发放：${UTILS.formatMoney(quarterSalary)}（已入个人存款）`);
            }

            // 触发随机事件
            EventManager.triggerEndQuarter(this);

            if (this.state.turn.quarter === 4 && this.state.flags.researchApplied) this.settleResearch();

            this.state.exhibitions.forEach(ex => {
                ex.quartersActive++;
                if (ex.status === 'waiting') {
                    ex.feedbackTimer--;
                    if (ex.feedbackTimer <= 0) {
                        ex.status = 'ready_for_feedback';
                        this.log("success", `📬 [${ex.name}] 的观众反馈报告送到了您的案头，请查阅。`);
                    }
                }
            });

            this.state.turn.quarter++;
            this.state.flags.quartersInTitle++;
            
            if (this.state.turn.quarter > 4) {
                this.state.turn.year++;
                this.state.turn.quarter = 1;
                this.state.player.age += 1;
                this.state.flags.researchApplied = false;
                this.state.flags.promotedThisYear = false;
            }

            if (this.state.turn.year === 4 && this.state.turn.quarter === 1 && this.state.player.titleIdx === 0) {
                this.endGame("解聘通知", "很遗憾，因入职三年未获晋升，您心灰意冷，决定将重心放到生活之中。");
                return;
            }
            this.state.limits.leisure = 2;
            this.state.flags.hasAppliedExhibitThisQuarter = false;
            this.state.flags.hasStudiedThisQuarter = false;
            this.state.flags.didActionThisQuarter = false;

            this.checkSurvival();
            this.log("turn", `📅 Y${this.state.turn.year} - Q${this.state.turn.quarter}`);
            this.updateUI();
            this.renderExhibitPanel();
        };

        if (!this.state.flags.didActionThisQuarter) {
            this.showModal(
                "提醒",
                "本季度你没有任何操作，记得安排工作或提升自己。",
                [{
                    txt: "继续进入下一季度",
                    cb: () => {
                        this.closeModal();
                        proceedEndQuarter();
                    }
                }, {
                    txt: "返回本季度",
                    cb: () => this.closeModal()
                }],
                true
            );
            return;
        }

        proceedEndQuarter();
    },

    // 结果弹窗 (通知类，可点击背景关闭)
    showResult(msg, effects) {
       // ====== 修复代码开始 ======
        // 1. 如果传入的是纯文字说明（比如经费不足的提示），直接显示，不进行属性计算
        if (typeof effects === 'string') {
            this.showModal("提示", `${msg}\n\n${effects}`, [{txt:"知道了", cb:()=>this.closeModal()}], true);
            return;
        }
        // ====== 修复代码结束 ======

        let effectText = "";
        for (let k in effects) {
            this.changeStat(k, effects[k]);
            let name = UTILS.getStatName(k);
            let val = effects[k] > 0 ? `+${effects[k]}` : effects[k];
            effectText += `\n${name} ${val}`;
        }
        // true 表示这是通知类弹窗，允许点击背景关闭
        this.showModal("事件结果", `${msg}\n----------------${effectText}`, [{txt:"知道了", cb:()=>this.closeModal()}], true);
        this.updateUI();
    },

    // [新增] 检查某个展览的某阶段是否解锁
    checkPhaseUnlocked(ex, phase) {
        if (phase === 1) return true; // 第一阶段永远解锁
        
        // 检查上一阶段的所有任务是否都已完成 (>=100)
        const prevPhaseTasks = Object.keys(EX_TASKS).filter(k => EX_TASKS[k].phase === phase - 1);
        const allDone = prevPhaseTasks.every(k => ex.tasks[k] >= 100);
        
        return allDone;
    },

    // [新增] 检查展览是否因为死线到了而失败
    checkDeadline(ex) {
        if (ex.status !== 'active') return;

        // 如果时间到了 (deadline <= 0) 且任务没做完
        const allFinished = Object.keys(ex.tasks).every(k => ex.tasks[k] >= 100);
        if (ex.deadline <= 0 && !allFinished) {
            ex.status = 'failed';
            this.showResult(`❌ 展览事故！`, { rep: -20, mood: -20 });
            this.log("danger", `☠️ [${ex.name}] 因工期延误未能开展，造成了严重的教学事故！`);
        }
    },

    actionApplyExhibit() {
        this.markAction();
        if (this.state.flags.hasAppliedExhibitThisQuarter) {
            this.showResult("申请受限", "本季度申请额度已用完，请下个季度再来。");
            return;
        }
        
        const currentNames = this.state.exhibitions.map(e => e.name);
        const pool = EX_THEMES.filter(t => !currentNames.includes(t));
        
        if (this.state.exhibitions.filter(e=>e.status!=='finished').length >= 2) {
            this.showResult("任务过载", "您手头已经有两个项目在推进了，请先完成手头工作！");
            return;
        }

        const options = [];
        for(let i=0; i<3 && pool.length>0; i++) {
            const idx = Math.floor(Math.random()*pool.length);
            options.push(pool[idx]);
            pool.splice(idx, 1);
        }

        const choices = options.map(t => ({
            txt: t,
            cb: () => {
                this.state.exhibitions.push({
                    id: Date.now(),
                    name: t,
                    status: 'active',
                    deadline: Math.floor(Math.random() * 3) + 3, // 随机 3-5 个季度
                    tasks: { collect:0, read:0, trip:0, theme:0, items:0, design:0, souvenir:0 },
                    feedbackTimer: 0,
                    quartersActive: 0
                });
                this.state.flags.hasAppliedExhibitThisQuarter = true;
                this.log("system", `📝 新项目 [${t}] 已成功立项。`);
                this.closeModal();
                this.renderExhibitPanel();
            }
        }));
        this.showModal("立项申请", "请选择本季度重点推进的展览项目：", choices);
    },

    actionExhibitTask(id, key) {
        this.markAction();
        if (this.state.player.health <= 10) {
            this.showResult("精力预警", "🚑 您的精力状况极差，无法进行高强度工作！请务必先休息。");
            return;
        }
        
        const ex = this.state.exhibitions.find(e => e.id === id);
        const task = EX_TASKS[key];
        
        if (this.state.player.money < task.cost) {
            this.showResult("经费不足", `该工作需要 ${UTILS.formatMoney(task.cost)}，当前部门经费不足。`);
            return;
        }

        // 获取该展览、该阶段的所有潜在事件
        let stageEvents = (CURATION_EVENTS[ex.name] && CURATION_EVENTS[ex.name][key]) || null;

        if (stageEvents && stageEvents.length > 0) {
            // === 新逻辑：随机抽取一个剧情事件 ===
            const evt = stageEvents[Math.floor(Math.random() * stageEvents.length)];
            
            // 兼容新旧两种数据格式
            let title, desc, choices;

            if (evt.choices) { 
                // 新格式：包含标题、描述、选项数组
                title = evt.title;
                desc = evt.desc; // 这里会显示您写的长描述
                choices = evt.choices.map(c => ({
                    txt: c.txt, // 这里会显示您写的选项文本
                    cb: () => {
                        // 扣除经费并应用选项效果
                        this.finishTask(ex, key, task.cost, c.effect, c.res || "事件已处理");
                    }
                }));
            } else {
                // 旧格式兼容
                title = `推进：${task.name}`;
                desc = "在推进过程中，请选择处理方案：";
                choices = stageEvents.map(e => ({
                    txt: e.txt,
                    cb: () => this.finishTask(ex, key, task.cost, e.effect, e.res)
                }));
            }

            this.showModal(title, desc, choices);

        } else {
            // 默认通用保底事件
            this.showModal(`推进：${task.name}`, `即将消耗经费 ${UTILS.formatMoney(task.cost)}，是否确认执行？`, [{
                txt: "确认执行",
                cb: () => this.finishTask(ex, key, task.cost, {health:-5}, "工作已完成")
            }]);
        }
    },

    finishTask(ex, key, cost, effect, resText) {
        // 扣除经费
        this.changeStat('money', -cost);
        
        // 应用子事件效果 (包含动态精力扣除)
        // 展览工作：每个选项固定消耗 10-15 精力，其余只影响 mood
        let appliedEffect = {};
        const workCost = -UTILS.rand(10, 15);
        appliedEffect.health = workCost;
        this.changeStat('health', workCost);
        if (effect && typeof effect === 'object') {
            if (effect.mood !== undefined) {
                const v = effect.mood;
                const capped = Math.sign(v) * Math.min(Math.abs(v), 5);
                if (capped !== 0) { appliedEffect.mood = capped; this.changeStat('mood', capped); }
            }
        }

        const progress = Math.floor(Math.random()*51) + 50;
        ex.tasks[key] = Math.min(100, ex.tasks[key] + progress);
        
        this.closeModal();
        // 只展示并记录实际生效的健康/愉悦变化
        this.showResult(resText, Object.keys(appliedEffect).length ? appliedEffect : "无明显变化");
        
        // 周报故事化
        let story = EX_TASKS[key].story || `完成了${EX_TASKS[key].name}工作。`;
        this.log("system", `🔨 [${ex.name}] ${story} (进度+${progress}%)`);
        
        if (Object.values(ex.tasks).every(v => v >= 100)) {
            ex.status = 'waiting';
            ex.feedbackTimer = 1;
            this.log("success", `🎉 恭喜！[${ex.name}] 的筹备工作已全部完成，等待开展！`);
        }
        this.renderExhibitPanel();
    },

    actionViewFeedback(id) {
        this.markAction();
        const ex = this.state.exhibitions.find(e => e.id === id);
        const isRushJob = ex.quartersActive <= 4;
        const isBadReview = isRushJob && Math.random() > 0.5;
        
        let content = isBadReview ? "【差评反馈】观众反映动线混乱，细节粗糙，看来欲速则不达。" : "【好评反馈】展览广受好评，学术界与公众都给予了高度评价！";
        let effects = isBadReview ? { rep: -5 } : { rep: 10 };

        this.showModal("观众反馈", content, [{
            txt: "归档项目",
            cb: () => {
                this.closeModal();
                this.showResult(isBadReview?"声望受损":"声望大幅提升", effects);
                this.state.exhibitions = this.state.exhibitions.filter(e => e.id !== id);
                this.renderExhibitPanel();
            }
        }]);
    },

    actionShop(type) {
        this.markAction();
        if (type === 'coffee') {
            // [修改] 检查存款 savings
            if (this.state.player.savings < 50) { 
                this.showResult("囊中羞涩", "你的【个人存款】不足，买不起咖啡了..."); 
                return; 
            }
            let hAdd = Math.floor(Math.random()*6)+5;
            let mAdd = Math.floor(Math.random()*6)+5;
            
            // [修改] 扣除存款 savings
            this.changeStat('savings', -50);
            this.showResult("喝了一杯特浓咖啡", {health: hAdd, mood: mAdd});
            this.log("system", "☕ 花50元私房钱喝了杯咖啡，心情变好了。");
        } else {
            // [修改] 检查存款 savings
            if (this.state.player.savings < 100) { 
                this.showResult("囊中羞涩", "你的【个人存款】不足，吃不起套餐..."); 
                return; 
            }
            let hAdd = Math.floor(Math.random()*6)+10;
            let mAdd = Math.floor(Math.random()*5)+8;
            
            // [修改] 扣除存款 savings
            this.changeStat('savings', -100);
            this.showResult("享用了文创套餐", {health: hAdd, mood: mAdd});
            this.log("system", "🍱 花100元私房钱吃了顿好的，充满力量！");
        }
    },

    changeStat(key, val) {
        this.state.player[key] += val;
        if(['health','mood','iq','eq'].includes(key)) this.state.player[key] = UTILS.clamp(this.state.player[key], 0, 100);
        if(key === 'money' || key === 'savings') this.state.player[key] = Math.max(0, this.state.player[key]);
    },

    updateUI() {
        const p = this.state.player;
        document.getElementById('ui-name').innerText = p.name;
        document.getElementById('ui-edu').innerText = p.edu;
        const ageEl = document.getElementById('ui-age');
        if (ageEl) ageEl.innerText = p.age;
        document.getElementById('ui-title').innerText = TITLES[p.titleIdx].name;
        document.getElementById('ui-iq').innerText = p.iq;
        document.getElementById('ui-eq').innerText = p.eq;
        document.getElementById('ui-rep').innerText = p.rep;
        document.getElementById('ui-money').innerText = UTILS.formatMoney(p.money);
        // [新增] 更新存款显示
        if(document.getElementById('ui-savings')) document.getElementById('ui-savings').innerText = UTILS.formatMoney(p.savings);
        
        document.getElementById('txt-health').innerText = p.health;
        document.getElementById('bar-health').style.width = p.health+"%";
        document.getElementById('txt-mood').innerText = p.mood;
        document.getElementById('bar-mood').style.width = p.mood+"%";
        
        document.getElementById('limit-leisure').innerText = `${this.state.limits.leisure}/2`;
        document.getElementById('ui-year').innerText = this.state.turn.year;
        document.getElementById('ui-quarter').innerText = this.state.turn.quarter;

        document.getElementById('btn-promote').disabled = !(this.state.turn.quarter === 4 && !this.state.flags.promotedThisYear && p.titleIdx < 4);

        const degreeBtn = document.getElementById('btn-degree');
        const degreeTitle = document.getElementById('degree-title');
        const degreeDesc = document.getElementById('degree-desc');
        if (degreeBtn && degreeTitle && degreeDesc) {
            if (p.edu === "本科") {
                degreeTitle.innerText = "申请在职硕士 (50000元)";
                degreeDesc.innerText = "晋升学历 (本科可申请)";
                degreeBtn.disabled = false;
            } else if (p.edu === "硕士") {
                degreeTitle.innerText = "申请在职博士 (50000元)";
                degreeDesc.innerText = "晋升学历 (需硕士学位)";
                degreeBtn.disabled = false;
            } else {
                degreeTitle.innerText = "已获博士学位";
                degreeDesc.innerText = "无需再申请";
                degreeBtn.disabled = true;
            }
        }
        
        const btnRes = document.getElementById('btn-research');
        document.getElementById('research-count').innerText = `${this.state.flags.researchSuccessCount}/5`;
        if (this.state.turn.quarter === 1 && !this.state.flags.researchApplied && this.state.flags.researchSuccessCount < 5) {
            btnRes.disabled = false;
            document.getElementById('research-msg').innerText = "窗口期开启";
            document.getElementById('research-msg').style.color = "var(--success)";
        } else {
            btnRes.disabled = true;
            document.getElementById('research-msg').innerText = this.state.flags.researchApplied ? "等待评审" : "窗口关闭";
            document.getElementById('research-msg').style.color = "var(--text-sub)";
        }

        // [新增] 检测家庭解锁状态
        const homeTab = document.getElementById('tab-home');
        if (homeTab) {
            if (this.state.player.savings >= 100000) {
                homeTab.classList.remove('locked');
                homeTab.innerText = "🏠 家庭"; // 去掉锁图标
                const homeView = document.getElementById('view-home');
                const placeholder = homeView && homeView.querySelector('.scene-placeholder');
                if(placeholder) {
                    placeholder.innerHTML = `<div class='scene-icon'>🏠</div><h3>温馨小窝</h3><p>欢迎回家，主人。</p>`;
                }
            }
        }
    },

    // [新增] 切换中间栏场景
    switchScene(sceneName) {
        // 1. 检查家庭解锁条件
        if (sceneName === 'home') {
            if (this.state.player.savings < 100000) {
                this.showResult("未解锁", "买房首付还没攒够呢！(需要存款≥10万)");
                return;
            }
        }

        // 2. 切换 UI 显示
        document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`view-${sceneName}`);
        if (target) target.classList.add('active');

        // 3. 更新 Tab 样式
        document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
        const tab = document.getElementById(`tab-${sceneName}`);
        if (tab && !tab.classList.contains('locked')) tab.classList.add('active');
    },

    // [新增] 大学进修逻辑 (框架)
    actionStudy(type) {
        this.markAction();
        if (type === 'course') {
            if (this.state.flags.hasStudiedThisQuarter) {
                this.showResult("进修受限", "本季度只能进修课程一次，请下个季度再来。");
                return;
            }
            if (this.state.player.savings < 5000) {
                this.showResult("存款不足", "学费不够，还是先去搬砖吧。");
                return;
            }
            const courses = [
                {
                    title: "博物馆管理与运营",
                    feedback: "你进修了海旦大学的博物馆管理与运营课程，受益匪浅。"
                },
                {
                    title: "文物保护与修复",
                    feedback: "你进修了南衡文保学院的文物保护与修复课程，对专业规范有了更深理解。"
                },
                {
                    title: "CAD建模课程",
                    feedback: "你进修了维界学院的CAD建模课程，开始理解空间表达的技术逻辑。"
                },
                {
                    title: "数字博物馆建设",
                    feedback: "你进修了那江大学的数字博物馆建设课程，思考工作中更多的可能性。"
                },
                {
                    title: "博物馆教育设计",
                    feedback: "你进修了青原大学的博物馆教育设计课程，对观众体验更加敏感。"
                }
            ];

            const choices = courses.map((course) => ({
                txt: course.title,
                cb: () => {
                    this.closeModal();
                    this.changeStat('savings', -5000);
                    this.changeStat('health', -10);
                    this.changeStat('mood', -10);
                    this.state.flags.hasStudiedThisQuarter = true;
                    this.showResult(course.feedback, { iq: 5, rep: 3 });
                    this.log("success", `🎓 进修完成：${course.title}`);
                    this.updateUI();
                }
            }));

            this.showModal("选择进修课程", "请从以下课程中选择一门进修：", choices);
            return;
        } else if (type === 'degree') {
            const p = this.state.player;
            const cost = 50000;
            if (p.edu === "本科") {
                if (p.savings < cost) {
                    this.showResult("存款不足", "学费不够，先攒点钱吧。");
                    return;
                }
                this.changeStat('savings', -cost);
                p.edu = "硕士";
                this.showResult("在职硕士毕业", { rep: 5 });
                this.log("success", "🎓 在职硕士毕业，声望+5。");
            } else if (p.edu === "硕士") {
                if (p.savings < cost) {
                    this.showResult("存款不足", "学费不够，先攒点钱吧。");
                    return;
                }
                this.changeStat('savings', -cost);
                p.edu = "博士";
                this.showResult("在职博士毕业", "学历已晋升为博士。");
                this.log("success", "🎓 在职博士毕业，学历晋升为博士。");
            } else {
                this.showResult("已是博士", "您已经拥有博士学位，无需再次申请。");
            }
        }
        this.updateUI();
    },

    renderExhibitPanel() {
        const c = document.getElementById('exhibits-container');
        c.innerHTML = "";
        
        if (this.state.exhibitions.length === 0) {
            c.innerHTML = `<div style="text-align:center; color:#ccc; padding:20px;">暂无进行中的项目</div>`;
            return;
        }

        this.state.exhibitions.forEach(ex => {
            const div = document.createElement('div');
            div.className = "exhibit-card " + ex.status;
            
            if (ex.status === 'active') {
                // 显示倒计时，颜色随时间变红
                let dlColor = ex.deadline <= 1 ? "var(--danger)" : (ex.deadline <= 2 ? "var(--warning)" : "var(--success)");
                let html = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <div style="font-weight:bold; color:var(--primary)">${ex.name}</div>
                        <div style="font-weight:bold; color:${dlColor}">🔥 距开展: ${ex.deadline}Q</div>
                    </div>
                    <div class="task-grid">`;
                
                // 遍历任务按钮
                for(let k in EX_TASKS) {
                    const taskConfig = EX_TASKS[k];
                    const done = ex.tasks[k] >= 100;
                    // 检查阶段锁
                    const unlocked = this.checkPhaseUnlocked(ex, taskConfig.phase);
                    
                    let btnClass = "task-btn";
                    let btnTxt = taskConfig.name;
                    let disabled = "";

                    if (done) {
                        btnClass += " done";
                        btnTxt += " ✔";
                        disabled = "disabled";
                    } else if (!unlocked) {
                        // 如果未解锁，变灰并加锁
                        btnClass += " locked"; 
                        btnTxt = "🔒 " + (taskConfig.phase === 2 ? "策划" : "执行"); // 简略显示阶段名
                        disabled = "disabled";
                    }

                    // 只有解锁且未完成的才能点
                    html += `<button class="${btnClass}" style="${!unlocked ? 'opacity:0.5; cursor:not-allowed;' : ''}" 
                             onclick="game.actionExhibitTask(${ex.id},'${k}')" ${disabled}>
                             <span>${btnTxt}</span>
                             </button>`;
                }
                html += `</div>`;
                div.innerHTML = html;
            } else if (ex.status === 'waiting') {
                div.innerHTML = `<div style="font-weight:bold; color:var(--text-main)">${ex.name}</div><div style="color:var(--warning); text-align:center; margin-top:10px;">⏳ 等待反馈报告...</div>`;
            } else if (ex.status === 'ready_for_feedback') {
                div.innerHTML = `<div style="font-weight:bold; color:var(--text-main)">${ex.name}</div><button class="primary" style="width:100%; margin-top:10px;" onclick="game.actionViewFeedback(${ex.id})">查看报告</button>`;
            }
            c.appendChild(div);
        });
    },

    // [修改] 升级后的摸鱼逻辑：随机抽取剧情事件
    actionLeisure(type) {
        this.markAction();
        if(this.state.limits.leisure <= 0) { 
            this.showResult("没时间了", "本季度的摸鱼额度已用完，快去工作吧！"); 
            return;
        }
        
        // 随机抽取一个事件
        const eventPool = LEISURE_EVENTS[type];
        if (!eventPool || eventPool.length === 0) return;
        const evt = eventPool[Math.floor(Math.random() * eventPool.length)];

        // 构造选项
        const choices = evt.choices.map(c => ({
            txt: c.txt,
            cb: () => {
                this.state.limits.leisure--; // 只有做出选择后才扣除次数
                this.closeModal();
                this.showResult(c.res, c.effect);
                this.log("system", `🍵 [摸鱼] ${evt.title} - ${c.txt}`);
                this.updateUI();
            }
        }));

        this.showModal(evt.title, evt.desc, choices);
    },

    actionResearch() {
        this.markAction();
        this.changeStat('health', -10);
        this.changeStat('mood', -5);
        this.state.flags.researchApplied = true;
        this.log("system", "📝 已提交课题申报材料，希望能中！");
        this.updateUI();
    },

    settleResearch() {
        let rate = 0.3 + (this.state.player.iq / 200);
        if (Math.random() < rate && this.state.flags.researchSuccessCount < 5) {
            this.state.flags.researchSuccessCount++;
            this.showResult("课题获批立项！", { money: 200000, rep: 10 });
            this.log("success", "🏆 太棒了！申报的课题获批了，经费大幅增加！");
        } else {
            this.log("danger", "遗憾，本年度课题申报未通过。");
        }
    },

    actionPromote() {
        this.markAction();
        const p = this.state.player;
        const q = this.state.flags.quartersInTitle;
        let success = false, next = "";
        
        if (p.titleIdx === 0 && (q>=4) + (p.iq>=35&&p.eq>=35) + (p.rep>=10) >= 2) { success=true; next="馆员"; }
        else if (p.titleIdx === 1 && q>=8 && p.iq>=50 && p.eq>=50 && p.rep>=30) { success=true; next="副研究馆员"; }
        else if (p.titleIdx === 2 && q>=8 && p.iq>=80 && p.eq>=80 && p.rep>=50) { success=true; next="研究馆员"; }
        
        this.state.flags.promotedThisYear = true;
        if (success) {
            p.titleIdx++;
            this.state.flags.quartersInTitle = 0;
            this.showModal("评审通过", `恭喜晋升为 [${next}]！`, [{txt:"确认",cb:()=>this.closeModal()}]);
        } else {
            this.showResult("评审未通过", { rep: -1 });
        }
        this.updateUI();
    },

    checkSurvival() {
        if(this.state.player.health<=0) this.endGame("过劳死", "身体被掏空...");
        if(this.state.player.mood<=0) this.endGame("抑郁离职", "世界那么大，我想去看看...");
    },

    log(type, msg) {
        const box = document.getElementById('log-container');
        const div = document.createElement('div');
        div.className = `log-entry log-${type}`;
        div.innerText = msg;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    },

    // isNotice: true 表示是通知类弹窗，可点击背景关闭
    showOnboarding() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) overlay.classList.remove('hidden');
    },

    closeOnboarding() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) overlay.classList.add('hidden');
    },

    // 新增：游戏引导弹窗
    showGuide() {
        const title = "📜 入职培训手册";
        const content = `欢迎加入博物馆！作为一名新进策展人，你的目标是不断晋升，最终成为【馆长】。但在这之前，请先活下去：

📊   属性说明
• 智商/情商：决定突发事件的处理效果和科研成功率。
• 声望 🌟：通过策展和论文获得，是晋升的硬指标。
• 经费 💰：没钱寸步难行！每季度会自动发放预算。

⚠️   生存红线 (重要!)
• 精力值 🚑：工作会消耗精力。归零触发【过劳死】。
• 愉悦值 😊：压力会降低心情。归零触发【抑郁离职】。
*提示：快撑不住时，记得去左下角"摸鱼"或"商店"回血！*

🏆   终极目标
在被解聘（3年未晋升）之前，积累资历完成职称评定！`;

        this.showModal(title, content, [{txt:"我准备好了！", cb:()=>this.closeModal()}]);
    },

    showModal(title, text, choices, isNotice = false) {
        this.isModalOpen = true;
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerHTML = text.replace(/\n/g, '<br>');
        const cBox = document.getElementById('modal-choices');
        cBox.innerHTML = "";
        choices.forEach(c => {
            const btn = document.createElement('button');
            btn.className = "choice-btn";
            btn.innerText = c.txt;
            btn.onclick = c.cb;
            cBox.appendChild(btn);
        });
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('hidden');
        
        // 设置是否允许点击背景关闭
        if (isNotice) {
            overlay.setAttribute('onclick', 'game.tryCloseModal(event)');
        } else {
            overlay.removeAttribute('onclick');
        }
    },

    tryCloseModal(e) {
        if (e.target.id === 'modal-overlay') {
            this.closeModal();
        }
    },

    closeModal() { 
        this.isModalOpen = false;
        document.getElementById('modal-overlay').classList.add('hidden'); 
    },
    
    endGame(t, r) { this.showModal(t, r, [{txt:"重新开始", cb:()=>location.reload()}]); }
};
