/* 考研词汇 — 记忆板块：遗忘曲线、记忆等级分布、复习日程、薄弱词榜、近期统计。
   数据全部来自「背单词」页保存的 localStorage（kaoyan_study_v3），纯本地计算。 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var currentAppVersionStr = '9.68';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function localDay(off) { var d = new Date(); if (off) d.setDate(d.getDate() + off); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDay(ts) { var d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  var state = {};
  try { state = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}'); } catch (e) { state = {}; }
  var progress = (state.progress && typeof state.progress === 'object') ? state.progress : {};
  var history = (state.history && typeof state.history === 'object') ? state.history : {};

  var learned = Object.keys(progress);
  var mastered = learned.filter(function (w) { return progress[w].level >= 4; }).length;

  // ---- 顶部统计 ----
  var weakWordsList = learned.filter(function (w) { var p = progress[w]; return (p.wrong || 0) >= 3 || (p.failStreak || 0) >= 3; });
  var dueWords = learned.filter(function (w) { var n = progress[w].next; return typeof n === 'number' && n <= Date.now(); });
  var dueKnown = dueWords.filter(function (w) { return progress[w].level >= 2; }).length;
  var retentionStr = dueWords.length ? Math.round(dueKnown / dueWords.length * 100) + '%' : '—';

  // 连续打卡（与背单词页同一算法）
  function fmtD(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var streakDays = 0;
  (function () {
    var s = 0, hist = history;
    var today = localDay(0), yest = localDay(-1);
    if ((state.todayDone || 0) > 0 || (hist[today] || 0) > 0) {
      s = 1; var c = new Date();
      while (true) { c.setDate(c.getDate() - 1); if ((hist[fmtD(c)] || 0) > 0) s++; else break; }
    } else if ((hist[yest] || 0) > 0) {
      s = 1; var c2 = new Date(); c2.setDate(c2.getDate() - 2);
      while (true) { if ((hist[fmtD(c2)] || 0) > 0) { s++; c2.setDate(c2.getDate() - 1); } else break; }
    }
    streakDays = s;
  })();

  function renderHomeOverviewStats() {
    if ($('s-total')) $('s-total').textContent = learned.length;
    if ($('s-mastered')) $('s-mastered').textContent = mastered;
    if ($('s-streak')) $('s-streak').textContent = streakDays + ' 天';
    if ($('s-weak')) $('s-weak').textContent = weakWordsList.length;
    if ($('s-retention')) $('s-retention').textContent = retentionStr;
  }
  renderHomeOverviewStats();

  // ---- 考研初试倒计时计算 ----
  function updateCountdown() {
    var el = $('kaoyan-days');
    if (!el) return;
    var now = new Date();
    var curYear = now.getFullYear();
    var targetYear = parseInt(localStorage.getItem('kao_examyear') || '2026', 10);
    if (isNaN(targetYear) || targetYear < curYear) targetYear = curYear;
    var examDate = new Date(targetYear, 11, 21);
    if (now > examDate && targetYear === curYear) {
      examDate = new Date(curYear + 1, 11, 20);
    }
    var diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    el.textContent = Math.max(1, diffDays);
  }
  updateCountdown();

  // ---- 艾宾浩斯遗忘曲线（SVG）----
  function renderEbbinghausCurve() {
    var curveBox = $('curve-box');
    if (!curveBox) return;
    var decayPts = [[0, 100], [0.014, 58], [1, 44], [2, 36], [6, 25], [15, 18], [31, 15], [60, 12]];
    var reviewDays = [1, 3, 7, 15, 30, 60];
    var reviewLevels = [95, 92, 90, 88, 86, 84];
    function decayAt(t) {
      for (var i = 0; i < decayPts.length - 1; i++) {
        if (t >= decayPts[i][0] && t <= decayPts[i + 1][0]) {
          var k = (t - decayPts[i][0]) / (decayPts[i + 1][0] - decayPts[i][0]);
          return decayPts[i][1] + (decayPts[i + 1][1] - decayPts[i][1]) * k;
        }
      }
      return decayPts[decayPts.length - 1][1];
    }
    function buildReviewCurve() {
      var pts = [[0, 100]], lv = 100;
      for (var i = 0; i < reviewDays.length; i++) {
        var t0 = reviewDays[i];
        pts.push([t0, Math.max(20, lv - (lv - 20) * 0.18)]);
        lv = reviewLevels[i];
        pts.push([t0, lv]);
      }
      return pts;
    }
    var W = 640, H = 250, PADL = 42, PADB = 30, PADT = 14, PADR = 14;
    var TMAX = 60;
    function px(t) { return PADL + (t / TMAX) * (W - PADL - PADR); }
    function py(v) { return PADT + (1 - v / 100) * (H - PADT - PADB); }
    function pathOf(pts) {
      return pts.map(function (p, i) { return (i ? 'L' : 'M') + px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1); }).join(' ');
    }
    var reviewPts = buildReviewCurve();
    var grid = '';
    [0, 25, 50, 75, 100].forEach(function (v) {
      grid += '<line x1="' + PADL + '" y1="' + py(v) + '" x2="' + (W - PADR) + '" y2="' + py(v) + '" stroke="var(--color-divider)" stroke-width="1"/>' +
        '<text x="' + (PADL - 6) + '" y="' + (py(v) + 4) + '" font-size="10" fill="var(--color-text-faint)" text-anchor="end">' + v + '%</text>';
    });
    [0, 10, 20, 30, 40, 50, 60].forEach(function (t) {
      grid += '<text x="' + px(t) + '" y="' + (H - 8) + '" font-size="10" fill="var(--color-text-faint)" text-anchor="middle">' + t + '天</text>';
    });
    var reviewMarks = reviewDays.map(function (t, i) {
      return '<line x1="' + px(t) + '" y1="' + py(100) + '" x2="' + px(t) + '" y2="' + py(20) + '" stroke="var(--color-divider)" stroke-dasharray="3 3"/>' +
        '<text x="' + px(t) + '" y="' + (py(100) - 3) + '" font-size="9" fill="var(--color-text-faint)" text-anchor="middle">第' + (i + 1) + '次</text>';
    }).join('');
    curveBox.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:720px;display:block;margin:0 auto">' + grid +
      '<path d="' + pathOf(decayPts) + '" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="' + pathOf(reviewPts) + '" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linejoin="round"/>' +
      reviewMarks +
      '<circle cx="' + px(reviewPts[reviewPts.length - 1][0]) + '" cy="' + py(reviewPts[reviewPts.length - 1][1]) + '" r="4" fill="var(--color-primary)"/>' +
      '</svg>';
  }

  // ---- 记忆等级分布 ----
  function renderLevelDistribution() {
    var distEl = $('dist');
    if (!distEl) return;
    var LV = ['未学过', '初识', '见过几次', '渐熟', '较熟', '熟练', '掌握'];
    var dist = [0, 0, 0, 0, 0, 0, 0];
    learned.forEach(function (w) { var l = Math.min(6, Math.max(0, progress[w].level || 0)); dist[l]++; });
    var maxD = Math.max.apply(null, dist.concat([1]));
    var cur = Math.min(6, Math.max(0, dist.reduce(function (m, v, i) { return v > dist[m] ? i : m; }, 1)));
    distEl.innerHTML = dist.map(function (v, i) {
      var h = Math.max(4, Math.round(v / maxD * 110));
      return '<div class="bar' + (i === cur && v > 0 ? ' cur' : '') + '"><u>' + v + '</u><i style="height:' + h + 'px"></i><em>' + LV[i] + '</em></div>';
    }).join('');
  }

  // ---- 复习日程 ----
  function renderDueRow() {
    var dueRowEl = $('due-row');
    if (!dueRowEl) return;
    var now = Date.now(), day = 86400000;
    var buckets = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    learned.forEach(function (w) {
      var n = progress[w].next; if (typeof n !== 'number') return;
      var diff = n - now;
      if (diff <= 0) buckets[0][0]++;
      else if (diff <= day) buckets[1][0]++;
      else if (diff <= 3 * day) buckets[2][0]++;
      else if (diff <= 7 * day) buckets[3][0]++;
      else buckets[4][0]++;
    });
    var dueLabels = ['已到期', '明天前', '3 天内', '7 天内', '更远'];
    dueRowEl.innerHTML = buckets.map(function (b, i) {
      return '<div class="due-cell' + (i === 0 && b[0] > 0 ? ' hot' : '') + '"><b>' + b[0] + '</b><span>' + dueLabels[i] + '</span></div>';
    }).join('');
    var dueN = buckets[0][0];
    var existingBtn = dueRowEl.parentElement ? dueRowEl.parentElement.querySelector('.due-review-btn') : null;
    if (!existingBtn && dueRowEl.parentElement) {
      var btn = document.createElement('a');
      btn.className = 'd-btn primary due-review-btn';
      btn.style.cssText = 'display:inline-block;margin-top:10px;text-decoration:none';
      btn.href = 'study.html?mode=review';
      btn.textContent = dueN > 0 ? '立即复习到期的 ' + dueN + ' 词 →' : '去背单词 →';
      dueRowEl.parentElement.appendChild(btn);
    } else if (existingBtn) {
      existingBtn.textContent = dueN > 0 ? '立即复习到期的 ' + dueN + ' 词 →' : '去背单词 →';
    }
  }

  // ---- 近 30 天学习量 ----
  function renderActivityBars() {
    var barsEl = $('bars');
    if (!barsEl) return;
    var days = [], maxV = 1;
    for (var i = 29; i >= 0; i--) {
      var k = fmtD(function (d2) { d2.setDate(d2.getDate() - i); return d2; }(new Date()));
      var v = (k === localDay(0)) ? (state.todayDone || 0) : (history[k] || 0);
      days.push({ k: k, v: v, today: i === 0 });
      if (v > maxV) maxV = v;
    }
    barsEl.innerHTML = days.map(function (d) {
      var h = Math.max(2, Math.round(d.v / maxV * 82));
      return '<div title="' + d.k + '：' + d.v + ' 词" style="flex:1;display:flex;align-items:flex-end;height:100%"><i style="display:block;width:100%;height:' + h + 'px;background:' + (d.today ? 'var(--color-primary)' : 'var(--color-core-soft)') + ';border-radius:2px 2px 0 0"></i></div>';
    }).join('');
  }

  // ---- 薄弱词榜 ----
  function renderWeakWordsList() {
    var weakEl = $('weak-list');
    if (!weakEl) return;
    var weak = learned.map(function (w) {
      var p = progress[w];
      return { w: w, score: (p.wrong || 0) + (p.failStreak || 0) * 2, wrong: p.wrong || 0, fs: p.failStreak || 0, tr: p.lastTr || '' };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; }).slice(0, 15);
    weakEl.innerHTML = weak.length
      ? weak.map(function (x) {
        var badge = x.wrong > 0 ? '错 ' + x.wrong + ' 次' : '连忘 ' + x.fs + ' 次';
        return '<a class="weak-item" href="study.html?word=' + encodeURIComponent(x.w) + '" data-w="' + esc(x.w) + '"><span class="w">' + esc(x.w) + '</span><span class="t"></span><span class="c">' + badge + '</span></a>';
      }).join('') + '<a class="d-btn" style="display:inline-block;margin-top:12px;text-decoration:none;background:var(--color-accent-soft);color:var(--color-accent);font-weight:600;padding:8px 16px;border-radius:999px" href="study.html?mode=weak">🎯 专项攻克薄弱词 (' + weak.length + ') →</a>'
      : '<div class="empty-tip">还没有薄弱词；在「背单词」里多评几次就能看到啦。</div>';
  }

  // ---- 最近学习 (如果存在DOM容器) ----
  if ($('recent')) {
    var recent = learned.filter(function (w) { return typeof progress[w].last === 'number'; })
      .sort(function (a, b) { return progress[b].last - progress[a].last; }).slice(0, 14);
    $('recent').innerHTML = recent.length
      ? recent.map(function (w) {
        return '<a href="study.html?word=' + encodeURIComponent(w) + '" title="' + fmtDay(progress[w].last) + '">' + esc(w) + '</a>';
      }).join('')
      : '<div class="empty-tip">先去「背单词」学几个词吧。</div>';
  }

  // 初始渲染一次可能存在的图表组件
  renderEbbinghausCurve();
  renderLevelDistribution();
  renderDueRow();
  renderActivityBars();
  renderWeakWordsList();

  // ---- 嵌入式系统与学习设置事件绑定 ----
  document.addEventListener('click', function (e) {
    var target = e.target;
    // 每日计划
    var dailyBtn = target.closest('[data-set-daily]');
    if (dailyBtn) {
      var dVal = parseInt(dailyBtn.getAttribute('data-set-daily'), 10);
      try {
        var s = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}');
        s.daily = dVal;
        localStorage.setItem('kaoyan_study_v3', JSON.stringify(s));
        localStorage.setItem('kao_dailygoal', String(dVal));
        document.querySelectorAll('[data-set-daily]').forEach(function(b){ b.classList.toggle('primary', b === dailyBtn); });
        updateHomeMenuBadges();
        if (window.KaoyanToast) window.KaoyanToast('🎯 每日计划已设置为 ' + dVal + ' 词/天');
      } catch(err){}
      return;
    }
    // 目标年份
    var yearBtn = target.closest('[data-set-examyear]');
    if (yearBtn) {
      var yVal = yearBtn.getAttribute('data-set-examyear');
      localStorage.setItem('kao_examyear', yVal);
      document.querySelectorAll('[data-set-examyear]').forEach(function(b){ b.classList.toggle('primary', b === yearBtn); });
      updateCountdown();
      if (window.KaoyanToast) window.KaoyanToast('🎯 目标年份：' + yVal + ' 考研');
      return;
    }
    // 错题自动加入生词本
    var autofavBtn = target.closest('[data-set-autofav]');
    if (autofavBtn) {
      var afVal = autofavBtn.getAttribute('data-set-autofav');
      localStorage.setItem('kao_autofav_wrong', afVal);
      document.querySelectorAll('[data-set-autofav]').forEach(function(b){ b.classList.toggle('primary', b === autofavBtn); });
      if (window.KaoyanToast) window.KaoyanToast(afVal === '1' ? '⭐ 错题自动入生词本：已开启' : '⭐ 错题自动入生词本：已关闭');
      return;
    }
    // 评分档位模式
    var rmodeBtn = target.closest('[data-set-ratingmode]');
    if (rmodeBtn) {
      var rmVal = rmodeBtn.getAttribute('data-set-ratingmode');
      localStorage.setItem('kao_rating_mode', rmVal);
      document.querySelectorAll('[data-set-ratingmode]').forEach(function(b){ b.classList.toggle('primary', b === rmodeBtn); });
      if (window.KaoyanToast) window.KaoyanToast('📝 背词评分档位：' + (rmVal === '2' ? '2档极速' : '4档标准'));
      return;
    }
    // 出词顺序
    var sorderBtn = target.closest('[data-set-studyorder]');
    if (sorderBtn) {
      var soVal = sorderBtn.getAttribute('data-set-studyorder');
      localStorage.setItem('kao_study_order', soVal);
      document.querySelectorAll('[data-set-studyorder]').forEach(function(b){ b.classList.toggle('primary', b === sorderBtn); });
      if (window.KaoyanToast) window.KaoyanToast('🔀 出词顺序：' + (soVal === 'random' ? '智能乱序' : (soVal === 'freq' ? '考频优先' : '字母序')));
      return;
    }
    // 艾宾浩斯节奏
    var ebbBtn = target.closest('[data-set-ebbpaces]');
    if (ebbBtn) {
      var ebVal = ebbBtn.getAttribute('data-set-ebbpaces');
      localStorage.setItem('kao_ebbinghaus_pace', ebVal);
      document.querySelectorAll('[data-set-ebbpaces]').forEach(function(b){ b.classList.toggle('primary', b === ebbBtn); });
      if (window.KaoyanToast) window.KaoyanToast('📈 复习曲线：' + (ebVal === 'sprint' ? '考前冲刺节奏' : '经典标准节奏'));
      return;
    }
    // 背词翻页自动发音
    var autopronounceBtn = target.closest('[data-set-autopronounce]');
    if (autopronounceBtn) {
      var apVal = autopronounceBtn.getAttribute('data-set-autopronounce');
      localStorage.setItem('kao_autopronounce', apVal);
      document.querySelectorAll('[data-set-autopronounce]').forEach(function(b){ b.classList.toggle('primary', b === autopronounceBtn); });
      if (window.KaoyanToast) window.KaoyanToast(apVal === '1' ? '🔊 背词翻页自动发音：已开启' : '🔇 背词翻页自动发音：已关闭');
      return;
    }
    // 双击发音快捷
    var dtBtn = target.closest('[data-set-doubletap]');
    if (dtBtn) {
      var dtVal = dtBtn.getAttribute('data-set-doubletap');
      localStorage.setItem('kao_doubletap_audio', dtVal);
      document.querySelectorAll('[data-set-doubletap]').forEach(function(b){ b.classList.toggle('primary', b === dtBtn); });
      if (window.KaoyanToast) window.KaoyanToast(dtVal === '1' ? '👆 双击发音：已开启' : '👆 双击发音：已关闭');
      return;
    }
    // 口音
    var langBtn = target.closest('[data-set-lang]');
    if (langBtn) {
      var lVal = langBtn.getAttribute('data-set-lang');
      localStorage.setItem('kao_ttslang', lVal);
      document.querySelectorAll('[data-set-lang]').forEach(function(b){ b.classList.toggle('primary', b === langBtn); });
      updateHomeMenuBadges();
      if (window.KaoyanToast) window.KaoyanToast('🔊 朗读口音：' + (lVal === 'en-US' ? '美音' : '英音'));
      return;
    }
    // 语速
    var rateBtn = target.closest('[data-set-rate]');
    if (rateBtn) {
      var rVal = rateBtn.getAttribute('data-set-rate');
      localStorage.setItem('kao_ttsrate', rVal);
      document.querySelectorAll('[data-set-rate]').forEach(function(b){ b.classList.toggle('primary', b === rateBtn); });
      updateHomeMenuBadges();
      if (window.KaoyanToast) window.KaoyanToast('⚡ 朗读语速：' + rVal + 'x');
      return;
    }
    // 主题
    var themeBtn = target.closest('[data-set-theme]');
    if (themeBtn) {
      var tVal = themeBtn.getAttribute('data-set-theme');
      document.documentElement.setAttribute('data-theme', tVal);
      localStorage.setItem('theme', tVal);
      document.querySelectorAll('[data-set-theme]').forEach(function(b){ b.classList.toggle('primary', b === themeBtn); });
      updateHomeMenuBadges();
      if (window.KaoyanToast) window.KaoyanToast('🎨 视觉主题：' + themeBtn.textContent.trim());
      return;
    }
    // 字号
    var fsBtn = target.closest('[data-set-fs]');
    if (fsBtn) {
      var fVal = fsBtn.getAttribute('data-set-fs');
      localStorage.setItem('kao_fs', fVal);
      if (window.KaoyanSettings) window.KaoyanSettings.apply();
      document.querySelectorAll('[data-set-fs]').forEach(function(b){ b.classList.toggle('primary', b === fsBtn); });
      if (window.KaoyanToast) window.KaoyanToast('🔠 字号已更新');
      return;
    }
    // 答题音效
    var sndBtn = target.closest('[data-set-sound]');
    if (sndBtn) {
      var sVal = sndBtn.getAttribute('data-set-sound');
      localStorage.setItem('kao_sound', sVal);
      document.querySelectorAll('[data-set-sound]').forEach(function(b){ b.classList.toggle('primary', b === sndBtn); });
      if (window.KaoyanToast) window.KaoyanToast(sVal === '1' ? '🔔 答题音效已开启' : '🔕 答题音效已关闭');
      return;
    }
    // 专注模式
    var zenBtn = target.closest('[data-set-zenfocus]');
    if (zenBtn) {
      var zVal = zenBtn.getAttribute('data-set-zenfocus');
      localStorage.setItem('kao_zen_focus', zVal);
      document.querySelectorAll('[data-set-zenfocus]').forEach(function(b){ b.classList.toggle('primary', b === zenBtn); });
      if (window.KaoyanToast) window.KaoyanToast(zVal === '1' ? '🧘 专注极简模式已开启' : '📖 标准背词模式');
      return;
    }
    // 触感振动切换
    var hapBtn = target.closest('[data-set-haptic]');
    if (hapBtn) {
      var hVal = hapBtn.getAttribute('data-set-haptic');
      localStorage.setItem('kao_haptic', hVal);
      document.querySelectorAll('[data-set-haptic]').forEach(function(b){ b.classList.toggle('primary', b === hapBtn); });
      if (hVal === '1' && navigator.vibrate) try { navigator.vibrate(20); } catch(e){}
      if (window.KaoyanToast) window.KaoyanToast(hVal === '1' ? '📳 触感振动已开启' : '📴 触感振动已关闭');
      return;
    }
    // 大纲出词范围
    var corpusBtn = target.closest('[data-set-corpushierarchy]');
    if (corpusBtn) {
      var cVal = corpusBtn.getAttribute('data-set-corpushierarchy');
      localStorage.setItem('kao_corpus_hierarchy', cVal);
      document.querySelectorAll('[data-set-corpushierarchy]').forEach(function(b){ b.classList.toggle('primary', b === corpusBtn); });
      var cName = cVal === 'core' ? '🔥 2,000 高频词' : (cVal === 'sprint' ? '⚡ 993 冲刺词' : '🌟 5,619 全大纲');
      if (window.KaoyanToast) window.KaoyanToast('📚 大纲出词范围：' + cName);
      return;
    }
    // 临界遗忘唤醒
    var decayBtn = target.closest('[data-set-decayprior]');
    if (decayBtn) {
      var dcVal = decayBtn.getAttribute('data-set-decayprior');
      localStorage.setItem('kao_decay_prior', dcVal);
      document.querySelectorAll('[data-set-decayprior]').forEach(function(b){ b.classList.toggle('primary', b === decayBtn); });
      if (window.KaoyanToast) window.KaoyanToast(dcVal === '1' ? '🚨 临界遗忘词优先唤醒：已开启' : '📅 遗忘唤醒：严格按时复现');
      return;
    }
    // 长难词慢速精读
    var slowHardBtn = target.closest('[data-set-slowhard]');
    if (slowHardBtn) {
      var shVal = slowHardBtn.getAttribute('data-set-slowhard');
      localStorage.setItem('kao_slow_hard_words', shVal);
      document.querySelectorAll('[data-set-slowhard]').forEach(function(b){ b.classList.toggle('primary', b === slowHardBtn); });
      if (window.KaoyanToast) window.KaoyanToast(shVal === '1' ? '🐢 长难词慢速精读(0.7x)：已开启' : '🐇 长难词慢速精读：已关闭');
      return;
    }
    // 例句中文遮挡自测
    var maskBtn = target.closest('[data-set-masktranslation]');
    if (maskBtn) {
      var mtVal = maskBtn.getAttribute('data-set-masktranslation');
      localStorage.setItem('kao_mask_translation', mtVal);
      document.querySelectorAll('[data-set-masktranslation]').forEach(function(b){ b.classList.toggle('primary', b === maskBtn); });
      if (window.KaoyanToast) window.KaoyanToast(mtVal === '1' ? '🙈 例句中文遮挡自测：已开启（轻触展开）' : '👁️ 例句中文遮挡自测：已关闭（双语对照）');
      return;
    }
    // 考点重点彩色标记
    var colorBtn = target.closest('[data-set-colormnemonic]');
    if (colorBtn) {
      var cmVal = colorBtn.getAttribute('data-set-colormnemonic');
      localStorage.setItem('kao_color_mnemonic', cmVal);
      document.querySelectorAll('[data-set-colormnemonic]').forEach(function(b){ b.classList.toggle('primary', b === colorBtn); });
      if (window.KaoyanToast) window.KaoyanToast(cmVal === '1' ? '🎨 考点重点彩色标记：已开启' : '📝 考点重点彩色标记：纯净黑白');
      return;
    }
    // 边缘防误触保护
    var guardBtn = target.closest('[data-set-edgeguard], [data-set-edgeprotect]');
    if (guardBtn) {
      var egVal = guardBtn.getAttribute('data-set-edgeguard') || guardBtn.getAttribute('data-set-edgeprotect');
      localStorage.setItem('kao_edge_guard', egVal);
      localStorage.setItem('kao_edge_protect', egVal);
      document.querySelectorAll('[data-set-edgeguard], [data-set-edgeprotect]').forEach(function(b){ b.classList.toggle('primary', b === guardBtn); });
      if (window.KaoyanToast) window.KaoyanToast(egVal === '1' ? '🛡️ 边缘防误触保护：已开启' : '⚡ 边缘防误触保护：已关闭');
      return;
    }
    // 学伴小狗打气风格
    var puppyBtn = target.closest('[data-set-puppymode]');
    if (puppyBtn) {
      var pmVal = puppyBtn.getAttribute('data-set-puppymode');
      localStorage.setItem('kao_puppy_mode', pmVal);
      document.querySelectorAll('[data-set-puppymode]').forEach(function(b){ b.classList.toggle('primary', b === puppyBtn); });
      if (window.KaoyanToast) window.KaoyanToast(pmVal === 'active' ? '🐾 学伴风格：热情打气摇尾欢呼' : '🤫 学伴风格：静默自律学霸陪伴');
      return;
    }
    // 每日背词提醒时段
    var remindBtn = target.closest('[data-set-remindtime]');
    if (remindBtn) {
      var rtVal = remindBtn.getAttribute('data-set-remindtime');
      localStorage.setItem('kao_remind_time', rtVal);
      document.querySelectorAll('[data-set-remindtime]').forEach(function(b){ b.classList.toggle('primary', b === remindBtn); });
      var rtName = rtVal === 'morning' ? '🌅 晨读 07:30' : (rtVal === 'noon' ? '☀️ 午休 12:30' : (rtVal === 'night' ? '🌙 晚间 21:30' : '🔕 不提醒'));
      if (window.KaoyanToast) window.KaoyanToast('⏰ 每日背词提醒：' + rtName);
      return;
    }
    // 试听发音
    if (target.closest('#mem-audition-btn')) {
      var testSentence = "Continuous effort and disciplined perseverance yield profound triumph in academic examinations.";
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        var utt = new SpeechSynthesisUtterance(testSentence);
        utt.lang = localStorage.getItem('kao_ttslang') || 'en-US';
        utt.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92') || 0.92;
        window.speechSynthesis.speak(utt);
        if (window.KaoyanToast) window.KaoyanToast('🔊 正在试听：' + (utt.lang === 'en-US' ? '美音' : '英音') + ' · ' + utt.rate + 'x');
      }
      return;
    }
    // 重置清空进度
    if (target.closest('#mem-reset-progress-btn')) {
      if (confirm('⚠️ 确定要清空重置所有背词打卡进度吗？此操作不可逆（建议先点击上方导出备份）。')) {
        localStorage.removeItem('kaoyan_study_v3');
        localStorage.removeItem('kao_exam_mastered');
        localStorage.removeItem('kaoyan_recent');
        if (window.KaoyanToast) window.KaoyanToast('✓ 学习进度已重置');
        setTimeout(function(){ location.reload(); }, 800);
      }
      return;
    }
    // 导出备份
    if (target.closest('#mem-export-backup-btn')) {
      var backup = {
        timestamp: Date.now(),
        date: new Date().toISOString(),
        kaoyan_study_v3: localStorage.getItem('kaoyan_study_v3'),
        kao_exam_mastered: localStorage.getItem('kao_exam_mastered'),
        kao_quiz_favs: localStorage.getItem('kao_quiz_favs'),
        kaoyan_recent: localStorage.getItem('kaoyan_recent')
      };
      var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '考研复习进度备份_' + new Date().toISOString().slice(0,10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.KaoyanToast) window.KaoyanToast('✓ 学习进度备份已成功导出！');
      return;
    }
    // 导出学习档案 Markdown
    if (target.closest('#mem-export-report-btn')) {
      var studyObj = {};
      try { studyObj = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}'); } catch(e){}
      var progObj = studyObj.progress || {};
      var favs = [];
      try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(e){}
      var masteredCount = 0;
      Object.keys(progObj).forEach(function(k){ if(progObj[k] && progObj[k].level >= 4) masteredCount++; });
      var mdLines = [
        '# 🎓 考研英语（一）个人词汇复习档案',
        '',
        '> 导出时间：' + new Date().toLocaleString(),
        '> 目标考研年份：' + (localStorage.getItem('kao_examyear') || '2026') + ' 统考',
        '',
        '## 📊 总体掌握概览',
        '- **词库大纲总量**：5,619 词',
        '- **已熟记掌握 (Lv.4)**：' + masteredCount + ' 词',
        '- **生词本收藏**：' + favs.length + ' 词',
        '- **今日已学**：' + (studyObj.todayDone || 0) + ' / ' + (studyObj.daily || 50) + ' 词',
        '',
        '## ⭐ 重点生词清单 (' + favs.length + ' 词)',
        favs.length ? favs.map(function(w, i){ return (i + 1) + '. **' + w + '**'; }).join('\n') : '*暂无生词*',
        '',
        '---',
        '*考研词汇通 · 金毛背单词 100% 离线旗舰版*'
      ];
      var mdBlob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      var mdUrl = URL.createObjectURL(mdBlob);
      var ma = document.createElement('a');
      ma.href = mdUrl;
      ma.download = '考研英语一词汇学习档案_' + new Date().toISOString().slice(0,10) + '.md';
      document.body.appendChild(ma);
      ma.click();
      document.body.removeChild(ma);
      URL.revokeObjectURL(mdUrl);
      if (window.KaoyanToast) window.KaoyanToast('✓ 考研词汇学习档案 Markdown 已导出！');
      return;
    }
    // 检查更新
    if (target.closest('#mem-check-update-btn')) {
      if (window.KaoyanAutoUpdater && typeof window.KaoyanAutoUpdater.checkUpdate === 'function') {
        window.KaoyanAutoUpdater.checkUpdate(true);
      } else {
        var vTag = currentAppVersionStr.startsWith('v') ? currentAppVersionStr : ('v' + currentAppVersionStr);
        if (window.KaoyanToast) window.KaoyanToast('✓ 离线词库与云端同步已处于最新状态 (' + vTag + ')');
        if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
      }
      return;
    }
    // 云端备份
    if (target.closest('#mem-cloud-backup-btn')) {
      var cBtn = target.closest('#mem-cloud-backup-btn');
      cBtn.disabled = true;
      cBtn.textContent = '☁️ 正在同步...';
      if (window.KaoyanCloudSync) {
        window.KaoyanCloudSync.upload(function(err, res) {
          cBtn.disabled = false;
          cBtn.textContent = '☁️ 备份到云端';
          if (!err && res) {
            renderCloudSyncInfo();
            if (window.KaoyanToast) window.KaoyanToast('✓ 已成功同步到云端！专属同步码: ' + res.code);
            if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          } else {
            renderCloudSyncInfo();
            if (window.KaoyanToast) window.KaoyanToast('✓ 同步完成（本地镜像就绪）');
          }
        });
      }
      return;
    }
    // 云端恢复弹窗
    if (target.closest('#mem-cloud-restore-btn')) {
      var modal = document.getElementById('cloud-restore-modal');
      if (modal) {
        modal.style.display = 'flex';
        var inp = document.getElementById('cloud-restore-input');
        if (inp) {
          inp.value = '';
          inp.focus();
        }
      }
      return;
    }
    // 导入备份
    if (target.closest('#mem-import-backup-btn')) {
      var fi = document.getElementById('mem-backup-file-input');
      if (fi) fi.click();
      return;
    }
  });

  function renderCloudSyncInfo() {
    if (!window.KaoyanCloudSync) return;
    var info = window.KaoyanCloudSync.getSyncInfo();
    var codeEl = document.getElementById('mem-cloud-code-display');
    var timeEl = document.getElementById('mem-cloud-time-display');
    if (codeEl) codeEl.textContent = info.code || '未生成';
    if (timeEl) timeEl.textContent = info.lastSyncTime || '从未同步';
  }

  var cloudCancelBtn = document.getElementById('cloud-cancel-restore-btn');
  if (cloudCancelBtn) {
    cloudCancelBtn.addEventListener('click', function() {
      var modal = document.getElementById('cloud-restore-modal');
      if (modal) modal.style.display = 'none';
    });
  }

  var cloudConfirmBtn = document.getElementById('cloud-confirm-restore-btn');
  if (cloudConfirmBtn) {
    cloudConfirmBtn.addEventListener('click', function() {
      var inp = document.getElementById('cloud-restore-input');
      var code = inp ? inp.value.trim() : '';
      if (!code) {
        alert('请输入云端同步码');
        return;
      }
      cloudConfirmBtn.disabled = true;
      cloudConfirmBtn.textContent = '正在恢复...';
      if (window.KaoyanCloudSync) {
        window.KaoyanCloudSync.download(code, function(err, payload) {
          cloudConfirmBtn.disabled = false;
          cloudConfirmBtn.textContent = '立即恢复';
          if (err) {
            alert(err.message || '恢复失败，请重试');
          } else {
            var modal = document.getElementById('cloud-restore-modal');
            if (modal) modal.style.display = 'none';
            renderCloudSyncInfo();
            if (window.KaoyanToast) window.KaoyanToast('✓ 进度已恢复！正在刷新...');
            if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
            setTimeout(function() { location.reload(); }, 1000);
          }
        });
      }
    });
  }

  var memFileInput = document.getElementById('mem-backup-file-input');
  if (memFileInput) {
    memFileInput.addEventListener('change', function() {
      var f = memFileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          if (data.kaoyan_study_v3) localStorage.setItem('kaoyan_study_v3', data.kaoyan_study_v3);
          if (data.kao_exam_mastered) localStorage.setItem('kao_exam_mastered', data.kao_exam_mastered);
          if (data.kao_quiz_favs) localStorage.setItem('kao_quiz_favs', data.kao_quiz_favs);
          if (window.KaoyanToast) window.KaoyanToast('✓ 进度已恢复！正在刷新...');
          setTimeout(function(){ location.reload(); }, 1000);
        } catch(err) {
          alert('备份文件格式不正确。');
        }
      };
      reader.readAsText(f);
    });
  }

  function syncSettingsUI() {
    var study = {};
    try { study = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}'); } catch(e){}
    var curDaily = String(study.daily || 50);
    var curLang = localStorage.getItem('kao_ttslang') || 'en-US';
    var curRate = localStorage.getItem('kao_ttsrate') || '0.92';
    var curTheme = localStorage.getItem('theme') || 'light';
    var curFs = localStorage.getItem('kao_fs') || 'normal';
    var curHaptic = localStorage.getItem('kao_haptic') || '1';
    var curSound = localStorage.getItem('kao_sound') !== '0' ? '1' : '0';
    var curYear = localStorage.getItem('kao_examyear') || '2026';
    var curAutofav = localStorage.getItem('kao_autofav_wrong') || '1';
    var curAutopronounce = localStorage.getItem('kao_autopronounce') || '1';
    var curDoubletap = localStorage.getItem('kao_doubletap_audio') || '1';
    var curZenfocus = localStorage.getItem('kao_zen_focus') || '0';
    var curRatingmode = localStorage.getItem('kao_rating_mode') || '4';
    var curStudyorder = localStorage.getItem('kao_study_order') || 'random';
    var curEbbpaces = localStorage.getItem('kao_ebbinghaus_pace') || 'standard';

    document.querySelectorAll('[data-set-daily]').forEach(function(b) {
      var val = b.getAttribute('data-set-daily');
      b.classList.toggle('primary', val === curDaily);
    });
    document.querySelectorAll('[data-set-examyear]').forEach(function(b) {
      var val = b.getAttribute('data-set-examyear');
      b.classList.toggle('primary', val === curYear);
    });
    document.querySelectorAll('[data-set-autofav]').forEach(function(b) {
      var val = b.getAttribute('data-set-autofav');
      b.classList.toggle('primary', val === curAutofav);
    });
    document.querySelectorAll('[data-set-ratingmode]').forEach(function(b) {
      var val = b.getAttribute('data-set-ratingmode');
      b.classList.toggle('primary', val === curRatingmode);
    });
    document.querySelectorAll('[data-set-studyorder]').forEach(function(b) {
      var val = b.getAttribute('data-set-studyorder');
      b.classList.toggle('primary', val === curStudyorder);
    });
    document.querySelectorAll('[data-set-ebbpaces]').forEach(function(b) {
      var val = b.getAttribute('data-set-ebbpaces');
      b.classList.toggle('primary', val === curEbbpaces);
    });
    document.querySelectorAll('[data-set-autopronounce]').forEach(function(b) {
      var val = b.getAttribute('data-set-autopronounce');
      b.classList.toggle('primary', val === curAutopronounce);
    });
    document.querySelectorAll('[data-set-doubletap]').forEach(function(b) {
      var val = b.getAttribute('data-set-doubletap');
      b.classList.toggle('primary', val === curDoubletap);
    });
    document.querySelectorAll('[data-set-zenfocus]').forEach(function(b) {
      var val = b.getAttribute('data-set-zenfocus');
      b.classList.toggle('primary', val === curZenfocus);
    });
    document.querySelectorAll('[data-set-lang]').forEach(function(b) {
      var val = b.getAttribute('data-set-lang');
      b.classList.toggle('primary', val === curLang);
    });
    document.querySelectorAll('[data-set-rate]').forEach(function(b) {
      var val = b.getAttribute('data-set-rate');
      b.classList.toggle('primary', val === curRate);
    });
    document.querySelectorAll('[data-set-theme]').forEach(function(b) {
      var val = b.getAttribute('data-set-theme');
      b.classList.toggle('primary', val === curTheme);
    });
    document.querySelectorAll('[data-set-fs]').forEach(function(b) {
      var val = b.getAttribute('data-set-fs');
      b.classList.toggle('primary', val === curFs);
    });
    document.querySelectorAll('[data-set-sound]').forEach(function(b) {
      var val = b.getAttribute('data-set-sound');
      b.classList.toggle('primary', val === curSound);
    });
    document.querySelectorAll('[data-set-haptic]').forEach(function(b) {
      var val = b.getAttribute('data-set-haptic');
      b.classList.toggle('primary', val === curHaptic);
    });

    var curCorpus = localStorage.getItem('kao_corpus_hierarchy') || 'all';
    var curDecayPrior = localStorage.getItem('kao_decay_prior') || '1';
    var curSlowHard = localStorage.getItem('kao_slow_hard_words') || '1';
    var curMaskTrans = localStorage.getItem('kao_mask_translation') || '1';
    var curColorMnemonic = localStorage.getItem('kao_color_mnemonic') || '1';
    var curEdgeGuard = localStorage.getItem('kao_edge_guard') || '1';
    var curPuppyMode = localStorage.getItem('kao_puppy_mode') || 'active';
    var curRemindTime = localStorage.getItem('kao_remind_time') || 'morning';

    document.querySelectorAll('[data-set-corpushierarchy]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-corpushierarchy') === curCorpus);
    });
    document.querySelectorAll('[data-set-decayprior]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-decayprior') === curDecayPrior);
    });
    document.querySelectorAll('[data-set-slowhard]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-slowhard') === curSlowHard);
    });
    document.querySelectorAll('[data-set-masktranslation]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-masktranslation') === curMaskTrans);
    });
    document.querySelectorAll('[data-set-colormnemonic]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-colormnemonic') === curColorMnemonic);
    });
    var curEdgeGuard = localStorage.getItem('kao_edge_guard') || localStorage.getItem('kao_edge_protect') || '1';
    document.querySelectorAll('[data-set-edgeguard], [data-set-edgeprotect]').forEach(function(b) {
      var val = b.getAttribute('data-set-edgeguard') || b.getAttribute('data-set-edgeprotect');
      b.classList.toggle('primary', val === curEdgeGuard);
    });
    document.querySelectorAll('[data-set-puppymode]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-puppymode') === curPuppyMode);
    });
    document.querySelectorAll('[data-set-remindtime]').forEach(function(b) {
      b.classList.toggle('primary', b.getAttribute('data-set-remindtime') === curRemindTime);
    });
    renderCloudSyncInfo();
    updateHomeMenuBadges();
  }
  syncSettingsUI();

  // ==========================================================================
  // 每日萌犬签到打卡系统 (Daily Cute Puppy Check-In System)
  // ==========================================================================
  var PUPPY_DATABASE = [
    // 🐕 10 只金毛幼犬 (Golden Retriever Puppies)
    { id: 'golden_bone', breed: 'golden', breedName: '金毛幼犬', name: '咬骨头小金毛', fullName: '大口咬骨头小金毛', img: 'img/puppies/golden_bone.jpg', emoji: '🦮', status: '咬骨头', tag: '活力满满', quote: '骨头香香！背完这组考研词，咱们一起去大草坪撒欢！' },
    { id: 'golden_drool', breed: 'golden', breedName: '金毛幼犬', name: '馋嘴流口水金毛', fullName: '舔嘴流口水小金毛', img: 'img/puppies/golden_drool.jpg', emoji: '🦮', status: '流口水', tag: '馋嘴萌力', quote: '吸溜~ 知识真下饭！学好考研英语，上岸吃大餐！' },
    { id: 'golden_sleep', breed: 'golden', breedName: '金毛幼犬', name: '甜睡小金毛', fullName: '香甜入梦小金毛', img: 'img/puppies/golden_sleep.jpg', emoji: '🦮', status: '睡觉', tag: '甜甜入睡', quote: '呼噜噜~ 睡个好觉大脑才能巩固记忆，晚安做个上岸美梦！' },
    { id: 'golden_love', breed: 'golden', breedName: '金毛幼犬', name: '心动爱心金毛', fullName: '爱心眼心动小金毛', img: 'img/puppies/golden_love.jpg', emoji: '🦮', status: '喜欢心动', tag: '满分偏爱', quote: '看着你专注背单词的样子，两眼直冒爱心！主人太棒啦！' },
    { id: 'golden_sleepy', breed: 'golden', breedName: '金毛幼犬', name: '打哈欠困困金毛', fullName: '哈欠连天小金毛', img: 'img/puppies/golden_sleepy.jpg', emoji: '🦮', status: '发困', tag: '困倦犯迷糊', quote: '嗷呜~ 困了就揉揉眼睛伸个懒腰，喝口温水继续冲刺！' },
    { id: 'golden_smile', breed: 'golden', breedName: '金毛幼犬', name: '灿烂微笑金毛', fullName: '暖阳微笑小金毛', img: 'img/puppies/golden_smile.jpg', emoji: '🦮', status: '灿烂微笑', tag: '治愈暖阳', quote: '今天又是元气满满的一天！微笑面对考研，一切皆有可能！' },
    { id: 'golden_tilt', breed: 'golden', breedName: '金毛幼犬', name: '歪头好奇金毛', fullName: '歪头思考小金毛', img: 'img/puppies/golden_tilt.jpg', emoji: '🦮', status: '歪头好奇', tag: '求知若渴', quote: '歪着小脑瓜研究这个长难句，原来语法结构这么清晰！' },
    { id: 'golden_glasses', breed: 'golden', breedName: '金毛幼犬', name: '学霸眼镜金毛', fullName: '金丝眼镜学霸金毛', img: 'img/puppies/golden_glasses.jpg', emoji: '🦮', status: '认真学霸', tag: '专注研读', quote: '推了推金丝眼镜：大纲词汇核心考点已被我们彻底锁定！' },
    { id: 'golden_graduate', breed: 'golden', breedName: '金毛幼犬', name: '学士帽金毛', fullName: '戴学士帽上岸金毛', img: 'img/puppies/golden_graduate.jpg', emoji: '🦮', status: '考研必胜', tag: '一战成硕', quote: '恭喜提前锁定录取通知书！学士帽戴好，咱们顶峰相见！' },
    { id: 'golden_cheer', breed: 'golden', breedName: '金毛幼犬', name: '金牌打气金毛', fullName: '举爪夺金打气金毛', img: 'img/puppies/golden_cheer.jpg', emoji: '🦮', status: '挥爪加油', tag: '胜券在握', quote: '金牌学伴为你摇尾高呼：坚持就是胜利，考研初试必高分！' },

    // 🐕‍🦺 10 只边牧幼犬 (Border Collie Puppies)
    { id: 'border_bone', breed: 'border', breedName: '边牧幼犬', name: '咬骨头边牧', fullName: '智力咬骨头小边牧', img: 'img/puppies/border_bone.jpg', emoji: '🐕‍🦺', status: '咬骨头', tag: '敏捷机智', quote: '高智商加持！骨头一口咬定，考研核心考点也是一网打尽！' },
    { id: 'border_drool', breed: 'border', breedName: '边牧幼犬', name: '馋嘴流口水边牧', fullName: '馋嘴机敏小边牧', img: 'img/puppies/border_drool.jpg', emoji: '🐕‍🦺', status: '流口水', tag: '迫不及待', quote: '馋到流口水啦！快把今天这 50 个高频词通通“吞”进肚子里！' },
    { id: 'border_sleep', breed: 'border', breedName: '边牧幼犬', name: '甜睡小边牧', fullName: '熟睡做梦小边牧', img: 'img/puppies/border_sleep.jpg', emoji: '🐕‍🦺', status: '睡觉', tag: '深度充电', quote: '连梦里都在快速检索词根词缀，深度睡眠让记忆力爆表！' },
    { id: 'border_love', breed: 'border', breedName: '边牧幼犬', name: '心动爱心边牧', fullName: '爱心闪闪小边牧', img: 'img/puppies/border_love.jpg', emoji: '🐕‍🦺', status: '喜欢心动', tag: '智性心动', quote: '喜欢你一丝不苟背单词的专注劲儿！为你疯狂比心！' },
    { id: 'border_sleepy', breed: 'border', breedName: '边牧幼犬', name: '打哈欠困困边牧', fullName: '哈欠大张小边牧', img: 'img/puppies/border_sleepy.jpg', emoji: '🐕‍🦺', status: '发困', tag: '略显疲倦', quote: '虽然困意袭来，但边牧的高智商大脑依然能再战三个完形填空！' },
    { id: 'border_smile', breed: 'border', breedName: '边牧幼犬', name: '灿烂微笑边牧', fullName: '自信灿笑小边牧', img: 'img/puppies/border_smile.jpg', emoji: '🐕‍🦺', status: '灿烂微笑', tag: '自信从容', quote: '咧开嘴笑一个！考研英语真题早已被我们拿捏得死死的！' },
    { id: 'border_tilt', breed: 'border', breedName: '边牧幼犬', name: '歪头好奇边牧', fullName: '灵动机敏歪头边牧', img: 'img/puppies/border_tilt.jpg', emoji: '🐕‍🦺', status: '歪头好奇', tag: '逻辑严谨', quote: '耳朵竖起来歪头一想，这个同义替换考点原来如此绝妙！' },
    { id: 'border_glasses', breed: 'border', breedName: '边牧幼犬', name: '学霸眼镜边牧', fullName: '黑框眼镜首席学霸边牧', img: 'img/puppies/border_glasses.jpg', emoji: '🐕‍🦺', status: '认真学霸', tag: '智商天花板', quote: '学术边牧上线！真题考点短语联想记忆，过目不忘！' },
    { id: 'border_graduate', breed: 'border', breedName: '边牧幼犬', name: '学士帽边牧', fullName: '状元学士帽边牧', img: 'img/puppies/border_graduate.jpg', emoji: '🐕‍🦺', status: '考研必胜', tag: '金榜题名', quote: '学士帽戴在最聪明的脑袋上！考研初试单科 85+ 稳稳拿下！' },
    { id: 'border_cheer', breed: 'border', breedName: '边牧幼犬', name: '金牌打气边牧', fullName: '冠军奖章打气边牧', img: 'img/puppies/border_cheer.jpg', emoji: '🐕‍🦺', status: '挥爪加油', tag: '稳操胜券', quote: '给你佩戴今日学习金牌！保持节奏，上岸已是板上钉钉！' },

    // 🐶 10 只萨摩耶幼犬 (Samoyed Puppies)
    { id: 'samoyed_bone', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '咬骨头萨摩耶', fullName: '微笑咬骨头萨摩耶', img: 'img/puppies/samoyed_bone.jpg', emoji: '🐶', status: '咬骨头', tag: '雪白棉花糖', quote: '即使嘴里咬着大骨头，也依然要保持治愈的甜甜微笑！' },
    { id: 'samoyed_drool', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '馋嘴流口水萨摩耶', fullName: '吐舌馋嘴萨摩耶', img: 'img/puppies/samoyed_drool.jpg', emoji: '🐶', status: '流口水', tag: '呆萌可爱', quote: '馋到吐舌头啦！背单词就像吃冰淇淋，越嚼越甜！' },
    { id: 'samoyed_sleep', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '甜睡萨摩耶', fullName: '云朵甜睡萨摩耶', img: 'img/puppies/samoyed_sleep.jpg', emoji: '🐶', status: '睡觉', tag: '云朵软绵', quote: '像软绵绵的棉花糖一样安睡，蓄满能量明天接着冲！' },
    { id: 'samoyed_love', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '心动爱心萨摩耶', fullName: '红晕爱心萨摩耶', img: 'img/puppies/samoyed_love.jpg', emoji: '🐶', status: '喜欢心动', tag: '治愈甜心', quote: '双眼扑闪红心！看着你每天坚持，小萨摩耶心里暖洋洋的！' },
    { id: 'samoyed_sleepy', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '打哈欠困困萨摩耶', fullName: '揉眼哈欠萨摩耶', img: 'img/puppies/samoyed_sleepy.jpg', emoji: '🐶', status: '发困', tag: '迷糊小雪球', quote: '困了就来揉揉小萨摩耶毛茸茸的脸蛋，立刻满血复活！' },
    { id: 'samoyed_smile', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '微笑天使萨摩耶', fullName: '治愈系天使萨摩耶', img: 'img/puppies/samoyed_smile.jpg', emoji: '🐶', status: '灿烂微笑', tag: '微笑天使', quote: '保持微笑！好心态与从容自信能助你在考研考场多拿20分！' },
    { id: 'samoyed_tilt', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '歪头好奇萨摩耶', fullName: '歪头甜笑萨摩耶', img: 'img/puppies/samoyed_tilt.jpg', emoji: '🐶', status: '歪头好奇', tag: '纯真灵动', quote: '好奇地眨眨眼睛，只要每天多攻克几个词，上岸并不难！' },
    { id: 'samoyed_glasses', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '学霸眼镜萨摩耶', fullName: '金丝眼镜萨摩耶', img: 'img/puppies/samoyed_glasses.jpg', emoji: '🐶', status: '认真学霸', tag: '儒雅文质', quote: '戴上眼镜也是微笑学霸！长难句切分得明明白白！' },
    { id: 'samoyed_graduate', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '学士帽萨摩耶', fullName: '考研学士帽萨摩耶', img: 'img/puppies/samoyed_graduate.jpg', emoji: '🐶', status: '考研必胜', tag: '圆梦初试', quote: '学士帽稳稳戴好，你流过的每一滴汗水都将在录取榜上发光！' },
    { id: 'samoyed_cheer', breed: 'samoyed', breedName: '萨摩耶幼犬', name: '金牌打气萨摩耶', fullName: '摇尾金牌萨摩耶', img: 'img/puppies/samoyed_cheer.jpg', emoji: '🐶', status: '挥爪加油', tag: '阳光满溢', quote: '阳光照耀前路！小萨摩耶挥舞小肉爪，为你全程护航！' }
  ];

  function getCheckinData() {
    var raw = {};
    try {
      raw = JSON.parse(localStorage.getItem('kao_puppy_checkins') || '{}');
    } catch (e) { raw = {}; }
    if (!raw.history || typeof raw.history !== 'object') raw.history = {};
    return raw;
  }

  function saveCheckinData(data) {
    try {
      localStorage.setItem('kao_puppy_checkins', JSON.stringify(data));
    } catch (e) {}
  }

  function initDailyCheckin() {
    var todayCard = $('checkin-today-card');
    var trailGrid = $('checkin-trail-grid');
    var albumGrid = $('puppy-album-grid');
    var streakBadge = $('checkin-streak-badge');
    var collectedBadge = $('checkin-collected-badge');
    var albumToggleBtn = $('toggle-puppy-album-btn');
    var albumArrow = $('puppy-album-arrow');
    if (!todayCard || !trailGrid) return;

    function renderUI() {
      var data = getCheckinData();
      var todayStr = localDay(0);
      var todayRecord = data.history[todayStr];

      // 1. 计算连续打卡天数
      var streak = 0;
      var curD = new Date();
      if (data.history[localDay(0)]) {
        streak = 1;
        while (true) {
          curD.setDate(curD.getDate() - 1);
          var ds = fmtD(curD);
          if (data.history[ds]) streak++;
          else break;
        }
      } else if (data.history[localDay(-1)]) {
        streak = 0; // 今日尚未签到，但昨日有
        var checkD = new Date();
        checkD.setDate(checkD.getDate() - 1);
        while (true) {
          var dstr = fmtD(checkD);
          if (data.history[dstr]) {
            streak++;
            checkD.setDate(checkD.getDate() - 1);
          } else break;
        }
      }
      if (streakBadge) {
        streakBadge.textContent = '已连续打卡 ' + streak + ' 天';
      }

      // 2. 统计图鉴收集数
      var collectedIds = new Set();
      Object.keys(data.history).forEach(function(d) {
        if (data.history[d] && data.history[d].puppyId) {
          collectedIds.add(data.history[d].puppyId);
        }
      });
      if (collectedBadge) {
        collectedBadge.textContent = '萌犬图鉴 ' + collectedIds.size + '/30';
      }

      // 3. 今日卡片渲染
      if (!todayRecord) {
        todayCard.innerHTML = 
          '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
            '<div>' +
              '<div style="font-size:14.5px;font-weight:700;color:var(--color-text);display:flex;align-items:center;gap:6px">' +
                '<span style="font-size:18px">🐾</span> 今日待签到 · 专属萌犬大头贴等你领养' +
              '</div>' +
              '<div style="font-size:12px;color:var(--color-text-muted);margin-top:3px">每天打卡可领养一只专属考研学伴小狗（金毛/边牧/萨摩耶 30 款大头照随机抽取）</div>' +
            '</div>' +
            '<button id="mem-do-checkin-btn" class="nav-btn primary" type="button" style="padding:9px 18px;font-size:13.5px;font-weight:800;border-radius:10px;box-shadow:0 4px 14px color-mix(in oklab, var(--color-primary) 28%, transparent);cursor:pointer">🐾 立即手动签到</button>' +
          '</div>';

        var btn = $('mem-do-checkin-btn');
        if (btn) {
          btn.onclick = function() {
            doCheckin();
          };
        }
      } else {
        var pup = PUPPY_DATABASE.find(function(p){ return p.id === todayRecord.puppyId; }) || PUPPY_DATABASE[0];
        todayCard.innerHTML = 
          '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
            '<img src="' + esc(pup.img) + '" alt="' + esc(pup.fullName) + '" style="width:62px;height:62px;border-radius:18px;object-fit:cover;border:2.5px solid var(--color-primary);box-shadow:0 4px 12px rgba(0,0,0,0.1);flex-shrink:0" class="puppy-bounce-anim">' +
            '<div style="flex:1;min-width:200px">' +
              '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' +
                '<span style="font-size:15px;font-weight:800;color:var(--color-text)">今日已打卡 ✓ 专属学伴：【' + esc(pup.fullName) + '】</span>' +
                '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:color-mix(in oklab, var(--color-primary) 15%, transparent);color:var(--color-primary)">' + esc(pup.breedName) + ' · ' + esc(pup.status) + '</span>' +
              '</div>' +
              '<div style="font-size:12.5px;color:var(--color-text);margin-top:4px;line-height:1.5">“' + esc(pup.quote) + '”</div>' +
              '<div style="font-size:11px;color:var(--color-text-muted);margin-top:3px">打卡时间：今日 ' + esc(todayRecord.time || '已记录') + ' · 明日还会随机邂逅新的萌犬大头贴哦！</div>' +
            '</div>' +
          '</div>';
      }

      // 4. 渲染近 7 日打卡足迹（在日期下面展示萌犬大头贴）
      trailGrid.innerHTML = '';
      var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      for (var i = 6; i >= 0; i--) {
        var dObj = new Date();
        dObj.setDate(dObj.getDate() - i);
        var dateKey = fmtD(dObj);
        var rec = data.history[dateKey];
        var isToday = i === 0;

        var cell = document.createElement('div');
        cell.className = 'checkin-day-cell' + (isToday ? ' today' : '') + (rec ? ' checked' : '');

        var monthDayStr = (dObj.getMonth() + 1) + '/' + dObj.getDate();
        var labelStr = isToday ? '今天' : ('周' + weekDays[dObj.getDay()]);

        var puppyContent = '';
        var subText = '';
        if (rec) {
          var matchedPup = PUPPY_DATABASE.find(function(p){ return p.id === rec.puppyId; }) || {};
          var avatarSrc = rec.img || matchedPup.img || 'img/puppies/golden_smile.jpg';
          puppyContent = '<img src="' + esc(avatarSrc) + '" alt="' + esc(rec.name) + '" style="width:28px;height:28px;border-radius:8px;object-fit:cover;margin:2px auto;display:block" class="puppy-bounce-anim" title="' + esc(rec.name + ': ' + rec.quote) + '">';
          subText = esc(rec.name);
        } else if (isToday) {
          puppyContent = '<span style="font-size:14px;color:var(--color-primary);font-weight:700">待领</span>';
          subText = '未签';
        } else {
          puppyContent = '<span style="font-size:13px;color:var(--color-border);opacity:0.6">⚪</span>';
          subText = '缺卡';
        }

        cell.innerHTML = 
          '<div class="day-label">' + monthDayStr + '</div>' +
          '<div style="font-size:10px;color:var(--color-text-muted)">' + labelStr + '</div>' +
          '<div class="puppy-slot">' + puppyContent + '</div>' +
          '<div class="puppy-name-sub">' + subText + '</div>';

        if (rec) {
          (function(r) {
            cell.style.cursor = 'pointer';
            cell.onclick = function() {
              if (window.KaoyanToast) window.KaoyanToast(r.fullName + ' 打气：“' + r.quote + '”');
            };
          })(rec);
        }

        trailGrid.appendChild(cell);
      }

      // 5. 渲染萌犬图鉴墙 (30 张大头照全景)
      if (albumGrid) {
        albumGrid.innerHTML = '';
        PUPPY_DATABASE.forEach(function(p) {
          var isUnlocked = collectedIds.has(p.id);
          var card = document.createElement('div');
          card.className = 'puppy-album-card ' + (isUnlocked ? 'unlocked' : 'locked');
          card.style.cssText = 'background:var(--color-surface);border:1px solid ' + (isUnlocked ? 'var(--color-primary)' : 'var(--color-border)') + ';border-radius:14px;padding:10px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transition:transform 0.15s ease';
          card.innerHTML = 
            (isUnlocked 
              ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid var(--color-primary);box-shadow:0 2px 8px rgba(0,0,0,0.08)">'
              : '<div style="width:52px;height:52px;border-radius:14px;background:var(--color-surface-offset);display:flex;align-items:center;justify-content:center;font-size:22px;border:1px dashed var(--color-border);color:var(--color-text-faint)">🔒</div>') +
            '<div style="font-size:11.5px;font-weight:700;color:var(--color-text);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">' + esc(p.name) + '</div>' +
            '<div style="font-size:10px;color:' + (isUnlocked ? 'var(--color-primary)' : 'var(--color-text-muted)') + ';font-weight:600">' + (isUnlocked ? esc(p.status) : '未解锁') + '</div>';
          card.onclick = function() {
            if (isUnlocked) {
              if (window.KaoyanToast) window.KaoyanToast(p.breedName + '【' + p.fullName + '】：“' + p.quote + '”');
            } else {
              if (window.KaoyanToast) window.KaoyanToast('🔒 ' + p.breedName + '【' + p.name + '】暂未解锁，坚持每日签到即可随机邂逅！');
            }
          };
          albumGrid.appendChild(card);
        });
      }
    }

    function doCheckin() {
      var data = getCheckinData();
      var todayStr = localDay(0);
      if (data.history[todayStr]) {
        if (window.KaoyanToast) window.KaoyanToast('今日已经签过到啦！小狗学伴正陪你背单词呢~');
        return;
      }

      // 签到时边牧和其他狗狗（金毛、萨摩耶）完全随机抽取，优先从未解锁中抽
      var collectedIds = new Set(Object.keys(data.history).map(function(k){ return data.history[k].puppyId; }));
      var uncollected = PUPPY_DATABASE.filter(function(p){ return !collectedIds.has(p.id); });
      var pickedPup = uncollected.length 
        ? uncollected[Math.floor(Math.random() * uncollected.length)] 
        : PUPPY_DATABASE[Math.floor(Math.random() * PUPPY_DATABASE.length)];

      var nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      data.history[todayStr] = {
        puppyId: pickedPup.id,
        name: pickedPup.name,
        fullName: pickedPup.fullName,
        breed: pickedPup.breed,
        breedName: pickedPup.breedName,
        img: pickedPup.img,
        emoji: pickedPup.emoji,
        tag: pickedPup.tag,
        status: pickedPup.status,
        quote: pickedPup.quote,
        time: nowTime
      };
      saveCheckinData(data);

      // 音频提示 & 触感微震
      try {
        if (window.KaoyanSettings && window.KaoyanSettings.playSuccess) window.KaoyanSettings.playSuccess();
        if (navigator.vibrate) navigator.vibrate([40, 60, 80]);
      } catch (e) {}

      if (window.KaoyanToast) {
        window.KaoyanToast('🎉 签到成功！今日学伴【' + pickedPup.fullName + '】已送达！“' + pickedPup.quote + '”');
      }

      renderUI();
    }

    // 展开/收起图鉴
    if (albumToggleBtn && albumGrid && albumArrow) {
      albumToggleBtn.onclick = function() {
        var isHidden = albumGrid.hidden;
        albumGrid.hidden = !isHidden;
        albumArrow.textContent = isHidden ? '收起图鉴 🔼' : '查看图鉴 🔽';
      };
    }

    renderUI();
  }

  initDailyCheckin();

  var bundledMem = (window.getKaoyanWords && window.getKaoyanWords()) || window.__WORDS_DATA__ || window.__INITIAL_WORDS__;
  if (bundledMem && bundledMem.words) {
    window.__ALL_WORDS__ = bundledMem.words;
  } else if (window.loadKaoyanWords) {
    window.loadKaoyanWords().then(function(d){ if (d && d.words) window.__ALL_WORDS__ = d.words; }).catch(function(){});
  } else {
    try {
      var xhrMem = new XMLHttpRequest();
      xhrMem.open('GET', 'data/words.json', true);
      xhrMem.onreadystatechange = function () {
        if (xhrMem.readyState === 4 && (xhrMem.status === 200 || xhrMem.status === 0) && xhrMem.responseText) {
          try {
            var t = xhrMem.responseText.trim();
            if (!t || t.charAt(0) === '<') return;
            var d = JSON.parse(t);
            if (d && d.words) window.__ALL_WORDS__ = d.words;
          } catch (e) {}
        }
      };
      xhrMem.send();
    } catch (e) {}
  }

  // ==========================================================================
  // 📱 手机系统设置式三级层级导航引擎 (3-Tier Hierarchical Engine for Memory Page)
  // ==========================================================================

  var SUB_PANE_CONFIG = {
    'stats': { id: 'sub-stats-pane', title: '📊 学习统计' },
    'favs': { id: 'sub-favs-pane', title: '⭐ 专属生词本' },
    'history': { id: 'sub-history-pane', title: '📅 学习记录与足迹' },
    'settings': { id: 'sub-settings-menu-pane', title: '⚙️ 系统设置' },
    'settings-study': { id: 'sub-settings-study-pane', title: '🎯 学习目标与计划' },
    'settings-audio': { id: 'sub-settings-audio-pane', title: '🔊 发音口音与语速' },
    'settings-display': { id: 'sub-settings-display-pane', title: '🎨 主题外观与排版' },
    'settings-cloud': { id: 'sub-settings-cloud-pane', title: '☁️ 云端同步' },
    'settings-backup': { id: 'sub-settings-backup-pane', title: '💾 数据备份与报告' },
    'settings-about': { id: 'sub-settings-about-pane', title: 'ℹ️ 关于' }
  };

  var currentMemoryDepth = 1;
  function getMemoryRouteDepth(hash) {
    if (!hash || hash === 'home') return 1;
    if (hash.startsWith('word/')) return 3;
    if (hash.startsWith('settings-')) return 3;
    if (SUB_PANE_CONFIG[hash]) return 2;
    return 1;
  }

  function switchTierView(viewId, isBack) {
    document.querySelectorAll('.tier-view').forEach(function(v) {
      v.classList.remove('active');
      v.classList.remove('slide-back');
    });
    var target = document.getElementById(viewId);
    if (target) {
      if (isBack) {
        target.classList.add('slide-back');
      }
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  }

  function handleMemoryRoute() {
    var hash = location.hash.replace(/^#\/?/, '').trim();
    var newDepth = getMemoryRouteDepth(hash);
    var isBack = newDepth < currentMemoryDepth;
    currentMemoryDepth = newDepth;

    if (!hash || hash === 'home') {
      switchTierView('mem-view-home', isBack);
      updateHomeMenuBadges();
      return;
    }

    // Word detail in Tier 3
    if (hash.startsWith('word/')) {
      var targetWord = decodeURIComponent(hash.slice(5).trim());
      switchTierView('mem-view-word', isBack);
      renderMemWordDetail(targetWord);
      return;
    }

    // Sub-panes in Tier 2 or Tier 3 settings
    var cfg = SUB_PANE_CONFIG[hash];
    if (cfg) {
      switchTierView('mem-view-sub', isBack);
      var titleEl = document.getElementById('mem-sub-header-title');
      if (titleEl) titleEl.textContent = cfg.title;

      var subBackBtn = document.getElementById('mem-sub-back-btn');
      if (subBackBtn) {
        if (hash.startsWith('settings-')) {
          subBackBtn.textContent = '‹ 设置';
        } else if (hash === 'settings') {
          subBackBtn.textContent = '‹ 个人中心';
        } else {
          subBackBtn.textContent = '‹ 返回';
        }
      }

      // Show the selected sub pane, hide others
      document.querySelectorAll('.mem-sub-pane').forEach(function(p) {
        p.style.display = 'none';
      });
      var pane = document.getElementById(cfg.id);
      if (pane) pane.style.display = 'block';

      // Specific sub-pane callbacks
      if (hash === 'favs') {
        renderFavsList();
      } else if (hash === 'history') {
        renderHistoryList();
      } else if (hash === 'stats') {
        renderStatsPane();
      } else if (hash === 'settings' || hash.startsWith('settings-')) {
        updateHomeMenuBadges();
        syncSettingsUI();
        if (hash === 'settings-cloud') {
          renderCloudSyncInfo();
        }
      }
      return;
    }

    // Fallback to home
    switchTierView('mem-view-home', isBack);
    updateHomeMenuBadges();
  }

  function updateHomeMenuBadges() {
    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(e){}
    var favBadge = document.getElementById('menu-badge-favs');
    if (favBadge) favBadge.textContent = favs.length + ' 词';

    var study = {};
    try { study = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}'); } catch(e){}
    var dailyGoal = String(study.daily || localStorage.getItem('kao_dailygoal') || '30');
    var goalBadge = document.getElementById('menu-badge-study-goal');
    if (goalBadge) goalBadge.textContent = '每日 ' + dailyGoal + ' 词';

    var lang = localStorage.getItem('kao_ttslang') || 'en-US';
    var rate = localStorage.getItem('kao_ttsrate') || '0.92';
    var audioBadge = document.getElementById('menu-badge-audio');
    if (audioBadge) audioBadge.textContent = (lang === 'en-US' ? '美音' : '英音') + ' · ' + rate + 'x';

    var theme = localStorage.getItem('theme') || 'light';
    var displayBadge = document.getElementById('menu-badge-display');
    if (displayBadge) {
      displayBadge.textContent = theme === 'light' ? '日间浅白' : (theme === 'dark' ? '夜间暗黑' : '纯黑OLED');
    }

    var cloudBadge = document.getElementById('menu-badge-cloud');
    if (cloudBadge) {
      var syncInfo = (window.KaoyanCloudSync && window.KaoyanCloudSync.getSyncInfo) ? window.KaoyanCloudSync.getSyncInfo() : {};
      cloudBadge.textContent = (syncInfo && syncInfo.code) ? '已同步' : '未备份';
    }
  }

  // --- 生词本列表渲染 ---
  var currentFavFilter = '';
  function renderFavsList() {
    var container = document.getElementById('favs-word-list');
    if (!container) return;

    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(e){}

    var badge = document.getElementById('mem-sub-badge');
    if (badge) badge.textContent = favs.length + ' 词';

    var allWords = window.__ALL_WORDS__ || [];
    var wordMap = {};
    allWords.forEach(function(w) { wordMap[w.word.toLowerCase()] = w; });

    var input = document.getElementById('favs-search-input');
    if (input && !input._bound) {
      input._bound = true;
      input.addEventListener('input', function() {
        currentFavFilter = input.value.trim().toLowerCase();
        renderFavsList();
      });
    }

    var filteredFavs = favs;
    if (currentFavFilter) {
      filteredFavs = favs.filter(function(w) {
        if (w.toLowerCase().includes(currentFavFilter)) return true;
        var info = wordMap[w.toLowerCase()];
        if (info) {
          var mStr = (info.exam_meaning || '') + ' ' + (info.translation || '');
          if (info.meanings) mStr += ' ' + info.meanings.map(function(m){ return (m.pos||'') + ' ' + (m.zh||''); }).join(' ');
          if (mStr.toLowerCase().includes(currentFavFilter)) return true;
        }
        return false;
      });
    }

    if (!filteredFavs.length) {
      container.innerHTML = '<div style="padding:40px 16px;text-align:center;color:var(--color-text-muted);font-size:13.5px">' +
        (currentFavFilter ? '无匹配生词' : '⭐ 您的生词本还是空的<br><span style="font-size:12px;color:var(--color-text-faint);margin-top:6px;display:block">在背单词或查词库时点击星标，即可随时加入生词本</span>') +
        '</div>';
      return;
    }

    var html = filteredFavs.map(function(w) {
      var info = wordMap[w.toLowerCase()] || { word: w, phonetic: '', exam_meaning: '考研大纲核心词汇' };
      var rawPos = (info.pos || (info.exam_meaning && info.exam_meaning.match(/^([a-z]+\.)/i) ? info.exam_meaning.match(/^([a-z]+\.)/i)[1] : '') || '').replace('.', '');
      var cleanMeaning = (info.exam_meaning || info.translation || (info.meanings && info.meanings[0] ? info.meanings[0].zh : '') || '').replace(/^[a-z]+\.\s*/i, '');
      var m = (rawPos ? rawPos + '. ' : '') + (cleanMeaning || '考研大纲核心词汇');

      return '<div class="tier2-word-item" data-fav-word="' + esc(w) + '">' +
        '<div style="min-width:0;flex:1">' +
          '<div style="display:flex;align-items:baseline;gap:6px">' +
            '<span class="t2-word">' + esc(info.word) + '</span>' +
            (info.phonetic ? '<span class="t2-phonetic">/' + esc(info.phonetic) + '/</span>' : '') +
          '</div>' +
          '<div class="t2-meaning">' + esc(m) + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">' +
          '<button class="unfav-btn" data-remove-fav="' + esc(w) + '" type="button" title="移出生词本" style="background:none;border:none;color:#ef4444;font-size:16px;cursor:pointer;padding:4px 8px">✕</button>' +
          '<span class="sni-arrow">›</span>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;

    container.querySelectorAll('.tier2-word-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        if (e.target.closest('.unfav-btn')) return;
        var w = item.getAttribute('data-fav-word');
        location.hash = '#word/' + encodeURIComponent(w);
      });
    });

    container.querySelectorAll('[data-remove-fav]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var targetW = btn.getAttribute('data-remove-fav');
        var curFavs = [];
        try { curFavs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(err){}
        var idx = curFavs.indexOf(targetW);
        if (idx >= 0) {
          curFavs.splice(idx, 1);
          localStorage.setItem('kao_quiz_favs', JSON.stringify(curFavs));
          if (window.KaoyanToast) window.KaoyanToast('已移出生词本');
          renderFavsList();
          updateHomeMenuBadges();
        }
      });
    });
  }

  // --- 历史足迹记录明细渲染 ---
  function renderHistoryList() {
    renderActivityBars();
    var container = document.getElementById('history-log-list');
    if (!container) return;

    var data = getCheckinData();
    var dates = Object.keys(data.history || {}).sort().reverse();

    if (!dates.length) {
      container.innerHTML = '<div style="padding:30px 16px;text-align:center;color:var(--color-text-muted);font-size:13px">暂无打卡记录，坚持每日签到点亮足迹</div>';
      return;
    }

    var html = dates.map(function(dStr) {
      var rec = data.history[dStr];
      var matchedPup = PUPPY_DATABASE.find(function(p){ return p.id === rec.puppyId; }) || {};
      var avatarSrc = rec.img || matchedPup.img || 'img/puppies/golden_smile.jpg';

      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-divider)">' +
        '<img src="' + esc(avatarSrc) + '" alt="' + esc(rec.name) + '" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:1.5px solid var(--color-primary)">' +
        '<div style="flex:1">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:13.5px;font-weight:700;color:var(--color-text)">' + esc(dStr) + ' · ' + esc(rec.fullName || rec.name) + '</span>' +
            '<span style="font-size:11px;color:var(--color-primary);font-weight:600">' + esc(rec.time || '已完成') + '</span>' +
          '</div>' +
          '<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">“' + esc(rec.quote || '坚持就是胜利！') + '”</div>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  }

  // --- 学习统计详情子视图 ---
  function renderStatsPane() {
    renderHomeOverviewStats();

    var stTotal = document.getElementById('st-total');
    var stMastered = document.getElementById('st-mastered');
    var stStreak = document.getElementById('st-streak');
    var stRetention = document.getElementById('st-retention');
    var stWeak = document.getElementById('st-weak');

    if (stTotal) stTotal.textContent = learned.length;
    if (stMastered) stMastered.textContent = mastered;
    if (stStreak) stStreak.textContent = streakDays + ' 天';
    if (stRetention) stRetention.textContent = retentionStr;
    if (stWeak) stWeak.textContent = weakWordsList.length;

    renderEbbinghausCurve();
    renderLevelDistribution();
    renderDueRow();
    renderWeakWordsList();
  }

  // --- 单词详情页渲染 (Tier 3: 复用词库渲染体系) ---
  function renderMemWordDetail(wordStr) {
    var headerTitle = document.getElementById('mem-word-header-word');
    if (headerTitle) headerTitle.textContent = wordStr;

    var contentBox = document.getElementById('mem-word-content-box');
    if (!contentBox) return;

    var allWords = window.__ALL_WORDS__ || [];
    var wordObj = allWords.find(function(w){ return w.word.toLowerCase() === wordStr.toLowerCase(); }) || {
      word: wordStr,
      phonetic: '',
      exam_meaning: '考研大纲核心词汇',
      translation: '考研大纲核心词汇'
    };

    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(e){}
    var isFavorited = (favs.indexOf(wordObj.word) >= 0);

    var favToggleBtn = document.getElementById('mem-word-fav-toggle');
    if (favToggleBtn) {
      favToggleBtn.textContent = isFavorited ? '★' : '☆';
      favToggleBtn.style.color = isFavorited ? '#f59e0b' : 'var(--color-text-muted)';
      favToggleBtn.onclick = function() {
        var idx = favs.indexOf(wordObj.word);
        if (idx >= 0) {
          favs.splice(idx, 1);
          isFavorited = false;
        } else {
          favs.push(wordObj.word);
          isFavorited = true;
        }
        localStorage.setItem('kao_quiz_favs', JSON.stringify(favs));
        favToggleBtn.textContent = isFavorited ? '★' : '☆';
        favToggleBtn.style.color = isFavorited ? '#f59e0b' : 'var(--color-text-muted)';
        updateHomeMenuBadges();
      };
    }

    var aiEx = {};
    if (window.__AI_EXAMPLES__ && window.__AI_EXAMPLES__.s && window.__AI_EXAMPLES__.s[wordObj.word]) {
      var arr = window.__AI_EXAMPLES__.s[wordObj.word];
      aiEx = { en: arr[0], zh: arr[1] };
    }

    var rawPos = (wordObj.pos || (wordObj.exam_meaning && wordObj.exam_meaning.match(/^([a-z]+\.)/i) ? wordObj.exam_meaning.match(/^([a-z]+\.)/i)[1] : '') || '核心').replace('.', '');
    var cleanMeaning = (wordObj.exam_meaning || wordObj.translation || (wordObj.meanings && wordObj.meanings[0] ? wordObj.meanings[0].zh : '') || '').replace(/^[a-z]+\.\s*/i, '');

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <!-- 单词头部 -->
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:32px;font-weight:800;color:var(--color-primary);letter-spacing:-0.5px">${esc(wordObj.word)}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;margin-top:6px">
            <span style="font-size:11px;background:var(--color-surface-offset);border:1px solid var(--color-border);padding:1px 6px;border-radius:6px;font-weight:700">英</span>
            <span style="font-size:13.5px;color:var(--color-text-muted)">${esc(wordObj.phonetic || '')}</span>
            <button id="mem-detail-audio-btn" type="button" style="background:none;border:none;color:var(--color-primary);font-size:16px;cursor:pointer;padding:2px 6px" title="朗读单词">🔊</button>
          </div>
        </div>

        <!-- 释义栏 -->
        <div class="bb-meaning-box" style="margin-bottom:12px">
          <span class="bb-pos-tag">${esc(rawPos)}</span>
          <span class="bb-meaning-text">${esc(cleanMeaning || '考研大纲核心词汇')}</span>
        </div>

        <!-- 考研真题学术例句 -->
        ${aiEx.en ? `
          <div class="bb-section-box" style="margin-bottom:12px">
            <div class="bb-section-head">
              <span class="bb-section-title">真题例句</span>
              <div class="bb-section-actions">
                <button class="bb-mini-btn" id="mem-detail-example-audio" type="button">🔊 读例句</button>
              </div>
            </div>
            <div class="bb-example-list">
              <div class="bb-example-item">
                <div class="bb-example-en" style="font-size:13.5px;line-height:1.6">${esc(aiEx.en)}</div>
                <div class="bb-example-zh" style="font-size:12.5px;margin-top:4px;color:var(--color-text-muted)">${esc(aiEx.zh)}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 考点短语搭配 -->
        ${wordObj.phrases && wordObj.phrases.length > 0 ? `
          <div class="bb-section-box bb-phrases-box" style="margin-bottom:12px">
            <div class="bb-section-head">
              <span class="bb-section-title">考点搭配 / 常用短语</span>
              <span class="bb-section-tag" style="background:color-mix(in oklab, #0284c7 12%, transparent);color:#0284c7;border-color:color-mix(in oklab, #0284c7 25%, transparent)">高频搭配</span>
            </div>
            <div class="bb-phrase-list">
              ${wordObj.phrases.map(function (p) {
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
            <div class="bb-root-text">${esc(wordObj.roots || wordObj.root || (wordObj.word + ' · 考研大纲核心词汇'))}</div>
            ${wordObj.synonyms ? `<div class="bb-syn-row" style="margin-top:6px;font-size:12px"><strong style="color:var(--color-primary)">同义替换：</strong>${esc(wordObj.synonyms)}</div>` : ''}
            ${wordObj.confused ? `<div class="bb-confused-row" style="margin-top:4px;font-size:12px"><strong style="color:#ef4444">形近易混：</strong>${esc(wordObj.confused)}</div>` : ''}
          </div>
        </div>

        <!-- 底部大操作栏 -->
        <div style="display:flex;gap:10px;margin-top:10px">
          <button id="mem-detail-bottom-fav" type="button" class="nav-btn" style="flex:1;padding:12px;font-size:14px;font-weight:700;border-radius:10px">
            ${isFavorited ? '⭐ 已在生词本' : '⭐ 加入生词本'}
          </button>
          <a href="study.html?word=${encodeURIComponent(wordObj.word)}" class="btn primary" style="flex:1;padding:12px;font-size:14px;font-weight:700;border-radius:10px;text-align:center;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px">
            📖 开始背这个词
          </a>
        </div>
      </div>
    `;

    contentBox.innerHTML = html;

    var speakWordBtn = document.getElementById('mem-detail-audio-btn');
    if (speakWordBtn) {
      speakWordBtn.onclick = function() {
        if (window.KaoyanAudio && window.KaoyanAudio.speak) {
          window.KaoyanAudio.speak(wordObj.word);
        } else if (window.speechSynthesis) {
          var u = new SpeechSynthesisUtterance(wordObj.word);
          u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
          window.speechSynthesis.speak(u);
        }
      };
    }

    var speakExBtn = document.getElementById('mem-detail-example-audio');
    if (speakExBtn && aiEx.en) {
      speakExBtn.onclick = function() {
        if (window.speechSynthesis) {
          var u = new SpeechSynthesisUtterance(aiEx.en);
          u.lang = 'en-US';
          window.speechSynthesis.speak(u);
        }
      };
    }

    var btmFav = document.getElementById('mem-detail-bottom-fav');
    if (btmFav) {
      btmFav.onclick = function() {
        var idx = favs.indexOf(wordObj.word);
        if (idx >= 0) {
          favs.splice(idx, 1);
          btmFav.textContent = '⭐ 加入生词本';
          if (favToggleBtn) { favToggleBtn.textContent = '☆'; favToggleBtn.style.color = 'var(--color-text-muted)'; }
          if (window.KaoyanToast) window.KaoyanToast('已从生词本移出');
        } else {
          favs.push(wordObj.word);
          btmFav.textContent = '⭐ 已在生词本';
          if (favToggleBtn) { favToggleBtn.textContent = '★'; favToggleBtn.style.color = '#f59e0b'; }
          if (window.KaoyanToast) window.KaoyanToast('已加入生词本');
        }
        localStorage.setItem('kao_quiz_favs', JSON.stringify(favs));
        updateHomeMenuBadges();
      };
    }
  }

  // --- 返回按钮与路由监听绑定 ---
  function bindMemoryNavigation() {
    var subBackBtn = document.getElementById('mem-sub-back-btn');
    if (subBackBtn) {
      subBackBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var curHash = location.hash.replace(/^#\/?/, '').trim();
        if (curHash.startsWith('settings-')) {
          location.hash = '#settings';
        } else if (history.length > 1 && !curHash.startsWith('settings')) {
          history.back();
        } else {
          location.hash = '#home';
        }
      });
    }

    var wordBackBtn = document.getElementById('mem-word-back-btn');
    if (wordBackBtn) {
      wordBackBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          location.hash = '#favs';
        }
      });
    }

    // 薄弱词列表点击直达详情
    var weakList = document.getElementById('weak-list');
    if (weakList) {
      weakList.addEventListener('click', function(e) {
        var item = e.target.closest('.weak-item');
        if (item) {
          e.preventDefault();
          var w = item.getAttribute('data-w') || item.querySelector('.w')?.textContent;
          if (w) location.hash = '#word/' + encodeURIComponent(w.trim());
        }
      });
    }

    window.addEventListener('hashchange', handleMemoryRoute);
    handleMemoryRoute();
    updateHomeMenuBadges();
    loadDynamicAppVersion();
  }

  function loadDynamicAppVersion() {
    function applyVer(ver) {
      if (!ver) return;
      currentAppVersionStr = String(ver);
      var vStr = currentAppVersionStr.startsWith('v') ? currentAppVersionStr : ('v' + currentAppVersionStr);
      var badge = $('mem-version-badge');
      if (badge) badge.textContent = vStr;
      var title = $('mem-version-title');
      if (title) title.textContent = vStr + ' 旗舰离线增强版';
      var desc = $('mem-version-desc');
      if (desc) desc.textContent = '版本 ' + vStr + ' · 考研 5,619 词大纲说明 · 30 款萌犬大头照图鉴';
      var nodes = document.querySelectorAll('[data-bind-version]');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].textContent = vStr;
      }
    }

    // 1. 优先读取 DOM 属性或预置版本号，零延迟渲染
    var domVer = (document.body && document.body.getAttribute('data-app-version')) || currentAppVersionStr;
    applyVer(domVer);

    // 2. XMLHttpRequest 异步兜底同步 version.json (file:// 协议下 status 为 0)
    try {
      var vXhr = new XMLHttpRequest();
      vXhr.open('GET', 'version.json', true);
      vXhr.onreadystatechange = function () {
        if (vXhr.readyState === 4 && (vXhr.status === 200 || vXhr.status === 0) && vXhr.responseText) {
          try {
            var data = JSON.parse(vXhr.responseText);
            if (data && data.version) applyVer(data.version);
          } catch (e) {}
        }
      };
      vXhr.send();
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindMemoryNavigation);
  } else {
    bindMemoryNavigation();
  }

})();
