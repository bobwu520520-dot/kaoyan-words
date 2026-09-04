# Read existing memory.js to keep core calculation and puppy database
content = open('js/memory.js', encoding='utf-8').read()

# We can append the router, favs list renderer, history log renderer, word detail renderer, and nav control bindings.
extension_code = r'''
  // ==========================================================================
  // 📱 手机系统设置式三级层级导航引擎 (3-Tier Hierarchical Engine for Memory Page)
  // ==========================================================================

  var SUB_PANE_CONFIG = {
    'stats': { id: 'sub-stats-pane', title: '📊 学习统计' },
    'favs': { id: 'sub-favs-pane', title: '⭐ 专属生词本' },
    'history': { id: 'sub-history-pane', title: '📅 学习记录与足迹' },
    'settings-study': { id: 'sub-settings-study-pane', title: '🎯 背词偏好设置' },
    'settings-audio': { id: 'sub-settings-audio-pane', title: '🔊 发音与触感设置' },
    'settings-display': { id: 'sub-settings-display-pane', title: '🎨 界面外观设置' },
    'settings-backup': { id: 'sub-settings-backup-pane', title: '💾 数据备份与恢复' },
    'settings-about': { id: 'sub-settings-about-pane', title: 'ℹ️ 关于与大纲版本' }
  };

  function switchTierView(viewId) {
    document.querySelectorAll('.tier-view').forEach(function(v) {
      v.classList.remove('active');
    });
    var target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  }

  function handleMemoryRoute() {
    var hash = location.hash.replace(/^#\/?/, '').trim();
    if (!hash || hash === 'home') {
      switchTierView('mem-view-home');
      updateHomeMenuBadges();
      return;
    }

    // Word detail in Tier 3
    if (hash.startsWith('word/')) {
      var targetWord = decodeURIComponent(hash.slice(5).trim());
      switchTierView('mem-view-word');
      renderMemWordDetail(targetWord);
      return;
    }

    // Sub-panes in Tier 2
    var cfg = SUB_PANE_CONFIG[hash];
    if (cfg) {
      switchTierView('mem-view-sub');
      var titleEl = document.getElementById('mem-sub-header-title');
      if (titleEl) titleEl.textContent = cfg.title;

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
      }
      return;
    }

    // Fallback to home
    switchTierView('mem-view-home');
    updateHomeMenuBadges();
  }

  function updateHomeMenuBadges() {
    var favs = [];
    try { favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]'); } catch(e){}
    var favBadge = document.getElementById('menu-badge-favs');
    if (favBadge) favBadge.textContent = favs.length + ' 词';

    var dailyGoal = localStorage.getItem('kao_dailygoal') || '30';
    var goalBadge = document.getElementById('menu-badge-study-goal');
    if (goalBadge) goalBadge.textContent = '每日 ' + dailyGoal + ' 词';
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
        if (info && info.meanings) {
          var mStr = info.meanings.map(function(m){ return (m.pos||'') + ' ' + (m.zh||''); }).join(' ');
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
      var info = wordMap[w.toLowerCase()] || { word: w, phonetic: '', meanings: [{ pos: '考研', zh: '大纲核心词汇' }] };
      var m = (info.meanings && info.meanings[0]) ? ((info.meanings[0].pos ? info.meanings[0].pos + '. ' : '') + info.meanings[0].zh) : '考研大纲重点词';

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
          if (window.KaoyanToast) window.KaoyanToast('已从生词本移除：' + targetW);
          renderFavsList();
          updateHomeMenuBadges();
        }
      });
    });
  }

  // --- 历史记录明细渲染 ---
  function renderHistoryList() {
    var logContainer = document.getElementById('history-log-list');
    if (!logContainer) return;

    var hist = {};
    try {
      var s = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}');
      hist = s.history || {};
    } catch(e) {}

    var dates = Object.keys(hist).sort().reverse();
    if (!dates.length) {
      logContainer.innerHTML = '<div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:13px">暂无学习打卡历史记录</div>';
      return;
    }

    var html = '<div class="settings-list-group">';
    dates.forEach(function(d) {
      var count = hist[d] || 0;
      html += '<div class="settings-nav-item" style="cursor:default">' +
        '<div class="sni-left">' +
          '<span class="sni-icon">📅</span>' +
          '<div class="sni-info">' +
            '<span class="sni-title">' + esc(d) + '</span>' +
            '<span class="sni-desc">当日背诵与复习完成词汇</span>' +
          '</div>' +
        '</div>' +
        '<div class="sni-right">' +
          '<span class="sni-badge" style="background:var(--color-primary-soft);color:var(--color-primary);font-weight:700">完成 ' + count + ' 词</span>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    logContainer.innerHTML = html;
  }

  // --- 统计面板数据同步 ---
  function renderStatsPane() {
    var sTotal = document.getElementById('s-total');
    var sMastered = document.getElementById('s-mastered');
    var sStreak = document.getElementById('s-streak');
    var sRetention = document.getElementById('s-retention');
    var sWeak = document.getElementById('s-weak');

    var stTotal = document.getElementById('st-total');
    var stMastered = document.getElementById('st-mastered');
    var stStreak = document.getElementById('st-streak');
    var stRetention = document.getElementById('st-retention');
    var stWeak = document.getElementById('st-weak');

    if (stTotal && sTotal) stTotal.textContent = sTotal.textContent;
    if (stMastered && sMastered) stMastered.textContent = sMastered.textContent;
    if (stStreak && sStreak) stStreak.textContent = sStreak.textContent;
    if (stRetention && sRetention) stRetention.textContent = sRetention.textContent;
    if (stWeak && sWeak) stWeak.textContent = sWeak.textContent;
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
      meanings: [{ pos: '考研', zh: '考研大纲核心词汇' }]
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

    var html = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:18px 20px;box-shadow:var(--shadow-sm);margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h1 style="font-size:26px;font-weight:800;color:var(--color-text);margin:0 0 4px;letter-spacing:-0.5px">${esc(wordObj.word)}</h1>
            ${wordObj.phonetic ? `<div style="font-size:14px;color:var(--color-text-muted);font-family:var(--font-sans)">/${esc(wordObj.phonetic)}/</div>` : ''}
          </div>
          <button id="mem-detail-audio-btn" type="button" class="audio-btn" style="width:36px;height:36px;font-size:16px" title="朗读单词">🔊</button>
        </div>

        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--color-divider)">
          <div style="font-size:12px;font-weight:700;color:var(--color-primary);margin-bottom:6px">📌 考研核心释义与词性</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${(wordObj.meanings || []).map(function(m) {
              return `
                <div style="font-size:14px;line-height:1.5;color:var(--color-text)">
                  ${m.pos ? `<span style="font-style:italic;font-weight:700;color:var(--color-primary);margin-right:6px">${esc(m.pos)}.</span>` : ''}
                  <span>${esc(m.zh)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${aiEx.en ? `
          <div style="margin-top:14px;padding:12px 14px;background:var(--color-surface-offset);border-radius:10px;border-left:3px solid var(--color-primary)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <strong style="font-size:12px;color:var(--color-primary)">📖 考研真题与学术例句：</strong>
              <button id="mem-detail-example-audio" type="button" class="audio-btn" style="width:24px;height:24px;font-size:11px">🔊</button>
            </div>
            <div style="font-size:13.5px;color:var(--color-text);line-height:1.6;font-family:var(--font-sans)">${esc(aiEx.en)}</div>
            <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:4px">${esc(aiEx.zh)}</div>
          </div>
        ` : ''}

        ${wordObj.roots ? `
          <div style="margin-top:14px">
            <div style="font-size:12px;font-weight:700;color:var(--color-text-muted);margin-bottom:4px">🌱 词根词缀与助记：</div>
            <div style="font-size:13px;color:var(--color-text);line-height:1.5">${esc(wordObj.roots)}</div>
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-top:18px">
          <button id="mem-detail-bottom-fav" type="button" class="nav-btn" style="flex:1;padding:10px;font-size:13px;font-weight:700">
            ${isFavorited ? '⭐ 移出生词本' : '☆ 加入生词本'}
          </button>
          <a href="study.html?word=${encodeURIComponent(wordObj.word)}" class="nav-btn primary" style="flex:1;text-align:center;text-decoration:none;padding:10px;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center">
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
          btmFav.textContent = '☆ 加入生词本';
          if (favToggleBtn) { favToggleBtn.textContent = '☆'; favToggleBtn.style.color = 'var(--color-text-muted)'; }
          if (window.KaoyanToast) window.KaoyanToast('已从生词本移出');
        } else {
          favs.push(wordObj.word);
          btmFav.textContent = '⭐ 移出生词本';
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
        if (history.length > 1) {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindMemoryNavigation);
  } else {
    bindMemoryNavigation();
  }
'''

# Find the end of the IIFE in original content and insert before })();
if content.endswith('})();\n') or content.endswith('})();'):
    idx = content.rfind('})();')
    new_content = content[:idx] + extension_code + '\n})();\n'
else:
    new_content = content + '\n' + extension_code

with open('js/memory.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("js/memory.js successfully updated with 3-tier hierarchy and router!")
