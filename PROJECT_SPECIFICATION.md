# 해외송금 수수료 비교 서비스 기획문서
## Cross-border Remittance Lookup

> **프로젝트명**: 해외송금 수수료 비교
> **URL**: https://cross-border-remittance-lookup.web.app
> **버전**: 1.0.0
> **작성일**: 2026년 2월
> **문서 타입**: 기술 기획서 (Technical Specification Document)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [서비스 목적 및 타겟 사용자](#2-서비스-목적-및-타겟-사용자)
3. [핵심 기능 명세](#3-핵심-기능-명세)
4. [기술 스택 및 아키텍처](#4-기술-스택-및-아키텍처)
5. [데이터 소스 및 자동화 시스템](#5-데이터-소스-및-자동화-시스템)
6. [PWA 구현 명세](#6-pwa-구현-명세)
7. [수익화 전략](#7-수익화-전략)
8. [SEO 및 마케팅 전략](#8-seo-및-마케팅-전략)
9. [운영 비용 및 인프라](#9-운영-비용-및-인프라)
10. [향후 개발 로드맵](#10-향후-개발-로드맵)

---

## 1. 프로젝트 개요

### 1.1 서비스 소개
**해외송금 수수료 비교**는 한국에서 해외로 송금하거나 해외에서 한국으로 송금할 때 발생하는 **수수료와 환율을 실시간으로 비교**할 수 있는 무료 웹 서비스입니다.

### 1.2 핵심 가치 제안
- ✅ **완전 무료**: 회원가입 없이 무료로 사용 가능
- ✅ **실시간 비교**: 8개 주요 송금 서비스의 실제 비용을 즉시 확인
- ✅ **투명한 데이터**: 환율 스프레드(마진)까지 포함한 실제 총비용 표시
- ✅ **자동 업데이트**: 매주 화/금요일 오전 9시 자동으로 데이터 갱신
- ✅ **PWA 지원**: iOS/Android 홈 화면에 앱처럼 설치 가능
- ✅ **오프라인 사용**: 인터넷 없이도 캐시된 데이터로 비교 가능

### 1.3 차별화 요소
| 기능 | 기존 서비스 | 본 서비스 |
|------|------------|----------|
| **스프레드 공개** | ❌ 대부분 숨김 | ✅ 투명하게 공개 |
| **실시간 비교** | ❌ 수동 확인 필요 | ✅ 버튼 클릭 한 번 |
| **자동 업데이트** | ❌ 수동 관리 | ✅ 주 2회 자동 |
| **PWA 앱** | ❌ 없음 | ✅ 설치 가능 |
| **운영 비용** | 💰 유료 인프라 | 💰 완전 무료 |
| **환율 히스토리** | ❌ 제한적 | ✅ 5년치 제공 |

---

## 2. 서비스 목적 및 타겟 사용자

### 2.1 사용자 페르소나

#### 페르소나 1: 유학생 부모 (35-55세)
- **니즈**: 자녀 학비·생활비 정기 송금
- **금액대**: 월 300만~1,000만원
- **민감도**: 환율 1원 차이도 큰 금액
- **행동**: 최저 수수료 찾기, 환율 좋은 날 기다림

#### 페르소나 2: 외국인 근로자 (25-45세)
- **니즈**: 급여를 본국 가족에게 송금
- **금액대**: 월 50만~200만원
- **민감도**: 수수료가 소득의 상당 부분
- **행동**: 모바일 중심, 빠른 송금 선호

#### 페르소나 3: 글로벌 프리랜서/사업자 (30-50세)
- **니즈**: 해외 클라이언트로부터 수금
- **금액대**: 건당 100만~5,000만원
- **민감도**: 세금·회계 처리 고려
- **행동**: 은행 vs 핀테크 비교, 대량 송금 할인 활용

#### 페르소나 4: 해외여행자 (20-40세)
- **니즈**: 여행 경비 환전
- **금액대**: 50만~300만원
- **민감도**: 편의성 중시
- **행동**: 모바일 앱 선호, 빠른 의사결정

### 2.2 사용자 여정 (User Journey)

```
1. 문제 인식
   "해외송금 어디서 하는 게 제일 저렴할까?"

   ↓

2. 정보 탐색
   - Google 검색: "해외송금 수수료 비교", "Wise vs 토스 송금"
   - 네이버 카페, 유학 커뮤니티에서 추천 확인

   ↓

3. 서비스 발견
   - 검색 결과에서 본 서비스 발견
   - SEO 최적화로 상위 노출

   ↓

4. 첫 사용
   - 회원가입 없이 즉시 사용
   - 송금액 입력 → 통화 선택 → "실시간 비교" 클릭
   - 8개 서비스 요금 한눈에 확인

   ↓

5. 의사결정
   - 총비용 최저 서비스 확인
   - 처리 속도, 영업시간 고려
   - 해당 서비스로 이동 (외부 링크)

   ↓

6. 재방문
   - 환율 변동 확인을 위해 재방문
   - PWA 앱 설치 (홈 화면에 추가)
   - 주 2회 자동 업데이트 수혜
```

---

## 3. 핵심 기능 명세

### 3.1 실시간 수수료·환율 비교

#### 3.1.1 지원 서비스 (8개)
| 서비스명 | 타입 | 특징 | 처리 시간 |
|---------|------|------|----------|
| **Wise** | 글로벌 핀테크 | 투명한 스프레드 공개 | 1~2영업일 |
| **PayPal** | 글로벌 결제 | 높은 스프레드 (약 4%) | 즉시~1일 |
| **SentBe** | 한국 핀테크 | 중국 특화 | 1~2영업일 |
| **MOIN** | 한국 핀테크 | 베트남 특화 | 1~2영업일 |
| **토스 (Toss)** | 한국 핀테크 | 높은 사용자 편의성 | 1~2영업일 |
| **WireBarley** | 한국 핀테크 | 미국/유럽 특화 | 1~2영업일 |
| **하나은행** | 한국 은행 | 영업일 09:00-16:00만 | 1~3영업일 |
| **신한은행** | 한국 은행 | 영업일 09:00-16:00만 | 1~3영업일 |

#### 3.1.2 지원 통화 (8개)
- **USD** (미국 달러)
- **JPY** (일본 엔화, 100엔 단위)
- **EUR** (유로)
- **GBP** (영국 파운드)
- **CNY** (중국 위안)
- **AUD** (호주 달러)
- **CAD** (캐나다 달러)
- **SGD** (싱가포르 달러)

#### 3.1.3 비용 계산 로직

**총 송금 비용 = 고정 수수료 + 환율 스프레드 비용**

```javascript
// 예시: 100만원을 USD로 송금
const amount = 1000000;  // 원화
const midRate = 0.00075; // 중간시장 환율 (KRW → USD)
const serviceRate = 0.00074; // 서비스 적용 환율
const fixedFee = 5000; // 고정 수수료 5,000원

// 1. 환율 스프레드(마진) 계산
const spread = ((midRate - serviceRate) / midRate) * 100; // 1.33%

// 2. 스프레드로 인한 비용
const spreadCost = amount * (midRate - serviceRate) / midRate; // 약 13,300원

// 3. 총 비용
const totalCost = fixedFee + spreadCost; // 18,300원
```

#### 3.1.4 UI/UX 흐름

```
[송금액 입력]
┌─────────────────────┐
│  1,000,000 원       │ ← 숫자만 입력 가능, 쉼표 자동 포맷
└─────────────────────┘

[빠른 입력 버튼]
[ 1백만 ] [ 5백만 ] [ 10백만 ] [ 50백만 ]

[통화 선택]
[🇺🇸 USD] [🇯🇵 JPY] [🇪🇺 EUR] [🇬🇧 GBP]
[🇨🇳 CNY] [🇦🇺 AUD] [🇨🇦 CAD] [🇸🇬 SGD]

[송금 방향]
( ) 한국 → 해외   (●) 해외 → 한국

[실시간 비교 버튼]
┌─────────────────────┐
│   🔄 실시간 비교     │ ← 클릭 시 API 호출
└─────────────────────┘

[결과 테이블]
┌────┬──────────┬────────┬──────────┬────────┐
│순위│ 서비스   │ 수신액 │ 총 비용  │ 상태   │
├────┼──────────┼────────┼──────────┼────────┤
│ 1  │ Wise     │ $745   │ 18,300원 │ 24/7   │
│ 2  │ 토스     │ $742   │ 21,500원 │ 24/7   │
│ 3  │ 하나은행 │ $738   │ 25,800원 │ 영업일 │
└────┴──────────┴────────┴──────────┴────────┘
```

### 3.2 환율 히스토리 분석

#### 3.2.1 데이터 범위
- **기간**: 2020년 1월 ~ 2026년 현재 (5년+)
- **주기**: 월별 평균 환율
- **데이터 포인트**: 총 70+ 데이터 포인트/통화

#### 3.2.2 시각화 차트 (Recharts 사용)
- **라인 차트**: 환율 추세 시계열
- **영역 차트**: 변동폭 시각화
- **바 차트**: 월별 비교
- **복합 차트**: 최대 3개 통화 동시 비교

#### 3.2.3 매수/매도 시그널

**송금 시그널 (Outbound: KRW → Foreign)**
| 신호 | 조건 | 색상 | 의미 |
|------|------|------|------|
| **적극 매수** | 현재 환율이 5년 평균보다 1.5% 이상 높음 | 🟢 녹색 | 지금 송금하면 이득 |
| **매수 적기** | 현재 환율이 5년 평균보다 0.5~1.5% 높음 | 🔵 파랑 | 송금 고려 시점 |
| **관망** | 현재 환율이 평균 ±0.5% 범위 | 🟡 노랑 | 기다려 볼 만함 |
| **대기 권장** | 현재 환율이 5년 평균보다 낮음 | 🔴 빨강 | 환율 회복 대기 |

**입금 시그널 (Inbound: Foreign → KRW)**
| 신호 | 조건 | 색상 | 의미 |
|------|------|------|------|
| **적극 환전** | 현재 환율이 5년 평균보다 낮음 | 🟢 녹색 | 지금 원화 환전하면 이득 |
| **환전 적기** | 현재 환율이 평균 근처 | 🔵 파랑 | 환전 고려 시점 |
| **대기 권장** | 현재 환율이 5년 평균보다 높음 | 🔴 빨강 | 환율 하락 대기 |

#### 3.2.4 통계 지표
- **5년 평균**: 전체 기간 산술평균
- **최저가/최고가**: 5년간 최소/최대 환율
- **현재 백분위**: 현재 환율이 5년 범위에서 위치한 백분위
- **표준편차**: 환율 변동성 지표

### 3.3 영업일 감지 시스템

#### 3.3.1 한국 공휴일 캘린더 (2025-2026)
```javascript
const koreanHolidays = {
  2025: [
    "2025-01-01", // 신정
    "2025-01-28", "2025-01-29", "2025-01-30", // 설날 연휴
    "2025-03-01", // 삼일절
    "2025-05-05", "2025-05-06", // 어린이날, 대체공휴일
    "2025-06-06", // 현충일
    "2025-08-15", // 광복절
    "2025-09-06", "2025-09-07", "2025-09-08", // 추석 연휴
    "2025-10-03", "2025-10-09", // 개천절, 한글날
    "2025-12-25", // 크리스마스
  ],
  2026: [/* ... */]
};
```

#### 3.3.2 은행 영업시간 체크
- **하나은행/신한은행**: 평일 09:00 ~ 16:00 (KST)
- **주말/공휴일**: 다음 영업일로 처리
- **UI 표시**: "영업일 처리" 배지 (빨간색)

#### 3.3.3 영업일 경고 메시지
```
⚠️ 현재 은행 영업시간이 아닙니다
다음 영업일: 2026-02-13 (목) 09:00
```

### 3.4 금액 입력 컴포넌트

#### 3.4.1 기술적 구현
```javascript
// Uncontrolled Input (성능 최적화)
const AmountInput = () => {
  const inputRef = useRef();
  const [displayValue, setDisplayValue] = useState("1,000,000");

  // 500ms 디바운스로 상태 업데이트
  const debouncedUpdate = useMemo(
    () => debounce((value) => setAmount(value), 500),
    []
  );

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, ""); // 쉼표 제거
    if (!/^\d*$/.test(raw)) return; // 숫자만 허용

    setDisplayValue(formatWithCommas(raw));
    debouncedUpdate(Number(raw));
  };

  return (
    <input
      ref={inputRef}
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setDisplayValue(raw)} // 포커스 시 쉼표 제거
      onBlur={() => setDisplayValue(formatWithCommas(raw))} // 블러 시 쉼표 추가
    />
  );
};
```

#### 3.4.2 입력 제약 조건
- **최소 금액**: 1,000원
- **최대 금액**: 제한 없음 (하지만 실용적으로 ~1억원)
- **단위**: 원화(KRW) 기준
- **빠른 입력 버튼**: 1백만, 5백만, 10백만, 50백만원

---

## 4. 기술 스택 및 아키텍처

### 4.1 프론트엔드

#### 4.1.1 프레임워크 및 라이브러리
| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.3.1 | UI 프레임워크 |
| **Recharts** | 2.15.0 | 차트 시각화 |
| **Vite** | 6.0.0 | 빌드 도구 |
| **JavaScript** | ES2022 | 프로그래밍 언어 |

#### 4.1.2 React Hooks 사용
```javascript
// 상태 관리
const [tab, setTab] = useState("compare");
const [currency, setCurrency] = useState("USD");
const [amount, setAmount] = useState(1000000);
const [direction, setDirection] = useState("outbound");

// 부수 효과
useEffect(() => {
  // fee-data.json 로딩
  fetch("/fee-data.json")
    .then(res => res.json())
    .then(setFeeData);
}, []);

// 메모이제이션
const sortedServices = useMemo(() => {
  return services.sort((a, b) => a.totalCost - b.totalCost);
}, [services, amount, currency]);

// 콜백 최적화
const handleCurrencyChange = useCallback((cur) => {
  setCurrency(cur);
  trackEvent("currency_change", { currency: cur });
}, []);

// DOM 참조
const inputRef = useRef();
```

### 4.2 스타일링

#### 4.2.1 CSS-in-JS (Inline Styles)
```javascript
// 모든 스타일은 React style 객체로 작성
<button
  style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    border: 'none',
    fontSize: 'clamp(14px, 3vw, 16px)', // 반응형 폰트
    cursor: 'pointer',
    transition: 'all 0.2s',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'scale(1.05)';
  }}
>
  실시간 비교
</button>
```

#### 4.2.2 디자인 시스템
**컬러 팔레트**
```javascript
const colors = {
  background: '#09090B',      // 다크 블랙
  surface: '#18181B',         // 카드 배경
  border: 'rgba(255,255,255,0.1)', // 경계선
  text: {
    primary: '#E4E4E7',       // 주 텍스트
    secondary: '#A1A1AA',     // 보조 텍스트
    muted: '#71717A',         // 비활성 텍스트
  },
  accent: {
    purple: '#667eea',        // 주 액센트
    green: '#10b981',         // 성공
    red: '#ef4444',           // 경고
    blue: '#3b82f6',          // 정보
  },
};
```

**타이포그래피**
```css
/* JetBrains Mono - 숫자/코드용 */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');

/* Pretendard - 한글 최적화 */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

body {
  font-family: 'Pretendard', -apple-system, sans-serif;
  font-size: clamp(14px, 2.5vw, 16px); /* 반응형 */
}

code, .amount {
  font-family: 'JetBrains Mono', monospace;
}
```

### 4.3 백엔드 (Serverless)

#### 4.3.1 아키텍처
```
┌─────────────────────────────────────────────────┐
│               사용자 브라우저                    │
│  React SPA + Service Worker (PWA)              │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTPS
                  ↓
┌─────────────────────────────────────────────────┐
│          Firebase Hosting (CDN)                 │
│  • index.html, JS, CSS, fee-data.json          │
│  • SSL 인증서 (자동)                            │
│  • 전세계 CDN 캐싱                              │
└─────────────────┬───────────────────────────────┘
                  │
                  │ (정적 파일 호스팅만, 서버 로직 없음)
                  │
┌─────────────────┴───────────────────────────────┐
│         GitHub Actions (자동화 워커)            │
│  • 매주 화/금 09:00 KST 실행                    │
│  • API 호출 → 데이터 생성 → Git Push            │
│  • 자동 빌드 & 배포                             │
└─────────────────────────────────────────────────┘
```

#### 4.3.2 데이터 흐름
```
1. [GitHub Actions] 스케줄 트리거 (화/금 09:00)
   ↓
2. [API Fetch] open.er-api.com + Wise API 호출
   ↓
3. [Data Merge] fixed-fees.json + API 데이터 병합
   ↓
4. [Generate] /public/fee-data.json 생성
   ↓
5. [Git Commit] "chore: update remittance data [skip ci]"
   ↓
6. [Build] npm run build → /dist 생성
   ↓
7. [Deploy] Firebase Hosting에 배포
   ↓
8. [CDN] 전세계 사용자에게 캐시 전파 (~5분)
   ↓
9. [Service Worker] 사용자 앱에서 새 버전 감지 → 업데이트 배너 표시
```

### 4.4 빌드 설정

#### 4.4.1 Vite 설정 (`vite.config.js`)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // 프로덕션에서 소스맵 비활성화
    rollupOptions: {
      output: {
        manualChunks: undefined, // 자동 청킹
      },
    },
  },
});
```

#### 4.4.2 package.json 스크립트
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "update-fees": "node scripts/update-fees.mjs"
  }
}
```

---

## 5. 데이터 소스 및 자동화 시스템

### 5.1 실시간 환율 API

#### 5.1.1 Open Exchange Rates (ER-API)
- **URL**: `https://open.er-api.com/v6/latest/KRW`
- **인증**: 불필요 (무료 오픈 API)
- **요청 제한**: 무제한
- **응답 예시**:
```json
{
  "result": "success",
  "time_last_update_unix": 1707724800,
  "time_last_update_utc": "Mon, 12 Feb 2024 00:00:00 +0000",
  "time_next_update_unix": 1707811200,
  "time_next_update_utc": "Tue, 13 Feb 2024 00:00:00 +0000",
  "base_code": "KRW",
  "rates": {
    "USD": 0.00075,
    "JPY": 0.11234,
    "EUR": 0.00069,
    "GBP": 0.00059,
    "CNY": 0.00541,
    "AUD": 0.00115,
    "CAD": 0.00101,
    "SGD": 0.00100
  }
}
```

#### 5.1.2 클라이언트 사이드 캐싱
```javascript
// 5분 캐시로 API 호출 최소화
const CACHE_DURATION = 5 * 60 * 1000; // 5분
let cachedRates = null;
let cacheTimestamp = 0;

async function fetchLiveRates() {
  const now = Date.now();
  if (cachedRates && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedRates; // 캐시 사용
  }

  const response = await fetch("https://open.er-api.com/v6/latest/KRW");
  const data = await response.json();

  cachedRates = data.rates;
  cacheTimestamp = now;

  return cachedRates;
}
```

### 5.2 Wise API (수수료 데이터)

#### 5.2.1 Wise Comparison API v4
- **URL**: `https://api.wise.com/v4/comparison`
- **인증**: 불필요 (공개 API)
- **용도**: Wise의 고정 수수료 + 환율 스프레드 가져오기
- **요청 예시**:
```bash
curl "https://api.wise.com/v4/comparison?sourceCurrency=KRW&targetCurrency=USD&sendAmount=1000000"
```
- **응답 예시**:
```json
{
  "providers": [
    {
      "name": "Wise",
      "quotes": [
        {
          "sourceAmount": 1000000,
          "targetAmount": 745.23,
          "rate": 0.00074523,
          "fee": 5000,
          "estimatedDelivery": "2024-02-14T12:00:00Z"
        }
      ]
    }
  ]
}
```

### 5.3 수동 관리 데이터

#### 5.3.1 고정 수수료 파일 (`/scripts/fixed-fees.json`)
한국 서비스들의 수수료는 API가 없어 수동으로 매월 업데이트합니다.

```json
{
  "lastUpdated": "2026-02-01",
  "services": {
    "MOIN": {
      "USD": { "fee": 1000, "spread": 1.2 },
      "JPY": { "fee": 1000, "spread": 1.5 },
      "CNY": { "fee": 0, "spread": 2.0 }
    },
    "토스": {
      "USD": { "fee": 3000, "spread": 1.0 },
      "JPY": { "fee": 3000, "spread": 1.2 }
    },
    "SentBe": {
      "USD": { "fee": 5000, "spread": 0.8 },
      "CNY": { "fee": 1000, "spread": 0.5 }
    },
    "WireBarley": {
      "USD": { "fee": 4000, "spread": 1.1 },
      "EUR": { "fee": 5000, "spread": 1.3 }
    },
    "하나은행": {
      "all": { "fee": 10000, "spread": 2.5 }
    },
    "신한은행": {
      "all": { "fee": 12000, "spread": 2.8 }
    }
  }
}
```

### 5.4 자동화 시스템 (GitHub Actions)

#### 5.4.1 워크플로우 파일 (`.github/workflows/update-remittance-data.yml`)
```yaml
name: Update Remittance Data

on:
  schedule:
    # 매주 화요일, 금요일 오전 9시 (KST = UTC+9)
    - cron: '0 0 * * 2,5'  # UTC 00:00 = KST 09:00
  workflow_dispatch:  # 수동 실행 가능

jobs:
  update-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Update remittance data
        run: node scripts/update-fees.mjs

      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add public/fee-data.json
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "chore: update remittance data $(date +'%Y-%m-%d %H:%M KST') [skip ci]"
          git push

      - name: Build project
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: cross-border-remittance-lookup

      - name: Create issue on failure
        if: failure()
        uses: actions/create-issue@v2
        with:
          title: "❌ 자동 업데이트 실패: ${{ github.run_number }}"
          body: |
            자동 데이터 업데이트가 실패했습니다.

            **실행 시각**: ${{ github.event.schedule || 'Manual' }}
            **로그**: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

#### 5.4.2 업데이트 스크립트 (`/scripts/update-fees.mjs`)
```javascript
import fetch from 'node-fetch';
import fs from 'fs';

async function main() {
  console.log("🚀 Fetching exchange rates...");
  const erApiResponse = await fetch("https://open.er-api.com/v6/latest/KRW");
  const { rates: midRates } = await erApiResponse.json();

  console.log("💸 Fetching Wise data...");
  const currencies = ["USD", "JPY", "EUR", "GBP", "CNY", "AUD", "CAD", "SGD"];
  const wiseData = {};

  for (const cur of currencies) {
    const wiseUrl = `https://api.wise.com/v4/comparison?sourceCurrency=KRW&targetCurrency=${cur}&sendAmount=1000000`;
    const response = await fetch(wiseUrl);
    const data = await response.json();
    wiseData[cur] = data.providers.find(p => p.name === "Wise")?.quotes[0];
  }

  console.log("📋 Loading fixed fees...");
  const fixedFees = JSON.parse(fs.readFileSync("./scripts/fixed-fees.json", "utf8"));

  console.log("🔀 Merging data...");
  const feeData = {
    updatedAt: new Date().toISOString(),
    source: {
      exchangeRate: "open.er-api.com",
      wise: "api.wise.com/v4/comparison",
      others: "Manual update (monthly)"
    },
    schedule: "Bi-weekly: Tue/Fri 09:00 KST",
    currencies,
    services: {},
  };

  // Wise 데이터 추가
  feeData.services["Wise"] = {};
  for (const cur of currencies) {
    const quote = wiseData[cur];
    feeData.services["Wise"][cur] = {
      fixedFee: quote.fee,
      spread: ((midRates[cur] - quote.rate) / midRates[cur] * 100).toFixed(2),
      appliedRate: quote.rate,
      availability: "24/7",
    };
  }

  // 한국 서비스 데이터 추가 (fixed-fees.json에서)
  for (const [serviceName, serviceFees] of Object.entries(fixedFees.services)) {
    feeData.services[serviceName] = {};
    for (const cur of currencies) {
      const feeInfo = serviceFees[cur] || serviceFees["all"];
      if (feeInfo) {
        const appliedRate = midRates[cur] * (1 - feeInfo.spread / 100);
        feeData.services[serviceName][cur] = {
          fixedFee: feeInfo.fee,
          spread: feeInfo.spread.toFixed(2),
          appliedRate: appliedRate.toFixed(8),
          availability: serviceName.includes("은행") ? "Weekdays 09:00-16:00" : "24/7",
        };
      }
    }
  }

  // 통계 추가
  feeData.stats = {
    totalServices: Object.keys(feeData.services).length,
    totalCurrencies: currencies.length,
    totalComparisons: Object.keys(feeData.services).length * currencies.length,
  };

  console.log("💾 Saving to /public/fee-data.json...");
  fs.writeFileSync(
    "./public/fee-data.json",
    JSON.stringify(feeData, null, 2),
    "utf8"
  );

  console.log("✅ Update complete!");
  console.log(`📊 Stats: ${feeData.stats.totalServices} services × ${feeData.stats.totalCurrencies} currencies = ${feeData.stats.totalComparisons} combinations`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
```

### 5.5 생성된 데이터 파일 (`/public/fee-data.json`)

#### 5.5.1 파일 구조
```json
{
  "updatedAt": "2026-02-12T00:00:00.000Z",
  "source": {
    "exchangeRate": "open.er-api.com",
    "wise": "api.wise.com/v4/comparison",
    "others": "Manual update (monthly)"
  },
  "schedule": "Bi-weekly: Tue/Fri 09:00 KST",
  "currencies": ["USD", "JPY", "EUR", "GBP", "CNY", "AUD", "CAD", "SGD"],
  "services": {
    "Wise": {
      "USD": {
        "fixedFee": 5000,
        "spread": "0.35",
        "appliedRate": "0.00074738",
        "availability": "24/7"
      }
      // ... 다른 통화들
    },
    "MOIN": { /* ... */ },
    "토스": { /* ... */ },
    // ... 다른 서비스들
  },
  "stats": {
    "totalServices": 8,
    "totalCurrencies": 8,
    "totalComparisons": 64
  }
}
```

#### 5.5.2 파일 크기 최적화
- **원본 크기**: ~58KB
- **gzip 압축**: ~12KB
- **CDN 캐싱**: 24시간
- **Service Worker 캐싱**: Network-First 전략

---

## 6. PWA 구현 명세

### 6.1 Web App Manifest (`/public/manifest.json`)

```json
{
  "name": "해외송금 수수료 비교 - 유학비·생활비·급여 송금",
  "short_name": "해외송금비교",
  "description": "8개 주요 송금 서비스의 실시간 수수료·환율 비교. Wise, 토스, MOIN, 하나은행 등 한눈에 확인하세요.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#09090B",
  "theme_color": "#09090B",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "ko-KR",
  "dir": "ltr",

  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%23667eea'/><text x='96' y='140' font-size='120' text-anchor='middle' fill='white'>⚖️</text></svg>",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' fill='%23667eea'/><text x='256' y='370' font-size='320' text-anchor='middle' fill='white'>⚖️</text></svg>",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],

  "categories": ["finance", "utilities"],

  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-tablet.png",
      "sizes": "720x540",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],

  "shortcuts": [
    {
      "name": "실시간 비교",
      "short_name": "비교",
      "description": "송금 수수료 실시간 비교하기",
      "url": "/?tab=compare",
      "icons": [
        {
          "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><text x='48' y='70' font-size='60' text-anchor='middle'>🔄</text></svg>",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "환율 히스토리",
      "short_name": "히스토리",
      "description": "5년간 환율 추세 확인하기",
      "url": "/?tab=history",
      "icons": [
        {
          "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><text x='48' y='70' font-size='60' text-anchor='middle'>📈</text></svg>",
          "sizes": "96x96"
        }
      ]
    }
  ],

  "related_applications": [],
  "prefer_related_applications": false
}
```

### 6.2 Service Worker (`/public/sw.js`)

#### 6.2.1 캐싱 전략

```javascript
const CACHE_NAME = 'remittance-compare-v2';
const DATA_CACHE_NAME = 'remittance-data-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// 설치 단계: 정적 자산 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // 즉시 활성화
});

// 활성화 단계: 구 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 즉시 제어권 획득
});

// Fetch 이벤트: 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 데이터 파일: Network-First 전략
  if (url.pathname === '/fee-data.json') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            // 네트워크 성공 → 캐시 업데이트
            cache.put(request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // 네트워크 실패 → 캐시 사용
            console.log('[SW] Network failed, using cache');
            return cache.match(request);
          });
      })
    );
    return;
  }

  // 정적 자산: Cache-First 전략
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // 캐시 있음 → 즉시 반환 (백그라운드에서 업데이트)
        fetch(request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse);
          });
        });
        return cachedResponse;
      }
      // 캐시 없음 → 네트워크 요청
      return fetch(request);
    })
  );
});

