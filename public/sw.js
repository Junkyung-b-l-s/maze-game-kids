const CACHE_NAME = 'maze-game-v4';

// 설치 시 즉시 활성화
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제 및 제어권 획득
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

// 모든 요청을 가로채서 캐시 및 네트워크 처리
self.addEventListener('fetch', (event) => {
    // 개발용 웹소켓 통신은 제외
    if (event.request.url.includes('socket')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 캐시에 있으면 즉시 반환
            if (cachedResponse) return cachedResponse;

            // 캐시에 없으므로 네트워크에서 가져온 뒤 캐시에 저장
            return fetch(event.request).then((networkResponse) => {
                // 정상적인 응답만 저장
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    // 크롬 확장 프로그램이나 특정 스킴(chrome-extension:// 등) 요청은 저장 제외
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, responseToCache);
                    }
                });

                return networkResponse;
            }).catch(() => {
                // 오프라인이면서 캐시에도 없는 경우
                return null;
            });
        })
    );
});
