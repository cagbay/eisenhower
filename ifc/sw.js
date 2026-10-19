// Offline cache for the IFC Viewer web app. Version changes with every build.
const CACHE = 'ifc-viewer-v2.9-261019-1412';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192-v2.png', './icons/icon-512-v2.png', './icons/apple-touch-icon-v2.png', './icons/favicon-32-v2.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ifc-viewer-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // app files: answer from cache at once, refresh in the background (new version on next start)
  if (url.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const key = req.mode === 'navigate' ? './index.html' : req;
      const hit = await c.match(key);
      const net = fetch(req).then((r) => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
      return hit || (await net) || new Response('Offline', { status: 503 });
    }));
    return;
  }
  // web fonts: keep a copy for offline use
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return new Response('', { status: 504 }); }
    }));
  }
  // map tiles and height data go straight to swisstopo
});