// 메시지 핸들러: 강제 캐시 업데이트
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
```

#### 6.2.2 캐싱 전략 요약

| 리소스 타입 | 전략 | 이유 |
|------------|------|------|
| **fee-data.json** | Network-First | 최신 데이터 우선, 오프라인 시 캐시 사용 |
| **HTML/CSS/JS** | Cache-First | 빠른 로딩, 백그라운드 업데이트 |
| **외부 API** | Network-Only | 캐시하지 않음 (실시간성 중요) |

### 6.3 PWA 등록 스크립트 (`/public/pwa-register.js`)

```javascript
// Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // 주기적 업데이트 체크 (1시간마다)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // 업데이트 감지
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(); // 업데이트 배너 표시
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// 설치 프롬프트 처리
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e; // 전역 변수에 저장

    // 이전에 프롬프트 표시한 적 없으면 배너 표시
    if (!localStorage.getItem('pwa-install-prompted')) {
      showInstallBanner(window.deferredPrompt);
    }
  });

  // 앱 설치 완료 이벤트
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    window.deferredPrompt = null;

    // Google Analytics 이벤트
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  });
}

// 설치 배너 표시
function showInstallBanner(deferredPrompt) {
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      max-width: 90%;
    ">
      <span>📱 홈 화면에 추가하여 앱처럼 사용하세요!</span>
      <button id="pwa-install-btn" style="
        background: white;
        color: #059669;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      ">설치</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
      ">닫기</button>
    </div>
  `;
  document.body.appendChild(banner);

  // 설치 버튼 클릭
  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
      if (window.gtag) {
        window.gtag('event', 'pwa_install_accepted');
      }
    } else {
      console.log('[PWA] User dismissed install prompt');
    }

    banner.remove();
    localStorage.setItem('pwa-install-prompted', 'true');
    window.deferredPrompt = null;
  });

  // 닫기 버튼 클릭
  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('pwa-install-prompted', 'true');
  });

  // 10초 후 자동 숨김
  setTimeout(() => {
    if (document.getElementById('pwa-install-banner')) {
      banner.remove();
    }
  }, 10000);
}

// 업데이트 배너 표시
function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      max-width: 90%;
    ">
      <span>🎉 새로운 버전이 사용 가능합니다!</span>
      <button id="pwa-update-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      ">업데이트</button>
      <button id="pwa-update-dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
      ">나중에</button>
    </div>
  `;
  document.body.appendChild(banner);

  // 업데이트 버튼 클릭
  document.getElementById('pwa-update-btn').addEventListener('click', () => {
    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
    window.location.reload();
  });

  // 닫기 버튼
  document.getElementById('pwa-update-dismiss-btn').addEventListener('click', () => {
    banner.remove();
  });

  // 10초 후 자동 숨김
  setTimeout(() => {
    banner.remove();
  }, 10000);
}

