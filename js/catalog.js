/* 考研词汇 — 词库浏览、多选与 AI 多词造句。 */
(function () {
  'use strict';
  var WORDS = [], filtered = [], shown = 0;
  var PAGE = parseInt(localStorage.getItem('cat_page_size') || '48', 10) || 48;
  var activeFilter='all', activeLetter='', searchQ='', dataFilters={};
  var selected = {}, studyState = {};
  var listEl=document.getElementById('catalog-list'), countPill=document.getElementById('count-pill'), filterInput=document.getElementById('filter-input'), filterChips=document.getElementById('filter-chips'), dataFilterChips=document.getElementById('data-filter-chips'), letterIndex=document.getElementById('letter-index'), loadMore=document.getElementById('load-more'), loadMoreBtn=document.getElementById('load-more-btn'), descEl=document.getElementById('catalog-desc');
  var panel=document.getElementById('selection-panel'), selectedCount=document.getElementById('selected-count'), selectedWords=document.getElementById('selected-words'), multiBtn=document.getElementById('multi-ai-btn'), clearBtn=document.getElementById('clear-selected'), selectVisibleBtn=document.getElementById('select-visible'), modal=document.getElementById('multi-modal'), resultEl=document.getElementById('multi-result'), subtitle=document.getElementById('multi-subtitle'), copyBtn=document.getElementById('multi-copy');

  // ---- 内置 AI 例句（与查词页共用同一份本地数据，离线可用） ----
  var AI={};
  if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) {
    Object.keys(window.__AI_EXAMPLES__.s).forEach(function(k){
      AI[k] = { en: window.__AI_EXAMPLES__.s[k][0], zh: window.__AI_EXAMPLES__.s[k][1] };
    });
  } else {
    var axhr=new XMLHttpRequest(); axhr.open('GET','data/ai_examples.json',true); axhr.onload=function(){ if(axhr.status===200 || axhr.status===0){ try{ var s=JSON.parse(axhr.responseText).s||{}; Object.keys(s).forEach(function(k){ AI[k]={en:s[k][0],zh:s[k][1]}; }); }catch(e){} } }; axhr.send();
  }

  function initCatalog() {
    function onWordsReady(wdata) {
      WORDS = (wdata.words || []).filter(function(w){ return w.active !== false; });
      window.__ALL_WORDS__ = WORDS;
      WORDS.sort(function(a,b){return a.word.localeCompare(b.word);});
      if (descEl) descEl.textContent = WORDS.length + ' 词 · 支持筛选、搜索与多选对照例句';
      updateChipCounts();
      try { studyState = JSON.parse(localStorage.getItem('kaoyan_study_v3')||'{}').progress || {}; } catch(e) { studyState = {}; }
      try {
        var q0 = new URLSearchParams(location.search);
        var tier = q0.get('tier');
        if (tier && WORDS.some(function(w){return w.tier===tier;})) {
          activeFilter = tier;
          filterChips.querySelectorAll('.filter-chip').forEach(function(x){x.classList.toggle('active', x.getAttribute('data-filter')===tier);});
        }
        var flt = q0.get('filter');
        if (flt) {
          var fc = dataFilterChips.querySelector('[data-filter="'+flt+'"]');
          if (fc) { dataFilters[flt]=true; fc.classList.add('active'); dataFilterChips.querySelector('[data-filter="all"]').classList.remove('active'); }
        }
        var q1 = q0.get('q');
        if (q1) { searchQ = q1.toLowerCase(); filterInput.value = q1; }
      } catch(e) {}
      buildLetterIndex(); applyFilters(); updateProgressBanner();
    }

    if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words && window.__WORDS_DATA__.words.length > 0) {
      onWordsReady(window.__WORDS_DATA__);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/words.json', true);
    xhr.onload = function () {
      if ((xhr.status === 200 || xhr.status === 0) && xhr.responseText) {
        try {
          var d = JSON.parse(xhr.responseText);
          onWordsReady(d);
          return;
        } catch(e) {}
      }
      if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
        onWordsReady(window.__WORDS_DATA__);
      } else {
        listEl.innerHTML = '<div class="catalog-empty"><h2>词库加载失败</h2><p>请点击下方刷新重试</p><button class="btn primary" onclick="location.reload()" type="button" style="margin-top:12px;padding:8px 18px;border-radius:8px;background:var(--color-primary);color:#fff;border:none;cursor:pointer">重新加载 ↻</button></div>';
      }
    };
    xhr.onerror = function() {
      if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
        onWordsReady(window.__WORDS_DATA__);
      } else {
        listEl.innerHTML = '<div class="catalog-empty"><h2>词库加载失败</h2><p>请点击下方刷新重试</p><button class="btn primary" onclick="location.reload()" type="button" style="margin-top:12px;padding:8px 18px;border-radius:8px;background:var(--color-primary);color:#fff;border:none;cursor:pointer">重新加载 ↻</button></div>';
      }
    };
    xhr.send();
  }
  initCatalog();

  var studyState = {};
  // 筛选标签显示各层词数，方便判断规模
  function updateChipCounts(){
    var counts={all:0, synonyms:0}; WORDS.forEach(function(w){ if(w.active===false) return; counts.all++; counts[w.tier]=(counts[w.tier]||0)+1; if(w.synonyms) counts.synonyms++; });
    filterChips.querySelectorAll('.filter-chip').forEach(function(c){
      var k=c.getAttribute('data-filter'); if(counts[k]) c.textContent=c.getAttribute('data-filter')==='all'?'全部词 ('+counts.all+')':c.getAttribute('data-filter')+' ('+counts[k]+')';
    });
    var synChip = dataFilterChips ? dataFilterChips.querySelector('[data-filter="synonyms"]') : null;
    if (synChip && counts.synonyms) synChip.textContent = '🔄 同义替换 · ' + counts.synonyms;
  }

  function updateProgressBanner() {
    var progLabel = document.getElementById('cat-prog-label');
    var progBar = document.getElementById('cat-prog-bar');
    if (!progLabel && !progBar) return;
    var total = WORDS.length || 5619;
    var masteredCount = 0;
    Object.keys(studyState).forEach(function(k) {
      var item = studyState[k];
      if (item && item.level >= 4) masteredCount++;
    });
    var favCount = 0;
    if (window.KaoyanQuiz && KaoyanQuiz.favCount) {
      favCount = KaoyanQuiz.favCount();
    } else {
      try { favCount = (JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]')).length; } catch(e){}
    }
    var pct = Math.round((masteredCount / total) * 100);
    if (progLabel) progLabel.textContent = '📊 词库总览：已熟记掌握 ' + masteredCount + '/' + total + ' 词 (' + pct + '%) · ⭐ 生词本 ' + favCount + ' 词';
    if (progBar) progBar.style.width = pct + '%';
  }

  function buildLetterIndex(){var present={}; WORDS.forEach(function(w){present[(w.word[0]||'#').toUpperCase()]=true;}); letterIndex.innerHTML='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function(L){var has=!!present[L];return '<button type="button" class="'+(has?'':'empty')+'" data-letter="'+L+'"'+(has?'':' disabled')+'>'+L+'</button>';}).join('');}
  letterIndex.addEventListener('click',function(e){var b=e.target.closest('button[data-letter]');if(!b||b.disabled)return;var L=b.getAttribute('data-letter');activeLetter=activeLetter===L?'':L;letterIndex.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-letter')===activeLetter);});applyFilters();});

  // 移动端字母导航滑动索引 (Touch-drag letter index)
  var isDraggingLetter = false;
  function handleLetterTouch(touch) {
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    var btn = el ? el.closest('button[data-letter]') : null;
    if (btn && !btn.disabled) {
      var L = btn.getAttribute('data-letter');
      if (L && L !== activeLetter) {
        activeLetter = L;
        letterIndex.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active', x.getAttribute('data-letter') === activeLetter); });
        applyFilters();
        if (window.KaoyanToast) window.KaoyanToast('字母 ' + L);
        if (navigator.vibrate) try { navigator.vibrate(10); } catch(e){}
      }
    }
  }
  letterIndex.addEventListener('touchstart', function(e) {
    if (e.touches && e.touches.length === 1) {
      isDraggingLetter = true;
      handleLetterTouch(e.touches[0]);
    }
  }, { passive: true });
  letterIndex.addEventListener('touchmove', function(e) {
    if (isDraggingLetter && e.touches && e.touches.length === 1) {
      handleLetterTouch(e.touches[0]);
    }
  }, { passive: true });
  letterIndex.addEventListener('touchend', function() { isDraggingLetter = false; }, { passive: true });
  filterChips.addEventListener('click',function(e){var c=e.target.closest('.filter-chip');if(!c)return;activeFilter=c.getAttribute('data-filter');filterChips.querySelectorAll('.filter-chip').forEach(function(x){x.classList.toggle('active',x===c);});applyFilters();});
  dataFilterChips.addEventListener('click',function(e){var c=e.target.closest('.filter-chip');if(!c)return;var k=c.getAttribute('data-filter');if(k==='all'){dataFilters={};dataFilterChips.querySelectorAll('.filter-chip').forEach(function(x){x.classList.toggle('active',x===c);});}else{dataFilterChips.querySelector('[data-filter="all"]').classList.remove('active');dataFilters[k]=!dataFilters[k];c.classList.toggle('active',dataFilters[k]);}applyFilters();});
  var sortChips = document.getElementById('sort-chips');
  if (sortChips) {
    sortChips.addEventListener('click', function(e) {
      var c = e.target.closest('.filter-chip');
      if (!c) return;
      sortBy = c.getAttribute('data-sort') || 'alpha';
      sortChips.querySelectorAll('.filter-chip').forEach(function(x) { x.classList.toggle('active', x === c); });
      applyFilters();
      if (window.KaoyanToast) window.KaoyanToast('排序方式：' + c.textContent.trim());
    });
  }
  var filterClearBtn = document.getElementById('filter-clear-btn');
  if (filterClearBtn) {
    filterClearBtn.addEventListener('click', function() {
      filterInput.value = '';
      searchQ = '';
      filterClearBtn.style.display = 'none';
      filterInput.focus();
      applyFilters();
    });
  }
  var debounce;
  filterInput.addEventListener('input', function() {
    clearTimeout(debounce);
    if (filterClearBtn) {
      filterClearBtn.style.display = filterInput.value ? 'inline-block' : 'none';
    }
    debounce = setTimeout(function() {
      searchQ = filterInput.value.trim().toLowerCase();
      applyFilters();
    }, 120);
  });
  window.addEventListener('keydown',function(e){
    if(e.target.matches('input,textarea,select')){
      if(e.key==='Escape'){filterInput.value='';searchQ='';if(filterClearBtn)filterClearBtn.style.display='none';filterInput.blur();applyFilters();}
      return;
    }
    if(e.key==='/'){e.preventDefault();filterInput.focus();filterInput.select();}
  });

  function hasData(w,k){
    switch(k){
      case 'star5': return (w.true_priority || '').indexOf('★★★★★') !== -1;
      case 'star4': return (w.true_priority || '').indexOf('★★★★') !== -1;
      case 'fav': return window.KaoyanQuiz && KaoyanQuiz.isFav(w.word);
      case 'weak': {
        var prog = (studyState && (studyState[w.word] || (studyState.progress && studyState.progress[w.word]))) || {};
        return (prog.wrong && prog.wrong >= 1) || (prog.failStreak && prog.failStreak >= 1) || (studyState.hardCount && studyState.hardCount[w.word] >= 1);
      }
      case 'tag_exam': return !!w.exam_tag;
      case 'synonyms': return !!(w.synonyms || w.antonyms);
      case 'secondary': return !!(w.secondary_meanings&&w.secondary_meanings.length);
      case 'aiex': return !!AI[w.word];
      case 'root': return !!(w.root&&w.root.length);
      case 'pos_n': return /^(n|noun)/i.test(w.pos||'');
      case 'pos_v': return /^(v|verb)/i.test(w.pos||'');
      case 'pos_adj': return /^adj/i.test(w.pos||'');
      case 'pos_adv': return /^adv/i.test(w.pos||'');
      case 'mastered': return !!(studyState[w.word]&&studyState[w.word].level>=4);
      case 'unmastered': return !(studyState[w.word]&&studyState[w.word].level>=4);
    }
    return true;
  }

  var sortBy='alpha';
  function tierW(w){return w.tier==='核心高频'?4:w.tier==='高频重点'?3:w.tier==='重点扩展'?2:1;}
  function starW(w){return ((w.true_priority||'').match(/★/g)||[]).length;}
  function isM(w){return !!(studyState[w.word]&&studyState[w.word].level>=4);}
  function applySort(){
    if(sortBy==='freq') filtered.sort(function(a,b){return starW(b)-starW(a)||tierW(b)-tierW(a)||a.word.localeCompare(b.word);});
    else if(sortBy==='todo') filtered.sort(function(a,b){return (isM(a)?1:0)-(isM(b)?1:0)||starW(b)-starW(a)||tierW(b)-tierW(a)||a.word.localeCompare(b.word);});
    else filtered.sort(function(a,b){return a.word.localeCompare(b.word);});
  }
  function hlMatch(text, query) {
    if (!query || !text) return esc(text);
    var str = esc(text);
    var qEsc = escReg(query);
    var re = new RegExp('(' + qEsc + ')', 'gi');
    return str.replace(re, '<mark class="cat-mark">$1</mark>');
  }

  var curPage = 1;
  var prevPageBtn = document.getElementById('cat-prev-page');
  var nextPageBtn = document.getElementById('cat-next-page');
  var pageIndicator = document.getElementById('cat-page-indicator');

  function updatePagination() {
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
    if (pageIndicator) pageIndicator.textContent = '第 ' + curPage + ' / ' + totalPages + ' 页 · 共 ' + filtered.length + ' 词';
    if (prevPageBtn) prevPageBtn.disabled = curPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = curPage >= totalPages;
    if (loadMoreBtn) {
      loadMoreBtn.style.display = shown >= filtered.length ? 'none' : 'inline-flex';
      loadMoreBtn.textContent = '加载更多（余 ' + Math.max(0, filtered.length - shown) + '）';
    }
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
      if (curPage > 1) {
        curPage--;
        shown = (curPage - 1) * PAGE;
        listEl.innerHTML = '';
        renderPage();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
      if (curPage < totalPages) {
        curPage++;
        shown = (curPage - 1) * PAGE;
        listEl.innerHTML = '';
        renderPage();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      renderPage();
      curPage = Math.ceil(shown / PAGE);
      updatePagination();
    });
  }

  var pageSizeSelect = document.getElementById('cat-page-size');
  if (pageSizeSelect) {
    var savedPageSize = localStorage.getItem('cat_page_size') || '48';
    pageSizeSelect.value = savedPageSize;
    PAGE = parseInt(savedPageSize, 10) || 48;
    pageSizeSelect.addEventListener('change', function() {
      PAGE = parseInt(pageSizeSelect.value, 10) || 48;
      localStorage.setItem('cat_page_size', String(PAGE));
      applyFilters();
      if (window.KaoyanToast) window.KaoyanToast('📄 已调整为每页显示 ' + PAGE + ' 词');
    });
  }

  var jumpInput = document.getElementById('cat-jump-input');
  var jumpBtn = document.getElementById('cat-jump-btn');
  if (jumpBtn && jumpInput) {
    var doJump = function() {
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
      var targetPage = parseInt(jumpInput.value, 10);
      if (isNaN(targetPage) || targetPage < 1) targetPage = 1;
      if (targetPage > totalPages) targetPage = totalPages;
      curPage = targetPage;
      shown = (curPage - 1) * PAGE;
      listEl.innerHTML = '';
      renderPage();
      updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      jumpInput.value = '';
      if (window.KaoyanToast) window.KaoyanToast('📄 已跳转至第 ' + curPage + ' 页');
    };
    jumpBtn.addEventListener('click', doJump);
    jumpInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doJump(); });
  }

  function applyFilters(){var keys=Object.keys(dataFilters).filter(function(k){return dataFilters[k];});filtered=WORDS.filter(function(w){if(w.active===false)return false;if(activeFilter!=='all'&&w.tier!==activeFilter)return false;if(activeLetter&&w.word[0].toUpperCase()!==activeLetter)return false;for(var i=0;i<keys.length;i++){if(!hasData(w,keys[i]))return false;}var tr=String(w.translation||'').toLowerCase();return !searchQ||(w.word.indexOf(searchQ)>-1||tr.indexOf(searchQ)>-1);});applySort();shown=0;curPage=1;listEl.innerHTML='';renderPage();updatePagination();countPill.textContent='显示 '+filtered.length+' 词';}
  function renderPage(){
    var frag=document.createDocumentFragment(),end=Math.min(shown+PAGE,filtered.length);
    for(var i=shown;i<end;i++){
      var w=filtered[i],wrap=document.createElement('div');
      wrap.className='cat-row-wrap';
      wrap.setAttribute('data-word-row', w.word);
      var checked=!!selected[w.word];
      var mastered=studyState[w.word]&&studyState[w.word].level>=4;
      var def=w.exam_meaning||w.translation||'点击查看真题考点与详细释义';

      var lvl = (studyState[w.word] && studyState[w.word].level) || 0;
      var lvlText = lvl >= 4 ? 'Lv.4 已熟记 ★' : lvl === 3 ? 'Lv.3 掌握' : lvl === 2 ? 'Lv.2 熟悉' : lvl === 1 ? 'Lv.1 接触' : 'Lv.0 新词';
      var lvlClass = lvl >= 4 ? 'mastered' : lvl >= 2 ? 'familiar' : 'new';
      var lvlHtml = '<span class="cat-chip lvl ' + lvlClass + '">' + lvlText + '</span>';

      var synHtml = w.synonyms ? '<span class="cat-chip syn" title="同义替换：'+esc(w.synonyms)+'">🔄 '+esc(w.synonyms.split(',')[0].trim())+'</span>' : '';
      var examHtml = w.exam_tag ? '<span class="cat-chip exam">'+esc(w.exam_tag)+'</span>' : '';
      var aiHtml = AI[w.word] ? '<span class="cat-chip ai" title="内置 AI 真题例句">AI</span>' : '';
      var tierHtml = w.tier ? '<span class="cat-chip tier">'+esc(w.tier)+'</span>' : '';
      var starHtml = w.true_priority ? '<span class="cat-chip stars">'+esc(w.true_priority)+'</span>' : '';

      wrap.innerHTML =
        '<div class="cat-card-header">' +
          '<div class="cat-card-left">' +
            (mastered ? '<span class="done-tick" title="已掌握">✓</span>' : '') +
            '<label class="word-check" title="选择单词"><input type="checkbox" data-select-word="'+esc(w.word)+'" '+(checked?'checked':'')+' aria-label="选择 '+esc(w.word)+'"><span></span></label>' +
            (window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : '') +
            '<a class="cat-card-word" href="index.html?w='+encodeURIComponent(w.word)+'" title="查看单词真题详解">'+hlMatch(w.word, searchQ)+'</a>' +
            (w.pos ? '<span class="cat-card-pos">'+esc(posShort(w.pos))+'</span>' : '') +
            (w.phonetic ? '<span class="cat-card-phonetic">'+esc(w.phonetic)+'</span>' : '') +
          '</div>' +
          '<div class="cat-card-right">' +
            '<button class="icon-btn-mini audio-speak-btn" data-speak="'+esc(w.word)+'" type="button" title="朗读发音" aria-label="朗读">🔊</button>' +
            '<a class="icon-btn-mini" href="study.html?w='+encodeURIComponent(w.word)+'" title="在背单词中学习" aria-label="背单词">📖</a>' +
            '<button class="cat-expand-btn" data-expand-word="'+esc(w.word)+'" type="button" title="展开例句与同义词" aria-label="展开详情">▼</button>' +
          '</div>' +
        '</div>' +
        '<div class="cat-card-badges">' +
          lvlHtml + tierHtml + starHtml + synHtml + examHtml + aiHtml +
        '</div>' +
        '<a class="cat-card-meaning" href="index.html?w='+encodeURIComponent(w.word)+'" title="点击查看深度真题解析">' +
          hlMatch(def, searchQ) +
        '</a>';

      frag.appendChild(wrap);
    }
    listEl.appendChild(frag);
    shown=end;
    updatePagination();
    if(!filtered.length)listEl.innerHTML='<div class="catalog-empty">没有符合条件的单词</div>';
  }

  // 词库列表点击展开内嵌详情 (Inline Accordion)
  listEl.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-expand-word]');
    if (!btn) return;
    var word = btn.getAttribute('data-expand-word');
    var rowWrap = btn.closest('.cat-row-wrap');
    if (!rowWrap) return;
    
    var existing = rowWrap.nextElementSibling;
    if (existing && existing.classList.contains('cat-inline-detail') && existing.getAttribute('data-for-word') === word) {
      existing.remove();
      btn.classList.remove('active');
      btn.textContent = '▼';
      return;
    }
    
    // 收起其他展开的
    document.querySelectorAll('.cat-inline-detail').forEach(function(d) { d.remove(); });
    document.querySelectorAll('.cat-expand-btn').forEach(function(b) { b.classList.remove('active'); b.textContent = '▼'; });

    var w = WORDS.find(function(item) { return item.word === word; });
    if (!w) return;

    btn.classList.add('active');
    btn.textContent = '▲';

    var ai = AI[w.word];
    var ex = (ai && ai.en) || w.example_en || '';
    var exZh = (ai && ai.zh) || w.example_zh || '';
    var def = w.exam_meaning || w.translation || '';

    var detailEl = document.createElement('div');
    detailEl.className = 'cat-inline-detail';
    detailEl.setAttribute('data-for-word', word);
    
    var synHtml = w.synonyms ? '<div style="margin-top:4px"><strong style="color:var(--color-primary);font-size:12px">🔄 考研同义改写：</strong> ' + 
      w.synonyms.split(',').map(function(s) { 
        var st = s.trim(); 
        return '<a class="syn-chip" href="index.html?w=' + encodeURIComponent(st) + '" target="_blank" style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:6px;font-size:12px;text-decoration:none;color:var(--color-primary)">' + esc(st) + '</a>'; 
      }).join('') + '</div>' : '';

    var secHtml = w.secondary_meanings ? '<div style="margin-top:4px;color:var(--color-accent);font-size:12px"><strong>⚡ 熟词僻义：</strong> ' + esc(w.secondary_meanings) + '</div>' : '';
    var rootHtml = w.root ? '<div style="margin-top:4px;color:var(--color-text-muted);font-size:12px"><strong>🌱 词根助记：</strong> ' + esc(w.root) + '</div>' : '';

    var exHtml = ex ? '<div class="sentence" style="margin-top:6px;padding:8px 12px;background:var(--color-surface);border-left:3px solid var(--color-primary);border-radius:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><strong style="font-size:11px;color:var(--color-primary)">📖 考研真题长难句语境</strong><button class="audio-btn" data-speak="' + esc(ex) + '" type="button" aria-label="朗读例句" title="朗读考研例句" style="width:22px;height:22px;font-size:11px">🔊</button></div><div style="font-size:13px;line-height:1.5">' + highlight(ex, [w.word]) + '</div><div class="zh" style="font-size:12px;color:var(--color-text-muted);margin-top:3px">' + esc(exZh) + '</div></div>' : '';

    detailEl.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">' +
      '<div><strong style="font-size:14px;color:var(--color-text)">' + esc(w.word) + '</strong> <span style="font-size:12px;color:var(--color-text-muted)">' + esc(w.phonetic || '') + '</span> <span style="font-size:12px;font-weight:600;color:var(--color-primary)">' + esc(def) + '</span></div>' +
      '<div style="display:flex;gap:6px">' +
        '<a href="study.html?word=' + encodeURIComponent(w.word) + '" class="multi-clear-btn" style="text-decoration:none;color:var(--color-primary);font-size:11px;padding:3px 8px">📖 专攻背诵</a>' +
        '<button class="multi-clear-btn" data-inline-quiz="' + esc(w.word) + '" type="button" style="font-size:11px;padding:3px 8px;color:var(--color-primary);border-color:var(--color-primary)">🎯 考点速测</button>' +
      '</div>' +
    '</div>' +
    synHtml + secHtml + rootHtml + exHtml;

    rowWrap.after(detailEl);
  });

  // 内嵌考点速测触发
  listEl.addEventListener('click', function(e) {
    var b = e.target.closest('[data-inline-quiz]');
    if (!b) return;
    var word = b.getAttribute('data-inline-quiz');
    if (window.KaoyanQuiz) {
      window.KaoyanQuiz.openSingleQuiz(word);
    }
  });
  var multiStudyBtn = document.getElementById('multi-study-btn');
  var multiQuizBtn = document.getElementById('multi-quiz-btn');

  function updateProgressBanner() {
    var masteredCount = WORDS.filter(function(w){ return studyState[w.word] && studyState[w.word].level >= 4; }).length;
    var totalCount = WORDS.filter(function(w){ return w.active !== false; }).length;
    var pct = totalCount ? Math.round(masteredCount / totalCount * 100) : 0;
    var labelEl = document.getElementById('cat-prog-label');
    var barEl = document.getElementById('cat-prog-bar');
    if (labelEl) labelEl.textContent = '📊 词库背诵总览：已掌握 ' + masteredCount + '/' + totalCount + ' 词 (' + pct + '%)';
    if (barEl) barEl.style.width = pct + '%';
  }

  loadMoreBtn.addEventListener('click',renderPage);
  listEl.addEventListener('change',function(e){var cb=e.target.closest('input[data-select-word]');if(!cb)return;var word=cb.getAttribute('data-select-word');if(cb.checked){if(Object.keys(selected).length>=8){cb.checked=false;alert('最多选择 8 个单词。');return;}selected[word]=WORDS.find(function(w){return w.word===word;})||{word:word};}else delete selected[word];updateSelection();});
  selectVisibleBtn.addEventListener('click',function(){var pageWords=filtered.slice(0,shown),added=0;pageWords.forEach(function(w){if(!selected[w.word]&&Object.keys(selected).length<8){selected[w.word]=w;added++;}});updateSelection();renderPage();if(!added&&Object.keys(selected).length>=8)alert('最多选择 8 个单词。');});
  clearBtn.addEventListener('click',function(){selected={};updateSelection();applyFilters();});

  var exportWordsBtn = document.getElementById('cat-export-words-btn');
  if (exportWordsBtn) {
    exportWordsBtn.addEventListener('click', function() {
      if (!filtered.length) {
        if (window.KaoyanToast) window.KaoyanToast('⚠️ 当前无筛选单词可导出');
        return;
      }
      var lines = [
        '# 📚 考研英语（一）筛选词单 (' + filtered.length + ' 词)',
        '',
        '> 导出时间：' + new Date().toLocaleString(),
        '',
        '| 序号 | 单词 | 音标 | 词性 | 中文释义 | 考频 |',
        '| :--- | :--- | :--- | :--- | :--- | :--- |'
      ];
      filtered.forEach(function(w, idx) {
        lines.push('| ' + (idx + 1) + ' | **' + (w.word || '') + '** | ' + (w.phonetic || '') + ' | ' + (w.pos || '') + ' | ' + (w.translation || '').replace(/\|/g, '/') + ' | ' + (w.true_priority || '') + ' |');
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '考研单词表_' + (activeFilter !== 'all' ? activeFilter + '_' : '') + new Date().toISOString().slice(0,10) + '.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.KaoyanToast) window.KaoyanToast('✓ 已成功导出 ' + filtered.length + ' 个单词 Markdown 表格！');
    });
  }
  
  function updateSelection(){
    var arr=Object.keys(selected).map(function(k){return selected[k];});
    selectedCount.textContent=arr.length;
    panel.hidden=arr.length===0;
    multiBtn.disabled=arr.length<2;
    if(multiStudyBtn) multiStudyBtn.disabled = arr.length < 1;
    if(multiQuizBtn) multiQuizBtn.disabled = arr.length < 1;
    selectedWords.innerHTML=arr.map(function(w){return '<button type="button" class="selected-chip" data-remove-selected="'+esc(w.word)+'">'+esc(w.word)+' ×</button>';}).join('');
  }
  
  if (multiStudyBtn) {
    multiStudyBtn.addEventListener('click', function () {
      var arr = Object.keys(selected);
      if (!arr.length) return;
      location.href = 'study.html?word=' + encodeURIComponent(arr[0]);
    });
  }

  if (multiQuizBtn) {
    multiQuizBtn.addEventListener('click', function () {
      var arr = Object.keys(selected).map(function(k){ return selected[k]; });
      if (!arr.length) return;
      if (window.KaoyanQuiz) {
        window.KaoyanQuiz.startQuiz(arr, Math.min(10, arr.length));
      }
    });
  }

  selectedWords.addEventListener('click',function(e){var b=e.target.closest('[data-remove-selected]');if(!b)return;delete selected[b.getAttribute('data-remove-selected')];updateSelection();applyFilters();});

  function openModal(){var arr=Object.keys(selected).map(function(k){return selected[k];});if(arr.length<2)return;modal.hidden=false;modal.setAttribute('aria-hidden','false');modal.removeAttribute('inert');subtitle.textContent=arr.map(function(x){return x.word;}).join(' · ');renderMulti(arr);}
  function renderMulti(arr){
    resultEl.innerHTML=arr.map(function(w){
      var ai=AI[w.word];
      var en=(ai&&ai.en)||w.example_en||'';
      var zh=(ai&&ai.zh)||w.example_zh||'';
      return '<div class="multi-item"><div class="multi-item-word">'+esc(w.word)+(w.pos?'<span class="sp">'+esc(w.pos)+'</span>':'')+'<span class="mtier">'+esc(w.tier||'')+'</span></div>'+
        (en?'<p class="example-en">'+highlight(en,[w.word])+'</p>'+(zh?'<p class="example-zh">'+esc(zh)+'</p>':''):'<p class="ai-empty">该词暂无例句。</p>')+'</div>';
    }).join('')+'<p class="ai-meta">例句来自内置 AI 例句库（考研语境，离线可用）。</p>';
  }
  function closeModal(){modal.hidden=true;modal.setAttribute('aria-hidden','true');modal.setAttribute('inert','');}
  multiBtn.addEventListener('click',openModal);
  document.addEventListener('click',function(e){if(e.target.closest('[data-multi-close]'))closeModal();}); document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)closeModal();});
  copyBtn.addEventListener('click',function(){var text=Array.prototype.map.call(resultEl.querySelectorAll('.multi-item'),function(item){var en=item.querySelector('.example-en'),zh=item.querySelector('.example-zh');var w=item.querySelector('.multi-item-word');return (w?w.textContent.trim():'')+'\n'+(en?en.innerText:'')+(zh?'\n'+zh.innerText:'');}).join('\n\n');if(!text)return;navigator.clipboard&&navigator.clipboard.writeText(text).then(function(){copyBtn.textContent='已复制 ✓';setTimeout(function(){copyBtn.textContent='复制例句';},1200);});});
  function highlight(sentence,words){var out=esc(sentence);words.sort(function(a,b){return b.length-a.length;}).forEach(function(w){var stem=escReg(w);var alt=/e$/.test(w)?'|'+escReg(w.slice(0,-1))+'\\w*':'';var re=new RegExp('\\b('+stem+'\\w*'+alt+')','gi');out=out.replace(re,'<span class="hl">$1</span>');});return out;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});} function escReg(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  // 词性缩写（与查词页一致）
  function posShort(p){var s=String(p||'').trim().toLowerCase();if(!s)return '';if(s.indexOf('adj')===0)return 'adj.';if(s.indexOf('adv')===0)return 'adv.';if(s.indexOf('verb')===0||s.indexOf('v')===0)return 'v.';if(s.indexOf('noun')===0||s.indexOf('n.')===0||/(^|[^a-z])n\b/.test(s))return 'n.';if(s.indexOf('prep')===0)return 'prep.';if(s.indexOf('conj')===0)return 'conj.';if(s.indexOf('pron')===0)return 'pron.';return s;}

  // ---- 排序切换 ----
  var sortChips=document.getElementById('sort-chips');
  if(sortChips) sortChips.addEventListener('click',function(e){var b=e.target.closest('.filter-chip');if(!b)return;sortBy=b.getAttribute('data-sort');sortChips.querySelectorAll('.filter-chip').forEach(function(x){x.classList.toggle('active',x===b);});applyFilters();});
  // ---- 随机抽词（当前筛选结果内） ----
  var rndBtn=document.getElementById('random-word');
  if(rndBtn) rndBtn.addEventListener('click',function(){if(!filtered.length)return;var w=filtered[Math.floor(Math.random()*filtered.length)];location.href='study.html?word='+encodeURIComponent(w.word);});
  // ---- 词单多格式导出 (Anki / CSV / Markdown) ----
  var exportBtn = document.getElementById('export-words-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      if (!filtered.length) { alert('当前筛选词单为空。'); return; }
      var choice = prompt(
        '请选择导出格式（输入数字）：\n1. Anki 记忆卡片格式 (.txt 制表符分隔)\n2. Excel / CSV 表格 (.csv)\n3. Markdown 词表 (.md)\n4. JSON 数据 (.json)',
        '1'
      );
      if (!choice) return;

      var content = '', mime = 'text/plain', ext = 'txt';
      var filename = '考研词单_' + (activeFilter || '全部') + '_' + filtered.length + '词.' + ext;

      if (choice === '1') {
        // Anki TXT
        mime = 'text/plain;charset=utf-8';
        ext = 'txt';
        content = filtered.map(function (w) {
          var ai = AI[w.word];
          var ex = (ai && ai.en) || w.example_en || '';
          var exZh = (ai && ai.zh) || w.example_zh || '';
          var back = (w.phonetic ? w.phonetic + '<br>' : '') +
            '<b>' + esc(w.exam_meaning || w.translation || '') + '</b>' +
            (w.secondary_meanings ? '<br><small style="color:#a9760f">僻义: ' + esc(w.secondary_meanings) + '</small>' : '') +
            (w.synonyms ? '<br><small style="color:#1d5a63">同义替换: ' + esc(w.synonyms) + '</small>' : '') +
            (ex ? '<hr><div style="font-size:12px">' + esc(ex) + '<br><span style="color:#666">' + esc(exZh) + '</span></div>' : '');
          return w.word + '\t' + back.replace(/\n/g, ' ');
        }).join('\n');
      } else if (choice === '2') {
        // CSV
        mime = 'text/csv;charset=utf-8';
        ext = 'csv';
        var rows = ['单词,音标,词性,考研释义,层级,熟词僻义,同义改写,词根助记,例句英文,例句中文'];
        filtered.forEach(function (w) {
          var ai = AI[w.word];
          var ex = (ai && ai.en) || w.example_en || '';
          var exZh = (ai && ai.zh) || w.example_zh || '';
          rows.push([
            '"' + (w.word || '').replace(/"/g, '""') + '"',
            '"' + (w.phonetic || '').replace(/"/g, '""') + '"',
            '"' + (w.pos || '').replace(/"/g, '""') + '"',
            '"' + (w.exam_meaning || w.translation || '').replace(/"/g, '""') + '"',
            '"' + (w.tier || '').replace(/"/g, '""') + '"',
            '"' + (w.secondary_meanings || '').replace(/"/g, '""') + '"',
            '"' + (w.synonyms || '').replace(/"/g, '""') + '"',
            '"' + (w.root || '').replace(/"/g, '""') + '"',
            '"' + ex.replace(/"/g, '""') + '"',
            '"' + exZh.replace(/"/g, '""') + '"'
          ].join(','));
        });
        content = '\uFEFF' + rows.join('\n'); // Add BOM for Excel
      } else if (choice === '3') {
        // Markdown
        mime = 'text/markdown;charset=utf-8';
        ext = 'md';
        var md = ['# 考研英语精选词单 (' + filtered.length + ' 词)\n', '| 单词 | 音标 | 考研释义 | 同义替换 | 词根助记 |', '| :--- | :--- | :--- | :--- | :--- |'];
        filtered.forEach(function (w) {
          md.push('| **' + w.word + '** | `' + (w.phonetic || '') + '` | ' + (w.exam_meaning || w.translation || '') + ' | ' + (w.synonyms || '—') + ' | ' + (w.root || '—') + ' |');
        });
        content = md.join('\n');
      } else if (choice === '4') {
        // JSON
        mime = 'application/json;charset=utf-8';
        ext = 'json';
        content = JSON.stringify(filtered, null, 2);
      } else {
        return;
      }

      filename = '考研词单_' + (activeFilter || '全部') + '_' + filtered.length + '词.' + ext;
      var blob = new Blob([content], { type: mime });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    });
  }

  // ---- 回到顶部 ----
  var backTop=document.getElementById('back-top');
  if(backTop){
    window.addEventListener('scroll',function(){backTop.hidden=window.scrollY<700;},{passive:true});
    backTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
  }

  // ---- 列表一键朗读发音 ----
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-speak]');
    if (!b) return;
    var text = b.getAttribute('data-speak');
    if (!text) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
      u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
      b.classList.add('speaking');
      u.onend = function () { b.classList.remove('speaking'); };
      u.onerror = function () { b.classList.remove('speaking'); };
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (err) {}
  });

  // 手机端向下滑动自动收起输入法软键盘 (Swipe down to dismiss keyboard on catalog)
  var touchStartY = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length === 1) touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length === 1) {
      var dy = e.touches[0].clientY - touchStartY;
      if (dy > 35 && document.activeElement === filterInput) {
        filterInput.blur();
      }
    }
  }, { passive: true });
})();