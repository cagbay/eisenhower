// Offline Cache des PL-Bestandsmodell Generators. Eigener Name (pl-bestand-...), damit Plattform und IFC Viewer
// ihre Caches behalten und dieser Cache von ihnen nicht gelöscht wird. Version ändert mit jedem Build.
// Ab v1.5 je Skriptstand ein Paket app/skripte_<ID>.enc: jedes hat eine eigene Adresse und liegt darum eigen im Cache,
// nach einmaligem Laden lässt sich offline zwischen den Ständen umschalten.
const CACHE = "pl-bestand-v1.5-261110";
const FEST = /\/(py|wheels)\//;   // Python Laufzeit und Pakete: unveränderlich, sofort aus dem Cache

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((k) => k.startsWith("pl-bestand-v") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.includes("/bestand/")) return;   // swisstopo und Rest direkt
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (FEST.test(url.pathname)) {
      // ignoreSearch: die Startprüfung in index.html fragt python_stdlib.zip mit ?t=<Zeit> ab; offline muss auch
      // das aus dem Cache kommen, sonst verlangt die Seite die Laufzeitdateien von Hand (Fehler bis v1.4)
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const r = await fetch(req);
      // nur echte Dateien zwischenspeichern, keine HTML Hinweisseite
      if (r.ok && !(r.headers.get("content-type") || "").includes("text/html")) c.put(req, r.clone());
      return r;
    }
    // Seite, Worker und Skripte: zuerst Netz, offline aus dem Cache
    try {
      const r = await fetch(req, { cache: "no-cache" });
      if (r.ok) c.put(req, r.clone());
      return r;
    } catch (err) {
      return (await c.match(req, { ignoreSearch: true })) || new Response("Offline", { status: 503 });
    }
  }));
});
