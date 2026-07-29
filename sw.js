// Service worker — NGH kalkulator prijevoza
// Instalacija na početni zaslon + offline rad. Aplikacija se dohvaća "mreža prvo"
// pa svi korisnici automatski dobiju izmjene čim otvore link (uz internet),
// a offline kopija služi samo kao rezerva.
const CACHE = 'ngh-kalkulator-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Vanjski servisi (karta, rutiranje): samo mreža
  if (url.origin !== self.location.origin) return;

  // Aplikacija i podaci → MREŽA PRVO (svi odmah dobiju najnoviju verziju),
  // offline fallback iz cachea. Osvježi cache pri svakom uspješnom dohvatu.
  const isAppOrData =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/data/fuel-price.json');

  if (isAppOrData) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Statika (ikone, manifest): prvo cache, pa mreža
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
