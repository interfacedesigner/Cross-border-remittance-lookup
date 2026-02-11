// PWA Service Worker 등록 스크립트
// index.html에서 로드됨

(function() {
  'use strict';

  // Service Worker 지원 확인
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return;
  }

  // 페이지 로드 완료 후 등록
  window.addEventListener('load', () => {
    registerServiceWorker();
    setupUpdateNotification();
    setupInstallPrompt();
  });

  // ═══════════════════════════════════════════════════
  // Service Worker 등록
  // ═══════════════════════════════════════════════════
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // 업데이트 확인 (화/금 자동 업데이트 감지)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 버전 사용 가능
            showUpdateNotification(newWorker);
          }
        });
      });

      // 주기적 업데이트 확인 (1시간마다)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  // ═══════════════════════════════════════════════════
  // 업데이트 알림 표시
  // ═══════════════════════════════════════════════════
  function showUpdateNotification(worker) {
    // 업데이트 알림 UI 생성
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 90%;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">새로운 버전 사용 가능</div>
          <div style="font-size: 14px; opacity: 0.9;">최신 환율 데이터가 준비되었습니다.</div>
        </div>
        <button id="pwa-update-btn" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        ">
          업데이트
        </button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">
          나중에
        </button>
      </div>
      <style>
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(notification);

    // 업데이트 버튼 클릭
    document.getElementById('pwa-update-btn').addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });

    // 나중에 버튼 클릭
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });

    // 10초 후 자동 숨김
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideUp 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // ═══════════════════════════════════════════════════
  // 컨트롤러 변경 감지
  // ═══════════════════════════════════════════════════
  function setupUpdateNotification() {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[PWA] Controller changed, reloading...');
    });
  }

  // ═══════════════════════════════════════════════════
  // 홈 화면 추가 프롬프트
  // ═══════════════════════════════════════════════════
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 기본 프롬프트 방지
      e.preventDefault();
      // window 객체에 저장하여 UI 버튼에서 사용 가능하게
      window.deferredPrompt = e;

      // 설치 안내 표시 (한 번만)
      if (!localStorage.getItem('pwa-install-prompted')) {
        showInstallBanner(window.deferredPrompt);
      }
    });

    // 설치 완료 감지
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      window.deferredPrompt = null;

      // Analytics 이벤트
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'App Installed'
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // 설치 안내 배너
  // ═══════════════════════════════════════════════════
  function showInstallBanner(deferredPrompt) {
    // 이미 standalone 모드면 표시 안 함
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 90%;
        animation: slideDown 0.3s ease-out;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">📱 앱으로 설치하기</div>
          <div style="font-size: 14px; opacity: 0.9;">홈 화면에 추가하여 빠르게 접근하세요.</div>
        </div>
        <button id="pwa-install-btn" style="
          background: white;
          color: #16a34a;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
        ">
          설치
        </button>
        <button id="pwa-install-close" style="
          background: transparent;
          color: white;
          border: none;
          padding: 8px;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        ">
          ×
        </button>
      </div>
      <style>
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      </style>
    `;

    document.body.appendChild(banner);

    // 설치 버튼 클릭
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[PWA] Install prompt outcome:', outcome);

      // Analytics 이벤트
      if (window.gtag) {
        window.gtag('event', 'pwa_install_prompt', {
          event_category: 'PWA',
          event_label: outcome
        });
      }

      localStorage.setItem('pwa-install-prompted', 'true');
      banner.remove();
    });

    // 닫기 버튼
    document.getElementById('pwa-install-close').addEventListener('click', () => {
      localStorage.setItem('pwa-install-prompted', 'true');
      banner.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => banner.remove(), 300);
    });

    // 20초 후 자동 숨김
    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => banner.remove(), 300);
      }
    }, 20000);
  }

  console.log('[PWA] Registration script loaded');
})();
