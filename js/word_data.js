/* 考研词汇 — 离线词库加载器：优先用内置 bundle，避免手机 file:// / WebView 拦截 9MB JSON */
(function (global) {
  'use strict';

  function bundled() {
    var d = global.__WORDS_DATA__ || global.__INITIAL_WORDS__;
    if (d && d.words && d.words.length) {
      global.__WORDS_DATA__ = global.__INITIAL_WORDS__ = d;
      return d;
    }
    return null;
  }

  function injectScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(bundled()); };
      s.onerror = function () { reject(new Error('script-failed')); };
      document.head.appendChild(s);
    });
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok && r.status !== 0) throw new Error('http-' + r.status);
      return r.text().then(function (t) {
        if (!t) throw new Error('empty');
        var trimmed = t.replace(/^\uFEFF/, '').trim();
        if (!trimmed || trimmed.charAt(0) === '<') throw new Error('not-json');
        var data = JSON.parse(trimmed);
        if (!data || !data.words || !data.words.length) throw new Error('empty-words');
        return data;
      });
    });
  }

  function loadKaoyanWords() {
    var ready = bundled();
    if (ready) return Promise.resolve(ready);
    return injectScript('data/words_bundle.js').then(function (d) {
      if (d) return d;
      return fetchJson('data/words.json');
    }).catch(function () {
      return fetchJson('data/words.json');
    }).then(function (d) {
      if (!d || !d.words || !d.words.length) throw new Error('empty-words');
      global.__WORDS_DATA__ = global.__INITIAL_WORDS__ = d;
      return d;
    });
  }

  bundled();
  global.getKaoyanWords = bundled;
  global.loadKaoyanWords = loadKaoyanWords;
})(window);
