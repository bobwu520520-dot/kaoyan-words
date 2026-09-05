/* 考研词汇 — Service Worker: 全离线持久缓存 + 离线词库 */
const CACHE = 'kaoyan-v9.69-offline-cache';
const SHELL = [
  './', 'index.html', 'study.html', 'exam.html', 'translate.html', 'words.html', 'memory.html',
  'css/style.css',
  'js/word_data.js', 'js/app.js', 'js/study.js', 'js/translate.js', 'js/catalog.js', 'js/memory.js', 'js/pwa.js', 'js/quiz.js', 'js/exam_workshop.js', 'js/cloud_sync.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon.png'
];
const DATA = [
  'data/words_bundle.js',
  'data/ai_examples_bundle.js',
  'data/translations_bundle.js',
  'data/exam_data_bundle.js',
  'data/exam_cloze.json',
  'data/exam_reading.json',
  'data/exam_newtype.json',
  'data/exam_trans.json',
  'data/exam_writing.json',
  'data/exam_suite.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    for (const url of DATA) {
      try { await cache.add(url); } catch (err) {}
    }
    await self.skipWaiting();
  })());
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
  const isData = url.pathname.indexOf('/data/') !== -1 || /\.(json|js)$/.test(url.pathname);
  e.respondWith((async () => {
    if (isData) {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      try {
        const res = await fetch(e.request);
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      } catch (err) {
        return new Response('', { status: 503, statusText: 'offline-data' });
      }
    }
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    } catch (err) {
      return (await caches.match(e.request)) || (await caches.match('./index.html'));
    }
  })());
});