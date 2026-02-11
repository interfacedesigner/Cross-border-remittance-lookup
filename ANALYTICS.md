# Google Analytics 4 설정 가이드

## 1. Google Analytics 계정 설정

### 1.1 GA4 속성 생성
1. [Google Analytics](https://analytics.google.com/)에 접속
2. **관리** → **속성 만들기** 클릭
3. 속성 이름: "해외송금 공정 비교" 입력
4. 보고 시간대: **대한민국** 선택
5. 통화: **한국 원(₩)** 선택
6. **다음** 클릭

### 1.2 데이터 스트림 생성
1. 플랫폼: **웹** 선택
2. 웹사이트 URL 입력 (예: `https://your-domain.com`)
3. 스트림 이름: "해외송금 비교 웹" 입력
4. **스트림 만들기** 클릭
5. **측정 ID**를 복사 (형식: `G-XXXXXXXXXX`)

---

## 2. 측정 ID 적용

### 방법 1: 직접 수정 (간단한 방법)
`index.html` 파일에서 `GA_MEASUREMENT_ID`를 실제 측정 ID로 교체:

```html
<!-- 변경 전 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  gtag('config', 'GA_MEASUREMENT_ID', {

<!-- 변경 후 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script>
  gtag('config', 'G-ABC123XYZ', {
```

### 방법 2: 환경 변수 사용 (권장)
Vite 환경 변수를 사용하여 측정 ID를 관리:

1. 프로젝트 루트에 `.env` 파일 생성:
```bash
VITE_GA_MEASUREMENT_ID=G-ABC123XYZ
```

2. `.gitignore`에 `.env` 추가 (보안):
```
.env
.env.local
```

3. `index.html` 수정:
```html
<script>
  const GA_ID = '%VITE_GA_MEASUREMENT_ID%' || 'GA_MEASUREMENT_ID';
  if (GA_ID && GA_ID !== 'GA_MEASUREMENT_ID') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
</script>
```

---

## 3. 추적되는 이벤트

현재 구현된 커스텀 이벤트:

### 3.1 `compare_rates` - 실시간 비교 버튼 클릭
```javascript
{
  currency: 'USD',           // 비교 통화
  amount: 1000000,          // 송금 금액 (원화)
  amount_category: '1M_5M'  // 금액 카테고리
}
```

**금액 카테고리:**
- `under_1M`: 100만원 미만
- `1M_5M`: 100만~500만원
- `5M_10M`: 500만~1000만원
- `over_10M`: 1000만원 이상

### 3.2 `currency_change` - 통화 변경
```javascript
{
  from_currency: 'USD',  // 이전 통화
  to_currency: 'JPY',    // 변경된 통화
  method: 'click'        // 'click' 또는 'touch'
}
```

### 3.3 `tab_change` - 탭 변경
```javascript
{
  from_tab: 'compare',   // 이전 탭
  to_tab: 'history'      // 변경된 탭
}
```

**탭 종류:**
- `compare`: 실시간 비교
- `history`: 환율 히스토리
- `seasonal`: 월별 분석
- `multi`: 통화 비교

---

## 4. GA4 대시보드에서 확인하기

### 4.1 실시간 보고서
1. **보고서** → **실시간** 클릭
2. 현재 활성 사용자 수 확인
3. 이벤트 발생 실시간 모니터링

### 4.2 이벤트 보고서
1. **보고서** → **참여도** → **이벤트** 클릭
2. 커스텀 이벤트 확인:
   - `compare_rates`: 비교 버튼 클릭 수
   - `currency_change`: 통화 변경 횟수
   - `tab_change`: 탭 전환 횟수

### 4.3 맞춤 보고서 만들기
1. **탐색** → **빈 보고서** 클릭
2. 측정기준 추가:
   - `이벤트 이름`
   - `currency` (통화)
   - `amount_category` (금액대)
3. 측정항목 추가:
   - `이벤트 수`
   - `사용자 수`
4. 원하는 차트 형식 선택 (표, 막대 그래프 등)

---

## 5. 분석 가능한 인사이트

### 사용자 행동 분석
- **가장 많이 비교되는 통화**: USD, JPY, EUR 중 어떤 통화가 인기?
- **주로 송금하는 금액대**: 100만원 미만 vs 1000만원 이상
- **탭 사용 패턴**: 실시간 비교만 보는지, 히스토리도 확인하는지
- **모바일 vs 데스크톱**: 어느 기기에서 더 많이 사용?

### 사용 패턴
- **시간대별 사용량**: 업무 시간 vs 저녁 시간
- **요일별 트래픽**: 주중 vs 주말
- **체류 시간**: 얼마나 오래 머무는지
- **이탈률**: 어느 시점에서 떠나는지

### 전환 분석
- **비교 완료율**: 방문자 중 몇 %가 실제로 비교를 하는지
- **통화별 비교 빈도**: 특정 통화에 관심이 집중되는지
- **재방문율**: 한 번 보고 끝인지, 다시 찾아오는지

---

## 6. 프라이버시 및 GDPR 준수

### 6.1 개인정보 처리 방침
사용자에게 Google Analytics 사용을 고지하고 동의를 받는 것이 좋습니다.

### 6.2 IP 익명화 (자동 적용)
GA4는 기본적으로 IP 주소를 익명화합니다.

### 6.3 쿠키 동의 배너 (선택사항)
EU 사용자가 많다면 쿠키 동의 배너 추가를 고려하세요.

---

## 7. 디버깅

### 개발 환경에서 이벤트 확인
브라우저 콘솔에서 GA 이벤트 확인:

```javascript
// 콘솔에서 실행
window.dataLayer
```

### Chrome 확장 프로그램
- **Google Analytics Debugger**: GA 이벤트 실시간 확인
- **Tag Assistant**: 태그 설치 검증

---

## 8. 문제 해결

### 이벤트가 수집되지 않는 경우
1. 측정 ID가 올바른지 확인
2. 브라우저 콘솔에서 오류 확인
3. 광고 차단기 비활성화 후 테스트
4. 실시간 보고서에서 24시간 후 다시 확인

### 데이터가 표시되지 않는 경우
- GA4는 최대 24~48시간의 지연이 있을 수 있음
- 실시간 보고서로 먼저 확인

---

## 추가 자료

- [Google Analytics 4 공식 문서](https://support.google.com/analytics/answer/9304153)
- [GA4 이벤트 측정 가이드](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
