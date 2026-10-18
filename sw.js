/* Service worker do Penas em Foco: guarda o app para funcionar offline. */
const VERSION = "penas-a89ef55f13";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./apple-touch-icon.png"];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== "penas-fonts").map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    // rede primeiro (pega atualizações); sem internet, usa a cópia guardada
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (FONTS.test(req.url)) {
    e.respondWith(caches.open("penas-fonts").then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (new URL(req.url).origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
