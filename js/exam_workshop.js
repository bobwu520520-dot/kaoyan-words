/**
 * 考研英语（一）全能分级真题实战工坊引擎 (3-Tier Hierarchical Exam Workshop Engine)
 * Kaoyan English (I) Master Exam Workshop Engine
 * - 按需异步加载 (On-demand Fetch & Memory Caching)
 * - 纯原生无框架 (Vanilla JS + CSS)
 */

(function () {
  'use strict';

  var currentCategory = 'reading';
  var currentItemId = 0;

  // Completion Progress State Tracking (localStorage)
  var examProgress = {};
  try {
    examProgress = JSON.parse(localStorage.getItem('kao_exam_progress') || '{}');
  } catch (e) {
    examProgress = {};
  }

  function saveExamProgress(key, data) {
    examProgress[key] = Object.assign({}, examProgress[key] || {}, data);
    try {
      localStorage.setItem('kao_exam_progress', JSON.stringify(examProgress));
    } catch (e) {}
    renderHomeStats();
  }

  // Safe Audio Helper with Toggle & Stop Control
  function speak(text, btn) {
    if (!text) return;
    try {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          if (btn) {
            btn.textContent = btn.getAttribute('data-orig-text') || '🔊 朗读原句';
            btn.classList.remove('active');
          }
          return;
        }
        var u = new SpeechSynthesisUtterance(text);
        u.lang = localStorage.getItem('kao_ttslang') || 'en-US';
        u.rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
        if (btn) {
          var orig = btn.textContent;
          btn.setAttribute('data-orig-text', orig);
          btn.textContent = '⏹ 停止朗读';
          btn.classList.add('active');
          u.onend = function () {
            btn.textContent = orig;
            btn.classList.remove('active');
          };
          u.onerror = function () {
            btn.textContent = orig;
            btn.classList.remove('active');
          };
        }
        window.speechSynthesis.speak(u);
      } else if (window.KaoyanAudio && window.KaoyanAudio.speak) {
        window.KaoyanAudio.speak(text);
      }
    } catch (e) {}
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // 题型大纲基础元数据
  var CATEGORY_META = {
    cloze: {
      name: '完形填空',
      icon: '🧩',
      score: 'Section I · 10分',
      desc: '考研英语（一）第一部分，共 20 小题，每题 0.5 分。重点考查语篇衔接、同义复现与 40 大高频红花绿叶词。建议用时：15~18 分钟。',
      defaultCount: 2
    },
    reading: {
      name: '传统阅读理解（Text 1-4）',
      icon: '📖',
      score: 'Part A · 40分',
      desc: '共 4 篇精读，每篇 5 题，每题 2 分。占总分 40% 半壁江山！融汇唐迟逻辑六大题型拆解与命题陷阱排雷。建议用时：60~70 分钟。',
      defaultCount: 4
    },
    newtype: {
      name: '阅读新题型',
      icon: '🎯',
      score: 'Part B · 10分',
      desc: '共 5 小题，每题 2 分。常考题型包括 7选5逻辑衔接、排序题与小标题匹配。抓代词复现、冠词与逻辑线索链。建议用时：15~20 分钟。',
      defaultCount: 2
    },
    trans: {
      name: '翻译（英译汉）',
      icon: '🌐',
      score: 'Part C · 10分',
      desc: '共 5 个学术长难句，每句 2 分。运用田静句法五步拆分法（定从/状从/倒装/分割），重组符合汉语表达习惯的规范译文。建议用时：20~25 分钟。',
      defaultCount: 105
    },
    writing: {
      name: '考研写作（小作文+大作文）',
      icon: '✍️',
      score: 'Part A & B · 30分',
      desc: 'Part A 应用文书信告示（10分）+ Part B 潘赟九宫格图画大作文（20分）。保底 24+ 分的必争优势板块。建议用时：45~50 分钟。',
      defaultCount: 11
    },
    suite: {
      name: '历年真题套卷（按年份）',
      icon: '📚',
      score: '全卷模拟 · 100分',
      desc: '2010~2024 年全国统考英语（一）官方标准卷，支持 180 分钟考场全真计时与全题型全景模拟训练。',
      defaultCount: 15
    }
  };

  // --- 内存缓存仓库 (In-Memory Cache) ---
  var EXAM_CACHE = {};
  var examData = {
    cloze: [],
    reading: [],
    newtype: [],
    trans: [],
    writing: [],
    suite: []
  };

  /**
   * 从全局内嵌数据变量中获取题型数据 (零延迟、零网络、全离线支持)
   */
  function getCategoryDataFromGlobals(cat) {
    // 1. 翻译长难句
    if (cat === 'trans') {
      var tData = window.__TRANSLATIONS__ || window.__TRANSLATIONS_DATA__;
      if (Array.isArray(tData) && tData.length) {
        return tData;
      }
      if (tData && Array.isArray(tData.sentences) && tData.sentences.length) {
        return tData.sentences;
      }
      if (window.__EXAM_DATA__ && Array.isArray(window.__EXAM_DATA__.trans)) {
        return window.__EXAM_DATA__.trans;
      }
    }

    var eData = window.__EXAM_DATA__ || {};

    // 优先读取标准化数据数组 (Standardized Arrays)
    if (Array.isArray(eData[cat]) && eData[cat].length) {
      return eData[cat];
    }
    if (eData[cat] && Array.isArray(eData[cat].items) && eData[cat].items.length) {
      return eData[cat].items;
    }
    if (eData[cat] && Array.isArray(eData[cat].passages) && eData[cat].passages.length) {
      return eData[cat].passages;
    }
    if (eData[cat] && Array.isArray(eData[cat].tasks) && eData[cat].tasks.length) {
      return eData[cat].tasks;
    }

    // 2. 完形填空 (兼容全局变量与历史字段)
    if (cat === 'cloze') {
      if (eData.cloze_real && Array.isArray(eData.cloze_real.passages) && eData.cloze_real.passages.length) {
        return eData.cloze_real.passages;
      }
      var cG = window.__EXAM_CLOZE__;
      if (cG && Array.isArray(cG.passages) && cG.passages.length) return cG.passages;
    }

    // 3. 传统阅读理解 (兼容全局变量与历史字段)
    if (cat === 'reading') {
      if (eData.reading_real && Array.isArray(eData.reading_real.passages) && eData.reading_real.passages.length) {
        return eData.reading_real.passages;
      }
      var rG = window.__EXAM_READING__;
      if (rG && Array.isArray(rG.passages) && rG.passages.length) return rG.passages;
    }

    // 4. 阅读新题型 (兼容全局变量与历史字段)
    if (cat === 'newtype') {
      if (eData.newtype_real && Array.isArray(eData.newtype_real.tasks) && eData.newtype_real.tasks.length) {
        return eData.newtype_real.tasks;
      }
      var nG = window.__EXAM_NEWTYPE__;
      if (nG && Array.isArray(nG.tasks) && nG.tasks.length) return nG.tasks;
    }

    // 5. 写作 (小作文 + 大作文兼容全局变量与历史字段)
    if (cat === 'writing') {
      if (Array.isArray(eData.items) && eData.items.length) return eData.items;
      var wa = (eData.writings_a && Array.isArray(eData.writings_a.letters)) ? eData.writings_a.letters :
               (window.__EXAM_WRITINGS_A__ && Array.isArray(window.__EXAM_WRITINGS_A__.letters) ? window.__EXAM_WRITINGS_A__.letters : []);
      var wb = (eData.writings_b && Array.isArray(eData.writings_b.essays)) ? eData.writings_b.essays :
               (window.__EXAM_WRITINGS_B__ && Array.isArray(window.__EXAM_WRITINGS_B__.essays) ? window.__EXAM_WRITINGS_B__.essays : []);
      if (wa.length || wb.length) {
        return wa.concat(wb);
      }
    }

    // 6. 历年真题套卷
    if (cat === 'suite') {
      if (Array.isArray(eData.suite) && eData.suite.length) return eData.suite;
    }

    return null;
  }

  /**
   * 按需加载题型数据并缓存到内存 (优先全局变量，兜底用 XMLHttpRequest)
   * @param {string} cat 题型标识 (cloze / reading / newtype / trans / writing / suite)
   * @param {Function} callback 加载完成回调 (err, items)
   */
  function loadCategoryData(cat, callback) {
    if (!CATEGORY_META[cat]) cat = 'reading';

    // 1. 命中内存缓存，直接零延迟返回
    if (EXAM_CACHE[cat] && EXAM_CACHE[cat].length) {
      examData[cat] = EXAM_CACHE[cat];
      if (callback) callback(null, examData[cat]);
      return;
    }

    // 2. 优先从全局内嵌变量读取 (window.__EXAM_DATA__ / window.__TRANSLATIONS__)
    var globalItems = getCategoryDataFromGlobals(cat);
    if (globalItems && globalItems.length) {
      EXAM_CACHE[cat] = globalItems;
      examData[cat] = globalItems;
      renderHomeStats();
      if (callback) callback(null, globalItems);
      return;
    }

    var meta = CATEGORY_META[cat];
    var container = document.getElementById('exam-problem-items-container');
    var isListActive = document.getElementById('exam-view-list') && document.getElementById('exam-view-list').classList.contains('active');

    // 3. 渲染正在加载 Loading 动画状态
    if (container && isListActive) {
      container.innerHTML = `
        <div class="exam-loading-box" style="text-align:center;padding:50px 16px;color:var(--color-text-muted)">
          <div class="exam-spinner" style="font-size:32px;display:inline-block;animation:kySpin 1s linear infinite">🔄</div>
          <div style="font-size:14px;font-weight:700;color:var(--color-text);margin-top:14px">正在加载【${esc(meta.name)}】真题题库...</div>
          <div style="font-size:12px;margin-top:4px;opacity:0.8">本地加载 · 极速离线缓存</div>
        </div>
      `;
    }

    // 4. 全局变量没有时，使用 XMLHttpRequest 兜底加载本地 JSON 文件 (file:// 协议下 status 为 0)
    var jsonUrl = 'data/exam_' + cat + '.json';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonUrl, true);

    function handleError(err) {
      console.error('加载题型数据失败 [' + cat + ']:', err);
      if (container && isListActive) {
        container.innerHTML = `
          <div style="text-align:center;padding:40px 16px">
            <div style="font-size:30px;margin-bottom:8px">⚠️</div>
            <div style="font-size:14px;font-weight:700;color:var(--color-text)">【${esc(meta.name)}】数据加载遇到问题</div>
            <p style="font-size:12px;color:var(--color-text-muted);margin:6px 0 16px">${esc(err.message || '网络连接超时或文件未找到')}</p>
            <button class="nav-btn primary" id="exam-retry-btn" type="button" style="padding:8px 20px;border-radius:999px">重新加载</button>
          </div>
        `;
        var retryBtn = document.getElementById('exam-retry-btn');
        if (retryBtn) {
          retryBtn.onclick = function () {
            loadCategoryData(cat, callback);
          };
        }
      }
      if (callback) callback(err, []);
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // file:// 协议下 status 通常为 0，HTTP 下通常为 200
        if ((xhr.status === 200 || xhr.status === 0) && xhr.responseText) {
          try {
            var data = JSON.parse(xhr.responseText);
            var items = [];
            if (Array.isArray(data)) {
              items = data;
            } else if (data && Array.isArray(data.items)) {
              items = data.items;
            } else if (data && Array.isArray(data.passages)) {
              items = data.passages;
            } else if (data && Array.isArray(data.tasks)) {
              items = data.tasks;
            } else if (data && Array.isArray(data.sentences)) {
              items = data.sentences;
            } else if (data && Array.isArray(data.essays)) {
              items = data.essays;
            }

            // 写入内存缓存
            EXAM_CACHE[cat] = items;
            examData[cat] = items;
            renderHomeStats();

            if (callback) callback(null, items);
          } catch (parseErr) {
            handleError(parseErr);
          }
        } else {
          handleError(new Error('请求失败 (status ' + xhr.status + ')'));
        }
      }
    };

    xhr.onerror = function () {
      handleError(new Error('本地文件读取失败'));
    };

    try {
      xhr.send();
    } catch (sendErr) {
      handleError(sendErr);
    }
  }

  function initData() {
    ['cloze', 'reading', 'newtype', 'trans', 'writing', 'suite'].forEach(function(cat) {
      var items = getCategoryDataFromGlobals(cat);
      if (items && items.length) {
        EXAM_CACHE[cat] = items;
        examData[cat] = items;
      }
    });
    renderHomeStats();
  }

  // --- 1. 第一级首页统计更新 ---
  function renderHomeStats() {
    var counts = {
      cloze: (EXAM_CACHE.cloze && EXAM_CACHE.cloze.length) || CATEGORY_META.cloze.defaultCount,
      reading: (EXAM_CACHE.reading && EXAM_CACHE.reading.length) || CATEGORY_META.reading.defaultCount,
      newtype: (EXAM_CACHE.newtype && EXAM_CACHE.newtype.length) || CATEGORY_META.newtype.defaultCount,
      trans: (EXAM_CACHE.trans && EXAM_CACHE.trans.length) || CATEGORY_META.trans.defaultCount,
      writing: (EXAM_CACHE.writing && EXAM_CACHE.writing.length) || CATEGORY_META.writing.defaultCount,
      suite: (EXAM_CACHE.suite && EXAM_CACHE.suite.length) || CATEGORY_META.suite.defaultCount
    };

    var doneCounts = {
      cloze: 0,
      reading: 0,
      newtype: 0,
      trans: 0,
      writing: 0,
      suite: 0
    };

    // 同时考量独立长难句工坊 (translate.html) 的掌握记录 (kaoyan_trans_done)
    var transDoneSet = new Set();
    try {
      var td = JSON.parse(localStorage.getItem('kaoyan_trans_done') || '[]');
      if (Array.isArray(td)) td.forEach(function (id) { transDoneSet.add(id); });
    } catch (e) {}

    Object.keys(examProgress).forEach(function (k) {
      var parts = k.split('-');
      var cat = parts[0];
      if (doneCounts[cat] !== undefined && examProgress[k].done) {
        doneCounts[cat]++;
      }
    });

    if (transDoneSet.size > 0) {
      doneCounts.trans = Math.max(doneCounts.trans, transDoneSet.size);
    }

    var setBadge = function (id, cat, unit) {
      var el = document.getElementById(id);
      if (el) {
        el.textContent = `${doneCounts[cat]} / ${counts[cat]} ${unit}`;
      }
    };

    setBadge('badge-cloze-count', 'cloze', '篇已学');
    setBadge('badge-reading-count', 'reading', '篇精读');
    setBadge('badge-newtype-count', 'newtype', '套大题');
    setBadge('badge-trans-count', 'trans', '篇精译');
    setBadge('badge-writing-count', 'writing', '篇范文');
    setBadge('badge-suite-count', 'suite', '套全卷');

    var totalSecsDone = (doneCounts.cloze > 0 ? 1 : 0) +
      (doneCounts.reading > 0 ? 1 : 0) +
      (doneCounts.newtype > 0 ? 1 : 0) +
      (doneCounts.trans > 0 ? 1 : 0) +
      (doneCounts.writing > 0 ? 1 : 0) +
      (doneCounts.suite > 0 ? 1 : 0);

    var pct = Math.round((totalSecsDone / 6) * 100);
    var progBar = document.getElementById('exam-overall-prog-bar');
    if (progBar) progBar.style.width = pct + '%';
    var progSub = document.getElementById('exam-prog-sub-text');
    if (progSub) progSub.textContent = `已学习 ${totalSecsDone} / 6 大题型 · 总分 100 分大纲`;
    var doneBadge = document.getElementById('exam-done-badge');
    if (doneBadge) doneBadge.textContent = `进度 ${pct}%`;
    var headerBadge = document.getElementById('header-exam-progress-badge');
    if (headerBadge) headerBadge.textContent = `100分大纲 · ${totalSecsDone}/6 已学`;
  }

  // --- 2. 第二级题目列表页渲染 ---
  function renderProblemList(cat) {
    currentCategory = cat;
    var meta = CATEGORY_META[cat] || CATEGORY_META.reading;

    var titleEl = document.getElementById('exam-list-header-title');
    if (titleEl) titleEl.textContent = `${meta.icon} ${meta.name}`;

    var catBannerTitle = document.getElementById('cat-banner-title');
    var catBannerScore = document.getElementById('cat-banner-score');
    var catBannerDesc = document.getElementById('cat-banner-desc');
    var catBannerStat = document.getElementById('cat-banner-stat');

    if (catBannerTitle) catBannerTitle.textContent = meta.name;
    if (catBannerScore) catBannerScore.textContent = meta.score;
    if (catBannerDesc) catBannerDesc.textContent = meta.desc;

    var container = document.getElementById('exam-problem-items-container');
    if (!container) return;

    // 按需加载对应题型数据
    loadCategoryData(cat, function (err, items) {
      if (err && (!items || !items.length)) return;

      var countBadge = document.getElementById('exam-list-count-badge');
      if (countBadge) countBadge.textContent = `${items.length} 题/篇`;

      var doneCount = 0;
      var transDoneSet = new Set();
      if (cat === 'trans') {
        try {
          var td = JSON.parse(localStorage.getItem('kaoyan_trans_done') || '[]');
          if (Array.isArray(td)) {
            td.forEach(function (id) {
              transDoneSet.add(id);
              transDoneSet.add(String(id));
            });
          }
        } catch (e) {}
      }

      var html = items.map(function (item, idx) {
        var key = `${cat}-${idx}`;
        var prog = examProgress[key] || {};
        var isDone = !!prog.done;

        if (cat === 'trans' && !isDone) {
          var sId = item.id || (idx + 1);
          if (transDoneSet.has(sId) || transDoneSet.has(String(sId)) || transDoneSet.has(idx + 1) || transDoneSet.has(String(idx + 1))) {
            isDone = true;
          }
        }
        if (isDone) doneCount++;

        var titleText = '';
        var descText = '';
        var numLabel = '';

        if (cat === 'trans') {
          titleText = item.title || item.source || ('学术长难句 第 ' + (idx + 1) + ' 句');
          descText = item.source ? (item.source + (item.theme ? ' · ' + item.theme : '')) : (item.theme || item.desc || (item.zh ? item.zh.slice(0, 35) + '...' : '考研长难句精译'));
          numLabel = `${idx + 1}`;
        } else if (cat === 'writing') {
          titleText = item.title || (item.year ? item.year + '年 ' + meta.name : '范文第 ' + (idx + 1) + ' 篇');
          descText = item.picture_desc || item.task_prompt || item.prompt || item.desc || '考研真题写作范文研读与仿写模练';
          numLabel = item.year ? `${item.year}` : `W${idx + 1}`;
        } else {
          titleText = item.title || (item.year ? item.year + '年 ' + meta.name : '真题第 ' + (idx + 1) + ' 篇');
          descText = item.desc || item.topic || '历年全真试题精析与考点训练';
          numLabel = item.year ? `${item.year}` : `P${idx + 1}`;
        }

        var statusBadge = isDone
          ? `<span class="exam-status-badge done">✓ 已完成 ${prog.score ? '· ' + prog.score + '分' : ''}</span>`
          : `<span class="exam-status-badge undone">未作答</span>`;

        return `
          <a class="exam-problem-item" href="#detail/${cat}/${idx}">
            <div class="epi-left">
              <span class="epi-num">${numLabel}</span>
              <div class="epi-info">
                <span class="epi-title">${esc(titleText)}</span>
                <span class="epi-desc">${esc(descText)}</span>
              </div>
            </div>
            <div class="epi-right">
              ${statusBadge}
              <span class="sni-arrow">›</span>
            </div>
          </a>
        `;
      }).join('');

      container.innerHTML = html || '<div class="empty-tip" style="padding:30px;text-align:center;color:var(--color-text-muted)">此题型暂无题目数据</div>';
      if (catBannerStat) catBannerStat.textContent = `完成进度：${doneCount} / ${items.length} 篇 (${items.length ? Math.round(doneCount/items.length*100) : 0}%)`;
    });
  }

  // --- 3. 第三级答题详情页渲染 ---
  function renderDetail(cat, idxStr) {
    currentCategory = cat;
    var idx = parseInt(idxStr, 10) || 0;
    currentItemId = idx;

    var box = document.getElementById('exam-detail-content-box');
    var meta = CATEGORY_META[cat] || CATEGORY_META.reading;

    // 若尚未加载该分类，显示详情页 Loading 状态
    if (!EXAM_CACHE[cat] && box) {
      box.innerHTML = `
        <div class="exam-loading-box" style="text-align:center;padding:50px 16px;color:var(--color-text-muted)">
          <div class="exam-spinner" style="font-size:32px;display:inline-block;animation:kySpin 1s linear infinite">🔄</div>
          <div style="font-size:14px;font-weight:700;color:var(--color-text);margin-top:14px">正在加载【${esc(meta.name)}】题目详情...</div>
        </div>
      `;
    }

    loadCategoryData(cat, function (err, items) {
      if (err || !items || !items.length) {
        if (box) {
          box.innerHTML = `
            <div style="text-align:center;padding:40px 16px">
              <div style="font-size:30px;margin-bottom:8px">⚠️</div>
              <div style="font-size:14px;font-weight:700;color:var(--color-text)">【${esc(meta.name)}】题目数据加载遇到问题</div>
              <p style="font-size:12px;color:var(--color-text-muted);margin:6px 0 16px">${esc((err && err.message) || '本地题库文件未找到或数据为空')}</p>
              <button class="nav-btn primary" id="exam-detail-retry-btn" type="button" style="padding:8px 20px;border-radius:999px">重新加载</button>
            </div>
          `;
          var rBtn = document.getElementById('exam-detail-retry-btn');
          if (rBtn) {
            rBtn.onclick = function () {
              renderDetail(cat, idxStr);
            };
          }
        }
        return;
      }

      idx = Math.min(Math.max(0, idx), items.length - 1);
      currentItemId = idx;

      var cur = items[idx];
      var meta = CATEGORY_META[cat] || CATEGORY_META.reading;

      // Header updates: 显示具体题型辨识度标题
      var titleEl = document.getElementById('exam-detail-header-title');
      var displayTitle = '';
      if (cat === 'trans') {
        displayTitle = cur.source ? (cur.source.replace('考研英语(一) ', '') + ' · ' + (cur.title || '长难句')) : ('学术长难句 第 ' + (idx + 1) + ' 句');
      } else if (cur.text_id) {
        displayTitle = (cur.year ? cur.year + '年 ' : '') + cur.text_id;
      } else if (cat === 'writing' && cur.title) {
        displayTitle = (cur.year ? cur.year + ' ' : '') + cur.title;
      } else if (cat === 'suite') {
        displayTitle = (cur.year ? cur.year + '年 ' : '') + '真题全卷';
      } else if (cur.year) {
        displayTitle = cur.year + '年 ' + meta.name;
      } else {
        displayTitle = `${meta.name} 第 ${idx + 1} 题`;
      }
      if (titleEl) {
        titleEl.textContent = displayTitle;
      }

      function updateDetailStatusPill(isDone, score) {
        var statusPill = document.getElementById('exam-detail-status-pill');
        if (statusPill) {
          statusPill.className = 'exam-status-badge ' + (isDone ? 'done' : 'undone');
          statusPill.textContent = isDone ? ('✓ 已完成' + (score !== undefined && score !== null ? ' · ' + score + '分' : '')) : '未作答';
        }
      }

      var key = `${cat}-${idx}`;
      var prog = examProgress[key] || {};
      if (cat === 'trans' && !prog.done) {
        try {
          var tdArr = JSON.parse(localStorage.getItem('kaoyan_trans_done') || '[]');
          if (Array.isArray(tdArr)) {
            var sId = cur.id || (idx + 1);
            if (tdArr.indexOf(sId) !== -1 || tdArr.indexOf(String(sId)) !== -1 || (cur.num && tdArr.indexOf(cur.num) !== -1) || tdArr.indexOf(idx + 1) !== -1 || tdArr.indexOf(String(idx + 1)) !== -1) {
              prog.done = true;
            }
          }
        } catch (e) {}
      }
      var isDone = !!prog.done;

      updateDetailStatusPill(isDone, prog.score);

      // Prev / Next Navigation buttons
      var prevBtn = document.getElementById('exam-prev-btn');
      var nextBtn = document.getElementById('exam-next-btn');
      var counterEl = document.getElementById('exam-item-counter');

      if (counterEl) {
        counterEl.textContent = `第 ${idx + 1} / ${items.length} ${cat === 'suite' ? '套' : '篇'}`;
      }

      if (prevBtn) {
        prevBtn.disabled = idx <= 0;
        prevBtn.onclick = function () {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          if (idx > 0) location.hash = `#detail/${cat}/${idx - 1}`;
        };
      }

      if (nextBtn) {
        nextBtn.disabled = idx >= items.length - 1;
        nextBtn.onclick = function () {
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          if (idx < items.length - 1) location.hash = `#detail/${cat}/${idx + 1}`;
        };
      }

      if (!box) return;

      if (cat === 'reading') renderReadingDetail(box, cur, key, prog, idx);
      else if (cat === 'cloze') renderClozeDetail(box, cur, key, prog, idx);
      else if (cat === 'newtype') renderNewTypeDetail(box, cur, key, prog, idx);
      else if (cat === 'trans') renderTransDetail(box, cur, key, prog, idx);
      else if (cat === 'writing') renderWritingDetail(box, cur, key, prog, idx);
      else if (cat === 'suite') renderSuiteDetail(box, cur, key, prog, idx);

      bindWordLookup(box);
    });
  }

  // --- A. Reading Detail ---
  function renderReadingDetail(box, cur, key, prog) {
    var questions = cur.questions || [];
    var savedAnswers = prog.answers || {};

    var contentText = cur.content || cur.text || '';

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">📖 ${cur.year || 2024} ${cur.text_id || 'Text 1'} 考研全真精读</span>
          <button class="audio-btn" id="reading-speak-btn" type="button" title="朗读全篇短文" style="font-size:12px;padding:3px 8px">🔊 朗读全文</button>
        </div>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13.5px;line-height:1.75;color:var(--color-text);background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border);user-select:text">
          ${contentText ? esc(contentText).replace(/\n\s*\n/g, '<br><br>').replace(/\n/g, '<br><br>') : ''}
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">📝 唐迟逻辑选择题实战（点击选项作答）</h3>
        <div class="reading-questions-list">
          ${questions.map(function (q, qIdx) {
            var userAns = savedAnswers[qIdx] || '';
            var isSubmitted = !!prog.done;
            var qAnswer = q.answer;
            if (!qAnswer && Array.isArray(q.options)) {
              var correctOpt = q.options.find(function (o) { return o && o.correct; });
              if (correctOpt) {
                qAnswer = correctOpt.label || (typeof correctOpt === 'string' ? correctOpt.trim().charAt(0) : 'A');
              }
            }

            return `
              <div class="q-item-card" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:12px 14px;margin-bottom:12px">
                <div style="font-weight:700;font-size:13.5px;color:var(--color-text);margin-bottom:8px">
                  ${q.num || (qIdx + 1)}. ${esc(q.stem || '')}
                </div>
                <div class="q-options" style="display:flex;flex-direction:column;gap:6px">
                  ${(q.options || []).map(function (opt) {
                    var optLetter = typeof opt === 'string' ? opt.trim().charAt(0) : (opt.label || 'A');
                    var optText = typeof opt === 'string' ? opt : `${opt.label}. ${opt.text}`;
                    var isSelected = (userAns === optLetter);
                    var isCorrect = (optLetter === qAnswer);
                    var optClass = 'filter-chip';
                    var optStyle = 'text-align:left;font-size:12.5px;padding:8px 12px;border-radius:8px';
                    if (isSelected) optClass += ' active';
                    if (isSubmitted) {
                      if (isCorrect) {
                        optStyle += ';border-color:#10b981;background:rgba(16,185,129,0.15);color:#10b981;font-weight:700';
                      } else if (isSelected && !isCorrect) {
                        optStyle += ';border-color:#ef4444;background:rgba(239,68,68,0.15);color:#ef4444';
                      }
                    }
                    return `
                      <button class="${optClass}" data-q-idx="${qIdx}" data-opt="${optLetter}" type="button" style="${optStyle}">
                        ${esc(optText)}
                      </button>
                    `;
                  }).join('')}
                </div>
                <div class="q-analysis-box" id="analysis-${qIdx}" style="${isSubmitted ? 'display:block' : 'display:none'};margin-top:10px;font-size:12px;line-height:1.6;color:var(--color-text-muted);background:var(--color-surface-offset);padding:8px 12px;border-radius:8px;border-left:3px solid var(--color-primary)">
                  <strong style="color:var(--color-primary)">正解：${qAnswer || 'A'}</strong> | ${esc(q.analysis || '同义替换法排除干扰项。')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="reading-submit-btn" type="button" style="padding:10px 24px;border-radius:999px">
            ${prog.done ? '✓ 已提交（点击重新评分）' : '🚀 提交本篇阅读答案并核对'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    // Bind speak
    var speakBtn = document.getElementById('reading-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(cur.content || cur.text, speakBtn); };

    // Bind option selections (未交卷时直接切换样式，避免 DOM 整体重绘导致页面滚动跳顶)
    box.querySelectorAll('.q-options button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qIdx = this.getAttribute('data-q-idx');
        var opt = this.getAttribute('data-opt');
        savedAnswers[qIdx] = opt;
        saveExamProgress(key, { answers: savedAnswers });

        if (prog.done) {
          renderReadingDetail(box, cur, key, examProgress[key] || {}, idx);
        } else {
          var parent = this.closest('.q-options');
          if (parent) {
            parent.querySelectorAll('button').forEach(function (b) {
              b.classList.toggle('active', b.getAttribute('data-opt') === opt);
            });
          }
        }
      });
    });

    // Submit handler
    var submitBtn = document.getElementById('reading-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var score = 0;
        questions.forEach(function (q, qIdx) {
          var qAns = q.answer;
          if (!qAns && Array.isArray(q.options)) {
            var co = q.options.find(function (o) { return o && o.correct; });
            if (co) qAns = co.label || (typeof co === 'string' ? co.trim().charAt(0) : 'A');
          }
          if (savedAnswers[qIdx] === qAns) score += 2;
        });
        saveExamProgress(key, { done: true, score: score, answers: savedAnswers });
        updateDetailStatusPill(true, score);
        renderReadingDetail(box, cur, key, examProgress[key], idx);
        if (window.KaoyanToast) window.KaoyanToast(`阅读已提交！得分：${score} / ${questions.length * 2} 分`);
      });
    }
  }

  // --- B. Cloze Detail ---
  function renderClozeDetail(box, cur, key, prog) {
    var questions = cur.questions || cur.blanks || [];
    var savedAnswers = prog.answers || {};

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🧩 ${cur.year || 2024} 完形填空真题实战</span>
          <button class="audio-btn" id="cloze-speak-btn" type="button" title="朗读全篇短文" style="font-size:12px;padding:3px 8px">🔊 朗读全文</button>
        </div>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13.5px;line-height:1.75;color:var(--color-text);background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border)">
          ${cur.text ? esc(cur.text).replace(/\n\s*\n/g, '<br><br>').replace(/\n/g, '<br><br>') : ''}
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">🎯 完形选项精解</h3>
        <div class="cloze-questions-list">
          ${questions.map(function (q, qIdx) {
            var userAns = savedAnswers[qIdx] || '';
            var isSubmitted = !!prog.done;
            var qNum = q.num || q.blank_num || (qIdx + 1);
            var qAnswer = q.answer;
            if (!qAnswer && Array.isArray(q.options)) {
              var correctOpt = q.options.find(function (o) { return o && o.correct; });
              if (correctOpt) {
                qAnswer = correctOpt.label || (typeof correctOpt === 'string' ? correctOpt.trim().charAt(0) : 'A');
              }
            }

            return `
              <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:12px 14px;margin-bottom:10px">
                <div style="font-weight:700;font-size:13px;margin-bottom:6px">【第 ${qNum} 空】</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${(q.options || []).map(function (opt) {
                    var optLetter = typeof opt === 'string' ? opt.trim().charAt(0) : (opt.label || 'A');
                    var optText = typeof opt === 'string' ? opt : `${opt.label}. ${opt.text}`;
                    var isSelected = (userAns === optLetter);
                    var isCorrect = (optLetter === qAnswer);
                    var optClass = 'filter-chip';
                    var optStyle = 'flex:1;min-width:110px';
                    if (isSelected) optClass += ' active';
                    if (isSubmitted) {
                      if (isCorrect) {
                        optStyle += ';border-color:#10b981;background:rgba(16,185,129,0.15);color:#10b981;font-weight:700';
                      } else if (isSelected && !isCorrect) {
                        optStyle += ';border-color:#ef4444;background:rgba(239,68,68,0.15);color:#ef4444';
                      }
                    }
                    return `
                      <button class="${optClass}" data-cloze-q="${qIdx}" data-opt="${optLetter}" type="button" style="${optStyle}">
                        ${esc(optText)}
                      </button>
                    `;
                  }).join('')}
                </div>
                <div id="cloze-ans-${qIdx}" style="${isSubmitted ? 'display:block' : 'display:none'};margin-top:8px;font-size:12px;background:var(--color-surface-offset);padding:8px;border-radius:6px;color:var(--color-primary)">
                  <strong style="color:var(--color-primary)">正解：${qAnswer || 'A'}</strong> | ${esc(q.analysis || '根据上下文逻辑线索推导。')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:14px;text-align:center">
          <button class="nav-btn primary" id="cloze-submit-btn" type="button" style="padding:10px 24px;border-radius:999px">
            ${prog.done ? '✓ 已交卷（查看解析）' : '🚀 提交完形答卷并查看红花词'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var speakBtn = document.getElementById('cloze-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(cur.text, speakBtn); };

    // Bind option selections (未交卷时直接切换样式，避免完形 20 空页面跳顶抖动)
    box.querySelectorAll('.cloze-questions-list button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qIdx = this.getAttribute('data-cloze-q');
        var opt = this.getAttribute('data-opt');
        savedAnswers[qIdx] = opt;
        saveExamProgress(key, { answers: savedAnswers });

        if (prog.done) {
          renderClozeDetail(box, cur, key, examProgress[key] || {}, idx);
        } else {
          var parent = this.parentElement;
          if (parent) {
            parent.querySelectorAll('button').forEach(function (b) {
              b.classList.toggle('active', b.getAttribute('data-opt') === opt);
            });
          }
        }
      });
    });

    var submitBtn = document.getElementById('cloze-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var score = 0;
        questions.forEach(function (q, qIdx) {
          var qAns = q.answer;
          if (!qAns && Array.isArray(q.options)) {
            var co = q.options.find(function (o) { return o && o.correct; });
            if (co) qAns = co.label || (typeof co === 'string' ? co.trim().charAt(0) : 'A');
          }
          if (savedAnswers[qIdx] === qAns) score += 0.5;
        });
        saveExamProgress(key, { done: true, score: score, answers: savedAnswers });
        updateDetailStatusPill(true, score);
        renderClozeDetail(box, cur, key, examProgress[key], idx);
        if (window.KaoyanToast) window.KaoyanToast(`完形已交卷！得分：${score} / ${questions.length * 0.5} 分`);
      });
    }
  }

  // --- C. NewType Detail ---
  function renderNewTypeDetail(box, cur, key, prog, idx) {
    var paras = cur.paragraphs || [];
    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🎯 ${cur.year || 2024} ${cur.type || '新题型'}</span>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <p style="font-size:12.5px;color:var(--color-text-muted)">解题密码：代词指代链 + 冠词与逻辑连接词前后咬合。</p>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">🧩 语篇段落与线索链拆解</h3>
        ${paras.map(function (p) {
          var pText = p.text || '';
          return `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <strong style="color:var(--color-primary);font-size:13px">【段落 ${p.id}】</strong>
                <button class="audio-btn" data-speak-p="${encodeURIComponent(pText)}" type="button" style="font-size:11px;padding:2px 6px">🔊 朗读此段</button>
              </div>
              <div style="font-size:13px;line-height:1.6;color:var(--color-text)">${esc(pText)}</div>
              ${p.clue ? `<div style="font-size:11.5px;color:var(--color-accent);margin-top:6px">💡 线索点：${esc(p.clue)}</div>` : ''}
            </div>
          `;
        }).join('')}

        <div style="background:var(--color-surface-offset);padding:12px 14px;border-radius:8px;margin-top:14px">
          <strong style="font-size:13px;color:var(--color-text)">官方逻辑排序 / 匹配正解：</strong>
          <div style="font-size:14px;font-weight:700;color:var(--color-primary);margin:4px 0">${(cur.correct_order || []).join(' ➔ ')}</div>
          <p style="font-size:12px;color:var(--color-text-muted);margin:4px 0 0">${esc(cur.analysis || '抓住主题代词复现，锁定篇章逻辑。')}</p>
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="newtype-done-btn" type="button" style="padding:8px 20px;border-radius:999px${prog.done ? ';background:#10b981;border-color:#10b981' : ''}">
            ${prog.done ? '✓ 本套新题型已攻克' : '标记已掌握解题逻辑'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    box.querySelectorAll('[data-speak-p]').forEach(function (btn) {
      btn.onclick = function () { speak(decodeURIComponent(btn.getAttribute('data-speak-p')), btn); };
    });

    var doneBtn = document.getElementById('newtype-done-btn');
    if (doneBtn) {
      doneBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        updateDetailStatusPill(true);
        doneBtn.textContent = '✓ 本套新题型已攻克！';
        doneBtn.style.background = '#10b981';
        doneBtn.style.borderColor = '#10b981';
        if (window.KaoyanToast) window.KaoyanToast('✓ 已攻克本套新题型解题逻辑！');
      };
    }
  }

  // --- D. Translation Detail ---
  function renderTransDetail(box, cur, key, prog, idx) {
    var enText = cur.en || cur.sentence_en || '';
    var zhText = cur.zh || cur.translation || '';
    var sId = cur.id || cur.num || ((idx !== undefined ? idx : currentItemId) + 1);

    var chunksHtml = '';
    if (cur.chunks && Array.isArray(cur.chunks) && cur.chunks.length) {
      chunksHtml = `
        <div style="margin-top:12px">
          <strong style="color:var(--color-primary);font-size:13px">【五步分层拆分意群】</strong>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            ${cur.chunks.map(function (c) {
              return `
                <div style="background:var(--color-surface);border:1px solid var(--color-border);padding:8px 10px;border-radius:6px;font-size:12.5px">
                  <div style="font-weight:600;color:var(--color-text)">${esc(c.en)}</div>
                  <div style="color:var(--color-text-muted);font-size:12px;margin-top:2px">${esc(c.zh)} <span style="opacity:0.75;font-size:11px">(${esc(c.role || '')})</span></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    var grammarHtml = '';
    if (cur.grammar_points && Array.isArray(cur.grammar_points) && cur.grammar_points.length) {
      grammarHtml = `
        <div style="margin-top:12px">
          <strong style="color:var(--color-primary);font-size:13px">【核心语法与考点拆解】</strong>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
            ${cur.grammar_points.map(function (gp) {
              return `
                <div style="background:var(--color-surface);border:1px solid var(--color-border);border-left:3px solid var(--color-accent);padding:8px 12px;border-radius:6px;font-size:12.5px">
                  <div style="font-weight:700;color:var(--color-text);margin-bottom:2px">
                    <span class="filter-chip active" style="font-size:11px;padding:2px 6px;margin-right:4px">${esc(gp.type || '句法考点')}</span>
                    ${esc(gp.title || '')}
                  </div>
                  <div style="color:var(--color-text-muted);line-height:1.5">${esc(gp.desc || '')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    var vocabHtml = '';
    if (cur.key_vocab && Array.isArray(cur.key_vocab) && cur.key_vocab.length) {
      vocabHtml = `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--color-border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <strong style="color:var(--color-primary);font-size:13px">【核心词汇与语境释义】</strong>
            <span style="font-size:11px;color:var(--color-text-muted)">（点击单词卡查完整释义）</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${cur.key_vocab.map(function (kv) {
              return `
                <button class="filter-chip active word-quick-chip" type="button" data-word="${esc(kv.word)}" data-pos="${esc(kv.pos || '')}" data-zh="${esc(kv.contextual_zh || kv.literal || '')}" style="font-size:12px;padding:4px 10px;cursor:pointer">
                  <strong>${esc(kv.word)}</strong>
                  <i style="opacity:0.8">${esc(kv.pos || '')}</i>
                  <span>${esc(kv.contextual_zh || kv.literal || '')}</span>
                  ${kv.tip ? `<span style="opacity:0.75;font-size:10.5px">(${esc(kv.tip)})</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    var flawHtml = '';
    if (cur.literal_flaw && cur.literal_flaw.bad) {
      flawHtml = `
        <div style="margin-top:12px;background:rgba(239,68,68,0.06);border:1px dashed rgba(239,68,68,0.4);padding:10px 12px;border-radius:8px;font-size:12.5px">
          <div style="color:#ef4444;font-weight:700;margin-bottom:4px">⚠️ 考场生硬直译警示：</div>
          <div style="color:var(--color-text);text-decoration:line-through;opacity:0.85;margin-bottom:4px">“${esc(cur.literal_flaw.bad)}”</div>
          <div style="color:var(--color-text-muted);font-size:12px;line-height:1.5">💡 润色避坑：${esc(cur.literal_flaw.reason || '')}</div>
        </div>
      `;
    }

    var rubricHtml = '';
    if (cur.scoring_rubric && Array.isArray(cur.scoring_rubric) && cur.scoring_rubric.length) {
      rubricHtml = `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--color-border)">
          <strong style="color:var(--color-primary);font-size:13px">【考场阅卷给分点剖析 (满分2分)】</strong>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
            ${cur.scoring_rubric.map(function (sr) {
              return `
                <div style="background:var(--color-surface);border:1px solid var(--color-border);padding:6px 10px;border-radius:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:8px">
                  <div style="flex:1;color:var(--color-text)">
                    <code style="font-family:var(--font-sans);font-weight:600;color:var(--color-primary)">${esc(sr.point)}</code>
                    <div style="color:var(--color-text-muted);margin-top:2px">${esc(sr.desc)}</div>
                  </div>
                  <span class="exam-status-badge done" style="white-space:nowrap;font-size:11px">${esc(sr.score)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    var difficultyStars = cur.difficulty ? ' · ' + '⭐'.repeat(cur.difficulty) : '';

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🌐 ${esc(cur.source || '考研英语(一) 翻译真题')} · ${esc(cur.theme || '学术精译')}${difficultyStars}</span>
        <h2 style="font-size:16px;margin:6px 0 10px;color:var(--color-text)">${esc(cur.title || ('第 ' + sId + ' 句学术长难句精读'))}</h2>
        <div style="font-size:14px;line-height:1.75;background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border);color:var(--color-text);font-family:var(--font-sans);user-select:text">
          ${esc(enText)}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button class="audio-btn" id="trans-speak-btn" type="button" style="font-size:12px;padding:4px 10px">🔊 朗读原句</button>
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 10px;color:var(--color-text)">🎯 田静五步句法拆解与官方规范译文</h3>
        <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px;margin-bottom:12px">
          <strong style="color:var(--color-primary);font-size:13px">【中文标准规范译文】</strong>
          <p style="font-size:13.5px;color:var(--color-text);margin:6px 0 0;line-height:1.6">${esc(zhText)}</p>
        </div>

        ${chunksHtml}
        ${grammarHtml}
        ${vocabHtml}
        ${flawHtml}
        ${rubricHtml}

        <div style="background:var(--color-surface-offset);border-left:3px solid var(--color-primary);padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.6;color:var(--color-text);margin-top:12px">
          ${esc(cur.analysis || '主干为主谓宾结构，从句进行后置定语修饰。')}
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="trans-done-btn" type="button" style="padding:8px 20px;border-radius:999px${prog.done ? ';background:#10b981;border-color:#10b981' : ''}">
            ${prog.done ? '✓ 本句已掌握' : '标记本句已熟读掌握'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var speakBtn = document.getElementById('trans-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(enText, speakBtn); };

    var doneBtn = document.getElementById('trans-done-btn');
    if (doneBtn) {
      doneBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        updateDetailStatusPill(true);
        doneBtn.textContent = '✓ 本句已掌握！';
        doneBtn.style.background = '#10b981';
        doneBtn.style.borderColor = '#10b981';
        try {
          var tdArr = JSON.parse(localStorage.getItem('kaoyan_trans_done') || '[]');
          if (Array.isArray(tdArr)) {
            var itemsToAdd = [sId, cur.id, cur.num].filter(Boolean);
            itemsToAdd.forEach(function (val) {
              if (tdArr.indexOf(val) === -1) tdArr.push(val);
            });
            localStorage.setItem('kaoyan_trans_done', JSON.stringify(tdArr));
          }
        } catch (e) {}
        if (window.KaoyanToast) window.KaoyanToast('✓ 本句学术长难句已熟读掌握！');
      };
    }
  }

  // --- E. Writing Detail (Part A & B) ---
  function renderWritingDetail(box, cur, key, prog, idx) {
    var raw = cur.raw || cur;
    var isPartB = cur.subType === 'b' || !!(raw.picture_desc || raw.theme || (cur.title && cur.title.indexOf('大作文') !== -1));
    var draftKey = 'kao_writing_draft_' + (cur.id || key);
    var savedDraft = localStorage.getItem(draftKey) || '';

    var promptDesc = raw.picture_desc || raw.task_prompt || raw.prompt || cur.desc || '考研真题写作范文研读与仿写模练';
    var modelText = raw.model_essay || raw.model_letter || cur.model_essay || cur.model_letter || '范文收集中...';
    var modelTrans = raw.model_translation || cur.model_translation;
    if (!modelTrans && raw.paragraphs && Array.isArray(raw.paragraphs)) {
      modelTrans = raw.paragraphs.map(function (p) {
        return (p.sentences || []).map(function (s) { return s.zh; }).join('');
      }).filter(Boolean).join('\n\n');
    }
    if (!modelTrans) modelTrans = '参考译文已备妥。';

    var vocabHtml = '';
    if (raw.key_vocab && Array.isArray(raw.key_vocab) && raw.key_vocab.length) {
      vocabHtml = `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--color-border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:12px;font-weight:700;color:var(--color-primary)">💡 核心亮点词汇</span>
            <span style="font-size:11px;color:var(--color-text-muted)">（点击查词/收藏）</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${raw.key_vocab.map(function (kv) {
              return `<button class="filter-chip active word-quick-chip" type="button" data-word="${esc(kv.word)}" data-pos="${esc(kv.pos || '')}" data-zh="${esc(kv.zh || '')}" style="font-size:11.5px;padding:3px 8px;cursor:pointer">${esc(kv.word)} <i style="opacity:0.8">${esc(kv.pos || '')}</i> ${esc(kv.zh || '')}</button>`;
            }).join('')}
          </div>
        </div>
      `;
    } else if (raw.key_phrases && Array.isArray(raw.key_phrases) && raw.key_phrases.length) {
      vocabHtml = `
        <div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--color-border)">
          <div style="font-size:12px;font-weight:700;color:var(--color-primary)">💡 核心亮点表达</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${raw.key_phrases.map(function (kp) {
              return `<span class="filter-chip active" style="font-size:11.5px;padding:3px 8px">${esc(kp)}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">✍️ ${cur.year || 2024} ${isPartB ? '图画大作文 (Part B · 20分)' : '应用小作文 (Part A · 10分)'}</span>
        <h2 style="font-size:16px;margin:6px 0 8px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13px;color:var(--color-text-muted);background:var(--color-surface-offset);padding:10px 12px;border-radius:8px;border:1px solid var(--color-border);line-height:1.55">
          ${esc(promptDesc)}
        </div>
      </div>

      <div class="exam-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h3 style="font-size:15px;margin:0;color:var(--color-text)">📜 潘赟名师满分范文</h3>
          <div style="display:flex;gap:6px">
            <button class="audio-btn" id="writing-speak-btn" type="button" style="font-size:12px;padding:3px 8px">🔊 朗读范文</button>
            <button class="filter-chip" id="writing-toggle-trans-btn" type="button" style="font-size:12px;padding:3px 8px">中英对照</button>
          </div>
        </div>

        <div id="writing-model-box" style="font-size:13.5px;line-height:1.75;background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border);color:var(--color-text)">
          ${esc(modelText).replace(/\n\s*\n/g, '<br><br>').replace(/\n/g, '<br>')}
        </div>

        <div id="writing-trans-box" style="display:none;margin-top:10px;font-size:13px;line-height:1.6;color:var(--color-text-muted);background:var(--color-surface);padding:10px 14px;border-radius:8px;border:1px dashed var(--color-border)">
          ${esc(modelTrans).replace(/\n\s*\n/g, '<br><br>').replace(/\n/g, '<br>')}
        </div>

        ${vocabHtml}

        <div style="margin-top:16px">
          <h4 style="font-size:14px;margin:0 0 6px;color:var(--color-text)">✍️ 考场模写沙盒</h4>
          <textarea id="writing-sandbox-ta" placeholder="在此练习默写或仿写，内容实时自动保存在本地..." style="width:100%;height:140px;border-radius:8px;border:1px solid var(--color-border);background:var(--color-surface);padding:10px;font-size:13px;font-family:var(--font-sans);line-height:1.6;box-sizing:border-box;resize:vertical;color:var(--color-text)">${esc(savedDraft)}</textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span id="writing-wc" style="font-size:11.5px;color:var(--color-text-muted)">0 词</span>
            <button class="nav-btn primary" id="writing-save-btn" type="button" style="font-size:12px;padding:6px 14px${prog.done ? ';background:#10b981;border-color:#10b981' : ''}">${prog.done ? '✓ 写作草稿已打卡' : '保存草稿并打卡'}</button>
          </div>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var speakBtn = document.getElementById('writing-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(modelText, speakBtn); };

    var transToggleBtn = document.getElementById('writing-toggle-trans-btn');
    var transBox = document.getElementById('writing-trans-box');
    if (transToggleBtn && transBox) {
      transToggleBtn.onclick = function () {
        var isHidden = transBox.style.display === 'none';
        transBox.style.display = isHidden ? 'block' : 'none';
        transToggleBtn.classList.toggle('active', isHidden);
      };
    }

    var ta = document.getElementById('writing-sandbox-ta');
    var wc = document.getElementById('writing-wc');
    var updateWc = function () {
      var words = ((ta.value || '').trim().match(/[a-zA-Z0-9'-]+/g) || []).length;
      if (wc) wc.textContent = `${words} 词 · ${words >= (isPartB ? 160 : 80) ? '达到大纲字数 ✓' : '未达标'}`;
    };
    if (ta) {
      ta.addEventListener('input', function () {
        localStorage.setItem(draftKey, ta.value);
        updateWc();
      });
      updateWc();
    }

    var saveBtn = document.getElementById('writing-save-btn');
    if (saveBtn) {
      saveBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        updateDetailStatusPill(true);
        saveBtn.textContent = '✓ 写作草稿已打卡！';
        saveBtn.style.background = '#10b981';
        saveBtn.style.borderColor = '#10b981';
        if (window.KaoyanToast) window.KaoyanToast('✓ 考场写作草稿已保存打卡！');
      };
    }
  }

  // --- F. Suite Detail ---
  function renderSuiteDetail(box, cur, key, prog) {
    var y = cur.year;
    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">📚 ${y} 年全国统考英语（一）官方标准试卷</span>
        <h2 style="font-size:16px;margin:6px 0 10px;color:var(--color-text)">${y} 年真题全卷模拟与各板块全景实战</h2>
        <p style="font-size:12.5px;color:var(--color-text-muted);margin:0;line-height:1.6">
          考场标准答题时限：180 分钟。建议节奏：小作文(15m) ➔ 大作文(35m) ➔ 阅读A四篇(65m) ➔ 新题型(18m) ➔ 翻译(22m) ➔ 完形填空(15m) ➔ 检查涂卡(10m)。
        </p>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">🎯 ${y} 年各题型板块直达通道</h3>
        <div class="settings-list-group">
          <a class="settings-nav-item" href="#type/cloze">
            <div class="sni-left"><span class="sni-icon">🧩</span><div class="sni-info"><span class="sni-title">Section I · 完形填空 (10分)</span><span class="sni-desc">${y} 完形语篇与20道选项</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#type/reading">
            <div class="sni-left"><span class="sni-icon">📖</span><div class="sni-info"><span class="sni-title">Section II Part A · 传统阅读理解 (40分)</span><span class="sni-desc">${y} 4篇经典精读文章</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#type/newtype">
            <div class="sni-left"><span class="sni-icon">🎯</span><div class="sni-info"><span class="sni-title">Section II Part B · 阅读新题型 (10分)</span><span class="sni-desc">${y} 7选5/排序题</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#type/trans">
            <div class="sni-left"><span class="sni-icon">🌐</span><div class="sni-info"><span class="sni-title">Section II Part C · 翻译 (10分)</span><span class="sni-desc">${y} 5个学术长难句</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#type/writing">
            <div class="sni-left"><span class="sni-icon">✍️</span><div class="sni-info"><span class="sni-title">Section III · 作文 (30分)</span><span class="sni-desc">${y} 小作文告示 + 图画大作文</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="suite-done-btn" type="button" style="padding:10px 24px;border-radius:999px${prog.done ? ';background:#10b981;border-color:#10b981' : ''}">
            ${prog.done ? '✓ 已完成整卷模拟' : '标记为已完成该年度真题套卷'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var doneBtn = document.getElementById('suite-done-btn');
    if (doneBtn) {
      doneBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        updateDetailStatusPill(true);
        doneBtn.textContent = '✓ 已完成整卷模拟！';
        doneBtn.style.background = '#10b981';
        doneBtn.style.borderColor = '#10b981';
        if (window.KaoyanToast) window.KaoyanToast(`✓ ${y} 年真题全卷模拟已打卡！`);
      };
    }
  }

  // --- 4. 路由状态机与视图切换 ---
  var currentExamDepth = 1;
  function getExamRouteDepth(hash) {
    if (!hash || hash === 'home') return 1;
    var parts = hash.split('/');
    if (parts[0] === 'type') return 2;
    if (parts[0] === 'detail') return 3;
    return 1;
  }

  function switchView(viewId, isBack) {
    document.querySelectorAll('.tier-view').forEach(function (v) {
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

  function handleHashRoute() {
    var modal = document.getElementById('exam-word-modal');
    if (modal && modal.style.display !== 'none') {
      modal.style.display = 'none';
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    var hash = location.hash.replace(/^#\/?/, '').trim();
    var newDepth = getExamRouteDepth(hash);
    var isBack = newDepth < currentExamDepth;
    currentExamDepth = newDepth;

    if (!hash || hash === 'home') {
      switchView('exam-view-home', isBack);
      renderHomeStats();
      return;
    }

    var parts = hash.split('/');
    var route = parts[0];
    var p1 = parts[1];
    var p2 = parts[2];

    if (route === 'type') {
      switchView('exam-view-list', isBack);
      renderProblemList(p1 || 'reading');
    } else if (route === 'detail') {
      switchView('exam-view-detail', isBack);
      renderDetail(p1 || 'reading', p2 || '0');
    } else {
      switchView('exam-view-home', isBack);
      renderHomeStats();
    }
  }

  // --- 5. 返回按钮与导航绑定 ---
  function bindNavControls() {
    var listBackBtn = document.getElementById('exam-list-back-btn');
    if (listBackBtn) {
      listBackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = '#home';
      });
    }

    var detailBackBtn = document.getElementById('exam-detail-back-btn');
    if (detailBackBtn) {
      detailBackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        location.hash = '#type/' + currentCategory;
      });
    }

    window.addEventListener('hashchange', handleHashRoute);
  }

  // --- 6. 单词弹窗快查 (Universal Word Lookup) ---
  function bindWordLookup(root) {
    if (!root) return;
    root.querySelectorAll('.word-quick-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var word = btn.getAttribute('data-word');
        var pos = btn.getAttribute('data-pos');
        var zh = btn.getAttribute('data-zh');
        openWordModal(word, pos, zh);
      });
    });
  }

  function openWordModal(word, pos, zh) {
    var modal = document.getElementById('exam-word-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'exam-word-modal';
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadein 0.2s ease';
      document.body.appendChild(modal);
    }

    var isFav = false;
    try {
      var favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
      isFav = favs.indexOf(word) !== -1;
    } catch (e) {}

    modal.innerHTML = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:20px;max-width:380px;width:100%;box-shadow:var(--shadow-lg);position:relative">
        <button id="close-word-modal-btn" type="button" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--color-text-muted)">✕</button>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <h3 style="margin:0;font-size:18px;color:var(--color-text)">${esc(word)}</h3>
          <button id="modal-word-speak" type="button" class="audio-btn" style="width:28px;height:28px;font-size:12px" title="朗读单词">🔊</button>
        </div>
        <p style="font-size:13px;color:var(--color-primary);font-weight:600;margin:0 0 12px">
          ${pos ? `<i>${esc(pos)}</i> ` : ''}${esc(zh || '考研大纲核心词汇')}
        </p>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button id="modal-add-fav-btn" type="button" class="nav-btn" style="flex:1;font-size:12px;padding:8px">${isFav ? '✓ 已在生词本' : '⭐ 收藏到生词本'}</button>
          <a href="words.html#word/${encodeURIComponent(word)}" class="nav-btn primary" style="flex:1;text-align:center;font-size:12px;padding:8px;text-decoration:none;display:flex;align-items:center;justify-content:center">📚 词库完整释义</a>
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    document.getElementById('close-word-modal-btn').onclick = function () { modal.style.display = 'none'; };
    modal.onclick = function (e) { if (e.target === modal) modal.style.display = 'none'; };
    document.getElementById('modal-word-speak').onclick = function () { speak(word); };
    document.getElementById('modal-add-fav-btn').onclick = function () {
      try {
        var curFavs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
        var fIdx = curFavs.indexOf(word);
        if (fIdx === -1) {
          curFavs.push(word);
          localStorage.setItem('kao_quiz_favs', JSON.stringify(curFavs));
          this.textContent = '✓ 已收藏！';
          if (window.KaoyanToast) window.KaoyanToast(`已收藏【${word}】到专属生词本`);
        } else {
          curFavs.splice(fIdx, 1);
          localStorage.setItem('kao_quiz_favs', JSON.stringify(curFavs));
          this.textContent = '⭐ 收藏到生词本';
          if (window.KaoyanToast) window.KaoyanToast(`已从生词本移出【${word}】`);
        }
      } catch (e) {}
    };
  }

  // --- 初始化启动 ---
  function startEngine() {
    initData();
    bindNavControls();
    handleHashRoute();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEngine);
  } else {
    startEngine();
  }

})();
