const UTILS = {
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randArr: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (num, min, max) => Math.min(Math.max(num, min), max),
    formatMoney: (val) => val >= 10000 ? (val/10000).toFixed(2) + "万" : Math.floor(val) + "元",
    getStatName: (k) => k==='money'?'经费':(k==='rep'?'声望':(k==='iq'?'智商':(k==='eq'?'情商':(k==='health'?'健康':(k==='mood'?'愉悦':k)))))
};

const game = {
    state: null,
    history: null,
    isModalOpen: false, // 标记弹窗状态

    startGame() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('app').style.display = 'grid';
        this.init();
        this.showOnboarding();
    },

    init() {
        const edu = ["本科", "硕士", "博士"][Math.floor(Math.random()*3)];
        let baseRep = edu === "硕士" ? 5 : (edu === "博士" ? 10 : 0);

        this.state = {
            player: {
                name: NAME_DB[Math.floor(Math.random()*NAME_DB.length)],
                edu: edu,
                titleIdx: 0,
                health: 100, mood: 100,
                iq: Math.floor(Math.random()*40)+10,
                eq: Math.floor(Math.random()*40)+10,
                rep: baseRep,
                money: 130000
            },
            turn: { year: 1, quarter: 1 },
            limits: { leisure: 4 },
            exhibitions: [],
            flags: {
                quartersInTitle: 0,
                researchApplied: false,
                researchSuccessCount: 0,
                hasAppliedExhibitThisQuarter: false,
                promotedThisYear: false
            }
        };
        
        this.saveState();
        this.log("system", `🎉 欢迎入职！这里是您的工位。新的一年，请多关照！`);
        this.updateUI();
        this.renderExhibitPanel();
    },

    saveState() { this.history = JSON.parse(JSON.stringify(this.state)); },
    undoQuarter() {
        if (!this.history) return;
        this.state = JSON.parse(JSON.stringify(this.history));
        this.log("system", "↺ 时光倒流...回到了季度初，一切重新开始。");
        this.updateUI();
        this.renderExhibitPanel();
    },

    nextQuarter() {
        this.saveState();
        this.changeStat('money', 30000);
        this.log("success", "💰 季度经费已到账 (+30000)，新的预算周期开始了。");

        this.triggerRandomEvent();

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
            this.state.flags.researchApplied = false;
            this.state.flags.promotedThisYear = false;
        }

        if (this.state.turn.year === 4 && this.state.turn.quarter === 1 && this.state.player.titleIdx === 0) {
            this.endGame("解聘通知", "很遗憾，因入职三年未获晋升，您的聘用合同已终止。");
            return;
        }

        this.state.limits.leisure = 4;
        this.state.flags.hasAppliedExhibitThisQuarter = false;

        this.checkSurvival();
        this.log("turn", `📅 Y${this.state.turn.year} - Q${this.state.turn.quarter}`);
        this.updateUI();
        this.renderExhibitPanel();
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

    triggerRandomEvent() {
        if (Math.random() > 0.4) return;
        const evt = RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)];
        const choices = evt.choices.map(c => ({
            txt: c.txt,
            cb: () => {
                this.closeModal();
                c.cb(this);
            }
        }));
        this.showModal(evt.title, evt.desc, choices);
    },

    actionApplyExhibit() {
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
        if (this.state.player.health <= 10) {
            this.showResult("健康预警", "🚑 您的身体状况极差，无法进行高强度工作！请务必先休息。");
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
        
        // 应用子事件效果 (包含动态健康扣除)
        if(effect) {
            for(let k in effect) this.changeStat(k, effect[k]);
        }

        const progress = Math.floor(Math.random()*51) + 50;
        ex.tasks[key] = Math.min(100, ex.tasks[key] + progress);
        
        this.closeModal();
        this.showResult(resText, effect);
        
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
        if (type === 'coffee') {
            if (this.state.player.money < 50) { this.showResult("余额不足", "买不起咖啡了..."); return; }
            let hCost = Math.floor(Math.random()*3)+3; // 3-5
            let mAdd = Math.floor(Math.random()*3)+3;
            this.changeStat('money', -50);
            this.showResult("喝了一杯特浓咖啡", {health: -hCost, mood: mAdd});
            this.log("system", "☕ 喝了杯咖啡，虽然心跳加速，但心情变好了。");
        } else {
            if (this.state.player.money < 100) { this.showResult("余额不足", "吃不起套餐..."); return; }
            let hAdd = Math.floor(Math.random()*6)+3; // 3-8
            let mAdd = Math.floor(Math.random()*6)+3;
            this.changeStat('money', -100);
            this.showResult("享用了文创套餐", {health: hAdd, mood: mAdd});
            this.log("system", "🍱 美食治愈了一切，感觉充满了力量！");
        }
    },

    changeStat(key, val) {
        this.state.player[key] += val;
        if(['health','mood','iq','eq'].includes(key)) this.state.player[key] = UTILS.clamp(this.state.player[key], 0, 100);
        if(key === 'money') this.state.player[key] = Math.max(0, this.state.player[key]);
    },

    updateUI() {
        const p = this.state.player;
        document.getElementById('ui-name').innerText = p.name;
        document.getElementById('ui-edu').innerText = p.edu;
        document.getElementById('ui-title').innerText = TITLES[p.titleIdx].name;
        document.getElementById('ui-iq').innerText = p.iq;
        document.getElementById('ui-eq').innerText = p.eq;
        document.getElementById('ui-rep').innerText = p.rep;
        document.getElementById('ui-money').innerText = UTILS.formatMoney(p.money);
        
        document.getElementById('txt-health').innerText = p.health;
        document.getElementById('bar-health').style.width = p.health+"%";
        document.getElementById('txt-mood').innerText = p.mood;
        document.getElementById('bar-mood').style.width = p.mood+"%";
        
        document.getElementById('limit-leisure').innerText = `${this.state.limits.leisure}/4`;
        document.getElementById('ui-year').innerText = this.state.turn.year;
        document.getElementById('ui-quarter').innerText = this.state.turn.quarter;

        document.getElementById('btn-promote').disabled = !(this.state.turn.quarter === 4 && !this.state.flags.promotedThisYear && p.titleIdx < 4);
        
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
                let html = `<div style="font-weight:bold;margin-bottom:10px; color:var(--primary)">${ex.name}</div><div class="task-grid">`;
                for(let k in EX_TASKS) {
                    const done = ex.tasks[k] >= 100;
                    html += `<button class="task-btn ${done?'done':''}" onclick="game.actionExhibitTask(${ex.id},'${k}')" ${done?'disabled':''}><span>${EX_TASKS[k].name}</span>${done?'✔':''}</button>`;
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

    actionLeisure(type) {
        if(this.state.limits.leisure <= 0) { this.log("danger", "没时间摸鱼了"); return; }
        this.state.limits.leisure--;
        
        if(type==='slack') { this.showResult("闭目养神", {health:5, mood:5}); this.log("system", "😴 闭目养神了一会儿。"); }
        else if(type==='read') { this.showResult("阅读了一本书", {iq:3, mood:2}); this.log("system", "📚 读了一本好书。"); }
        else { this.showResult("听到了八卦", {eq:3}); this.log("system", "💬 听到了一些传闻。"); }
    },

    actionResearch() {
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

📊 **属性说明**
• 智商/情商：决定突发事件的处理效果和科研成功率。
• 声望 🌟：通过策展和论文获得，是晋升的硬指标。
• 经费 💰：没钱寸步难行！每季度会自动发放预算。

⚠️ **生存红线 (重要!)**
• 健康值 🚑：工作会消耗健康。归零触发【过劳死】。
• 愉悦值 😊：压力会降低心情。归零触发【抑郁离职】。
*提示：快撑不住时，记得去左下角"摸鱼"或"商店"回血！*

🏆 **终极目标**
在被解聘（3年未晋升）之前，积累资历完成职称评定！`;

        this.showModal(title, content, [{txt:"我准备好了！", cb:()=>this.closeModal()}]);
    },

    showModal(title, text, choices, isNotice = false) {
        this.isModalOpen = true;
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerText = text;
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
