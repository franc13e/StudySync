const CACHE_NAME = "studysync-v3";
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  // API and chat traffic always go straight to the network: never cache
  // API responses, which contain private data (chats, timetables).
  if (url.origin !== location.origin && !fonts) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/ws")) return;

  // Pages (any route, since it's a single-page app): network first, cached app shell offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Built assets and fonts: serve from cache, refresh in the background
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const hit = await cache.match(req);
      const fresh = fetch(req)
        .then((response) => {
          if (response.ok || response.type === "opaque") cache.put(req, response.clone());
          return response;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
