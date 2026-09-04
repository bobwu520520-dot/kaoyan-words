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
  let currentOpMode = localStorage.getItem('kao_op_mode') || 'gesture';
  let undoSnapshot = null, undoToastTimer = null;
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

    function failWordsLoad() {
      if ($('card')) $('card').innerHTML = '<div class="empty"><h2>词库加载失败</h2><p>本地词库未就绪时，可点击下方重试。无需依赖外网。</p><button class="btn primary" id="retry-words-load" type="button" style="margin-top:12px;padding:8px 18px;border-radius:8px;background:var(--color-primary);color:#fff;border:none;cursor:pointer">重新加载词库 ↻</button></div>';
      const rb = $('retry-words-load');
      if (rb) rb.onclick = () => initStudyWords();
    }
    const bundled = (window.getKaoyanWords && window.getKaoyanWords()) || window.__WORDS_DATA__ || window.__INITIAL_WORDS__;
    if (bundled && bundled.words && bundled.words.length > 0) {
      processWordsData(bundled);
      return;
    }
    const loader = window.loadKaoyanWords ? window.loadKaoyanWords() : fetch('data/words.json').then(r => {
      if (!r.ok && r.status !== 0) throw new Error('load failed');
      return r.text().then(t => {
        if (!t || t.trim().charAt(0) === '<') throw new Error('not json');
        return JSON.parse(t);
      });
    });
    loader.then(processWordsData).catch(failWordsLoad);
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
    var need = Math.min(Math.max(Number(state.daily)||50, 15), 300);
    var corpusTier = localStorage.getItem('kao_corpus_hierarchy') || 'all';
    var studyOrder = localStorage.getItem('kao_study_order') || 'random';
    var decayPrior = localStorage.getItem('kao_decay_prior') !== '0';

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
    if (corpusTier === 'core') {
      var corePool = pool.filter(w => w.tier === '核心高频' || (w.star && w.star >= 4));
      if (corePool.length >= 10) pool = corePool;
    } else if (corpusTier === 'sprint') {
      var sprintPool = pool.filter(w => w.tier === '高频重点' || (w.star && w.star === 5));
      if (sprintPool.length >= 10) pool = sprintPool;
    }
    if (studyOrder === 'freq') {
      pool.sort((a,b) => (b.star || 0) - (a.star || 0));
    } else if (studyOrder === 'alpha') {
      pool.sort((a,b) => a.word.localeCompare(b.word));
    }

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
  // ===== 🚀 双卡跟手滑动与瞬时乒乓切换架构 (Dual-Slot Ping-Pong Architecture) =====
  let slotA = null, slotB = null;
  let activeSlot = null, preloadSlot = null;
  let isAnimating = false;
  let lastRateTime = 0;
  let preloadedUtterance = null;
  let hasHapticThresholdFired = false;
  if (typeof window.sessionStudyStartTime === 'undefined') {
    window.sessionStudyStartTime = Date.now();
  }

  function getStudyTimeStr() {
    const start = typeof studyStartTime !== 'undefined' ? studyStartTime : window.sessionStudyStartTime;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return mins + ':' + secs;
  }

  // 发音与震动设置
  function getTtsLang() { return localStorage.getItem('kao_ttslang') || 'en-US'; }
  function getTtsRate() { return parseFloat(localStorage.getItem('kao_ttsrate') || '0.92'); }
  function isHapticOn() { return localStorage.getItem('kao_haptic') !== '0'; }
  function isAutoSpeakOn() { return localStorage.getItem('kao_auto_speak') === 'true'; }

  function triggerHaptic(pattern) {
    if (!isHapticOn()) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern || 15); } catch (e) {}
    }
  }

  function playTts(text, targetBtn) {
    if (!text) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = getTtsLang();
      let r = getTtsRate();
      if (localStorage.getItem('kao_slow_hard_words') === '1' && (text.length > 8 || text.includes(' '))) {
        r = Math.min(r, 0.72);
      }
      u.rate = r;
      if (targetBtn) {
        targetBtn.classList.add('speaking');
        u.onend = () => targetBtn.classList.remove('speaking');
        u.onerror = () => targetBtn.classList.remove('speaking');
      }
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function preloadWordAudio(word) {
    if (!word) return;
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = getTtsLang();
      let r = getTtsRate();
      if (localStorage.getItem('kao_slow_hard_words') === '1' && (word.length > 8 || word.includes(' '))) {
        r = Math.min(r, 0.72);
      }
      u.rate = r;
      preloadedUtterance = u;
    } catch (e) {}
  }

  // ⭐ 收藏星星飞入动效
  function triggerStarAnimation() {
    const star = document.createElement('div');
    star.className = 'star-flying-effect';
    star.textContent = '⭐';
    document.body.appendChild(star);
    setTimeout(() => { if (star.parentNode) star.remove(); }, 750);
  }

  // ↩️ 撤销评分快照与提示
  function showUndoToast(word, grade) {
    const toast = $('study-undo-toast');
    const msg = $('study-undo-msg');
    if (!toast || !msg) return;
    const label = grade === 3 ? '熟记掌握' : (grade === 0 ? '需重背' : (grade === -1 ? '收藏&稍后再看' : '待巩固'));
    msg.textContent = `已标记「${word}」· ${label}`;
    toast.classList.add('active');
    clearTimeout(undoToastTimer);
    undoToastTimer = setTimeout(() => {
      toast.classList.remove('active');
      undoSnapshot = null;
    }, 3500);
  }

  function ensureSliderSlots() {
    let stage = document.getElementById('card-slider-stage');
    const box = document.getElementById('card');
    if (!stage && box) {
      box.innerHTML = `
        <div class="card-slider-stage" id="card-slider-stage">
          <div class="card-slide-slot active" id="card-slot-a"></div>
          <div class="card-slide-slot preload" id="card-slot-b"></div>
        </div>
      `;
      stage = document.getElementById('card-slider-stage');
    }
    slotA = document.getElementById('card-slot-a');
    slotB = document.getElementById('card-slot-b');
    if (!activeSlot) activeSlot = slotA;
    if (!preloadSlot) preloadSlot = slotB;
  }

  // 例句目标词高亮
  function hlSentence(en, word) {
    const stem = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const alt = /e$/.test(word) ? '|' + word.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*' : '';
    return esc(en).replace(new RegExp('\\b(' + stem + '\\w*' + alt + ')', 'gi'), '<span class="word-hl">$1</span>');
  }

  function syncRating() {
    const hint = $('rating-hint');
    if (hint) hint.textContent = shown ? '点击评分，自动进入下一个词' : '先显示释义，再评分';
  }

  // 构建单卡 HTML 字符串
  function buildCardHtml(w, isRevealed, cardIdx, totalCount) {
    if (!w) return '';
    const meaning = w.exam_meaning || w.translation || '';
    const ai = AI_EX[w.word];
    const ex = (ai && ai.en) || w.example_en || '';
    const exZh = (ai && ai.zh) || w.example_zh || '';
    const rawPos = (w.pos || (meaning.match(/^([a-z]+\.)/i) ? meaning.match(/^([a-z]+\.)/i)[1] : '') || '动').replace('.', '');
    const cleanMeaning = meaning.replace(/^[a-z]+\.\s*/i, '');

    const masteredCount = words.filter(x => (state.progress[x.word]?.level || 0) >= 4).length;
    const forgotCount = words.filter(x => (state.hardCount[x.word] || 0) > 0).length;
    const progressBadgeHtml = `<span class="bb-progress-badge" title="当前背诵实时进度">第 <b>${cardIdx + 1}</b>/${totalCount} 词 · 记住 <b style="color:#10b981">${masteredCount}</b> · 重背 <b style="color:#ef4444">${forgotCount}</b></span>`;

    const autoSpeakActive = isAutoSpeakOn();
    const voicePillsHtml = `<button class="bb-tool-icon autospeak-btn ${autoSpeakActive ? 'active' : ''}" type="button" title="点击开关切词自动发音">${autoSpeakActive ? '🔊' : '🔇'}</button>`;

    const ratingBarHtml = `
      <div class="bb-rating-bar">
        <button class="bb-rate-btn bb-rate-forgot" type="button" title="需重背（等同于向左滑动）">
          <span class="bb-rate-label">👈 需重背</span>
          <span class="bb-rate-sub">模糊 / 忘记</span>
        </button>
        <button class="bb-rate-btn bb-rate-fuzzy" type="button" title="待巩固（强化复习）">
          <span class="bb-rate-label">⏳ 待巩固</span>
          <span class="bb-rate-sub">需多复习</span>
        </button>
        <button class="bb-rate-btn bb-rate-known" type="button" title="熟记掌握（等同于向右滑动）">
          <span class="bb-rate-label">👉 熟记</span>
          <span class="bb-rate-sub">已掌握</span>
        </button>
      </div>
    `;

    const spellingHtml = (currentOpMode === 'spelling') ? `
      <div class="spelling-box" style="margin: 8px 0;">
        <div style="font-size:12px;font-weight:700;color:var(--color-primary);display:flex;justify-content:space-between;align-items:center">
          <span>✍️ 单词拼写默写微测</span>
          <span style="font-size:11px;color:var(--color-text-muted)">输入后按回车或点检查</span>
        </div>
        <div class="spelling-input-row" style="display:flex;gap:6px">
          <input type="text" class="spelling-input" placeholder="输入单词拼写..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="flex:1">
          <button class="spelling-check-btn" type="button">检查</button>
        </div>
        <div class="spelling-feedback" style="font-size:12px;display:none;padding:4px 0"></div>
      </div>
    ` : '';

    if (!isRevealed) {
      return `
        <div class="bb-container unrevealed">
          <!-- 左右滑动动态半透明指示印章 (左滑=熟记·绿色，右滑=需重背·红色) -->
          <div class="swipe-feedback-stamp stamp-left">👈 熟记掌握 🦮</div>
          <div class="swipe-feedback-stamp stamp-right">👉 模糊 / 需重背 🐾</div>

          <!-- 顶部状态栏 -->
          <div class="bb-top-bar">
            ${progressBadgeHtml}
            <div class="bb-top-tools">
              <span class="bb-timer bb-timer-display">${getStudyTimeStr()}</span>
              ${voicePillsHtml}
              ${window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : ''}
              <button class="bb-tool-icon drawer-btn-inline" type="button" title="⚙️ 学习偏好与模式设置">⚙</button>
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

          <!-- 居中回忆提示区 + 金毛学伴打气 -->
          <div class="bb-recall-prompt">
            <div class="study-puppy-cheer-card">
              <img src="img/puppies/golden_cheer.jpg" alt="金毛学伴" style="width:44px;height:44px;border-radius:12px;object-fit:cover;border:2px solid var(--color-primary);box-shadow:0 2px 8px rgba(0,0,0,0.1);flex-shrink:0" class="puppy-bounce-anim">
              <div style="text-align:left">
                <div style="font-size:12px;font-weight:800;color:var(--color-primary);display:flex;align-items:center;gap:4px">
                  金毛学伴打气 <span style="font-size:10px;background:color-mix(in oklab, var(--color-primary) 15%, transparent);padding:1px 6px;border-radius:999px">摇尾陪伴</span>
                </div>
                <div style="font-size:11.5px;color:var(--color-text-muted)">“想起来了吗？👆点空白看释义 · 👈左滑熟记 · 👉右滑需重背”</div>
              </div>
            </div>
            <div class="bb-recall-title">请回忆单词发音和释义</div>
            <div class="bb-recall-sub">👆 轻触卡片空白处查看释义 · 👈 左滑熟记 · 👉 右滑需重背 · ⬇️ 下滑稍后再看</div>
          </div>

          ${spellingHtml}

          <!-- 悬浮播放按钮 -->
          <button class="bb-floating-audio-btn" data-speak="${esc(w.word)}" type="button" title="朗读单词" style="bottom:74px;right:16px">
            <span class="bb-audio-wave">🔊</span>
          </button>

          <!-- 底部 3 按钮操作栏 -->
          ${ratingBarHtml}
        </div>
      `;
    }

    // 展开后的考点与例句助记卡
    return `
      <div class="bb-container revealed">
        <!-- 左右滑动动态半透明指示印章 (左滑=熟记·绿色，右滑=需重背·红色) -->
        <div class="swipe-feedback-stamp stamp-left">👈 熟记掌握 🦮</div>
        <div class="swipe-feedback-stamp stamp-right">👉 模糊 / 需重背 🐾</div>

        <!-- 顶部状态栏 -->
        <div class="bb-top-bar">
          ${progressBadgeHtml}
          <div class="bb-top-tools">
            <span class="bb-timer bb-timer-display">${getStudyTimeStr()}</span>
            ${voicePillsHtml}
            ${window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : ''}
            <button class="bb-tool-icon drawer-btn-inline" type="button" title="⚙️ 学习偏好与模式设置">⚙</button>
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
          <!-- 边牧助记提醒条 -->
          <div class="study-puppy-revealed-bar">
            <img src="img/puppies/border_glasses.jpg" alt="边牧学霸" style="width:34px;height:34px;border-radius:10px;object-fit:cover;border:1.5px solid var(--color-primary);box-shadow:0 2px 6px rgba(0,0,0,0.08);flex-shrink:0" class="puppy-bounce-anim">
            <div style="font-size:12px;color:var(--color-text-muted);line-height:1.45">
              <strong style="color:var(--color-text)">边牧学霸考点提示：</strong>结合真题考点短语联想记忆！👉 右滑熟悉，👈 左滑模糊/忘记~
            </div>
          </div>

          <!-- 释义栏 -->
          <div class="bb-meaning-box">
            <span class="bb-pos-tag">${esc(rawPos)}</span>
            <span class="bb-meaning-text">${esc(cleanMeaning || meaning || '暂无释义')}</span>
            <button class="bb-meaning-opt-btn btn-lookup" type="button" title="查详细词典">🎛️</button>
          </div>

          ${spellingHtml}

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
                  <div class="bb-example-zh ${localStorage.getItem('kao_mask_translation') === '1' ? 'masked' : ''}" title="轻触展开/遮挡例句中文释义">${esc(exZh || '')} ${localStorage.getItem('kao_mask_translation') === '1' ? '<span class="mask-hint">🙈 遮挡中·轻触展开</span>' : ''}</div>
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

        <!-- 底部 3 按钮操作栏 -->
        ${ratingBarHtml}
      </div>
    `;
  }

  // 绑定单个 Slot 内部的交互事件
  function bindSlotEvents(slotEl, w, isRevealed) {
    if (!slotEl || !w) return;

    // 学伴打气点击
    const cheer = slotEl.querySelector('.study-puppy-cheer-card');
    if (cheer) {
      cheer.onclick = (e) => {
        e.stopPropagation();
        triggerHaptic(20);
        const done = state.todayDone || 0;
        const isCalm = localStorage.getItem('kao_puppy_mode') === 'calm';
        const cheers = isCalm ? [
          `🐕‍🦺 边牧学伴陪伴中：保持心流专注，逐词深入理解。`,
          `🦮 金毛学伴守在一旁：专注眼前，稳步前行。`,
          `🐶 萨摩耶默默打气：沉下心来，厚积薄发。`
        ] : [
          `🦮 小金毛晃着尾巴：“想出来了吗？轻触卡片空白处展开释义核对回忆哦！”`,
          `🐕‍🦺 边牧小学霸：“今日已完成 ${done} 词，保持专注度，考研真题轻松拿捏！”`,
          `🐶 萨摩耶甜甜笑：“不要偷看！先努力在脑海中检索发音和中文释义！”`,
          `🐾 柯基伸出小肉垫：“一步一个脚印！每天多背一组，初试多拿好几分！”`
        ];
        if (window.KaoyanToast) window.KaoyanToast(cheers[Math.floor(Math.random() * cheers.length)]);
        if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      };
    }

    // 设置抽屉
    const drawerBtn = slotEl.querySelector('.drawer-btn-inline');
    if (drawerBtn) drawerBtn.onclick = (e) => { e.stopPropagation(); $('drawer').hidden = false; };

    // 在线查词
    const lookupBtn = slotEl.querySelector('.btn-lookup');
    if (lookupBtn) lookupBtn.onclick = (e) => { e.stopPropagation(); lookupMeaning(w); };

    // 遮挡翻译切换
    slotEl.querySelectorAll('.bb-example-zh').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        el.classList.toggle('masked');
      };
    });

    // 复制例句
    slotEl.querySelectorAll('[data-copy]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-copy');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            if (window.KaoyanToast) window.KaoyanToast('📋 已复制例句到剪贴板');
          });
        }
      };
    });

    // 单词发音
    slotEl.querySelectorAll('[data-speak]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        playTts(btn.getAttribute('data-speak'), btn);
      };
    });

    // 切词自动发音切换
    const autoBtn = slotEl.querySelector('.autospeak-btn');
    if (autoBtn) {
      autoBtn.onclick = (e) => {
        e.stopPropagation();
        const cur = isAutoSpeakOn();
        localStorage.setItem('kao_auto_speak', cur ? 'false' : 'true');
        autoBtn.textContent = !cur ? '🔊' : '🔇';
        autoBtn.title = !cur ? '切词自动朗读已开（点击关闭）' : '切词自动朗读已关（点击开启）';
        autoBtn.classList.toggle('active', !cur);
        if (window.KaoyanToast) window.KaoyanToast(!cur ? '🔊 已开启切词自动发音' : '🔇 已关闭切词自动发音');
        if (!cur && w && w.word) playTts(w.word);
      };
    }

    // 拼写微测
    const spInput = slotEl.querySelector('.spelling-input');
    const spCheck = slotEl.querySelector('.spelling-check-btn');
    const spFb = slotEl.querySelector('.spelling-feedback');
    if (spCheck && spInput && spFb) {
      const doCheck = () => {
        const val = spInput.value.trim().toLowerCase();
        const target = w.word.toLowerCase();
        spFb.style.display = 'block';
        if (val === target) {
          spFb.style.color = '#2e7d32';
          spFb.innerHTML = '🎉 拼写完全正确！(100% Match)';
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          triggerHaptic([15, 30, 20]);
        } else {
          spFb.style.color = '#c62828';
          spFb.innerHTML = '❌ 拼写有误，正确拼写为：<b>' + esc(w.word) + '</b>';
          if (window.KaoyanAudio) window.KaoyanAudio.playWarn();
        }
      };
      spCheck.onclick = (e) => { e.stopPropagation(); doCheck(); };
      spInput.onclick = (e) => { e.stopPropagation(); };
      spInput.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          doCheck();
        }
      };
    }

    // 底部 3 按钮评分操作 (P0: 与手势平级统一调度)
    const btnForgot = slotEl.querySelector('.bb-rate-forgot');
    const btnFuzzy = slotEl.querySelector('.bb-rate-fuzzy');
    const btnKnown = slotEl.querySelector('.bb-rate-known');
    if (btnForgot) btnForgot.onclick = (e) => { e.stopPropagation(); animatedRate(0); };
    if (btnFuzzy) btnFuzzy.onclick = (e) => { e.stopPropagation(); animatedRate(1); };
    if (btnKnown) btnKnown.onclick = (e) => { e.stopPropagation(); animatedRate(3); };

    // 未展开状态下点击卡片空白区展开
    if (!isRevealed) {
      const container = slotEl.querySelector('.bb-container.unrevealed');
      if (container) {
        container.onclick = (e) => {
          if (e.target.closest('button, a, input, label, select, textarea, .spelling-box')) return;
          reveal();
        };
      }
    }
  }

  // 渲染单词至指定卡片插槽
  function renderWordIntoSlot(slotEl, cardIdx, isRevealed) {
    if (!slotEl) return;
    if (cardIdx >= queue.length) {
      if (window.KaoyanAudio) window.KaoyanAudio.playComplete();
      slotEl.innerHTML = `
        <div class="bb-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 16px;height:100%;box-sizing:border-box">
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:14px">
            <img src="img/puppies/golden_graduate.jpg" alt="金毛学伴" style="width:58px;height:58px;border-radius:18px;object-fit:cover;border:2px solid #eab308;box-shadow:0 3px 10px rgba(0,0,0,0.1)" class="puppy-bounce-anim">
            <img src="img/puppies/border_graduate.jpg" alt="边牧学伴" style="width:64px;height:64px;border-radius:20px;object-fit:cover;border:2.5px solid var(--color-primary);box-shadow:0 4px 12px rgba(0,0,0,0.12)" class="puppy-bounce-anim">
            <img src="img/puppies/samoyed_graduate.jpg" alt="萨摩耶学伴" style="width:58px;height:58px;border-radius:18px;object-fit:cover;border:2px solid #06b6d4;box-shadow:0 3px 10px rgba(0,0,0,0.1)" class="puppy-bounce-anim">
          </div>
          <h2 style="font-size:20px;font-weight:800;color:var(--color-primary);margin:0 0 6px">汪汪！今日背词大通关 🎉</h2>
          <p style="font-size:13.5px;color:var(--color-text-muted);margin:0 0 18px">今日已完成 ${state.todayDone || 0} 词 · 小金毛、边牧和萨摩耶为你欢呼摇尾巴！</p>
          <div style="display:flex;flex-direction:column;gap:10px;max-width:300px;width:100%;margin:0 auto">
            <button class="btn primary" id="next-group" type="button" style="padding:12px;font-size:15px;font-weight:700;border-radius:10px">🐾 携萌犬继续下一组新词</button>
            <button class="btn" id="replay-group" type="button" style="padding:10px;font-size:14px;border-radius:10px">🔄 重新巩固本组单词</button>
            <a class="btn" href="memory.html" style="padding:10px;font-size:14px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px">📅 去我的主页签到领今日萌犬</a>
          </div>
        </div>
      `;
      const btnNext = slotEl.querySelector('#next-group');
      if (btnNext) btnNext.onclick = () => { buildQueue(); renderCard(); };
      const btnReplay = slotEl.querySelector('#replay-group');
      if (btnReplay) btnReplay.onclick = () => { idx = 0; shown = false; renderQueue(); renderCard(); };
      return;
    }

    const w = queue[cardIdx];
    slotEl.innerHTML = buildCardHtml(w, isRevealed, cardIdx, queue.length);
    bindSlotEvents(slotEl, w, isRevealed);
  }

  // 预渲染双槽位卡片
  function prepareSlots() {
    ensureSliderSlots();
    renderWordIntoSlot(activeSlot, idx, shown);
    activeSlot.className = 'card-slide-slot active';
    activeSlot.style.transition = 'none';
    activeSlot.style.transform = 'translate3d(0, 0, 0)';
    activeSlot.style.opacity = '1';

    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
    if (idx + 1 < queue.length) {
      renderWordIntoSlot(preloadSlot, idx + 1, false);
      preloadSlot.className = 'card-slide-slot preload';
      preloadSlot.style.transition = 'none';
      preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
      preloadSlot.style.opacity = '1';
      preloadWordAudio(queue[idx + 1].word);
    } else {
      renderWordIntoSlot(preloadSlot, queue.length, false);
      preloadSlot.className = 'card-slide-slot preload';
      preloadSlot.style.transition = 'none';
      preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
      preloadSlot.style.opacity = '1';
    }

    syncRating();

    // 切词自动发音
    if (isAutoSpeakOn() && !shown && queue[idx] && queue[idx].word) {
      setTimeout(() => {
        if (!shown && queue[idx]) {
          playTts(queue[idx].word);
        }
      }, 70);
    }
  }

  function renderCard() {
    ensureSliderSlots();
    const w = queue[idx];
    if (!w) {
      renderWordIntoSlot(activeSlot, idx, false);
      if (preloadSlot) preloadSlot.innerHTML = '';
      return;
    }
    prepareSlots();
  }

  // 显示释义统一入口：点卡片空白 / Space / 方向键
  function reveal() {
    if (shown || !queue[idx]) return;
    shown = true;
    renderWordIntoSlot(activeSlot, idx, true);
    syncRating();

    const w0 = queue[idx];
    const mm = w0.exam_meaning || w0.translation;
    if (!mm) lookupMeaning(w0);

    if (window.kaoAutoRead && window.kaoAutoRead()) {
      try {
        const u = new SpeechSynthesisUtterance(w0.word);
        u.lang = getTtsLang();
        u.rate = getTtsRate();
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (err) {}
    }
  }

  // 🌟 核心评分逻辑与乒乓指针轮换 (P0: 全流程 < 300ms)
  function commitRateAndSwap(grade, w, instant) {
    if (!w) return;

    // 1. 记录快照以支持撤销
    const prevP = state.progress[w.word];
    undoSnapshot = {
      word: w.word,
      grade: grade,
      prevProgress: prevP ? Object.assign({}, prevP) : null,
      prevHardCount: state.hardCount[w.word],
      prevTodayDone: state.todayDone,
      prevTodaySeenVal: state.todaySeen[w.word],
      idx: idx,
      shown: shown
    };

    // 2. 更新艾宾浩斯记忆模型数据
    const p = state.progress[w.word] || { level: 0, wrong: 0, failStreak: 0, success: 0 };
    if (grade >= 2) {
      p.level = Math.min(6, (p.level || 0) + 1);
      p.success = (p.success || 0) + 1;
      p.failStreak = 0;
      p.next = Date.now() + gradeInterval(grade, p.success) * 86400000;
      if (!state.todaySeen[w.word]) {
        state.todayDone++;
        state.todaySeen[w.word] = 1;
      }
    } else if (grade === 1) {
      p.level = Math.max(1, (p.level || 0));
      p.success = 0;
      p.failStreak = 0;
      p.next = Date.now() + GRADE_DAYS[1] * 86400000;
    } else {
      p.level = 0;
      p.success = 0;
      p.failStreak = (p.failStreak || 0) + 1;
      p.wrong = (p.wrong || 0) + 1;
      p.next = Date.now() + GRADE_MIN;
      state.hardCount[w.word] = (state.hardCount[w.word] || 0) + 1;
    }
    p.last = Date.now();
    state.progress[w.word] = p;
    save();

    // 3. 弹出撤销浮条
    showUndoToast(w.word, grade);

    // 4. 乒乓插槽指针交换 (Ping-Pong Swap)
    const temp = activeSlot;
    activeSlot = preloadSlot;
    preloadSlot = temp;

    activeSlot.className = 'card-slide-slot active';
    preloadSlot.className = 'card-slide-slot preload';
    activeSlot.style.transition = 'none';
    activeSlot.style.transform = 'translate3d(0, 0, 0)';
    activeSlot.style.opacity = '1';

    idx++;
    shown = false;

    if (idx >= queue.length) {
      buildQueue();
      renderPlans();
      prepareSlots();
      renderStats();
      return;
    }

    renderStats();
    renderQueue();
    syncRating();

    // 5. 自动朗读当前已切换到的词 (使用预先初始化的 Utterance 对象极速发音)
    const currentWord = queue[idx];
    if (isAutoSpeakOn() && currentWord && currentWord.word) {
      if (preloadedUtterance && preloadedUtterance.text === currentWord.word) {
        try {
          speechSynthesis.cancel();
          speechSynthesis.speak(preloadedUtterance);
        } catch (e) {
          playTts(currentWord.word);
        }
      } else {
        playTts(currentWord.word);
      }
    }

    // 6. 异步预渲染下下张卡片至 preloadSlot，不阻塞当前帧渲染
    const nextNextIdx = idx + 1;
    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
    preloadSlot.style.transition = 'none';
    preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
    preloadSlot.style.opacity = '1';

    requestAnimationFrame(() => {
      if (nextNextIdx < queue.length) {
        renderWordIntoSlot(preloadSlot, nextNextIdx, false);
        preloadWordAudio(queue[nextNextIdx].word);
      } else {
        renderWordIntoSlot(preloadSlot, queue.length, false);
      }
    });
  }

  // 🌟 丝滑卡片评级动画执行器 (手势滑动、底部按键与快捷键统一调度)
  function animatedRate(grade) {
    if (!queue[idx]) return;
    const targetWord = queue[idx];
    const now = Date.now();
    const isRapidTap = (now - lastRateTime < 160);
    lastRateTime = now;

    if (isRapidTap) {
      // 快速连击防手速卡顿：直接跳过 CSS 动画切换
      commitRateAndSwap(grade, targetWord, true);
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;

    if (grade === 0) {
      // 👉 需重背（右滑移出，下一卡从左滑入）
      const stampRight = activeSlot.querySelector('.stamp-right');
      if (stampRight) stampRight.style.opacity = '1';

      preloadSlot.style.transition = 'none';
      preloadSlot.style.transform = `translate3d(${-stageWidth}px, 0, 0)`;
      preloadSlot.style.opacity = '1';
      void preloadSlot.offsetHeight;

      const duration = 220;
      activeSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      preloadSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

      activeSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
      preloadSlot.style.transform = 'translate3d(0, 0, 0)';

      triggerHaptic([20, 30, 20]);
      if (window.KaoyanAudio) window.KaoyanAudio.playWarn();

      setTimeout(() => {
        commitRateAndSwap(grade, targetWord);
        isAnimating = false;
      }, duration);
    } else if (grade === 3) {
      // 👈 熟记掌握（左滑移出，下一卡从右滑入）
      const stampLeft = activeSlot.querySelector('.stamp-left');
      if (stampLeft) stampLeft.style.opacity = '1';

      preloadSlot.style.transition = 'none';
      preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
      preloadSlot.style.opacity = '1';
      void preloadSlot.offsetHeight;

      const duration = 220;
      activeSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      preloadSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

      activeSlot.style.transform = `translate3d(${-stageWidth}px, 0, 0)`;
      preloadSlot.style.transform = 'translate3d(0, 0, 0)';

      triggerHaptic([10, 20, 25]);
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();

      setTimeout(() => {
        commitRateAndSwap(grade, targetWord);
        isAnimating = false;
      }, duration);
    } else {
      // ⏳ 待巩固（原位淡出缩放微移，新卡升起）
      preloadSlot.style.transition = 'none';
      preloadSlot.style.transform = 'translate3d(0, 0, 0) scale(1.04)';
      preloadSlot.style.opacity = '0';
      void preloadSlot.offsetHeight;

      const duration = 180;
      activeSlot.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
      preloadSlot.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

      activeSlot.style.transform = 'translate3d(0, -18px, 0) scale(0.95)';
      activeSlot.style.opacity = '0';
      preloadSlot.style.transform = 'translate3d(0, 0, 0) scale(1)';
      preloadSlot.style.opacity = '1';

      triggerHaptic(18);

      setTimeout(() => {
        commitRateAndSwap(grade, targetWord);
        isAnimating = false;
      }, duration);
    }
  }

  // 兼容老调用签名的 rate 方法
  function rate(grade, forceAdvance) {
    animatedRate(grade);
  }

  // ↩️ P1 撤销评分与状态恢复（反向滑动动画：当前卡片向右滑出，上一张从左侧滑回）
  function performUndo() {
    if (!undoSnapshot) return;
    const s = undoSnapshot;
    undoSnapshot = null;
    const toast = $('study-undo-toast');
    if (toast) toast.classList.remove('active');
    clearTimeout(undoToastTimer);

    if (s.grade === -1 && queue.length > 0 && queue[queue.length - 1].word === s.word) {
      queue.pop();
    }

    if (s.prevProgress !== null) {
      state.progress[s.word] = s.prevProgress;
    } else {
      delete state.progress[s.word];
    }
    if (s.prevHardCount !== undefined) {
      state.hardCount[s.word] = s.prevHardCount;
    } else {
      delete state.hardCount[s.word];
    }
    state.todayDone = s.prevTodayDone;
    if (s.prevTodaySeenVal !== undefined) {
      state.todaySeen[s.word] = s.prevTodaySeenVal;
    } else {
      delete state.todaySeen[s.word];
    }
    idx = s.idx;
    shown = s.shown;
    save();
    renderStats();
    renderQueue();

    // 执行反向滑入动效
    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
    renderWordIntoSlot(preloadSlot, idx, shown);
    preloadSlot.style.transition = 'none';
    preloadSlot.style.transform = `translate3d(${-stageWidth}px, 0, 0)`;
    preloadSlot.style.opacity = '1';
    void preloadSlot.offsetHeight;

    const duration = 220;
    activeSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    preloadSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

    activeSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
    preloadSlot.style.transform = 'translate3d(0, 0, 0)';

    triggerHaptic(15);
    if (window.KaoyanToast) window.KaoyanToast(`↩️ 已撤销对「${s.word}」的评分，返回上一个词`);

    setTimeout(() => {
      const temp = activeSlot;
      activeSlot = preloadSlot;
      preloadSlot = temp;
      activeSlot.className = 'card-slide-slot active';
      preloadSlot.className = 'card-slide-slot preload';
      activeSlot.style.transition = 'none';
      activeSlot.style.transform = 'translate3d(0, 0, 0)';

      if (idx + 1 < queue.length) {
        preloadSlot.style.transition = 'none';
        preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;
        renderWordIntoSlot(preloadSlot, idx + 1, false);
        preloadWordAudio(queue[idx + 1].word);
      }
    }, duration);
  }

  // ⬇️ 下滑收藏到生词本 + 稍后再看 (P1 & P2)
  function handleSwipeDownFavorite() {
    const w = queue[idx];
    if (!w) return;
    if (window.KaoyanQuiz) {
      const isFav = KaoyanQuiz.isFav(w.word);
      if (!isFav) KaoyanQuiz.toggleFav(w.word);
    }
    triggerStarAnimation();
    triggerHaptic([15, 25]);

    const prevP = state.progress[w.word];
    undoSnapshot = {
      word: w.word,
      grade: -1,
      prevProgress: prevP ? Object.assign({}, prevP) : null,
      prevHardCount: state.hardCount[w.word],
      prevTodayDone: state.todayDone,
      prevTodaySeenVal: state.todaySeen[w.word],
      idx: idx,
      shown: shown
    };
    showUndoToast(w.word, -1);

    queue.push(w);
    idx++;
    shown = false;
    if (idx >= queue.length) {
      buildQueue();
      renderPlans();
    }
    renderQueue();
    renderCard();
    if (window.KaoyanToast) window.KaoyanToast(`⭐ 已将「${w.word}」收藏到专属生词本，并加入今日稍后复习`);
  }

  // 🐾 新手手势引导检查
  function checkGestureGuide() {
    const guided = localStorage.getItem('kao_gesture_guided');
    const modal = $('gesture-guide-modal');
    if (!guided && modal) {
      modal.hidden = false;
      const dismiss = () => {
        modal.hidden = true;
        localStorage.setItem('kao_gesture_guided', '1');
      };
      const btn = $('guide-confirm-btn');
      if (btn) btn.onclick = dismiss;
      const backdrop = $('guide-backdrop');
      if (backdrop) backdrop.onclick = dismiss;
    }
  }
  function dismissGestureGuide() {
    const guided = localStorage.getItem('kao_gesture_guided');
    if (!guided) {
      localStorage.setItem('kao_gesture_guided', '1');
      const modal = $('gesture-guide-modal');
      if (modal) modal.hidden = true;
    }
  }

  // 📱 P0/P1 高精度跟手滑动切换引擎
  const cardBox = document.getElementById('card');
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let isDragging = false, lastTapTime = 0;
  let dragDirection = null;
  let allowHorizontalSwipe = false;

  function handleDragStart(clientX, clientY, target) {
    if (isAnimating) return;
    if (target && target.closest('button, a, input, select, textarea, label')) return;
    if (currentOpMode === 'button') {
      allowHorizontalSwipe = false;
      isDragging = false;
      return;
    }

    const screenW = window.innerWidth || document.documentElement.clientWidth || 360;
    const isEdgeZone = (clientX <= screenW * 0.15 || clientX >= screenW * 0.85);
    allowHorizontalSwipe = (!shown) || isEdgeZone;

    touchStartX = clientX;
    touchStartY = clientY;
    touchStartTime = Date.now();
    isDragging = true;
    dragDirection = null;
    hasHapticThresholdFired = false;

    if (activeSlot) activeSlot.style.transition = 'none';
    if (preloadSlot) preloadSlot.style.transition = 'none';
  }

  function handleDragMove(clientX, clientY) {
    if (!isDragging || isAnimating || !activeSlot || !preloadSlot) return;
    const dx = clientX - touchStartX;
    const dy = clientY - touchStartY;

    if (dragDirection === null) {
      if (Math.hypot(dx, dy) > 8) {
        if (Math.abs(dy) >= Math.abs(dx)) {
          dragDirection = 'vertical';
        } else {
          if (allowHorizontalSwipe) {
            dragDirection = 'horizontal';
          } else {
            dragDirection = 'vertical';
          }
        }
      }
    }

    if (dragDirection === 'vertical') return;

    if (dragDirection === 'horizontal') {
      const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
      const stampRight = activeSlot.querySelector('.stamp-right');
      const stampLeft = activeSlot.querySelector('.stamp-left');

      if (dx < 0) {
        // 👈 向左滑动：当前卡跟手向左，下一卡紧贴从右侧跟手进入
        activeSlot.style.transform = `translate3d(${dx}px, 0, 0)`;
        preloadSlot.style.transform = `translate3d(${stageWidth + dx}px, 0, 0)`;

        const progress = Math.min(1, Math.max(0, (-dx - 12) / 48));
        if (stampLeft) {
          stampLeft.style.opacity = String(progress);
          stampLeft.style.transform = `rotate(12deg) scale(${0.85 + progress * 0.2})`;
        }
        if (stampRight) stampRight.style.opacity = '0';

        // P1 触感反馈：滑动达到判定阈值时轻微震动提示
        if ((-dx >= stageWidth * 0.28 || -dx >= 65) && !hasHapticThresholdFired) {
          hasHapticThresholdFired = true;
          if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
        }
      } else {
        // 👉 向右滑动：当前卡跟手向右，下一卡从左侧进入
        activeSlot.style.transform = `translate3d(${dx}px, 0, 0)`;
        preloadSlot.style.transform = `translate3d(${-stageWidth + dx}px, 0, 0)`;

        const progress = Math.min(1, Math.max(0, (dx - 12) / 48));
        if (stampRight) {
          stampRight.style.opacity = String(progress);
          stampRight.style.transform = `rotate(-12deg) scale(${0.85 + progress * 0.2})`;
        }
        if (stampLeft) stampLeft.style.opacity = '0';

        // P1 触感反馈
        if ((dx >= stageWidth * 0.28 || dx >= 65) && !hasHapticThresholdFired) {
          hasHapticThresholdFired = true;
          if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
        }
      }
    }
  }

  function finishSwipeAndCommit(grade, targetX) {
    isAnimating = true;
    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
    const duration = 220;

    activeSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    preloadSlot.style.transition = `transform ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

    activeSlot.style.transform = `translate3d(${targetX}px, 0, 0)`;
    preloadSlot.style.transform = 'translate3d(0, 0, 0)';

    if (grade === 0) {
      triggerHaptic([20, 30, 20]);
      if (window.KaoyanAudio) window.KaoyanAudio.playWarn();
    } else {
      triggerHaptic([10, 20, 25]);
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
    }

    setTimeout(() => {
      commitRateAndSwap(grade, queue[idx]);
      isAnimating = false;
    }, duration);
  }

  function snapBack() {
    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;
    activeSlot.style.transition = 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    preloadSlot.style.transition = 'transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    activeSlot.style.transform = 'translate3d(0, 0, 0)';
    preloadSlot.style.transform = `translate3d(${stageWidth}px, 0, 0)`;

    const stampRight = activeSlot.querySelector('.stamp-right');
    const stampLeft = activeSlot.querySelector('.stamp-left');
    if (stampRight) stampRight.style.opacity = '0';
    if (stampLeft) stampLeft.style.opacity = '0';
  }

  function handleDragEnd(clientX, clientY) {
    if (!isDragging) return;
    isDragging = false;
    const dx = clientX - touchStartX;
    const dy = clientY - touchStartY;
    const dt = Math.max(1, Date.now() - touchStartTime);
    const velocity = Math.abs(dx) / dt;
    const stageWidth = cardBox ? (cardBox.clientWidth || 360) : 360;

    // 1. 双击快速朗读发音
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 280) {
      const now = Date.now();
      if (now - lastTapTime < 320) {
        const w = queue[idx];
        if (w && w.word) playTts(w.word);
      }
      lastTapTime = now;
    }

    // 2. 单击空白处翻转卡片展开详细释义
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 320) {
      if (!shown) {
        reveal();
        dismissGestureGuide();
        return;
      }
    }

    // 3. 左右滑动评分（滑动 > 28% 宽度或甩动速度快时吸附切换，否则弹回）
    const isFastFling = (dt < 320 && Math.abs(dx) > 35 && velocity > 0.4);
    const isOverDist = (Math.abs(dx) >= stageWidth * 0.28 || Math.abs(dx) >= 60);

    if (dragDirection === 'horizontal' && (isFastFling || isOverDist)) {
      dismissGestureGuide();
      if (dx < 0) {
        // 👈 向左滑动：熟记掌握 (grade 3)
        finishSwipeAndCommit(3, -stageWidth);
      } else {
        // 👉 向右滑动：需重背 (grade 0)
        finishSwipeAndCommit(0, stageWidth);
      }
      return;
    }

    // 4. 上下滑动手势 (下滑收藏，上滑展开)
    if (dragDirection === 'vertical' && Math.abs(dy) >= 60 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      if (dy >= 60) {
        handleSwipeDownFavorite();
        dismissGestureGuide();
        return;
      } else if (dy <= -60) {
        if (!shown) {
          reveal();
          dismissGestureGuide();
          return;
        } else {
          const scrollContent = activeSlot ? activeSlot.querySelector('.bb-answer-content') : null;
          if (scrollContent) scrollContent.scrollBy({ top: 140, behavior: 'smooth' });
        }
      }
    }

    // 5. 未达阈值，弹性平滑弹回复位
    if (activeSlot && preloadSlot) {
      snapBack();
    }
  }

  if (cardBox) {
    // 手机端 Touch 触摸事件
    cardBox.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    cardBox.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length === 1) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cardBox.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches.length === 1) {
        handleDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }, { passive: true });

    // 电脑端 Mouse 鼠标拖拽事件
    cardBox.addEventListener('mousedown', function (e) {
      if (e.button !== 0 || e.target.closest('button, a, input, select, textarea, label')) return;
      handleDragStart(e.clientX, e.clientY, e.target);
      const onMouseMove = (me) => handleDragMove(me.clientX, me.clientY);
      const onMouseUp = (me) => {
        handleDragEnd(me.clientX, me.clientY);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    cardBox.addEventListener('click', function (e) {
      if (e.target.closest('button, a, input, label, select, textarea, .spelling-box, .drawer-btn-inline, .autospeak-btn')) return;
      if (!shown) reveal();
    });
  }

  // 同义词预览浮层
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-preview-syn]');
    if (!btn) return;
    const syn = btn.getAttribute('data-preview-syn');
    if (syn) showSynonymPreview(syn);
  });

  (function initDeviceMotionShake() {
    let lastShake = 0;
    window.addEventListener('devicemotion', function (e) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const speed = Math.abs((acc.x || 0) + (acc.y || 0) + (acc.z || 0));
      if (speed > 26 && Date.now() - lastShake > 1500) {
        lastShake = Date.now();
        const pool = words.filter(function(w){ return w.tier === '核心高频'; });
        if (pool.length) {
          const rand = pool[Math.floor(Math.random() * pool.length)];
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

  async function lookupMeaning(w) {
    if (loading) return;
    loading = true;
    const btn = activeSlot ? activeSlot.querySelector('.btn-lookup') : null;
    if (btn) btn.textContent = '在线获取中…';
    try {
      const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w.word));
      if (!r.ok) throw new Error('notfound');
      const d = await r.json();
      const e = d && d[0];
      if (!e) throw new Error('empty');
      const meanings = [];
      (e.meanings || []).slice(0, 3).forEach(m => (m.definitions || []).slice(0, 2).forEach(x => meanings.push((m.partOfSpeech ? m.partOfSpeech + '. ' : '') + (x.definition || ''))));
      w.pos = w.pos || ((e.meanings || [])[0]?.partOfSpeech || '');
      w.phonetic = w.phonetic || e.phonetic || '';
      w.defs = meanings.map(x => ({ pos: '', text: x }));
      w.translation = w.translation || '';
      w.exam_meaning = w.exam_meaning || meanings.slice(0, 2).join('；');
      const ex = (e.meanings || []).flatMap(m => m.definitions || []).find(x => x.example);
      if (ex && !w.example_en) w.example_en = ex.example;
      w._runtimeFetched = Date.now();
      mergeRt(w.word, { pos: w.pos, phonetic: w.phonetic, defs: w.defs, translation: w.translation, exam_meaning: w.exam_meaning, example_en: w.example_en, example_zh: w.example_zh });
      renderCard();
    } catch (e) {
      alert('在线词典暂时无法获取该词。');
    } finally {
      loading = false;
    }
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

  // ---- 电脑与平板端现代全键盘手势映射 (Space/Enter翻转展开，←/1需重背，↓/2待巩固，→/3/Space熟记，V/P发音，R读例句，F收藏，Esc关设置) ----
  window.addEventListener('keydown', function(e) {
    if (e.target.matches('input,textarea,select') || e.target.isContentEditable) return;
    const w = queue[idx];
    if (!w) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!shown) {
        reveal();
      } else {
        animatedRate(3); // 展开后按空格/回车直接标记为熟记并下一词
      }
      return;
    }

    if (!shown) {
      // 未展开时按评分键或方向键，统一先展开释义
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Digit1', 'Digit2', 'Digit3', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        reveal();
        if (window.KaoyanToast) window.KaoyanToast('📖 已为你翻开释义！请核对回忆后左右滑动或按键评分~');
        return;
      }
    } else {
      // 已展开状态：方向键与数字键评分
      if (e.code === 'ArrowLeft' || e.key === '1' || e.code === 'KeyA') {
        e.preventDefault();
        animatedRate(0); // 👈 需重背
        return;
      }
      if (e.code === 'ArrowDown' || e.key === '2' || e.code === 'KeyS') {
        e.preventDefault();
        animatedRate(1); // ⏳ 待巩固
        return;
      }
      if (e.code === 'ArrowRight' || e.key === '3' || e.code === 'KeyD') {
        e.preventDefault();
        animatedRate(3); // 👉 熟记掌握
        return;
      }
    }

    if (e.key === 'v' || e.key === 'V' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (w.word) playTts(w.word);
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const ai = AI_EX[w.word];
      const ex = (ai && ai.en) || w.example_en;
      if (ex) playTts(ex);
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (window.KaoyanQuiz) {
        KaoyanQuiz.toggleFav(w.word);
        renderCard();
      }
      return;
    }
    if (e.key === 'Escape') {
      const drawer = $('drawer');
      if (drawer && !drawer.hidden) drawer.hidden = true;
      return;
    }
  });

  // 🐶 顶部状态栏学伴互动 (Interactive Puppy Companion)
  const puppyWag = $('study-puppy-wag');
  if (puppyWag) {
    const PUPPY_CHEERS = [
      '🦮 小金毛蹭了蹭你的手掌：“主人好棒！今天已拿下 ${done} 词，继续保持！”',
      '🐕‍🦺 边牧小学霸推了推眼镜：“复习与新词平衡得很好，考研 5,619 词势在必得！”',
      '🐺 阿拉斯加兴奋地摇尾巴：“汪汪！风雪无阻！今年考研上岸一定有你！”',
      '🐶 萨摩耶露出招牌微笑：“状态绝佳！多背一个词，初试阅读长难句就多拿一分！”',
      '🐾 柯基伸出毛茸茸爪子：“小短腿大能量，一步一个脚印稳稳考上研究生！”'
    ];
    puppyWag.onclick = function(e) {
      e.stopPropagation();
      triggerHaptic(20);
      const done = state.todayDone || 0;
      const text = PUPPY_CHEERS[Math.floor(Math.random() * PUPPY_CHEERS.length)].replace('${done}', done);
      if (window.KaoyanToast) window.KaoyanToast(text);
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
    };
  }

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

  // P0 撤销按钮全局绑定
  const undoBtn = $('study-undo-btn');
  if (undoBtn) undoBtn.onclick = (e) => { e.stopPropagation(); performUndo(); };

  // P2 操作模式初始化 (滑动模式 / 纯按钮模式 / 拼写模式)
  function initOperateMode() {
    const container = $('drawer-op-modes');
    const savedMode = localStorage.getItem('kao_op_mode') || 'gesture';
    currentOpMode = savedMode;
    if (container) {
      container.querySelectorAll('.clean-pill-btn[data-op-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-op-mode') === currentOpMode);
      });
      container.onclick = (e) => {
        const btn = e.target.closest('.clean-pill-btn[data-op-mode]');
        if (!btn) return;
        const m = btn.getAttribute('data-op-mode');
        if (m) {
          currentOpMode = m;
          localStorage.setItem('kao_op_mode', m);
          container.querySelectorAll('.clean-pill-btn[data-op-mode]').forEach(b => {
            b.classList.toggle('active', b === btn);
          });
          const modeNames = { gesture: '🖐️ 滑动+按键模式', button: '🔘 纯按钮防误触模式', spelling: '✍️ 拼写测验模式' };
          if (window.KaoyanToast) window.KaoyanToast(`已切换为：${modeNames[m] || m}`);
          const d = $('drawer');
          if (d) d.hidden = true;
          renderCard();
        }
      };
    }
  }
  initOperateMode();

  // P1 新手手势引导检查
  checkGestureGuide();

  // 启动词库初始化
  initStudyWords();
})();
