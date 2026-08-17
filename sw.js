/* 考研词汇 — Service Worker: 离线缓存 + 网络优先更新 */
const CACHE = 'kaoyan-v9';
const ASSETS = [
  './', 'index.html', 'study.html', 'words.html', 'search.html', 'gate.html',
  'css/style.css',
  'js/auth.js', 'js/app.js', 'js/study.js', 'js/catalog.js', 'js/pwa.js',
  'data/words.json',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  // 网络优先,失败回退缓存: 在线时始终拿到最新数据,离线时用缓存
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
