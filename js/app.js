/* 考研词汇 — 查词页逻辑。本地词库优先，缺例句时运行时回退到 Free Dictionary API。 */
(function () {
  'use strict';

  var WORDS = [], WORD_MAP = {};
  var recent = [], activeIndex = -1;
  var aiConfig = { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: '' };
  try {
    var aiCfgKey = (window.KaoyanGate && window.KaoyanGate.storageKey) ? window.KaoyanGate.storageKey('kaoyan_ai_config') : 'kaoyan_ai_config';
    var savedAi = JSON.parse(localStorage.getItem(aiCfgKey) || '{}');
    aiConfig.baseUrl = savedAi.baseUrl || aiConfig.baseUrl;
    aiConfig.model = savedAi.model || aiConfig.model;
    aiConfig.apiKey = savedAi.apiKey || (window.KaoyanGate ? window.KaoyanGate.apiKey : '');
  } catch (e) {}

  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch (e) {} }

  // ---- theme ----(放在查词页逻辑之前,词库页也要能用主题切换)
  (function () {
    var t = document.querySelector('[data-theme-toggle]'); if (!t) return;
    var r = document.documentElement;
    var saved = lsGet('theme');
    var d = saved ? saved : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    r.setAttribute('data-theme', d);
    function paint(){ var isDark = r.getAttribute('data-theme')==='dark'; t.setAttribute('aria-label', isDark?'切换到浅色模式':'切换到深色模式'); t.innerHTML = isDark ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'; }
    paint();
    t.addEventListener('click', function(){ d = d==='dark'?'light':'dark'; r.setAttribute('data-theme', d); lsSet('theme', d); paint(); });
  })();

  window.KaoyanAI = {
    getConfig: function(){ return {baseUrl:aiConfig.baseUrl, model:aiConfig.model, apiKey:aiConfig.apiKey}; },
    generateMulti: function(items){
      var list = items.map(function(x){ return x.word + '（' + (x.translation || '释义待查询') + '）'; }).join('、');
      var prompt = '你是考研英语词汇老师。请把下面所有目标词自然地放进同一个高质量英文句子中：' + list + '。要求：所有目标词必须出现并且词性、搭配、语义都正确；优先考研阅读、议论文、社会科学、教育、科技、经济语境；30-55词；优先自然连贯，不要为了凑词而写生硬句子；允许定语从句、让步、因果、非谓语但不要刻意堆砌；生成后自检每个目标词是否真的出现且使用正确；给出准确中文翻译、语境主题、语法结构和重点词义。严格JSON：{"sentence":"...","translation":"...","topic":"...","structure":"...","vocabulary":"..."}。';
      var body = JSON.stringify({model:aiConfig.model,messages:[{role:'system',content:'你是严谨的考研英语教师，尤其重视词汇搭配、语法正确性和阅读语境。'},{role:'user',content:prompt}],temperature:0.55,max_tokens:500});
      if (!window.KaoyanGate) return Promise.reject(new Error('初始化失败，请刷新页面'));
      return window.KaoyanGate.chat(body).then(function(t){var data=JSON.parse(t), c=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content||''; c=String(c).replace(/^```json\s*/i,'').replace(/```$/,'').trim(); var o=JSON.parse(c); if(!o.sentence||!o.translation) throw new Error('AI 返回格式异常'); return o;});
    }
  };

  var input = document.getElementById('search-input');
  if (!input) return; // 非查词页，仅运行主题切换
  var clearBtn = document.getElementById('clear-btn');
  var suggestList = document.getElementById('suggest-list');
  var card = document.getElementById('word-card');
  var recentSection = document.getElementById('recent-section');
  var recentChips = document.getElementById('recent-chips');
  var randomBtn = document.getElementById('random-btn');
  var aiModal = document.getElementById('ai-modal');
  var aiSettingsBtn = document.getElementById('ai-settings-btn');
  var aiBaseUrl = document.getElementById('ai-base-url');
  var aiModel = document.getElementById('ai-model');
  var aiApiKey = document.getElementById('ai-api-key');
  var aiSave = document.getElementById('ai-save');
  function openAiSettings() {
    if (!aiModal) return;
    aiBaseUrl.value = aiConfig.baseUrl; aiModel.value = aiConfig.model;
    // 内置 Key 不预填:留空即使用内置 Key,填了则覆盖
    var saved = null; try { saved = JSON.parse(localStorage.getItem(aiCfgKey) || '{}'); } catch (e) {}
    aiApiKey.value = (saved && saved.apiKey) ? saved.apiKey : '';
    aiApiKey.placeholder = '留空则使用内置 Key';
    aiModal.hidden = false; aiModal.setAttribute('aria-hidden','false'); aiModal.removeAttribute('inert');
    setTimeout(function(){ aiApiKey.focus(); }, 0);
  }
  function closeAiSettings() { if (!aiModal) return; aiModal.hidden = true; aiModal.setAttribute('aria-hidden','true'); aiModal.setAttribute('inert',''); }
  if (aiSettingsBtn) aiSettingsBtn.addEventListener('click', openAiSettings);
  document.addEventListener('click', function(e){ if (e.target.closest('[data-ai-close]')) closeAiSettings(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && aiModal && !aiModal.hidden) closeAiSettings(); });
  if (aiSave) aiSave.addEventListener('click', function(){
    aiConfig.baseUrl = (aiBaseUrl.value || '').trim().replace(/\/$/, '') || 'https://api.deepseek.com/v1';
    aiConfig.model = (aiModel.value || '').trim() || 'deepseek-chat';
    aiConfig.apiKey = (aiApiKey.value || '').trim();
    try { localStorage.setItem(aiCfgKey, JSON.stringify(aiConfig)); } catch(e) {}
    closeAiSettings();
  });

  // ---- load bank ----
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/words.json', true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      WORDS = data.words || [];
      WORDS.forEach(function (w) { WORD_MAP[w.word] = w; });
      // 跨页查词 ?w=word
      var q = new URLSearchParams(location.search).get('w');
      if (q) { input.value = q; lookup(q); }
    }
  };
  xhr.send();

  // ---- suggestions ----
  function renderSuggestions(q) {
    q = q.trim().toLowerCase();
    if (!q) { hideSuggestions(); return; }
    var seen = {};
    var matches = WORDS.filter(function (w) { return w.word.indexOf(q) === 0; })
      .concat(WORDS.filter(function (w) { return w.word.indexOf(q) > 0; }))
      .filter(function (w) { if (seen[w.word]) return false; seen[w.word] = true; return true; })
      .slice(0, 8);
    if (!matches.length) { hideSuggestions(); return; }
    activeIndex = -1;
    suggestList.innerHTML = matches.map(function (w, i) {
      var idx = w.word.indexOf(q);
      var label = esc(w.word.substring(0, idx)) + '<b>' + esc(w.word.substring(idx, idx + q.length)) + '</b>' + esc(w.word.substring(idx + q.length));
      return '<li class="suggest-item" role="option" data-word="' + esc(w.word) + '" data-idx="' + i + '"><span class="sw">' + label + '</span><span class="st">' + esc(w.exam_meaning || w.translation || w.tier || '') + '</span></li>';
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

  // ---- lookup ----
  function lookup(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return;
    pushRecent(q);
    var entry = WORD_MAP[q];
    if (entry) { renderEntry(entry); return; }
    renderLoading(q);
    fetchApi(q, function (data) { data ? renderApi(q, data) : renderNotFound(q); });
  }

  function renderEntry(w) {
    var tagClass = w.tier === '核心高频' ? 'core' : w.tier === '高频重点' ? 'high' : 'base';
    var html =
      '<div class="card-head">' +
        '<h2 class="headword">' + esc(w.word) + '</h2>' +
        (w.phonetic ? '<span class="phonetic">' + esc(w.phonetic) + '</span>' : '') +
        speakBtn(w.word) +
      '</div>' +
      '<div class="badge-row">' +
        (w.pos ? '<span class="badge pos">' + esc(w.pos) + '</span>' : '') +
        '<span class="badge ' + tagClass + '">' + esc(w.tier || w.tag || '') + '</span>' +
        completenessBadge(w) +
      '</div>' +
      '<p class="meaning">' + esc(w.exam_meaning || w.translation || '暂无释义，可点击下方 AI 生成并核验') + '</p>';
    if (w.example_en) {
      html += '<div class="examples"><div class="ex-label">例句</div>' +
        '<p class="example-en">' + highlightWord(w.example_en, w.word) + '</p>' +
        (w.example_zh ? '<p class="example-zh">' + esc(w.example_zh) + '</p>' : '') + '</div>';
    } else {
      // 运行时回退取例句
      html += '<div class="examples" id="ex-slot"><div class="ex-label">例句</div>' +
        '<p class="example-zh"><span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></span> 正在获取例句…</p></div>';
      fetchApi(w.word, function (data) {
        var slot = document.getElementById('ex-slot');
        if (!slot) return;
        var ex = extractExample(data);
        if (ex) { slot.innerHTML = '<div class="ex-label">例句</div><p class="example-en">' + highlightWord(ex, w.word) + '</p>'; }
        else { slot.innerHTML = '<div class="ex-label">例句</div><p class="example-zh">暂无例句，可参考下方释义。</p>'; }
      });
    }
    html += '<div class="exam-panel"><div class="ex-label">考研强化</div>' +
      '<p><strong>考研核心义：</strong>' + esc(w.exam_meaning || w.translation || '暂无可靠考研义项') + '</p>' + (w.secondary_meanings ? '<p><strong>熟词僻义：</strong>' + esc(w.secondary_meanings) + '</p>' : '<p class="muted">熟词僻义：暂无可靠数据，建议用 AI 核验</p>') +
      (w.collocation_hint ? '<p><strong>搭配提示：</strong>' + esc(w.collocation_hint) + '</p>' : '<p class="muted">高频搭配：点击 AI 生成并核验</p>') +
      '</div>';
    html += metaPanel(w);
    html += aiSentenceHtml(w.word, w.translation, w.pos);
    // 释义（来自API缓存）
    if (w.defs && w.defs.length) {
      html += '<div class="examples" style="margin-top:12px"><div class="ex-label">英文释义</div>';
      w.defs.forEach(function (d) { html += '<p style="margin-bottom:6px"><span class="badge pos" style="margin-right:8px">' + esc(d.pos||'') + '</span>' + esc(d.text) + '</p>'; });
      html += '</div>';
    }
    setCard(html, false);
  }

  // 词族/词形/同反义词/易混词（精选数据，缺省不显示占位）
  function metaPanel(w) {
    var rows = '';
    if (w.word_family) rows += '<p><strong>词族：</strong>' + esc(w.word_family) + '</p>';
    if (w.word_forms) rows += '<p><strong>词形变化：</strong>' + esc(w.word_forms) + '</p>';
    if (w.synonyms) rows += '<p><strong>同义词：</strong>' + esc(w.synonyms) + '</p>';
    if (w.antonyms) rows += '<p><strong>反义词：</strong>' + esc(w.antonyms) + '</p>';
    if (w.confusable_words && w.confusable_words.length) rows += '<p><strong>易混词：</strong></p>' + w.confusable_words.map(function (c) { return '<p class="confusable">' + esc(c) + '</p>'; }).join('');
    if (!rows) return '';
    return '<div class="exam-panel"><div class="ex-label">词汇关联</div>' + rows + '</div>';
  }

  function speakBtn(word) {
    return '<button class="audio-btn" type="button" data-speak="' + esc(word) + '" aria-label="朗读 ' + esc(word) + '">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19 5a10 10 0 0 1 0 14M16 8a5 5 0 0 1 0 8"/></svg></button>';
  }

  // 数据完整度徽章（与考频无关：音标/词性/释义/核心义/例句/中译/搭配 各1分，僻义/词族/来源可靠性 各0.5分）
  function completenessBadge(w) {
    if (!w) return '';
    var full = [['phonetic','音标'],['pos','词性'],['translation','释义'],['exam_meaning','核心义'],['example_en','例句'],['example_zh','中译'],['collocation_hint','搭配']];
    var pts = 0, missing = [];
    full.forEach(function (f) { if (w[f[0]]) pts += 1; else missing.push(f[1]); });
    if (w.secondary_meanings) pts += 0.5; else missing.push('僻义');
    if (w.word_family) pts += 0.5; else missing.push('词族');
    var src = String(w.source || '');
    var srcPts = /manual|curated|verified/i.test(src) ? 0.5 : (/ecdict/i.test(src) ? 0.3 : 0);
    pts += srcPts;
    var total = 8.5, pct = Math.round(pts / total * 100);
    var filled = Math.round(pct / 10);
    var bar = new Array(11).join('█').slice(0, filled) + new Array(11 - filled).join('░');
    var title = '数据完整度 ' + pct + '%' + (missing.length ? '；缺失：' + missing.join('、') : '；字段齐全');
    return '<span class="badge completeness" title="' + esc(title) + '">' + bar + ' ' + pct + '%' + (w.quality_score ? ' · ' + esc(String(w.quality_score).toUpperCase()) + '级' : '') + '</span>';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-speak]');
    if (!btn) return;
    try {
      var u = new SpeechSynthesisUtterance(btn.getAttribute('data-speak'));
      u.lang = 'en-US'; u.rate = 0.92;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (err) {}
  });

  // ---- API ----
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
    html += aiSentenceHtml(word, defs.length ? defs[0].text : '', entry.meanings && entry.meanings[0] ? entry.meanings[0].partOfSpeech : '');
    html += '<p class="api-note">该词未收录在内置词库中，释义与例句来自 Free Dictionary API（Wiktionary，CC-BY-SA）。</p>';
    setCard(html, false);
  }

  function aiSentenceHtml(word, translation, pos) {
    return '<div class="examples ai-sentence" data-ai-word="' + esc(word) + '" data-ai-translation="' + esc(translation || '') + '" data-ai-pos="' + esc(pos || '') + '">' +
      '<div class="ex-label"><span>AI 造句</span><button class="ai-generate" type="button" data-ai-generate="' + esc(word) + '">✨ 生成考研例句</button></div>' +
      '<div class="ai-result"><p class="ai-empty">让 AI 根据这个单词的考研语境生成一个自然例句，并附中文翻译。</p></div></div>';
  }
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-ai-generate]');
    if (!btn) return;
    var box = btn.closest('.ai-sentence');
    if (!box) return;
    if (!aiConfig.apiKey) { openAiSettings(); return; }
    generateAiSentence(btn, box);
  });
  function generateAiSentence(btn, box) {
    var word = btn.getAttribute('data-ai-generate') || '';
    var translation = box.getAttribute('data-ai-translation') || '';
    var pos = box.getAttribute('data-ai-pos') || '';
    var result = box.querySelector('.ai-result');
    btn.disabled = true; btn.textContent = '生成中…';
    result.innerHTML = '<p class="ai-empty"><span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle"></span> AI 正在根据考研语境造句…</p>';
    var prompt = '请为英语考研词汇学习生成高质量例句。目标单词：' + word + '。中文释义：' + translation + '。词性：' + pos + '。要求：优先使用提供的考研常考义项，并特别检查熟词僻义；28-45词；自然、准确、学术化，像考研英语阅读或议论文中的真实句子；目标词必须使用正确词性、搭配和语义；不要为了塞入目标词而制造生硬表达；避免明显的机器翻译腔和过度口语化；给出2-4个高频搭配、中文用法提示和语法结构。严格JSON：{\"sentence\":\"英文例句\",\"translation\":\"中文翻译\",\"collocations\":[\"搭配1\",\"搭配2\"],\"usage\":\"中文用法提示\",\"structure\":\"语法结构\"}。';
    var body = JSON.stringify({model:aiConfig.model, messages:[{role:'system',content:'你是考研英语词汇老师，擅长用自然、准确的学术英语造句。'},{role:'user',content:prompt}], temperature:0.7, max_tokens:500});
    var custom = window.KaoyanGate.getCustom ? window.KaoyanGate.getCustom() : null;
    window.KaoyanGate.chat(body, custom)
      .then(function(text){
        var data = JSON.parse(text); var content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
        content = String(content || '').replace(/^```json\s*/i,'').replace(/```$/,'').trim();
        var obj = JSON.parse(content);
        if (!obj.sentence) throw new Error('AI 返回格式异常');
        result.innerHTML = '<p class="example-en">' + highlightWord(obj.sentence, word) + '</p><p class="example-zh">' + esc(obj.translation || '') + '</p>' + (obj.collocations && obj.collocations.length ? '<p class="ai-meta"><b>高频搭配：</b>' + esc(obj.collocations.join(' · ')) + '</p>' : '') + (obj.usage ? '<p class="ai-meta"><b>用法：</b>' + esc(obj.usage) + '</p>' : '') + (obj.structure ? '<p class="ai-meta"><b>结构：</b>' + esc(obj.structure) + '</p>' : '');
      })
      .catch(function(err){
        console.error(err); result.innerHTML = '<p class="ai-empty">生成失败：' + esc(aiErrorMessage(err)) + '。可点击「AI 设置」检查 API 地址、模型和 Key。</p>';
      })
      .finally(function(){ btn.disabled=false; btn.textContent='✨ 再生成'; });
  }
  function aiErrorMessage(err) {
    var s = String(err && err.message || err || '网络错误');
    try { var j=JSON.parse(s); if(j.error && j.error.message) return j.error.message; } catch(e) {}
    if (/Failed to fetch|NetworkError|CORS/i.test(s)) return '网络请求失败（可能是 API 跨域限制）';
    return s.slice(0,160);
  }

  function renderLoading(q) { setCard('<div class="loading"><span class="spinner"></span>正在查询 “' + esc(q) + '”…</div>', true); }
  function renderNotFound(word) { setCard('<div class="error-state"><div class="err-word">' + esc(word) + '</div><p>未找到该单词，请检查拼写后重试。</p></div>', true); }
  function setCard(html, isEmpty) {
    card.innerHTML = html; card.classList.toggle('empty', isEmpty);
    card.setAttribute('aria-busy', 'false');
    var rect = card.getBoundingClientRect();
    if (rect.top < 0 || rect.top > 200) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function highlightWord(sentence, word) {
    var re = new RegExp('(' + escReg(word) + '\\w*)', 'gi');
    return esc(sentence).replace(re, '<span class="hl">$1</span>');
  }

  // ---- recent ----
  function pushRecent(word) {
    word = word.toLowerCase();
    recent = [word].concat(recent.filter(function (w) { return w !== word; })).slice(0, 8);
    renderRecent();
  }
  function renderRecent() {
    if (!recent.length) { recentSection.hidden = true; return; }
    recentSection.hidden = false;
    recentChips.innerHTML = recent.map(function (w) { return '<a class="chip" href="search.html?w=' + encodeURIComponent(w) + '">' + esc(w) + '</a>'; }).join('');
  }

  randomBtn.addEventListener('click', function () {
    if (!WORDS.length) return;
    // 70% 概率从核心高频/高频重点中随机(优先有价值的词), 30% 全库随机
    var pool = (Math.random() < 0.7)
      ? WORDS.filter(function (w) { return w.tier === '核心高频' || w.tier === '高频重点'; })
      : WORDS;
    if (!pool.length) pool = WORDS;
    var w = pool[Math.floor(Math.random() * pool.length)].word;
    input.value = w; lookup(w);
  });

  // ---- helpers ----
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function escReg(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
})();