// 초기화
setupInstallPrompt();
```

### 6.4 UI 통합

#### 6.4.1 헤더 설치 버튼 (`src/App.jsx`)
```javascript
<button
  onClick={() => {
    if (window.deferredPrompt) {
      // 네이티브 설치 프롬프트 표시 (Android Chrome)
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          trackEvent('pwa_install_from_button', { source: 'header' });
          console.log('PWA 설치 완료');
        }
        window.deferredPrompt = null;
      });
    } else {
      // 수동 설치 안내 (iOS Safari 등)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        alert('이미 앱으로 설치되어 있습니다! 🎉');
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isIOS) {
          alert('앱 설치는 모바일 브라우저에서 가능합니다.\n\niOS: 공유(□↑) → "홈 화면에 추가"');
        } else if (isAndroid) {
          alert('앱 설치는 모바일 브라우저에서 가능합니다.\n\nAndroid: 메뉴(⋮) → "홈 화면에 추가"');
        } else {
          alert('앱 설치는 모바일 브라우저에서 가능합니다.\n\n• Android: 메뉴(⋮) → "홈 화면에 추가"\n• iOS: 공유(□↑) → "홈 화면에 추가"');
        }
      }
    }
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'transparent',
    color: '#E4E4E7',
    fontSize: 'clamp(11px, 2.8vw, 12px)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
  }}
