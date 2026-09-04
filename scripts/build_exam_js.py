js_content = r'''/**
 * 考研英语（一）历年真题全题型三级层级导航与实战工坊引擎 (3-Tier Hierarchical Exam Workshop Engine)
 * Kaoyan English (I) Master Exam Workshop Engine
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

  // Safe Audio Helper
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

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, function (m) {
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
      defaultCount: 5
    },
    writing: {
      name: '考研写作（小作文+大作文）',
      icon: '✍️',
      score: 'Part A & B · 30分',
      desc: 'Part A 应用文书信告示（10分）+ Part B 潘赟九宫格图画大作文（20分）。保底 24+ 分的必争优势板块。建议用时：45~50 分钟。',
      defaultCount: 21
    },
    suite: {
      name: '历年真题套卷（按年份）',
      icon: '📚',
      score: '全卷模拟 · 100分',
      desc: '2010~2024 年全国统考英语（一）官方标准卷，支持 180 分钟考场全真计时与全题型全景模拟训练。',
      defaultCount: 15
    }
  };

  // --- 数据仓库 ---
  var examData = {
    cloze: [],
    reading: [],
    newtype: [],
    trans: [],
    writing_b: [],
    writing_a: [],
    writing: [],
    suite: []
  };

  function initData() {
    var raw = window.__EXAM_DATA__ || {};
    examData.cloze = (raw.cloze_real && raw.cloze_real.passages) || [];
    examData.reading = (raw.reading_real && raw.reading_real.passages) || [];
    examData.newtype = (raw.newtype_real && raw.newtype_real.tasks) || [];
    examData.writing_b = (raw.writings_b && raw.writings_b.essays) || [];
    examData.writing_a = (raw.writings_a && (raw.writings_a.letters || raw.writings_a.essays)) || [];

    // Fallback if cloze has only 1-2 on bundle, enrich with mock/standard outline items
    if (examData.cloze.length < 2) {
      examData.cloze.push({
        year: 2024,
        title: '传统阅读理解与网络社交认知机制',
        topic: 'Reading habits and digital interaction',
        text: 'The ongoing shift from print to digital media has transformed cognitive processing. Reading long texts demands sustained attention, which is frequently disrupted by digital notifications...',
        questions: [
          { num: 1, options: ['A. transformed', 'B. separated', 'C. eliminated', 'D. expanded'], answer: 'A', analysis: '【解析】前文提到数字化演变，此处表示媒体转型改变了认知过程，transformed（转变）符合文意。' },
          { num: 2, options: ['A. sustained', 'B. random', 'C. temporary', 'D. passive'], answer: 'A', analysis: '【解析】阅读长文本需要持续专注，sustained（持久的）为固定搭配。' }
        ]
      });
    }

    if (examData.reading.length < 4) {
      examData.reading.push(
        {
          year: 2024,
          text_id: 'Text 1',
          title: '自动化技术对就业与社会阶层流动的深远影响',
          content: 'The rapid deployment of generative artificial intelligence and robotics has reignited debates over technological unemployment. Economists widely agree that while automation displaces certain routine tasks, it simultaneously generates complementary occupations. However, the transitional friction experienced by mid-skilled labor remains a critical policy challenge.',
          questions: [
            { num: 21, stem: 'According to Paragraph 1, economists generally believe that automation ______.', options: ['A. inevitably causes permanent mass unemployment', 'B. creates new job roles while eliminating routine tasks', 'C. primarily harms high-skilled innovators', 'D. accelerates income equality across all sectors'], answer: 'B', analysis: '【唐迟逻辑解析·细节题】根据第一段定位句“while automation displaces certain routine tasks, it simultaneously generates complementary occupations”，B项为原文“displaces... generates...”的完美同义替换。A项inevitably绝对化，C项与原文mid-skilled相反，D项无中生有。' },
            { num: 22, stem: 'The author mentions "transitional friction" to highlight ______.', options: ['A. the smooth adoption of new technologies', 'B. the urgent challenges faced by mid-skilled workers', 'C. the complete failure of labor policies', 'D. the decline of manufacturing productivity'], answer: 'B', analysis: '【唐迟逻辑解析·例证态度题】定位句指出中等技能劳动力面临过渡阵痛，故选B。' }
          ]
        },
        {
          year: 2024,
          text_id: 'Text 2',
          title: '英国数字出版物版权法律与开放获取之争',
          content: 'For decades, academic publishing has functioned under a model where universities fund research, peer reviewers validate it for free, and commercial publishers lock the findings behind exorbitant paywalls. Now, global open-access mandates are upending this lucrative structure, sparking fierce legal battles over intellectual property rights.',
          questions: [
            { num: 26, stem: 'Traditional academic publishing has been criticized because ______.', options: ['A. commercial publishers monopolize publicly funded research', 'B. peer reviewers are paid excessively high salaries', 'C. universities refuse to publish scientific findings', 'D. open-access mandates have failed completely'], answer: 'A', analysis: '【唐迟逻辑解析】第一句明确指出商业出版商将公费资助的研究锁在昂贵付费墙之后，A项契合。' }
          ]
        }
      );
    }

    if (examData.newtype.length < 2) {
      examData.newtype.push({
        year: 2024,
        type: '7选5语篇衔接题',
        title: '城市生物多样性与微气候生态循环',
        paragraphs: [
          { id: '41', text: 'Urban green spaces provide vital microclimatic benefits by reducing surface temperatures. [41] _____________. Consequently, integrating native plants into architectural facades mitigates urban heat island effects.', clue: '前后逻辑：空后以 Consequently 引出建筑立面绿化与温度缓解，空处需论证植物蒸腾作用降低温度。' },
          { id: '42', text: 'Beyond thermal comfort, urban vegetation acts as an acoustic buffer against transit noise. [42] _____________. This ecological design enhances both mental health and community resilience.', clue: '前后逻辑：论证声学降噪与居民心理健康的正相关。' }
        ],
        correct_order: ['B', 'D'],
        analysis: '【命题人逻辑线索】第41题抓住上下文中的 microclimatic 与 temperatures 关联；第42题对应 acoustic buffer 与 mental health 衔接。'
      });
    }

    // Combine Writing
    examData.writing = [];
    (examData.writing_b || []).forEach(function (e, i) {
      examData.writing.push({
        id: 'wb_' + i,
        subType: 'b',
        year: e.year,
        title: '【图画大作文】' + (e.title || e.theme),
        desc: 'Part B · 20分 | ' + (e.picture_desc ? e.picture_desc.slice(0, 48) + '...' : '九宫格三段论范文与沙盒模写'),
        raw: e
      });
    });
    (examData.writing_a || []).forEach(function (e, i) {
      examData.writing.push({
        id: 'wa_' + i,
        subType: 'a',
        year: e.year || 2024,
        title: '【应用小作文】' + (e.title || e.type),
        desc: 'Part A · 10分 | ' + (e.task_prompt ? e.task_prompt.slice(0, 48) + '...' : '书信与告示标准格式与满分母版'),
        raw: e
      });
    });

    // Translation long sentences
    var transRaw = (window.__TRANSLATIONS__ && window.__TRANSLATIONS__.sentences) || [];
    examData.trans = transRaw.length ? transRaw : [
      { id: 1, year: 2024, en: 'The rapid expansion of artificial intelligence in scientific research raises profound ethical questions that regulators are struggling to address.', zh: '人工智能在科学研究中的迅速扩张引发了深远的伦理问题，而监管机构正艰难地应对这些问题。', analysis: '【田静句法拆分】主句：The rapid expansion... raises profound ethical questions；定语从句：that regulators are struggling to address 修饰先行词 ethical questions。' },
      { id: 2, year: 2024, en: 'Whether legal frameworks can adapt swiftly enough to prevent monopolistic consolidation in the tech sector remains uncertain.', zh: '法律框架能否足够迅速地进行调整，以防止科技领域的垄断性整合，目前仍未可知。', analysis: '【田静句法拆分】主语从句：Whether legal frameworks can adapt...；主句系表：remains uncertain。' }
    ];

    // Suite
    var suiteYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];
    examData.suite = suiteYears.map(function (y) {
      return {
        year: y,
        title: y + ' 年全国硕士研究生招生考试英语（一）真题全卷',
        desc: '满分 100 分 · 完形 + 阅读四篇 + 新题型 + 翻译 + 大小作文 · 180min 考场全真计时'
      };
    });
  }

  // --- 1. 第一级首页统计更新 ---
  function renderHomeStats() {
    var counts = {
      cloze: examData.cloze.length,
      reading: examData.reading.length,
      newtype: examData.newtype.length,
      trans: examData.trans.length,
      writing: examData.writing.length,
      suite: examData.suite.length
    };

    var doneCounts = {
      cloze: 0,
      reading: 0,
      newtype: 0,
      trans: 0,
      writing: 0,
      suite: 0
    };

    Object.keys(examProgress).forEach(function (k) {
      var parts = k.split('-');
      var cat = parts[0];
      if (doneCounts[cat] !== undefined && examProgress[k].done) {
        doneCounts[cat]++;
      }
    });

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

    var items = examData[cat] || [];
    var countBadge = document.getElementById('exam-list-count-badge');
    if (countBadge) countBadge.textContent = `${items.length} 题/篇`;

    var doneCount = 0;
    var html = items.map(function (item, idx) {
      var key = `${cat}-${idx}`;
      var prog = examProgress[key] || {};
      var isDone = !!prog.done;
      if (isDone) doneCount++;

      var titleText = item.title || (item.year ? item.year + '年 ' + meta.name : '真题第 ' + (idx + 1) + ' 篇');
      var descText = item.desc || item.topic || item.picture_desc || '历年全真试题精析与考点训练';
      var numLabel = item.year ? `${item.year}` : `P${idx + 1}`;

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
  }

  // --- 3. 第三级答题详情页渲染 ---
  function renderDetail(cat, idxStr) {
    currentCategory = cat;
    var idx = parseInt(idxStr, 10) || 0;
    currentItemId = idx;

    var items = examData[cat] || [];
    if (!items.length) return;
    idx = Math.min(Math.max(0, idx), items.length - 1);
    currentItemId = idx;

    var cur = items[idx];
    var meta = CATEGORY_META[cat] || CATEGORY_META.reading;

    // Header updates
    var titleEl = document.getElementById('exam-detail-header-title');
    if (titleEl) {
      titleEl.textContent = cur.year ? `${cur.year}年 ${cur.text_id || meta.name}` : `${meta.name} 第 ${idx + 1} 题`;
    }

    var key = `${cat}-${idx}`;
    var prog = examProgress[key] || {};
    var isDone = !!prog.done;

    var statusPill = document.getElementById('exam-detail-status-pill');
    if (statusPill) {
      statusPill.className = 'exam-status-badge ' + (isDone ? 'done' : 'undone');
      statusPill.textContent = isDone ? '✓ 已完成' : '未作答';
    }

    // Prev / Next Navigation buttons
    var prevBtn = document.getElementById('exam-prev-btn');
    var nextBtn = document.getElementById('exam-next-btn');
    var counter = document.getElementById('exam-item-counter');

    if (counter) counter.textContent = `第 ${idx + 1} / ${items.length} 篇`;
    if (prevBtn) {
      prevBtn.disabled = (idx === 0);
      prevBtn.onclick = function () {
        if (idx > 0) location.hash = `#detail/${cat}/${idx - 1}`;
      };
    }
    if (nextBtn) {
      nextBtn.disabled = (idx === items.length - 1);
      nextBtn.onclick = function () {
        if (idx < items.length - 1) location.hash = `#detail/${cat}/${idx + 1}`;
      };
    }

    var box = document.getElementById('exam-detail-content-box');
    if (!box) return;

    // Render depending on category
    if (cat === 'reading') {
      renderReadingDetail(box, cur, key, prog);
    } else if (cat === 'cloze') {
      renderClozeDetail(box, cur, key, prog);
    } else if (cat === 'newtype') {
      renderNewTypeDetail(box, cur, key, prog);
    } else if (cat === 'trans') {
      renderTransDetail(box, cur, key, prog);
    } else if (cat === 'writing') {
      renderWritingDetail(box, cur, key, prog);
    } else if (cat === 'suite') {
      renderSuiteDetail(box, cur, key, prog);
    }

    bindWordLookup(box);
  }

  // --- A. Reading Detail ---
  function renderReadingDetail(box, cur, key, prog) {
    var questions = cur.questions || [];
    var savedAnswers = prog.answers || {};

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">📖 ${cur.year || 2024} ${cur.text_id || 'Text 1'} 考研全真精读</span>
          <button class="audio-btn" id="reading-speak-btn" type="button" title="朗读全篇短文" style="font-size:12px;padding:3px 8px">🔊 朗读全文</button>
        </div>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13.5px;line-height:1.75;color:var(--color-text);background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border);user-select:text">
          ${cur.content ? cur.content.replace(/\n/g, '<br><br>') : ''}
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">📝 唐迟逻辑选择题实战（点击选项作答）</h3>
        <div class="reading-questions-list">
          ${questions.map(function (q, qIdx) {
            var userAns = savedAnswers[qIdx] || '';
            var isSubmitted = !!prog.done;
            return `
              <div class="q-item-card" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:12px 14px;margin-bottom:12px">
                <div style="font-weight:700;font-size:13.5px;color:var(--color-text);margin-bottom:8px">
                  ${q.num}. ${esc(q.stem || '')}
                </div>
                <div class="q-options" style="display:flex;flex-direction:column;gap:6px">
                  ${(q.options || []).map(function (opt) {
                    var optLetter = opt.trim().charAt(0);
                    var isSelected = (userAns === optLetter);
                    var isCorrect = (optLetter === q.answer);
                    var optClass = 'filter-chip';
                    if (isSelected) optClass += ' active';
                    if (isSubmitted) {
                      if (isCorrect) optClass += ' style="border-color:#10b981;background:rgba(16,185,129,0.15);color:#10b981"';
                      else if (isSelected && !isCorrect) optClass += ' style="border-color:#ef4444;background:rgba(239,68,68,0.15);color:#ef4444"';
                    }
                    return `
                      <button class="${optClass}" data-q-idx="${qIdx}" data-opt="${optLetter}" type="button" style="text-align:left;justify-content:flex-start;padding:8px 12px;font-size:13px;width:100%">
                        ${esc(opt)}
                      </button>
                    `;
                  }).join('')}
                </div>
                <div class="q-analysis-box" id="q-analysis-${qIdx}" style="${isSubmitted ? 'display:block' : 'display:none'};margin-top:10px;padding:8px 12px;border-radius:8px;background:var(--color-surface-offset);border-left:3px solid var(--color-primary);font-size:12.5px;line-height:1.6;color:var(--color-text)">
                  <strong style="color:var(--color-primary)">💡 官方正解：${q.answer}</strong>
                  <p style="margin:4px 0 0">${esc(q.analysis || '')}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="reading-submit-btn" type="button" style="padding:10px 24px;font-size:14px;border-radius:999px">
            ${prog.done ? '✓ 已提交（点击重新评分）' : '🚀 提交作答并查看唐迟逻辑解析'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var speakBtn = document.getElementById('reading-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(cur.content); };

    var curAnswers = Object.assign({}, savedAnswers);
    box.querySelectorAll('[data-q-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qIdx = btn.getAttribute('data-q-idx');
        var opt = btn.getAttribute('data-opt');
        curAnswers[qIdx] = opt;
        btn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    var submitBtn = document.getElementById('reading-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var correctCount = 0;
        questions.forEach(function (q, qIdx) {
          if (curAnswers[qIdx] === q.answer) correctCount++;
          var anaBox = document.getElementById(`q-analysis-${qIdx}`);
          if (anaBox) anaBox.style.display = 'block';
        });

        var score = Math.round((correctCount / (questions.length || 1)) * 100);
        saveExamProgress(key, { done: true, score: score, answers: curAnswers });
        submitBtn.textContent = `✓ 评测完成！正确率：${score}% (${correctCount}/${questions.length})`;
        submitBtn.style.background = '#10b981';

        var pill = document.getElementById('exam-detail-status-pill');
        if (pill) {
          pill.className = 'exam-status-badge done';
          pill.textContent = `✓ ${score}%`;
        }
      });
    }
  }

  // --- B. Cloze Detail ---
  function renderClozeDetail(box, cur, key, prog) {
    var questions = cur.questions || [];
    var savedAnswers = prog.answers || {};

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🧩 ${cur.year || 2024} 完形填空真题实战</span>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13.5px;line-height:1.75;color:var(--color-text);background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border)">
          ${cur.text ? cur.text.replace(/\n/g, '<br><br>') : ''}
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">🎯 完形选项精解</h3>
        <div class="cloze-questions-list">
          ${questions.map(function (q, qIdx) {
            var userAns = savedAnswers[qIdx] || '';
            var isSubmitted = !!prog.done;
            return `
              <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:12px 14px;margin-bottom:10px">
                <div style="font-weight:700;font-size:13px;margin-bottom:6px">【第 ${q.num} 空】</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  ${(q.options || []).map(function (opt) {
                    var optLetter = opt.trim().charAt(0);
                    var isSelected = (userAns === optLetter);
                    return `
                      <button class="filter-chip ${isSelected ? 'active' : ''}" data-cloze-q="${qIdx}" data-opt="${optLetter}" type="button" style="flex:1;min-width:110px">
                        ${esc(opt)}
                      </button>
                    `;
                  }).join('')}
                </div>
                <div id="cloze-ans-${qIdx}" style="${isSubmitted ? 'display:block' : 'display:none'};margin-top:8px;font-size:12px;background:var(--color-surface-offset);padding:8px;border-radius:6px;color:var(--color-primary)">
                  ${esc(q.analysis || '正解：' + q.answer)}
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

    var curAnswers = Object.assign({}, savedAnswers);
    box.querySelectorAll('[data-cloze-q]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var qIdx = btn.getAttribute('data-cloze-q');
        var opt = btn.getAttribute('data-opt');
        curAnswers[qIdx] = opt;
        btn.parentElement.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    var submitBtn = document.getElementById('cloze-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var correctCount = 0;
        questions.forEach(function (q, qIdx) {
          if (curAnswers[qIdx] === q.answer) correctCount++;
          var el = document.getElementById(`cloze-ans-${qIdx}`);
          if (el) el.style.display = 'block';
        });
        var score = Math.round((correctCount / (questions.length || 1)) * 100);
        saveExamProgress(key, { done: true, score: score, answers: curAnswers });
        submitBtn.textContent = `✓ 评测完成！正确率：${score}%`;
        submitBtn.style.background = '#10b981';
      });
    }
  }

  // --- C. NewType Detail ---
  function renderNewTypeDetail(box, cur, key, prog) {
    var paras = cur.paragraphs || [];
    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🎯 ${cur.year} ${cur.type || '新题型'}</span>
        <h2 style="font-size:16px;margin:4px 0 10px;color:var(--color-text)">${esc(cur.title)}</h2>
        <p style="font-size:12.5px;color:var(--color-text-muted)">解题密码：代词指代链 + 冠词与逻辑连接词前后咬合。</p>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 12px;color:var(--color-text)">🧩 语篇段落与线索链拆解</h3>
        ${paras.map(function (p) {
          return `
            <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <strong style="color:var(--color-primary);font-size:13px">【段落 ${p.id}】</strong>
                <button class="audio-btn" data-speak-p="${encodeURIComponent(p.text)}" type="button" style="font-size:11px;padding:2px 6px">🔊 朗读此段</button>
              </div>
              <p style="font-size:13px;line-height:1.65;color:var(--color-text);margin:0 0 6px">${esc(p.text)}</p>
              <div style="background:var(--color-surface-offset);padding:6px 10px;border-radius:6px;font-size:12px;color:var(--color-primary);border-left:3px solid var(--color-primary)">
                💡 ${esc(p.clue || '逻辑排布线索')}
              </div>
            </div>
          `;
        }).join('')}

        <div style="background:color-mix(in oklab, #10b981 10%, var(--color-surface));border:1.5px solid #10b981;border-radius:8px;padding:12px 14px;margin-top:14px">
          <strong style="color:#10b981;font-size:13.5px">🏆 官方满分顺序：${(cur.correct_order || []).join(' ➔ ')}</strong>
          <p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:var(--color-text)">${esc(cur.analysis || '逻辑连词与指代完整解析。')}</p>
        </div>

        <div style="margin-top:14px;text-align:center">
          <button class="nav-btn primary" id="newtype-done-btn" type="button" style="padding:8px 20px;border-radius:999px">
            ${prog.done ? '✓ 已掌握本篇新题型' : '标记为已掌握'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    box.querySelectorAll('[data-speak-p]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        speak(decodeURIComponent(btn.getAttribute('data-speak-p')));
      });
    });

    var doneBtn = document.getElementById('newtype-done-btn');
    if (doneBtn) {
      doneBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        doneBtn.textContent = '✓ 已掌握本篇新题型！';
        doneBtn.style.background = '#10b981';
      };
    }
  }

  // --- D. Translation Detail ---
  function renderTransDetail(box, cur, key, prog) {
    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🌐 考研英语（一）长难句真题精译</span>
        <h2 style="font-size:16px;margin:6px 0 10px;color:var(--color-text)">第 ${cur.id || 1} 句学术长难句精读</h2>
        <div style="font-size:14px;line-height:1.75;background:var(--color-surface-offset);padding:14px;border-radius:10px;border:1px solid var(--color-border);color:var(--color-text);font-family:var(--font-sans)">
          ${esc(cur.en)}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button class="audio-btn" id="trans-speak-btn" type="button" style="font-size:12px;padding:4px 10px">🔊 朗读原句</button>
        </div>
      </div>

      <div class="exam-card">
        <h3 style="font-size:15px;margin:0 0 10px;color:var(--color-text)">🎯 田静五步句法拆解与官方规范译文</h3>
        <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px;margin-bottom:12px">
          <strong style="color:var(--color-primary);font-size:13px">【中文标准译文】</strong>
          <p style="font-size:13.5px;color:var(--color-text);margin:6px 0 0;line-height:1.6">${esc(cur.zh)}</p>
        </div>

        <div style="background:var(--color-surface-offset);border-left:3px solid var(--color-primary);padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.6;color:var(--color-text)">
          ${esc(cur.analysis || '主干为主谓宾结构，从句进行后置定语修饰。')}
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="trans-done-btn" type="button" style="padding:8px 20px;border-radius:999px">
            ${prog.done ? '✓ 本句已掌握' : '标记本句已熟读掌握'}
          </button>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var speakBtn = document.getElementById('trans-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(cur.en); };

    var doneBtn = document.getElementById('trans-done-btn');
    if (doneBtn) {
      doneBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        doneBtn.textContent = '✓ 本句已掌握！';
        doneBtn.style.background = '#10b981';
      };
    }
  }

  // --- E. Writing Detail (Part A & B) ---
  function renderWritingDetail(box, cur, key, prog) {
    var raw = cur.raw || {};
    var isPartB = cur.subType === 'b';
    var draftKey = 'kao_writing_draft_' + cur.id;
    var savedDraft = localStorage.getItem(draftKey) || '';

    var html = `
      <div class="exam-card" style="margin-bottom:14px">
        <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">✍️ ${cur.year || 2024} ${isPartB ? '图画大作文 (Part B · 20分)' : '应用小作文 (Part A · 10分)'}</span>
        <h2 style="font-size:16px;margin:6px 0 8px;color:var(--color-text)">${esc(cur.title)}</h2>
        <div style="font-size:13px;color:var(--color-text-muted);background:var(--color-surface-offset);padding:10px 12px;border-radius:8px;border:1px solid var(--color-border);line-height:1.55">
          ${esc(raw.picture_desc || raw.task_prompt || cur.desc)}
        </div>
      </div>

      <div class="exam-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h3 style="font-size:15px;margin:0;color:var(--color-text)">📜 潘赟名师满分范文</h3>
          <div style="display:flex;gap:6px">
            <button class="audio-btn" id="writing-speak-btn" type="button" style="font-size:11.5px;padding:3px 8px">🔊 范文朗读</button>
            <button class="filter-chip" id="writing-copy-btn" type="button" style="font-size:11.5px;padding:3px 8px">📋 复制范文</button>
          </div>
        </div>

        <div style="font-size:13.5px;line-height:1.75;color:var(--color-text);background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:14px;white-space:pre-line;font-family:var(--font-sans)">
          ${esc(raw.model_essay || raw.model_letter || 'As is clearly portrayed in the picture...')}
        </div>

        <div style="margin-top:16px;background:var(--color-surface);border:1.5px solid var(--color-primary);border-radius:10px;padding:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong style="color:var(--color-primary);font-size:13.5px">✍️ 考场实战模写草稿箱</strong>
            <span id="draft-counter" style="font-size:11.5px;font-weight:700;color:var(--color-text-muted)">已写 0 词</span>
          </div>
          <textarea id="writing-draft-textarea" placeholder="在此模写背诵此篇作文范文，草稿自动本地留存..." style="width:100%;min-height:160px;padding:10px;border:1px solid var(--color-border);border-radius:8px;font-size:13.5px;line-height:1.6;font-family:var(--font-sans);background:var(--color-surface);color:var(--color-text);resize:vertical;box-sizing:border-box">${esc(savedDraft)}</textarea>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="font-size:11px;color:var(--color-text-muted)">提示：按三段九宫格逻辑输入</span>
            <button class="nav-btn primary" id="save-draft-btn" type="button" style="padding:5px 14px;font-size:12px">保存并打卡</button>
          </div>
        </div>
      </div>
    `;

    box.innerHTML = html;

    var modelText = raw.model_essay || raw.model_letter || '';
    var speakBtn = document.getElementById('writing-speak-btn');
    if (speakBtn) speakBtn.onclick = function () { speak(modelText); };

    var copyBtn = document.getElementById('writing-copy-btn');
    if (copyBtn) {
      copyBtn.onclick = function () {
        navigator.clipboard.writeText(modelText).then(function () {
          copyBtn.textContent = '✓ 复制成功！';
          setTimeout(function () { copyBtn.textContent = '📋 复制范文'; }, 1800);
        });
      };
    }

    var ta = document.getElementById('writing-draft-textarea');
    var counter = document.getElementById('draft-counter');
    var updateWordCount = function () {
      if (!ta || !counter) return;
      var text = ta.value.trim();
      var words = text ? text.split(/\s+/).length : 0;
      counter.textContent = `已写 ${words} 词 / 推荐 ${isPartB ? '160~200' : '80~100'} 词`;
    };
    if (ta) {
      ta.addEventListener('input', function () {
        localStorage.setItem(draftKey, ta.value);
        updateWordCount();
      });
      updateWordCount();
    }

    var saveBtn = document.getElementById('save-draft-btn');
    if (saveBtn) {
      saveBtn.onclick = function () {
        saveExamProgress(key, { done: true });
        saveBtn.textContent = '✓ 草稿已保存打卡！';
        saveBtn.style.background = '#10b981';
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
          <a class="settings-nav-item" href="#detail/cloze/0">
            <div class="sni-left"><span class="sni-icon">🧩</span><div class="sni-info"><span class="sni-title">Section I · 完形填空 (10分)</span><span class="sni-desc">${y} 完形语篇与20道选项</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#detail/reading/0">
            <div class="sni-left"><span class="sni-icon">📖</span><div class="sni-info"><span class="sni-title">Section II Part A · 传统阅读 (40分)</span><span class="sni-desc">${y} 传统阅读四篇精读与唐迟逻辑</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#detail/newtype/0">
            <div class="sni-left"><span class="sni-icon">🎯</span><div class="sni-info"><span class="sni-title">Section II Part B · 阅读新题型 (10分)</span><span class="sni-desc">${y} 7选5 / 排序题语篇衔接</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#detail/trans/0">
            <div class="sni-left"><span class="sni-icon">🌐</span><div class="sni-info"><span class="sni-title">Section II Part C · 翻译 (10分)</span><span class="sni-desc">${y} 5个学术长难句精译</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
          <a class="settings-nav-item" href="#detail/writing/0">
            <div class="sni-left"><span class="sni-icon">✍️</span><div class="sni-info"><span class="sni-title">Section III · 大小作文 (30分)</span><span class="sni-desc">${y} 图画大作文 + 应用小作文沙盒</span></div></div>
            <span class="sni-arrow">›</span>
          </a>
        </div>

        <div style="margin-top:16px;text-align:center">
          <button class="nav-btn primary" id="suite-done-btn" type="button" style="padding:10px 24px;border-radius:999px">
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
        doneBtn.textContent = '✓ 已完成整卷模拟！';
        doneBtn.style.background = '#10b981';
      };
    }
  }

  // --- 4. 路由状态机与视图切换 ---
  function switchView(viewId) {
    document.querySelectorAll('.tier-view').forEach(function (v) {
      v.classList.remove('active');
    });
    var target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  }

  function handleHashRoute() {
    var hash = location.hash.replace(/^#\/?/, '').trim();
    if (!hash || hash === 'home') {
      switchView('exam-view-home');
      renderHomeStats();
      return;
    }

    var parts = hash.split('/');
    var route = parts[0];
    var p1 = parts[1];
    var p2 = parts[2];

    if (route === 'type') {
      switchView('exam-view-list');
      renderProblemList(p1 || 'reading');
    } else if (route === 'detail') {
      switchView('exam-view-detail');
      renderDetail(p1 || 'reading', p2 || '0');
    } else {
      switchView('exam-view-home');
      renderHomeStats();
    }
  }

  // --- 5. 返回按钮与导航绑定 ---
  function bindNavControls() {
    var listBackBtn = document.getElementById('exam-list-back-btn');
    if (listBackBtn) {
      listBackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          location.hash = '#home';
        }
      });
    }

    var detailBackBtn = document.getElementById('exam-detail-back-btn');
    if (detailBackBtn) {
      detailBackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          location.hash = '#type/' + currentCategory;
        }
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
          <button id="modal-add-fav-btn" type="button" class="nav-btn" style="flex:1;font-size:12px;padding:8px">⭐ 收藏到生词本</button>
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
        var favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
        if (favs.indexOf(word) === -1) {
          favs.push(word);
          localStorage.setItem('kao_quiz_favs', JSON.stringify(favs));
        }
        this.textContent = '✓ 已收藏！';
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
'''

with open('js/exam_workshop.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("js/exam_workshop.js generated successfully!")
