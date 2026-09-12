// 研精会譜エディタ — オフライン起動用の Service Worker（v3.10）
// ・アプリ本体（index.html）はネット優先、落ちていればキャッシュから
// ・Google Fonts（CSS とフォント本体）はキャッシュ優先。一度開けば稽古場に Wi-Fi が無くても同じ字面で開く
// バージョンはビルド時に差し替わる
const VERSION = 'v3.10';
const APP = 'kensei-app-' + VERSION;
const FONTS = 'kensei-fonts-v1';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(APP_FILES).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kensei-app-') && k !== APP).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      try { const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }
      catch { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(caches.open(APP).then(async c => {
      try { const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }
      catch { return (await c.match(e.request)) || (await c.match('./index.html')) || Response.error(); }
    }));
  }
});
