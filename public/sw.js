const CACHE_NAME = 'maze-game-v5';

// [중요] 모든 필수 리소스를 처음에 강제로 캐싱합니다.
// 그래야 게임을 끝까지 진행하지 않아도 오프라인에서 모든 이미지가 보입니다.
const PRE_CACHE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './naeun.jpeg',
    './doha.jpeg',
    './bitnaping.jpeg',
    './bebephin.webp',
    './vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Pre-caching assets...');
            return cache.addAll(PRE_CACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('socket')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, responseToCache);
                    }
                });

                return networkResponse;
            }).catch(() => null);
        })
    );
});
