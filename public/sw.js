// Offline support. Bump CACHE on every release so installed users pick up the
// new build instead of being served a stale one forever.
//
// Strategy:
//   - hashed build assets (/assets/*): cache-first — the hash makes them immutable
//   - navigations and index.html: network-first, falling back to cache, so a
//     deploy is picked up while online and the app still opens with no network
//   - everything else same-origin: cache-first with a runtime fill
const CACHE = "wt-v2.1.0";
const BASE = new URL(self.registration.scope).pathname;
const PRECACHE = [BASE, BASE + "index.html", BASE + "manifest.json", BASE + "icon-192.png", BASE + "icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map(url => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isAsset = url.pathname.includes("/assets/");
  const isNavigation = request.mode === "navigate";

  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(BASE + "index.html", fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(BASE + "index.html")) || (await cache.match(BASE)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    try {
      const fresh = await fetch(request);
      if (fresh.ok && (isAsset || url.pathname.startsWith(BASE))) cache.put(request, fresh.clone());
      return fresh;
    } catch {
      return hit || Response.error();
    }
  })());
});
