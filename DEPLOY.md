# Firebase 배포 가이드

## 현재 상태
✅ 프로덕션 빌드 완료 (`dist/` 폴더)
✅ Firebase 설정 완료 (`firebase.json`, `.firebaserc`)
✅ Firebase 프로젝트: `cross-border-remittance-lookup`

## 배포 방법

### 방법 1: 터미널에서 직접 배포 (권장)

1. **Firebase 로그인**
```bash
firebase login
```
브라우저가 열리면 Google 계정으로 로그인하세요.

2. **배포 실행**
```bash
firebase deploy
```

배포가 완료되면 Hosting URL이 표시됩니다:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/cross-border-remittance-lookup/overview
Hosting URL: https://cross-border-remittance-lookup.web.app
```

### 방법 2: CI/CD 자동 배포 (선택사항)

GitHub Actions를 통한 자동 배포를 설정하려면:

1. Firebase CI 토큰 생성:
```bash
firebase login:ci
```

2. GitHub 저장소의 Secrets에 토큰 추가:
   - Settings → Secrets and variables → Actions
   - New repository secret: `FIREBASE_TOKEN`

3. `.github/workflows/deploy.yml` 파일 생성 (이미 존재함)

---

## 배포 전 체크리스트

### 필수 업데이트 항목

배포하기 전에 `index.html`에서 다음 항목들을 실제 값으로 교체하세요:

#### 1. Google Analytics 4
```html
<!-- 현재 (53-64줄) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  gtag('config', 'GA_MEASUREMENT_ID', {
```

**→ 교체 후:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script>
  gtag('config', 'G-ABC123XYZ', {
```

#### 2. Google AdSense
```html
<!-- 현재 (68줄) -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
```

**→ 교체 후:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
```

#### 3. 도메인 URL (총 12곳)
모든 `https://your-domain.com/`을 실제 도메인으로 교체:
- 19줄: Open Graph URL
- 22줄: Open Graph 이미지
- 27줄: Twitter URL
- 30줄: Twitter 이미지
- 50줄: Canonical URL
- 77줄: WebApplication URL
- 96줄: Creator URL
- 116줄: FinancialService URL
- 117줄: Logo URL
- 139줄: 홈 breadcrumb
- 145줄: 실시간 비교 breadcrumb
- 151줄: 환율 히스토리 breadcrumb

**Firebase Hosting URL을 사용하는 경우:**
```
https://cross-border-remittance-lookup.web.app
```

**커스텀 도메인을 사용하는 경우:**
```
https://yourdomain.com
```

#### 4. src/App.jsx - AdSense 광고 단위 ID
`/src/App.jsx` 파일에서 3곳의 광고 slot ID 교체:

```javascript
// AdSenseAd 컴포넌트 내부
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"  // → 실제 퍼블리셔 ID

// 비교 결과 하단 광고 (870번째 줄 근처)
<AdSenseAd slot="1234567890" ... />  // → 실제 광고 단위 ID

// 멀티 통화 탭 광고 (1075번째 줄 근처)
<AdSenseAd slot="0987654321" ... />  // → 실제 광고 단위 ID

// 히스토리 탭 광고 (963번째 줄 근처)
<AdSenseAd slot="1122334455" ... />  // → 실제 광고 단위 ID
```

---

## 배포 후 작업

### 1. 커스텀 도메인 연결 (선택사항)

Firebase Console에서:
1. **Hosting** → **도메인 추가** 클릭
2. 도메인 입력 (예: `remittance.com`)
3. DNS 레코드 추가 (A 레코드 또는 CNAME)
4. SSL 인증서 자동 발급 (무료)

### 2. Google Search Console 등록

1. [Google Search Console](https://search.google.com/search-console) 접속
2. **속성 추가** 클릭
3. URL 입력: `https://cross-border-remittance-lookup.web.app`
4. 소유권 확인 (Firebase Hosting은 자동으로 인증됨)
5. **Sitemaps** 메뉴에서 sitemap 제출 (선택사항)

### 3. Open Graph 이미지 생성

`public/` 폴더에 이미지 추가:
- `og-image.png` (1200×630px)
- `twitter-image.png` (1200×628px)
- `logo.png` (512×512px)

이미지 생성 후 다시 빌드 및 배포:
```bash
npm run build
firebase deploy
```

### 4. Analytics 및 AdSense 승인 대기

- **Google Analytics**: 즉시 데이터 수집 시작
- **Google AdSense**: 사이트 승인까지 1~2주 소요

---

## 빌드 및 배포 명령어 요약

```bash
# 1. 프로덕션 빌드
npm run build

# 2. 로컬 미리보기 (선택사항)
firebase serve

# 3. Firebase 배포
firebase deploy

# 4. 특정 타겟만 배포 (hosting만)
firebase deploy --only hosting
```

---

## 문제 해결

### 배포 실패 시
```bash
# Firebase CLI 업데이트
npm install -g firebase-tools@latest

# 다시 로그인
firebase logout
firebase login

# 캐시 클리어 후 빌드
rm -rf dist
npm run build
firebase deploy
```

### 404 에러 발생 시
- `firebase.json`의 `rewrites` 설정 확인
- SPA 라우팅을 위해 모든 경로가 `/index.html`로 리다이렉트되어야 함

### 광고가 표시되지 않을 때
- AdSense 승인이 완료되었는지 확인
- 브라우저 광고 차단기 비활성화
- 개발자 도구 콘솔에서 오류 확인

---

## 배포 체크리스트

배포 전 최종 확인:

- [ ] `npm run build` 성공
- [ ] `index.html`의 GA4 ID 교체
- [ ] `index.html`의 AdSense ID 교체
- [ ] `index.html`의 도메인 URL 교체
- [ ] `src/App.jsx`의 AdSense slot ID 교체
- [ ] Open Graph 이미지 준비
- [ ] `firebase login` 완료
- [ ] `firebase deploy` 실행

배포 후 확인:

- [ ] 사이트 접속 확인
- [ ] 모바일 반응형 확인
- [ ] 통화 선택 기능 테스트
- [ ] 비교 버튼 동작 확인
- [ ] Google Analytics 실시간 데이터 확인
- [ ] Google Search Console 등록