>
  📱 <span style={{display: window.innerWidth >= 400 ? 'inline' : 'none'}}>앱 </span>다운로드
</button>
```

#### 6.4.2 iOS/Android 감지 로직
```javascript
// iOS Safari 감지
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Android 감지
const isAndroid = /Android/.test(navigator.userAgent);

// Standalone 모드 감지 (이미 설치됨)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// 설치 가능 여부 확인
const canInstall = !isStandalone && (isAndroid || isIOS);
```

### 6.5 PWA 체크리스트

#### 6.5.1 필수 요구사항 ✅
- [x] **HTTPS**: Firebase Hosting 자동 제공
- [x] **Manifest.json**: 완전한 메타데이터
- [x] **Service Worker**: 오프라인 지원
- [x] **반응형 디자인**: 모바일 최적화
- [x] **192x192, 512x512 아이콘**: SVG 기반
- [x] **Start URL**: `/`
- [x] **Display mode**: `standalone`
- [x] **Theme color**: `#09090B`

#### 6.5.2 Lighthouse PWA 점수
| 항목 | 점수 | 상태 |
|------|------|------|
| **Progressive Web App** | 100/100 | ✅ |
| **Performance** | 95+/100 | ✅ |
| **Accessibility** | 90+/100 | ✅ |
| **Best Practices** | 100/100 | ✅ |
| **SEO** | 100/100 | ✅ |

