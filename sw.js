const CACHE = "releves-parking-v2";
const OCR_CACHE = "releves-parking-ocr"; // moteur de lecture : conservé d'une version à l'autre
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== OCR_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const external = url.origin !== self.location.origin;
  const cacheName = external ? OCR_CACHE : CACHE;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: !external }).then(hit => {
      if (hit && external) return hit; // moteur déjà en cache : pas de réseau
      const net = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(cacheName).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
