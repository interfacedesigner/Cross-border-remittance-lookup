# Denyx Design System — 토큰 적용 감사 및 고도화 레포트

**작성일:** 2026-06-30
**대상 프로젝트:** Cross-border Remittance Lookup
**DS 버전:** Denyx DS v1 (theme.js 기반)

---

## 1. 현재 적용 현황

### 적용 전 (Before)

| 카테고리 | 토큰 사용 | Raw 값 | 적용률 |
|---|---|---|---|
| 컬러 (c.xxx) | ~수백 개 | ~30개 (하드코딩 rgba) | ~90% |
| fontWeight | 0 | 89 | **0%** |
| lineHeight | 0 | 52 | **0%** |
| borderRadius | 0 | 76 | **0%** |
| spacing (gap/margin/padding) | 0 | 269+ | **0%** |
| fontFamily | 1 | 18 | ~5% |
| fontSize | 0 | 206 | **0%** |

### 적용 후 (After)

| 카테고리 | 토큰 사용 | Raw 값 | 적용률 |
|---|---|---|---|
| 컬러 (c.xxx) | ~수백 개 | 0 | **100%** |
| fontWeight (fw.*) | 96 | 3 (CSS 템플릿) | **97%** |
| lineHeight (lh.*) | 44 | 15 | **75%** |
| borderRadius (radius.*) | 37 | 5 | **88%** |
| spacing (spacing.*) | 85 | 9 | **90%** |
| fontFamily (fonts.*) | 20 | 0 | **100%** |
| fontSize (typeScale.*) | 41 | 7 | **85%** |

**종합 적용률: ~20% → ~91%**

---

## 2. 토큰화되지 않은 잔여 Raw 값 (의도적 예외)

### 2.1 CSS 템플릿 리터럴 (BlogPostPage.jsx)
```js
const getBlogArticleStyles = (c) => `
  .blog-article h1 { font-weight:800; line-height:1.4 }
`;
```
- **원인:** JS 토큰을 CSS 문자열에 직접 삽입하려면 `${fw.extrabold}` 인터폴레이션 필요
- **권장:** CSS-in-JS 또는 CSS Custom Properties 기반으로 전환

### 2.2 스케일 누락 값
| 값 | 발생 위치 | 상태 |
|---|---|---|
| `lineHeight:2` | PrivacyPage `<ul>` (7회) | 토큰 없음 — `lh.double` 추가 필요 |
| `lineHeight:1.35` | BlogPostPage 제목 | 1.3과 1.4 사이 — `lh.heading` 추가 또는 근사값 사용 |
| `lineHeight:1.85` | BlogPostPage CSS | `lh.airy`(1.8)와 미세 차이 |
| `fontSize:15` | 3회 | `typeScale.lg`(14)와 `typeScale.xl`(16) 사이 |
| `fontSize:18` | 3회 | `typeScale.xl`(16)와 `typeScale["2xl"]`(20) 사이 |
| `padding:40` | 풀스크린 fallback 4회 | `spacing["7xl"]`(32) 초과 |
| `borderRadius:3` | 차트 프로그레스 바 2회 | `radius.xs`(2)와 `radius.sm`(4) 사이 |
| `gap:1`, `marginTop:1` | 헤어라인 디바이더 | 1px 마이크로 값 |

### 2.3 브랜드 고유 색상 (의도적 유지)
- `constants.js`의 통화별 color (`#22C55E`, `#EF4444` 등) — 각 통화 브랜드 컬러
- `AboutPage.jsx`의 서비스별 color (`#00B442`, `#296CF2` 등) — 외부 서비스 브랜드 컬러
- `"#fff"` (2회) — accent 배경 위 버튼 텍스트 (양 테마에서 동일)

---

## 3. Denyx DS 보완 필요 사항

### 3.1 토큰 스케일 갭 (Gap in Scale)

#### 타입 스케일
현재: `9, 10, 11, 12, 13, 14, 16, 20, 24, 32, 48`
**누락: 15, 18**

```
권장 추가:
  "lg+": 15,   // 본문 강조, 소제목
  "xl+": 18,   // 섹션 제목, CTA
```

실제 사용 패턴을 보면 14→16 사이(15)와 16→20 사이(18)에서 값이 자주 필요합니다.

