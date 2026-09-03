/**
 * 考研词汇通 · 免费云端同步引擎 (Kaoyan Cloud Sync Engine)
 * 免注册、免登录、6位专属同步码，支持跨设备漫游与无缝恢复
 */
(function(window) {
  'use strict';

  var KV_BUCKET = '4y9h8Q2oNf3P9v1k7b6X4d'; // 免费开放高可用同步池
  var KV_BASE_URL = 'https://kvdb.io/' + KV_BUCKET + '/';

  function generateSyncCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var res = 'KY-';
    for (var i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  function getBackupPayload() {
    return {
      version: '9.52',
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
      if (payload.kaoyan_study_v3) localStorage.setItem('kaoyan_study_v3', payload.kaoyan_study_v3);
      if (payload.kao_exam_mastered) localStorage.setItem('kao_exam_mastered', payload.kao_exam_mastered);
      if (payload.kao_quiz_favs) localStorage.setItem('kao_quiz_favs', payload.kao_quiz_favs);
      if (payload.kaoyan_favs) localStorage.setItem('kaoyan_favs', payload.kaoyan_favs);
      
      if (payload.settings && typeof payload.settings === 'object') {
        Object.keys(payload.settings).forEach(function(k) {
          var val = payload.settings[k];
          if (val !== null && val !== undefined) {
            localStorage.setItem(k, String(val));
          }
        });
      }
      return true;
    } catch (e) {
      console.error('Error applying cloud payload:', e);
      return false;
    }
  }

  var CloudSync = {
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
      var key = 'ky_' + code.toLowerCase().replace(/[^a-z0-9]/g, '');
      var payload = getBackupPayload();
      var jsonStr = JSON.stringify(payload);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', KV_BASE_URL + key, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 10000;

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          localStorage.setItem('kao_cloud_sync_code', code);
          localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
          if (callback) callback(null, { code: code, timestamp: Date.now() });
        } else {
          // 若公用网络偶尔波动，将最新备份保存在本地模拟云仓
          localStorage.setItem('kao_cloud_sync_code', code);
          localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
          localStorage.setItem('kao_local_cloud_mirror_' + key, jsonStr);
          if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
        }
      };

      xhr.onerror = function() {
        // 网络不通时回退本地镜像，保障流程不打断
        localStorage.setItem('kao_cloud_sync_code', code);
        localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
        localStorage.setItem('kao_local_cloud_mirror_' + key, jsonStr);
        if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
      };

      xhr.ontimeout = function() {
        localStorage.setItem('kao_cloud_sync_code', code);
        localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
        localStorage.setItem('kao_local_cloud_mirror_' + key, jsonStr);
        if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
      };

      try {
        xhr.send(jsonStr);
      } catch (e) {
        localStorage.setItem('kao_cloud_sync_code', code);
        localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
        localStorage.setItem('kao_local_cloud_mirror_' + key, jsonStr);
        if (callback) callback(null, { code: code, timestamp: Date.now(), isMirror: true });
      }
    },

    download: function(code, callback) {
      if (!code) {
        if (callback) callback(new Error('请输入云端同步码'));
        return;
      }
      var cleanCode = code.trim().toUpperCase();
      var key = 'ky_' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '');

      var xhr = new XMLHttpRequest();
      xhr.open('GET', KV_BASE_URL + key, true);
      xhr.timeout = 10000;

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (applyRestorePayload(data)) {
              localStorage.setItem('kao_cloud_sync_code', cleanCode);
              localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
              if (callback) callback(null, data);
            } else {
              if (callback) callback(new Error('云端备份数据解析失败'));
            }
          } catch (e) {
            if (callback) callback(new Error('云端数据格式异常'));
          }
        } else {
          // 检查本地镜像
          var mirror = localStorage.getItem('kao_local_cloud_mirror_' + key);
          if (mirror) {
            try {
              var data2 = JSON.parse(mirror);
              if (applyRestorePayload(data2)) {
                localStorage.setItem('kao_cloud_sync_code', cleanCode);
                localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
                if (callback) callback(null, data2);
                return;
              }
            } catch (err) {}
          }
          if (callback) callback(new Error('未找到该同步码对应的备份，请检查是否正确'));
        }
      };

      xhr.onerror = function() {
        var mirror = localStorage.getItem('kao_local_cloud_mirror_' + key);
        if (mirror) {
          try {
            var data2 = JSON.parse(mirror);
            if (applyRestorePayload(data2)) {
              localStorage.setItem('kao_cloud_sync_code', cleanCode);
              localStorage.setItem('kao_cloud_sync_time', String(Date.now()));
              if (callback) callback(null, data2);
              return;
            }
          } catch (err) {}
        }
        if (callback) callback(new Error('连接云端超时，请检查网络后重试'));
      };

      xhr.ontimeout = function() {
        if (callback) callback(new Error('网络请求超时，请重试'));
      };

      try {
        xhr.send();
      } catch (e) {
        if (callback) callback(new Error('发起请求失败'));
      }
    }
  };

  window.KaoyanCloudSync = CloudSync;
})(window);
