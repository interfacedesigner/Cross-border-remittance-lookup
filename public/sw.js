// Service Worker for PWA
// 화/금 자동 업데이트 시스템과 연동

const CACHE_NAME = 'remittance-compare-v1';
const DATA_CACHE_NAME = 'remittance-data-v1';

// 캐시할 정적 파일 목록
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// 데이터 파일 (자동 업데이트 대상)
const DATA_FILES = [
  '/fee-data.json'
];

// ═══════════════════════════════════════════════════
// INSTALL - Service Worker 설치 시
// ═══════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );

  // 즉시 활성화
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════
// ACTIVATE - 이전 캐시 정리
// ═══════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // 모든 클라이언트 즉시 제어
  self.clients.claim();
});

// ═══════════════════════════════════════════════════
// FETCH - 네트워크 요청 인터셉트
// ═══════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 데이터 파일 (fee-data.json) - Network First 전략
  // 화/금 자동 업데이트 즉시 반영
  if (DATA_FILES.some(file => url.pathname.endsWith(file))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공 시 캐시 업데이트
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 가져오기
          return caches.match(request);
        })
    );
    return;
  }

  // 정적 파일 - Cache First 전략
  // 빠른 로딩
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // 캐시 히트 - 백그라운드에서 업데이트
          fetch(request).then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {
            // 네트워크 에러 무시 (이미 캐시 반환했으므로)
          });

          return cachedResponse;
        }

        // 캐시 미스 - 네트워크에서 가져오기
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

// ═══════════════════════════════════════════════════
// MESSAGE - 클라이언트와 통신
// ═══════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // 캐시 강제 업데이트 (수동 리프레시)
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    caches.delete(DATA_CACHE_NAME).then(() => {
      console.log('[Service Worker] Data cache cleared');
      event.ports[0].postMessage({ updated: true });
    });
  }
});

// ═══════════════════════════════════════════════════
// SYNC - 백그라운드 동기화 (선택사항)
// ═══════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // 데이터 업데이트 확인
      fetch('/fee-data.json')
        .then((response) => {
          if (response.status === 200) {
            return caches.open(DATA_CACHE_NAME).then((cache) => {
              return cache.put('/fee-data.json', response);
            });
          }
        })
        .catch((error) => {
          console.log('[Service Worker] Sync failed:', error);
        })
    );
  }
});

// ═══════════════════════════════════════════════════
// PUSH - 푸시 알림 (향후 확장 가능)
// ═══════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '새로운 환율 정보가 업데이트되었습니다.',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '해외송금비교', options)
  );
});

// ═══════════════════════════════════════════════════
// NOTIFICATION CLICK
// ═══════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Service Worker] Loaded successfully');
