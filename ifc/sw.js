// Offline cache for the IFC Viewer web app. Version changes with every build.
const CACHE = 'ifc-viewer-v6.6-261026-2031';
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
  // the page itself: from the network first, so a new version is there with the next reload; offline from the cache
  if (url.origin === location.origin && req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
        const r = await fetch(req, { cache: 'no-cache', signal: ctl.signal }); clearTimeout(t);
        if (r && r.ok) { c.put('./index.html', r.clone()); return r; }
      } catch (err) { /* offline or slow: cached copy */ }
      return (await c.match('./index.html')) || new Response('Offline', { status: 503 });
    }));
    return;
  }
  // other app files: answer from cache at once, refresh in the background
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
