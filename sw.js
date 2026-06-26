// Service worker — NGH kalkulator prijevoza
// Omogućuje instalaciju na početni zaslon i offline rad osnovne aplikacije.
const CACHE = 'ngh-kalkulator-v1';
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

  // Cijena goriva: uvijek svježe s mreže, ako nema mreže — iz cachea
  if (url.pathname.endsWith('/data/fuel-price.json')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Karte/rutiranje (vanjski servisi): samo mreža
  if (url.origin !== self.location.origin) return;

  // Osnovna aplikacija: prvo cache, pa mreža
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