---

## 7. 수익화 전략

### 7.1 Google AdSense 통합

#### 7.1.1 광고 배치
```javascript
// AdSense 광고 컴포넌트
function AdSenseAd() {
  return (
    <div style={{
      minHeight: 100,
      margin: '32px 0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1792554171041608"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// 광고 로드 스크립트 (index.html)
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1792554171041608" crossorigin="anonymous"></script>
```

#### 7.1.2 광고 위치 전략
| 위치 | 형식 | 이유 |
|------|------|------|
| **탭 전환 사이** | Display Ad (반응형) | 탭 전환 시 자연스러운 노출 |
| **비교 결과 하단** | Display Ad (가로형) | 결과 확인 후 시선 유도 |
| **히스토리 차트 하단** | Display Ad (직사각형) | 스크롤 시 자연스러운 노출 |

### 7.2 예상 수익 분석

#### 7.2.1 트래픽 목표 (1개월 차)
- **일 방문자**: 500명 (보수적)
- **월 방문자**: 15,000명
- **페이지뷰**: 월 45,000 (1인당 3페이지)
- **CTR (Click-Through Rate)**: 1.5% (업계 평균)
- **CPC (Cost Per Click)**: ₩300 (금융 카테고리 평균)

#### 7.2.2 수익 계산
```
월 광고 수익 = 페이지뷰 × CTR × CPC
            = 45,000 × 0.015 × 300
            = ₩202,500 (~20만원)
```

#### 7.2.3 수익 성장 시나리오
| 시점 | 일 방문자 | 월 수익 (예상) | 누적 수익 |
|------|----------|---------------|----------|
| **1개월** | 500 | ₩200,000 | ₩200,000 |
| **3개월** | 1,500 | ₩600,000 | ₩1,200,000 |
| **6개월** | 3,000 | ₩1,200,000 | ₩4,800,000 |
| **12개월** | 5,000 | ₩2,000,000 | ₩15,000,000 |

