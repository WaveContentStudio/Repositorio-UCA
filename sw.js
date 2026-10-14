// Service worker del Repositorio UCA: deja la app funcionando sin conexión.
// Si cambiás index.html, subí el número de versión (v1 -> v2) para que se actualice.
const CACHE = 'repo-uca-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === 'navigate') {            // la página: primero red, y si no hay internet, la copia guardada
      e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); return res; }).catch(() => caches.match('index.html')));
      return;
    }
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(r, c)); return res; })));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {   // tipografías
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
      const net = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
