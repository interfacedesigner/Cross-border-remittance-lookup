# Google Analytics 4 (GA4) 설정 가이드

## 1단계: Google Analytics 계정 생성

### 1. Google Analytics 접속
https://analytics.google.com 방문

### 2. 계정 만들기
1. **관리** (톱니바퀴 아이콘) 클릭
2. **계정 만들기** 클릭
3. 계정 이름 입력: `해외송금비교` 또는 원하는 이름
4. 계정 데이터 공유 설정 선택 (권장 사항 모두 체크)
5. **다음** 클릭

### 3. 속성 만들기
1. 속성 이름: `Cross Border Remittance Lookup`
2. 보고 시간대: `(GMT+09:00) 한국 시간`
3. 통화: `대한민국 원 (₩)`
4. **다음** 클릭

### 4. 비즈니스 정보 입력
1. 업종: **금융 및 보험**
2. 비즈니스 규모: 해당 항목 선택
3. 목표: **기준 보고서 수집**, **사용자 행동 분석**
4. **만들기** 클릭

### 5. 약관 동의
1. 국가: **대한민국**
2. 약관 동의 체크
3. **동의** 클릭

---

## 2단계: 데이터 스트림 설정

### 1. 플랫폼 선택
- **웹** 선택

### 2. 웹 스트림 세부정보
1. **웹사이트 URL**: `https://cross-border-remittance-lookup.web.app`
2. **스트림 이름**: `해외송금비교 웹`
3. **향상된 측정** 켜기 (기본값 - 권장)
   - 페이지 조회수 ✅
   - 스크롤 ✅
   - 이탈 클릭 ✅
   - 사이트 검색 ✅
   - 동영상 참여 ✅
   - 파일 다운로드 ✅
4. **스트림 만들기** 클릭

### 3. Measurement ID 확인
데이터 스트림이 생성되면 **측정 ID**가 표시됩니다:

```
G-XXXXXXXXXX
```

이 ID를 복사하세요! (예: `G-1A2B3C4D5E`)

---

## 3단계: 코드에 Measurement ID 적용

### 방법 1: 직접 수정

`index.html` 파일을 열어서 다음 두 곳을 수정하세요:

#### 📍 54번째 줄
```html
<!-- 변경 전 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>

<!-- 변경 후 (예시) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-1A2B3C4D5E"></script>
```

#### 📍 59번째 줄
```javascript
// 변경 전
gtag('config', 'GA_MEASUREMENT_ID', {

// 변경 후 (예시)
gtag('config', 'G-1A2B3C4D5E', {
```

### 방법 2: 자동 스크립트 (추천)

아래 명령어를 실행하면 자동으로 교체됩니다:

```bash
# YOUR_GA_ID를 실제 Measurement ID로 교체하세요
export GA_ID="G-1A2B3C4D5E"

# macOS/Linux
sed -i '' "s/GA_MEASUREMENT_ID/$GA_ID/g" index.html

# 또는 수동으로 파일 편집
```

---

## 4단계: 빌드 및 재배포

```bash
# 1. 프로덕션 빌드
npm run build

# 2. Firebase 재배포
firebase deploy

# 배포 완료 후 표시되는 URL 확인
# Hosting URL: https://cross-border-remittance-lookup.web.app
```

---

## 5단계: Google Analytics 작동 확인

### 1. 실시간 보고서 확인

1. Google Analytics 콘솔 접속
2. 왼쪽 메뉴 → **보고서** → **실시간**
3. 새 탭에서 사이트 접속: https://cross-border-remittance-lookup.web.app
4. 실시간 보고서에 사용자 1명이 표시되는지 확인

### 2. 디버깅 (선택사항)

브라우저 개발자 도구에서 확인:
```javascript
// Console 탭에서 실행
console.log(window.gtag);  // 함수가 정의되어 있어야 함
console.log(window.dataLayer);  // 배열이 표시되어야 함
```

### 3. Google Analytics 디버거 확장 프로그램 (선택사항)

Chrome 확장 프로그램 설치:
https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna

설치 후:
1. 확장 프로그램 활성화
2. 사이트 접속
3. 개발자 도구 Console에서 GA 이벤트 확인

---

## 6단계: 커스텀 이벤트 확인

앱에는 이미 다음 커스텀 이벤트가 설정되어 있습니다:

### 📊 추적 중인 이벤트

1. **compare_rates** - 환율 비교 버튼 클릭
   ```javascript
   {
     currency: 'USD',
     amount: 1000,
     services_count: 8
   }
   ```

2. **currency_change** - 통화 변경
   ```javascript
   {
     from_currency: 'USD',
     to_currency: 'JPY',
     method: 'click' // 또는 'touch'
   }
   ```

