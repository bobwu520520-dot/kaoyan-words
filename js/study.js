(function(){
  'use strict';
  const UID=(window.KaoyanGate&&window.KaoyanGate.currentUser?window.KaoyanGate.currentUser():null)||'owner';
const KEY=(window.KaoyanGate&&window.KaoyanGate.storageKey?window.KaoyanGate.storageKey('kaoyan_study_v3'):'kaoyan_study_v3');
const RT_KEY=(window.KaoyanGate&&window.KaoyanGate.storageKey?window.KaoyanGate.storageKey('kaoyan_runtime_v1'):'kaoyan_runtime_v1'), RT_MAX=1500;
const AI_CACHE_KEY=(window.KaoyanGate&&window.KaoyanGate.storageKey?window.KaoyanGate.storageKey('kaoyan_ai_cache_v2'):'kaoyan_ai_cache_v2');
const DATA_VER_KEY=(window.KaoyanGate&&window.KaoyanGate.storageKey?window.KaoyanGate.storageKey('kaoyan_data_version'):'kaoyan_data_version');
const AI_CFG_KEY=(window.KaoyanGate&&window.KaoyanGate.storageKey?window.KaoyanGate.storageKey('kaoyan_ai_config'):'kaoyan_ai_config');
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
  if(!TIER_LIST.includes(state.tier))state.tier='核心高频'; // 旧数据里的"高频"等失效档位回退
  state.daily=Math.max(10,Math.min(100,Number(state.daily)||100));
  save(); // 跨天重置/损坏修复后立即写回,保证存储与内存一致
  let words=[],queue=[],idx=0,shown=false,loading=false;
  const $=id=>document.getElementById(id);
  function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function apiConfig(){let c={};try{c=JSON.parse(localStorage.getItem(AI_CFG_KEY)||'{}');}catch(e){}return {base:(c.baseUrl||localStorage.getItem('deepseek_base')||'https://api.deepseek.com/v1').replace(/\/$/,''),key:c.apiKey||localStorage.getItem('deepseek_key')||(window.KaoyanGate?window.KaoyanGate.apiKey:'')||'',model:c.model||'deepseek-chat'};}
  // ---- 在线补全结果持久化(避免每次会话重复联网取同一批词) ----
  
  let rtCache={data:{},order:[]};
  try{rtCache=Object.assign(rtCache,JSON.parse(localStorage.getItem(RT_KEY)||'{}'));}catch(e){}
  function saveRt(){while(rtCache.order.length>RT_MAX){delete rtCache.data[rtCache.order.shift()];}try{localStorage.setItem(RT_KEY,JSON.stringify(rtCache));}catch(e){}}
  function mergeRt(word,fields){if(!fields||!Object.keys(fields).length)return;rtCache.data[word]=fields;if(rtCache.order.indexOf(word)<0)rtCache.order.push(word);saveRt();}

  fetch('data/words.json').then(r=>{if(!r.ok)throw new Error('load');return r.json();}).then(d=>{
    words=(d.words||[]).filter(w=>w.active!==false);
    words.forEach(w=>{const c=rtCache.data[w.word];if(c)Object.assign(w,c);}); // 应用历史在线补全
    // ---- 词库版本号:升级后清理已删除词的失效进度 ----
    const DATA_VER=(d.data_version||'1')+'-'+words.length;
    const savedVer=localStorage.getItem(DATA_VER_KEY);
    let staleCleaned=0;
    if(savedVer&&savedVer!==DATA_VER){
      const valid=new Set(words.map(w=>w.word));
      Object.keys(state.progress).forEach(k=>{if(!valid.has(k)){delete state.progress[k];staleCleaned++;}});
      Object.keys(state.hardCount).forEach(k=>{if(!valid.has(k))delete state.hardCount[k];});
      Object.keys(state.history).forEach(k=>{if(k.length!==10)delete state.history[k];});
      save();
    }
    try{localStorage.setItem(DATA_VER_KEY,DATA_VER);}catch(e){}
    // 历史记录只保留最近 90 天
    const cut=new Date();cut.setDate(cut.getDate()-90);
    Object.keys(state.history).forEach(k=>{if(k<cut.toISOString().slice(0,10))delete state.history[k];});
    if(staleCleaned>0){const el=$('upgrade-notice');if(el){el.hidden=false;el.textContent='词库已更新：已清理 '+staleCleaned+' 个已删除词的旧进度';setTimeout(()=>{el.hidden=true;},6000);}}
    renderPlans(); buildQueue(); renderStats(); renderCard();
  }).catch(()=>{$('card').innerHTML='<div class="empty"><h2>词库加载失败</h2><p>请确认 data/words.json 与网页位于同一目录。</p></div>';});

  const tiers=[
    ['核心高频','真题高优先级，必须熟练'],
    ['高频重点','阅读、完形、翻译重点'],
    ['重点扩展','学术、社会、科技等'],
    ['普通扩展','低频与补全词，后期查漏补缺']
  ];
  function renderPlans(){
    const tn=$('tier-name');if(tn)tn.textContent=state.tier;
    $('plans').innerHTML=tiers.map(([t,p])=>{
      const all=words.filter(w=>w.tier===t),eligible=all.filter(w=>w.studyEligible!==false).length,done=all.filter(w=>state.progress[w.word]?.level>=4).length,pc=all.length?Math.round(done/all.length*100):0;
      return `<div class="plan ${state.tier===t?'active':''}" data-tier="${esc(t)}"><h3>${esc(t)}</h3><p>${all.length} 个词 · 已掌握 ${done}</p><p class="small">本地释义完整</p><div class="progress"><i style="width:${pc}%"></i></div></div>`;
    }).join('');
    document.querySelectorAll('.plan').forEach(x=>x.onclick=()=>{state.tier=x.dataset.tier;save();renderPlans();buildQueue();renderCard();});
  }
  // ---- 三级评分:0=陌生 1=模糊 2=认识 ----
  // 陌生→30分钟后当天再现;模糊→1天;认识→3天;
  // 同一词连续"认识"(success)阶梯延长:7天→15天→30天→60天;失败清零。
  const GRADE_MIN=30*60000; // 陌生:30分钟
  const GRADE_DAYS={1:1,2:3};
  function gradeInterval(grade,success){
    const base=GRADE_DAYS[grade];
    if(grade>=2&&success>=5)return 60;
    if(grade>=2&&success>=4)return 30;
    if(grade>=2&&success>=3)return 15;
    if(grade>=2&&success>=2)return 7;
    return base;
  }
  // ---- 薄弱词判定:多次错误/多次遗忘/到期仍不会(旧版"顽固词"hardCount>=3 一并兼容) ----
  function isWeak(w){
    const p=state.progress[w.word];if(!p)return false;
    return (p.wrong||0)>=3||(p.failStreak||0)>=3||(state.hardCount[w.word]||0)>=3;
  }
  function buildQueue(){
    const pool=words.filter(w=>w.tier===state.tier);
    const now=Date.now();
    const need=Math.min(Number(state.daily)||100,100);
    // 优先级:到期复习词 → 薄弱词 → 新词;同优先级内部随机,不同优先级不混排
    const due=pool.filter(w=>isDue(w,now));
    const weak=pool.filter(w=>!isDue(w,now)&&isWeak(w));
    const unseen=pool.filter(w=>!state.progress[w.word]||state.progress[w.word].level<1);
    const picked=new Set();
    const selected=[];
    for(const list of [due,weak,unseen]){
      if(selected.length>=need)break;
      for(const w of shuffle(list)){
        if(selected.length>=need)break;
        if(picked.has(w.word))continue;
        selected.push(w);picked.add(w.word);
      }
    }
    // 仍不满时从全池补齐(已学的也可再练)
    if(selected.length<need){for(const w of shuffle(pool)){if(selected.length>=need)break;if(picked.has(w.word))continue;selected.push(w);picked.add(w.word);}}
    queue=selected.slice(0,100);idx=0;shown=false;renderQueue();
  }
  function isDue(w,now){const n=state.progress[w.word]?.next;return typeof n==='number'&&n<=now;}
  function renderQueue(){const q=$('queue');if(!q)return;q.innerHTML=queue.map((w,i)=>`<button class="qdot ${i===idx?'current':''} ${state.progress[w.word]?.level>=4?'done':''}" data-i="${i}">${i+1}</button>`).join('');q.querySelectorAll('button').forEach(b=>b.onclick=()=>{idx=+b.dataset.i;shown=false;renderQueue();renderCard();});}
  function renderStats(){
    const mastered=words.filter(w=>state.progress[w.word]?.level>=4).length;
    const due=words.filter(w=>state.progress[w.word]?.next&&state.progress[w.word].next<=Date.now()).length;
    $('today').textContent=state.todayDone;$('mastered').textContent=mastered;$('due').textContent=due;$('daily').value=state.daily;
    const weakN=words.filter(w=>isWeak(w)&&(state.progress[w.word]?.level||0)<4).length;
    if($('weak'))$('weak').textContent=weakN;
    renderStreak();
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
  function renderCard(){
    const w=queue[idx];
    if(!w){$('card').innerHTML='<div class="empty"><h2>本组完成 🎉</h2><p>已完成这一组，可以继续下一组。</p><button class="btn primary" id="next-group">下一组</button></div>';if($('next-group'))$('next-group').onclick=()=>{buildQueue();renderCard();};return;}
    const p=w.pos||'—'; const meaning=w.exam_meaning||w.translation||''; const ex=w.example_en||'';
    if(!shown){
      $('card').innerHTML=`<div class="s-front"><div class="s-word">${esc(w.word)}</div><div class="s-phonetic">${esc(w.phonetic||'')}</div><button class="btn primary s-reveal" id="show">点击显示释义</button><div class="s-hint">评分后自动显示释义例句 · 1 陌生 / 2 模糊 / 3 认识</div></div>`;
    }else{
      const setEx=settings().example;
      $('card').innerHTML=`<div class="s-back">
        <div class="s-back-head"><span class="s-word-mini">${esc(w.word)}</span>${w.phonetic?`<span class="s-phonetic-mini">${esc(w.phonetic)}</span>`:''}</div>
        <div class="s-meaning">${esc(meaning||'暂无释义')}</div>
        <div class="s-meta">${esc(p)} · ${esc(w.true_priority||'')} · ${esc(w.tier||'')}</div>
        ${w.secondary_meanings?`<div class="s-obscure">熟词僻义：${esc(w.secondary_meanings)}</div>`:''}
        ${setEx!==false?`<div class="s-detail"><strong>高频搭配</strong>${esc(w.collocation_hint||'可用 AI 生成并核验')}</div>
        <div class="s-detail"><strong>例句</strong><div>${esc(ex||'暂无离线例句')}</div>${w.example_zh?`<div class="zh">${esc(w.example_zh)}</div>`:''}</div>`:''}
        ${w.ai_long_sentence?`<div class="s-detail"><strong>语法结构</strong>${esc(w.ai_long_sentence)}</div>`:''}
        <div class="s-actions"><button class="btn" id="lookup">📖 在线词典</button><button class="btn" id="ai">✨ AI 造句</button>${autoAdvance?`<button class="btn primary" id="continue">继续 ▸</button>`:''}</div>
        ${autoAdvance?`<div class="answer-bar"><span class="ab-tip">已评分，${Math.max(1,Math.round(ADVANCE_MS/1000))} 秒后自动下一词</span></div>`:''}
      </div>`;
      if($('lookup'))$('lookup').onclick=()=>lookupMeaning(w);
      if($('ai'))$('ai').onclick=()=>ai(w);
      if($('continue'))$('continue').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}nextWord();};
      if(autoAdvance){if(advanceTimer)clearTimeout(advanceTimer);advanceTimer=setTimeout(()=>{advanceTimer=null;nextWord();},ADVANCE_MS);}
    }
    if($('show'))$('show').onclick=()=>{shown=true;renderCard();if(!meaning)lookupMeaning(w);};
  }
  async function lookupMeaning(w){
    if(loading)return;loading=true;const btn=$('lookup');if(btn)btn.textContent='在线获取中…';
    try{const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(w.word));if(!r.ok)throw new Error('notfound');const d=await r.json();const e=d&&d[0];if(!e)throw new Error('empty');const meanings=[];(e.meanings||[]).slice(0,3).forEach(m=>(m.definitions||[]).slice(0,2).forEach(x=>meanings.push((m.partOfSpeech?m.partOfSpeech+'. ':'')+(x.definition||''))));w.pos=w.pos||((e.meanings||[])[0]?.partOfSpeech||'');w.phonetic=w.phonetic||e.phonetic||'';w.defs=meanings.map(x=>({pos:'',text:x}));w.translation=w.translation||'';w.exam_meaning=w.exam_meaning||meanings.slice(0,2).join('；');const ex=(e.meanings||[]).flatMap(m=>m.definitions||[]).find(x=>x.example);if(ex&&!w.example_en)w.example_en=ex.example;w._runtimeFetched=Date.now();mergeRt(w.word,{pos:w.pos,phonetic:w.phonetic,defs:w.defs,translation:w.translation,exam_meaning:w.exam_meaning,example_en:w.example_en,example_zh:w.example_zh});renderCard();}catch(e){alert('在线词典暂时无法获取该词。可以直接点击“AI 长难句 + 搭配”让 DeepSeek 补全。');}finally{loading=false;}
  }
  async function ai(w){
    const cfg=apiConfig(); if(!window.KaoyanGate){alert('初始化失败，请刷新页面。');return;}
    const b=$('ai');if(b){b.disabled=true;b.textContent='AI 生成中…';}
    let cache={};try{cache=JSON.parse(localStorage.getItem(AI_CACHE_KEY)||'{}');}catch(e){}
    if(cache[w.word]){Object.assign(w,cache[w.word]);shown=true;renderCard();return;}
    const prompt=`你是考研英语一词汇教师。单词：${w.word}；词性：${w.pos||'未知'}；现有释义：${w.exam_meaning||w.translation||'未知'}。请严格输出JSON：{"meaning":"最值得考研掌握的中文义项","obscure":"可靠的熟词僻义，没有可靠僻义则空","collocations":["搭配1","搭配2","搭配3"],"sentence":"28-45词自然的英语一阅读风格长难句，必须正确使用该词","translation":"准确中文翻译","structure":"一句话语法结构分析"}。不要编造词义；若词为普通扩展词，也必须优先给常见、真实的英语义项。`;
    try{
      const body=JSON.stringify({model:cfg.model||'deepseek-chat',messages:[{role:'system',content:'只输出合法JSON，不要Markdown。'},{role:'user',content:prompt}],temperature:.25,max_tokens:650});
      const custom=window.KaoyanGate.getCustom?window.KaoyanGate.getCustom():null;
      const raw=await window.KaoyanGate.chat(body,custom);
      const data=JSON.parse(raw);let c=data.choices?.[0]?.message?.content||'{}';c=c.replace(/^```json\s*/i,'').replace(/```$/,'').trim();const o=JSON.parse(c);w.exam_meaning=o.meaning||w.exam_meaning;w.secondary_meanings=o.obscure||w.secondary_meanings;w.collocation_hint=(o.collocations||[]).join(' · ');w.example_en=o.sentence||w.example_en;w.example_zh=o.translation||w.example_zh;w.ai_long_sentence=o.structure||'';cache[w.word]={exam_meaning:w.exam_meaning,secondary_meanings:w.secondary_meanings,collocation_hint:w.collocation_hint,example_en:w.example_en,example_zh:w.example_zh,ai_long_sentence:w.ai_long_sentence};localStorage.setItem(AI_CACHE_KEY,JSON.stringify(cache));shown=true;renderCard();}catch(e){alert('AI生成失败，请检查网络后重试。');}finally{if($('ai')){$('ai').disabled=false;$('ai').textContent='✨ AI 造句';}}
  }
  // ---- 设置(背景/字号/发音/例句等,与 study.html 设置面板共享) ----
  let autoAdvance=false,advanceTimer=null; const ADVANCE_MS=2800;
  function settings(){let s={};try{s=JSON.parse(localStorage.getItem('kaoyan_settings')||'{}');}catch(e){}return s;}
  function speakWord(w){
    try{
      const s=settings(); if(!s.speak)return;
      if(!window.speechSynthesis)return;
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(w.word);u.lang='en-US';u.rate=.85;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  function nextWord(){autoAdvance=false;idx++;shown=false;if(idx>=queue.length){buildQueue();renderPlans();}renderQueue();renderCard();}
  function rate(grade){
    const w=queue[idx];if(!w)return;
    const p=state.progress[w.word]||{level:0,wrong:0,failStreak:0,success:0};
    if(grade>=2){ // 认识
      p.level=Math.min(6,(p.level||0)+1);p.success=(p.success||0)+1;p.failStreak=0;
      p.next=Date.now()+gradeInterval(grade,p.success)*86400000;
      if(!state.todaySeen[w.word]){state.todayDone++;state.todaySeen[w.word]=1;}
    }else if(grade===1){ // 模糊
      p.level=Math.max(1,(p.level||0));p.success=0;p.failStreak=0;
      p.next=Date.now()+GRADE_DAYS[1]*86400000;
    }else{ // 不认识:当天再现
      p.level=0;p.success=0;p.failStreak=(p.failStreak||0)+1;p.wrong=(p.wrong||0)+1;
      p.next=Date.now()+GRADE_MIN;
      state.hardCount[w.word]=(state.hardCount[w.word]||0)+1; // 兼容旧"顽固词"统计
    }
    p.last=Date.now();state.progress[w.word]=p;save();renderStats();
    // 评分后直接显示释义例句(无需手动翻面),2.8 秒后自动下一词
    autoAdvance=true;shown=true;renderQueue();renderCard();speakWord(w);
  }
  $('grade0').onclick=()=>rate(0);$('grade1').onclick=()=>rate(1);$('grade2').onclick=()=>rate(2);
  $('next').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;idx=Math.min(queue.length-1,idx+1);shown=false;renderQueue();renderCard();};
  $('prev').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;idx=Math.max(0,idx-1);shown=false;renderQueue();renderCard();};
  $('shuffle').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;buildQueue();renderCard();};
  $('start').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;shown=false;renderCard();};
  $('review').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;const pool=words.filter(w=>isDue(w,Date.now()));queue=shuffle(pool).slice(0,100);idx=0;shown=false;renderQueue();renderCard();};
  $('weak-btn').onclick=()=>{if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}autoAdvance=false;const pool=words.filter(w=>isWeak(w)&&(state.progress[w.word]?.level||0)<4);queue=shuffle(pool).slice(0,100);idx=0;shown=false;renderQueue();renderCard();};
  $('daily').onchange=e=>{state.daily=Math.max(10,Math.min(100,+e.target.value||100));save();buildQueue();renderCard();};
  function exportProgress(){const payload={version:3,exportedAt:new Date().toISOString(),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kaoyan-study-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  function importProgress(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>{const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p.version&&p.version!==3)throw new Error('version');const incoming=p.state||p;if(!incoming.progress||typeof incoming.progress!=='object')throw new Error('invalid');const today=state.today,todayDone=state.todayDone,todaySeen=state.todaySeen;state=Object.assign(state,incoming);state.progress=state.progress||{};state.today=today;state.todayDone=todayDone;state.todaySeen=todaySeen;save();location.reload();}catch(e){alert('进度文件无效。');}};r.readAsText(f);};input.click();}
  if($('export-progress'))$('export-progress').onclick=exportProgress;if($('import-progress'))$('import-progress').onclick=importProgress;
  window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,button,select'))return;if(e.code==='Space'){e.preventDefault();if($('show'))$('show').click();else if(autoAdvance&&$('continue'))$('continue').click();else if($('card'))renderCard();}else if(['1','2','3'].includes(e.key)&&!e.ctrlKey&&!e.metaKey){e.preventDefault();rate(Number(e.key)-1);}});
  // 页面挂机跨过零点时,回到页面自动切到新一天
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.today!==localDay()){if(state.todayDone>0)state.history[state.today]=state.todayDone;state.today=localDay();state.todayDone=0;state.todaySeen={};save();renderStats();}});
  // 暴露给 study.html 设置面板
  window.__studyRenderCard=renderCard;window.__studyDaily=()=>state.daily;window.__studySetDaily=n=>{state.daily=Math.max(10,Math.min(100,+n||100));save();buildQueue();renderCard();};
})();
