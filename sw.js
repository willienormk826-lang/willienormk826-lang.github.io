/* DAJG Payslip service worker */
const SHELL = "dajg-shell-v2";
const DATA = "dajg-data-v2";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  // directory.json + employee pages: network first, fall back to cache
  if (url.pathname.endsWith("directory.json") || url.pathname.endsWith("/index.html") && url.pathname.split("/").length > 2) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(DATA).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // everything else: cache first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(SHELL).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
