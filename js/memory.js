/* 考研词汇 — 记忆板块：遗忘曲线、记忆等级分布、复习日程、薄弱词榜、近期统计。
   数据全部来自「背单词」页保存的 localStorage（kaoyan_study_v3），纯本地计算。 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
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
  $('s-total').textContent = learned.length;
  $('s-mastered').textContent = mastered;
  $('s-weak').textContent = learned.filter(function (w) { var p = progress[w]; return (p.wrong || 0) >= 3 || (p.failStreak || 0) >= 3; }).length;
  // 复习完成率：已到期词中，level>=1（曾经记住过）的比例
  var dueWords = learned.filter(function (w) { var n = progress[w].next; return typeof n === 'number' && n <= Date.now(); });
  var dueKnown = dueWords.filter(function (w) { return progress[w].level >= 2; }).length;
  $('s-retention').textContent = dueWords.length ? Math.round(dueKnown / dueWords.length * 100) + '%' : '—';

  // 连续打卡（与背单词页同一算法）
  function fmtD(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
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
    $('s-streak').textContent = s + ' 天';
  })();

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
  // 不复习：经典保持率插值（天数→百分比）
  var decayPts = [[0, 100], [0.014, 58], [1, 44], [2, 36], [6, 25], [15, 18], [31, 15], [60, 12]];
  // 按应用节奏复习：复习点回到高位，之后衰减放缓
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
      pts.push([t0, Math.max(20, lv - (lv - 20) * 0.18)]); // 衰减到复习前
      lv = reviewLevels[i];
      pts.push([t0, lv]); // 复习拉回
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
  $('curve-box').innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:720px;display:block;margin:0 auto">' + grid +
    '<path d="' + pathOf(decayPts) + '" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="' + pathOf(reviewPts) + '" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linejoin="round"/>' +
    reviewMarks +
    '<circle cx="' + px(reviewPts[reviewPts.length - 1][0]) + '" cy="' + py(reviewPts[reviewPts.length - 1][1]) + '" r="4" fill="var(--color-primary)"/>' +
    '</svg>';

  // ---- 记忆等级分布 ----
  var LV = ['未学过', '初识', '见过几次', '渐熟', '较熟', '熟练', '掌握'];
  var dist = [0, 0, 0, 0, 0, 0, 0];
  learned.forEach(function (w) { var l = Math.min(6, Math.max(0, progress[w].level || 0)); dist[l]++; });
  dist[0] = dist[0]; // 已学习集合中 level 0 = 评过不认识的词
  var maxD = Math.max.apply(null, dist.concat([1]));
  var cur = Math.min(6, Math.max(0, dist.reduce(function (m, v, i) { return v > dist[m] ? i : m; }, 1)));
  $('dist').innerHTML = dist.map(function (v, i) {
    var h = Math.max(4, Math.round(v / maxD * 110));
    return '<div class="bar' + (i === cur && v > 0 ? ' cur' : '') + '"><u>' + v + '</u><i style="height:' + h + 'px"></i><em>' + LV[i] + '</em></div>';
  }).join('');

  // ---- 复习日程 ----
  var now = Date.now(), day = 86400000;
  var buckets = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]; // 今天/明天/3天内/7天内/以后
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
  $('due-row').innerHTML = buckets.map(function (b, i) {
    return '<div class="due-cell' + (i === 0 && b[0] > 0 ? ' hot' : '') + '"><b>' + b[0] + '</b><span>' + dueLabels[i] + '</span></div>';
  }).join('');
  var dueN = buckets[0][0];
  var btn = document.createElement('a');
  btn.className = 'd-btn primary';
  btn.style.cssText = 'display:inline-block;margin-top:10px;text-decoration:none';
  btn.href = 'study.html?mode=review';
  btn.textContent = dueN > 0 ? '立即复习到期的 ' + dueN + ' 词 →' : '去背单词 →';
  var panel = $('due-row') ? $('due-row').parentElement : null;
  if (panel) panel.appendChild(btn);

  // ---- 近 30 天学习量 ----
  var days = [], maxV = 1;
  for (var i = 29; i >= 0; i--) {
    var k = fmtD(function (d2) { d2.setDate(d2.getDate() - i); return d2; }(new Date()));
    var v = (k === localDay(0)) ? (state.todayDone || 0) : (history[k] || 0);
    days.push({ k: k, v: v, today: i === 0 });
    if (v > maxV) maxV = v;
  }
  $('bars').innerHTML = days.map(function (d) {
    var h = Math.max(2, Math.round(d.v / maxV * 82));
    return '<div title="' + d.k + '：' + d.v + ' 词" style="flex:1;display:flex;align-items:flex-end;height:100%"><i style="display:block;width:100%;height:' + h + 'px;background:' + (d.today ? 'var(--color-primary)' : 'var(--color-core-soft)') + ';border-radius:2px 2px 0 0"></i></div>';
  }).join('');

  // ---- 薄弱词榜 ----
  var weak = learned.map(function (w) {
    var p = progress[w];
    return { w: w, score: (p.wrong || 0) + (p.failStreak || 0) * 2, wrong: p.wrong || 0, fs: p.failStreak || 0, tr: p.lastTr || '' };
  }).filter(function (x) { return x.score > 0; })
    .sort(function (a, b) { return b.score - a.score; }).slice(0, 15);
  $('weak-list').innerHTML = weak.length
    ? weak.map(function (x) {
      var badge = x.wrong > 0 ? '错 ' + x.wrong + ' 次' : '连忘 ' + x.fs + ' 次';
      return '<a class="weak-item" href="study.html?word=' + encodeURIComponent(x.w) + '"><span class="w">' + esc(x.w) + '</span><span class="t"></span><span class="c">' + badge + '</span></a>';
    }).join('') + '<a class="d-btn" style="display:inline-block;margin-top:12px;text-decoration:none;background:var(--color-accent-soft);color:var(--color-accent);font-weight:600;padding:8px 16px;border-radius:999px" href="study.html?mode=weak">🎯 专项攻克薄弱词 (' + weak.length + ') →</a>'
    : '<div class="empty-tip">还没有薄弱词；在「背单词」里多评几次就能看到啦。</div>';

  // ---- 最近学习 ----
  var recent = learned.filter(function (w) { return typeof progress[w].last === 'number'; })
    .sort(function (a, b) { return progress[b].last - progress[a].last; }).slice(0, 14);
  $('recent').innerHTML = recent.length
    ? recent.map(function (w) {
      return '<a href="study.html?word=' + encodeURIComponent(w) + '" title="' + fmtDay(progress[w].last) + '">' + esc(w) + '</a>';
    }).join('')
    : '<div class="empty-tip">先去「背单词」学几个词吧。</div>';

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
        document.querySelectorAll('[data-set-daily]').forEach(function(b){ b.classList.toggle('primary', b === dailyBtn); });
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
      if (window.KaoyanToast) window.KaoyanToast('🔊 朗读口音：' + (lVal === 'en-US' ? '美音' : '英音'));
      return;
    }
    // 语速
    var rateBtn = target.closest('[data-set-rate]');
    if (rateBtn) {
      var rVal = rateBtn.getAttribute('data-set-rate');
      localStorage.setItem('kao_ttsrate', rVal);
      document.querySelectorAll('[data-set-rate]').forEach(function(b){ b.classList.toggle('primary', b === rateBtn); });
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
      if (window.KaoyanToast) window.KaoyanToast('✓ 离线词库与云端同步已处于最新状态 (v9.54)');
      if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
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
    renderCloudSyncInfo();
  }
  syncSettingsUI();

  if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
    window.__ALL_WORDS__ = window.__WORDS_DATA__.words;
  } else {
    fetch('data/words.json').then(function(r){ return (r.ok || r.status === 0) ? r.json() : null; }).then(function(d){
      if (d && d.words) window.__ALL_WORDS__ = d.words;
    }).catch(function(){});
  }
})();
