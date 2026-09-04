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

  // 内置 AI 例句
  var AI_EX = {};
  if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) {
    Object.keys(window.__AI_EXAMPLES__.s).forEach(function (k) {
      AI_EX[k] = { en: window.__AI_EXAMPLES__.s[k][0], zh: window.__AI_EXAMPLES__.s[k][1] };
    });
  } else {
    fetch('data/ai_examples.json').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !d.s) return;
      Object.keys(d.s).forEach(function (k) {
        AI_EX[k] = { en: d.s[k][0], zh: d.s[k][1] };
      });
    }).catch(function () {});
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
    fetch('data/words.json').then(r => r.json()).then(processData).catch(function () {});
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
  var filterTitles = {
    core: '⭐ 核心高频词',
    high: '📌 高频重点词',
    expand: '🎯 重点扩展词',
    normal: '📚 普通扩展词',
    secondary: '⚡ 熟词僻义专项',
    letters: '🔤 按首字母浏览',
    fav: '⭐ 我的专属生词本',
    weak: '🔥 薄弱词专项强化'
  };

  function renderTier2List(filterKey) {
    studyState = getStudyProgress();
    var titleEl = document.getElementById('words-list-header-title');
    var countEl = document.getElementById('words-list-total-count');
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

    currentFilteredWords = list;
    currentPage = 1;

    var displayTitle = filterTitles[filterKey] || (isLettersMode ? `首字母 ${currentLetter} 检索` : '单词列表');
    if (titleEl) titleEl.textContent = displayTitle;
    if (countEl) countEl.textContent = list.length + ' 词';

    renderTier2Page();
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
    if (!container) return;

    if (!currentFilteredWords.length) {
      container.innerHTML = `
        <div style="padding:40px 20px;text-align:center;color:var(--color-text-muted)">
          <div style="font-size:36px;margin-bottom:8px">🍃</div>
          <div style="font-size:14px;font-weight:700">该分类下暂无收录单词</div>
          <div style="font-size:12px;margin-top:4px">可前往背词页面开启今日打卡</div>
        </div>
      `;
      var pag = document.getElementById('words-tier2-pagination');
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

    var pag = document.getElementById('words-tier2-pagination');
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