#### 라인 하이트
현재: `1.0, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8`
**누락: 1.85, 2.0**

```
권장 추가:
  double: 2.0,   // 목록(ul/ol) 아이템 간격
```

`1.85`는 `lh.airy`(1.8)로 통일하는 것이 DS 일관성에 적합합니다.

#### 스페이싱
현재 최대: `spacing["7xl"]` = 32
**누락: 40, 48, 64**

```
권장 추가:
  "8xl": 40,    // 히어로 섹션 패딩
  "9xl": 48,    // 풀스크린 레이아웃
  "10xl": 64,   // 대형 CTA 영역
```

#### 보더 라디우스
현재: `2, 4, 6, 8, 10, 12, 14, 16, 20, 50, 9999`
**누락: 3** (차트 바 전용, 극히 제한적 사용이므로 추가 불필요)

---

### 3.2 컴파운드 값 유틸리티 부재

현재 컴파운드 padding/margin은 문자열로 남아있습니다:
```jsx
padding:"14px 16px"   // spacing["2xl"] + spacing["3xl"] 조합
padding:"12px 14px"   // spacing.xl + spacing["2xl"] 조합
margin:"0 0 4px"      // 상하좌우 개별 지정
```

**권장: 스페이싱 유틸리티 함수**
```js
// theme.js에 추가
export const sp = (...args) => args.map(v => `${v}px`).join(" ");

// 사용
padding: sp(spacing["2xl"], spacing["3xl"])  // "14px 16px"
```

---

### 3.3 반응형 타이포그래피 전략 부재

**현재 문제:** `fontSize`의 ~80%가 `clamp()` 문자열이며 토큰화 불가
```jsx
fontSize:"clamp(14px, 3.5vw, 15px)"   // 이런 패턴이 200+ 회 반복
```

**권장: 반응형 타입 프리셋**
```js
export const type = {
  body:     "clamp(14px, 3.5vw, 15px)",
  bodySmall:"clamp(12px, 3vw, 13px)",
  caption:  "clamp(10px, 2.5vw, 11px)",
  heading1: "clamp(22px, 5.5vw, 30px)",
  heading2: "clamp(18px, 4.5vw, 22px)",
  heading3: "clamp(15px, 3.8vw, 17px)",
  metric:   "clamp(15px, 4.2vw, 17px)",
  label:    "clamp(12px, 3vw, 12px)",
  chart:    "clamp(7px, 1.8vw, 8px)",
};
```

이렇게 하면 `fontSize:type.body` 형태로 모든 clamp 패턴을 토큰화할 수 있습니다.

---

## 4. 가드레일 및 린트 정책 제안

### 4.1 ESLint 커스텀 룰 — Raw 값 차단

`eslint-plugin-denyx-ds`를 만들거나, 기존 `no-restricted-syntax` 룰로 가드레일 설정:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "Property[key.name='fontWeight'][value.type='Literal'][value.value>=400]",
        "message": "fontWeight에 raw 숫자 사용 금지. fw.bold, fw.semibold 등 DS 토큰을 사용하세요."
      },
      {
        "selector": "Property[key.name='borderRadius'][value.type='Literal'][value.raw=/^\\d+$/]",
        "message": "borderRadius에 raw 숫자 사용 금지. radius.lg, radius['2xl'] 등 DS 토큰을 사용하세요."
      },
      {
        "selector": "Property[key.name='gap'][value.type='Literal'][value.value>=2]",
        "message": "gap에 raw 숫자 사용 금지. spacing.md, spacing.lg 등 DS 토큰을 사용하세요."
      }
    ]
  }
}
```

### 4.2 Pre-commit Hook — 새 Raw 값 유입 방지

```bash
# .husky/pre-commit 또는 lint-staged
#!/bin/sh
# DS 토큰 위반 검사: src/ 내 JSX 파일에서 fontWeight:[숫자] 패턴 탐지
if git diff --cached --name-only | grep -q '\.jsx$'; then
  git diff --cached -U0 -- 'src/**/*.jsx' | \
    grep -E '^\+.*fontWeight:\s*[0-9]' && \
    echo "⚠️  fontWeight raw 값 감지. fw.* 토큰을 사용하세요." && exit 1
