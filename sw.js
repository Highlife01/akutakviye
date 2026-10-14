/**
 * Service Worker for Adana 7/24 Akü Takviye & Mobil Şarj
 * Provides offline shell & Stale-While-Revalidate instant asset caching
 */

const CACHE_NAME = 'adana-aku-cache-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/aku-takviye',
  '/elektrikli-arac-mobil-sarj',
  '/yerinde-aku-degisimi',
  '/ticari-arac-aku-takviyesi',
  '/elektrikli-arac-12v-aku-destegi',
  '/hizmet-bolgeleri',
  '/fiyat-bilgisi',
  '/sik-sorulan-sorular',
  '/hakkimizda',
  '/iletisim',
  '/hizli-yardim-talebi',
  '/seyhan-aku-takviye',
  '/cukurova-aku-takviye',
  '/yuregir-aku-takviye',
  '/saricam-aku-takviye',
  '/ceyhan-aku-takviye',
  '/pozanti-aku-takviye',
  '/karaisali-aku-takviye',
  '/karatas-aku-takviye',
  '/yumurtalik-aku-takviye',
  '/imamoglu-aku-takviye',
  '/adana-mersin-otoyolu-mobil-sarj',
  '/adana-osb-elektrikli-arac-mobil-sarj',
  '/css/style.css',
  '/js/app.js',
  '/images/adana-mobil-servis.webp',
  '/icons/icon-192.png',
  '/manifest.json',
  '/locations.kml',
  '/llms.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests over http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset) {
    // Stale-While-Revalidate for CSS, JS, Images, Fonts
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const networkFetch = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }

  // Network-First with Cache Fallback for HTML pages & data
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request).then((res) => res || caches.match('/')))
  );
});