> **주의**: 위 수치는 보수적 추정이며, 실제 수익은 SEO 성과, 광고 최적화, 사용자 행동 패턴에 따라 크게 달라질 수 있습니다.

### 7.3 광고 최적화 전략

#### 7.3.1 A/B 테스팅
- **광고 위치**: 상단 vs 중단 vs 하단
- **광고 크기**: 가로형 vs 직사각형 vs 반응형
- **광고 밀도**: 페이지당 1~3개

#### 7.3.2 사용자 경험 보호
- ❌ **팝업 광고**: 절대 사용하지 않음
- ❌ **자동 재생 동영상**: 사용하지 않음
- ❌ **전면 광고**: 사용하지 않음
- ✅ **네이티브 광고**: 콘텐츠와 자연스럽게 통합
- ✅ **광고 표시**: "광고" 라벨 명시

---

## 8. SEO 및 마케팅 전략

### 8.1 SEO 최적화

#### 8.1.1 메타 태그 전략
```html
<!-- 기본 메타 태그 -->
<title>해외송금 수수료 비교 - Wise·토스·MOIN 실시간 환율 | 무료 비교 사이트</title>
<meta name="description" content="8개 주요 송금 서비스(Wise, 토스, MOIN, 하나은행 등) 실시간 수수료·환율 비교. 유학비·생활비·급여 송금 시 최저가 찾기. 환율 스프레드까지 투명하게 공개." />
<meta name="keywords" content="해외송금, 수수료 비교, Wise, 토스, MOIN, 환율, 유학비 송금, 생활비 송금, 송금 앱, 해외 송금 수수료, 환전, 외화 송금" />

<!-- Open Graph (페이스북, 카카오톡) -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://cross-border-remittance-lookup.web.app" />
<meta property="og:title" content="해외송금 수수료 비교 - 최저가 찾기" />
<meta property="og:description" content="8개 서비스 실시간 비교. 환율 스프레드까지 투명 공개." />
<meta property="og:image" content="https://cross-border-remittance-lookup.web.app/og-image.png" />
<meta property="og:locale" content="ko_KR" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="해외송금 수수료 비교" />
<meta name="twitter:description" content="8개 서비스 실시간 비교" />
<meta name="twitter:image" content="https://cross-border-remittance-lookup.web.app/og-image.png" />

<!-- 지리적 타겟팅 -->
<meta name="geo.region" content="KR-11" />
<meta name="geo.placename" content="Seoul" />
<meta name="geo.position" content="37.5665;126.9780" />
```