3. **tab_change** - 탭 전환
   ```javascript
   {
     tab_name: 'multi' // 또는 'history'
   }
   ```

### 이벤트 확인 방법

Google Analytics → **보고서** → **참여도** → **이벤트**

여기서 위 3개 이벤트가 수집되는지 확인하세요.

---

## 7단계: 유용한 보고서 설정

### 1. 전환 이벤트 설정 (권장)

가장 중요한 이벤트를 전환으로 표시:

1. **관리** → **이벤트** 클릭
2. `compare_rates` 이벤트 찾기
3. **전환으로 표시** 토글 켜기

이제 "비교하기" 버튼 클릭이 전환으로 추적됩니다!

### 2. 맞춤 보고서 만들기

**탐색** 메뉴에서 새 탐색 만들기:

#### 보고서 1: 통화별 사용 현황
- 측정기준: `currency` (커스텀 매개변수)
- 측정항목: `이벤트 수`, `사용자`
- 필터: `event_name = compare_rates`

#### 보고서 2: 탭 사용 패턴
- 측정기준: `tab_name` (커스텀 매개변수)
- 측정항목: `이벤트 수`, `평균 참여 시간`
- 필터: `event_name = tab_change`

### 3. 대시보드 구성 (권장)

중요 지표 대시보드:
- 일일 활성 사용자 (DAU)
- 비교 버튼 클릭 수 (전환)
- 가장 많이 사용된 통화
- 평균 세션 시간
- 이탈률

---

## 8단계: 고급 설정 (선택사항)

### 1. Google Search Console 연결

1. Google Analytics → **관리** → **Search Console 링크**
2. **연결** 클릭
3. Search Console 속성 선택
4. 웹 스트림 선택
5. **제출** 클릭

### 2. Google Ads 연결 (향후 광고 운영 시)

1. **관리** → **Google Ads 링크**
2. Google Ads 계정 연결
3. 전환 이벤트 가져오기

### 3. 데이터 보관 기간 설정

1. **관리** → **데이터 설정** → **데이터 보관**
2. 이벤트 데이터 보관: **14개월** (무료 플랜 최대값)
3. **저장** 클릭

---

## 🎯 체크리스트

배포 전:
- [ ] Google Analytics 계정 생성 완료
- [ ] 데이터 스트림 생성 완료
- [ ] Measurement ID (G-XXXXXXXXXX) 발급 완료
- [ ] `index.html` 54번째 줄 수정
- [ ] `index.html` 59번째 줄 수정

배포 후:
- [ ] `npm run build` 실행
- [ ] `firebase deploy` 실행
- [ ] 실시간 보고서에서 트래픽 확인
- [ ] 커스텀 이벤트 3개 확인
- [ ] `compare_rates` 이벤트를 전환으로 표시
- [ ] Search Console 연결 (선택사항)

---

## 📊 예상 데이터

설정 완료 후 다음 데이터를 수집할 수 있습니다:

### 기본 지표
- 페이지뷰
- 사용자 수 (신규/재방문)
- 평균 참여 시간
- 이탈률
- 세션당 페이지 수

### 커스텀 지표
- 환율 비교 횟수 (핵심 전환)
- 가장 인기 있는 통화
- 탭 전환 패턴
- 통화 변경 빈도
- 사용 방법 (클릭 vs 터치)

### 사용자 행동
- 유입 경로 (직접/검색/소셜/광고)
- 지역별 사용자 분포
- 기기별 분포 (모바일/데스크톱)
- 페이지 스크롤 깊이
- 이탈 클릭 (어디로 떠나는지)

---

## ❓ 문제 해결

### "측정 ID를 찾을 수 없습니다"
- 데이터 스트림이 제대로 생성되었는지 확인
- 웹 스트림인지 확인 (앱 스트림 아님)

### "실시간 보고서에 데이터가 표시되지 않음"
- Measurement ID가 올바르게 입력되었는지 확인
- 브라우저 광고 차단기 비활성화
- 시크릿 모드에서 테스트
- 개발자 도구 Console에서 오류 확인

### "이벤트가 수집되지 않음"
- `window.gtag` 함수가 정의되어 있는지 확인
- 이벤트 이름에 특수문자나 공백이 없는지 확인
- 24시간 후 표준 보고서에서 다시 확인 (실시간 외)

---

## 📚 추가 자료

- [GA4 공식 가이드](https://support.google.com/analytics/answer/9304153)
- [이벤트 설정 가이드](https://support.google.com/analytics/answer/9267735)
- [전환 설정 가이드](https://support.google.com/analytics/answer/9267568)
- [디버깅 가이드](https://support.google.com/analytics/answer/7201382)

---

이제 실제 Measurement ID를 알려주시면 자동으로 코드에 적용해드리겠습니다!
