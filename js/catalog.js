/* 考研词汇 — 词库大纲手机系统设置式三级层级导航引擎 (3-Tier Hierarchical Catalog Engine) */
(function () {
  'use strict';

  var WORDS = [];
  var studyState = {};
  var currentFilteredWords = [];
  var currentFilterKey = 'core';
  var currentLetter = 'A';
  var currentPage = 1;
  var PAGE_SIZE = 40;

  // 内置 AI 例句 (优先读全局 bundle: window.__AI_EXAMPLES__ / window.__AI_EX__，读不到用 XMLHttpRequest 兜底)
  var AI_EX = {};
  function populateAiExamples(source) {
    if (!source || !source.s) return;
    Object.keys(source.s).forEach(function (k) {
      AI_EX[k] = { en: source.s[k][0], zh: source.s[k][1] };
    });
  }
  var aiGlobal = window.__AI_EXAMPLES__ || window.__AI_EX__;
  if (aiGlobal && aiGlobal.s) {
    populateAiExamples(aiGlobal);
  } else {
    try {
      var aiXhr = new XMLHttpRequest();
      aiXhr.open('GET', 'data/ai_examples.json', true);
      aiXhr.onreadystatechange = function () {
        if (aiXhr.readyState === 4) {
          if ((aiXhr.status === 200 || aiXhr.status === 0) && aiXhr.responseText) {
            try {
              var d = JSON.parse(aiXhr.responseText);
              populateAiExamples(d);
            } catch (e) {}
          } else {
            var lateAi = window.__AI_EXAMPLES__ || window.__AI_EX__;
            if (lateAi && lateAi.s) populateAiExamples(lateAi);
          }
        }
      };
      aiXhr.send();
    } catch (e) {
      var lateAi2 = window.__AI_EXAMPLES__ || window.__AI_EX__;
      if (lateAi2 && lateAi2.s) populateAiExamples(lateAi2);
    }
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function speak(text) {
    if (!text) return;
    try {
      if (window.KaoyanAudio && window.KaoyanAudio.speak) {
        window.KaoyanAudio.speak(text);
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
        u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  function getStudyProgress() {
    try {
      return JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}').progress || {};
    } catch (e) {
      return {};
    }
  }

  function isFav(word) {
    if (window.KaoyanQuiz && window.KaoyanQuiz.isFav) {
      return window.KaoyanQuiz.isFav(word);
    }
    try {
      var favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
      return favs.indexOf(word) >= 0;
    } catch (e) {
      return false;
    }
  }

  function toggleFav(word) {
    if (window.KaoyanQuiz && window.KaoyanQuiz.toggleFav) {
      var res = window.KaoyanQuiz.toggleFav(word);
      return res;
    }
    try {
      var favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
      var idx = favs.indexOf(word);
      if (idx >= 0) {
        favs.splice(idx, 1);
      } else {
        favs.push(word);
      }
      localStorage.setItem('kao_quiz_favs', JSON.stringify(favs));
      return idx < 0;
    } catch (e) {
      return false;
    }
  }

  // --- 1. 词库初始化 ---
  function initCatalogWords() {
    function processData(d) {
      WORDS = (d.words || []).filter(function (w) { return w.active !== false; });
      window.__ALL_WORDS__ = WORDS;
      studyState = getStudyProgress();
      renderHomeStats();
      handleHashRoute();
    }

    var bundled = (window.getKaoyanWords && window.getKaoyanWords()) || window.__WORDS_DATA__ || window.__INITIAL_WORDS__;
    if (bundled && bundled.words && bundled.words.length > 0) {
      processData(bundled);
      return;
    }
    if (window.loadKaoyanWords) {
      window.loadKaoyanWords().then(processData).catch(function () {});
      return;
    }
    try {
      var wXhr = new XMLHttpRequest();
      wXhr.open('GET', 'data/words.json', true);
      wXhr.onreadystatechange = function () {
        if (wXhr.readyState === 4 && (wXhr.status === 200 || wXhr.status === 0) && wXhr.responseText) {
          try {
            var d = JSON.parse(wXhr.responseText);
            processData(d);
          } catch (e) {}
        }
      };
      wXhr.send();
    } catch (e) {}
  }

  // --- 2. 第一级首页统计信息 ---
  function renderHomeStats() {
    studyState = getStudyProgress();
    var counts = {
      core: 0,
      high: 0,
      expand: 0,
      normal: 0,
      secondary: 0,
      fav: 0,
      weak: 0,
      mastered: 0
    };

    var favsList = [];
    try { favsList = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch (e) {}
    var favSet = new Set(favsList);

    var hardMap = {};
    try { hardMap = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}').hardCount || {}; } catch (e) {}

    WORDS.forEach(function (w) {
      if (w.tier === '核心高频') counts.core++;
      else if (w.tier === '高频重点') counts.high++;
      else if (w.tier === '重点扩展') counts.expand++;
      else if (w.tier === '普通扩展') counts.normal++;

      if (w.secondary_meaning || (w.exam_meaning && w.exam_meaning.includes('僻'))) {
        counts.secondary++;
      }
      if (favSet.has(w.word)) counts.fav++;
      if ((hardMap[w.word] || 0) > 0) counts.weak++;

      var prog = studyState[w.word];
      if (prog && prog.level >= 4) counts.mastered++;
    });

    var badgeCore = document.getElementById('count-badge-core');
    if (badgeCore) badgeCore.textContent = counts.core + ' 词';
    var badgeHigh = document.getElementById('count-badge-high');
    if (badgeHigh) badgeHigh.textContent = counts.high + ' 词';
    var badgeExpand = document.getElementById('count-badge-expand');
    if (badgeExpand) badgeExpand.textContent = counts.expand + ' 词';
    var badgeNormal = document.getElementById('count-badge-normal');
    if (badgeNormal) badgeNormal.textContent = counts.normal + ' 词';
    var badgeSecondary = document.getElementById('count-badge-secondary');
    if (badgeSecondary) badgeSecondary.textContent = (counts.secondary || 680) + ' 词';
    var badgeFav = document.getElementById('count-badge-fav');
    if (badgeFav) badgeFav.textContent = counts.fav + ' 词';
    var badgeWeak = document.getElementById('count-badge-weak');
    if (badgeWeak) badgeWeak.textContent = counts.weak + ' 词';

    var total = WORDS.length || 5619;
    var pct = Math.min(100, Math.round((counts.mastered / total) * 100));
    var subEl = document.getElementById('cat-prog-sub');
    if (subEl) subEl.textContent = `已掌握 ${counts.mastered} / ${total} 词 (${pct}%)`;
    var barEl = document.getElementById('cat-prog-bar');
    if (barEl) barEl.style.width = pct + '%';
  }

  // --- 3. 视图切换调度 ---
  var viewHome = document.getElementById('words-view-home');
  var viewList = document.getElementById('words-view-list');
  var viewDetail = document.getElementById('words-view-detail');

  var currentCatalogDepth = 1;
  function getCatalogRouteDepth(hash) {
    if (!hash || hash === '#' || hash === '#home') return 1;
    if (hash.startsWith('#list/')) return 2;
    if (hash.startsWith('#word/')) return 3;
    return 1;
  }

  function showView(viewEl, isBack) {
    [viewHome, viewList, viewDetail].forEach(function (v) {
      if (!v) return;
      if (v === viewEl) {
        v.classList.remove('slide-back');
        if (isBack) {
          v.classList.add('slide-back');
        }
        v.classList.add('active');
        v.style.display = 'block';
      } else {
        v.classList.remove('active');
        v.classList.remove('slide-back');
        v.style.display = 'none';
      }
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // --- 4. 路由逻辑 ---
  function handleHashRoute() {
    var hash = location.hash || '';
    var newDepth = getCatalogRouteDepth(hash);
    var isBack = newDepth < currentCatalogDepth;
    currentCatalogDepth = newDepth;

    if (!hash || hash === '#' || hash === '#home') {
      showView(viewHome, isBack);
      renderHomeStats();
      return;
    }

    if (hash.startsWith('#list/')) {
      var filter = hash.slice(6);
      currentFilterKey = filter;
      showView(viewList, isBack);
      renderTier2List(filter);
      return;
    }

    if (hash.startsWith('#word/')) {
      var wordStr = decodeURIComponent(hash.slice(6));
      showView(viewDetail, isBack);
      renderTier3Detail(wordStr);
      return;
    }

    // Default fallback
    showView(viewHome, isBack);
  }

  window.addEventListener('hashchange', handleHashRoute);

  // 返回按钮事件
  var listBackBtn = document.getElementById('words-list-back-btn');
  if (listBackBtn) {
    listBackBtn.onclick = function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        location.hash = '#home';
      }
    };
  }

  var detailBackBtn = document.getElementById('words-detail-back-btn');
  if (detailBackBtn) {
    detailBackBtn.onclick = function () {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        location.hash = '#list/' + currentFilterKey;
      }
    };
  }

  // --- 5. 第二级单词列表渲染 ---
  // --- 5. 第二级单词列表渲染与双层智能筛选系统 ---
  var filterTitles = {
    all: '📚 全部考研词库',
    core: '⭐ 核心高频词',
    high: '📌 高频重点词',
    expand: '🎯 重点扩展词',
    normal: '📚 普通扩展词',
    secondary: '⚡ 熟词僻义专项',
    letters: '🔤 按首字母浏览',
    fav: '⭐ 我的专属生词本',
    weak: '🔥 薄弱词专项强化'
  };

  // 筛选器状态
  var filterState = {
    tier: 'all',          // 'all' | 'high' | 'mid' | 'low'
    status: 'all',        // 'all' | 'unlearned' | 'learning' | 'mastered'
    sort: 'freq',         // 'freq' | 'alpha' | 'time'
    pos: [],              // ['n', 'v', 'adj', 'adv', 'other'] (多选)
    letter: 'all',        // 'all' | 'A'..'Z'
    len: 'all',           // 'all' | 'short' | 'mid' | 'long'
    source: 'all'         // 'all' | 'outline' | 'real' | 'expand'
  };

  var rawCategoryWords = []; // 当前分类的基础原始词汇

  function applyWordFilters() {
    studyState = getStudyProgress();
    var list = rawCategoryWords.slice();

    // 1. 常用筛选：词频等级 (全部 / 高频 / 中频 / 低频)
    if (filterState.tier === 'high') {
      list = list.filter(function (w) { return w.tier === '核心高频' || w.tier === '高频重点'; });
    } else if (filterState.tier === 'mid') {
      list = list.filter(function (w) { return w.tier === '重点扩展'; });
    } else if (filterState.tier === 'low') {
      list = list.filter(function (w) { return w.tier === '普通扩展'; });
    }

    // 2. 常用筛选：掌握状态 (全部 / 未学 / 学习中 / 已掌握)
    if (filterState.status === 'unlearned') {
      list = list.filter(function (w) {
        var prog = studyState[w.word];
        return !prog || !prog.level;
      });
    } else if (filterState.status === 'learning') {
      list = list.filter(function (w) {
        var prog = studyState[w.word];
        return prog && prog.level > 0 && prog.level < 4;
      });
    } else if (filterState.status === 'mastered') {
      list = list.filter(function (w) {
        var prog = studyState[w.word];
        return prog && prog.level >= 4;
      });
    }

    // 3. 高级筛选：词性筛选 (多选)
    if (filterState.pos && filterState.pos.length > 0) {
      list = list.filter(function (w) {
        var p = ((w.pos || '') + ' ' + (w.translation || '') + ' ' + (w.exam_meaning || '')).toLowerCase();
        for (var i = 0; i < filterState.pos.length; i++) {
          var pk = filterState.pos[i];
          if (pk === 'n' && (p.includes('n.') || p.includes('noun'))) return true;
          if (pk === 'v' && (p.includes('v.') || p.includes('verb'))) return true;
          if (pk === 'adj' && (p.includes('adj') || p.includes('adje'))) return true;
          if (pk === 'adv' && (p.includes('adv') || p.includes('adverb'))) return true;
          if (pk === 'other' && (p.includes('prep.') || p.includes('conj.') || p.includes('pron.') || p.includes('num.') || p.includes('art.'))) return true;
        }
        return false;
      });
    }

    // 4. 高级筛选：首字母范围 (A-Z)
    if (filterState.letter && filterState.letter !== 'all') {
      var targetL = filterState.letter.toUpperCase();
      list = list.filter(function (w) {
        return w.word.toUpperCase().startsWith(targetL);
      });
    }

    // 5. 高级筛选：词长范围
    if (filterState.len === 'short') {
      list = list.filter(function (w) { return w.word.length <= 4; });
    } else if (filterState.len === 'mid') {
      list = list.filter(function (w) { return w.word.length >= 5 && w.word.length <= 7; });
    } else if (filterState.len === 'long') {
      list = list.filter(function (w) { return w.word.length >= 8; });
    }

    // 6. 高级筛选：来源筛选 (大纲词 / 真题词 / 超纲词)
    if (filterState.source === 'outline') {
      list = list.filter(function (w) {
        return (w.tag && (w.tag.includes('大纲') || w.tag.includes('基础'))) || (w.source && w.source.includes('outline'));
      });
    } else if (filterState.source === 'real') {
      list = list.filter(function (w) {
        return (w.tag && (w.tag.includes('核心') || w.tag.includes('高频') || w.tag.includes('真题') || w.tag.includes('英一'))) || w.exam_tag || w.tier === '核心高频';
      });
    } else if (filterState.source === 'expand') {
      list = list.filter(function (w) {
        return (w.tag && w.tag.includes('扩展')) || w.tier === '重点扩展' || w.tier === '普通扩展';
      });
    }

    // 7. 排序方式 (按词频 / 按字母 / 按添加时间)
    if (filterState.sort === 'alpha') {
      list.sort(function (a, b) {
        return a.word.localeCompare(b.word);
      });
    } else if (filterState.sort === 'time') {
      // 保持原始字典索引顺序
    } else {
      // 默认按词频优先级 (核心高频 > 高频重点 > 重点扩展 > 普通扩展)
      var tierWeight = { '核心高频': 4, '高频重点': 3, '重点扩展': 2, '普通扩展': 1 };
      list.sort(function (a, b) {
        var wa = tierWeight[a.tier] || 0;
        var wb = tierWeight[b.tier] || 0;
        if (wb !== wa) return wb - wa;
        var sa = (a.true_priority || '').length || 0;
        var sb = (b.true_priority || '').length || 0;
        return sb - sa;
      });
    }

    currentFilteredWords = list;
    currentPage = 1;

    // 更新各处结果数量显示
    var countEl = document.getElementById('words-list-total-count');
    if (countEl) countEl.textContent = '共 ' + list.length.toLocaleString() + ' 词';

    var confirmCount = document.getElementById('afp-confirm-count');
    if (confirmCount) confirmCount.textContent = '查看结果 (' + list.length.toLocaleString() + ' 词)';

    renderActiveChipsBar();
    updateFilterBadge();
    renderTier2Page();
  }

  function renderActiveChipsBar() {
    var chipsBar = document.getElementById('filter-active-chips');
    var chipsList = document.getElementById('fac-list');
    if (!chipsBar || !chipsList) return;

    var chips = [];
    var tierMap = { high: '高频', mid: '中频', low: '低频' };
    if (filterState.tier !== 'all' && tierMap[filterState.tier]) {
      chips.push({ key: 'tier', text: '词频: ' + tierMap[filterState.tier] });
    }

    var statusMap = { unlearned: '未学', learning: '学习中', mastered: '已掌握' };
    if (filterState.status !== 'all' && statusMap[filterState.status]) {
      chips.push({ key: 'status', text: '状态: ' + statusMap[filterState.status] });
    }

    var sortMap = { alpha: '按字母', time: '按时间' };
    if (filterState.sort !== 'freq' && sortMap[filterState.sort]) {
      chips.push({ key: 'sort', text: '排序: ' + sortMap[filterState.sort] });
    }

    if (filterState.pos && filterState.pos.length > 0) {
      var posNames = { n: '名词', v: '动词', adj: '形容词', adv: '副词', other: '虚词' };
      var pTexts = filterState.pos.map(function(k) { return posNames[k] || k; }).join('/');
      chips.push({ key: 'pos', text: '词性: ' + pTexts });
    }

    if (filterState.letter && filterState.letter !== 'all') {
      chips.push({ key: 'letter', text: '首字母: ' + filterState.letter });
    }

    var lenMap = { short: '短词(≤4)', mid: '中词(5-7)', long: '长词(≥8)' };
    if (filterState.len !== 'all' && lenMap[filterState.len]) {
      chips.push({ key: 'len', text: '词长: ' + lenMap[filterState.len] });
    }

    var srcMap = { outline: '大纲词', real: '真题词', expand: '扩展词' };
    if (filterState.source !== 'all' && srcMap[filterState.source]) {
      chips.push({ key: 'source', text: '来源: ' + srcMap[filterState.source] });
    }

    if (chips.length > 0) {
      chipsBar.style.display = 'flex';
      chipsList.innerHTML = chips.map(function (c) {
        return `<span class="active-chip" data-chip-key="${c.key}">${esc(c.text)} <b class="chip-remove" data-remove-key="${c.key}" title="移除此项筛选">✕</b></span>`;
      }).join('');

      chipsList.querySelectorAll('.chip-remove').forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var k = btn.getAttribute('data-remove-key');
          removeSingleFilter(k);
        };
      });
    } else {
      chipsBar.style.display = 'none';
      chipsList.innerHTML = '';
    }
  }

  function removeSingleFilter(key) {
    if (key === 'tier') {
      filterState.tier = 'all';
      var el = document.getElementById('cf-tier');
      if (el) el.value = 'all';
    } else if (key === 'status') {
      filterState.status = 'all';
      var el = document.getElementById('cf-status');
      if (el) el.value = 'all';
    } else if (key === 'sort') {
      filterState.sort = 'freq';
      var el = document.getElementById('cf-sort');
      if (el) el.value = 'freq';
    } else if (key === 'pos') {
      filterState.pos = [];
      document.querySelectorAll('#afp-pos-group .afp-chip').forEach(function(c) { c.classList.remove('active'); });
    } else if (key === 'letter') {
      filterState.letter = 'all';
      document.querySelectorAll('#afp-letter-group .afp-chip').forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-letter') === 'all');
      });
    } else if (key === 'len') {
      filterState.len = 'all';
      document.querySelectorAll('#afp-length-group .afp-chip').forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-len') === 'all');
      });
    } else if (key === 'source') {
      filterState.source = 'all';
      document.querySelectorAll('#afp-source-group .afp-chip').forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-source') === 'all');
      });
    }
    applyWordFilters();
  }

  function resetAllFilters() {
    filterState.tier = 'all';
    filterState.status = 'all';
    filterState.sort = 'freq';
    filterState.pos = [];
    filterState.letter = 'all';
    filterState.len = 'all';
    filterState.source = 'all';

    var cfTier = document.getElementById('cf-tier');
    if (cfTier) cfTier.value = 'all';
    var cfStatus = document.getElementById('cf-status');
    if (cfStatus) cfStatus.value = 'all';
    var cfSort = document.getElementById('cf-sort');
    if (cfSort) cfSort.value = 'freq';

    document.querySelectorAll('#afp-pos-group .afp-chip').forEach(function(c) { c.classList.remove('active'); });
    document.querySelectorAll('#afp-letter-group .afp-chip').forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-letter') === 'all');
    });
    document.querySelectorAll('#afp-length-group .afp-chip').forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-len') === 'all');
    });
    document.querySelectorAll('#afp-source-group .afp-chip').forEach(function(c) {
      c.classList.toggle('active', c.getAttribute('data-source') === 'all');
    });

    applyWordFilters();
  }

  function updateFilterBadge() {
    var advCount = (filterState.pos.length > 0 ? 1 : 0) +
                   (filterState.letter !== 'all' ? 1 : 0) +
                   (filterState.len !== 'all' ? 1 : 0) +
                   (filterState.source !== 'all' ? 1 : 0);
    var badge = document.getElementById('adv-filter-badge');
    if (badge) {
      if (advCount > 0) {
        badge.textContent = advCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  var filterSystemInited = false;
  function initFilterSystem() {
    if (filterSystemInited) return;
    filterSystemInited = true;

    // 1. 常用筛选绑定
    var cfTier = document.getElementById('cf-tier');
    if (cfTier) {
      cfTier.onchange = function () {
        filterState.tier = cfTier.value;
        applyWordFilters();
      };
    }
    var cfStatus = document.getElementById('cf-status');
    if (cfStatus) {
      cfStatus.onchange = function () {
        filterState.status = cfStatus.value;
        applyWordFilters();
      };
    }
    var cfSort = document.getElementById('cf-sort');
    if (cfSort) {
      cfSort.onchange = function () {
        filterState.sort = cfSort.value;
        applyWordFilters();
      };
    }

    // 2. 更多筛选展开收起
    var btnAdv = document.getElementById('btn-toggle-advanced');
    var panelAdv = document.getElementById('adv-filter-panel');
    var backdropAdv = document.getElementById('adv-filter-backdrop');
    var closeAdv = document.getElementById('afp-close-btn');

    function toggleAdvPanel(open) {
      var shouldOpen = open !== undefined ? open : (panelAdv && !panelAdv.classList.contains('open'));
      if (panelAdv) panelAdv.classList.toggle('open', shouldOpen);
      if (backdropAdv) backdropAdv.classList.toggle('open', shouldOpen);
      if (btnAdv) {
        btnAdv.classList.toggle('active', shouldOpen);
        btnAdv.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      }
    }

    if (btnAdv) btnAdv.onclick = function () { toggleAdvPanel(); };
    if (backdropAdv) backdropAdv.onclick = function () { toggleAdvPanel(false); };
    if (closeAdv) closeAdv.onclick = function () { toggleAdvPanel(false); };

    // 3. 生成 A-Z 首字母横滑按钮
    var letterGroup = document.getElementById('afp-letter-group');
    if (letterGroup) {
      var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      var lHtml = `<button type="button" class="afp-chip active" data-letter="all">全部</button>`;
      alphabet.forEach(function (ch) {
        lHtml += `<button type="button" class="afp-chip" data-letter="${ch}">${ch}</button>`;
      });
      letterGroup.innerHTML = lHtml;

      letterGroup.querySelectorAll('.afp-chip').forEach(function (btn) {
        btn.onclick = function () {
          var l = btn.getAttribute('data-letter');
          filterState.letter = l;
          letterGroup.querySelectorAll('.afp-chip').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-letter') === l);
          });
          applyWordFilters();
        };
      });
    }

    // 4. 词性筛选 (多选)
    var posGroup = document.getElementById('afp-pos-group');
    if (posGroup) {
      posGroup.querySelectorAll('.afp-chip').forEach(function (btn) {
        btn.onclick = function () {
          var posVal = btn.getAttribute('data-pos');
          var idx = filterState.pos.indexOf(posVal);
          if (idx >= 0) {
            filterState.pos.splice(idx, 1);
            btn.classList.remove('active');
          } else {
            filterState.pos.push(posVal);
            btn.classList.add('active');
          }
          applyWordFilters();
        };
      });
    }

    // 5. 词长筛选 (单选)
    var lenGroup = document.getElementById('afp-length-group');
    if (lenGroup) {
      lenGroup.querySelectorAll('.afp-chip').forEach(function (btn) {
        btn.onclick = function () {
          var lenVal = btn.getAttribute('data-len');
          filterState.len = lenVal;
          lenGroup.querySelectorAll('.afp-chip').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-len') === lenVal);
          });
          applyWordFilters();
        };
      });
    }

    // 6. 来源筛选 (单选)
    var srcGroup = document.getElementById('afp-source-group');
    if (srcGroup) {
      srcGroup.querySelectorAll('.afp-chip').forEach(function (btn) {
        btn.onclick = function () {
          var srcVal = btn.getAttribute('data-source');
          filterState.source = srcVal;
          srcGroup.querySelectorAll('.afp-chip').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-source') === srcVal);
          });
          applyWordFilters();
        };
      });
    }

    // 7. 重置按钮
    var btnReset = document.getElementById('afp-btn-reset');
    if (btnReset) btnReset.onclick = resetAllFilters;

    var btnClearAll = document.getElementById('fac-clear-btn');
    if (btnClearAll) btnClearAll.onclick = resetAllFilters;

    // 8. 确认关闭按钮
    var btnConfirm = document.getElementById('afp-btn-confirm');
    if (btnConfirm) {
      btnConfirm.onclick = function () {
        toggleAdvPanel(false);
      };
    }
  }

  function renderTier2List(filterKey) {
    studyState = getStudyProgress();
    var titleEl = document.getElementById('words-list-header-title');
    var letterBar = document.getElementById('words-letter-bar');

    // 是否展示 A-Z 首字母横滑条
    var isLettersMode = filterKey === 'letters' || filterKey.startsWith('letter-');
    if (letterBar) {
      letterBar.style.display = isLettersMode ? 'block' : 'none';
      if (isLettersMode) renderLetterChips(filterKey.startsWith('letter-') ? filterKey.slice(7) : 'A');
    }

    // 过滤数据源
    var list = [];
    if (filterKey === 'core') {
      list = WORDS.filter(w => w.tier === '核心高频');
    } else if (filterKey === 'high') {
      list = WORDS.filter(w => w.tier === '高频重点');
    } else if (filterKey === 'expand') {
      list = WORDS.filter(w => w.tier === '重点扩展');
    } else if (filterKey === 'normal') {
      list = WORDS.filter(w => w.tier === '普通扩展');
    } else if (filterKey === 'secondary') {
      list = WORDS.filter(w => w.secondary_meaning || (w.exam_meaning && w.exam_meaning.includes('僻')));
    } else if (filterKey === 'fav') {
      var favs = [];
      try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch (e) {}
      var favSet = new Set(favs);
      list = WORDS.filter(w => favSet.has(w.word));
    } else if (filterKey === 'weak') {
      var hardMap = {};
      try { hardMap = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}').hardCount || {}; } catch (e) {}
      list = WORDS.filter(w => (hardMap[w.word] || 0) > 0);
    } else if (isLettersMode) {
      var targetLetter = filterKey.startsWith('letter-') ? filterKey.slice(7).toUpperCase() : 'A';
      currentLetter = targetLetter;
      list = WORDS.filter(w => w.word.toUpperCase().startsWith(targetLetter));
    } else {
      list = WORDS;
    }

    rawCategoryWords = list;

    var displayTitle = filterTitles[filterKey] || (isLettersMode ? `首字母 ${currentLetter} 检索` : '单词列表');
    if (titleEl) titleEl.textContent = displayTitle;

    initFilterSystem();
    applyWordFilters();
  }

  function renderLetterChips(activeL) {
    var row = document.getElementById('words-letter-chips-row');
    if (!row) return;
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    row.innerHTML = alphabet.map(function (ch) {
      var isActive = ch === activeL;
      return `<button class="filter-chip ${isActive ? 'active' : ''}" data-letter="${ch}" type="button" style="padding:4px 10px;font-size:12px;font-weight:700">${ch}</button>`;
    }).join('');

    row.querySelectorAll('button[data-letter]').forEach(function (btn) {
      btn.onclick = function () {
        var l = btn.getAttribute('data-letter');
        location.hash = '#list/letter-' + l;
      };
    });
  }

  function renderTier2Page() {
    var container = document.getElementById('words-tier2-container');
    var pageInfo = document.getElementById('words-tier2-page-info');
    var prevBtn = document.getElementById('words-tier2-prev');
    var nextBtn = document.getElementById('words-tier2-next');
    var pag = document.getElementById('words-tier2-pagination');
    if (!container) return;

    if (!currentFilteredWords.length) {
      container.innerHTML = `
        <div style="padding:40px 20px;text-align:center;color:var(--color-text-muted)">
          <div style="font-size:36px;margin-bottom:8px">🔍</div>
          <div style="font-size:14px;font-weight:700;color:var(--color-text)">没有找到符合当前筛选条件的单词</div>
          <div style="font-size:12px;margin:6px 0 16px">可尝试放宽或清空筛选条件，探索更多真题考点</div>
          <button type="button" class="nav-btn primary" id="empty-clear-filters-btn" style="padding:8px 20px;border-radius:999px;cursor:pointer">一键清空筛选</button>
        </div>
      `;
      var clrBtn = document.getElementById('empty-clear-filters-btn');
      if (clrBtn) clrBtn.onclick = resetAllFilters;
      if (pag) pag.style.display = 'none';
      return;
    }

    var totalPages = Math.ceil(currentFilteredWords.length / PAGE_SIZE);
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    var start = (currentPage - 1) * PAGE_SIZE;
    var pagedWords = currentFilteredWords.slice(start, start + PAGE_SIZE);

    container.innerHTML = pagedWords.map(function (w) {
      var prog = studyState[w.word];
      var isMastered = prog && prog.level >= 4;
      var meaning = w.exam_meaning || w.translation || '';
      return `
        <div class="tier2-word-item" data-word="${esc(w.word)}">
          <div style="flex:1;min-width:0;padding-right:8px">
            <div>
              <span class="t2-word">${esc(w.word)}</span>
              <span class="t2-phonetic">${esc(w.phonetic || '')}</span>
            </div>
            <div class="t2-meaning">${esc(meaning)}</div>
          </div>
          <div style="flex-shrink:0;text-align:right">
            ${isMastered ? '<span class="t2-mastered-tag">✓ 已熟记</span>' : '<span style="font-size:11.5px;color:var(--color-text-faint)">›</span>'}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.tier2-word-item').forEach(function (el) {
      el.onclick = function () {
        var word = el.getAttribute('data-word');
        if (word) {
          location.hash = '#word/' + encodeURIComponent(word);
        }
      };
    });

    if (pag) {
      pag.style.display = totalPages > 1 ? 'flex' : 'none';
      if (pageInfo) pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页 (共 ${currentFilteredWords.length} 词)`;
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }
  }

  var pPrev = document.getElementById('words-tier2-prev');
  if (pPrev) {
    pPrev.onclick = function () {
      if (currentPage > 1) {
        currentPage--;
        renderTier2Page();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  }
  var pNext = document.getElementById('words-tier2-next');
  if (pNext) {
    pNext.onclick = function () {
      var totalPages = Math.ceil(currentFilteredWords.length / PAGE_SIZE);
      if (currentPage < totalPages) {
        currentPage++;
        renderTier2Page();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  }

  // --- 6. 第三级单词详情渲染 ---
  function renderTier3Detail(wordStr) {
    var w = WORDS.find(x => x.word.toLowerCase() === wordStr.toLowerCase());
    var headerWord = document.getElementById('words-detail-header-word');
    var favHeadBtn = document.getElementById('words-detail-fav-toggle');
    var contentBox = document.getElementById('words-detail-content-box');
    if (!contentBox) return;

    if (!w) {
      contentBox.innerHTML = `
        <div style="padding:40px 20px;text-align:center;color:var(--color-text-muted)">
          <div style="font-size:36px;margin-bottom:8px">🔍</div>
          <div style="font-size:14px;font-weight:700">未找到单词「${esc(wordStr)}」</div>
        </div>
      `;
      return;
    }

    if (headerWord) headerWord.textContent = w.word;

    var isFavorite = isFav(w.word);
    if (favHeadBtn) {
      favHeadBtn.textContent = isFavorite ? '★' : '☆';
      favHeadBtn.style.color = isFavorite ? '#f59e0b' : 'var(--color-text-muted)';
      favHeadBtn.onclick = function () {
        var nowFav = toggleFav(w.word);
        favHeadBtn.textContent = nowFav ? '★' : '☆';
        favHeadBtn.style.color = nowFav ? '#f59e0b' : 'var(--color-text-muted)';
        var bBtn = document.getElementById('words-detail-fav-btn');
        if (bBtn) bBtn.textContent = nowFav ? '⭐ 已在生词本' : '⭐ 加入生词本';
        if (window.KaoyanToast) window.KaoyanToast(nowFav ? '⭐ 已收藏至专属生词本' : '已移出生词本');
      };
    }

    var ai = AI_EX[w.word];
    var exEn = (ai && ai.en) || w.example_en || '';
    var exZh = (ai && ai.zh) || w.example_zh || '';
    var rawPos = (w.pos || (w.exam_meaning && w.exam_meaning.match(/^([a-z]+\.)/i) ? w.exam_meaning.match(/^([a-z]+\.)/i)[1] : '') || '核心').replace('.', '');
    var cleanMeaning = (w.exam_meaning || w.translation || '').replace(/^[a-z]+\.\s*/i, '');

    contentBox.innerHTML = `
      <div class="exam-card" style="margin-bottom:14px">
        <!-- 单词头部 -->
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:32px;font-weight:800;color:var(--color-primary);letter-spacing:-0.5px">${esc(w.word)}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;margin-top:6px">
            <span style="font-size:11px;background:var(--color-surface-offset);border:1px solid var(--color-border);padding:1px 6px;border-radius:6px;font-weight:700">英</span>
            <span style="font-size:13.5px;color:var(--color-text-muted)">${esc(w.phonetic || '')}</span>
            <button id="detail-speak-btn" type="button" style="background:none;border:none;color:var(--color-primary);font-size:16px;cursor:pointer;padding:2px 6px" title="朗读单词">🔊</button>
          </div>
        </div>

        <!-- 释义栏 -->
        <div class="bb-meaning-box" style="margin-bottom:12px">
          <span class="bb-pos-tag">${esc(rawPos)}</span>
          <span class="bb-meaning-text">${esc(cleanMeaning || '暂无详细中文释义')}</span>
        </div>

        <!-- 考研真题学术例句 -->
        ${exEn ? `
          <div class="bb-section-box" style="margin-bottom:12px">
            <div class="bb-section-head">
              <span class="bb-section-title">真题例句</span>
              <div class="bb-section-actions">
                <button class="bb-mini-btn" id="detail-speak-ex" type="button">🔊 读例句</button>
              </div>
            </div>
            <div class="bb-example-list">
              <div class="bb-example-item">
                <div class="bb-example-en" style="font-size:13.5px;line-height:1.6">${esc(exEn)}</div>
                <div class="bb-example-zh" style="font-size:12.5px;margin-top:4px;color:var(--color-text-muted)">${esc(exZh)}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 考点短语搭配 -->
        ${w.phrases && w.phrases.length > 0 ? `
          <div class="bb-section-box bb-phrases-box" style="margin-bottom:12px">
            <div class="bb-section-head">
              <span class="bb-section-title">考点搭配 / 常用短语</span>
              <span class="bb-section-tag" style="background:color-mix(in oklab, #0284c7 12%, transparent);color:#0284c7;border-color:color-mix(in oklab, #0284c7 25%, transparent)">高频搭配</span>
            </div>
            <div class="bb-phrase-list">
              ${w.phrases.map(function (p) {
                return `
                  <div class="bb-phrase-item">
                    <div class="bb-phrase-row">
                      <span class="bb-phrase-text">${esc(p.p)}</span>
                    </div>
                    <div class="bb-phrase-cn">${esc(p.c)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 词根词缀助记 -->
        <div class="bb-section-box bb-mnemonic-box" style="margin-bottom:16px">
          <div class="bb-section-head">
            <span class="bb-section-title">助记</span>
            <span class="bb-section-tag">词根词缀</span>
          </div>
          <div class="bb-mnemonic-content">
            <div class="bb-root-text">${esc(w.roots || w.root || (w.word + ' · 考研大纲核心词汇'))}</div>
            ${w.synonyms ? `<div class="bb-syn-row" style="margin-top:6px;font-size:12px"><strong style="color:var(--color-primary)">同义替换：</strong>${esc(w.synonyms)}</div>` : ''}
            ${w.confused ? `<div class="bb-confused-row" style="margin-top:4px;font-size:12px"><strong style="color:#ef4444">形近易混：</strong>${esc(w.confused)}</div>` : ''}
          </div>
        </div>

        <!-- 底部大操作栏 -->
        <div style="display:flex;gap:10px;margin-top:10px">
          <button class="nav-btn" id="words-detail-fav-btn" type="button" style="flex:1;padding:12px;font-size:14px;font-weight:700;border-radius:10px">
            ${isFavorite ? '⭐ 已在生词本' : '⭐ 加入生词本'}
          </button>
          <a class="btn primary" id="words-detail-study-btn" href="study.html" style="flex:1;padding:12px;font-size:14px;font-weight:700;border-radius:10px;text-align:center;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px">
            📖 开始背这个词
          </a>
        </div>
      </div>
    `;

    var spkWord = document.getElementById('detail-speak-btn');
    if (spkWord) spkWord.onclick = () => speak(w.word);

    var spkEx = document.getElementById('detail-speak-ex');
    if (spkEx) spkEx.onclick = () => speak(exEn);

    var bFav = document.getElementById('words-detail-fav-btn');
    if (bFav) {
      bFav.onclick = function () {
        var nowFav = toggleFav(w.word);
        bFav.textContent = nowFav ? '⭐ 已在生词本' : '⭐ 加入生词本';
        if (favHeadBtn) {
          favHeadBtn.textContent = nowFav ? '★' : '☆';
          favHeadBtn.style.color = nowFav ? '#f59e0b' : 'var(--color-text-muted)';
        }
        if (window.KaoyanToast) window.KaoyanToast(nowFav ? '⭐ 已收藏至专属生词本' : '已移出生词本');
      };
    }
  }

  // --- 7. 第一级实时搜索功能 ---
  var searchInput = document.getElementById('words-home-search-input');
  var searchClear = document.getElementById('words-home-search-clear');
  var searchResultsBox = document.getElementById('words-search-results-box');
  var searchResultsList = document.getElementById('words-search-results-list');
  var searchCountHint = document.getElementById('words-search-count-hint');
  var homeMainContent = document.getElementById('words-home-main-content');

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var val = searchInput.value.trim().toLowerCase();
      if (!val) {
        if (searchClear) searchClear.style.display = 'none';
        if (searchResultsBox) searchResultsBox.style.display = 'none';
        if (homeMainContent) homeMainContent.style.display = 'block';
        return;
      }

      if (searchClear) searchClear.style.display = 'block';
      if (homeMainContent) homeMainContent.style.display = 'none';
      if (searchResultsBox) searchResultsBox.style.display = 'block';

      var matches = WORDS.filter(function (w) {
        return w.word.toLowerCase().includes(val) ||
               (w.exam_meaning && w.exam_meaning.includes(val)) ||
               (w.translation && w.translation.includes(val));
      }).slice(0, 50);

      studyState = getStudyProgress();
      if (searchCountHint) searchCountHint.textContent = `找到 ${matches.length} 个匹配单词（点击直接查看详情）`;

      if (searchResultsList) {
        if (!matches.length) {
          searchResultsList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--color-text-muted);font-size:13px">未找到匹配词汇</div>`;
          return;
        }
        searchResultsList.innerHTML = matches.map(function (w) {
          var prog = studyState[w.word];
          var isMastered = prog && prog.level >= 4;
          return `
            <div class="tier2-word-item" data-word="${esc(w.word)}">
              <div style="flex:1;min-width:0">
                <div>
                  <span class="t2-word">${esc(w.word)}</span>
                  <span class="t2-phonetic">${esc(w.phonetic || '')}</span>
                </div>
                <div class="t2-meaning">${esc(w.exam_meaning || w.translation || '')}</div>
              </div>
              <div style="flex-shrink:0">
                ${isMastered ? '<span class="t2-mastered-tag">✓ 已熟记</span>' : '<span style="font-size:11px;color:var(--color-text-faint)">›</span>'}
              </div>
            </div>
          `;
        }).join('');

        searchResultsList.querySelectorAll('.tier2-word-item').forEach(function (el) {
          el.onclick = function () {
            var word = el.getAttribute('data-word');
            if (word) {
              location.hash = '#word/' + encodeURIComponent(word);
            }
          };
        });
      }
    });

    if (searchClear) {
      searchClear.onclick = function () {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
      };
    }
  }

  // 随机抽一词按钮
  var randomBtn = document.getElementById('words-random-btn');
  if (randomBtn) {
    randomBtn.onclick = function () {
      if (!WORDS.length) return;
      var r = WORDS[Math.floor(Math.random() * WORDS.length)];
      if (r) {
        location.hash = '#word/' + encodeURIComponent(r.word);
      }
    };
  }

  // 启动词库数据初始化
  initCatalogWords();
})();