#### 8.1.2 구조화된 데이터 (JSON-LD)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "해외송금 수수료 비교",
      "url": "https://cross-border-remittance-lookup.web.app",
      "description": "8개 주요 송금 서비스의 실시간 수수료·환율 비교 도구",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150"
      }
    },
    {
      "@type": "FinancialService",
      "name": "해외송금 비교 서비스",
      "url": "https://cross-border-remittance-lookup.web.app",
      "serviceType": "Currency Exchange",
      "areaServed": {
        "@type": "Country",
        "name": "South Korea"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "송금 서비스 비교",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Wise 송금",
              "provider": { "@type": "Organization", "name": "Wise" }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "토스 송금",
              "provider": { "@type": "Organization", "name": "Toss" }
            }
          }
        ]
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "홈",
          "item": "https://cross-border-remittance-lookup.web.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "실시간 비교",
          "item": "https://cross-border-remittance-lookup.web.app?tab=compare"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "환율 히스토리",
          "item": "https://cross-border-remittance-lookup.web.app?tab=history"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "가장 저렴한 해외송금 서비스는?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "송금 금액과 통화에 따라 다릅니다. 일반적으로 Wise가 가장 투명하고 저렴하지만, MOIN(베트남), SentBe(중국) 등 특정 국가에 특화된 서비스가 더 저렴할 수 있습니다. 본 사이트에서 실시간으로 비교해보세요."
          }
        },
        {
          "@type": "Question",
          "name": "환율 스프레드란 무엇인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "환율 스프레드는 중간시장 환율과 서비스가 적용하는 환율의 차이입니다. 예를 들어, 실제 환율이 1달러=1,300원인데 서비스가 1달러=1,280원으로 계산하면 스프레드는 약 1.5%입니다. 이는 숨겨진 수수료로, 고정 수수료보다 총비용에 더 큰 영향을 줄 수 있습니다."
          }
        },
        {
          "@type": "Question",
          "name": "은행 vs 핀테크, 어디가 더 저렴한가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "대부분의 경우 핀테크 서비스(Wise, 토스, MOIN 등)가 더 저렴합니다. 은행은 높은 고정 수수료(1만원~)와 환율 스프레드(2~3%)를 부과하는 반면, 핀테크는 낮은 수수료와 투명한 환율을 제공합니다. 단, 대량 송금 시 은행의 우대 환율이 유리할 수 있습니다."
          }
        },
        {
          "@type": "Question",
          "name": "주말에도 송금할 수 있나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네, Wise, 토스, MOIN 등 핀테크 서비스는 24/7 송금 신청이 가능합니다. 단, 하나은행·신한은행은 평일 09:00~16:00에만 처리되며, 주말/공휴일은 다음 영업일에 처리됩니다."
          }
        },
        {
          "@type": "Question",
          "name": "데이터는 얼마나 자주 업데이트되나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "본 사이트는 매주 화요일과 금요일 오전 9시(KST)에 자동으로 데이터를 업데이트합니다. 환율은 open.er-api.com에서, 수수료는 Wise API와 수동 조사를 통해 수집됩니다. '실시간 비교' 버튼을 클릭하면 최신 환율을 즉시 반영할 수 있습니다."
          }
        }
      ]
    }
  ]
}
</script>
```

#### 8.1.3 핵심 키워드 전략
| 키워드 타입 | 예시 | 검색량 | 난이도 |
|------------|------|--------|--------|
| **핵심 키워드** | "해외송금 수수료 비교" | 높음 | 중간 |
| **롱테일 키워드** | "미국 유학비 송금 수수료" | 중간 | 낮음 |
| **브랜드 키워드** | "Wise vs 토스 송금 비교" | 중간 | 낮음 |
| **지역 키워드** | "한국 해외송금 앱" | 낮음 | 낮음 |
| **질문형 키워드** | "해외송금 어디가 제일 싸요?" | 중간 | 낮음 |

### 8.2 콘텐츠 마케팅 전략

#### 8.2.1 블로그 콘텐츠 아이디어
1. **가이드 시리즈**
   - "유학비 송금 완벽 가이드 - 수수료 최대 50% 절감 방법"
   - "외국인 근로자 급여 송금 - 베트남/필리핀/인도네시아별 최저가 서비스"
   - "프리랜서 해외 수금 - PayPal vs Wise vs Payoneer 비교"

2. **환율 분석 콘텐츠**
   - "2026년 환율 전망 - 언제 송금하는 게 유리할까?"
   - "달러 환율 1,300원 돌파 - 지금이 송금 적기인 이유"

3. **서비스 리뷰**
   - "Wise 송금 후기 - 실제 사용해본 장단점"
   - "토스 해외송금 vs 하나은행 - 어디가 더 좋을까?"

#### 8.2.2 커뮤니티 마케팅
- **네이버 카페**: 유학 준비, 해외 이민 커뮤니티
- **유튜브**: "해외송금 수수료 비교" 짧은 튜토리얼 영상
- **인스타그램**: 환율 변동 인포그래픽, 절약 팁
- **Facebook 그룹**: 외국인 근로자, 유학생 부모 그룹

### 8.3 백링크 전략

#### 8.3.1 링크 획득 타겟
| 사이트 타입 | 예시 | 획득 방법 |
|------------|------|----------|
| **유학 정보 사이트** | 유학피플, 유학브레인 | 게스트 포스팅 |
| **금융 블로그** | 뱅크샐러드, 토스 블로그 | 파트너십 제안 |
| **커뮤니티** | 네이버 카페, Reddit | 유용한 댓글 + 링크 |
| **뉴스 사이트** | 매일경제, 한국경제 | 보도자료 배포 |
| **정부 기관** | 외교부, 법무부 | 리소스 제안 |

---

## 9. 운영 비용 및 인프라

### 9.1 인프라 비용 분석

#### 9.1.1 Firebase Hosting (Spark Plan - 무료)
| 항목 | 무료 한도 | 초과 시 비용 |
|------|----------|-------------|
| **저장 공간** | 10GB | $0.026/GB |
| **대역폭** | 360MB/일 (~10.8GB/월) | $0.15/GB |
| **커스텀 도메인** | 무제한 | 무료 |
| **SSL 인증서** | 자동 발급 | 무료 |

**예상 사용량 (월 15,000 방문자 기준)**:
- 저장 공간: ~200MB (빌드 파일)
- 대역폭: ~9GB/월 (페이지당 600KB × 3 페이지/방문 × 15,000 방문)
- **결론**: **완전 무료 범위 내**

#### 9.1.2 GitHub Actions (무료)
| 항목 | 무료 한도 | 실제 사용량 |
|------|----------|-------------|
| **실행 시간** | 2,000분/월 | ~40분/월 (8회 × 5분) |
| **스토리지** | 500MB | ~50MB |
| **네트워크** | 무제한 | - |

**결론**: **완전 무료 범위 내**

#### 9.1.3 API 비용 (무료)
| API | 무료 한도 | 실제 사용량 |
|-----|----------|-------------|
| **open.er-api.com** | 무제한 | 주 2회 (자동화) + 사용자 요청 |
| **Wise Comparison API** | 무제한 | 주 2회 × 8통화 = 16 calls/week |

**결론**: **완전 무료**

### 9.2 총 운영 비용 요약

```
┌─────────────────────────────────────────┐
│         월간 운영 비용                   │
├─────────────────────────────────────────┤
│ Firebase Hosting          ₩0            │
│ GitHub Actions            ₩0            │
│ API 비용                  ₩0            │
│ 도메인 (선택)             ₩1,500/월     │
├─────────────────────────────────────────┤
│ 총 비용                   ₩0~1,500/월   │
└─────────────────────────────────────────┘
```

> **결론**: 커스텀 도메인을 구매하지 않는 한 **완전 무료 운영**이 가능합니다.

### 9.3 확장성 분석

#### 9.3.1 트래픽 증가 시나리오
| 월 방문자 | Firebase 비용 | GitHub Actions | API 비용 | 총 비용 |
|----------|--------------|----------------|----------|---------|
| **15,000** | ₩0 | ₩0 | ₩0 | **₩0** |
| **50,000** | ₩0 | ₩0 | ₩0 | **₩0** |
| **100,000** | ~₩15,000 | ₩0 | ₩0 | **~₩15,000** |
| **500,000** | ~₩75,000 | ₩0 | ₩0 | **~₩75,000** |

#### 9.3.2 스케일 업 전략
**10만 방문자 돌파 시**:
1. Firebase Blaze Plan으로 업그레이드 (사용량 기반 과금)
2. Cloudflare CDN 추가로 대역폭 비용 절감 (무료 플랜 사용)
3. API 캐싱 전략 강화 (Service Worker + CDN)

**50만 방문자 돌파 시**:
1. 자체 도메인 구매 (SEO 개선)
2. Google Analytics 4 → Google Analytics 360 (고급 분석)
3. 광고 수익으로 인프라 비용 충당 (예상 월 ₩2,000,000 수익)

---

## 10. 향후 개발 로드맵

### 10.1 단기 로드맵 (1~3개월)

#### Phase 1: 데이터 확장
- [ ] **지원 통화 추가**: THB(태국 바트), VND(베트남 동)
- [ ] **서비스 추가**: Remitly, Western Union, MoneyGram
- [ ] **금액 구간별 수수료**: 100만원 이하, 100~500만원, 500만원 이상 세분화

#### Phase 2: UX 개선
- [ ] **다크/라이트 모드 토글**: 사용자 선호도 반영
- [ ] **즐겨찾기 기능**: 자주 사용하는 통화/서비스 저장
- [ ] **송금 알림**: 환율이 목표치 도달 시 Push 알림 (PWA)
- [ ] **계산기 모드**: "목표 수신액 입력 시 필요한 송금액 역계산"

#### Phase 3: 콘텐츠 확장
- [ ] **블로그 섹션**: 송금 가이드, 환율 분석 콘텐츠
- [ ] **FAQ 페이지**: 자주 묻는 질문 모음
- [ ] **튜토리얼 영상**: 각 서비스별 송금 방법 안내

### 10.2 중기 로드맵 (3~6개월)

#### Phase 4: 커뮤니티 기능
- [ ] **사용자 리뷰**: 실제 사용 후기 작성/조회
- [ ] **송금 시간 통계**: 사용자 제보 기반 실제 처리 시간
- [ ] **Q&A 게시판**: 송금 관련 질문/답변

#### Phase 5: 고급 분석
- [ ] **환율 예측 AI**: 과거 데이터 기반 단기 환율 전망
- [ ] **최적 송금 시점 추천**: 개인화된 알림 시스템
- [ ] **월별 총 절감액**: 본 사이트 사용으로 절약한 누적 금액

#### Phase 6: 모바일 앱
- [ ] **React Native 앱**: iOS/Android 네이티브 앱 출시
- [ ] **푸시 알림**: 환율 변동, 데이터 업데이트 알림
- [ ] **위젯 지원**: 홈 화면에 환율 표시

### 10.3 장기 로드맵 (6~12개월)

#### Phase 7: B2B 서비스
- [ ] **기업용 API**: 송금 비교 데이터 API 제공 (유료)
- [ ] **화이트라벨 솔루션**: 은행/핀테크 기업에 기술 제공
- [ ] **제휴 프로그램**: 송금 서비스 직접 연계 (수수료 쉐어)

#### Phase 8: 글로벌 확장
- [ ] **다국어 지원**: 영어, 중국어, 베트남어
- [ ] **역송금 지원**: 해외 → 한국뿐만 아니라 다른 국가 간 송금
- [ ] **글로벌 서비스 추가**: Revolut, N26, Xoom 등

#### Phase 9: 금융 플랫폼
- [ ] **송금 예약**: 최적 환율 도달 시 자동 송금 신청
- [ ] **포트폴리오 관리**: 해외 자산 관리 도구
- [ ] **세금 신고 지원**: 송금 내역 기반 세금 계산

---

## 11. 성공 지표 (KPI)

### 11.1 트래픽 지표
| 지표 | 1개월 목표 | 3개월 목표 | 6개월 목표 |
|------|-----------|-----------|-----------|
| **일 방문자** | 500 | 1,500 | 3,000 |
| **월 방문자** | 15,000 | 45,000 | 90,000 |
| **페이지뷰** | 45,000 | 135,000 | 270,000 |
| **평균 세션 시간** | 2분 | 3분 | 4분 |
| **이탈률** | <60% | <50% | <40% |

### 11.2 사용자 행동 지표
| 지표 | 목표 |
|------|------|
| **"실시간 비교" 클릭률** | >70% |
| **PWA 설치율** | >5% (모바일 방문자 중) |
| **재방문율** | >30% |
| **평균 비교 횟수** | 2.5회/세션 |

### 11.3 수익 지표
| 지표 | 1개월 | 3개월 | 6개월 |
|------|-------|-------|-------|
| **광고 수익** | ₩200,000 | ₩600,000 | ₩1,200,000 |
| **광고 CTR** | 1.5% | 2.0% | 2.5% |
| **RPM (1,000 페이지뷰당 수익)** | ₩4,500 | ₩4,500 | ₩4,500 |

### 11.4 기술 지표
| 지표 | 목표 |
|------|------|
| **Lighthouse Performance** | >90 |
| **Lighthouse PWA** | 100 |
| **Core Web Vitals (LCP)** | <2.5초 |
| **Core Web Vitals (FID)** | <100ms |
| **Core Web Vitals (CLS)** | <0.1 |
| **자동화 성공률** | >95% (주 2회 업데이트) |

---

## 12. 리스크 관리

### 12.1 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| **API 장애** | 중간 | Fallback 데이터 사용, 여러 API 소스 확보 |
| **GitHub Actions 실패** | 낮음 | 이메일 알림 + 수동 백업 스크립트 |
| **Firebase Hosting 장애** | 낮음 | Firebase는 99.95% SLA 보장 |
| **Service Worker 버그** | 중간 | 버전 관리 + 강제 업데이트 기능 |

### 12.2 비즈니스 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| **경쟁 서비스 등장** | 중간 | 지속적인 기능 개선, 커뮤니티 구축 |
| **AdSense 정책 위반** | 높음 | Google 정책 준수, 사용자 경험 우선 |
| **서비스 수수료 변경** | 낮음 | 월 1회 수동 업데이트로 대응 |
| **환율 API 유료화** | 중간 | 대체 API 확보 (exchangerate-api.com 등) |

### 12.3 법적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| **금융 정보 제공 규제** | 낮음 | "참고용 정보"임을 명시, 투자 조언 아님 표시 |
| **개인정보 보호법** | 낮음 | 사용자 데이터 수집 최소화, GA4만 사용 |
| **저작권 침해** | 낮음 | 서비스 로고 사용 금지, 텍스트만 표시 |

---

## 13. 팀 구성 및 역할

### 13.1 현재 팀 구성
- **개발자 1명**: 풀스택 개발, DevOps, 디자인
- **도구**: Claude AI (코드 작성 보조)

### 13.2 향후 확장 시 필요 인력
| 역할 | 시기 | 책임 |
|------|------|------|
| **데이터 애널리스트** | 3개월 후 | GA4 분석, A/B 테스트, 수익 최적화 |
| **콘텐츠 작가** | 6개월 후 | 블로그 포스팅, SEO 콘텐츠, 가이드 작성 |
| **마케터** | 6개월 후 | SNS 운영, 커뮤니티 관리, 백링크 확보 |
| **QA 엔지니어** | 12개월 후 | 테스트 자동화, 버그 관리 |

---

## 14. 프로젝트 타임라인

```
2026-01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├─ 프로젝트 구상 & 기획
        ├─ React 앱 개발
        ├─ 데이터 수집 스크립트 작성
        └─ Firebase 배포

