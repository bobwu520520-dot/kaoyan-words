/**
 * 考研英语（一）历年真题全题型互动学习与实战工坊引擎 (Full 6-Workshop Suite with Writing Sandbox)
 * Kaoyan English (I) Master Exam Workshop Engine
 */

(function () {
  'use strict';

  // Global Workshop State Management
  var state = {
    activeSec: localStorage.getItem('kao_exam_active_sec') || 'reading',
    writingB: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_writing_b') || '0', 10), mode: localStorage.getItem('kao_exam_mode_writing_b') || 'breakdown' },
    writingA: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_writing_a') || '0', 10), mode: localStorage.getItem('kao_exam_mode_writing_a') || 'breakdown' },
    trans: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_trans') || '0', 10) },
    reading: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_reading') || '0', 10) },
    cloze: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_cloze') || '0', 10) },
    newtype: { data: [], curIdx: parseInt(localStorage.getItem('kao_exam_idx_newtype') || '0', 10) }
  };

  // Safe Audio Helper
  function speak(text) {
    if (!text) return;
    if (window.KaoyanAudio && window.KaoyanAudio.speak) {
      window.KaoyanAudio.speak(text);
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  }

  // --- 1. 图画大作文工坊 (Writing Part B) ---
  function initWritingB() {
    var container = document.getElementById('writing-b-workshop-root');
    if (!container) return;

    if (window.__EXAM_WRITINGS_B__ && window.__EXAM_WRITINGS_B__.essays) {
      state.writingB.data = window.__EXAM_WRITINGS_B__.essays || [];
      renderWritingB();
      return;
    }

    fetch('data/writings_b.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.writingB.data = json.essays || [];
        renderWritingB();
      })
      .catch(function (err) {
        if (window.__EXAM_WRITINGS_B__ && window.__EXAM_WRITINGS_B__.essays) {
          state.writingB.data = window.__EXAM_WRITINGS_B__.essays || [];
          renderWritingB();
        } else {
          console.error('Failed to load writings_b.json', err);
        }
      });
  }

  function renderWritingB() {
    var container = document.getElementById('writing-b-workshop-root');
    if (!container || !state.writingB.data.length) return;

    var essays = state.writingB.data;
    var idx = Math.min(Math.max(0, state.writingB.curIdx), essays.length - 1);
    state.writingB.curIdx = idx;
    localStorage.setItem('kao_exam_idx_writing_b', idx);

    var cur = essays[idx];
    var curMode = state.writingB.mode;

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🎨 ${cur.year} 考研英语（一）真题</span>
            <h3 style="margin:4px 0 0;font-size:16px">${cur.title}</h3>
          </div>
          <div class="ws-actions">
            <div class="year-chips">
              ${essays.map(function (e, i) {
                return `<button class="filter-chip ${i === idx ? 'active' : ''}" data-wb-idx="${i}" type="button">${e.year}年</button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="ws-prompt-card">
          <div style="font-size:12.5px;color:var(--color-text-muted);margin-bottom:4px"><strong>🖼️ 图画情境还原与主题寓意：</strong></div>
          <div style="font-size:13.5px;line-height:1.6;color:var(--color-text)">${cur.picture_desc}</div>
          <div style="margin-top:6px;font-size:12.5px;color:var(--color-primary)"><strong>💡 核心立意主题：</strong> ${cur.topic}</div>
        </div>

        <div class="ws-view-tabs" style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">
          <button class="filter-chip ${curMode === 'breakdown' ? 'active' : ''}" id="wb-view-breakdown" type="button">🧩 潘赟九宫格逐句精读</button>
          <button class="filter-chip ${curMode === 'full' ? 'active' : ''}" id="wb-view-full" type="button">📜 满分范文与一键复制</button>
          <button class="filter-chip ${curMode === 'sandbox' ? 'active' : ''}" id="wb-view-sandbox" type="button">✍️ 考场实战模写草稿箱</button>
          <button class="audio-btn" id="wb-speak-all" type="button" title="朗读全篇范文" style="margin-left:auto">🔊 朗读全篇</button>
          <button class="copy-btn" id="wb-copy-all" data-copy="${encodeURIComponent(cur.model_essay)}" type="button" style="position:static">📋 复制全篇范文</button>
        </div>

        <div class="ws-body-content">
          ${curMode === 'breakdown' ? renderWritingBBreakdown(cur) : (curMode === 'sandbox' ? renderWritingBSandbox(cur) : renderWritingBFull(cur))}
        </div>

        <div class="ws-nav-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--color-border)">
          <button class="nav-btn" id="wb-prev-btn" ${idx === 0 ? 'disabled' : ''} type="button">← 上一年真题</button>
          <span style="font-size:12.5px;color:var(--color-text-muted)">真题第 ${idx + 1} / ${essays.length} 篇</span>
          <button class="nav-btn" id="wb-next-btn" ${idx === essays.length - 1 ? 'disabled' : ''} type="button">下一年真题 →</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('[data-wb-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.writingB.curIdx = parseInt(btn.getAttribute('data-wb-idx'), 10);
        renderWritingB();
      });
    });

    var viewBreakdownBtn = document.getElementById('wb-view-breakdown');
    var viewFullBtn = document.getElementById('wb-view-full');
    var viewSandboxBtn = document.getElementById('wb-view-sandbox');
    if (viewBreakdownBtn) viewBreakdownBtn.addEventListener('click', function () {
      state.writingB.mode = 'breakdown';
      localStorage.setItem('kao_exam_mode_writing_b', 'breakdown');
      renderWritingB();
    });
    if (viewFullBtn) viewFullBtn.addEventListener('click', function () {
      state.writingB.mode = 'full';
      localStorage.setItem('kao_exam_mode_writing_b', 'full');
      renderWritingB();
    });
    if (viewSandboxBtn) viewSandboxBtn.addEventListener('click', function () {
      state.writingB.mode = 'sandbox';
      localStorage.setItem('kao_exam_mode_writing_b', 'sandbox');
      renderWritingB();
    });

    var prevBtn = document.getElementById('wb-prev-btn');
    var nextBtn = document.getElementById('wb-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (state.writingB.curIdx > 0) {
        state.writingB.curIdx--;
        renderWritingB();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (state.writingB.curIdx < essays.length - 1) {
        state.writingB.curIdx++;
        renderWritingB();
      }
    });

    var speakAllBtn = document.getElementById('wb-speak-all');
    if (speakAllBtn) speakAllBtn.addEventListener('click', function () {
      speak(cur.model_essay);
    });

    var copyAllBtn = document.getElementById('wb-copy-all');
    if (copyAllBtn) copyAllBtn.addEventListener('click', function () {
      var raw = decodeURIComponent(copyAllBtn.getAttribute('data-copy'));
      navigator.clipboard.writeText(raw).then(function () {
        var orig = copyAllBtn.textContent;
        copyAllBtn.textContent = '✓ 复制成功！';
        setTimeout(function () { copyAllBtn.textContent = orig; }, 1800);
      });
    });

    container.querySelectorAll('.wb-sentence-speak').forEach(function (btn) {
      btn.addEventListener('click', function () {
        speak(btn.getAttribute('data-sentence'));
      });
    });

    if (curMode === 'sandbox') {
      bindWritingBSandbox(cur, container);
    }

    bindWordLookup(container);
  }

  function renderWritingBBreakdown(cur) {
    var paras = cur.paragraphs || [];
    var vocab = cur.key_vocab || [];
    return paras.map(function (p) {
      return `
        <div class="essay-para-card" style="margin-bottom:14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px">
          <div style="font-weight:700;font-size:13px;color:var(--color-primary);margin-bottom:8px">
            <span>📌 ${p.para_title}</span>
          </div>
          <div class="para-sentences">
            ${(p.sentences || []).map(function (s) {
              return `
                <div class="sentence-item" style="padding:8px 0;border-bottom:1px dashed var(--color-border);font-size:13px;line-height:1.6">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                    <div>
                      <span class="role-tag" style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:var(--color-surface-offset);color:var(--color-primary);font-weight:600">${s.role || ''}</span>
                      <p style="margin:4px 0 2px;color:var(--color-text);font-family:var(--font-sans)">${s.en}</p>
                      <p style="margin:0;color:var(--color-text-muted);font-size:12.5px">${s.zh}</p>
                    </div>
                    <button class="audio-btn wb-sentence-speak" data-sentence="${encodeURIComponent(s.en)}" type="button" title="朗读此句" style="flex-shrink:0;width:24px;height:24px;font-size:11px">🔊</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('') + (vocab.length ? `
      <div class="key-vocab-card" style="margin-top:12px;padding:10px 14px;background:color-mix(in oklab, var(--color-primary) 6%, var(--color-surface));border-radius:8px;border-left:3px solid var(--color-primary)">
        <strong style="font-size:12.5px;color:var(--color-primary)">📚 本篇学术闪光词汇与高分搭配（点击即查）：</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
          ${vocab.map(function (v) {
            return `<button class="word-quick-chip" data-word="${v.word}" data-pos="${v.pos || ''}" data-zh="${v.zh || ''}" type="button" style="font-size:12px;background:var(--color-surface);padding:3px 8px;border-radius:4px;border:1px solid var(--color-border);cursor:pointer;color:var(--color-text)"><b>${v.word}</b> <i>${v.pos || ''}</i> ${v.zh || ''}</button>`;
          }).join('')}
        </div>
      </div>
    ` : '');
  }

  function renderWritingBFull(cur) {
    return `
      <div class="full-essay-card" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:16px;line-height:1.75;font-size:14px;color:var(--color-text);white-space:pre-line">
        ${cur.model_essay}
      </div>
    `;
  }

  function renderWritingBSandbox(cur) {
    var draftKey = 'kao_writing_draft_b_' + cur.year;
    var savedDraft = localStorage.getItem(draftKey) || '';
    return `
      <div class="writing-sandbox-card" style="background:var(--color-surface);border:1.5px solid var(--color-primary);border-radius:10px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <strong style="font-size:14px;color:var(--color-primary)">✍️ ${cur.year} 图画大作文在线模写沙盒</strong>
            <span style="font-size:12px;color:var(--color-text-muted);margin-left:6px">(自动保存草稿)</span>
          </div>
          <div id="wb-word-count-badge" style="font-size:12.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:var(--color-surface-offset);border:1px solid var(--color-border)">
            已写 0 词 / 推荐 160~200 词
          </div>
        </div>

        <textarea id="wb-sandbox-textarea" placeholder="在此键入您的英语（一）图画大作文（推荐按九宫格三段论布局：描写+深挖+展望）..." style="width:100%;min-height:220px;padding:12px;border:1px solid var(--color-border);border-radius:8px;font-size:14px;line-height:1.7;font-family:var(--font-sans);background:var(--color-surface);color:var(--color-text);resize:vertical;box-sizing:border-box">${savedDraft}</textarea>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:6px">
            <button class="nav-btn" id="wb-insert-skeleton-btn" type="button" style="font-size:12px">🪄 插入九宫格骨架</button>
            <button class="nav-btn" id="wb-clear-draft-btn" type="button" style="font-size:12px;color:var(--color-text-muted)">🧹 清空草稿</button>
          </div>
          <div style="display:flex;gap:6px">
            <button class="copy-btn" id="wb-copy-draft-btn" type="button" style="position:static">📋 复制我的作文</button>
            <span id="wb-save-status" style="font-size:12px;color:#2e7d32;align-self:center">✓ 草稿已同步保存</span>
          </div>
        </div>
      </div>
    `;
  }

  function bindWritingBSandbox(cur, container) {
    var ta = container.querySelector('#wb-sandbox-textarea');
    var countBadge = container.querySelector('#wb-word-count-badge');
    var saveStatus = container.querySelector('#wb-save-status');
    var insertBtn = container.querySelector('#wb-insert-skeleton-btn');
    var clearBtn = container.querySelector('#wb-clear-draft-btn');
    var copyDraftBtn = container.querySelector('#wb-copy-draft-btn');
    var draftKey = 'kao_writing_draft_b_' + cur.year;

    function updateCount() {
      if (!ta || !countBadge) return;
      var text = ta.value.trim();
      var words = text ? (text.match(/[a-zA-Z0-9'-]+/g) || []).length : 0;
      var isPerfect = words >= 150 && words <= 210;
      var isTooShort = words < 140;
      var isTooLong = words > 220;

      var color = isPerfect ? '#2e7d32' : (isTooShort ? '#f57f17' : '#d32f2f');
      var tip = isPerfect ? '✓ 篇幅极佳' : (isTooShort ? '⚠️ 篇幅偏短' : '⚠️ 篇幅偏长');
      countBadge.innerHTML = `<span style="color:${color}">已写 ${words} 词 / 推荐 160~200 词 (${tip})</span>`;
      localStorage.setItem(draftKey, ta.value);
    }

    if (ta) {
      ta.addEventListener('input', updateCount);
      updateCount();
    }

    if (insertBtn && ta) {
      insertBtn.addEventListener('click', function () {
        var skeleton = `As is vividly portrayed in the cartoon, [图画具体生动描写]. Simple as the drawing seems, the profound implication conveyed by it is thought-provoking: [提炼象征寓意与核心立意].\n\nA multitude of intertwined factors account for this phenomenon. First and foremost, from the perspective of [论证维度一], [深入论证展开]. In addition, [论证维度二与实证例证].\n\nIn view of the arguments mentioned above, it is imperative that we adopt effective countermeasures. On the one hand, [制度/社会举措]. On the other hand, [个人对策与实践]. Only through concerted endeavors can we [终极倒装展望].`;
        if (ta.value && !confirm('插入骨架将覆盖现有草稿，是否继续？')) return;
        ta.value = skeleton;
        updateCount();
      });
    }

    if (clearBtn && ta) {
      clearBtn.addEventListener('click', function () {
        if (confirm('确认清空当前作文草稿？')) {
          ta.value = '';
          updateCount();
        }
      });
    }

    if (copyDraftBtn && ta) {
      copyDraftBtn.addEventListener('click', function () {
        if (!ta.value.trim()) return;
        navigator.clipboard.writeText(ta.value).then(function () {
          var orig = copyDraftBtn.textContent;
          copyDraftBtn.textContent = '✓ 复制成功！';
          setTimeout(function () { copyDraftBtn.textContent = orig; }, 1800);
        });
      });
    }
  }

  // --- 2. 应用小作文工坊 (Writing Part A) ---
  function initWritingA() {
    var container = document.getElementById('writing-a-workshop-root');
    if (!container) return;

    if (window.__EXAM_WRITINGS_A__ && window.__EXAM_WRITINGS_A__.letters) {
      state.writingA.data = window.__EXAM_WRITINGS_A__.letters || [];
      renderWritingA();
      return;
    }

    fetch('data/writings_a.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.writingA.data = json.letters || [];
        renderWritingA();
      })
      .catch(function (err) {
        if (window.__EXAM_WRITINGS_A__ && window.__EXAM_WRITINGS_A__.letters) {
          state.writingA.data = window.__EXAM_WRITINGS_A__.letters || [];
          renderWritingA();
        } else {
          console.error('Failed to load writings_a.json', err);
        }
      });
  }

  function renderWritingA() {
    var container = document.getElementById('writing-a-workshop-root');
    if (!container || !state.writingA.data.length) return;

    var letters = state.writingA.data;
    var idx = Math.min(Math.max(0, state.writingA.curIdx), letters.length - 1);
    state.writingA.curIdx = idx;
    localStorage.setItem('kao_exam_idx_writing_a', idx);

    var cur = letters[idx];
    var curMode = state.writingA.mode;

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">✉️ ${cur.year} 考研英语（一）· ${cur.type}</span>
            <h3 style="margin:4px 0 0;font-size:16px">${cur.title}</h3>
          </div>
          <div class="ws-actions">
            <div class="year-chips">
              ${letters.map(function (e, i) {
                return `<button class="filter-chip ${i === idx ? 'active' : ''}" data-wa-idx="${i}" type="button">${e.year}年</button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="ws-prompt-card">
          <div style="font-size:12.5px;color:var(--color-text-muted);margin-bottom:4px"><strong>📝 官方真题指令要求 (Prompt)：</strong></div>
          <div style="font-size:13.5px;line-height:1.6;color:var(--color-text)">${cur.prompt}</div>
        </div>

        <div class="ws-view-tabs" style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap">
          <button class="filter-chip ${curMode === 'breakdown' ? 'active' : ''}" id="wa-view-breakdown" type="button">🧩 三段论逐句精析</button>
          <button class="filter-chip ${curMode === 'full' ? 'active' : ''}" id="wa-view-full" type="button">📜 满分范文与一键复制</button>
          <button class="filter-chip ${curMode === 'sandbox' ? 'active' : ''}" id="wa-view-sandbox" type="button">✍️ 考场实战模写草稿箱</button>
          <button class="audio-btn" id="wa-speak-all" type="button" title="朗读全篇书信" style="margin-left:auto">🔊 朗读全篇</button>
          <button class="copy-btn" id="wa-copy-all" data-copy="${encodeURIComponent(cur.model_essay)}" type="button" style="position:static">📋 复制书信范文</button>
        </div>

        <div class="ws-body-content">
          ${curMode === 'breakdown' ? renderWritingABreakdown(cur) : (curMode === 'sandbox' ? renderWritingASandbox(cur) : renderWritingAFull(cur))}
        </div>

        <div class="ws-nav-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--color-border)">
          <button class="nav-btn" id="wa-prev-btn" ${idx === 0 ? 'disabled' : ''} type="button">← 上一年真题</button>
          <span style="font-size:12.5px;color:var(--color-text-muted)">真题第 ${idx + 1} / ${letters.length} 篇</span>
          <button class="nav-btn" id="wa-next-btn" ${idx === letters.length - 1 ? 'disabled' : ''} type="button">下一年真题 →</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('[data-wa-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.writingA.curIdx = parseInt(btn.getAttribute('data-wa-idx'), 10);
        renderWritingA();
      });
    });

    var viewBreakdownBtn = document.getElementById('wa-view-breakdown');
    var viewFullBtn = document.getElementById('wa-view-full');
    var viewSandboxBtn = document.getElementById('wa-view-sandbox');
    if (viewBreakdownBtn) viewBreakdownBtn.addEventListener('click', function () {
      state.writingA.mode = 'breakdown';
      localStorage.setItem('kao_exam_mode_writing_a', 'breakdown');
      renderWritingA();
    });
    if (viewFullBtn) viewFullBtn.addEventListener('click', function () {
      state.writingA.mode = 'full';
      localStorage.setItem('kao_exam_mode_writing_a', 'full');
      renderWritingA();
    });
    if (viewSandboxBtn) viewSandboxBtn.addEventListener('click', function () {
      state.writingA.mode = 'sandbox';
      localStorage.setItem('kao_exam_mode_writing_a', 'sandbox');
      renderWritingA();
    });

    var prevBtn = document.getElementById('wa-prev-btn');
    var nextBtn = document.getElementById('wa-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (state.writingA.curIdx > 0) {
        state.writingA.curIdx--;
        renderWritingA();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (state.writingA.curIdx < letters.length - 1) {
        state.writingA.curIdx++;
        renderWritingA();
      }
    });

    var speakAllBtn = document.getElementById('wa-speak-all');
    if (speakAllBtn) speakAllBtn.addEventListener('click', function () {
      speak(cur.model_essay);
    });

    var copyAllBtn = document.getElementById('wa-copy-all');
    if (copyAllBtn) copyAllBtn.addEventListener('click', function () {
      var raw = decodeURIComponent(copyAllBtn.getAttribute('data-copy'));
      navigator.clipboard.writeText(raw).then(function () {
        var orig = copyAllBtn.textContent;
        copyAllBtn.textContent = '✓ 复制成功！';
        setTimeout(function () { copyAllBtn.textContent = orig; }, 1800);
      });
    });

    container.querySelectorAll('.wa-sentence-speak').forEach(function (btn) {
      btn.addEventListener('click', function () {
        speak(btn.getAttribute('data-sentence'));
      });
    });

    if (curMode === 'sandbox') {
      bindWritingASandbox(cur, container);
    }

    bindWordLookup(container);
  }

  function renderWritingABreakdown(cur) {
    var paras = cur.paragraphs || [];
    var phrases = cur.key_phrases || [];
    return paras.map(function (p) {
      return `
        <div class="essay-para-card" style="margin-bottom:14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:12px 14px">
          <div style="font-weight:700;font-size:13px;color:var(--color-primary);margin-bottom:8px">
            📌 ${p.para_title}
          </div>
          <div class="para-sentences">
            ${(p.sentences || []).map(function (s) {
              return `
                <div class="sentence-item" style="padding:8px 0;border-bottom:1px dashed var(--color-border);font-size:13px;line-height:1.6">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                    <div>
                      <span class="role-tag" style="font-size:10.5px;padding:1px 6px;border-radius:4px;background:var(--color-surface-offset);color:var(--color-primary);font-weight:600">${s.role || ''}</span>
                      <p style="margin:4px 0 2px;color:var(--color-text);font-family:var(--font-sans)">${s.en}</p>
                      <p style="margin:0;color:var(--color-text-muted);font-size:12.5px">${s.zh}</p>
                    </div>
                    <button class="audio-btn wa-sentence-speak" data-sentence="${encodeURIComponent(s.en)}" type="button" title="朗读此句" style="flex-shrink:0;width:24px;height:24px;font-size:11px">🔊</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('') + (phrases.length ? `
      <div class="key-vocab-card" style="margin-top:12px;padding:10px 14px;background:color-mix(in oklab, var(--color-primary) 6%, var(--color-surface));border-radius:8px;border-left:3px solid var(--color-primary)">
        <strong style="font-size:12.5px;color:var(--color-primary)">💎 本篇高分书信功能短语库：</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
          ${phrases.map(function (phrase) {
            return `<span style="font-size:12px;background:var(--color-surface);padding:3px 8px;border-radius:4px;border:1px solid var(--color-border)">${phrase}</span>`;
          }).join('')}
        </div>
      </div>
    ` : '');
  }

  function renderWritingAFull(cur) {
    return `
      <div class="full-essay-card" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:16px;line-height:1.75;font-size:14px;color:var(--color-text);white-space:pre-line">
        ${cur.model_essay}
      </div>
    `;
  }

  function renderWritingASandbox(cur) {
    var draftKey = 'kao_writing_draft_a_' + cur.year;
    var savedDraft = localStorage.getItem(draftKey) || '';
    return `
      <div class="writing-sandbox-card" style="background:var(--color-surface);border:1.5px solid var(--color-primary);border-radius:10px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <strong style="font-size:14px;color:var(--color-primary)">✍️ ${cur.year} 应用小作文（${cur.type}）实战模写沙盒</strong>
            <span style="font-size:12px;color:var(--color-text-muted);margin-left:6px">(自动保存草稿)</span>
          </div>
          <div id="wa-word-count-badge" style="font-size:12.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:var(--color-surface-offset);border:1px solid var(--color-border)">
            已写 0 词 / 推荐 100 词左右
          </div>
        </div>

        <textarea id="wa-sandbox-textarea" placeholder="在此键入您的考研英语（一）小作文（称呼 + 目的 + 要点 + 礼貌结语 + 署名）..." style="width:100%;min-height:180px;padding:12px;border:1px solid var(--color-border);border-radius:8px;font-size:14px;line-height:1.7;font-family:var(--font-sans);background:var(--color-surface);color:var(--color-text);resize:vertical;box-sizing:border-box">${savedDraft}</textarea>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:6px">
            <button class="nav-btn" id="wa-insert-skeleton-btn" type="button" style="font-size:12px">🪄 插入书信骨架</button>
            <button class="nav-btn" id="wa-clear-draft-btn" type="button" style="font-size:12px;color:var(--color-text-muted)">🧹 清空草稿</button>
          </div>
          <div style="display:flex;gap:6px">
            <button class="copy-btn" id="wa-copy-draft-btn" type="button" style="position:static">📋 复制我的书信</button>
            <span id="wa-save-status" style="font-size:12px;color:#2e7d32;align-self:center">✓ 草稿已同步保存</span>
          </div>
        </div>
      </div>
    `;
  }

  function bindWritingASandbox(cur, container) {
    var ta = container.querySelector('#wa-sandbox-textarea');
    var countBadge = container.querySelector('#wa-word-count-badge');
    var insertBtn = container.querySelector('#wa-insert-skeleton-btn');
    var clearBtn = container.querySelector('#wa-clear-draft-btn');
    var copyDraftBtn = container.querySelector('#wa-copy-draft-btn');
    var draftKey = 'kao_writing_draft_a_' + cur.year;

    function updateCount() {
      if (!ta || !countBadge) return;
      var text = ta.value.trim();
      var words = text ? (text.match(/[a-zA-Z0-9'-]+/g) || []).length : 0;
      var isPerfect = words >= 90 && words <= 130;
      var isTooShort = words < 80;
      var isTooLong = words > 140;

      var color = isPerfect ? '#2e7d32' : (isTooShort ? '#f57f17' : '#d32f2f');
      var tip = isPerfect ? '✓ 篇幅达标' : (isTooShort ? '⚠️ 篇幅略少' : '⚠️ 篇幅略长');
      countBadge.innerHTML = `<span style="color:${color}">已写 ${words} 词 / 推荐 100 词左右 (${tip})</span>`;
      localStorage.setItem(draftKey, ta.value);
    }

    if (ta) {
      ta.addEventListener('input', updateCount);
      updateCount();
    }

    if (insertBtn && ta) {
      insertBtn.addEventListener('click', function () {
        var skeleton = `Dear Sir or Madam,\n\nI am writing this letter to [表明写信目的，如 express my sincere appreciation / provide some constructive suggestions].\n\nFirst and foremost, [核心要点一及细节展开]. In addition, [核心要点二及深入建议]. Last but not least, [核心要点三及具体措施].\n\nThank you for your time and favorable consideration. I look forward to your prompt reply.\n\nYours sincerely,\nLi Ming`;
        if (ta.value && !confirm('插入骨架将覆盖现有草稿，是否继续？')) return;
        ta.value = skeleton;
        updateCount();
      });
    }

    if (clearBtn && ta) {
      clearBtn.addEventListener('click', function () {
        if (confirm('确认清空当前书信草稿？')) {
          ta.value = '';
          updateCount();
        }
      });
    }

    if (copyDraftBtn && ta) {
      copyDraftBtn.addEventListener('click', function () {
        if (!ta.value.trim()) return;
        navigator.clipboard.writeText(ta.value).then(function () {
          var orig = copyDraftBtn.textContent;
          copyDraftBtn.textContent = '✓ 复制成功！';
          setTimeout(function () { copyDraftBtn.textContent = orig; }, 1800);
        });
      });
    }
  }

  // --- 3. 翻译长难句 105 篇内嵌工坊 (Translation Workshop) ---
  function initTransWorkshop() {
    var container = document.getElementById('trans-workshop-root');
    if (!container) return;

    if (window.__TRANSLATIONS__ && window.__TRANSLATIONS__.sentences) {
      state.trans.data = window.__TRANSLATIONS__.sentences || [];
      renderTransWorkshop();
      return;
    }

    fetch('data/translations.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.trans.data = json.sentences || [];
        renderTransWorkshop();
      })
      .catch(function (err) {
        if (window.__TRANSLATIONS__ && window.__TRANSLATIONS__.sentences) {
          state.trans.data = window.__TRANSLATIONS__.sentences || [];
          renderTransWorkshop();
        } else {
          console.error('Failed to load translations.json', err);
        }
      });
  }

  function renderTransWorkshop() {
    var container = document.getElementById('trans-workshop-root');
    if (!container || !state.trans.data.length) return;

    var sList = state.trans.data;
    var idx = Math.min(Math.max(0, state.trans.curIdx), sList.length - 1);
    state.trans.curIdx = idx;
    localStorage.setItem('kao_exam_idx_trans', idx);

    var cur = sList[idx];

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🌐 ${cur.source} · 题材：${cur.theme}</span>
            <h3 style="margin:4px 0 0;font-size:15.5px">${cur.title}</h3>
          </div>
          <div class="ws-actions" style="display:flex;gap:6px">
            <button class="nav-btn" id="trans-prev-btn" ${idx === 0 ? 'disabled' : ''} type="button">← 上一句</button>
            <span style="font-size:12.5px;align-self:center;color:var(--color-text-muted)">第 ${idx + 1} / ${sList.length} 句</span>
            <button class="nav-btn" id="trans-next-btn" ${idx === sList.length - 1 ? 'disabled' : ''} type="button">下一句 →</button>
            <button class="audio-btn" id="trans-speak-btn" type="button" title="朗读全句">🔊</button>
          </div>
        </div>

        <div class="trans-sentence-card" style="margin:12px 0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:14px">
          <div style="font-size:14.5px;font-weight:600;line-height:1.7;color:var(--color-text)">${cur.sentence_en}</div>
          <div style="margin-top:10px;font-size:13px;color:var(--color-text-muted);border-top:1px dashed var(--color-border);padding-top:8px">
            <strong>📐 语法结构主干透视：</strong> ${cur.grammar_analysis || cur.skeleton_label || '主干清晰'}
          </div>
        </div>

        <div class="trans-chunks-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:14px">
          ${(cur.chunks || []).map(function (c) {
            return `
              <div class="chunk-card" style="background:color-mix(in oklab, var(--color-primary) 4%, var(--color-surface));border:1px solid var(--color-border);border-radius:6px;padding:8px 10px">
                <span class="chunk-role" style="font-size:11px;color:var(--color-primary);font-weight:600">${c.role}</span>
                <div style="font-size:12.5px;margin:3px 0">${c.en}</div>
                <div style="font-size:12px;color:var(--color-text-muted)">👉 ${c.zh}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="trans-model-box" style="background:var(--color-surface-offset);border-left:4px solid var(--color-primary);border-radius:4px;padding:12px 14px">
          <strong style="font-size:13px;color:var(--color-primary)">👑 考研官方满分参考译文：</strong>
          <div style="font-size:13.5px;line-height:1.6;margin-top:4px;color:var(--color-text)">${cur.translation}</div>
        </div>

        <div style="margin-top:12px;text-align:right">
          <a class="syn-chip" href="translate.html?idx=${idx}" target="_blank" style="font-size:12.5px;padding:4px 12px">🚀 在独立翻译工坊中体验四步深度拆解 →</a>
        </div>
      </div>
    `;

    container.innerHTML = html;

    var prevBtn = document.getElementById('trans-prev-btn');
    var nextBtn = document.getElementById('trans-next-btn');
    var speakBtn = document.getElementById('trans-speak-btn');

    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (state.trans.curIdx > 0) {
        state.trans.curIdx--;
        renderTransWorkshop();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (state.trans.curIdx < sList.length - 1) {
        state.trans.curIdx++;
        renderTransWorkshop();
      }
    });
    if (speakBtn) speakBtn.addEventListener('click', function () {
      speak(cur.sentence_en);
    });

    bindWordLookup(container);
  }

  // --- 4. 传统阅读精读工坊 (Reading Real Workshop) ---
  function initReadingWorkshop() {
    var container = document.getElementById('reading-workshop-root');
    if (!container) return;

    if (window.__EXAM_READING__ && window.__EXAM_READING__.passages) {
      state.reading.data = window.__EXAM_READING__.passages || [];
      renderReadingWorkshop();
      return;
    }

    fetch('data/reading_real.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.reading.data = json.passages || [];
        renderReadingWorkshop();
      })
      .catch(function (err) {
        if (window.__EXAM_READING__ && window.__EXAM_READING__.passages) {
          state.reading.data = window.__EXAM_READING__.passages || [];
          renderReadingWorkshop();
        } else {
          console.error('Failed to load reading_real.json', err);
        }
      });
  }

  function renderReadingWorkshop() {
    var container = document.getElementById('reading-workshop-root');
    if (!container || !state.reading.data.length) return;

    var passages = state.reading.data;
    var idx = Math.min(Math.max(0, state.reading.curIdx), passages.length - 1);
    var cur = passages[idx];

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">📖 ${cur.year} 考研英语（一）${cur.text_num || 'Text'} 传统阅读精读</span>
            <h3 style="margin:4px 0 0;font-size:16px">${cur.title}</h3>
          </div>
          <div class="ws-actions" style="display:flex;gap:6px">
            <button class="nav-btn" id="rd-prev-btn" ${idx === 0 ? 'disabled' : ''} type="button">← 上一篇</button>
            <span style="font-size:12.5px;align-self:center;color:var(--color-text-muted)">第 ${idx + 1} / ${passages.length} 篇</span>
            <button class="nav-btn" id="rd-next-btn" ${idx === passages.length - 1 ? 'disabled' : ''} type="button">下一篇 →</button>
            <button class="audio-btn" id="reading-speak-btn" type="button" title="朗读全篇">🔊 朗读全文</button>
          </div>
        </div>

        <div class="reading-passage-text" style="margin:12px 0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;padding:14px;line-height:1.75;font-size:13.5px;white-space:pre-line">
          ${cur.text}
        </div>

        <div class="reading-questions-box" style="margin-top:14px">
          <h4 style="margin:0 0 10px;font-size:14px;color:var(--color-primary)">🎯 历年真题精炼互动实战测试</h4>
          ${cur.questions.map(function (q) {
            return `
              <div class="drill-box" style="margin-bottom:12px">
                <div class="drill-head">
                  <strong>第 ${q.q_num} 题</strong>
                </div>
                <p style="font-size:13px;margin:0 0 8px"><em>${q.stem}</em></p>
                <div class="drill-options">
                  ${q.options.map(function (opt) {
                    return `
                      <button class="drill-opt" data-is-correct="${opt.correct}" type="button">
                        <span>${opt.label}.</span> <span>${opt.text}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
                <div class="drill-feedback" hidden>
                  <strong>💡 深度考点精析：</strong><br>${q.analysis}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${cur.key_vocab ? `
          <div class="key-vocab-card" style="margin-top:14px;padding:10px 14px;background:color-mix(in oklab, var(--color-primary) 6%, var(--color-surface));border-radius:8px;border-left:3px solid var(--color-primary)">
            <strong style="font-size:12.5px;color:var(--color-primary)">📚 本文核心考研高阶词汇（点击即查）：</strong>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
              ${cur.key_vocab.map(function (v) {
                return `<button class="word-quick-chip" data-word="${v.word}" data-pos="${v.pos}" data-zh="${v.zh}" type="button" style="font-size:12px;background:var(--color-surface);padding:3px 8px;border-radius:4px;border:1px solid var(--color-border);cursor:pointer;color:var(--color-text)"><b>${v.word}</b> <i>${v.pos}</i> ${v.zh}</button>`;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    var prevBtn = document.getElementById('rd-prev-btn');
    var nextBtn = document.getElementById('rd-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (state.reading.curIdx > 0) {
        state.reading.curIdx--;
        renderReadingWorkshop();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (state.reading.curIdx < passages.length - 1) {
        state.reading.curIdx++;
        renderReadingWorkshop();
      }
    });

    var speakBtn = document.getElementById('reading-speak-btn');
    if (speakBtn) speakBtn.addEventListener('click', function () {
      speak(cur.text);
    });

    bindWordLookup(container);
  }

  // --- 5. 完形填空实战工坊 (Cloze Real Workshop) ---
  function initClozeWorkshop() {
    var container = document.getElementById('cloze-workshop-root');
    if (!container) return;

    if (window.__EXAM_CLOZE__ && window.__EXAM_CLOZE__.passages) {
      state.cloze.data = window.__EXAM_CLOZE__.passages || [];
      renderClozeWorkshop();
      return;
    }

    fetch('data/cloze_real.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.cloze.data = json.passages || [];
        renderClozeWorkshop();
      })
      .catch(function (err) {
        if (window.__EXAM_CLOZE__ && window.__EXAM_CLOZE__.passages) {
          state.cloze.data = window.__EXAM_CLOZE__.passages || [];
          renderClozeWorkshop();
        } else {
          console.error('Failed to load cloze_real.json', err);
        }
      });
  }

  function renderClozeWorkshop() {
    var container = document.getElementById('cloze-workshop-root');
    if (!container || !state.cloze.data.length) return;

    var passages = state.cloze.data;
    var idx = Math.min(Math.max(0, state.cloze.curIdx), passages.length - 1);
    var cur = passages[idx];

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🧩 ${cur.year} 考研英语（一）完形填空全真工坊</span>
            <h3 style="margin:4px 0 0;font-size:16px">${cur.title}</h3>
          </div>
          <button class="audio-btn" id="cloze-speak-btn" type="button" title="朗读全篇">🔊 朗读短文</button>
        </div>

        <div class="ws-prompt-card" style="margin:10px 0">
          <div style="font-size:13.5px;line-height:1.75;color:var(--color-text)">
            ${cur.text}
          </div>
        </div>

        <div class="cloze-questions-box" style="margin-top:14px">
          <h4 style="margin:0 0 10px;font-size:14px;color:var(--color-primary)">🎯 完形填空核心设空逐空攻坚</h4>
          ${cur.blanks.map(function (b) {
            return `
              <div class="drill-box" style="margin-bottom:12px">
                <div class="drill-head">
                  <strong>第 (${b.blank_num}) 题设空解析</strong>
                </div>
                <div class="drill-options">
                  ${b.options.map(function (opt) {
                    return `
                      <button class="drill-opt" data-is-correct="${opt.correct}" type="button">
                        <span>${opt.label}.</span> <span>${opt.text}</span>
                      </button>
                    `;
                  }).join('')}
                </div>
                <div class="drill-feedback" hidden>
                  <strong>💡 深度解题思路：</strong><br>${b.analysis}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${cur.key_vocab ? `
          <div class="key-vocab-card" style="margin-top:14px;padding:10px 14px;background:color-mix(in oklab, var(--color-primary) 6%, var(--color-surface));border-radius:8px;border-left:3px solid var(--color-primary)">
            <strong style="font-size:12.5px;color:var(--color-primary)">📚 本篇完形高频动介搭配与考点词汇（点击即查）：</strong>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
              ${cur.key_vocab.map(function (v) {
                return `<button class="word-quick-chip" data-word="${v.word}" data-pos="${v.pos}" data-zh="${v.zh}" type="button" style="font-size:12px;background:var(--color-surface);padding:3px 8px;border-radius:4px;border:1px solid var(--color-border);cursor:pointer;color:var(--color-text)"><b>${v.word}</b> <i>${v.pos}</i> ${v.zh}</button>`;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;

    var speakBtn = document.getElementById('cloze-speak-btn');
    if (speakBtn) speakBtn.addEventListener('click', function () {
      speak(cur.text);
    });

    bindWordLookup(container);
  }

  // --- 6. 新题型实战工坊 (New Type Real Workshop) ---
  function initNewTypeWorkshop() {
    var container = document.getElementById('newtype-workshop-root');
    if (!container) return;

    if (window.__EXAM_NEWTYPE__ && window.__EXAM_NEWTYPE__.tasks) {
      state.newtype.data = window.__EXAM_NEWTYPE__.tasks || [];
      renderNewTypeWorkshop();
      return;
    }

    fetch('data/newtype_real.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        state.newtype.data = json.tasks || [];
        renderNewTypeWorkshop();
      })
      .catch(function (err) {
        console.error('Failed to load newtype_real.json', err);
      });
  }

  function renderNewTypeWorkshop() {
    var container = document.getElementById('newtype-workshop-root');
    if (!container || !state.newtype.data.length) return;

    var tasks = state.newtype.data;
    var idx = Math.min(Math.max(0, state.newtype.curIdx), tasks.length - 1);
    var cur = tasks[idx];

    var html = `
      <div class="exam-workshop-box">
        <div class="ws-header">
          <div class="ws-title-wrap">
            <span class="exam-badge" style="background:var(--color-primary-soft);color:var(--color-primary)">🎯 ${cur.year} 考研英语（一）${cur.type}</span>
            <h3 style="margin:4px 0 0;font-size:16px">${cur.title}</h3>
          </div>
          <button class="filter-chip active" id="nt-show-ans" type="button">💡 查看逻辑排布与线索链</button>
        </div>

        <div class="nt-paragraphs-container" style="margin:14px 0;display:flex;flex-direction:column;gap:10px">
          ${cur.paragraphs.map(function (p) {
            return `
              <div class="nt-para-card" style="background:var(--color-surface);border:1.5px solid var(--color-border);border-radius:8px;padding:12px 14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-weight:800;font-size:13.5px;color:var(--color-primary)">【段落 ${p.id}】</span>
                  <button class="audio-btn" data-nt-speak="${encodeURIComponent(p.text)}" type="button" title="朗读此段" style="font-size:11px;padding:2px 6px">🔊 朗读</button>
                </div>
                <p style="font-size:13px;line-height:1.65;color:var(--color-text);margin:0 0 8px">${p.text}</p>
                <div class="nt-clue-box" style="display:none;background:var(--color-surface-offset);padding:6px 10px;border-radius:6px;font-size:12px;color:var(--color-primary);border-left:3px solid var(--color-primary)">
                  ${p.clue}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="nt-ans-box" style="display:none;background:color-mix(in oklab, #2e7d32 8%, var(--color-surface));border:1.5px solid #2e7d32;border-radius:8px;padding:12px 14px;margin-top:12px">
          <strong style="color:#2e7d32;font-size:13.5px">🏆 官方满分顺序：${cur.correct_order.join(' ➔ ')}</strong>
          <p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:var(--color-text)">${cur.analysis}</p>
        </div>
      </div>
    `;

    container.innerHTML = html;

    var toggleBtn = document.getElementById('nt-show-ans');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var ansBox = container.querySelector('.nt-ans-box');
        var clues = container.querySelectorAll('.nt-clue-box');
        var isShowing = ansBox.style.display !== 'none';
        ansBox.style.display = isShowing ? 'none' : 'block';
        clues.forEach(function (c) { c.style.display = isShowing ? 'none' : 'block'; });
        toggleBtn.textContent = isShowing ? '💡 查看逻辑排布与线索链' : '🔒 隐藏答案与解析';
      });
    }

    container.querySelectorAll('[data-nt-speak]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        speak(decodeURIComponent(btn.getAttribute('data-nt-speak')));
      });
    });

    bindWordLookup(container);
  }

  // --- 7. Universal Academic Word Quick-Lookup Modal ---
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
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:20px;max-width:380px;width:100%;box-shadow:var(--shadow-lg);position:relative">
        <button id="close-word-modal-btn" type="button" style="position:absolute;top:10px;right:10px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--color-text-muted)">✕</button>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <h3 style="margin:0;font-size:19px;color:var(--color-text)">${word}</h3>
          <button id="modal-word-speak" type="button" class="audio-btn" style="width:28px;height:28px;font-size:12px" title="朗读单词">🔊</button>
        </div>
        <p style="font-size:13.5px;color:var(--color-primary);font-weight:600;margin:0 0 12px">
          ${pos ? `<i>${pos}</i> ` : ''}${zh || ''}
        </p>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button id="modal-add-tough-btn" type="button" class="nav-btn primary" style="flex:1;background:var(--color-primary);color:#fff;font-size:12.5px;padding:8px">⭐ 加入生词本</button>
          <a href="study.html?word=${encodeURIComponent(word)}" class="nav-btn" style="flex:1;text-align:center;font-size:12.5px;padding:8px;text-decoration:none;display:flex;align-items:center;justify-content:center">📖 词库深度背诵</a>
        </div>
      </div>
    `;
    modal.style.display = 'flex';

    document.getElementById('close-word-modal-btn').addEventListener('click', function () {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.style.display = 'none';
    });
    document.getElementById('modal-word-speak').addEventListener('click', function () {
      speak(word);
    });
    document.getElementById('modal-add-tough-btn').addEventListener('click', function () {
      try {
        var list = JSON.parse(localStorage.getItem('kaoyan_tough_words') || '[]');
        if (list.indexOf(word) === -1) {
          list.push(word);
          localStorage.setItem('kaoyan_tough_words', JSON.stringify(list));
        }
        this.textContent = '✓ 已加入生词本！';
        this.style.background = '#2e7d32';
      } catch(e){}
    });
  }

  // Initialize all workshops on DOM ready or immediately if ready
  function startAllWorkshops() {
    initWritingB();
    initWritingA();
    initTransWorkshop();
    initReadingWorkshop();
    initClozeWorkshop();
    initNewTypeWorkshop();
  }

  window.refreshExamWorkshops = startAllWorkshops;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAllWorkshops);
  } else {
    startAllWorkshops();
  }

})();
