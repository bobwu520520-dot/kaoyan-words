/* 考研英语一·翻译通关工坊交互引擎 (Translation Studio Engine v2.0)
   支持长难句 4 步认知拆解、双学习视图（分步闯关 / 全景精读）、
   语法主干一键透视、意群草稿拼装脚手架、2.0分阅卷采分点交互自评、
   全景题库目录抽屉、大纲词典无缝联动与字号缩放。 */
(function () {
  'use strict';

  var sentences = [];
  var filtered = [];
  var curIdx = 0;
  var curStep = 1;
  var activeTheme = 'all';
  var viewMode = 'steps'; // 'steps' or 'overview'
  var skeletonMode = false;
  var fontSize = 'md'; // 'sm', 'md', 'lg'

  // Persistence
  var drafts = {};
  var stars = new Set();
  var completed = new Set();
  var scores = {};

  try {
    drafts = JSON.parse(localStorage.getItem('kaoyan_trans_drafts') || '{}');
    var sArr = JSON.parse(localStorage.getItem('kaoyan_trans_stars') || '[]');
    if (Array.isArray(sArr)) stars = new Set(sArr);
    var cArr = JSON.parse(localStorage.getItem('kaoyan_trans_done') || '[]');
    if (Array.isArray(cArr)) completed = new Set(cArr);
    scores = JSON.parse(localStorage.getItem('kaoyan_trans_scores') || '{}');
    viewMode = localStorage.getItem('kaoyan_trans_view_mode') || 'steps';
    fontSize = localStorage.getItem('kaoyan_trans_font_size') || 'md';
  } catch (e) {}

  function saveState() {
    try {
      localStorage.setItem('kaoyan_trans_drafts', JSON.stringify(drafts));
      localStorage.setItem('kaoyan_trans_stars', JSON.stringify(Array.from(stars)));
      localStorage.setItem('kaoyan_trans_done', JSON.stringify(Array.from(completed)));
      localStorage.setItem('kaoyan_trans_scores', JSON.stringify(scores));
      localStorage.setItem('kaoyan_trans_view_mode', viewMode);
      localStorage.setItem('kaoyan_trans_font_size', fontSize);
    } catch (e) {}
  }

  // DOM Elements
  var mainLayout = document.getElementById('main');
  var themeChips = document.getElementById('theme-chips');
  var countPill = document.getElementById('trans-count-pill');
  var transCard = document.getElementById('trans-card');
  var prevBtn = document.getElementById('prev-trans');
  var nextBtn = document.getElementById('next-trans');
  var randomBtn = document.getElementById('random-trans');
  var starBtn = document.getElementById('star-trans');
  var speakSentenceBtn = document.getElementById('speak-sentence');
  var skeletonToggleBtn = document.getElementById('skeleton-toggle-btn');
  var viewModeToggle = document.getElementById('view-mode-toggle');
  var fontDecreaseBtn = document.getElementById('font-decrease-btn');
  var fontIncreaseBtn = document.getElementById('font-increase-btn');
  var drawerToggleBtn = document.getElementById('drawer-toggle-btn');
  var catalogDrawer = document.getElementById('catalog-drawer');
  var drawerBackdrop = document.getElementById('catalog-drawer-backdrop');
  var closeDrawerBtn = document.getElementById('close-drawer-btn');
  var drawerSearch = document.getElementById('drawer-search');
  var drawerList = document.getElementById('drawer-list');
  var masteryBadge = document.getElementById('mastery-badge');
  var drawerStatText = document.getElementById('drawer-stat-text');

  // Apply initial font size
  applyFontSize();

  // Load Data with dual fallback (window.__TRANSLATIONS_DATA__ / window.__TRANSLATIONS__ / fetch)
  function initData() {
    var tData = window.__TRANSLATIONS_DATA__ || window.__TRANSLATIONS__;
    if (tData && tData.sentences && tData.sentences.length) {
      sentences = tData.sentences;
      updateMasteryUI();
      applyFilter();
      return;
    }

    fetch('data/translations.json')
      .then(function (r) {
        if (!r.ok && r.status !== 0) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        sentences = data.sentences || [];
        updateMasteryUI();
        applyFilter();
      })
      .catch(function () {
        var tData2 = window.__TRANSLATIONS_DATA__ || window.__TRANSLATIONS__;
        if (tData2 && tData2.sentences && tData2.sentences.length) {
          sentences = tData2.sentences;
          updateMasteryUI();
          applyFilter();
        } else {
          showLoadError();
        }
      });
  }

  function showLoadError() {
    if (!transCard) return;
    transCard.innerHTML = '<div class="catalog-empty" style="padding:32px 16px;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:8px">🌐</div>' +
      '<h3 style="margin:0 0 8px;font-size:16px;color:var(--color-primary)">翻译语料加载提示</h3>' +
      '<p style="font-size:13.5px;color:var(--color-text-muted);max-width:480px;margin:0 auto 16px;line-height:1.6">若使用本地双击打开（<code>file://</code> 协议），浏览器可能会限制异步读取数据。建议点击下方重试，或通过本地 HTTP 服务器访问体验完整功能：</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        '<button class="home-btn primary" id="retry-trans-load-btn" type="button">🔄 重新加载语料</button>' +
        '<a class="home-btn" href="http://127.0.0.1:8000/translate.html" target="_blank">🌐 本地服务器访问</a>' +
      '</div>' +
    '</div>';
    var retryBtn = document.getElementById('retry-trans-load-btn');
    if (retryBtn) {
      retryBtn.onclick = function () {
        initData();
      };
    }
  }

  initData();

  function updateMasteryUI() {
    var doneCount = completed.size;
    if (masteryBadge) masteryBadge.textContent = doneCount + '/' + sentences.length;
    if (drawerStatText) drawerStatText.textContent = '已掌握 ' + doneCount + ' / ' + sentences.length + ' 篇学术真题精析';
  }

  function applyFontSize() {
    if (!mainLayout) return;
    mainLayout.classList.remove('font-sm', 'font-md', 'font-lg');
    mainLayout.classList.add('font-' + fontSize);
  }

  if (fontDecreaseBtn) {
    fontDecreaseBtn.onclick = function () {
      fontSize = fontSize === 'lg' ? 'md' : 'sm';
      applyFontSize();
      saveState();
    };
  }

  if (fontIncreaseBtn) {
    fontIncreaseBtn.onclick = function () {
      fontSize = fontSize === 'sm' ? 'md' : 'lg';
      applyFontSize();
      saveState();
    };
  }

  if (viewModeToggle) {
    updateViewModeBtn();
    viewModeToggle.onclick = function () {
      viewMode = viewMode === 'steps' ? 'overview' : 'steps';
      updateViewModeBtn();
      saveState();
      renderCurrent();
    };
  }

  var printBookletBtn = document.getElementById('print-booklet-btn');
  if (printBookletBtn) {
    printBookletBtn.onclick = function () {
      var prevMode = viewMode;
      viewMode = 'overview';
      updateViewModeBtn();
      renderCurrent();
      setTimeout(function () {
        window.print();
        if (prevMode !== 'overview') {
          viewMode = prevMode;
          updateViewModeBtn();
          renderCurrent();
        }
      }, 300);
    };
  }

  var toggleFilterBoxBtn = document.getElementById('toggle-filter-box-btn');
  var closeFilterBoxBtn = document.getElementById('close-filter-box-btn');
  var filterBox = document.getElementById('trans-collapsible-box');
  var filterArrow = document.getElementById('toggle-filter-arrow');

  function toggleFilterBox(show) {
    if (!filterBox) return;
    var willShow = typeof show === 'boolean' ? show : filterBox.hidden;
    filterBox.hidden = !willShow;
    if (toggleFilterBoxBtn) {
      toggleFilterBoxBtn.classList.toggle('active', willShow);
    }
    if (filterArrow) {
      filterArrow.textContent = willShow ? '🔼' : '🔽';
    }
  }

  if (toggleFilterBoxBtn) {
    toggleFilterBoxBtn.onclick = function () {
      toggleFilterBox();
    };
  }
  if (closeFilterBoxBtn) {
    closeFilterBoxBtn.onclick = function () {
      toggleFilterBox(false);
    };
  }

  function updateViewModeBtn() {
    if (!viewModeToggle) return;
    if (viewMode === 'overview') {
      viewModeToggle.textContent = '📖 全景模式';
      viewModeToggle.classList.add('active');
    } else {
      viewModeToggle.textContent = '🚀 分步模式';
      viewModeToggle.classList.remove('active');
    }
  }

  function applyFilter() {
    filtered = sentences.filter(function (item) {
      if (activeTheme === 'all') return true;
      if (activeTheme === 'starred') return stars.has(item.id);
      if (activeTheme === 'mastered') return completed.has(item.id);
      if (activeTheme === 'unmastered') return !completed.has(item.id);
      return item.theme === activeTheme;
    });
    curIdx = 0;
    curStep = 0;
    try {
      var q = new URLSearchParams(location.search);
      var qId = q.get('id');
      var qIdx = parseInt(q.get('idx') || q.get('s') || '', 10);
      if (qId) {
        var foundIdx = filtered.findIndex(function(s) { return s.id === qId; });
        if (foundIdx >= 0) curIdx = foundIdx;
      } else if (!isNaN(qIdx) && qIdx >= 0 && qIdx < filtered.length) {
        curIdx = qIdx;
      }
    } catch(e){}
    renderCurrent();
    renderDrawerList();
  }

  if (themeChips) {
    themeChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.filter-chip');
      if (!chip) return;
      activeTheme = chip.getAttribute('data-filter');
      themeChips.querySelectorAll('.filter-chip').forEach(function (c) {
        c.classList.toggle('active', c === chip);
      });
      applyFilter();
    });
  }

  // Skeleton Toggle
  if (skeletonToggleBtn) {
    skeletonToggleBtn.onclick = function () {
      skeletonMode = !skeletonMode;
      updateSkeletonUI();
    };
  }

  function updateSkeletonUI() {
    if (skeletonToggleBtn) {
      skeletonToggleBtn.textContent = skeletonMode ? '✨ 主干透视 (开)' : '✨ 主干透视';
      skeletonToggleBtn.classList.toggle('active', skeletonMode);
    }
    var enBox = document.getElementById('trans-en-text');
    if (enBox) {
      enBox.classList.toggle('skeleton-mode', skeletonMode);
    }
  }

  function isCoreSkeletonRole(role) {
    var r = String(role || '');
    return r.indexOf('主语') > -1 || r.indexOf('谓语') > -1 || r.indexOf('主句') > -1 || r.indexOf('宾语') > -1;
  }

  function updateCountPill() {
    if (!countPill || !filtered.length) return;
    var item = filtered[curIdx];
    if (!item) return;
    var isDone = completed.has(item.id);
    var currentScore = scores[item.id] != null ? scores[item.id] : null;
    var starsStr = '⭐'.repeat(item.difficulty || 4);
    var scoreBadge = currentScore != null ? ' · 🎯 ' + currentScore.toFixed(1) + '分' : '';
    var stepBadge = viewMode === 'steps' ? ' · Step ' + curStep : '';
    countPill.textContent = (curIdx + 1) + ' / ' + filtered.length + stepBadge + ' · ' + starsStr + scoreBadge + (isDone ? ' · ✓已掌握' : '');
  }

  function renderCurrent() {
    if (!filtered.length) {
      if (countPill) countPill.textContent = '0 / 0 句';
      if (transCard) transCard.innerHTML = '<div class="catalog-empty">当前筛选下暂无句子。可在上方切换全部题材或重难句本。</div>';
      return;
    }

    var item = filtered[curIdx];
    var isDone = completed.has(item.id);
    updateCountPill();

    if (starBtn) {
      starBtn.classList.toggle('active', stars.has(item.id));
      starBtn.title = stars.has(item.id) ? '已在重难句本 (点击取消)' : '加入重难句本';
    }

    // Build Original Sentence HTML with hoverable chunk spans
    var enHtml = '';
    if (item.chunks && item.chunks.length) {
      enHtml = item.chunks.map(function (c, idx) {
        var isCore = isCoreSkeletonRole(c.role);
        return '<span class="chunk-tag-span' + (isCore ? ' is-core-skeleton' : '') + '" data-chunk-idx="' + idx + '" title="' + esc(c.role) + '：' + esc(c.zh) + '">' + esc(c.en) + ' </span>';
      }).join('');
    } else {
      enHtml = esc(item.sentence_en);
    }

    var savedDraft = drafts[item.id] || '';

    // Step 0 Pane: Zen Reading & Independent Thinking Gateway
    var step0Html =
      '<div class="step-pane' + (viewMode === 'steps' && curStep !== 0 ? '" hidden="' : '') + '" id="step-0-pane" data-step-title="Step 0: 📖 纯净真题读句">' +
        '<div class="zen-gateway-card">' +
          '<div class="zen-roadmap">' +
            '<span class="zen-roadmap-step">① 意群切分</span>' +
            '<span class="zen-roadmap-arrow">➔</span>' +
            '<span class="zen-roadmap-step">② 难词引申</span>' +
            '<span class="zen-roadmap-arrow">➔</span>' +
            '<span class="zen-roadmap-step">③ 动手初译</span>' +
            '<span class="zen-roadmap-arrow">➔</span>' +
            '<span class="zen-roadmap-step">④ 满分精析</span>' +
          '</div>' +
          '<div class="zen-gateway-tip">' +
            '💡 <strong>考研翻译通关第一步：</strong>请先通读上方英文原句，尝试在脑海中寻找主谓宾核心骨架与转折逻辑。准备好后，点击下方按钮开始逐步引导拆解！' +
          '</div>' +
          '<button class="zen-cta-btn" type="button" data-goto-step="1">' +
            '🚀 开始引导式拆解 (进入 Step 1: 切意群·寻主干)' +
          '</button>' +
          '<div style="display:flex;gap:14px;align-items:center;font-size:12px;color:var(--color-text-muted);margin-top:2px;flex-wrap:wrap;justify-content:center">' +
            '<button class="link-btn" type="button" data-goto-step="3">✍️ 直接写初译草稿</button>' +
            '<span>·</span>' +
            '<button class="link-btn" type="button" id="open-overview-btn">📖 展开全景精读手册</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Step 1 Pane: Chunks & Skeleton
    var step1Html =
      '<div class="step-pane' + (viewMode === 'steps' && curStep !== 1 ? '" hidden="' : '') + '" id="step-1-pane" data-step-title="Step 1: 🔭 寻主干·切意群">' +
        '<div class="chunk-grid">' +
          (item.chunks || []).map(function (c, idx) {
            var isCore = isCoreSkeletonRole(c.role);
            return '<div class="chunk-item' + (isCore ? ' is-core' : '') + '" data-chunk-idx="' + idx + '">' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<span class="chunk-role">' + (isCore ? '★ ' : '') + esc(c.role) + '</span>' +
                '<button class="audio-btn" type="button" data-speak-chunk="' + esc(c.en) + '" aria-label="朗读意群" title="朗读此意群">🔊</button>' +
              '</div>' +
              '<div class="chunk-en">' + esc(c.en) + '</div>' +
              '<div class="chunk-zh">👉 ' + esc(c.zh) + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="analysis-box" style="margin-top:12px">' +
          '<strong>📐 考研长难句语法骨架透视：</strong>' +
          '<div>' + esc(item.grammar_analysis) + '</div>' +
          (item.skeleton_label ? '<div style="margin-top:6px;font-size:12px;color:var(--color-primary);font-weight:600">🎯 主干结构拆解：' + esc(item.skeleton_label) + '</div>' : '') +
        '</div>' +
        (viewMode === 'steps' ? (
          '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
            '<button class="home-btn" type="button" data-goto-step="0">← 返回纯净原句</button>' +
            '<button class="home-btn primary" type="button" data-goto-step="2">下一步：💡 破核心难词引申 (Step 2) →</button>' +
          '</div>'
        ) : '') +
      '</div>';

    // Step 2 Pane: Vocab
    var step2Html =
      '<div class="step-pane' + (viewMode === 'steps' && curStep !== 2 ? '" hidden="' : '') + '" id="step-2-pane" data-step-title="Step 2: 💡 破难点·语境引申">' +
        '<div class="vocab-grid">' +
          (item.key_vocab || []).map(function (v) {
            return '<div class="vocab-card">' +
              '<div class="vw-head">' +
                '<span class="vw-word">' + esc(v.word) + ' <span style="font-size:12px;font-weight:normal;color:var(--color-text-muted)">' + esc(v.pos) + '</span></span>' +
                '<div>' +
                  (v.phonetic ? '<span class="vw-ph">' + esc(v.phonetic) + '</span> ' : '') +
                  '<button class="audio-btn" type="button" data-speak-chunk="' + esc(v.word) + '" title="朗读单词" style="width:24px;height:24px;font-size:11px">🔊</button>' +
                  (window.KaoyanQuiz ? KaoyanQuiz.favBtn(v.word) : '') +
                '</div>' +
              '</div>' +
              '<div class="vw-meaning"><b>考研语境译：</b><span style="color:var(--color-primary);font-weight:600">' + esc(v.contextual_zh) + '</span> <span style="color:var(--color-text-muted);font-size:11px">（字面义：' + esc(v.literal) + '）</span></div>' +
              '<div class="vw-tip">💡 ' + esc(v.tip) + '</div>' +
              '<div style="margin-top:6px;text-align:right">' +
                '<a href="index.html?w=' + encodeURIComponent(v.word) + '" target="_blank" class="syn-chip" style="font-size:11px;padding:2px 8px" title="在大纲词库中查看详细例句与词根">📖 查大纲词典</a>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        (viewMode === 'steps' ? (
          '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
            '<button class="home-btn" type="button" data-goto-step="1">← 上一步 (Step 1: 切意群)</button>' +
            '<button class="home-btn primary" type="button" data-goto-step="3">下一步：✍️ 亲动手·实战初译 (Step 3) →</button>' +
          '</div>'
        ) : '') +
      '</div>';

    // Step 3 Pane: Draft Practice & Scaffolding
    var step3Html =
      '<div class="step-pane' + (viewMode === 'steps' && curStep !== 3 ? '" hidden="' : '') + '" id="step-3-pane" data-step-title="Step 3: ✍️ 亲动手·交互初译">' +
        '<div class="draft-container">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
            '<label for="draft-input" style="font-weight:600;font-size:14px;color:var(--color-text)">📝 考生实战草稿区（结合前两步意群与词义，尝试写出通顺中文）：</label>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<button class="chunk-assemble-btn" id="assemble-chunks-btn" type="button" title="一键填入切分好的意群中文，作为初译修改脚手架">🧩 填入意群草稿框架</button>' +
              '<button class="multi-clear-btn" id="clear-draft-btn" type="button" style="font-size:11px;padding:2px 8px">清空</button>' +
              '<span id="draft-status" style="font-size:12px;color:var(--color-text-muted)">' + (savedDraft ? '✓ 草稿已保存' : '自动保存中') + '</span>' +
            '</div>' +
          '</div>' +
          '<textarea id="draft-input" class="draft-textarea" placeholder="在此输入你的中文翻译（支持随时自动保存）…\n提示：点击右上角「🧩 填入意群草稿框架」可一键填入意群初译，在此基础上调整语序更轻松！">' + esc(savedDraft) + '</textarea>' +
          '<div class="draft-footer">' +
            '<div id="draft-feedback-text" style="color:var(--color-text-muted)">推荐字数：55~90 字</div>' +
            '<span id="draft-count" style="font-weight:600">' + (savedDraft ? savedDraft.length : 0) + ' 字</span>' +
          '</div>' +

          // Chunk checklist for verifying no dropped phrases
          '<div class="analysis-box" style="margin-top:6px;background:var(--color-surface-offset)">' +
            '<strong style="font-size:12px;color:var(--color-text-muted);margin-bottom:6px">📋 意群完整度自查（翻译时对照，杜绝考研漏译扣分）：</strong>' +
            '<div class="checklist-wrap">' +
              (item.chunks || []).map(function (c, idx) {
                return '<label class="chunk-check-item">' +
                  '<input type="checkbox" data-chunk-check="' + idx + '" />' +
                  '<span>' + esc(c.zh) + '</span>' +
                '</label>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
        (viewMode === 'steps' ? (
          '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
            '<button class="home-btn" type="button" data-goto-step="2">← 上一步 (Step 2: 难词引申)</button>' +
            '<button class="home-btn primary" id="finish-draft-btn" type="button" data-goto-step="4">完成初译，查看满分精析 (Step 4) →</button>' +
          '</div>'
        ) : '') +
      '</div>';

    // Step 4 Pane: Model & Interactive Scoring Rubric
    var rubricScore = scores[item.id] != null ? scores[item.id] : 0.0;
    var rubricItems = item.scoring_rubric || [
      { score: 0.5, item: "句子主干（主谓宾结构）翻译准确" },
      { score: 0.5, item: "从句与修饰成分逻辑关系转换恰当" },
      { score: 0.5, item: "核心学术词汇语境引申得当" },
      { score: 0.5, item: "中文表达通顺流畅，无语病与错别字" }
    ];

    var step4Html =
      '<div class="step-pane' + (viewMode === 'steps' && curStep !== 4 ? '" hidden="' : '') + '" id="step-4-pane" data-step-title="Step 4: 🎯 对考点·满分精析">' +
        '<div class="model-trans-box">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
            '<div class="mt-label">👑 考研官方满分参考译文</div>' +
            '<div style="display:flex;gap:6px">' +
              '<button class="audio-btn" type="button" data-copy="' + esc(item.translation || item.translation_zh || '') + '" title="复制满分译文" style="font-size:12px;width:auto;padding:2px 8px">📋 复制译文</button>' +
              '<button class="audio-btn" type="button" id="copy-full-note-btn" title="一键复制全套长难句精读笔记 (Markdown)" style="font-size:12px;width:auto;padding:2px 8px">📝 复制全套精读笔记</button>' +
            '</div>' +
          '</div>' +
          '<div class="mt-text">' + esc(item.translation || item.translation_zh || '') + '</div>' +
        '</div>' +

        (savedDraft ? (
          '<div class="analysis-box" style="border-left:3px solid var(--color-accent);background:color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));margin-top:10px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<strong style="color:var(--color-accent)">✍️ 你的实战草稿对照：</strong>' +
              '<button class="link-btn" type="button" data-goto-step="3" style="font-size:12px">✏️ 再次修改草稿</button>' +
            '</div>' +
            '<div style="font-size:14px;line-height:1.6;margin-top:4px">' + esc(savedDraft) + '</div>' +
          '</div>'
        ) : '') +

        // Interactive 2.0 Score Rubric Self-Check
        '<div class="rubric-card">' +
          '<div class="rubric-head">' +
            '<strong>🎯 考研英语一 2.0 分阅卷采分点交互自评：</strong>' +
            '<span class="rubric-score-badge" id="rubric-score-display">' + (rubricScore != null ? Number(rubricScore).toFixed(1) : '2.0') + ' / 2.0 分</span>' +
          '</div>' +
          '<div class="rubric-list">' +
            rubricItems.map(function (rb, rIdx) {
              var checked = rubricScore == null || (rubricScore >= (rIdx + 1) * 0.5);
              return '<label class="rubric-item' + (checked ? ' checked' : '') + '">' +
                '<input type="checkbox" class="rubric-cb" data-rubric-score="' + rb.score + '" ' + (checked ? 'checked' : '') + ' />' +
                '<div><b>[+' + rb.score + '分]</b> ' + esc(rb.item) + '</div>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>' +

        // Analysis Section: Skills + Pitfalls + Literal Flaw
        '<div class="analysis-section" style="margin-top:12px">' +
          '<div class="analysis-box">' +
            '<strong>💡 考研英一翻译核心提分技巧：</strong>' +
            '<div>' + esc(item.skills_summary) + '</div>' +
          '</div>' +
          '<div class="analysis-box pitfall">' +
            '<strong>⚠️ 考研阅卷避坑与扣分警示：</strong>' +
            '<div>' + esc(item.pitfalls) + '</div>' +
          '</div>' +
          (item.literal_flaw ? (
            '<div class="literal-flaw-box">' +
              '<strong>❌ 典型生硬初学者直译诊断 (病句诊断室)：</strong>' +
              '<div>' + esc(item.literal_flaw) + '</div>' +
            '</div>'
          ) : '') +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:18px">' +
          '<button class="multi-clear-btn" id="mark-mastered-btn" type="button" style="font-weight:600;' + (isDone ? 'background:#2e7d32;color:#fff;border-color:#2e7d32' : 'border-color:var(--color-primary);color:var(--color-primary)') + '">' +
            (isDone ? '✓ 本句已掌握 (点击取消)' : '标记为已掌握 ✓') +
          '</button>' +
          '<div style="display:flex;gap:8px">' +
            (viewMode === 'steps' ? '<button class="home-btn" type="button" data-goto-step="0">🔄 重看原句</button>' : '') +
            '<button class="home-btn primary" id="next-sentence-btn" type="button">下一句真题练习 →</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var cardHtml =
      '<div class="trans-en-card">' +
        '<div class="trans-meta-row">' +
          '<span><span class="badge exam-tag">' + esc(item.theme) + '</span> ' + esc(item.title) + '</span>' +
          '<span>' + esc(item.source) + '</span>' +
        '</div>' +
        '<div class="trans-en-text' + (skeletonMode ? ' skeleton-mode' : '') + '" id="trans-en-text">' + enHtml + '</div>' +
      '</div>' +

      // Step Navigation Tabs (only shown in 'steps' mode)
      (viewMode === 'steps' ? (
        '<div class="step-nav" role="tablist">' +
          '<button class="step-btn' + (curStep === 0 ? ' active' : '') + '" type="button" data-step="0">' +
            '<span class="s-num">Step 0</span><span class="s-title">📖 纯净原句</span>' +
          '</button>' +
          '<button class="step-btn' + (curStep === 1 ? ' active' : '') + '" type="button" data-step="1">' +
            '<span class="s-num">Step 1</span><span class="s-title">🔭 切意群</span>' +
          '</button>' +
          '<button class="step-btn' + (curStep === 2 ? ' active' : '') + '" type="button" data-step="2">' +
            '<span class="s-num">Step 2</span><span class="s-title">💡 破难点</span>' +
          '</button>' +
          '<button class="step-btn' + (curStep === 3 ? ' active' : '') + '" type="button" data-step="3">' +
            '<span class="s-num">Step 3</span><span class="s-title">✍️ 亲初译</span>' +
          '</button>' +
          '<button class="step-btn' + (curStep === 4 ? ' active' : '') + '" type="button" data-step="4">' +
            '<span class="s-num">Step 4</span><span class="s-title">🎯 满分精析' + (isDone ? ' ✓' : '') + '</span>' +
          '</button>' +
        '</div>'
      ) : '') +

      // Panes
      (viewMode === 'steps' ? step0Html : '') + step1Html + step2Html + step3Html + step4Html;

    if (transCard) {
      transCard.className = 'trans-card' + (viewMode === 'overview' ? ' overview-mode' : '');
      transCard.innerHTML = cardHtml;
    }

    bindCardEvents(item);
    updateSkeletonUI();
  }

  function renderStepPane() {
    if (viewMode === 'overview') return;
    updateCountPill();
    document.querySelectorAll('.step-btn').forEach(function (btn) {
      var s = +btn.getAttribute('data-step');
      btn.classList.toggle('active', s === curStep);
    });
    for (var i = 0; i <= 4; i++) {
      var pane = document.getElementById('step-' + i + '-pane');
      if (pane) {
        pane.hidden = (curStep !== i);
      }
    }
  }

  function bindCardEvents(item) {
    // Step tab clicks
    document.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.onclick = function () {
        curStep = +btn.getAttribute('data-step');
        renderStepPane();
      };
    });

    // Navigation buttons inside steps
    document.querySelectorAll('[data-goto-step]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        curStep = +btn.getAttribute('data-goto-step');
        renderStepPane();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });

    var openOverviewBtn = document.getElementById('open-overview-btn');
    if (openOverviewBtn) {
      openOverviewBtn.onclick = function (e) {
        e.preventDefault();
        viewMode = 'overview';
        updateViewModeBtn();
        renderCurrent();
      };
    }

    // Mastery toggle button
    var markMasteredBtn = document.getElementById('mark-mastered-btn');
    if (markMasteredBtn) {
      markMasteredBtn.onclick = function () {
        if (completed.has(item.id)) completed.delete(item.id);
        else completed.add(item.id);
        saveState();
        updateMasteryUI();
        renderCurrent();
        renderDrawerList();
      };
    }

    // Next sentence from Step 4
    var nextSBtn = document.getElementById('next-sentence-btn');
    if (nextSBtn) {
      nextSBtn.onclick = function () {
        if (curIdx < filtered.length - 1) curIdx++;
        else curIdx = 0;
        curStep = 0;
        renderCurrent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    // Mobile Touch Swipe on English card to switch sentences & double-tap to read (左右滑动手势切句 + 双击朗读)
    var enCard = document.querySelector('.trans-en-card');
    if (enCard) {
      var tStartX = 0, tStartY = 0, tStartTime = 0, lastTap = 0;
      enCard.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches.length === 1) {
          tStartX = e.touches[0].clientX;
          tStartY = e.touches[0].clientY;
          tStartTime = Date.now();
        }
      }, { passive: true });

      enCard.addEventListener('touchend', function (e) {
        var now = Date.now();
        if (now - lastTap < 300) {
          // Double tap -> instant speech
          speak(item.en);
          if (navigator.vibrate) try { navigator.vibrate([10, 20, 15]); } catch(err){}
        }
        lastTap = now;

        if (e.changedTouches && e.changedTouches.length === 1) {
          var dx = e.changedTouches[0].clientX - tStartX;
          var dy = e.changedTouches[0].clientY - tStartY;
          var dt = Date.now() - tStartTime;
          if (Math.abs(dx) > 55 && Math.abs(dy) < 85 && dt < 450) {
            if (dx < -55) {
              if (curIdx < filtered.length - 1) curIdx++;
              else curIdx = 0;
              curStep = 0;
              renderCurrent();
            } else if (dx > 55) {
              if (curIdx > 0) curIdx--;
              else curIdx = filtered.length - 1;
              curStep = 0;
              renderCurrent();
            }
          }
        }
      }, { passive: true });
    }

    // Step panes swipe gesture (左右滑动切换解题步骤 Step 0~4)
    var transBody = document.querySelector('.trans-body');
    if (transBody && viewMode === 'steps') {
      var sStartX = 0, sStartY = 0, sStartTime = 0;
      transBody.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches.length === 1) {
          sStartX = e.touches[0].clientX;
          sStartY = e.touches[0].clientY;
          sStartTime = Date.now();
        }
      }, { passive: true });

      transBody.addEventListener('touchend', function (e) {
        if (e.changedTouches && e.changedTouches.length === 1) {
          var dx = e.changedTouches[0].clientX - sStartX;
          var dy = e.changedTouches[0].clientY - sStartY;
          var dt = Date.now() - sStartTime;
          if (Math.abs(dx) > 60 && Math.abs(dy) < 70 && dt < 400) {
            if (dx < -60 && curStep < 4) {
              curStep++;
              renderStepPane();
              if (navigator.vibrate) try { navigator.vibrate(12); } catch(err){}
            } else if (dx > 60 && curStep > 0) {
              curStep--;
              renderStepPane();
              if (navigator.vibrate) try { navigator.vibrate(12); } catch(err){}
            }
          }
        }
      }, { passive: true });
    }

    // Chunk hover and click sync
    document.querySelectorAll('.chunk-item').forEach(function (el) {
      el.onmouseenter = function () {
        var idx = el.getAttribute('data-chunk-idx');
        var sp = document.querySelector('.chunk-tag-span[data-chunk-idx="' + idx + '"]');
        if (sp) sp.classList.add('highlighted');
      };
      el.onmouseleave = function () {
        var idx = el.getAttribute('data-chunk-idx');
        var sp = document.querySelector('.chunk-tag-span[data-chunk-idx="' + idx + '"]');
        if (sp) sp.classList.remove('highlighted');
      };
      el.onclick = function () {
        var idx = el.getAttribute('data-chunk-idx');
        var sp = document.querySelector('.chunk-tag-span[data-chunk-idx="' + idx + '"]');
        if (sp) {
          sp.classList.add('highlighted');
          setTimeout(function () { sp.classList.remove('highlighted'); }, 1200);
        }
      };
    });

    document.querySelectorAll('.chunk-tag-span').forEach(function (sp) {
      sp.onmouseenter = function () {
        var idx = sp.getAttribute('data-chunk-idx');
        var ci = document.querySelector('.chunk-item[data-chunk-idx="' + idx + '"]');
        if (ci) ci.classList.add('active');
      };
      sp.onmouseleave = function () {
        var idx = sp.getAttribute('data-chunk-idx');
        var ci = document.querySelector('.chunk-item[data-chunk-idx="' + idx + '"]');
        if (ci) ci.classList.remove('active');
      };
    });

    // Draft autosave & character count feedback
    var draftInput = document.getElementById('draft-input');
    var draftCount = document.getElementById('draft-count');
    var draftStatus = document.getElementById('draft-status');
    var draftFeedback = document.getElementById('draft-feedback-text');

    function updateDraftFeedback(len) {
      if (!draftFeedback) return;
      if (len === 0) {
        draftFeedback.textContent = '推荐字数：55~90 字';
        draftFeedback.style.color = 'var(--color-text-muted)';
      } else if (len < 35) {
        draftFeedback.textContent = '⚠️ 字数偏短，请检查是否有修饰从句或状语漏译';
        draftFeedback.style.color = '#e65100';
      } else if (len <= 100) {
        draftFeedback.textContent = '✓ 长度适中，符合考研英一阅卷标准';
        draftFeedback.style.color = '#2e7d32';
      } else {
        draftFeedback.textContent = '⚠️ 篇幅偏长，建议精炼语序避免冗余';
        draftFeedback.style.color = '#e65100';
      }
    }

      function autoCheckChunks(val) {
        if (!item.chunks) return;
        var cleanVal = (val || '').replace(/[，。；、“”‘’（）\s]/g, '');
        (item.chunks || []).forEach(function (c, idx) {
          var cb = document.querySelector('input[data-chunk-check="' + idx + '"]');
          if (!cb) return;
          var zhClean = (c.zh || '').replace(/[，。；、“”‘’（）\s]/g, '');
          var tokens = [];
          for (var i = 0; i < zhClean.length - 1; i += 2) {
            tokens.push(zhClean.substring(i, i + 2));
          }
          var matched = tokens.some(function (tk) { return cleanVal.indexOf(tk) > -1; });
          if (matched || (zhClean && cleanVal.indexOf(zhClean) > -1)) {
            cb.checked = true;
          }
        });
      }

      if (draftInput) {
        var timer;
        var initVal = draftInput.value || '';
        updateDraftFeedback(initVal.length);
        autoCheckChunks(initVal);
        draftInput.oninput = function () {
          var val = draftInput.value || '';
          if (draftCount) draftCount.textContent = val.length + ' 字';
          if (draftStatus) draftStatus.textContent = '输入中…';
          updateDraftFeedback(val.length);
          autoCheckChunks(val);
          clearTimeout(timer);
          timer = setTimeout(function () {
            drafts[item.id] = val;
            saveState();
            if (draftStatus) draftStatus.textContent = '✓ 草稿已自动保存';
          }, 500);
        };
      }

      // Copy Full Note (Markdown format)
      var copyFullNoteBtn = document.getElementById('copy-full-note-btn');
      if (copyFullNoteBtn) {
        copyFullNoteBtn.onclick = function () {
          var md = [
            '# 考研英语一长难句精读 · ' + item.title + ' (' + item.source + ')',
            '\n## 1. 原文与主干',
            item.sentence_en,
            '\n## 2. 意群拆解',
            (item.chunks || []).map(function (c) { return '- **' + c.role + '**: ' + c.en + ' ➔ ' + c.zh; }).join('\n'),
            '\n## 3. 核心考点与技巧',
            item.skills_summary,
            '\n## 4. 避坑警示',
            item.pitfalls,
            '\n## 5. 官方满分译文',
            (item.translation || item.translation_zh || '')
          ].join('\n');

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(md).then(function () {
              copyFullNoteBtn.textContent = '已复制 ✓';
              setTimeout(function () { copyFullNoteBtn.textContent = '📝 复制全套精读笔记'; }, 1500);
            });
          }
        };
      }

    // Assemble chunk hints into draft box (Scaffolding helper)
    var assembleBtn = document.getElementById('assemble-chunks-btn');
    if (assembleBtn && draftInput) {
      assembleBtn.onclick = function () {
        var template = (item.chunks || []).map(function (c) {
          return '【' + c.zh.replace(/[，。；]/g, '') + '】';
        }).join(' ');
        if (!draftInput.value || confirm('是否将意群初译填入草稿区作为修改框架？')) {
          draftInput.value = template;
          drafts[item.id] = template;
          saveState();
          if (draftCount) draftCount.textContent = template.length + ' 字';
          if (draftStatus) draftStatus.textContent = '✓ 意群框架已填入';
          updateDraftFeedback(template.length);
          draftInput.focus();
        }
      };
    }

    // Clear draft button
    var clearDraftBtn = document.getElementById('clear-draft-btn');
    if (clearDraftBtn && draftInput) {
      clearDraftBtn.onclick = function () {
        if (!draftInput.value) return;
        if (confirm('确认清空当前草稿吗？')) {
          draftInput.value = '';
          drafts[item.id] = '';
          saveState();
          if (draftCount) draftCount.textContent = '0 字';
          updateDraftFeedback(0);
        }
      };
    }

    // Interactive Scoring Rubric Checkboxes
    var rubricScoreDisplay = document.getElementById('rubric-score-display');
    var rubricCheckboxes = document.querySelectorAll('.rubric-cb');
    rubricCheckboxes.forEach(function (cb) {
      cb.onchange = function () {
        var total = 0.0;
        rubricCheckboxes.forEach(function (box) {
          var itemWrap = box.closest('.rubric-item');
          if (box.checked) {
            total += parseFloat(box.getAttribute('data-rubric-score') || '0.5');
            if (itemWrap) itemWrap.classList.add('checked');
          } else {
            if (itemWrap) itemWrap.classList.remove('checked');
          }
        });
        scores[item.id] = total;
        saveState();
        if (cb.checked) {
          if (total >= 2.0) {
            if (window.KaoyanAudio) window.KaoyanAudio.playComplete();
            if (navigator.vibrate) try { navigator.vibrate([15, 30, 20]); } catch (e) {}
          } else {
            if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
            if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
          }
        }
        if (rubricScoreDisplay) {
          rubricScoreDisplay.textContent = total.toFixed(1) + ' / 2.0 分' + (total >= 2.0 ? ' 🏆 满分！' : '');
        }
      };
    });

    // Chunk Checklist Listeners
    document.querySelectorAll('[data-chunk-check]').forEach(function (cb) {
      cb.onchange = function () {
        if (cb.checked) {
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
        }
      };
    });

    // Speak chunk buttons
    document.querySelectorAll('[data-speak-chunk]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        speak(btn.getAttribute('data-speak-chunk'), btn);
      };
    });

    // Copy text buttons
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.onclick = function () {
        var text = btn.getAttribute('data-copy');
        if (!text) return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            var orig = btn.innerHTML;
            btn.innerHTML = '✓ 已复制';
            if (navigator.vibrate) try { navigator.vibrate(12); } catch(e){}
            setTimeout(function () { btn.innerHTML = orig; }, 1200);
          });
        }
      };
    });
  }

  function renderStepPane() {
    if (viewMode === 'overview') return;
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.classList.toggle('active', +b.getAttribute('data-step') === curStep);
    });
    for (var i = 1; i <= 4; i++) {
      var pane = document.getElementById('step-' + i + '-pane');
      if (pane) pane.hidden = i !== curStep;
    }
  }

  function speak(text, targetBtn) {
    if (!text) return;
    try {
      var lang = localStorage.getItem('kao_ttslang') || 'en-US';
      var rate = parseFloat(localStorage.getItem('kao_ttsrate') || '0.92');
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      if (targetBtn) {
        targetBtn.classList.add('speaking');
        u.onend = function () { targetBtn.classList.remove('speaking'); };
        u.onerror = function () { targetBtn.classList.remove('speaking'); };
      }
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // Drawer Interactions
  function openDrawer() {
    if (!catalogDrawer || !drawerBackdrop) return;
    renderDrawerList();
    catalogDrawer.classList.add('open');
    catalogDrawer.setAttribute('aria-hidden', 'false');
    catalogDrawer.removeAttribute('inert');
    drawerBackdrop.hidden = false;
  }

  function closeDrawer() {
    if (!catalogDrawer || !drawerBackdrop) return;
    catalogDrawer.classList.remove('open');
    catalogDrawer.setAttribute('aria-hidden', 'true');
    catalogDrawer.setAttribute('inert', '');
    drawerBackdrop.hidden = true;
  }

  if (drawerToggleBtn) drawerToggleBtn.onclick = openDrawer;
  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

  if (drawerSearch) {
    drawerSearch.oninput = function () {
      renderDrawerList(drawerSearch.value.trim().toLowerCase());
    };
  }

  function renderDrawerList(query) {
    if (!drawerList) return;
    var list = sentences.filter(function (s) {
      if (!query) return true;
      return s.title.toLowerCase().indexOf(query) > -1 ||
        s.theme.toLowerCase().indexOf(query) > -1 ||
        s.sentence_en.toLowerCase().indexOf(query) > -1 ||
        s.translation_zh.toLowerCase().indexOf(query) > -1;
    });

    if (!list.length) {
      drawerList.innerHTML = '<div class="catalog-empty">未搜到相关长难句。</div>';
      return;
    }

    drawerList.innerHTML = list.map(function (s) {
      var isCurrent = filtered[curIdx] && filtered[curIdx].id === s.id;
      var isMastered = completed.has(s.id);
      var isStarred = stars.has(s.id);
      var hasDraft = !!drafts[s.id];
      var scoreVal = scores[s.id];

      return '<div class="drawer-item' + (isCurrent ? ' active' : '') + '" data-sentence-id="' + s.id + '">' +
        '<div class="drawer-item-head">' +
          '<span class="badge exam-tag">' + esc(s.theme) + '</span>' +
          '<span>' +
            (isMastered ? '<span style="color:#2e7d32;font-weight:bold;margin-right:6px">✓ 已掌握</span>' : '') +
            (isStarred ? '<span style="color:var(--color-accent);margin-right:6px">★</span>' : '') +
            '<span style="color:var(--color-text-muted)">' + '⭐'.repeat(s.difficulty || 4) + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="drawer-item-title">' + esc(s.title) + '</div>' +
        '<div class="drawer-item-meta">' +
          '<span>' + esc(s.source) + '</span>' +
          '<span>' +
            (hasDraft ? '<span title="已写初译草稿" style="margin-right:6px">📝 草稿</span>' : '') +
            (scoreVal != null ? '<span style="color:var(--color-primary);font-weight:bold">🎯 ' + scoreVal.toFixed(1) + '分</span>' : '') +
          '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    drawerList.querySelectorAll('.drawer-item').forEach(function (el) {
      el.onclick = function () {
        var sid = el.getAttribute('data-sentence-id');
        var targetIdx = filtered.findIndex(function (item) { return item.id === sid; });
        if (targetIdx >= 0) {
          curIdx = targetIdx;
        } else {
          // If filtered out by active theme, reset to all
          activeTheme = 'all';
          if (themeChips) {
            themeChips.querySelectorAll('.filter-chip').forEach(function (c) {
              c.classList.toggle('active', c.getAttribute('data-filter') === 'all');
            });
          }
          filtered = sentences.slice();
          curIdx = filtered.findIndex(function (item) { return item.id === sid; });
        }
        curStep = 0;
        closeDrawer();
        renderCurrent();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });
  }

  // Global Controls
  if (prevBtn) {
    prevBtn.onclick = function () {
      if (curIdx > 0) curIdx--;
      else curIdx = filtered.length - 1;
      curStep = 0;
      renderCurrent();
    };
  }

  if (nextBtn) {
    nextBtn.onclick = function () {
      if (curIdx < filtered.length - 1) curIdx++;
      else curIdx = 0;
      curStep = 0;
      renderCurrent();
    };
  }

  if (randomBtn) {
    randomBtn.onclick = function () {
      if (!filtered.length) return;
      curIdx = Math.floor(Math.random() * filtered.length);
      curStep = 0;
      renderCurrent();
    };
  }

  if (starBtn) {
    starBtn.onclick = function () {
      if (!filtered.length) return;
      var cur = filtered[curIdx];
      if (stars.has(cur.id)) stars.delete(cur.id);
      else stars.add(cur.id);
      saveState();
      starBtn.classList.toggle('active', stars.has(cur.id));
      starBtn.title = stars.has(cur.id) ? '已在重难句本' : '加入重难句本';
      renderDrawerList();
    };
  }

  if (speakSentenceBtn) {
    speakSentenceBtn.onclick = function () {
      if (filtered[curIdx]) speak(filtered[curIdx].sentence_en);
    };
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', function (e) {
    if (e.target.matches('textarea, input, select')) return;
    if (e.key === 'Escape') {
      closeDrawer();
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (prevBtn) prevBtn.click();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (nextBtn) nextBtn.click();
    } else if (e.key >= '0' && e.key <= '4') {
      curStep = +e.key;
      renderStepPane();
    } else if (e.key === 's' || e.key === 'S') {
      if (speakSentenceBtn) speakSentenceBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      var markMasteredBtn = document.getElementById('mark-mastered-btn');
      if (markMasteredBtn) markMasteredBtn.click();
    }
  });

  // ---- 词库字典联动与长难句划词/点词即时取词气泡卡片 ----
  var WORD_MAP = {};
  if (window.__WORDS_DATA__ && window.__WORDS_DATA__.words) {
    (window.__WORDS_DATA__.words || []).forEach(function (w) {
      WORD_MAP[w.word.toLowerCase()] = w;
    });
  } else {
    fetch('data/words.json')
      .then(function (r) { return (r.ok || r.status === 0) ? r.json() : null; })
      .then(function (d) {
        if (d && d.words) {
          (d.words || []).forEach(function (w) {
            WORD_MAP[w.word.toLowerCase()] = w;
          });
        }
      }).catch(function () {});
  }

  var popoverEl = null;
  function ensurePopover() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement('div');
    popoverEl.className = 'word-popover';
    popoverEl.hidden = true;
    document.body.appendChild(popoverEl);
    return popoverEl;
  }

  document.addEventListener('mouseup', function (e) {
    var enArea = e.target.closest('#trans-en-text, .chunk-en, .sentence');
    if (!enArea) {
      if (popoverEl && !e.target.closest('.word-popover')) popoverEl.hidden = true;
      return;
    }
    var sel = window.getSelection();
    var selText = sel ? sel.toString().trim().toLowerCase().replace(/[^a-z\-]/g, '') : '';
    if (!selText || selText.length < 2) return;
    var entry = WORD_MAP[selText];
    if (!entry) return;

    var pop = ensurePopover();
    var range = sel.getRangeAt(0);
    var rect = range.getBoundingClientRect();
    pop.innerHTML = '<div class="pop-head">' +
      '<strong>' + esc(entry.word) + '</strong>' +
      (entry.phonetic ? '<span class="pop-ph">' + esc(entry.phonetic) + '</span>' : '') +
      '<button class="audio-btn" data-speak="' + esc(entry.word) + '" type="button" style="width:22px;height:22px;font-size:11px">🔊</button>' +
    '</div>' +
    '<div class="pop-meaning">' + esc(entry.exam_meaning || entry.translation || '') + '</div>' +
    (entry.synonyms ? '<div style="font-size:11px;color:var(--color-primary);margin-top:4px">🔄 同义: ' + esc(entry.synonyms) + '</div>' : '') +
    '<div class="pop-foot"><a href="index.html?w=' + encodeURIComponent(entry.word) + '" target="_blank">📖 查看完整考研词条 →</a></div>';

    pop.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    pop.style.left = Math.max(10, Math.min(window.innerWidth - 300, window.scrollX + rect.left)) + 'px';
    pop.hidden = false;
  });


  // 📱 手机端长难句手势滑动切句 (Swipe Left = 下一句, Swipe Right = 上一句)
  (function initTranslateTouchGestures() {
    var mainEl = document.querySelector('.trans-layout') || document.body;
    var startX = 0, startY = 0, startTime = 0;

    mainEl.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    }, { passive: true });

    mainEl.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        var dt = Date.now() - startTime;

        // Swipe horizontal
        if (Math.abs(dx) > 75 && Math.abs(dy) < 60 && dt < 450) {
          // If not interacting inside a textarea/input
          if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
          if (dx < 0) {
            // Next
            if (curIdx < filtered.length - 1) {
              curIdx++;
              renderCurrent();
              if (window.KaoyanToast) window.KaoyanToast('👉 下一句 (' + (curIdx + 1) + '/' + filtered.length + ')');
              if (navigator.vibrate) try { navigator.vibrate(12); } catch(err){}
            }
          } else {
            // Prev
            if (curIdx > 0) {
              curIdx--;
              renderCurrent();
              if (window.KaoyanToast) window.KaoyanToast('👈 上一句 (' + (curIdx + 1) + '/' + filtered.length + ')');
              if (navigator.vibrate) try { navigator.vibrate(12); } catch(err){}
            }
          }
        }
      }
    }, { passive: true });
  })();

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

})();
