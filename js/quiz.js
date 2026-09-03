/* 考研词汇 — 真题多模式自测与模考引擎 (Interactive Multi-Mode Quiz Suite v3.0)
   支持 3 大真题专项题型：
   1. 🔤 英译汉释义辨析 (Meaning Quiz)
   2. 🔄 考研同义改写专项测 (Synonym Paraphrasing Quiz)
   3. 🧩 真题例句语境填空测 (Contextual Cloze Quiz)
   支持单词专属考点速测、错题专练、键盘 1-4 / A-D 极速作答与 Web Audio 音效。 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KaoyanQuiz = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var favs = new Set();
  try {
    var s1 = JSON.parse(localStorage.getItem('kaoyan_favs') || '[]');
    var s2 = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
    if (Array.isArray(s1)) s1.forEach(function(w){ favs.add(String(w).toLowerCase().trim()); });
    if (Array.isArray(s2)) s2.forEach(function(w){ favs.add(String(w).toLowerCase().trim()); });
  } catch (e) {}

  function saveFavs() {
    try {
      var arr = Array.from(favs);
      localStorage.setItem('kaoyan_favs', JSON.stringify(arr));
      localStorage.setItem('kao_quiz_favs', JSON.stringify(arr));
    } catch (e) {}
  }

  function isFav(word) {
    return favs.has(String(word).toLowerCase().trim());
  }

  function toggleFav(word) {
    word = String(word).toLowerCase().trim();
    if (!word) return false;
    if (favs.has(word)) favs.delete(word);
    else {
      favs.add(word);
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      if (navigator.vibrate) try { navigator.vibrate([12, 20, 15]); } catch (e) {}
    }
    saveFavs();
    document.querySelectorAll('[data-fav="' + word + '"]').forEach(function (btn) {
      btn.classList.toggle('active', favs.has(word));
      btn.setAttribute('aria-label', favs.has(word) ? '取消收藏' : '加入生词本');
      btn.title = favs.has(word) ? '已在生词本中' : '加入生词本';
    });
    return favs.has(word);
  }

  function favBtn(word) {
    var active = isFav(word);
    return '<button class="fav-btn' + (active ? ' active' : '') + '" type="button" data-fav="' + word + '" aria-label="' + (active ? '取消收藏' : '加入生词本') + '" title="' + (active ? '已在生词本中' : '加入生词本') + '">★</button>';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-fav]');
    if (!btn) return;
    var w = btn.getAttribute('data-fav');
    if (w) toggleFav(w);
  });

  // ---- Quiz Modal Engine ----
  var quizState = {
    pool: [],
    queue: [],
    index: 0,
    score: 0,
    answered: false,
    timer: null,
    mistakes: [],
    mode: 'meaning' // 'meaning', 'synonym', 'cloze'
  };

  var modalEl = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'quiz-modal';
    modalEl.className = 'quiz-modal';
    modalEl.hidden = true;
    modalEl.innerHTML = '<div class="quiz-backdrop" id="quiz-backdrop"></div>' +
      '<div class="quiz-panel">' +
        '<div class="quiz-head">' +
          '<h3>🎯 考研真题速测</h3>' +
          '<div class="quiz-modes" role="tablist">' +
            '<button class="quiz-mode-btn active" data-qmode="meaning" type="button">🔤 释义速测</button>' +
            '<button class="quiz-mode-btn" data-qmode="synonym" type="button">🔄 同义替换</button>' +
            '<button class="quiz-mode-btn" data-qmode="cloze" type="button">🧩 例句填空</button>' +
          '</div>' +
          '<span class="quiz-prog" id="quiz-prog">0/10</span>' +
          '<button class="ai-close" id="quiz-close" type="button" aria-label="关闭">×</button>' +
        '</div>' +
        '<div id="quiz-body"></div>' +
      '</div>';
    document.body.appendChild(modalEl);
    document.getElementById('quiz-close').onclick = closeQuiz;
    document.getElementById('quiz-backdrop').onclick = closeQuiz;

    // Mode buttons
    modalEl.querySelectorAll('.quiz-mode-btn').forEach(function (btn) {
      btn.onclick = function () {
        modalEl.querySelectorAll('.quiz-mode-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
        quizState.mode = btn.getAttribute('data-qmode');
        quizState.index = 0;
        quizState.score = 0;
        quizState.mistakes = [];
        renderQuizQuestion();
      };
    });

    return modalEl;
  }

  function closeQuiz() {
    if (modalEl) modalEl.hidden = true;
    clearTimeout(quizState.timer);
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function getGlobalWords() {
    if (window.__ALL_WORDS__ && window.__ALL_WORDS__.length) return window.__ALL_WORDS__;
    if (quizState.pool && quizState.pool.length >= 4) return quizState.pool;
    return [];
  }

  function startQuiz(wordsPool, count, mode) {
    count = count || 10;
    mode = mode || 'meaning';
    var pool = (wordsPool && wordsPool.length) ? wordsPool : getGlobalWords();
    if (!pool || !pool.length) {
      alert('词库正在初始化，请稍候再试。');
      return;
    }
    quizState.pool = pool;
    if (count === 1 && wordsPool && wordsPool.length === 1) {
      quizState.queue = [wordsPool[0]];
    } else {
      quizState.queue = shuffle(pool).slice(0, Math.min(count, pool.length));
    }
    quizState.index = 0;
    quizState.score = 0;
    quizState.mistakes = [];
    quizState.answered = false;
    quizState.mode = mode;
    var m = ensureModal();
    m.hidden = false;
    m.querySelectorAll('.quiz-mode-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-qmode') === mode);
    });
    renderQuizQuestion();
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderQuizQuestion() {
    var cur = quizState.queue[quizState.index];
    if (!cur) {
      renderQuizSummary();
      return;
    }
    quizState.answered = false;
    clearTimeout(quizState.timer);

    var progEl = document.getElementById('quiz-prog');
    if (progEl) {
      progEl.textContent = (quizState.index + 1) + ' / ' + quizState.queue.length + ' · 得分 ' + quizState.score;
    }
    
    var allPool = getGlobalWords();
    if (!allPool.length) allPool = quizState.queue;
    var others = allPool.filter(function (x) { return x.word !== cur.word; });
    var distractors = shuffle(others).slice(0, 3);
    var options = [];
    var questionTitle = '';

    if (quizState.mode === 'synonym') {
      var synList = (cur.synonyms || '').split(/[,;；，、]/).map(function (s) { return s.trim(); }).filter(Boolean);
      var correctSyn = synList.length ? synList[0] : (cur.exam_meaning || cur.translation || cur.word);
      questionTitle = '<div class="quiz-prompt">在考研英语真题语境中，下列哪个选项是 <strong style="color:var(--color-primary);font-size:19px">' + esc(cur.word) + '</strong> 的核心同义替换词？</div>';
      options = [
        { text: correctSyn, isCorrect: true },
        { text: (distractors[0] && distractors[0].word) || 'alternative', isCorrect: false },
        { text: (distractors[1] && distractors[1].word) || 'substitute', isCorrect: false },
        { text: (distractors[2] && distractors[2].word) || 'counterpart', isCorrect: false }
      ];
    } else if (quizState.mode === 'cloze') {
      var ex = cur.example_en || 'The authoritative report concluded that this _____ phenomenon required rigorous empirical investigation.';
      var blankEx = ex.replace(new RegExp('\\b' + cur.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*', 'gi'), '__________');
      questionTitle = '<div class="quiz-prompt">请选出最符合考研真题学术例句语境的单词：</div>' +
        '<div class="quiz-cloze-sent">' + esc(blankEx) + '</div>' +
        (cur.example_zh ? '<div class="quiz-cloze-zh">💡 汉语语境参考：' + esc(cur.example_zh) + '</div>' : '');
      options = [
        { text: cur.word, isCorrect: true },
        { text: (distractors[0] && distractors[0].word) || 'perceive', isCorrect: false },
        { text: (distractors[1] && distractors[1].word) || 'stimulate', isCorrect: false },
        { text: (distractors[2] && distractors[2].word) || 'underlying', isCorrect: false }
      ];
    } else {
      questionTitle = '<div class="quiz-word">' +
        '<div class="qw">' + esc(cur.word) + '</div>' +
        (cur.phonetic ? '<div class="qp">' + esc(cur.phonetic) + '</div>' : '') +
        (cur.exam_tag ? '<div style="margin-top:6px"><span class="badge exam-tag">' + esc(cur.exam_tag) + '</span></div>' : '') +
      '</div>';
      options = [
        { text: cur.exam_meaning || cur.translation || '暂无释义', isCorrect: true },
        { text: (distractors[0] && (distractors[0].exam_meaning || distractors[0].translation)) || 'adj. 相关的；紧密相连的', isCorrect: false },
        { text: (distractors[1] && (distractors[1].exam_meaning || distractors[1].translation)) || 'v. 维持；支撑；遭受', isCorrect: false },
        { text: (distractors[2] && (distractors[2].exam_meaning || distractors[2].translation)) || 'n. 倾向；偏好；意图', isCorrect: false }
      ];
    }

    options = shuffle(options);
    var tags = ['A', 'B', 'C', 'D'];
    var optionsHtml = options.map(function (opt, idx) {
      return '<button class="quiz-opt" type="button" data-correct="' + opt.isCorrect + '">' +
        '<span class="opt-tag">' + tags[idx] + '</span>' +
        '<span>' + esc(opt.text) + '</span>' +
      '</button>';
    }).join('');

    var html = questionTitle +
      '<div class="quiz-options" id="quiz-options">' + optionsHtml + '</div>' +
      '<div id="quiz-feedback-box"></div>';

    var bodyEl = document.getElementById('quiz-body');
    if (bodyEl) bodyEl.innerHTML = html;

    document.querySelectorAll('.quiz-opt').forEach(function (btn) {
      btn.onclick = function () { handleAnswer(btn, cur); };
    });

    if (cur.word && quizState.mode !== 'cloze') {
      try {
        var u = new SpeechSynthesisUtterance(cur.word);
        u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
        u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function handleAnswer(btn, wordObj) {
    if (quizState.answered) return;
    quizState.answered = true;
    var isCorrect = btn.getAttribute('data-correct') === 'true';

    document.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute('data-correct') === 'true') b.classList.add('correct');
    });

    var fbBox = document.getElementById('quiz-feedback-box');

    if (isCorrect) {
      btn.classList.add('correct');
      quizState.score += 10;
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      if (navigator.vibrate) try { navigator.vibrate([10, 20, 20]); } catch (e) {}
      if (fbBox) {
        fbBox.innerHTML = '<div class="quiz-fb success">🎉 正确！+10分' +
          '<div style="font-size:12.5px;color:var(--color-text-muted);margin-top:5px;line-height:1.5">' +
          '<strong>' + esc(wordObj.word) + '</strong>: ' + esc(wordObj.exam_meaning || wordObj.translation || '') +
          (wordObj.synonyms ? '<br>🔄 <strong>考研同义改写</strong>: ' + esc(wordObj.synonyms) : '') +
          (wordObj.example_en ? '<br>📖 <strong>真题例句</strong>: ' + esc(wordObj.example_en) : '') +
          '</div></div>';
      }
    } else {
      btn.classList.add('wrong');
      quizState.mistakes.push(wordObj);
      recordWeakWord(wordObj.word);
      if (window.KaoyanAudio) window.KaoyanAudio.playWarn();
      if (navigator.vibrate) try { navigator.vibrate([20, 30, 20]); } catch (e) {}
      if (fbBox) {
        fbBox.innerHTML = '<div class="quiz-fb error">❌ 回答错误 · 已收录至薄弱词库' +
          '<div style="font-size:12.5px;color:var(--color-text-muted);margin-top:5px;line-height:1.5">' +
          '<strong>正确释义</strong>: ' + esc(wordObj.exam_meaning || wordObj.translation || '') +
          (wordObj.synonyms ? '<br>🔄 <strong>同义替换词</strong>: ' + esc(wordObj.synonyms) : '') +
          (wordObj.example_en ? '<br>📖 <strong>真题例句</strong>: ' + esc(wordObj.example_en) : '') +
          '</div></div>';
      }
    }

    quizState.timer = setTimeout(function () {
      quizState.index++;
      renderQuizQuestion();
    }, isCorrect ? 1400 : 2800);
  }

  function recordWeakWord(word) {
    try {
      var prog = JSON.parse(localStorage.getItem('kaoyan_progress_v2') || '{}');
      prog.hardCount = prog.hardCount || {};
      prog.hardCount[word] = (prog.hardCount[word] || 0) + 2;
      localStorage.setItem('kaoyan_progress_v2', JSON.stringify(prog));
    } catch (e) {}
  }

  function renderQuizSummary() {
    var totalScore = quizState.score;
    var maxScore = quizState.queue.length * 10;
    var pct = Math.round((totalScore / maxScore) * 100);

    if (window.KaoyanAudio) window.KaoyanAudio.playComplete();
    if (navigator.vibrate) try { navigator.vibrate([15, 40, 20, 40, 20]); } catch (e) {}

    var ratingText = '稳扎稳打，考研必胜！';
    if (pct >= 90) ratingText = '🔥 卓越！真题词汇掌握已达顶峰！';
    else if (pct >= 70) ratingText = '✨ 良好！基础扎实，继续巩固同义替换与僻义！';
    else ratingText = '💡 建议在「背单词」与「记忆」板块专练错题与薄弱词！';

    var mistakesHtml = '';
    if (quizState.mistakes && quizState.mistakes.length) {
      mistakesHtml = '<div style="margin-top:16px;text-align:left;background:var(--color-surface);padding:12px 14px;border-radius:var(--radius-lg);border:1px solid var(--color-border)">' +
        '<strong style="color:#c62828;font-size:13px">❌ 本次错题清单 (' + quizState.mistakes.length + ' 词)：</strong>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' +
        quizState.mistakes.map(function (m) {
          return '<span style="font-size:12px;padding:3px 8px;border-radius:4px;background:color-mix(in oklab, #c62828 10%, transparent);color:#c62828;border:1px solid color-mix(in oklab, #c62828 25%, transparent)">' +
            esc(m.word) + ' (' + esc(m.exam_meaning || m.translation || '') + ')' +
          '</span>';
        }).join('') +
        '</div></div>';
    }

    var html = '<div class="quiz-summary">' +
      '<h4>速测成绩单</h4>' +
      '<div class="q-score">' + totalScore + ' <span style="font-size:18px;color:var(--color-text-muted)">/ ' + maxScore + ' 分</span></div>' +
      '<p class="q-eval">' + ratingText + '</p>' +
      mistakesHtml +
      '<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:20px">' +
        (quizState.mistakes.length ? '<button class="btn" id="quiz-retry-mistakes-btn" type="button" style="background:#c62828;color:#fff;border-color:#c62828">🔥 专练本次错题 (' + quizState.mistakes.length + '题)</button>' : '') +
        '<button class="btn primary" id="quiz-retry-btn" type="button">再来一组 (换题)</button>' +
        '<button class="btn" id="quiz-done-btn" type="button">完成自测</button>' +
      '</div>' +
    '</div>';

    var bodyEl = document.getElementById('quiz-body');
    if (bodyEl) bodyEl.innerHTML = html;

    var retryBtn = document.getElementById('quiz-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = function () {
        quizState.queue = shuffle(quizState.pool).slice(0, Math.min(10, quizState.pool.length));
        quizState.index = 0;
        quizState.score = 0;
        quizState.mistakes = [];
        renderQuizQuestion();
      };
    }

    var retryMistakesBtn = document.getElementById('quiz-retry-mistakes-btn');
    if (retryMistakesBtn) {
      retryMistakesBtn.onclick = function () {
        quizState.queue = shuffle(quizState.mistakes);
        quizState.index = 0;
        quizState.score = 0;
        quizState.mistakes = [];
        renderQuizQuestion();
      };
    }

    var doneBtn = document.getElementById('quiz-done-btn');
    if (doneBtn) doneBtn.onclick = closeQuiz;
  }

  // Keyboard support for Quiz (1, 2, 3, 4 or A, B, C, D, Escape to exit, R to speak, Space/Enter to advance)
  window.addEventListener('keydown', function (e) {
    if (!modalEl || modalEl.hidden) return;
    if (e.key === 'Escape') {
      closeQuiz();
    } else if (e.key === 'r' || e.key === 'R') {
      var cur = quizState.queue[quizState.index];
      if (cur && cur.word) {
        try {
          var u = new SpeechSynthesisUtterance(cur.word);
          u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        } catch (err) {}
      }
    } else if ((e.key === ' ' || e.key === 'Enter') && quizState.answered) {
      clearTimeout(quizState.timer);
      quizState.index++;
      renderQuizQuestion();
    } else if (!quizState.answered) {
      var keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (keyMap.hasOwnProperty(e.key)) {
        var opts = document.querySelectorAll('.quiz-opt');
        var idx = keyMap[e.key];
        if (opts[idx]) opts[idx].click();
      }
    }
  });

  return {
    isFav: isFav,
    toggleFav: toggleFav,
    favBtn: favBtn,
    startQuiz: startQuiz,
    closeQuiz: closeQuiz
  };
});
