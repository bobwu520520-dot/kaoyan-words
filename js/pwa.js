/* 考研词汇 — PWA 注册(仅 http/https 环境生效,file:// 下自动跳过) */
(function () {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
