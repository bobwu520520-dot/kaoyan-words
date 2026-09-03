/* 考研词汇 — 查词页逻辑。本地词库 + 内置 AI 例句（离线可用）；
   词库外单词运行时回退 Free Dictionary API（在线词典，非 AI）。 */
(function () {
  'use strict';

  var WORDS = [], WORD_MAP = {}, AI_EX = {};
  var recent = [], activeIndex = -1;

  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch (e) {} }

  // ---- 主题切换（Light -> Dark -> OLED 纯黑） ----
  (function () {
    var t = document.querySelector('[data-theme-toggle]'); if (!t) return;
    var r = document.documentElement;
    var saved = lsGet('theme');
    var d = saved ? saved : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    r.setAttribute('data-theme', d);
    function paint(){
      var cur = r.getAttribute('data-theme') || 'light';
      var icon = cur === 'light' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' : (cur === 'dark' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>');
      t.setAttribute('aria-label', cur === 'light' ? '切换到暗色模式' : (cur === 'dark' ? '切换到OLED纯黑护眼模式' : '切换到浅色模式'));
      t.innerHTML = icon;
    }
    paint();
    t.addEventListener('click', function(){
      var cur = r.getAttribute('data-theme') || 'light';
      var next = cur === 'light' ? 'dark' : (cur === 'dark' ? 'oled' : 'light');
      r.setAttribute('data-theme', next);
      lsSet('theme', next);
      paint();
    });
  })();

  // ---- header 高度精确化（吸顶搜索对齐用） ----
  (function () {
    var hd = document.querySelector('.site-header');
    function setH() { if (hd) document.documentElement.style.setProperty('--header-h', hd.offsetHeight + 'px'); }
    setH();
    window.addEventListener('resize', setH);
  })();

  // ---- 导航高亮 ----
  (function(){
    var loc = (typeof window !== 'undefined' && window.location) ? window.location : { pathname: '' };
    var page = (loc.pathname || '').split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function(a){
      if (a.getAttribute('href') === page) a.classList.add('active');
    });
  })();

  var input = document.getElementById('search-input');
  if (!input) return; // 非查词页，仅运行主题切换
  var clearBtn = document.getElementById('clear-btn');
  var suggestList = document.getElementById('suggest-list');
  var card = document.getElementById('word-card');
  var recentSection = document.getElementById('recent-section');
  var recentChips = document.getElementById('recent-chips');
  var clearRecentBtn = document.getElementById('clear-recent');
  var randomBtn = document.getElementById('random-btn');
  try { recent = JSON.parse(lsGet('kaoyan_recent') || '[]'); } catch (e) { recent = []; }

  // ---- 加载词库与内置 AI 例句（优先使用已内嵌的离线 Bundle，兼容 file:/// 与 HTTP） ----
  var LOADED = 0;
  function maybeHome() { if (LOADED >= 2 && !input.value) renderHome(); }

  function onWordsLoaded(data) {
    WORDS = (data.words || []).filter(function (w) { return w.active !== false; });
    window.__ALL_WORDS__ = WORDS;
    WORDS.forEach(function (w) { WORD_MAP[w.word] = w; });
    LOADED++; maybeHome(); updateHeroStats();
    var locSearch = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
    var q = new URLSearchParams(locSearch).get('w');
    if (q) { input.value = q; lookup(q); } else { maybeHome(); }
  }

  function onAiLoaded(data) {
    try {
      var s = data.s || {};
      Object.keys(s).forEach(function (k) { AI_EX[k] = { en: s[k][0], zh: s[k][1] }; });
    } catch (e) { AI_EX = {}; }
    LOADED++; maybeHome(); updateHeroStats();
  }

  if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
    onWordsLoaded(window.__WORDS_DATA__);
  } else {
    var x1 = new XMLHttpRequest();
    x1.open('GET', 'data/words.json', true);
    x1.onload = function () {
      if ((x1.status === 200 || x1.status === 0) && x1.responseText) {
        try { onWordsLoaded(JSON.parse(x1.responseText)); return; } catch (e) {}
      }
      if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) onWordsLoaded(window.__WORDS_DATA__);
    };
    x1.onerror = function () {
      if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) onWordsLoaded(window.__WORDS_DATA__);
    };
    x1.send();
  }

  if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) {
    onAiLoaded(window.__AI_EXAMPLES__);
  } else {
    var x2 = new XMLHttpRequest();
    x2.open('GET', 'data/ai_examples.json', true);
    x2.onload = function () {
      if ((x2.status === 200 || x2.status === 0) && x2.responseText) {
        try { onAiLoaded(JSON.parse(x2.responseText)); return; } catch (e) {}
      }
      if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) onAiLoaded(window.__AI_EXAMPLES__);
      else { LOADED++; maybeHome(); updateHeroStats(); }
    };
    x2.onerror = function () {
      if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s) onAiLoaded(window.__AI_EXAMPLES__);
      else { LOADED++; maybeHome(); updateHeroStats(); }
    };
    x2.send();
  }

  // 主页顶部动态统计：真实词数 + 例句覆盖数
  function updateHeroStats() {
    var eyebrow = document.querySelector('.hero-eyebrow');
    if (!eyebrow || !WORDS.length) return;
    var n = Object.keys(AI_EX).length;
    eyebrow.innerHTML = '<span class="dot"></span>考研大纲 ' + WORDS.length + ' 词 · AI 例句已内置 ' + n + ' · 离线可用';
  }

  // ---- 联想建议：英文前缀/包含匹配，中文则搜释义；条目带词性与考研释义 ----
  function renderSuggestions(q) {
    q = q.trim();
    if (!q) { hideSuggestions(); return; }
    var lq = q.toLowerCase();
    var matches;
    if (/[\u4e00-\u9fa5]/.test(q)) {
      // 中文：匹配考研释义与全量释义
      matches = [];
      for (var i = 0; i < WORDS.length && matches.length < 8; i++) {
        var w0 = WORDS[i];
        if ((w0.exam_meaning || '').indexOf(q) > -1 || (w0.translation || '').indexOf(q) > -1) matches.push(w0);
      }
    } else {
      var seen = {};
      matches = WORDS.filter(function (w) { return w.word.indexOf(lq) === 0; })
        .concat(WORDS.filter(function (w) { return w.word.indexOf(lq) > 0; }))
        .filter(function (w) { if (seen[w.word]) return false; seen[w.word] = true; return true; })
        .slice(0, 8);
    }
    if (!matches.length) { hideSuggestions(); return; }
    activeIndex = -1;
    suggestList.innerHTML = matches.map(function (w) {
      var idx = lq ? w.word.indexOf(lq) : -1;
      var label;
      if (!lq || idx < 0) {
        label = esc(w.word);
      } else {
        label = esc(w.word.substring(0, idx)) + '<b>' + esc(w.word.substring(idx, idx + lq.length)) + '</b>' + esc(w.word.substring(idx + lq.length));
      }
      return '<li class="suggest-item" role="option" data-word="' + esc(w.word) + '">' +
        '<span class="sw">' + label + '</span>' +
        (w.pos ? '<span class="sp">' + esc(posShort(w.pos)) + '</span>' : '') +
        '<span class="st">' + esc(w.exam_meaning || w.translation || '') + '</span></li>';
    }).join('');
    suggestList.hidden = false;
  }
  function hideSuggestions(){ clearTimeout(debounceTimer); suggestList.hidden = true; activeIndex = -1; }
  suggestList.addEventListener('click', function (e) {
    var item = e.target.closest('.suggest-item');
    if (item) { var w = item.getAttribute('data-word'); input.value = w; lookup(w); hideSuggestions(); }
  });

  input.addEventListener('keydown', function (e) {
    if (suggestList.hidden) { if (e.key === 'Enter') { e.preventDefault(); lookup(input.value.trim()); hideSuggestions(); } return; }
    var items = suggestList.querySelectorAll('.suggest-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); markActive(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, -1); markActive(items); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) { var w = items[activeIndex].getAttribute('data-word'); input.value = w; lookup(w); hideSuggestions(); }
      else { lookup(input.value.trim()); hideSuggestions(); }
    } else if (e.key === 'Escape') { hideSuggestions(); }
  });
  function markActive(items){ items.forEach(function(el,i){ el.classList.toggle('active', i===activeIndex); }); if(activeIndex>=0&&items[activeIndex]) items[activeIndex].scrollIntoView({block:'nearest'}); }

  var debounceTimer;
  input.addEventListener('input', function () {
    clearBtn.hidden = !input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { renderSuggestions(input.value); }, 120);
  });
  input.addEventListener('focus', function () { if (input.value) renderSuggestions(input.value); });
  input.addEventListener('blur', function () { setTimeout(hideSuggestions, 150); });
  clearBtn.addEventListener('click', function () { input.value = ''; clearBtn.hidden = true; input.focus(); hideSuggestions(); });

  // 手机端向下滑动自动收起输入法软键盘 (Swipe down to dismiss keyboard)
  var touchStartY = 0;
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length === 1) touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length === 1) {
      var dy = e.touches[0].clientY - touchStartY;
      if (dy > 35 && document.activeElement === input) {
        input.blur();
      }
    }
  }, { passive: true });

  // ---- 查询 ----
  function lookup(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return;
    pushRecent(q);
    var entry = WORD_MAP[q];
    if (entry) { renderEntry(entry); return; }
    renderLoading(q);
    fetchApi(q, function (data) { data ? renderApi(q, data) : renderNotFound(q); });
  }

  // ---- 词条卡片（词库内命中） ----
  function renderEntry(w) {
    saveRecentSearch(w.word);
    var ai = AI_EX[w.word];
    var tagClass = w.tier === '核心高频' ? 'core' : w.tier === '高频重点' ? 'high' : 'base';
    var note = w.word + (w.phonetic ? '  ' + w.phonetic : '') + '\n' + (w.exam_meaning || w.translation || '');
    if (w.secondary_meanings) note += '\n熟词僻义：' + w.secondary_meanings;
    if (ai && ai.en) note += '\n例句：' + ai.en + (ai.zh ? '\n' + ai.zh : '');
    else if (w.example_en) note += '\n例句：' + w.example_en + (w.example_zh ? '\n' + w.example_zh : '');
    var html =
      '<div class="card-head">' +
        '<h2 class="headword">' + esc(w.word) + '</h2>' +
        (w.phonetic ? '<span class="phonetic">' + esc(w.phonetic) + '</span>' : '') +
        speakBtn(w.word) +
        (window.KaoyanQuiz ? KaoyanQuiz.favBtn(w.word) : '') +
        quizBtn(w.word) +
        copyBtn(note) +
      '</div>' +
      '<div class="badge-row">' +
        (w.pos ? '<span class="badge pos">' + esc(posShort(w.pos)) + '</span>' : '') +
        '<span class="badge ' + tagClass + '">' + esc(w.tier || w.tag || '') + '</span>' +
        (w.exam_tag ? '<span class="badge exam-tag">' + esc(w.exam_tag) + '</span>' : '') +
        (w.true_priority ? '<span class="badge freq">' + esc(w.true_priority) + '</span>' : '') +
      '</div>' +
      '<p class="meaning">' + esc(w.exam_meaning || w.translation || '') + '</p>' +
      (w.translation && w.exam_meaning && w.translation !== w.exam_meaning &&
        w.exam_meaning.indexOf(w.translation) < 0 && w.translation.indexOf(w.exam_meaning) < 0
        ? '<p class="meaning-sub" title="' + esc(w.translation) + '">' + esc(w.translation) + '</p>' : '');
    // 内置 AI 例句（考研风格，离线可用）；缺失时回退基础例句 / 在线词典
    if (ai && ai.en) {
      html += aiSentenceBlock(ai, w.word);
    } else if (w.example_en) {
      html += '<div class="examples"><div class="ex-label">例句</div>' +
        '<p class="example-en">' + highlightWord(w.example_en, w.word) + '</p>' +
        (w.example_zh ? '<p class="example-zh">' + esc(w.example_zh) + '</p>' : '') + '</div>';
    } else {
      html += '<div class="examples" id="ex-slot"><div class="ex-label">例句</div>' +
        '<p class="example-zh"><span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></span> 正在获取例句…</p></div>';
      fetchApi(w.word, function (data) {
        var slot = document.getElementById('ex-slot');
        if (!slot) return;
        var ex = extractExample(data);
        if (ex) { slot.innerHTML = '<div class="ex-label">例句</div><p class="example-en">' + highlightWord(ex, w.word) + '</p>'; }
        else { slot.innerHTML = '<div class="ex-label">例句</div><p class="example-zh">暂无例句，可参考上方释义。</p>'; }
      });
    }
    html += mnemonicPanel(w) + examPanel(w) + metaPanel(w);
    if (w.defs && w.defs.length) {
      html += '<div class="examples" style="margin-top:12px"><div class="ex-label">英文释义</div>';
      w.defs.forEach(function (d) { html += '<p style="margin-bottom:6px"><span class="badge pos" style="margin-right:8px">' + esc(d.pos||'') + '</span>' + esc(d.text) + '</p>'; });
      html += '</div>';
    }
    setCard(html, false);
  }

  function aiSentenceBlock(ai, word) {
    return '<div class="examples ai-sentence"><div class="ex-label"><span>AI 例句 · 考研语境</span><div style="display:flex;align-items:center;gap:6px"><button class="audio-btn" data-speak="' + esc(ai.en) + '" type="button" aria-label="朗读例句" title="朗读考研学术例句" style="width:24px;height:24px;font-size:11px">🔊</button><span class="ai-tag">内置 · 离线可用</span></div></div>' +
      '<p class="example-en">' + highlightWord(ai.en, word) + '</p>' +
      (ai.zh ? '<p class="example-zh">' + esc(ai.zh) + '</p>' : '') + '</div>';
  }

  // 助记与延伸：词根词缀拆解 + 词族派生（像墨墨一样的延伸记忆）
  function mnemonicPanel(w) {
    var rows = '';
    if (w.root) rows += '<p class="root-line"><strong>词根拆解：</strong>' + esc(w.root) + '</p>';
    if (w.word_family) rows += '<p><strong>词族延伸：</strong>' + linkWords(w.word_family) + '</p>';
    if (w.word_forms && (!w.word_family || w.word_forms.length <= w.word_family.length)) rows += '<p><strong>词形变化：</strong>' + esc(w.word_forms) + '</p>';
    if (!rows) return '';
    return '<div class="exam-panel mnemonic"><div class="ex-label">助记与延伸</div>' + rows + '</div>';
  }

  // 关联词文本 - 可点击链接（词库内命中才可点）
  function linkWords(str) {
    return '<span class="syn-chips" style="display:inline-flex;flex-wrap:wrap;gap:5px;vertical-align:middle;margin-top:2px">' +
      String(str).split(/[,;；，、]/).map(function (t) {
        t = t.trim(); if (!t) return '';
        var clean = t.replace(/[^a-zA-Z\- ]/g, '').trim().toLowerCase();
        if (clean && WORD_MAP[clean]) return '<a class="syn-chip" href="index.html?w=' + encodeURIComponent(clean) + '" title="查看同义词：' + esc(t) + '">' + esc(t) + '</a>';
        return '<span class="syn-chip plain">' + esc(t) + '</span>';
      }).filter(Boolean).join('') + '</span>';
  }

  // 考研强化（核心义/僻义/搭配/同反义，精选数据，缺省不显示占位）
  function examPanel(w) {
    var rows = '';
    if (w.secondary_meanings) rows += '<p><strong>熟词僻义：</strong>' + esc(w.secondary_meanings) + '</p>';
    if (w.collocation_hint) rows += '<p><strong>高频搭配：</strong>' + esc(w.collocation_hint) + '</p>';
    if (w.word_forms && (!w.word_family || w.word_forms.length > w.word_family.length)) rows += '<p><strong>词形变化：</strong>' + esc(w.word_forms) + '</p>';
    if (w.synonyms) rows += '<p><strong>🔄 考研同义改写 / 替换词对：</strong>' + linkWords(w.synonyms) + '</p>';
    if (w.antonyms) rows += '<p><strong>反义词对照：</strong>' + linkWords(w.antonyms) + '</p>';
    if (!rows) return '';
    return '<div class="exam-panel"><div class="ex-label">考研强化与命题同义改写</div>' + rows + '</div>';
  }

  // 词库数据里的易混词
  function metaPanel(w) {
    if (!w.confusable_words || !w.confusable_words.length) return '';
    return '<div class="exam-panel"><div class="ex-label">易混词</div>' +
      w.confusable_words.map(function (c) { return '<p class="confusable">' + linkWords(c) + '</p>'; }).join('') + '</div>';
  }

  function speakBtn(word) {
    return '<button class="audio-btn" type="button" data-speak="' + esc(word) + '" aria-label="朗读 ' + esc(word) + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 5a10 10 0 0 1 0 14M16 8a5 5 0 0 1 0 8"/></svg></button>';
  }

  function quizBtn(word) {
    return '<button class="audio-btn" type="button" data-quiz-word="' + esc(word) + '" aria-label="考点速测" title="🎯 该词真题考点速测">' +
      '<span style="font-size:13px">🎯</span></button>';
  }

  // 一键复制单词笔记（词 + 释义 + 例句）
  function copyBtn(text) {
    return '<button class="audio-btn" type="button" data-copy="' + esc(text) + '" aria-label="复制单词笔记" title="复制单词笔记">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>';
  }

  document.addEventListener('click', function (e) {
    var qb = e.target.closest('[data-quiz-word]');
    if (!qb) return;
    var wStr = qb.getAttribute('data-quiz-word');
    if (!wStr) return;
    var targetWord = WORD_MAP[wStr.toLowerCase()] || { word: wStr };
    if (window.KaoyanQuiz) window.KaoyanQuiz.startQuiz([targetWord], 1);
  });

  document.addEventListener('click', function (e) {
    var cb = e.target.closest('[data-copy]');
    if (!cb) return;
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(cb.getAttribute('data-copy')).then(function () {
      var old = cb.innerHTML;
      cb.innerHTML = '✓';
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      if (navigator.vibrate) try { navigator.vibrate(15); } catch(e){}
      setTimeout(function () { cb.innerHTML = old; }, 1200);
    }).catch(function () {});
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-speak]');
    if (!btn) return;
    var text = btn.getAttribute('data-speak');
    if (!text) return;
    try {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
      u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
      btn.classList.add('speaking');
      u.onend = function () { btn.classList.remove('speaking'); };
      u.onerror = function () { btn.classList.remove('speaking'); };
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (err) {}
  });

  // 查词卡片双击单词或例句触发发音 (Double tap word or example to speak)
  var lastHeadwordTap = 0;
  document.addEventListener('touchend', function (e) {
    var hw = e.target.closest('.headword, .example-en');
    if (!hw) return;
    var now = Date.now();
    if (now - lastHeadwordTap < 320) {
      var text = hw.textContent.trim();
      if (text) {
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
          u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
          hw.classList.add('speaking');
          u.onend = function () { hw.classList.remove('speaking'); };
          u.onerror = function () { hw.classList.remove('speaking'); };
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
          if (navigator.vibrate) try { navigator.vibrate([10, 20, 15]); } catch (err) {}
        } catch (err) {}
      }
    }
    lastHeadwordTap = now;
  }, { passive: true });

  // ---- 在线词典（仅词库外单词 / 缺例句时兜底，非 AI） ----
  function fetchApi(word, cb) {
    var url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word);
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { cb(d && d.length ? d : null); })
      .catch(function () { cb(null); });
  }
  function extractExample(data) {
    if (!data || !data.length) return '';
    var ex = '';
    (data[0].meanings || []).forEach(function (m) {
      (m.definitions || []).forEach(function (d) { if (!ex && d.example) ex = d.example; });
    });
    return ex;
  }
  function renderApi(word, data) {
    if (!data || !data.length) { renderNotFound(word); return; }
    var entry = data[0];
    var phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.length ? entry.phonetics[0].text : '');
    var defs = []; var exampleSent = '';
    (entry.meanings || []).slice(0, 3).forEach(function (m) {
      (m.definitions || []).forEach(function (d) { if (defs.length < 4) { defs.push({pos:m.partOfSpeech, text:d.definition}); if (!exampleSent && d.example) exampleSent = d.example; } });
    });
    var defHtml = defs.map(function (d) { return '<p style="margin-bottom:8px"><span class="badge pos" style="margin-right:8px">' + esc(d.pos||'') + '</span>' + esc(d.text) + '</p>'; }).join('');
    var html = '<div class="card-head"><h2 class="headword">' + esc(word) + '</h2>' + (phonetic ? '<span class="phonetic">' + esc(phonetic) + '</span>' : '') + speakBtn(word) + '</div>' +
      '<div class="badge-row"><span class="badge ext">在线词典</span></div>' +
      '<div class="examples" style="border-left:3px solid var(--color-primary);background:var(--color-surface-offset)"><div class="ex-label">英文释义</div>' + defHtml + '</div>';
    if (exampleSent) { html += '<div class="examples" style="margin-top:12px"><div class="ex-label">例句</div><p class="example-en">' + highlightWord(exampleSent, word) + '</p></div>'; }
    html += '<p class="api-note">该词未收录在内置词库中，释义与例句来自 Free Dictionary API（Wiktionary，CC-BY-SA）。</p>';
    setCard(html, false);
  }

  function renderLoading(q) { setCard('<div class="loading"><span class="spinner"></span>正在查询 “' + esc(q) + '”…</div>', true); }
  function renderNotFound(word) {
    setCard('<div class="error-state"><div class="err-word">' + esc(word) + '</div><p>未找到该单词，请检查拼写后重试。</p>' +
      '<button class="retry-random" id="notfound-random" type="button">🎲 随机学一个词</button></div>', true);
    var b = document.getElementById('notfound-random');
    if (b) b.addEventListener('click', randomWord);
  }
  function setCard(html, isEmpty, noScroll) {
    card.innerHTML = html; card.classList.toggle('empty', isEmpty);
    card.setAttribute('aria-busy', 'false');
    if (noScroll) return;
    var rect = card.getBoundingClientRect();
    if (rect.top < 0 || rect.top > 200) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function highlightWord(sentence, word) {
    var stem = escReg(word);
    var alt = /e$/.test(word) ? '|' + escReg(word.slice(0, -1)) + '\\w*' : '';
    var re = new RegExp('\\b(' + stem + '\\w*' + alt + ')', 'gi');
    return esc(sentence).replace(re, '<span class="hl">$1</span>');
  }

  // ---- 主页：今日一词 ----
  function dayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function todayWord() {
    var core = WORDS.filter(function (w) { return w.tier === '核心高频'; });
    if (!core.length) core = WORDS;
    var seed = dayKey().split('-').reduce(function (a, x) { return a + Number(x) * 7; }, 0);
    return core[seed % core.length];
  }
  function renderHome() {
    var w = todayWord();
    if (!w) return;
    var ai = AI_EX[w.word];
    var counts = { core: 0, high: 0, secondary: 0 };
    WORDS.forEach(function (x) {
      if (x.tier === '核心高频') counts.core++;
      else if (x.tier === '高频重点') counts.high++;
      if (x.secondary_meanings) counts.secondary++;
    });
    var html =
      '<div class="today-head"><span class="today-eyebrow">今日一词 · ' + esc(dayKey()) + '</span></div>' +
      '<div class="card-head" style="margin-top:6px">' +
        '<h2 class="headword">' + esc(w.word) + '</h2>' +
        (w.phonetic ? '<span class="phonetic">' + esc(w.phonetic) + '</span>' : '') +
        speakBtn(w.word) +
      '</div>' +
      '<div class="badge-row">' +
        (w.pos ? '<span class="badge pos">' + esc(posShort(w.pos)) + '</span>' : '') +
        '<span class="badge core">' + esc(w.tier || '') + '</span>' +
        (w.true_priority ? '<span class="badge freq">' + esc(w.true_priority) + '</span>' : '') +
      '</div>' +
      '<p class="meaning">' + esc(w.exam_meaning || w.translation || '') + '</p>' +
      (ai && ai.en ? aiSentenceBlock(ai, w.word)
        : (w.example_en ? '<div class="examples"><div class="ex-label">例句</div><p class="example-en">' + highlightWord(w.example_en, w.word) + '</p>' + (w.example_zh ? '<p class="example-zh">' + esc(w.example_zh) + '</p>' : '') + '</div>' : '')) +
      '<div class="home-actions">' +
        '<button class="home-btn primary" id="today-detail" type="button">查看完整词条</button>' +
        '<button class="home-btn" id="home-random" type="button">🎲 随机一词</button>' +
        '<a class="home-btn" href="study.html">开始背单词</a>' +
      '</div>' +
      '<div class="home-links">' +
        '<a class="home-link" href="words.html?tier=' + encodeURIComponent('核心高频') + '"><b>核心高频 <i>' + counts.core + '</i></b><span>真题最高优先级，必须熟练</span></a>' +
        '<a class="home-link" href="words.html?tier=' + encodeURIComponent('高频重点') + '"><b>高频重点 <i>' + counts.high + '</i></b><span>阅读、完形、翻译重点</span></a>' +
        '<a class="home-link" href="words.html?filter=secondary"><b>熟词僻义 <i>' + counts.secondary + '</i></b><span>真题爱考的特殊义项</span></a>' +
        '<a class="home-link" href="study.html"><b>背单词 <i>→</i></b><span>间隔重复，先看词再评分</span></a>' +
      '</div>';
    setCard(html, false, true);
    var d = document.getElementById('today-detail');
    if (d) d.addEventListener('click', function () { lookup(w.word); });
    var r = document.getElementById('home-random');
    if (r) r.addEventListener('click', randomWord);
  }

  // ---- 最近查询 ----
  function pushRecent(word) {
    word = word.toLowerCase();
    recent = [word].concat(recent.filter(function (w) { return w !== word; })).slice(0, 10);
    try { lsSet('kaoyan_recent', JSON.stringify(recent)); } catch (e) {}
    renderRecent();
  }
  function renderRecent() {
    if (!recent.length) { recentSection.hidden = true; return; }
    recentSection.hidden = false;
    recentChips.innerHTML = recent.map(function (w) { return '<a class="chip" href="index.html?w=' + encodeURIComponent(w) + '">' + esc(w) + '</a>'; }).join('');
  }
  renderRecent();
  if (clearRecentBtn) clearRecentBtn.addEventListener('click', function () {
    recent = [];
    try { lsSet('kaoyan_recent', '[]'); } catch (e) {}
    renderRecent();
  });

  randomBtn.addEventListener('click', randomWord);
  function randomWord() {
    if (!WORDS.length) return;
    // 70% 概率从核心高频/高频重点中随机（优先有价值的词），30% 全库随机
    var pool = (Math.random() < 0.7)
      ? WORDS.filter(function (w) { return w.tier === '核心高频' || w.tier === '高频重点'; })
      : WORDS;
    if (!pool.length) pool = WORDS;
    var w = pool[Math.floor(Math.random() * pool.length)].word;
    input.value = w; lookup(w);
  }

  // ---- helpers ----
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function escReg(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // 词性缩写规范（数据源存在 "verb"、"v.."、"adve." 等脏值）
  function posShort(p) {
    var s = String(p || '').trim().toLowerCase();
    if (!s) return '';
    if (s.indexOf('adj') === 0) return 'adj.';
    if (s.indexOf('adv') === 0) return 'adv.';
    if (s.indexOf('verb') === 0 || s.indexOf('v') === 0 || /(^|[^a-z])v\b/.test(s)) return 'v.';
    if (s.indexOf('noun') === 0 || s.indexOf('n.') === 0 || /(^|[^a-z])n\b/.test(s)) return 'n.';
    if (s.indexOf('prep') === 0) return 'prep.';
    if (s.indexOf('conj') === 0) return 'conj.';
    if (s.indexOf('pron') === 0) return 'pron.';
    return s;
  }

  // ---- 桌面端全键盘快捷键 (/ 聚焦搜索，Esc 清空/失焦) ----
  window.addEventListener('keydown', function (e) {
    if (e.target.matches('input,textarea,select') || e.target.isContentEditable) {
      if (e.key === 'Escape' && input) { input.blur(); if (suggestList) suggestList.hidden = true; }
      return;
    }
    if (e.key === '/' && input) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
      randomWord();
    }
  });

  // ---- 字号偏好持久化 ----
  (function () {
    var fs = lsGet('kaoyan_font_scale');
    if (fs) document.documentElement.style.setProperty('--fs', fs);
  })();

  // ---- 最近查词历史管理 ----
  function saveRecentSearch(word) {
    if (!word) return;
    try {
      var recents = JSON.parse(lsGet('kao_recent_search') || '[]');
      recents = recents.filter(function (w) { return w.toLowerCase() !== word.toLowerCase(); });
      recents.unshift(word);
      if (recents.length > 8) recents = recents.slice(0, 8);
      lsSet('kao_recent_search', JSON.stringify(recents));
      renderRecentSearchChips();
    } catch (e) {}
  }

  function renderRecentSearchChips() {
    var box = document.getElementById('recent-search-chips');
    if (!box) return;
    try {
      var recents = JSON.parse(lsGet('kao_recent_search') || '[]');
      if (!recents.length) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = '<span style="font-size:11.5px;color:var(--color-text-muted);font-weight:600">🕒 最近查词：</span>' +
        recents.map(function (w) {
          return '<button class="filter-chip" data-search-chip="' + esc(w) + '" type="button" style="font-size:11.5px;padding:2px 8px;cursor:pointer">' + esc(w) + '</button>';
        }).join('') +
        '<button class="filter-chip" id="clear-recents-btn" type="button" style="font-size:10px;color:var(--color-text-faint);padding:2px 6px;cursor:pointer">清空</button>';
      
      box.querySelectorAll('[data-search-chip]').forEach(function (btn) {
        btn.onclick = function () {
          var targetWord = btn.getAttribute('data-search-chip');
          if (targetWord && input) {
            input.value = targetWord;
            searchWord(targetWord);
          }
        };
      });

      var clearBtn = document.getElementById('clear-recents-btn');
      if (clearBtn) {
        clearBtn.onclick = function () {
          lsSet('kao_recent_search', '[]');
          renderRecentSearchChips();
        };
      }
    } catch (e) { box.hidden = true; }
  }

  // 初始渲染最近查词
  renderRecentSearchChips();

  // ---- 网络状态监测 (离线/在线提示) ----
  window.addEventListener('offline', function () {
    var b = document.createElement('div');
    b.id = 'offline-toast';
    b.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--color-accent);color:#fff;padding:8px 18px;border-radius:999px;font-size:12px;font-weight:600;z-index:9999;box-shadow:var(--shadow-md);animation:fadein .2s ease;';
    b.textContent = '当前处于离线模式 · 词库已全量缓存可离线使用';
    document.body.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 4000);
  });
})();