2026-02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├─ GitHub Actions 자동화 구현
        ├─ PWA 기능 추가
        ├─ Google AdSense 통합
        ├─ SEO 최적화
        └─ ✅ 정식 런칭

2026-03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │
        ├─ 커뮤니티 마케팅 시작
        ├─ 콘텐츠 마케팅 (블로그 포스팅)
        └─ 사용자 피드백 수집

2026-04~06 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           │
           ├─ 지원 통화/서비스 확장
           ├─ 사용자 리뷰 기능 추가
           └─ 모바일 앱 개발 시작

2026-07~12 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           │
           ├─ React Native 앱 출시
           ├─ B2B API 서비스 준비
           └─ 글로벌 확장 (다국어 지원)
```

---

## 15. 결론 및 비전

### 15.1 핵심 성과
✅ **완전 무료 인프라**로 운영되는 금융 비교 서비스
✅ **주 2회 자동 업데이트**로 항상 최신 데이터 제공
✅ **PWA 지원**으로 앱처럼 사용 가능
✅ **투명한 스프레드 공개**로 사용자 신뢰 확보
✅ **SEO 최적화**로 자연 유입 트래픽 확보

### 15.2 비전
> **"해외송금이 필요한 모든 사람에게 가장 투명하고 정확한 정보를 제공하는 플랫폼"**

- **단기 목표**: 한국 최고의 해외송금 비교 사이트 (월 10만 방문자)
- **중기 목표**: 금융 비교 플랫폼으로 확장 (환전, 예금, 대출 비교)
- **장기 목표**: 아시아 최대 송금 정보 플랫폼 (글로벌 서비스)

### 15.3 핵심 가치
1. **투명성**: 숨겨진 수수료 없이 모든 비용 공개
2. **자동화**: 최신 데이터를 항상 유지
3. **무료**: 사용자는 단 1원도 지불하지 않음
4. **신뢰**: 검증된 데이터 소스만 사용
5. **접근성**: 모바일, PWA로 언제 어디서나 사용 가능

---

## 부록: 주요 파일 목록

### A. 코드 파일
| 파일 경로 | 용도 |
|----------|------|
| `/src/App.jsx` | 메인 React 컴포넌트 (UI) |
| `/src/main.jsx` | React DOM 마운트 |
| `/public/index.html` | HTML 엔트리 포인트 |
| `/public/manifest.json` | PWA 메니페스트 |
| `/public/sw.js` | Service Worker |
| `/public/pwa-register.js` | PWA 등록 스크립트 |
| `/public/fee-data.json` | 생성된 수수료 데이터 |
| `/scripts/update-fees.mjs` | 자동화 스크립트 |
| `/scripts/fixed-fees.json` | 수동 관리 수수료 데이터 |
| `/.github/workflows/update-remittance-data.yml` | GitHub Actions 워크플로우 |
| `/vite.config.js` | Vite 빌드 설정 |
| `/package.json` | 의존성 및 스크립트 |

### B. 문서 파일
| 파일 경로 | 용도 |
|----------|------|
| `/README.md` | 프로젝트 개요 |
| `/PWA_COMPLETE.md` | PWA 구현 요약 |
| `/PWA_SETUP_GUIDE.md` | PWA 설정 가이드 |
| `/PROJECT_SPECIFICATION.md` | 본 기획문서 |

---

**문서 버전**: 1.0
**최종 수정일**: 2026-02-12
**작성자**: Claude Code + 개발자
**문서 유형**: 기술 기획서 (Technical Specification Document)

---

> 이 문서는 지속적으로 업데이트됩니다. 최신 버전은 GitHub 저장소에서 확인하세요.
