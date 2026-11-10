const CACHE = "eisenhower-v24";
const ASSETS = ["./", "./index.html", "./manifest.json", "./favicon.svg", "./favicon-32.png", "./apple-touch-icon-v2.png", "./icon-192-v2.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  // nur eigene alte Caches loeschen, den Cache des IFC Viewers (ifc-viewer-...) stehen lassen
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k.indexOf("eisenhower-") === 0 && k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
