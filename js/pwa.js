/* 考研词汇 — PWA 注册与离线/音频核心工具库 */
(function () {
  'use strict';

  // 1. 全局版本号与手机自动更新引擎 (Universal Auto-Updater)
  var CURRENT_VERSION_CODE = 963;
  var CURRENT_VERSION_STR = '9.63';

  function showUpdateBanner(remote) {
    if (document.getElementById('kaoyan-update-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'kaoyan-update-banner';
    banner.style.cssText = 'position:fixed;bottom:calc(68px + env(safe-area-inset-bottom, 0px));left:50%;transform:translateX(-50%);z-index:99999;background:linear-gradient(135deg, #0d9488, #1d5a63);color:#fff;padding:10px 16px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:flex;align-items:center;gap:12px;max-width:92vw;animation:fadeIn 0.3s ease;font-size:13px;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);';

    var verText = remote && remote.version ? 'v' + remote.version : '最新版';
    banner.innerHTML = 
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:20px">🚀</span>' +
        '<div>' +
          '<div style="font-weight:700">发现新版本 ' + verText + '</div>' +
          '<div style="font-size:11px;opacity:0.88">词库与功能已升级，点击立即无缝生效</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button id="ky-do-update-btn" type="button" style="background:#fff;color:#0d9488;border:none;padding:6px 12px;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15)">立即更新</button>' +
        '<button id="ky-close-update-btn" type="button" style="background:rgba(255,255,255,0.2);color:#fff;border:none;padding:6px 8px;border-radius:10px;font-size:12px;cursor:pointer">✕</button>' +
      '</div>';

    document.body.appendChild(banner);

    banner.querySelector('#ky-do-update-btn').onclick = function () {
      if (window.KaoyanToast) window.KaoyanToast('正在无缝切换到新版本...');
      if (window._kaoyanSwWaiting) {
        window._kaoyanSwWaiting.postMessage({ action: 'skipWaiting' });
      }
      if (location.protocol === 'file:') {
        location.href = 'https://bobwu520520-dot.github.io/kaoyan-words/' + (location.pathname.split('/').pop() || 'study.html');
        return;
      }
      setTimeout(function () {
        location.reload();
      }, 300);
    };

    banner.querySelector('#ky-close-update-btn').onclick = function () {
      banner.remove();
    };
  }

  function checkRemoteVersion(isManual) {
    var checkUrl = 'https://bobwu520520-dot.github.io/kaoyan-words/version.json?_t=' + Date.now();
    fetch(checkUrl, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (remote) {
        if (remote && remote.version_code && remote.version_code > CURRENT_VERSION_CODE) {
          showUpdateBanner(remote);
        } else if (isManual) {
          if (window.KaoyanToast) window.KaoyanToast('✓ 已是最新版本 (v' + CURRENT_VERSION_STR + ')，离线词库就绪');
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
        }
      })
      .catch(function () {
        if (isManual && window.KaoyanToast) {
          window.KaoyanToast('✓ 本地词库已处于离线就绪状态 (v' + CURRENT_VERSION_STR + ')');
        }
      });
  }

  // Service Worker 注册与自动更新机制
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        // 定时轮询更新（每 10 分钟检测一次云端新缓存）
        setInterval(function () {
          reg.update().catch(function () {});
        }, 10 * 60 * 1000);

        // 页面从后台切回前台时，主动触发更新检查
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible') {
            reg.update().catch(function () {});
            checkRemoteVersion(false);
          }
        });

        // 监听新 SW 安装就绪
        reg.addEventListener('updatefound', function () {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window._kaoyanSwWaiting = newWorker;
              showUpdateBanner({ version: CURRENT_VERSION_STR });
            }
          });
        });
      }).catch(function () {});

      // 监听 controllerchange 自动刷新
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    });
  }

  // 每次页面加载后 3 秒静默检查一次版本
  setTimeout(function () {
    checkRemoteVersion(false);
  }, 3000);

  window.KaoyanAutoUpdater = {
    checkUpdate: checkRemoteVersion,
    currentVersion: CURRENT_VERSION_STR,
    currentVersionCode: CURRENT_VERSION_CODE
  };

  // 2. 离线/在线网络状态胶囊指示器
  function showNetToast(msg, isOffline) {
    var toast = document.getElementById('net-status-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'net-status-toast';
      toast.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;box-shadow:0 4px 16px rgba(0,0,0,0.18);transition:opacity 0.3s ease, transform 0.3s ease;pointer-events:none;';
      document.body.appendChild(toast);
    }
    toast.style.background = isOffline ? 'color-mix(in oklab, #b71c1c 90%, black)' : 'color-mix(in oklab, #2e7d32 90%, black)';
    toast.style.color = '#ffffff';
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 3200);
  }

  window.addEventListener('offline', function () {
    showNetToast('✈️ 离线无网模式已激活 · 词库与题型 100% 本地可用', true);
  });
  window.addEventListener('online', function () {
    showNetToast('✓ 网络已连接', false);
  });

  // 3. Web Audio API 纯原生轻量音效合成器 (0 外部依赖，零网络请求)
  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  window.KaoyanAudio = {
    playSuccess: function () {
      if (localStorage.getItem('kao_sound') === '0') return;
      try {
        var c = getAudioCtx();
        if (!c) return;
        var now = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.33);
      } catch (e) {}
    },
    playComplete: function () {
      if (localStorage.getItem('kao_sound') === '0') return;
      try {
        var c = getAudioCtx();
        if (!c) return;
        var now = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.05, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.28);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.29);
        });
      } catch (e) {}
    },
    playWarn: function () {
      if (localStorage.getItem('kao_sound') === '0') return;
      try {
        var c = getAudioCtx();
        if (!c) return;
        var now = c.currentTime;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15); // C4
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }
  };

  // 4. 全局轻量沉浸式气泡 Toast（适用于移动端操作反馈）
  window.KaoyanToast = function (msg, isErr) {
    var toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.style.cssText = 'position:fixed;bottom:calc(68px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%) translateY(10px);z-index:9999;padding:7px 16px;border-radius:24px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;box-shadow:0 6px 20px rgba(0,0,0,0.22);opacity:0;transition:opacity 0.25s ease, transform 0.25s ease;pointer-events:none;white-space:nowrap;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);';
      document.body.appendChild(toast);
    }
    toast.style.background = isErr ? 'color-mix(in oklab, #b71c1c 92%, black)' : 'color-mix(in oklab, var(--color-primary) 92%, black)';
    toast.style.color = '#ffffff';
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2000);
  };

  // 5. 移动端触感反馈与菜单动态滑动过渡
  document.addEventListener('click', function (e) {
    var navLink = e.target.closest('.bottom-nav a, .bottom-nav-item, .nav-grid-pill');
    if (navLink && navLink.href && !navLink.classList.contains('active')) {
      var mainEl = document.querySelector('main, .study2, .exam-section');
      if (mainEl) {
        mainEl.style.transition = 'opacity 0.14s ease, transform 0.14s cubic-bezier(0.16, 1, 0.3, 1)';
        mainEl.style.opacity = '0.5';
        mainEl.style.transform = 'translateX(-16px)';
      }
    }
    var touchBtn = e.target.closest('.bottom-nav a, .bottom-nav-item, .rating button, .btn, .d-btn, .audio-btn, .fav-btn, .syn-chip, .filter-chip, .link-btn, .home-btn, .exam-tab-btn, .subpage-pill, .exam-flip-btn');
    if (touchBtn && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (err) {}
    }
  }, { passive: true });

  // 6. 单词标题长按一键复制笔记
  var pressTimer = null;
  document.addEventListener('touchstart', function (e) {
    var hw = e.target.closest('.headword, .rw');
    if (!hw) return;
    pressTimer = setTimeout(function () {
      var txt = hw.textContent.trim();
      if (txt && navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () {
          if (window.KaoyanToast) window.KaoyanToast('📋 已复制单词：' + txt);
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          if (navigator.vibrate) try { navigator.vibrate([15, 30, 15]); } catch(e){}
        }).catch(function(){});
      }
    }, 600);
  }, { passive: true });

  document.addEventListener('touchend', function () {
    if (pressTimer) clearTimeout(pressTimer);
  }, { passive: true });

  document.addEventListener('touchmove', function () {
    if (pressTimer) clearTimeout(pressTimer);
  }, { passive: true });

  // ========================================================
  // 7. 全局偏好设置中心 (Universal Kaoyan Settings Suite)
  // ========================================================
  var Settings = {
    get: function(k, def) {
      try { var v = localStorage.getItem(k); return v !== null ? v : def; }
      catch(e) { return def; }
    },
    set: function(k, v) {
      try { localStorage.setItem(k, v); } catch(e){}
    },
    apply: function() {
      var root = document.documentElement;
      // 1. 主题
      var theme = Settings.get('theme', 'light');
      root.setAttribute('data-theme', theme);

      // 2. 字体缩放
      var fs = Settings.get('kao_fs', '1');
      root.style.setProperty('--fs', fs);

      // 3. 屏幕亮度
      var br = Settings.get('kao_brightness', '100');
      if (br === '100') root.removeAttribute('data-brightness');
      else root.setAttribute('data-brightness', br);

      // 4. 护眼暖光滤镜
      var eye = Settings.get('kao_eyecare', 'none');
      if (eye === 'none') root.removeAttribute('data-eyecare');
      else root.setAttribute('data-eyecare', eye);
    },
    open: function() {
      var m = document.getElementById('global-settings-modal');
      if (!m) {
        m = Settings.createModal();
        document.body.appendChild(m);
      }
      Settings.syncUI(m);
      m.hidden = false;
      m.setAttribute('aria-hidden', 'false');
    },
    close: function() {
      var m = document.getElementById('global-settings-modal');
      if (m) {
        m.hidden = true;
        m.setAttribute('aria-hidden', 'true');
      }
    },
    syncUI: function(modal) {
      var curTheme = Settings.get('theme', 'light');
      var curFs = Settings.get('kao_fs', '1');
      var curBr = Settings.get('kao_brightness', '100');
      var curEye = Settings.get('kao_eyecare', 'none');
      var curLang = Settings.get('kao_ttslang', 'en-US');
      var curRate = Settings.get('kao_ttsrate', '0.92');
      var curSound = Settings.get('kao_sound', '1');
      var curHaptic = Settings.get('kao_haptic', '1');

      modal.querySelectorAll('[data-set-theme]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-theme') === curTheme);
      });
      modal.querySelectorAll('[data-set-fs]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-fs') === curFs);
      });
      modal.querySelectorAll('[data-set-br]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-br') === curBr);
      });
      modal.querySelectorAll('[data-set-eye]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-eye') === curEye);
      });
      modal.querySelectorAll('[data-set-lang]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-lang') === curLang);
      });
      modal.querySelectorAll('[data-set-rate]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-rate') === curRate);
      });
      modal.querySelectorAll('[data-set-sound]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-sound') === curSound);
      });
      modal.querySelectorAll('[data-set-haptic]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-haptic') === curHaptic);
      });

      var study = {};
      try { study = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}'); } catch(e){}
      var curDaily = String(study.daily || 50);
      modal.querySelectorAll('[data-set-daily]').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-set-daily') === curDaily);
      });

      // 同步数据概览信息
      var statMastered = modal.querySelector('#stat-mastered-count');
      var statFavs = modal.querySelector('#stat-fav-count');
      if (statMastered) {
        try {
          var prog = study.progress || {};
          var done = Object.keys(prog).filter(function(k){ return prog[k] && prog[k].level >= 4; }).length;
          statMastered.textContent = done + ' 词';
        } catch(e) { statMastered.textContent = '0 词'; }
      }
      if (statFavs) {
        try {
          var favs = JSON.parse(localStorage.getItem('kao_quiz_favs') || '[]');
          statFavs.textContent = favs.length + ' 词';
        } catch(e) { statFavs.textContent = '0 词'; }
      }
    },
    createModal: function() {
      var wrap = document.createElement('div');
      wrap.id = 'global-settings-modal';
      wrap.className = 'settings-modal';
      wrap.hidden = true;
      wrap.setAttribute('aria-hidden', 'true');

      wrap.innerHTML =
        '<div class="settings-box" role="dialog" aria-modal="true" aria-label="系统偏好设置">' +
          '<div class="settings-head">' +
            '<div class="settings-head-title">' +
              '<span class="icon">⚙️</span>' +
              '<div>' +
                '<h3>系统偏好设置 · 考研英语</h3>' +
                '<span class="settings-head-sub">个性化排版 / 护眼显示 / 发音语速 / 离线备份 (按 ESC 快速返回)</span>' +
              '</div>' +
            '</div>' +
            '<button class="settings-close" data-settings-close aria-label="关闭设置" type="button">✕</button>' +
          '</div>' +

          '<!-- 卡片 0: 学习目标与计划 -->' +
          '<div class="settings-card">' +
            '<div class="settings-card-title">🎯 每日背词计划与进度 <span>(艾宾浩斯记忆调度)</span></div>' +
            '<div class="settings-row">' +
              '<div class="settings-label">📅 每日目标计划</div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-daily="20" type="button">20 词/天</button>' +
                '<button class="settings-opt-btn" data-set-daily="30" type="button">30 词/天</button>' +
                '<button class="settings-opt-btn" data-set-daily="50" type="button">50 词/天</button>' +
                '<button class="settings-opt-btn" data-set-daily="100" type="button">100 词/天</button>' +
                '<button class="settings-opt-btn" data-set-daily="150" type="button">150 词/天</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- 卡片 1: 视觉与排版 -->' +
          '<div class="settings-card">' +
            '<div class="settings-card-title">🎨 视觉排版与护眼显示 <span>(全局等比缩放与舒适滤镜)</span></div>' +
            
            '<!-- 字体缩放 -->' +
            '<div class="settings-row">' +
              '<div class="settings-label">🔠 字号缩放 <small>查词 / 背诵 / 长难句同步生效</small></div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-fs="0.88" type="button">Aa 精细 (88%)</button>' +
                '<button class="settings-opt-btn" data-set-fs="1" type="button">Aa 标准 (100%)</button>' +
                '<button class="settings-opt-btn" data-set-fs="1.14" type="button">Aa 舒适 (114%)</button>' +
                '<button class="settings-opt-btn" data-set-fs="1.28" type="button">Aa 沉浸 (128%)</button>' +
              '</div>' +
            '</div>' +

            '<!-- 主题选择 -->' +
            '<div class="settings-row">' +
              '<div class="settings-label">🌈 背景配色 <small>多款学术护眼风格</small></div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-theme="light" type="button"><span class="theme-dot light"></span> 浅色经典</button>' +
                '<button class="settings-opt-btn" data-set-theme="dark" type="button"><span class="theme-dot dark"></span> 暗色极客</button>' +
                '<button class="settings-opt-btn" data-set-theme="oled" type="button"><span class="theme-dot oled"></span> OLED纯黑</button>' +
                '<button class="settings-opt-btn" data-set-theme="warm" type="button"><span class="theme-dot warm"></span> 羊皮纸</button>' +
                '<button class="settings-opt-btn" data-set-theme="forest" type="button"><span class="theme-dot forest"></span> 考研青绿</button>' +
              '</div>' +
            '</div>' +

            '<!-- 亮度与暖光 -->' +
            '<div class="settings-row">' +
              '<div class="settings-label">💡 屏幕亮度与滤镜 <small>缓解夜间背词疲劳</small></div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-br="100" type="button">☀️ 100%</button>' +
                '<button class="settings-opt-btn" data-set-br="90" type="button">⛅ 90%</button>' +
                '<button class="settings-opt-btn" data-set-br="80" type="button">🌙 80%</button>' +
                '<button class="settings-opt-btn" data-set-br="70" type="button">🌑 70%</button>' +
                '<button class="settings-opt-btn" data-set-eye="warm" type="button">🕯️ 暖光防蓝光</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<!-- 卡片 2: 考研发音与语音配置 -->' +
          '<div class="settings-card">' +
            '<div class="settings-card-title">🔊 真人朗读口音与语速 <span>(真题听音与语感浸润)</span></div>' +
            
            '<div class="settings-row">' +
              '<div class="settings-label">🎙️ 发音口音</div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-lang="en-US" type="button">🇺🇸 美音标准 (en-US)</button>' +
                '<button class="settings-opt-btn" data-set-lang="en-GB" type="button">🇬🇧 英音正统 (en-GB)</button>' +
              '</div>' +
            '</div>' +

            '<div class="settings-row">' +
              '<div class="settings-label">⚡ 朗读语速</div>' +
              '<div class="settings-options">' +
                '<button class="settings-opt-btn" data-set-rate="0.8" type="button">0.8x 慢速精听</button>' +
                '<button class="settings-opt-btn" data-set-rate="0.92" type="button">0.92x 考研标准</button>' +
                '<button class="settings-opt-btn" data-set-rate="1.0" type="button">1.0x 原速</button>' +
                '<button class="settings-opt-btn" data-set-rate="1.15" type="button">1.15x 快速刷词</button>' +
              '</div>' +
            '</div>' +

            '<button class="settings-opt-btn" id="audition-preview-btn" style="background:var(--color-primary-soft);color:var(--color-primary);font-weight:600;padding:9px;border:1px dashed color-mix(in oklab, var(--color-primary) 40%, transparent)" type="button">▶️ 试听当前发音与语速效果</button>' +
          '</div>' +

          '<!-- 卡片 3: 交互反馈 -->' +
          '<div class="settings-card">' +
            '<div class="settings-card-title">🔔 交互音效与触感反馈 <span>(沉浸式按键反馈)</span></div>' +
            '<div class="settings-options">' +
              '<button class="settings-opt-btn" data-set-sound="1" type="button">🎵 交互音效 (开)</button>' +
              '<button class="settings-opt-btn" data-set-sound="0" type="button">🔇 交互音效 (关)</button>' +
              '<button class="settings-opt-btn" data-set-haptic="1" type="button">📳 手机微振 (开)</button>' +
              '<button class="settings-opt-btn" data-set-haptic="0" type="button">📴 手机微振 (关)</button>' +
            '</div>' +
          '</div>' +

          '<!-- 卡片 4: 学习数据中心 -->' +
          '<div class="settings-card">' +
            '<div class="settings-card-title">💾 学习进度数据与备份 <span>(防丢防删·一键跨设备迁移)</span></div>' +
            
            '<div class="settings-stats-badge">' +
              '<span>🎯 已熟记掌握单词：<strong id="stat-mastered-count">-- 词</strong></span>' +
              '<span>⭐ 重点攻坚收藏：<strong id="stat-fav-count">-- 词</strong></span>' +
            '</div>' +

            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
              '<button class="settings-opt-btn" id="export-backup-btn" style="flex:1" type="button">📤 导出学习进度备份 (JSON)</button>' +
              '<button class="settings-opt-btn" id="import-backup-btn" style="flex:1" type="button">📥 导入恢复进度</button>' +
              '<input type="file" id="backup-file-input" accept=".json" style="display:none">' +
            '</div>' +
          '</div>' +

          '<div style="text-align:center;font-size:11px;color:var(--color-text-faint);padding-top:4px">' +
            '考研英语（一）全能学术版 · 5,619 精纯大纲词汇 · 离线 PWA 就绪' +
          '</div>' +
        '</div>';

      // 绑定点击事件
      wrap.addEventListener('click', function(e) {
        if (e.target.closest('[data-settings-close]') || e.target === wrap) {
          Settings.close();
          return;
        }

        // 每日计划切换
        var dailyBtn = e.target.closest('[data-set-daily]');
        if (dailyBtn) {
          var dVal = parseInt(dailyBtn.getAttribute('data-set-daily'), 10);
          try {
            var s = JSON.parse(localStorage.getItem('kaoyan_study_v3') || '{}');
            s.daily = dVal;
            localStorage.setItem('kaoyan_study_v3', JSON.stringify(s));
            Settings.syncUI(wrap);
            if (window.KaoyanToast) window.KaoyanToast('🎯 每日计划已设为 ' + dVal + ' 词/天');
            if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          } catch(err){}
          return;
        }

        // 字号切换
        var fsBtn = e.target.closest('[data-set-fs]');
        if (fsBtn) {
          var val = fsBtn.getAttribute('data-set-fs');
          Settings.set('kao_fs', val);
          Settings.apply();
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast('🔠 字号已更新');
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 主题切换
        var themeBtn = e.target.closest('[data-set-theme]');
        if (themeBtn) {
          var tVal = themeBtn.getAttribute('data-set-theme');
          Settings.set('theme', tVal);
          Settings.apply();
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast('🎨 主题已切换为：' + themeBtn.textContent.trim());
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 亮度切换
        var brBtn = e.target.closest('[data-set-br]');
        if (brBtn) {
          var brVal = brBtn.getAttribute('data-set-br');
          Settings.set('kao_brightness', brVal);
          Settings.apply();
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast('💡 亮度已设为 ' + brVal + '%');
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 暖光切换
        var eyeBtn = e.target.closest('[data-set-eye]');
        if (eyeBtn) {
          var curE = Settings.get('kao_eyecare', 'none');
          var nextE = curE === 'warm' ? 'none' : 'warm';
          Settings.set('kao_eyecare', nextE);
          Settings.apply();
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast(nextE === 'warm' ? '🕯️ 暖光防蓝光护眼模式已开启' : '✓ 暖光滤镜已关闭');
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 口音切换
        var langBtn = e.target.closest('[data-set-lang]');
        if (langBtn) {
          var lVal = langBtn.getAttribute('data-set-lang');
          Settings.set('kao_ttslang', lVal);
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast('🔊 朗读口音：' + (lVal === 'en-US' ? '美音' : '英音'));
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 语速切换
        var rateBtn = e.target.closest('[data-set-rate]');
        if (rateBtn) {
          var rVal = rateBtn.getAttribute('data-set-rate');
          Settings.set('kao_ttsrate', rVal);
          Settings.syncUI(wrap);
          if (window.KaoyanToast) window.KaoyanToast('⚡ 语速已设为 ' + rVal + 'x');
          if (window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          return;
        }

        // 试听发音
        var auditBtn = e.target.closest('#audition-preview-btn');
        if (auditBtn) {
          var testSentence = "Academic persistence and rigorous methodology ensure remarkable triumph in the examination.";
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            var utt = new SpeechSynthesisUtterance(testSentence);
            utt.lang = Settings.get('kao_ttslang', 'en-US');
            utt.rate = parseFloat(Settings.get('kao_ttsrate', '0.92')) || 0.92;
            window.speechSynthesis.speak(utt);
            if (window.KaoyanToast) window.KaoyanToast('🔊 正在试听：' + (utt.lang === 'en-US' ? '美音' : '英音') + ' · ' + utt.rate + 'x');
          }
          return;
        }

        // 音效开关
        var sndBtn = e.target.closest('[data-set-sound]');
        if (sndBtn) {
          var sVal = sndBtn.getAttribute('data-set-sound');
          Settings.set('kao_sound', sVal);
          Settings.syncUI(wrap);
          if (sVal === '1' && window.KaoyanAudio) window.KaoyanAudio.playSuccess();
          if (window.KaoyanToast) window.KaoyanToast(sVal === '1' ? '🎵 交互音效已开启' : '🔇 交互音效已静音');
          return;
        }

        // 触感开关
        var hapBtn = e.target.closest('[data-set-haptic]');
        if (hapBtn) {
          var hVal = hapBtn.getAttribute('data-set-haptic');
          Settings.set('kao_haptic', hVal);
          Settings.syncUI(wrap);
          if (hVal === '1' && navigator.vibrate) try { navigator.vibrate(20); } catch(e){}
          if (window.KaoyanToast) window.KaoyanToast(hVal === '1' ? '📳 触感振动已开启' : '📴 触感振动已关闭');
          return;
        }

        // 导出备份
        var expBtn = e.target.closest('#export-backup-btn');
        if (expBtn) {
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
          if (window.KaoyanToast) window.KaoyanToast('✓ 学习进度备份文件已导出！');
          return;
        }

        // 导入备份
        var impBtn = e.target.closest('#import-backup-btn');
        if (impBtn) {
          var fi = wrap.querySelector('#backup-file-input');
          if (fi) fi.click();
          return;
        }
      });

      // 监听文件导入
      var fileInput = wrap.querySelector('#backup-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', function() {
          var f = fileInput.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function(e) {
            try {
              var data = JSON.parse(e.target.result);
              if (data.kaoyan_study_v3) localStorage.setItem('kaoyan_study_v3', data.kaoyan_study_v3);
              if (data.kao_exam_mastered) localStorage.setItem('kao_exam_mastered', data.kao_exam_mastered);
              if (data.kao_quiz_favs) localStorage.setItem('kao_quiz_favs', data.kao_quiz_favs);
              if (window.KaoyanToast) window.KaoyanToast('✓ 学习进度已成功恢复！正在刷新...');
              setTimeout(function(){ location.reload(); }, 1200);
            } catch(err) {
              alert('备份文件格式不正确。');
            }
          };
          reader.readAsText(f);
        });
      }

      return wrap;
    }
  };

  // 自动挂载设置按钮并初始化应用
  Settings.apply();
  window.KaoyanSettings = Settings;

  // 在页面头部自动注入设置按钮（若尚未放置）
  function mountSettingsTrigger() {
    var headerInner = document.querySelector('.header-inner');
    if (headerInner && !document.querySelector('[data-settings-open]')) {
      var btn = document.createElement('button');
      btn.className = 'settings-btn';
      btn.setAttribute('data-settings-open', 'true');
      btn.setAttribute('aria-label', '个性化偏好设置');
      btn.title = '⚙️ 系统设置 (字号/亮度/主题/语速/备份)';
      btn.innerHTML = '⚙️';
      btn.type = 'button';
      headerInner.appendChild(btn);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountSettingsTrigger);
  } else {
    mountSettingsTrigger();
  }

  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-settings-open]')) {
      Settings.open();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      Settings.close();
    }
  });

  // 全局通用收纳式快捷导航菜单控制器 (Universal Collapsible Header Navigation)
  function initUniversalHeaderMenu() {
    function setupMenu() {
      var menuBtns = document.querySelectorAll('[data-nav-menu-toggle], #study-menu-toggle, #words-menu-toggle');
      var navBoxes = document.querySelectorAll('[data-nav-menu-box], #study-top-nav-box, #words-top-nav-box');
      
      menuBtns.forEach(function (btn) {
        if (btn._navBound) return;
        btn._navBound = true;
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var targetBox = document.querySelector('[data-nav-menu-box]') || document.getElementById('study-top-nav-box') || document.getElementById('words-top-nav-box');
          if (targetBox) {
            var isHidden = targetBox.hidden;
            targetBox.hidden = !isHidden;
            btn.classList.toggle('active', !isHidden);
          }
        });
      });

      document.addEventListener('click', function (e) {
        navBoxes.forEach(function (box) {
          if (!box.hidden && !box.contains(e.target)) {
            var isBtn = false;
            menuBtns.forEach(function(b) { if (b === e.target || b.contains(e.target)) isBtn = true; });
            if (!isBtn) {
              box.hidden = true;
              menuBtns.forEach(function(b) { b.classList.remove('active'); });
            }
          }
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          navBoxes.forEach(function (box) { box.hidden = true; });
          menuBtns.forEach(function (b) { b.classList.remove('active'); });
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupMenu);
    } else {
      setupMenu();
    }
  }
  initUniversalHeaderMenu();

})();

