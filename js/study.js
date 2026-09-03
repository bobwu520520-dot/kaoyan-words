(function(){
  'use strict';
  const KEY='kaoyan_study_v3';
  let state={progress:{},tier:'核心高频',daily:100,today:localDay(),todaySeen:{}};
  try{state=Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
  // ---- 损坏数据容错:字段类型不对就重置,保证页面不崩溃 ----
  if(typeof state.progress!=='object'||state.progress===null||Array.isArray(state.progress))state.progress={};
  if(typeof state.todaySeen!=='object'||state.todaySeen===null||Array.isArray(state.todaySeen))state.todaySeen={};
  if(typeof state.todayDone!=='number'||!isFinite(state.todayDone))state.todayDone=0;
  if(typeof state.hardCount!=='object'||state.hardCount===null||Array.isArray(state.hardCount))state.hardCount={};
  if(typeof state.history!=='object'||state.history===null||Array.isArray(state.history))state.history={};
  // ---- 跨天重置(使用设备本地日期);先记录前一天完成数 ----
  if(state.today!==localDay()){if(state.todayDone>0)state.history[state.today]=state.todayDone;state.today=localDay();state.todayDone=0;state.todaySeen={};}
  const TIER_LIST=['核心高频','高频重点','重点扩展','普通扩展'];
  if(!TIER_LIST.includes(state.tier))state.tier='核心高频';
  let words=[],queue=[],idx=0,shown=false,loading=false,activeStudyMode='standard';
  let isCommuteMode = localStorage.getItem('kao_commute_mode') === 'true';
  const $=id=>document.getElementById(id);
  function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  // ---- 在线补全结果持久化(避免每次会话重复联网取同一批词) ----
  const RT_KEY='kaoyan_runtime_v1', RT_MAX=1500;
  let rtCache={data:{},order:[]};
  try{rtCache=Object.assign(rtCache,JSON.parse(localStorage.getItem(RT_KEY)||'{}'));}catch(e){}
  function saveRt(){while(rtCache.order.length>RT_MAX){delete rtCache.data[rtCache.order.shift()];}try{localStorage.setItem(RT_KEY,JSON.stringify(rtCache));}catch(e){}}
  function mergeRt(word,fields){if(!fields||!Object.keys(fields).length)return;rtCache.data[word]=fields;if(rtCache.order.indexOf(word)<0)rtCache.order.push(word);saveRt();}

  const tiers=[
    ['核心高频','真题高优先级，必须熟练'],
    ['高频重点','阅读、完形、翻译重点'],
    ['重点扩展','学术、社会、科技等'],
    ['普通扩展','低频与补全词，后期查漏补缺']
  ];
  const urlParams = new URLSearchParams(window.location ? window.location.search : '');

  // ---- 内置 AI 例句（离线可用，与查词页共用同一份数据） ----
  const AI_EX={};
  if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) {
    Object.keys(window.__AI_EXAMPLES__.s).forEach(k => {
      AI_EX[k] = { en: window.__AI_EXAMPLES__.s[k][0], zh: window.__AI_EXAMPLES__.s[k][1] };
    });
  } else {
    fetch('data/ai_examples.json').then(r=>r.ok?r.json():null).then(d=>{if(!d)return;Object.keys(d.s||{}).forEach(k=>{AI_EX[k]={en:d.s[k][0],zh:d.s[k][1]};});if(queue.length)renderCard();}).catch(()=>{});
  }

  function initStudyWords() {
    function processWordsData(d) {
      words = (d.words || []).filter(w => w.active !== false);
      window.__ALL_WORDS__ = words;
      words.forEach(w => {
        const c = rtCache.data[w.word];
        if (c) Object.assign(w, c);
      });
      const DATA_VER = (d.data_version || '1') + '-' + words.length;
      const savedVer = localStorage.getItem('kaoyan_data_version');
      let staleCleaned = 0;
      if (savedVer && savedVer !== DATA_VER) {
        const valid = new Set(words.map(w => w.word));
        Object.keys(state.progress).forEach(k => { if (!valid.has(k)) { delete state.progress[k]; staleCleaned++; } });
        Object.keys(state.hardCount).forEach(k => { if (!valid.has(k)) delete state.hardCount[k]; });
        Object.keys(state.history).forEach(k => { if (k.length !== 10) delete state.history[k]; });
        save();
      }
      try { localStorage.setItem('kaoyan_data_version', DATA_VER); } catch(e){}
      const cut = new Date(); cut.setDate(cut.getDate() - 90);
      Object.keys(state.history).forEach(k => { if (k < cut.toISOString().slice(0, 10)) delete state.history[k]; });
      if (staleCleaned > 0) {
        const el = $('upgrade-notice');
        if (el) { el.hidden = false; el.textContent = '词库已更新：已清理 ' + staleCleaned + ' 个已删除词的旧进度'; setTimeout(() => { el.hidden = true; }, 6000); }
      }
      renderPlans();
      buildQueue();
      renderStats();
      renderCard();
    }

    if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words && window.__WORDS_DATA__.words.length > 0) {
      processWordsData(window.__WORDS_DATA__);
      return;
    }

    fetch('data/words.json').then(r => {
      if (!r.ok && r.status !== 0) throw new Error('load failed');
      return r.json();
    }).then(processWordsData).catch(err => {
      if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
        processWordsData(window.__WORDS_DATA__);
      } else {
        $('card').innerHTML = '<div class="empty"><h2>词库加载失败</h2><p>请点击下方重试或刷新页面。</p><button class="btn primary" id="retry-words-load" type="button" style="margin-top:12px;padding:8px 18px;border-radius:8px;background:var(--color-primary);color:#fff;border:none;cursor:pointer">重新加载词库 ↻</button></div>';
        const rb = $('retry-words-load');
        if (rb) rb.onclick = () => initStudyWords();
      }
    });
  }

  function renderPlans(){ const tn0=$('tier-name'); if(tn0)tn0.textContent=state.tier;
    $('plans').innerHTML=tiers.map(([t,p])=>{
      const all=words.filter(w=>w.tier===t),eligible=all.filter(w=>w.studyEligible!==false).length,done=all.filter(w=>state.progress[w.word]?.level>=4).length,pc=all.length?Math.round(done/all.length*100):0;
      return `<div class="plan ${state.tier===t?'active':''}" data-tier="${esc(t)}"><h5>${esc(t)}</h5><p>${all.length} 个词 · 已掌握 ${done}</p><p class="small">本地释义完整</p><div class="progress"><i style="width:${pc}%"></i></div></div>`;
    }).join('');
    document.querySelectorAll('.plan').forEach(x=>x.onclick=()=>{state.tier=x.dataset.tier;save();renderPlans();buildQueue();renderCard();}); const tn=$('tier-name'); if(tn)tn.textContent=state.tier;
  }
  const GRADE_DAYS=[0,1,3,7];
  const GRADE_MIN=10*60*1000;
  function gradeInterval(g,s){if(g<2)return 0;return Math.min(30,GRADE_DAYS[g]*Math.pow(1.6,Math.max(0,s-1)));}
  function isWeak(w){const p=state.progress[w.word];return p&&(p.wrong>=2||(p.level<2&&p.success<1));}

  function maskTargetWord(sentence, word) {
    if (!sentence) return '';
    const stem = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const alt = /e$/.test(word) ? '|' + word.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*' : '';
    return esc(sentence).replace(new RegExp('\\b(' + stem + '\\w*' + alt + ')', 'gi'), '<strong style="color:var(--color-primary);text-decoration:underline">[ ______ ]</strong>');
  }

  function buildQueue(){
    var qWord = urlParams.get('w') || urlParams.get('word');
    var qMode = urlParams.get('mode');
    var qTier = urlParams.get('tier');
    if (qTier && tiers.some(t => t[0] === qTier)) {
      state.tier = qTier;
    }
    if (qMode) activeStudyMode = qMode;

    document.querySelectorAll('.study-mode-chip[data-study-mode]').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-study-mode') === activeStudyMode);
    });

    var commuteBtn = document.getElementById('commute-mode-toggle');
    if (commuteBtn) {
      commuteBtn.classList.toggle('active', isCommuteMode);
      commuteBtn.onclick = function () {
        isCommuteMode = !isCommuteMode;
        localStorage.setItem('kao_commute_mode', isCommuteMode ? 'true' : 'false');
        commuteBtn.classList.toggle('active', isCommuteMode);
        if (window.KaoyanToast) window.KaoyanToast(isCommuteMode ? '🚇 已开启地铁单手大键盲刷模式' : '📘 已切换回标准4级评分模式');
        renderCard();
      };
    }

    var now = Date.now();
    var need = Math.min(Number(state.daily)||100,100);

    if (activeStudyMode === 'weak') {
      var allWeak = words.filter(w => isWeak(w));
      if (allWeak.length) {
        queue = shuffle(allWeak).slice(0, 100);
        idx = 0; shown = false; renderQueue();
        if (window.KaoyanToast) window.KaoyanToast('🎯 专项攻克薄弱词模式（共 ' + queue.length + ' 词）');
        return;
      } else {
        if (window.KaoyanToast) window.KaoyanToast('暂无薄弱词，已切换为标准模式');
        activeStudyMode = 'standard';
        document.querySelectorAll('.study-mode-chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-study-mode') === 'standard'); });
      }
    } else if (activeStudyMode === 'review') {
      var allDue = words.filter(w => isDue(w, now));
      if (allDue.length) {
        queue = shuffle(allDue).slice(0, 100);
        idx = 0; shown = false; renderQueue();
        if (window.KaoyanToast) window.KaoyanToast('⏰ 艾宾浩斯到期复习模式（共 ' + queue.length + ' 词）');
        return;
      } else {
        if (window.KaoyanToast) window.KaoyanToast('暂无到期复习词，已切换为标准模式');
        activeStudyMode = 'standard';
        document.querySelectorAll('.study-mode-chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-study-mode') === 'standard'); });
      }
    } else if (activeStudyMode === 'fav') {
      var allFav = words.filter(w => window.KaoyanQuiz && KaoyanQuiz.isFav(w.word));
      if (allFav.length) {
        queue = shuffle(allFav).slice(0, 100);
        idx = 0; shown = false; renderQueue();
        if (window.KaoyanToast) window.KaoyanToast('⭐ 生词本专练模式（共 ' + queue.length + ' 词）');
        return;
      } else {
        if (window.KaoyanToast) window.KaoyanToast('⭐ 生词本暂无单词，请先在背词时点击星号收藏');
        activeStudyMode = 'standard';
        document.querySelectorAll('.study-mode-chip').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-study-mode') === 'standard'); });
      }
    }

    var pool = words.filter(w=>w.tier===state.tier);
    const due=pool.filter(w=>isDue(w,now));
    const weak=pool.filter(w=>!isDue(w,now)&&isWeak(w));
    const unseen=pool.filter(w=>!state.progress[w.word]||state.progress[w.word].level<1);
    const picked=new Set();
    const selected=[];

    if (qWord) {
      var matchedW = words.find(w => w.word.toLowerCase() === qWord.toLowerCase());
      if (matchedW) {
        selected.push(matchedW);
        picked.add(matchedW.word);
      }
    }

    for(const list of [due,weak,unseen]){
      if(selected.length>=need)break;
      for(const w of shuffle(list)){
        if(selected.length>=need)break;
        if(picked.has(w.word))continue;
        selected.push(w);picked.add(w.word);
      }
    }
    if(selected.length<need){for(const w of shuffle(pool)){if(selected.length>=need)break;if(picked.has(w.word))continue;selected.push(w);picked.add(w.word);}}
    if(!selected.length && words.length){
      selected = shuffle(pool.length ? pool : words).slice(0, need);
    }
    queue=selected.slice(0,100);idx=0;shown=false;renderQueue();
  }
  function isDue(w,now){const n=state.progress[w.word]?.next;return typeof n==='number'&&n<=now;}
  function renderQueue(){const q=$('queue');if(!q)return;q.innerHTML=queue.map((w,i)=>`<button class="qdot ${i===idx?'current':''} ${state.progress[w.word]?.level>=4?'done':''}" data-i="${i}">${i+1}</button>`).join('');q.querySelectorAll('button').forEach(b=>b.onclick=()=>{idx=+b.dataset.i;shown=false;renderQueue();renderCard();});}
  function renderStats(){
    const mastered=words.filter(w=>state.progress[w.word]?.level>=4).length;
    const due=words.filter(w=>state.progress[w.word]?.next&&state.progress[w.word].next<=Date.now()).length;
    $('today').textContent=state.todayDone;$('mastered').textContent=mastered;$('due').textContent=due;$('remain').textContent=Math.max(0,words.length-mastered);$('daily').value=state.daily;
    // 顶部今日进度条
    const pctEl=$('today-pct'),barEl=$('today-bar');
    if(pctEl)pctEl.textContent=state.todayDone+'/'+state.daily;
    if(barEl)barEl.style.width=Math.min(100,Math.round(state.todayDone/(state.daily||100)*100))+'%';
    const weakN=words.filter(w=>isWeak(w)&&(state.progress[w.word]?.level||0)<4).length;
    if($('weak'))$('weak').textContent=weakN;
    updateCountdown();
    renderDailyQuote();
    renderStreak();
  }
  const DAILY_QUOTES = [
    { en: "Rome was not built in a day, but they were laying bricks every hour.", zh: "罗马非一日建成，但每一小时都在砌砖。" },
    { en: "Success consists of going from failure to failure without loss of enthusiasm.", zh: "成功就是历经一次次失败却未失热情。" },
    { en: "The secret of getting ahead is getting started.", zh: "超越别人的秘密，就是立刻开始行动。" },
    { en: "Do not go gentle into that good night; Rage, rage against the dying of the light.", zh: "绝不温顺地走入那良夜，咆哮着面对光的消逝。" },
    { en: "The future belongs to those who believe in the beauty of their dreams.", zh: "未来属于坚信梦想之美的人。" },
    { en: "Stay hungry, stay foolish; persistence conquers all.", zh: "求知若饥，虚心若愚；唯坚持征服一切。" },
    { en: "What doesn't kill you makes you stronger.", zh: "凡杀不死你的，必将使你更强大。" }
  ];
  function renderDailyQuote(){
    const el=$('daily-quote-card');if(!el)return;
    const now=new Date();const startOfYear=new Date(now.getFullYear(),0,1);
    const dayOfYear=Math.floor((now-startOfYear)/86400000);
    const q=DAILY_QUOTES[dayOfYear%DAILY_QUOTES.length];
    el.innerHTML=`<div class="daily-quote-icon">✨</div><div class="daily-quote-content"><div class="daily-quote-en">${esc(q.en)}</div><div class="daily-quote-zh">${esc(q.zh)}</div></div>`;
  }
  function updateCountdown(){
    const el=$('exam-countdown');if(!el)return;
    const now=new Date();let y=now.getFullYear();let target=new Date(y,11,20);
    if(now.getTime()>target.getTime())target=new Date(y+1,11,20);
    const d=Math.max(1,Math.ceil((target.getTime()-now.getTime())/86400000));
    el.textContent=`🎯 距初试 ${d} 天`;
  }
  // ---- 学习统计:连续打卡 + 近14天柱状图 ----
  function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function calcStreak(){
    const hist=state.history||{};let s=0;
    if(state.todayDone>0||(hist[localDay()]||0)>0){
      s=1;const c=new Date();
      while(true){c.setDate(c.getDate()-1);if((hist[fmtD(c)]||0)>0)s++;else break;}
    }else{
      const y=new Date();y.setDate(y.getDate()-1);
      if((hist[fmtD(y)]||0)>0){s=1;const c=new Date();c.setDate(c.getDate()-2);
        while(true){if((hist[fmtD(c)]||0)>0){s++;c.setDate(c.getDate()-1);}else break;}}
    }
    return s;
  }
  function renderStreak(){
    const box=$('stats-box');if(!box)return;
    const hist=state.history||{};
    const hasData=Object.keys(hist).length>0||state.todayDone>0;
    box.hidden=!hasData;
    if(!hasData)return;
    $('streak-days').textContent=calcStreak();
    const bars=$('daily-bars');if(!bars)return;
    const days=[];
    for(let i=13;i>=0;i--){const c=new Date();c.setDate(c.getDate()-i);days.push({k:fmtD(c),isToday:i===0});}
    const vals=days.map(d=>d.isToday?state.todayDone:(hist[d.k]||0));
    const max=Math.max(1,...vals);
    bars.innerHTML=days.map((d,i)=>`<div class="bar ${d.isToday?'today':''}" style="height:${Math.max(3,Math.round(vals[i]/max*100))}%" data-tip="${d.k}：${vals[i]} 词"></div>`).join('');
  }
  // 显示释义统一入口：点卡片空白 / Space
  function reveal() {
    if (shown || !queue[idx]) return;
    shown = true; renderCard();
    const w0 = queue[idx];
    const mm = w0.exam_meaning || w0.translation;
    if (!mm) lookupMeaning(w0);
    if (window.kaoAutoRead && window.kaoAutoRead()) {
      try { const u = new SpeechSynthesisUtterance(w0.word); u.lang = 'en-US'; u.rate = .92; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (err) {}
    }
  }
  // 点击卡片任意空白处 = 显示释义；支持手机端流畅滑动手势与弹性物理微动效
  const cardBox = document.querySelector('.s-card');
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isDragging = false, lastTapTime = 0;
  if (cardBox) {
    cardBox.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isDragging = true;
      }
    }, { passive: true });

    cardBox.addEventListener('touchmove', function (e) {
      if (!isDragging || !e.touches || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
        const inner = cardBox.querySelector('.s-card-inner');
        if (inner) {
          inner.style.transition = 'none';
          inner.style.transform = `translateX(${dx * 0.35}px) rotate(${dx * 0.015}deg)`;
          inner.style.opacity = Math.max(0.4, 1 - Math.abs(dx) / 450);
        }
      }
    }, { passive: true });

    cardBox.addEventListener('touchend', function (e) {
      isDragging = false;
      const inner = cardBox.querySelector('.s-card-inner');
      if (e.changedTouches && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;

        // Double tap detection on top word area
        if (e.target.closest('.s-card-fixed-top, .wordtop')) {
          const now = Date.now();
          if (now - lastTapTime < 320) {
            const w = queue[idx];
            if (w && w.word) playTts(w.word);
          }
          lastTapTime = now;
        }

        if (Math.abs(dx) > 55 && Math.abs(dy) < 95 && dt < 450) {
          if (inner) {
            inner.style.transition = 'transform 0.18s ease-out, opacity 0.18s ease-out';
            inner.style.transform = `translateX(${dx < 0 ? '-100%' : '100%'})`;
            inner.style.opacity = '0';
          }
          setTimeout(() => {
            if (dx < -55) {
              // 左滑: 翻转释义或切换到下一个
              if (!shown) {
                reveal();
              } else {
                idx = Math.min(queue.length - 1, idx + 1);
                shown = false;
                renderQueue();
                renderCard();
              }
            } else if (dx > 55) {
              // 右滑: 返回上一个
              idx = Math.max(0, idx - 1);
              shown = false;
              renderQueue();
              renderCard();
            }
          }, 120);
          return;
        } else if (Math.abs(dy) > 60 && Math.abs(dx) < 80 && dt < 450) {
          if (dy < -60) {
            // 上滑: 显示释义
            if (!shown) reveal();
          } else if (dy > 60) {
            // 下滑: 快速评分认识 / 翻转
            if (shown) rate(2);
            else reveal();
          }
        }
      }
      if (inner) {
        inner.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.15), opacity 0.22s ease';
        inner.style.transform = 'none';
        inner.style.opacity = '1';
      }
    }, { passive: true });

    // 双指捏合调整字号 (Pinch-to-zoom typography)
    let pinchDist = 0;
    cardBox.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 2) {
        pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    cardBox.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length === 2 && pinchDist > 0) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        const ratio = d / pinchDist;
        if (Math.abs(ratio - 1) > 0.15) {
          let fs = parseFloat(localStorage.getItem('kao_fs') || '1');
          fs = Math.max(0.85, Math.min(1.35, fs * (ratio > 1 ? 1.05 : 0.95)));
          document.documentElement.style.setProperty('--fs', fs.toFixed(2));
          localStorage.setItem('kao_fs', fs.toFixed(2));
          pinchDist = d;
        }
      }
    }, { passive: true });

    cardBox.addEventListener('click', function (e) {
      if (e.target.closest('button, a, input, label, select')) return;
      reveal();
    });
  }
  // 例句目标词高亮（与查词页同一套规则）
  function hlSentence(en,word){
    const stem=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const alt=/e$/.test(word)?'|'+word.slice(0,-1).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\w*':'';
    return esc(en).replace(new RegExp('\\b('+stem+'\\w*'+alt+')','gi'),'<span class="word-hl">$1</span>');
  }
  // 评分按钮只在释义显示后可用；未显示时提示先看释义，杜绝"盲评跳词"
  function syncRating(){
    const hint=$('rating-hint'); if(hint)hint.textContent=shown?'点击评分，自动进入下一个词':'先显示释义，再评分';
    ['grade0','grade1','grade2','grade3'].forEach(id=>{const b=$(id);if(b)b.disabled=!shown;});
  }
  function isAutoSpeakOn() { return localStorage.getItem('kao_auto_speak') === 'true'; }

  function renderCard(){
    const w=queue[idx];
    if(!w){
      if(window.KaoyanAudio) window.KaoyanAudio.playComplete();
      $('card').innerHTML=`
        <div class="empty" style="padding:28px 16px;text-align:center">
          <div style="font-size:46px;margin-bottom:8px">🎉</div>
          <h2 style="font-size:20px;font-weight:700;color:var(--color-primary);margin:0 0 6px">本组 100 词学习达成！</h2>
          <p style="font-size:13.5px;color:var(--color-text-muted);margin:0 0 18px">今日已累计完成 ${state.todayDone || 0} 词 · 研途漫漫，日拱一卒</p>
          <div style="display:flex;flex-direction:column;gap:10px;max-width:280px;margin:0 auto">
            <button class="btn primary" id="next-group" type="button" style="padding:12px;font-size:15px;font-weight:600;border-radius:10px">🚀 继续下一组新词 (100 词)</button>
            <button class="btn" id="replay-group" type="button" style="padding:10px;font-size:14px;border-radius:10px">🔄 重新巩固本组 100 词</button>
            <button class="btn" id="weak-group" type="button" style="padding:10px;font-size:14px;border-radius:10px;color:var(--color-accent);border-color:var(--color-accent)">⚡ 专项攻克薄弱词</button>
          </div>
        </div>
      `;
      if($('next-group'))$('next-group').onclick=()=>{buildQueue();renderCard();};
      if($('replay-group'))$('replay-group').onclick=()=>{idx=0;shown=false;renderQueue();renderCard();};
      if($('weak-group'))$('weak-group').onclick=()=>{activeStudyMode='weak';buildQueue();renderCard();};
      return;
    }
    const meaning = w.exam_meaning || w.translation || '';
    const ai = AI_EX[w.word];
    const ex = (ai && ai.en) || w.example_en || '';
    const exZh = (ai && ai.zh) || w.example_zh || '';
    const rawPos = (w.pos || (meaning.match(/^([a-z]+\.)/i) ? meaning.match(/^([a-z]+\.)/i)[1] : '') || '动').replace('.', '');
    const cleanMeaning = meaning.replace(/^[a-z]+\.\s*/i, '');

    $('card').classList.toggle('revealed', shown);

    const autoSpeakActive = isAutoSpeakOn();
    const voicePillsHtml = `<button class="bb-tool-icon ${autoSpeakActive?'active':''}" id="autospeak-toggle-btn" type="button" title="点击开关切词自动发音">${autoSpeakActive ? '🔊' : '🔇'}</button>`;

    if (autoSpeakActive && !shown && w && w.word) {
      setTimeout(function() {
        if (!shown && queue[idx] === w) {
          playTts(w.word);
        }
      }, 80);
    }

    function getStudyTimeStr() {
      if (!window._kaoyanStudyStartTime) window._kaoyanStudyStartTime = Date.now();
      var elapsed = Math.floor((Date.now() - window._kaoyanStudyStartTime) / 1000);
      var mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      var secs = String(elapsed % 60).padStart(2, '0');
      return mins + ':' + secs;
    }

    if (!shown) {
      // 墨墨/不背单词风格 State 1：未展开回忆页面
      $('card').innerHTML = `
        <div class="bb-container unrevealed" id="show">
          <!-- 顶部状态栏 -->
          <div class="bb-top-bar">
            <span class="bb-timer" id="bb-timer-display">${getStudyTimeStr()}</span>
            <div class="bb-top-tools">
              ${voicePillsHtml}
              ${window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : ''}
              <button class="bb-tool-icon" id="drawer-btn-inline" type="button" title="⚙️ 学习偏好与模式设置">⚙</button>
            </div>
          </div>

          <!-- 单词与发音 -->
          <div class="bb-word-header">
            <div class="bb-word">${esc(w.word)}</div>
            <div class="bb-phonetic-row">
              <span class="bb-phonetic-tag">英</span>
              <span class="bb-phonetic-text">${esc(w.phonetic || '')}</span>
              <button class="bb-audio-inline-btn" data-speak="${esc(w.word)}" type="button" aria-label="朗读单词">🔊</button>
            </div>
          </div>

          <!-- 居中回忆提示区 -->
          <div class="bb-recall-prompt">
            <div class="bb-recall-title">请回忆单词发音和释义</div>
            <div class="bb-recall-sub">点击屏幕显示答案</div>
          </div>

          <!-- 悬浮播放按钮 -->
          <button class="bb-floating-audio-btn" data-speak="${esc(w.word)}" type="button" title="朗读单词">
            <span class="bb-audio-wave">🔊</span>
          </button>
        </div>
      `;

      if ($('show')) $('show').onclick = () => reveal();
      if ($('drawer-btn-inline')) $('drawer-btn-inline').onclick = (e) => { e.stopPropagation(); $('drawer').hidden = false; };
      bindVoicePills();
      return;
    }

    // 墨墨/不背单词风格 State 2：展开答案与例句助记页面
    const pInfo = state.progress[w.word] || { level: 0 };
    const nextIntervalDays = pInfo.level >= 4 ? '81 天后' : pInfo.level >= 2 ? '15 天后' : (pInfo.level >= 1 ? '5 天后' : '3 天后');

    $('card').innerHTML = `
      <div class="bb-container">
        <!-- 顶部状态栏 -->
        <div class="bb-top-bar">
          <span class="bb-timer" id="bb-timer-display">${getStudyTimeStr()}</span>
          <div class="bb-top-tools">
            ${voicePillsHtml}
            ${window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : ''}
            <button class="bb-tool-icon" id="drawer-btn-inline" type="button" title="⚙️ 学习偏好与模式设置">⚙</button>
          </div>
        </div>

        <!-- 单词与发音 -->
        <div class="bb-word-header">
          <div class="bb-word">${esc(w.word)}</div>
          <div class="bb-phonetic-row">
            <span class="bb-phonetic-tag">英</span>
            <span class="bb-phonetic-text">${esc(w.phonetic || '')}</span>
            <button class="bb-audio-inline-btn" data-speak="${esc(w.word)}" type="button" aria-label="朗读单词">🔊</button>
          </div>
        </div>

        <!-- 答案内容可滑动区 -->
        <div class="bb-answer-content">
          <!-- 释义栏 -->
          <div class="bb-meaning-box">
            <span class="bb-pos-tag">${esc(rawPos)}</span>
            <span class="bb-meaning-text">${esc(cleanMeaning || meaning || '暂无释义')}</span>
            <button class="bb-meaning-opt-btn" id="lookup" type="button" title="查详细词典">🎛️</button>
          </div>

          <!-- 例句板块 -->
          <div class="bb-section-box">
            <div class="bb-section-head">
              <span class="bb-section-title">例句</span>
              <div class="bb-section-actions">
                <button class="bb-mini-btn" data-speak="${esc(ex)}" type="button" title="朗读例句">🔊</button>
                <button class="bb-mini-btn" data-copy="${esc(ex + '\n' + exZh)}" type="button" title="复制例句">📋</button>
              </div>
            </div>
            <div class="bb-example-list">
              ${ex ? `
                <div class="bb-example-item">
                  <div class="bb-example-en">${hlSentence(ex, w.word)}</div>
                  <div class="bb-example-zh">${esc(exZh || '')}</div>
                </div>
              ` : '<div style="font-size:12px;color:var(--color-text-muted)">暂无真题例句</div>'}
              ${w.collocation_hint ? `
                <div class="bb-example-item" style="margin-top:6px;border-top:1px dashed var(--color-border);padding-top:4px">
                  <div class="bb-example-en"><strong style="color:var(--color-primary)">to ${esc(w.word)}</strong> ${esc(w.collocation_hint)}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 考点搭配与短语板块 (KyleBing 词库强力赋能) -->
          ${w.phrases && w.phrases.length > 0 ? `
            <div class="bb-section-box bb-phrases-box">
              <div class="bb-section-head">
                <span class="bb-section-title">考点搭配 / 常用短语</span>
                <span class="bb-section-tag" style="background:color-mix(in oklab, #0284c7 12%, transparent);color:#0284c7;border-color:color-mix(in oklab, #0284c7 25%, transparent)">高频搭配</span>
              </div>
              <div class="bb-phrase-list">
                ${w.phrases.map(function (p) {
                  return `
                    <div class="bb-phrase-item">
                      <div class="bb-phrase-row">
                        <span class="bb-phrase-text" data-speak="${esc(p.p)}" title="点击朗读短语">${esc(p.p)} <span class="bb-phrase-speaker">🔊</span></span>
                      </div>
                      <div class="bb-phrase-cn">${esc(p.c)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- 助记板块 -->
          <div class="bb-section-box bb-mnemonic-box">
            <div class="bb-section-head">
              <span class="bb-section-title">助记</span>
              <span class="bb-section-tag">词根词缀</span>
            </div>
            <div class="bb-mnemonic-content">
              <div class="bb-root-text">${esc(w.roots || w.root || (w.word + ' 考研大纲高频核心词汇'))}</div>
              ${w.confused ? `<div class="bb-confused-row" style="margin-top:4px"><span class="bb-sub-tag">形近/易混：</span>${esc(w.confused)}</div>` : ''}
              ${w.synonyms ? `<div class="bb-syn-row" style="margin-top:4px"><span class="bb-sub-tag">同义替换：</span>${esc(w.synonyms)}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- 3 按钮操作栏 (认识、模糊、忘记) -->
        <div class="bb-rating-bar">
          <button class="bb-rate-btn bb-rate-known" id="grade3" type="button">
            <span class="bb-rate-label">认识</span>
            <span class="bb-rate-sub">${nextIntervalDays}</span>
          </button>
          <button class="bb-rate-btn bb-rate-fuzzy" id="grade1" type="button">
            <span class="bb-rate-label">模糊</span>
            <span class="bb-rate-sub">今日 / 5 天后</span>
          </button>
          <button class="bb-rate-btn bb-rate-forgot" id="grade0" type="button">
            <span class="bb-rate-label">忘记</span>
            <span class="bb-rate-sub">今日 / 3 天后</span>
          </button>
        </div>
      </div>
    `;

    if ($('drawer-btn-inline')) $('drawer-btn-inline').onclick = (e) => { e.stopPropagation(); $('drawer').hidden = false; };
    if ($('lookup')) $('lookup').onclick = () => lookupMeaning(w);
    if ($('grade0')) $('grade0').onclick = () => rate(0);
    if ($('grade1')) $('grade1').onclick = () => rate(1);
    if ($('grade3')) $('grade3').onclick = () => rate(3);
    bindVoicePills();
    if($('next-card-btn'))$('next-card-btn').onclick=()=>{idx=Math.min(queue.length-1,idx+1);shown=false;renderQueue();renderCard();};
  }

  function bindVoicePills() {
    const accBtn = $('accent-toggle-btn');
    if (accBtn) {
      accBtn.onclick = (e) => {
        e.stopPropagation();
        const nextLang = getTtsLang() === 'en-GB' ? 'en-US' : 'en-GB';
        localStorage.setItem('kao_ttslang', nextLang);
        accBtn.textContent = nextLang === 'en-GB' ? '🇬🇧 英' : '🇺🇸 美';
        if (window.KaoyanToast) window.KaoyanToast('已切换发音口音：' + (nextLang === 'en-GB' ? '🇬🇧 英音' : '🇺🇸 美音'));
      };
    }
    const spdBtn = $('speed-toggle-btn');
    if (spdBtn) {
      spdBtn.onclick = (e) => {
        e.stopPropagation();
        const nextSpd = getTtsRate() < 0.9 ? '0.95' : '0.80';
        localStorage.setItem('kao_ttsrate', nextSpd);
        spdBtn.textContent = parseFloat(nextSpd) < 0.9 ? '🐢 0.8x' : '⚡ 1.0x';
        if (window.KaoyanToast) window.KaoyanToast('已切换朗读语速：' + (parseFloat(nextSpd) < 0.9 ? '🐢 0.8x 慢速拆解' : '⚡ 常速'));
      };
    }
    const autoBtn = $('autospeak-toggle-btn');
    if (autoBtn) {
      autoBtn.onclick = (e) => {
        e.stopPropagation();
        const cur = isAutoSpeakOn();
        localStorage.setItem('kao_auto_speak', cur ? 'false' : 'true');
        autoBtn.textContent = !cur ? '🔊' : '🔇';
        autoBtn.title = !cur ? '切词自动朗读已开（点击关闭）' : '切词自动朗读已关（点击开启）';
        autoBtn.classList.toggle('active', !cur);
        if (window.KaoyanToast) window.KaoyanToast(!cur ? '🔊 已开启切词自动发音' : '🔇 已关闭切词自动发音');
        if (!cur && queue[idx] && queue[idx].word) playTts(queue[idx].word);
      };
    }
  }

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-preview-syn]');
    if (!btn) return;
    const syn = btn.getAttribute('data-preview-syn');
    if (syn) showSynonymPreview(syn);
  });

  // 📱 手机端左右滑动手势切词与双击朗读 (Swipe Left = 模糊, Swipe Right = 认识, Double-tap = 朗读)
  (function initCardTouchGestures() {
    var cardEl = document.getElementById('card');
    if (!cardEl) return;
    var startX = 0, startY = 0, startTime = 0, lastTapTime = 0;

    cardEl.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, { passive: true });

    cardEl.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        var dt = Date.now() - startTime;

        // Double tap detection
        var now = Date.now();
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 250) {
          if (now - lastTapTime < 320) {
            var w = queue[idx];
            if (w && w.word && window.speechSynthesis) {
              window.speechSynthesis.cancel();
              var u = new SpeechSynthesisUtterance(w.word);
              u.lang = 'en-US';
              window.speechSynthesis.speak(u);
            }
          }
          lastTapTime = now;
          return;
        }

        // Horizontal Swipe
        if (Math.abs(dx) > 60 && Math.abs(dy) < 70 && dt < 450) {
          if (dx < 0) {
            if (window.KaoyanToast) window.KaoyanToast('👈 滑动：不认识 / 模糊');
            rate(0);
          } else {
            if (window.KaoyanToast) window.KaoyanToast('👉 滑动：认识 / 掌握 ✓');
            rate(2);
          }
          if (navigator.vibrate) try { navigator.vibrate(15); } catch(err){}
        }
      }
    }, { passive: true });

    // 📱 手机端摇一摇随机抽高频词 (Device Motion Shake)
    var lastShake = 0;
    window.addEventListener('devicemotion', function (e) {
      var acc = e.accelerationIncludingGravity;
      if (!acc) return;
      var speed = Math.abs((acc.x || 0) + (acc.y || 0) + (acc.z || 0));
      if (speed > 26 && Date.now() - lastShake > 1500) {
        lastShake = Date.now();
        var pool = words.filter(function(w){ return w.tier === '核心高频'; });
        if (pool.length) {
          var rand = pool[Math.floor(Math.random() * pool.length)];
          queue = [rand];
          idx = 0;
          shown = false;
          renderCard();
          if (window.KaoyanToast) window.KaoyanToast('📳 摇一摇抽题：' + rand.word);
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
        }
      }
    });
  })();

  function showSynonymPreview(synWord) {
    const matched = words.find(w => w.word.toLowerCase() === synWord.toLowerCase());
    if (!matched) {
      if (window.KaoyanToast) window.KaoyanToast('词库中未收录此同义衍生词：' + synWord);
      return;
    }
    const ai = AI_EX[matched.word];
    const ex = (ai && ai.en) || matched.example_en || '';
    const exZh = (ai && ai.zh) || matched.example_zh || '';
    
    let pop = $('syn-preview-popover');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'syn-preview-popover';
      pop.className = 'syn-preview-popover';
      document.body.appendChild(pop);
    }
    pop.innerHTML = `
      <h4>
        <span>🔄 考研同义改写对照 · ${esc(matched.word)}</span>
        <button class="syn-preview-close" type="button">&times;</button>
      </h4>
      <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:6px">
        ${matched.phonetic ? esc(matched.phonetic) + ' · ' : ''}${esc(matched.tier || '')}
      </div>
      <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:var(--color-primary)">
        ${esc(matched.exam_meaning || matched.translation || '—')}
      </div>
      ${ex ? `
        <div style="background:var(--color-surface-offset);padding:10px 12px;border-radius:var(--radius-md);border-left:3px solid var(--color-primary)">
          <div style="font-size:13px;line-height:1.5">${hlSentence(ex, matched.word)}</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px">${esc(exZh)}</div>
        </div>
      ` : ''}
      <div style="display:flex;justify-content:flex-end;margin-top:12px;gap:8px">
        <button class="btn" id="syn-goto-study" style="font-size:12px;padding:4px 10px;background:var(--color-primary);color:#fff">📖 跳转背诵该同义词</button>
      </div>
    `;
    pop.hidden = false;
    pop.querySelector('.syn-preview-close').onclick = () => { pop.hidden = true; };
    const gotoBtn = pop.querySelector('#syn-goto-study');
    if (gotoBtn) gotoBtn.onclick = () => {
      pop.hidden = true;
      location.href = 'study.html?w=' + encodeURIComponent(matched.word);
    };
  }

  function checkSpelling(w) {
    const inp = $('spelling-input');
    const fb = $('spelling-feedback');
    if (!inp || !fb) return;
    const val = inp.value.trim().toLowerCase();
    const target = w.word.toLowerCase();
    if (val === target) {
      fb.hidden = false;
      fb.style.color = '#2e7d32';
      fb.innerHTML = '🎉 拼写完全正确！(100% Match)';
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      if (navigator.vibrate) try { navigator.vibrate([15, 30, 20]); } catch(e){}
    } else {
      fb.hidden = false;
      fb.style.color = '#c62828';
      fb.innerHTML = '❌ 拼写有误，正确拼写为：<b>' + esc(w.word) + '</b>';
      if (window.KaoyanAudio) window.KaoyanAudio.playWarn();
    }
  }

  // 发音与震动设置
  function getTtsLang() { return localStorage.getItem('kao_ttslang') || 'en-US'; }
  function getTtsRate() { return parseFloat(localStorage.getItem('kao_ttsrate') || '0.92'); }
  function isHapticOn() { return localStorage.getItem('kao_haptic') !== '0'; }

  function playTts(text, targetBtn) {
    if (!text) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = getTtsLang();
      u.rate = getTtsRate();
      if (targetBtn) {
        targetBtn.classList.add('speaking');
        u.onend = () => targetBtn.classList.remove('speaking');
        u.onerror = () => targetBtn.classList.remove('speaking');
      }
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function triggerHaptic(pattern) {
    if (!isHapticOn()) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern || 15); } catch (e) {}
    }
  }

  // 发音（与查词页同一 TTS 方案）
  document.addEventListener('click',e=>{const b=e.target.closest('[data-speak]');if(!b)return;playTts(b.getAttribute('data-speak'), b);});
  async function lookupMeaning(w){
    if(loading)return;loading=true;const btn=$('lookup');if(btn)btn.textContent='在线获取中…';
    try{const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(w.word));if(!r.ok)throw new Error('notfound');const d=await r.json();const e=d&&d[0];if(!e)throw new Error('empty');const meanings=[];(e.meanings||[]).slice(0,3).forEach(m=>(m.definitions||[]).slice(0,2).forEach(x=>meanings.push((m.partOfSpeech?m.partOfSpeech+'. ':'')+(x.definition||''))));w.pos=w.pos||((e.meanings||[])[0]?.partOfSpeech||'');w.phonetic=w.phonetic||e.phonetic||'';w.defs=meanings.map(x=>({pos:'',text:x}));w.translation=w.translation||'';w.exam_meaning=w.exam_meaning||meanings.slice(0,2).join('；');const ex=(e.meanings||[]).flatMap(m=>m.definitions||[]).find(x=>x.example);if(ex&&!w.example_en)w.example_en=ex.example;w._runtimeFetched=Date.now();mergeRt(w.word,{pos:w.pos,phonetic:w.phonetic,defs:w.defs,translation:w.translation,exam_meaning:w.exam_meaning,example_en:w.example_en,example_zh:w.example_zh});renderCard();}catch(e){alert('在线词典暂时无法获取该词。');}finally{loading=false;}
  }
  function reveal(){shown=true;renderCard();}
  function rate(grade){
    const w=queue[idx];if(!w)return;
    if(!shown){shown=true;renderCard();return;}
    if(grade===0) { triggerHaptic([20, 30, 20]); if(window.KaoyanAudio) window.KaoyanAudio.playWarn(); }
    else if(grade===1) { triggerHaptic(18); }
    else if(grade===2) { triggerHaptic(12); if(window.KaoyanAudio) window.KaoyanAudio.playSuccess(); }
    else if(grade===3) { triggerHaptic([10, 20, 25]); if(window.KaoyanAudio) window.KaoyanAudio.playSuccess(); }
    const p=state.progress[w.word]||{level:0,wrong:0,failStreak:0,success:0};
    if(grade>=2){
      p.level=Math.min(6,(p.level||0)+1);p.success=(p.success||0)+1;p.failStreak=0;
      p.next=Date.now()+gradeInterval(grade,p.success)*86400000;
      if(!state.todaySeen[w.word]){state.todayDone++;state.todaySeen[w.word]=1;}
    }else if(grade===1){
      p.level=Math.max(1,(p.level||0));p.success=0;p.failStreak=0;
      p.next=Date.now()+GRADE_DAYS[1]*86400000;
    }else{
      p.level=0;p.success=0;p.failStreak=(p.failStreak||0)+1;p.wrong=(p.wrong||0)+1;
      p.next=Date.now()+GRADE_MIN;
      state.hardCount[w.word]=(state.hardCount[w.word]||0)+1;
    }
    p.last=Date.now();state.progress[w.word]=p;save();renderStats();
    idx++;shown=false;if(idx>=queue.length){buildQueue();renderPlans();}renderQueue();renderCard();
  }
  $('shuffle').onclick=()=>{buildQueue();renderCard();};$('start').onclick=()=>{shown=false;renderCard();};$('review').onclick=()=>{const pool=words.filter(w=>isDue(w,Date.now()));queue=shuffle(pool).slice(0,100);idx=0;shown=false;renderQueue();renderCard();};$('weak-btn').onclick=()=>{const pool=words.filter(w=>isWeak(w)&&(state.progress[w.word]?.level||0)<4);queue=shuffle(pool).slice(0,100);idx=0;shown=false;renderQueue();renderCard();};
  if($('fav-btn'))$('fav-btn').onclick=()=>{const pool=words.filter(w=>window.KaoyanQuiz&&KaoyanQuiz.isFav(w.word));if(!pool.length){alert('生词本暂无收藏词汇，请在查词或背单词时点击 ★ 收藏！');return;}queue=shuffle(pool).slice(0,100);idx=0;shown=false;const d=$('drawer');if(d)d.hidden=true;renderQueue();renderCard();};
  if($('quiz-btn'))$('quiz-btn').onclick=()=>{if(window.KaoyanQuiz){KaoyanQuiz.startQuiz(queue&&queue.length?queue:words,10);}};
  $('daily').onchange=e=>{state.daily=Math.max(10,Math.min(100,+e.target.value||100));save();buildQueue();renderCard();};
  function exportProgress(){const payload={version:3,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kaoyan-study-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  function importProgress(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p.version&&p.version!==3)throw new Error('version');const incoming=p.state||p;if(!incoming.progress||typeof incoming.progress!=='object')throw new Error('invalid');const today=state.today,todayDone=state.todayDone,todaySeen=state.todaySeen;state=Object.assign(state,incoming);state.progress=state.progress||{};state.today=today;state.todayDone=todayDone;state.todaySeen=todaySeen;save();location.reload();}catch(e){alert('进度文件无效。');}};r.readAsText(f);};input.click();}
  if($('export-progress'))$('export-progress').onclick=exportProgress;if($('import-progress'))$('import-progress').onclick=importProgress;
  
  // ---- 自动播放 / 闪卡连读模式 ----
  let autoplayTimer=null,isAutoplay=false;
  function toggleAutoplay(){
    isAutoplay=!isAutoplay;
    const btn=$('autoplay-btn');
    if(btn){
      btn.textContent=isAutoplay?'⏸':'▶';
      btn.style.color=isAutoplay?'var(--color-accent)':'';
    }
    clearTimeout(autoplayTimer);
    if(isAutoplay){
      if(window.KaoyanToast) window.KaoyanToast('▶ 闪卡连读播放已开启');
      if(shown){
        idx=Math.min(queue.length-1,idx+1);
        shown=false;
        renderQueue();
        renderCard();
      }
      runAutoplayStep();
    } else {
      if(window.KaoyanToast) window.KaoyanToast('⏸ 闪卡连读已暂停');
    }
  }
  function runAutoplayStep(){
    if(!isAutoplay)return;
    const w=queue[idx];
    if(!w){toggleAutoplay();return;}
    if(!shown){
      if(w.word) playTts(w.word);
      autoplayTimer=setTimeout(()=>{
        if(!isAutoplay)return;
        reveal();
        const ai=AI_EX[w.word];
        const ex=(ai&&ai.en)||w.example_en;
        if(ex){
          setTimeout(()=>{ if(isAutoplay) playTts(ex); }, 450);
        }
        autoplayTimer=setTimeout(()=>{
          if(!isAutoplay)return;
          idx=Math.min(queue.length-1,idx+1);
          shown=false;
          renderQueue();renderCard();
          autoplayTimer=setTimeout(runAutoplayStep,700);
        },4200);
      },2200);
    }
  }
  if($('autoplay-btn'))$('autoplay-btn').onclick=toggleAutoplay;

  // 顶部极简导航与抽屉模式控制
  const tierSwitchBtn = $('tier-switch-btn');
  if (tierSwitchBtn) tierSwitchBtn.onclick = () => {
    const d = $('drawer');
    if (d) d.hidden = !d.hidden;
  };

  // 顶部菜单及快捷操作已在 study.html 中统一受控
  const modeContainer = $('drawer-study-modes');
  const modeLabels = {
    standard: '📘 标准',
    weak: '🎯 薄弱词',
    review: '⏰ 复习',
    fav: '⭐ 生词本'
  };
  function updateModeIndicator(m) {
    const ind = $('current-mode-indicator');
    if (ind) ind.textContent = modeLabels[m] || '📘 标准';
  }

  if (modeContainer) {
    modeContainer.addEventListener('click', e => {
      const chip = e.target.closest('.clean-pill-btn');
      if (!chip) return;
      const m = chip.getAttribute('data-study-mode');
      if (m) {
        activeStudyMode = m;
        updateModeIndicator(m);
        modeContainer.querySelectorAll('.clean-pill-btn[data-study-mode]').forEach(c => c.classList.toggle('active', c === chip));
        const d = $('drawer');
        if (d) d.hidden = true;
        buildQueue();
        renderCard();
      }
    });
  }

  function toggleZenMode(enable) {
    const isZen = typeof enable === 'boolean' ? enable : !document.body.classList.contains('zen-focus-active');
    document.body.classList.toggle('zen-focus-active', isZen);
    const d = $('drawer');
    if (d) d.hidden = true;
    if (window.KaoyanToast) window.KaoyanToast(isZen ? '🧘 已开启全屏沉浸刷词' : '已退出沉浸模式');
  }
  const zenBtn = $('drawer-zen-toggle');
  const zenExitBtn = $('zen-exit-btn');
  if (zenBtn) zenBtn.onclick = () => toggleZenMode(true);
  if (zenExitBtn) zenExitBtn.onclick = () => toggleZenMode(false);

  const commuteBtn = $('drawer-commute-toggle');
  if (commuteBtn) {
    commuteBtn.onclick = () => {
      isCommuteMode = !isCommuteMode;
      commuteBtn.classList.toggle('active', isCommuteMode);
      const d = $('drawer');
      if (d) d.hidden = true;
      renderCard();
    };
  }

  // ---- 电脑端全键盘快捷键 (Space/Enter翻转，1-4评分，←/→或A/D切词，S发音，F收藏，W默写，Q速测，Esc关抽屉) ----
  window.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')||e.target.isContentEditable)return;
    if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowDown'){
      e.preventDefault();
      if(!shown) reveal();
      else rate(2); // 认识 ✓
    }else if(['1','2','3','4'].includes(e.key)&&!e.ctrlKey&&!e.metaKey){
      e.preventDefault();
      if(!shown){reveal();return;}
      rate(Number(e.key)-1);
    }else if(e.code==='ArrowLeft'||e.key==='a'||e.key==='A'){
      e.preventDefault();idx=Math.max(0,idx-1);shown=false;renderQueue();renderCard();
    }else if(e.code==='ArrowRight'||e.key==='d'||e.key==='D'){
      e.preventDefault();idx=Math.min(queue.length-1,idx+1);shown=false;renderQueue();renderCard();
    }else if(e.key==='s'||e.key==='S'||e.key==='p'||e.key==='P'){
      const w=queue[idx];
      if(w&&w.word){try{const u=new SpeechSynthesisUtterance(w.word);u.lang='en-US';u.rate=0.92;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(err){}}
    }else if(e.key==='f'||e.key==='F'){
      const w=queue[idx];
      if(w&&window.KaoyanQuiz){KaoyanQuiz.toggleFav(w.word);renderCard();}
    }else if(e.key==='q'||e.key==='Q'){
      const w=queue[idx];
      if(w&&window.KaoyanQuiz)KaoyanQuiz.startQuiz([w],1);
    }else if(e.key==='w'||e.key==='W'){
      const sb=$('spelling-btn');
      if(sb)sb.click();
    }else if(e.key==='Escape'){
      const drawer=$('drawer');if(drawer&&!drawer.hidden)drawer.hidden=true;
    }
  });

  // 记忆页「立即复习 / 专项攻克薄弱词」跳转参数
  try {
    const p = new URLSearchParams(location.search).get('mode');
    if (p === 'review') setTimeout(function () { const rb = $('review'); if (rb) rb.click(); }, 600);
    else if (p === 'weak') setTimeout(function () { const wb = $('weak-btn'); if (wb) wb.click(); }, 600);
  } catch (e) {}
  // 实时背词计时器 (Real-time Study Stopwatch)
  var studyStartTime = Date.now();
  setInterval(function() {
    var elapsed = Math.floor((Date.now() - studyStartTime) / 1000);
    var mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    var secs = String(elapsed % 60).padStart(2, '0');
    var el = document.getElementById('bb-timer-display');
    if (el) el.textContent = mins + ':' + secs;
  }, 1000);

  // ---- 移动端触屏滑动手势支持 (Mobile Touch Swipe Ergonomics) ----
  (function initTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', function(e) {
      if (!e.touches || e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (!e.changedTouches || e.changedTouches.length !== 1) return;
      const target = e.target;
      // 忽略输入框或弹窗
      if (target.closest('button, input, select, a, textarea, .nav-grid, .modal-backdrop, .drawer')) return;

      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // 仅在 400ms 内的轻扫手势且水平位移明显
      if (duration < 400 && Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        if (diffX < 0) {
          // 向左滑 -> 认识并进入下一词
          if (!shown) {
            shown = true;
            renderCard();
          } else {
            rate(2);
          }
          triggerHaptic(15);
        } else {
          // 向右滑 -> 标为不认识
          if (!shown) {
            shown = true;
            renderCard();
          } else {
            rate(0);
          }
          triggerHaptic([15, 20]);
        }
      }
    }, { passive: true });
  })();

  // 启动词库初始化
  initStudyWords();
})();