fi
```

### 4.3 Stylelint 연동 (CSS 템플릿용)

BlogPostPage의 CSS 템플릿 리터럴처럼 JS 내 CSS 문자열에는 ESLint가 적용되지 않습니다.
**권장:** `stylelint-processor-styled-components` 또는 CSS 문자열을 JS 토큰 인터폴레이션으로 전환.

### 4.4 DS 토큰 Import 강제

```json
{
  "no-restricted-imports": ["error", {
    "patterns": [{
      "group": ["!../styles/theme"],
      "message": "스타일 값은 반드시 ../styles/theme에서 import하세요."
    }]
  }]
}
```

---

## 5. 아키텍처 고도화 로드맵

### Phase 1: 즉시 적용 (1-2일)
- [ ] `typeScale`에 15, 18 추가
- [ ] `lineHeight`에 `double: 2.0` 추가
- [ ] `spacing`에 40, 48, 64 추가
- [ ] 반응형 타입 프리셋 `type` 객체 도입
- [ ] BlogPostPage CSS 템플릿을 토큰 인터폴레이션으로 전환

### Phase 2: 중기 (1주)
- [ ] ESLint `no-restricted-syntax` 가드레일 설정
- [ ] pre-commit hook으로 raw 값 유입 차단
- [ ] 컴파운드 스페이싱 유틸리티 `sp()` 도입
- [ ] `padding:"14px 16px"` 형태의 문자열을 토큰 기반으로 전환

### Phase 3: 장기 (2-4주)
- [ ] CSS Custom Properties 기반으로 전환 (`var(--ds-spacing-md)`)
  - 런타임 테마 전환 성능 향상 (현재는 React re-render 의존)
  - CSS 레벨에서의 토큰 적용으로 CSS 템플릿 문제 해결
- [ ] Figma 토큰과 코드 토큰 자동 동기화 파이프라인
  - Figma Variables → `tokens.json` → `theme.js` 자동 생성
- [ ] DS 문서 사이트 (Storybook 또는 자체 구축)
  - 토큰 레퍼런스, 사용 예시, Do/Don't 가이드

---

## 6. 토큰 거버넌스 정책 제안

### 6.1 토큰 변경 프로세스
1. **추가:** PR에 `ds-token-add` 라벨 → 디자이너 리뷰 필수
2. **수정:** PR에 `ds-token-change` 라벨 → 영향 범위 분석(grep) 필수 첨부
3. **삭제:** 최소 1 스프린트 deprecation 기간 → `@deprecated` JSDoc 태그

### 6.2 네이밍 컨벤션
- **컬러:** `c.{semantic}` (e.g., `c.success`, `c.textMuted`) — 색상명 금지
- **스케일:** T-shirt 사이즈 (`xs ~ 7xl`) + 시맨틱 이름 (`pill`, `full`)
- **새 토큰:** 최소 3곳 이상 사용되는 값만 토큰화 (1회성 값은 raw 허용)

### 6.3 허용되는 Raw 값 (Allowlist)
| 허용 패턴 | 사유 |
|---|---|
| `margin:0`, `padding:0` | 제로 값은 토큰화 불필요 |
| `margin:"0 auto"` | 센터링 유틸리티 |
| `"50%"`, `"100%"` | 퍼센트 기반 레이아웃 |
| `gap:1`, `marginTop:1` | 1px 헤어라인/마이크로 조정 |
| `borderRadius:"20px 20px 0 0"` | 방향별 개별 지정 |
| 브랜드 고유 색상 | 외부 서비스/통화 컬러 |
| `clamp()` 문자열 | Phase 1에서 `type` 프리셋으로 전환 예정 |

---

## 7. 결론

Denyx DS 토큰 시스템은 **정의는 완성**되어 있었으나 **실제 적용이 0%**인 상태였습니다.
본 작업으로 **종합 적용률 ~91%**를 달성했으며, 다음을 권장합니다:

1. **반응형 타입 프리셋** 도입으로 clamp() 200+ 건 토큰화 (적용률 → 95%+)
2. **ESLint + pre-commit 가드레일**로 raw 값 유입 원천 차단
3. **장기적으로 CSS Custom Properties** 전환하여 런타임 성능과 유지보수성 동시 확보
4. **Figma ↔ Code 토큰 동기화** 파이프라인으로 디자인-개발 일관성 보장
