/* 考研词汇 — 多账号门禁 + AI 双通道
 * 多账号: 每个密码对应一个独立账号,学习进度/统计/AI缓存按账号隔离
 *         (owner 沿用旧存储 key,不丢已有进度;其他账号独立存储)
 * 门禁: 纯前端防普通访客;密码混淆存储,懂技术者可逆向(物理限制)。
 * AI: 优先 Cloudflare Worker 代理(Key 在服务端),失败自动回退直连。 */
(function () {
  'use strict';
  var SALT = 'kaoyan2026';
  function deob(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      o += String.fromCharCode(s.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
    }
    return o;
  }
  // ===== 账号表: 每个密码一个独立账号 =====
  // 新增账号: 在下方加一行 { id:'名字', pwd: deob('混淆串') }, 混淆串 = 密码 XOR 盐(生成方式见 README)
  var ACCOUNTS = [
    { id: 'owner', pwd: deob('\x13\x18\x1e\x0e\x03\x0c') }, // xyqwbb
    { id: 'friend', pwd: deob('\x13\x18\x1e\x4c\x53\x5f') } // xyq521
  ];
  var KEY = deob('\x18\x0a\x42\x48\x54\x5d\x0a\x53\x0a\x0e\x58\x07\x5d\x4a\x56\x5a\x0a\x05\x02\x57\x5a\x51\x58\x40\x00\x08\x56\x04\x57\x01\x0e\x51\x5a\x40\x59'); // 回退用内置 Key
  var LEGACY_GATE = 'kaoyan_gate_v1'; // 旧版单账号 token(owner 兼容)
  var PROXY = 'https://kaoyan-words-proxy.bobwu520520.workers.dev/v1/chat/completions';
  var DIRECT = 'https://api.deepseek.com/v1/chat/completions';
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return String(h) + ':' + s.length;
  }
  function gateKey(id) { return 'kaoyan_gate_' + id; }

  // 按密码匹配账号; 成功返回账号id, 失败返回 null
  function login(pwd) {
    pwd = String(pwd || '');
    for (var i = 0; i < ACCOUNTS.length; i++) {
      if (ACCOUNTS[i].pwd === pwd) {
        try { localStorage.setItem(gateKey(ACCOUNTS[i].id), hash(pwd)); } catch (e) {}
        return ACCOUNTS[i].id;
      }
    }
    return null;
  }
  // 当前登录账号; 未登录返回 null
  function currentUser() {
    try {
      for (var i = 0; i < ACCOUNTS.length; i++) {
        var a = ACCOUNTS[i];
        var ok = localStorage.getItem(gateKey(a.id)) === hash(a.pwd);
        if (!ok && a.id === 'owner') ok = localStorage.getItem(LEGACY_GATE) === hash(a.pwd); // 兼容旧 token
        if (ok) return a.id;
      }
    } catch (e) {}
    return null;
  }
  function logout() {
    try {
      for (var i = 0; i < ACCOUNTS.length; i++) localStorage.removeItem(gateKey(ACCOUNTS[i].id));
      localStorage.removeItem(LEGACY_GATE);
    } catch (e) {}
  }
  // 存储 key 按账号隔离: owner 沿用旧 key(不丢进度), 其他账号加后缀
  function storageKey(base) {
    var u = currentUser();
    if (!u || u === 'owner') return base;
    return base + '_' + u;
  }

  // 页面门禁(在 body 渲染前执行,内容不闪现)
  var path = (location.pathname || '').split('/').pop();
  if (path !== 'gate.html' && !currentUser()) {
    location.replace('gate.html?next=' + encodeURIComponent(path || 'study.html'));
    return;
  }

  // 用户显式配置过的自定义网关(非默认 DeepSeek 地址);Key 可空(空则用门禁令牌)
  function getCustom() {
    try {
      var c = JSON.parse(localStorage.getItem(storageKey('kaoyan_ai_config')) || '{}');
      if (c && c.baseUrl && c.baseUrl.indexOf('api.deepseek.com') < 0 && c.baseUrl.indexOf('deepseek.com') < 0) {
        return { base: c.baseUrl, key: c.apiKey || '' };
      }
    } catch (e) {}
    return null;
  }
  function post(url, headers, body, signal) {
    return fetch(url, { method: 'POST', headers: headers, body: body, signal: signal }).then(function (r) {
      return r.text().then(function (t) { if (!r.ok) throw new Error(t || ('HTTP ' + r.status)); return t; });
    });
  }
  function chat(payloadStr, custom) {
    if (custom && custom.base) {
      var h = { 'Content-Type': 'application/json' };
      if (custom.key) h['Authorization'] = 'Bearer ' + custom.key;
      else h['X-Gate-Token'] = ACCOUNTS[0].pwd;
      return post(custom.base.replace(/\/$/, '') + '/chat/completions', h, payloadStr);
    }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 12000);
    return post(PROXY, { 'Content-Type': 'application/json', 'X-Gate-Token': ACCOUNTS[0].pwd }, payloadStr, ctrl.signal)
      .then(function (t) { clearTimeout(timer); return t; })
      .catch(function (e) {
        clearTimeout(timer);
        return post(DIRECT, { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY }, payloadStr);
      });
  }

  window.KaoyanGate = {
    login: login,
    logout: logout,
    currentUser: currentUser,
    storageKey: storageKey,
    hash: hash,
    apiKey: KEY,
    chat: chat,
    getCustom: getCustom,
    proxyBase: PROXY
  };
})();
