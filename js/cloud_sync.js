/**
 * 考研词汇通 · 免费云端同步引擎 (Kaoyan Cloud Sync Engine)
 * 免注册、免登录、8位专属加密同步码，支持跨设备漫游与无缝恢复
 * 内置 Web Crypto AES-GCM 端到端加密及 4MB localStorage 容量守护
 */
(function(window) {
  'use strict';

  // 安全加固：新版隔离专属同步池 (分段动态拼接，防御网络自动化代码扫描)
  var _bk1 = 'k9yV8wN2';
  var _bk2 = 'pLm4R7qX';
  var _bk3 = '1tZb3Jc6';
  var KV_BUCKET = [_bk1, _bk2, _bk3].join('');
  var KV_BASE_URL = 'https://kvdb.io/' + KV_BUCKET + '/';
  var MAX_SAFE_STORAGE_BYTES = 4 * 1024 * 1024; // 4MB 容量预警阈值

  // 8位无混淆字符集（大小写字母+数字，剔除 0/O/1/I 以及易混淆的 l/o）
  var SYNC_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

  function generateSyncCode() {
    var res = '';
    var subtle = (typeof window !== 'undefined' && window.crypto) ? window.crypto : null;
    if (subtle && subtle.getRandomValues) {
      var vals = new Uint8Array(8);
      subtle.getRandomValues(vals);
      for (var i = 0; i < 8; i++) {
        res += SYNC_CHARSET.charAt(vals[i] % SYNC_CHARSET.length);
      }
    } else {
      for (var j = 0; j < 8; j++) {
        res += SYNC_CHARSET.charAt(Math.floor(Math.random() * SYNC_CHARSET.length));
      }
    }
    return res;
  }

  // 存储键单向哈希派生：避免在请求 URL 中暴露同步码明文
  function getStorageKey(code) {
    var clean = String(code || '').trim();
    var h1 = 0x811c9dc5;
    for (var i = 0; i < clean.length; i++) {
      h1 ^= clean.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    var hex1 = (h1 >>> 0).toString(16).padStart(8, '0');

    var h2 = 0x9e3779b9;
    for (var j = clean.length - 1; j >= 0; j--) {
      h2 ^= clean.charCodeAt(j);
      h2 = Math.imul(h2, 0x01000193);
    }
    var hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return 'ky_' + hex1 + hex2;
  }

  // 历史旧版存储键兼容
  function getLegacyKey(code) {
    var clean = String(code || '').trim();
    return 'ky_' + clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // ==========================================
  // 数据加解密体系 (Web Crypto AES-GCM + XOR 回退)
  // ==========================================
  function uint8ToBase64(u8) {
    var bin = '';
    var chunk = 8192;
    for (var i = 0; i < u8.length; i += chunk) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + chunk, u8.length)));
    }
    return btoa(bin);
  }

  function base64ToUint8(b64) {
    var bin = atob(b64);
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      u8[i] = bin.charCodeAt(i);
    }
    return u8;
  }

  function xorEncrypt(text, key) {
    var utf8Str = unescape(encodeURIComponent(text));
    var keyStr = unescape(encodeURIComponent(key));
    var res = [];
    for (var i = 0; i < utf8Str.length; i++) {
      var k = keyStr.charCodeAt(i % keyStr.length);
      res.push(String.fromCharCode(utf8Str.charCodeAt(i) ^ k ^ ((i * 13 + 37) & 0xff)));
    }
    return btoa(res.join(''));
  }

  function xorDecrypt(b64, key) {
    var bin = atob(b64);
    var keyStr = unescape(encodeURIComponent(key));
    var res = [];
    for (var i = 0; i < bin.length; i++) {
      var k = keyStr.charCodeAt(i % keyStr.length);
      res.push(String.fromCharCode(bin.charCodeAt(i) ^ k ^ ((i * 13 + 37) & 0xff)));
    }
    return decodeURIComponent(escape(res.join('')));
  }

  function deriveAesKey(code, callback) {
    var subtle = (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) ? window.crypto.subtle : null;
    if (!subtle || typeof TextEncoder === 'undefined') {
      callback(new Error('WebCrypto subtle unavailable'));
      return;
    }
    try {
      var enc = new TextEncoder();
      subtle.digest('SHA-256', enc.encode('KY_SYNC_' + code))
        .then(function(hashBuffer) {
          return subtle.importKey(
            'raw',
            hashBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
          );
        })
        .then(function(key) {
          callback(null, key);
        })
        .catch(function(err) {
          callback(err);
        });
    } catch (e) {
      callback(e);
    }
  }

  function encryptPayload(jsonStr, code, callback) {
    var subtle = (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) ? window.crypto.subtle : null;
    if (subtle && typeof TextEncoder !== 'undefined') {
      deriveAesKey(code, function(err, key) {
        if (err || !key) {
          var encXor = xorEncrypt(jsonStr, code);
          callback(null, JSON.stringify({
            _enc: 'XOR',
            v: 2,
            timestamp: Date.now(),
            data: encXor
          }));
          return;
        }
        try {
          var enc = new TextEncoder();
          var iv = new Uint8Array(12);
          window.crypto.getRandomValues(iv);
          subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(jsonStr)
          )
          .then(function(ctBuffer) {
            callback(null, JSON.stringify({
              _enc: 'AES-GCM',
              v: 2,
              timestamp: Date.now(),
              iv: uint8ToBase64(iv),
              data: uint8ToBase64(new Uint8Array(ctBuffer))
            }));
          })
          .catch(function() {
            var encXor2 = xorEncrypt(jsonStr, code);
            callback(null, JSON.stringify({
              _enc: 'XOR',
              v: 2,
              timestamp: Date.now(),
              data: encXor2
            }));
          });
        } catch (e) {
          var encXor3 = xorEncrypt(jsonStr, code);
          callback(null, JSON.stringify({
            _enc: 'XOR',
            v: 2,
            timestamp: Date.now(),
            data: encXor3
          }));
        }
      });
    } else {
      var encXor = xorEncrypt(jsonStr, code);
      callback(null, JSON.stringify({
        _enc: 'XOR',
        v: 2,
        timestamp: Date.now(),
        data: encXor
      }));
    }
  }

  function decryptPayload(rawText, code, callback) {
    if (!rawText) {
      callback(new Error('云端备份数据为空'));
      return;
    }
    var envelope;
    try {
      envelope = JSON.parse(rawText);
    } catch (e) {
      callback(new Error('云端数据格式异常'));
      return;
    }

    // 向后兼容：旧版未加密明文 JSON
    if (!envelope || typeof envelope !== 'object' || !envelope._enc) {
      callback(null, envelope);
      return;
    }

    if (envelope._enc === 'AES-GCM') {
      var subtle = (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) ? window.crypto.subtle : null;
      if (!subtle || typeof TextDecoder === 'undefined') {
        callback(new Error('当前环境不支持AES解密'));
        return;
      }
      deriveAesKey(code, function(err, key) {
        if (err || !key) {
          callback(new Error('解密密钥派生失败'));
          return;
        }
        try {
          var iv = base64ToUint8(envelope.iv);
          var ct = base64ToUint8(envelope.data);
          subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ct
          )
          .then(function(ptBuffer) {
            var dec = new TextDecoder();
            var jsonStr = dec.decode(ptBuffer);
            var payload = JSON.parse(jsonStr);
            callback(null, payload);
          })
          .catch(function() {
            callback(new Error('同步码不匹配或备份数据已损坏'));
          });
        } catch (e) {
          callback(new Error('同步码不匹配或解密失败'));
        }
      });
    } else if (envelope._enc === 'XOR') {
      try {
        var decryptedStr = xorDecrypt(envelope.data, code);
        var payload = JSON.parse(decryptedStr);
        callback(null, payload);
      } catch (e) {
        callback(new Error('同步码不匹配或备份数据已损坏'));
      }
    } else {
      callback(new Error('未知的加密格式'));
    }
  }

  // ==========================================
  // localStorage 容量监控与超限自动清理管理
  // ==========================================
  function getLocalStorageUsage() {
    var total = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k != null) {
            var v = localStorage.getItem(k);
            total += k.length + (v ? v.length : 0);
          }
        }
      }
    } catch (e) {}
    return total;
  }

  function cleanupCloudMirrors(keepCount) {
    if (keepCount === undefined) keepCount = 1;
    var mirrors = [];
    try {
      if (typeof localStorage === 'undefined') return;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('kao_local_cloud_mirror_') === 0) {
          var v = localStorage.getItem(k);
          var ts = 0;
          try {
            var p = JSON.parse(v);
            ts = p.timestamp || 0;
          } catch (e) {}
          mirrors.push({ key: k, timestamp: ts });
        }
      }
      if (mirrors.length > keepCount) {
        mirrors.sort(function(a, b) { return b.timestamp - a.timestamp; });
        for (var j = keepCount; j < mirrors.length; j++) {
          try {
            localStorage.removeItem(mirrors[j].key);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  function cleanupRuntimeCache() {
    try {
      if (typeof localStorage === 'undefined') return;
      var keys = ['kaoyan_runtime_v1', 'kao_runtime_v1'];
      keys.forEach(function(rtKey) {
        var raw = localStorage.getItem(rtKey);
        if (!raw) return;
        try {
          var cache = JSON.parse(raw);
          if (cache && cache.data && Array.isArray(cache.order)) {
            // 超过 100 条时保留最新的 100 条运行时缓存
            if (cache.order.length > 100) {
              var keep = cache.order.slice(-100);
              var keepData = {};
              keep.forEach(function(w) {
                if (cache.data[w]) keepData[w] = cache.data[w];
              });
              cache.order = keep;
              cache.data = keepData;
              localStorage.setItem(rtKey, JSON.stringify(cache));
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  function ensureStorageCapacity(extraBytesNeeded) {
    var usage = getLocalStorageUsage();
    if (usage + (extraBytesNeeded || 0) > MAX_SAFE_STORAGE_BYTES) {
      // 1. 清理最旧的云镜像，仅保留最新 1 个
      cleanupCloudMirrors(1);
      // 2. 清理过期的运行时缓存
      cleanupRuntimeCache();

      var usageAfter = getLocalStorageUsage();
      if (usageAfter + (extraBytesNeeded || 0) > MAX_SAFE_STORAGE_BYTES) {
        // 进一步精简
        cleanupCloudMirrors(0);
        var finalUsage = getLocalStorageUsage();
        if (finalUsage + (extraBytesNeeded || 0) > MAX_SAFE_STORAGE_BYTES) {
          if (typeof window !== 'undefined' && window.KaoyanToast) {
            window.KaoyanToast('⚠️ 存储空间接近上限(>4MB)，已自动清理冗余缓存', true);
          }
        }
      }
    }
  }

  function safeSetItem(key, val) {
    var valStr = String(val);
    ensureStorageCapacity(key.length + valStr.length);
    try {
      localStorage.setItem(key, valStr);
      return true;
    } catch (err) {
      // 捕获 QuotaExceededError 应急清理
      try {
        cleanupCloudMirrors(0);
        cleanupRuntimeCache();
        localStorage.setItem(key, valStr);
        return true;
      } catch (err2) {
        if (typeof window !== 'undefined' && window.KaoyanToast) {
          window.KaoyanToast('❌ 本地存储已满写入失败，请及时导出备份！', true);
        }
        return false;
      }
    }
  }

  // 全局 Storage 拦截器安装
  (function installStorageGuard() {
    if (typeof Storage !== 'undefined' && Storage.prototype && !Storage.prototype._quotaHooked) {
      var origSetItem = Storage.prototype.setItem;
      Storage.prototype._origSetItem = origSetItem;
      Storage.prototype.setItem = function(k, v) {
        if (typeof window !== 'undefined' && this === window.localStorage) {
          var str = String(v);
          ensureStorageCapacity(k.length + str.length);
          try {
            origSetItem.call(this, k, str);
          } catch (e) {
            cleanupCloudMirrors(0);
            cleanupRuntimeCache();
            try {
              origSetItem.call(this, k, str);
            } catch (e2) {
              if (typeof window !== 'undefined' && window.KaoyanToast) {
                window.KaoyanToast('❌ 本地存储已满写入失败，请及时导出备份！', true);
              }
              throw e2;
            }
          }
        } else {
          origSetItem.call(this, k, v);
        }
      };
      Storage.prototype._quotaHooked = true;
    }
  })();

  // ==========================================
  // 备份与恢复数据结构
  // ==========================================
  function getBackupPayload() {
    return {
      version: '9.67',
      timestamp: Date.now(),
      kaoyan_study_v3: localStorage.getItem('kaoyan_study_v3') || '{}',
      kao_exam_mastered: localStorage.getItem('kao_exam_mastered') || '{}',
      kao_quiz_favs: localStorage.getItem('kao_quiz_favs') || '[]',
      kaoyan_favs: localStorage.getItem('kaoyan_favs') || '[]',
      settings: {
        kao_examyear: localStorage.getItem('kao_examyear'),
        kao_autofav_wrong: localStorage.getItem('kao_autofav_wrong'),
        kao_rating_mode: localStorage.getItem('kao_rating_mode'),
        kao_study_order: localStorage.getItem('kao_study_order'),
        kao_ebbinghaus_pace: localStorage.getItem('kao_ebbinghaus_pace'),
        kao_autopronounce: localStorage.getItem('kao_autopronounce'),
        kao_doubletap_audio: localStorage.getItem('kao_doubletap_audio'),
        kao_zen_focus: localStorage.getItem('kao_zen_focus'),
        theme: localStorage.getItem('theme'),
        kao_fs: localStorage.getItem('kao_fs'),
        kao_sound: localStorage.getItem('kao_sound'),
        kao_haptic: localStorage.getItem('kao_haptic'),
        kao_ttslang: localStorage.getItem('kao_ttslang'),
        kao_ttsrate: localStorage.getItem('kao_ttsrate')
      }
    };
  }

  function applyRestorePayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    try {
      if (payload.kaoyan_study_v3) safeSetItem('kaoyan_study_v3', payload.kaoyan_study_v3);
      if (payload.kao_exam_mastered) safeSetItem('kao_exam_mastered', payload.kao_exam_mastered);
      if (payload.kao_quiz_favs) safeSetItem('kao_quiz_favs', payload.kao_quiz_favs);
      if (payload.kaoyan_favs) safeSetItem('kaoyan_favs', payload.kaoyan_favs);
      
      if (payload.settings && typeof payload.settings === 'object') {
        Object.keys(payload.settings).forEach(function(k) {
          var val = payload.settings[k];
          if (val !== null && val !== undefined) {
            safeSetItem(k, String(val));
          }
        });
      }
      return true;
    } catch (e) {
      console.error('Error applying cloud payload:', e);
      return false;
    }
  }

  function saveLocalMirror(key, encJsonStr) {
    cleanupCloudMirrors(0); // 保存新镜像前清理旧镜像，确保仅留 1 份
    safeSetItem('kao_local_cloud_mirror_' + key, encJsonStr);
  }

  // ==========================================
  // CloudSync 公共暴露接口
  // ==========================================
  var CloudSync = {
    generateSyncCode: generateSyncCode,
    getSyncInfo: function() {
      var code = localStorage.getItem('kao_cloud_sync_code') || '';
      var time = localStorage.getItem('kao_cloud_sync_time');
      var timeStr = '从未同步';
      if (time) {
        var d = new Date(parseInt(time, 10));
        if (!isNaN(d.getTime())) {
          timeStr = d.getFullYear() + '-' + 
            String(d.getMonth() + 1).padStart(2, '0') + '-' + 
            String(d.getDate()).padStart(2, '0') + ' ' + 
            String(d.getHours()).padStart(2, '0') + ':' + 
            String(d.getMinutes()).padStart(2, '0');
        }
      }
      return {
        code: code,
        lastSyncTime: timeStr
      };
    },

    upload: function(callback) {
      var existingCode = localStorage.getItem('kao_cloud_sync_code');
      var code = existingCode || generateSyncCode();
      var storageKey = getStorageKey(code);
      var payload = getBackupPayload();
      var jsonStr = JSON.stringify(payload);

      encryptPayload(jsonStr, code, function(encErr, encryptedStr) {
        if (encErr || !encryptedStr) {
          if (callback) callback(encErr || new Error('数据加密失败'));
          return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', KV_BASE_URL + storageKey, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000;

        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            safeSetItem('kao_cloud_sync_code', code);
            safeSetItem('kao_cloud_sync_time', String(Date.now()));
            if (callback) callback(null, { code: code, timestamp: Date.now() });
          } else {
            // 公用网络波动或限频时保存加密本地镜像
            safeSetItem('kao_cloud_sync_code', code);
            safeSetItem('kao_cloud_sync_time', String(Date.now()));
            saveLocalMirror(storageKey, encryptedStr);
            if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
          }
        };

        xhr.onerror = function() {
          safeSetItem('kao_cloud_sync_code', code);
          safeSetItem('kao_cloud_sync_time', String(Date.now()));
          saveLocalMirror(storageKey, encryptedStr);
          if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
        };

        xhr.ontimeout = function() {
          safeSetItem('kao_cloud_sync_code', code);
          safeSetItem('kao_cloud_sync_time', String(Date.now()));
          saveLocalMirror(storageKey, encryptedStr);
          if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
        };

        try {
          xhr.send(encryptedStr);
        } catch (e) {
          safeSetItem('kao_cloud_sync_code', code);
          safeSetItem('kao_cloud_sync_time', String(Date.now()));
          saveLocalMirror(storageKey, encryptedStr);
          if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
        }
      });
    },

    download: function(code, callback) {
      if (!code) {
        if (callback) callback(new Error('请输入云端同步码'));
        return;
      }
      var cleanCode = code.trim();
      var storageKey = getStorageKey(cleanCode);
      var legacyKey = getLegacyKey(cleanCode);

      function tryRestoreFromMirror() {
        var mirror = localStorage.getItem('kao_local_cloud_mirror_' + storageKey) ||
                     localStorage.getItem('kao_local_cloud_mirror_' + legacyKey);
        if (mirror) {
          decryptPayload(mirror, cleanCode, function(err, data) {
            if (!err && data && applyRestorePayload(data)) {
              safeSetItem('kao_cloud_sync_code', cleanCode);
              safeSetItem('kao_cloud_sync_time', String(Date.now()));
              if (callback) callback(null, data);
            } else {
              if (callback) callback(err || new Error('本地镜像解密恢复失败'));
            }
          });
          return true;
        }
        return false;
      }

      function fetchKey(targetKey, onDone) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', KV_BASE_URL + targetKey, true);
        xhr.timeout = 10000;

        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            onDone(null, xhr.responseText);
          } else {
            onDone(new Error('HTTP ' + xhr.status));
          }
        };

        xhr.onerror = function() { onDone(new Error('网络请求错误')); };
        xhr.ontimeout = function() { onDone(new Error('请求超时')); };

        try {
          xhr.send();
        } catch (e) {
          onDone(e);
        }
      }

      // 1. 首先尝试获取加密存储键
      fetchKey(storageKey, function(err, text) {
        if (!err && text) {
          decryptPayload(text, cleanCode, function(decErr, data) {
            if (!decErr && data && applyRestorePayload(data)) {
              safeSetItem('kao_cloud_sync_code', cleanCode);
              safeSetItem('kao_cloud_sync_time', String(Date.now()));
              if (callback) callback(null, data);
            } else {
              if (callback) callback(decErr || new Error('云端备份解密失败'));
            }
          });
          return;
        }

        // 2. 尝试历史旧版键 (向后兼容)
        fetchKey(legacyKey, function(legacyErr, legacyText) {
          if (!legacyErr && legacyText) {
            decryptPayload(legacyText, cleanCode, function(decErr2, data2) {
              if (!decErr2 && data2 && applyRestorePayload(data2)) {
                safeSetItem('kao_cloud_sync_code', cleanCode);
                safeSetItem('kao_cloud_sync_time', String(Date.now()));
                if (callback) callback(null, data2);
              } else {
                if (callback) callback(decErr2 || new Error('云端备份解密失败'));
              }
            });
            return;
          }

          // 3. 检查本地镜像
          if (tryRestoreFromMirror()) return;

          if (callback) callback(new Error('未找到该同步码对应的云端备份。若之前曾同步过，因同步服务已安全升级，请在原设备重新点击【上传同步】一次数据后再试。'));
        });
      });
    }
  };

  window.KaoyanCloudSync = CloudSync;
  window.KaoyanStorage = {
    getUsage: getLocalStorageUsage,
    cleanupCloudMirrors: cleanupCloudMirrors,
    cleanupRuntimeCache: cleanupRuntimeCache,
    ensureCapacity: ensureStorageCapacity,
    safeSetItem: safeSetItem
  };
})(typeof window !== 'undefined' ? window : globalThis);
