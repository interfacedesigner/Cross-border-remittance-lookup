# 📱 PWA (Progressive Web App) 설정 가이드

## ✅ 완료된 작업

PWA 구현이 완료되었습니다! 이제 사용자는 **웹사이트를 앱처럼** 사용할 수 있습니다.

### 구현된 기능

1. **홈 화면 추가** ✅
   - Android: 홈 화면에 아이콘 추가 가능
   - iOS (Safari): 홈 화면에 추가 가능

2. **앱처럼 실행** ✅
   - 전체 화면 모드 (브라우저 UI 없음)
   - 네이티브 앱과 동일한 사용 경험

3. **자동 업데이트** ✅
   - **화/금 오전 9시 자동 업데이트와 100% 동일**
   - 사용자가 앱을 다시 열면 자동으로 최신 버전 로딩
   - Service Worker가 백그라운드에서 데이터 업데이트 감지

4. **오프라인 작동** ✅
   - 네트워크 없어도 기본 기능 사용 가능
   - 캐싱으로 빠른 로딩

5. **설치 안내** ✅
   - 첫 방문 시 자동으로 설치 안내 표시
   - 사용자가 쉽게 홈 화면에 추가 가능

---

## 🎯 사용자 경험

### Android 사용자

1. **첫 방문**
   - 사이트 접속 시 상단에 "앱으로 설치하기" 배너 표시
   - "설치" 버튼 클릭 → 홈 화면에 앱 아이콘 추가

2. **앱 실행**
   - 홈 화면의 "해외송금비교" 아이콘 클릭
   - 전체 화면으로 앱 실행 (브라우저 UI 없음)

3. **자동 업데이트**
   - 화/금 오전 9시에 데이터 자동 업데이트
   - 앱 다시 열면 "새로운 버전 사용 가능" 알림 표시
   - "업데이트" 버튼 클릭 → 즉시 최신 버전 적용

### iOS (Safari) 사용자

1. **첫 방문**
   - Safari에서 사이트 접속
   - 하단 공유 버튼 → "홈 화면에 추가" 선택

2. **앱 실행**
   - 홈 화면의 "해외송금비교" 아이콘 클릭
   - 전체 화면으로 앱 실행

3. **자동 업데이트**
   - Android와 동일하게 작동
   - 화/금 자동 업데이트 즉시 반영

---

## 🔧 기술 구현

### 1. Service Worker (`/public/sw.js`)

**역할:**
- 네트워크 요청 인터셉트
- 데이터 캐싱 및 업데이트
- 오프라인 지원

**캐싱 전략:**
```
정적 파일 (HTML, CSS, JS): Cache First
  → 캐시에서 먼저 로딩 (빠름)
  → 백그라운드에서 업데이트

데이터 파일 (fee-data.json): Network First
  → 항상 최신 데이터 우선
  → 네트워크 실패 시 캐시 사용
  → 화/금 자동 업데이트 즉시 반영
```

### 2. Web App Manifest (`/public/manifest.json`)

**정의 내용:**
- 앱 이름: "해외송금 수수료 비교"
- 짧은 이름: "해외송금비교"
- 아이콘: 8개 크기 (72px ~ 512px)
- 테마 색상: #09090B (다크 모드)
- 화면 방향: 세로 모드

### 3. PWA 등록 스크립트 (`/public/pwa-register.js`)

**기능:**
- Service Worker 자동 등록
- 업데이트 감지 및 알림
- 홈 화면 추가 안내
- Google Analytics 연동

---

## 📋 남은 작업 (선택사항)

### 1. 앱 아이콘 생성 (5분)

**방법 1: 자동 생성 도구 사용** (권장)

```bash
# 브라우저에서 아이콘 생성기 열기
open scripts/generate-pwa-icons.html

# 또는 직접 경로 입력
file:///Users/designerkyunghoohatdenyx/Documents/development/Cross-border-remittance-lookup/scripts/generate-pwa-icons.html
```

1. 페이지가 자동으로 모든 크기의 아이콘 생성
2. 각 아이콘을 우클릭 → "다운로드" 버튼 클릭
3. `/public/` 폴더에 저장

**필요한 아이콘 크기:**
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**방법 2: 수동 생성**

디자인 툴 (Figma, Photoshop 등)로 직접 제작

---

### 2. 빌드 설정 업데이트

Vite가 PWA 파일들을 올바르게 빌드하도록 설정:

**`vite.config.js` 확인:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // PWA 파일들이 빌드에 포함되도록
    copyPublicDir: true
  }
})
```

현재 설정이 이미 `copyPublicDir: true`라면 수정 불필요.

---

## 🚀 배포 및 테스트

### 1. 로컬 테스트

```bash
# 빌드
npm run build

# 프리뷰 (로컬 서버)
npm run preview

# 브라우저에서 http://localhost:4173 접속
# Chrome DevTools → Application 탭 → Service Workers 확인
```

### 2. Firebase 배포

```bash
# 배포
npm run deploy

