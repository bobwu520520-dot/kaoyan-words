/* 考研词汇 — Service Worker: 全离线持久缓存 + 离线词库 */
const CACHE = 'kaoyan-v9.60-offline-cache';
const ASSETS = [
  './', 'index.html', 'study.html', 'exam.html', 'translate.html', 'words.html', 'memory.html',
  'css/style.css',
  'js/app.js', 'js/study.js', 'js/translate.js', 'js/catalog.js', 'js/memory.js', 'js/pwa.js', 'js/quiz.js', 'js/exam_workshop.js', 'js/cloud_sync.js',
  'data/words.json', 'data/words_bundle.js',
  'data/ai_examples.json', 'data/ai_examples_bundle.js',
  'data/translations.json', 'data/translations_bundle.js',
  'data/exam_data_bundle.js',
  'data/writings_b.json', 'data/writings_a.json', 'data/reading_real.json', 'data/cloze_real.json', 'data/newtype_real.json',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon.png'
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
  // 网络优先(强制 revalidate, 避免词库更新后浏览器启发式缓存拿到旧数据), 失败回缓存: 离线时用缓存
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