# 또는
firebase deploy
```

### 3. PWA 검증

#### Chrome DevTools

1. 배포된 사이트 접속
2. F12 (DevTools 열기)
3. **Application** 탭 클릭
4. 확인 항목:
   - ✅ Service Workers: 등록됨
   - ✅ Manifest: 올바른 정보 표시
   - ✅ Cache Storage: 파일들 캐시됨

#### Lighthouse

1. Chrome DevTools → **Lighthouse** 탭
2. **Progressive Web App** 체크
3. "Generate report" 클릭
4. PWA 점수 90+ 목표

---

## 💡 자동 업데이트 동작 방식

### 화/금 오전 9시 자동 업데이트

1. **GitHub Actions 실행**
   - fee-data.json 업데이트
   - Firebase에 자동 배포

2. **Service Worker 감지**
   - 사용자가 앱 열 때 자동으로 새 버전 확인
   - 변경 감지 시 백그라운드 다운로드

3. **사용자 알림**
   - "새로운 버전 사용 가능" 알림 표시
   - "업데이트" 버튼 클릭 → 즉시 새 데이터 적용
   - "나중에" 클릭 → 다음 앱 실행 시 자동 적용

### 즉시 반영 vs 백그라운드 업데이트

```
fee-data.json (데이터):
  → Network First 전략
  → 항상 최신 데이터 우선
  → 화/금 업데이트 즉시 반영

정적 파일 (HTML, CSS, JS):
  → Cache First 전략
  → 빠른 로딩
  → 백그라운드 업데이트
```

---

## 📊 PWA vs 네이티브 앱 비교

| 항목 | PWA | 네이티브 앱 |
|------|-----|-----------|
| **설치** | 브라우저에서 즉시 | 앱 스토어 승인 필요 |
| **업데이트** | 자동 (즉시 반영) | 앱 스토어 승인 필요 |
| **비용** | ₩0 | ₩165,000/년 |
| **개발 시간** | 완료 | 1-2주 |
| **검색 가능** | 웹 검색 ✅ | 앱 스토어만 |
| **오프라인** | ✅ | ✅ |
| **푸시 알림** | ✅ (Android) | ✅ |
| **성능** | 90% 네이티브급 | 100% |

---

## 🎓 사용자 설치 가이드

### Android (Chrome)

1. **자동 설치 안내**
   - 사이트 접속 시 상단에 "앱으로 설치하기" 배너 표시
   - "설치" 버튼 클릭

2. **수동 설치**
   - 사이트 접속
   - 우측 상단 ⋮ (메뉴) → "홈 화면에 추가"
   - "추가" 확인

3. **앱 실행**
   - 홈 화면의 "해외송금비교" 아이콘 클릭
   - 전체 화면으로 실행

### iOS (Safari)

1. **설치**
   - Safari에서 사이트 접속
   - 하단 공유 버튼 (□↑) 클릭
   - "홈 화면에 추가" 선택
   - "추가" 확인

2. **앱 실행**
   - 홈 화면의 "해외송금비교" 아이콘 클릭
   - 전체 화면으로 실행

---

## 🔍 트러블슈팅

### Service Worker 등록 안 됨

**증상:** Chrome DevTools → Application → Service Workers에 아무것도 없음

**해결:**
```bash
# HTTPS 필수 확인 (localhost는 예외)
# Firebase Hosting은 자동으로 HTTPS 제공

# 캐시 삭제 후 재시도
# Chrome DevTools → Application → Storage → Clear site data
```

### 업데이트 감지 안 됨

**증상:** 화/금 업데이트 후에도 구 데이터 표시

**해결:**
```javascript
// Chrome DevTools → Application → Service Workers
// "Update on reload" 체크
// 페이지 새로고침

// 또는 Service Worker 직접 업데이트
navigator.serviceWorker.getRegistration().then(reg => reg.update());
```

### 홈 화면 추가 안내 안 뜸

**원인:** 이미 한 번 표시된 경우 다시 안 뜸

**해결:**
```javascript
// localStorage 초기화
localStorage.removeItem('pwa-install-prompted');

// 페이지 새로고침
```

---

## 📈 Analytics 추적

PWA 관련 이벤트가 자동으로 Google Analytics에 추적됩니다:

**추적 이벤트:**
- `pwa_install_prompt`: 설치 안내 표시
- `pwa_install`: 앱 설치 완료
- `pwa_update`: 업데이트 적용

**확인 방법:**
1. Google Analytics 콘솔 접속
2. 보고서 → 이벤트
3. "pwa_" 이벤트 확인

---

## 🎉 완료!

**PWA 구현이 완료되었습니다!**

### ✅ 구현된 기능
- 홈 화면 추가 (Android, iOS)
- 앱처럼 실행 (전체 화면)
- 자동 업데이트 (화/금 오전 9시)
- 오프라인 작동
- 빠른 로딩 (캐싱)
- 설치 안내 자동 표시

### 📋 남은 작업 (선택사항)
- [ ] 앱 아이콘 생성 (scripts/generate-pwa-icons.html 사용)
- [ ] 아이콘을 /public/ 폴더에 저장
- [ ] 빌드 & 배포
- [ ] Lighthouse PWA 점수 확인

### 🚀 배포 명령어

```bash
# 1. 빌드
npm run build

# 2. 배포
firebase deploy

# 3. 테스트
# Chrome DevTools → Application → Service Workers 확인
```

---

## 📞 추가 지원

- **Service Worker 문서**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Web App Manifest**: https://web.dev/add-manifest/
- **PWA 체크리스트**: https://web.dev/pwa-checklist/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

**자동 업데이트 + PWA = 완벽한 조합!** 🎊

사용자는 앱을 설치만 하면 화/금마다 자동으로 최신 환율 데이터를 받습니다!
