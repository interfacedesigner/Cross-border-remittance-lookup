# Denyx Design System — 신규 제품 적용 시나리오 가이드

**작성일:** 2026-06-30
**DS 버전:** Denyx DS v1.1 (theme.js 기반, React inline-style)
**레퍼런스 구현:** Cross-border Remittance Lookup

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [설치 및 초기 설정](#2-설치-및-초기-설정)
3. [시나리오 A — 신규 React 프로젝트](#3-시나리오-a--신규-react-프로젝트)
4. [시나리오 B — 기존 프로젝트에 점진적 적용](#4-시나리오-b--기존-프로젝트에-점진적-적용)
5. [시나리오 C — Next.js / 프레임워크 환경](#5-시나리오-c--nextjs--프레임워크-환경)
6. [시나리오 D — 비-React 환경 (Vue, Svelte, Vanilla)](#6-시나리오-d--비-react-환경-vue-svelte-vanilla)
7. [다크 모드 적용](#7-다크-모드-적용)
8. [가드레일 설정](#8-가드레일-설정)
9. [체크리스트](#9-출시-전-체크리스트)
10. [트러블슈팅](#10-트러블슈팅)

---

## 1. 사전 준비

### 1.1 필수 의존성

```
react >= 18.0
(선택) vite 또는 webpack — 번들러
(선택) @fontsource/noto-sans, @fontsource/roboto — 셀프 호스팅 시
```

### 1.2 DS 파일 구조

```
src/
├── styles/
│   └── theme.js          # 모든 토큰 정의 (컬러, 타이포, 스페이싱 등)
└── utils/
    └── useTheme.js        # React 훅 — 테마 모드 관리 + 컬러 토큰 제공
```

### 1.3 토큰 전체 목록

| 카테고리 | export명 | 별칭(import as) | 토큰 수 | 예시 |
|---|---|---|---|---|
| 컬러 (Light/Dark) | `getColors(mode)` | `c` | 50+ 각 | `c.bgPrimary`, `c.accent`, `c.success` |
| 폰트 패밀리 | `fonts` | — | 2 | `fonts.primary`, `fonts.numeric` |
| 타입 스케일 | `typeScale` | — | 11 | `typeScale.base` (12px), `typeScale.xl` (16px) |
| 폰트 웨이트 | `fontWeight` | `fw` | 5 | `fw.regular` (400), `fw.bold` (700) |
| 라인 하이트 | `lineHeight` | `lh` | 8 | `lh.normal` (1.4), `lh.loose` (1.6) |
| 레터 스페이싱 | `tracking` | — | 4 | `tracking.default` ("-0.1px") |
| 스페이싱 | `spacing` | — | 12 | `spacing.md` (8), `spacing["3xl"]` (16) |
| 보더 라디우스 | `radius` | — | 11 | `radius.lg` (8), `radius["2xl"]` (12) |

---

## 2. 설치 및 초기 설정

### Step 1: 파일 복사

```bash
# 신규 프로젝트에 DS 파일 추가
mkdir -p src/styles src/utils

# 옵션 A: 동일 레포에서 복사
cp <denyx-ds-source>/theme.js  src/styles/theme.js
cp <denyx-ds-source>/useTheme.js  src/utils/useTheme.js

# 옵션 B: npm 패키지로 설치 (향후)
# npm install @denyx/design-tokens
```

### Step 2: 웹 폰트 로드

```html
<!-- index.html 또는 루트 컴포넌트에 추가 -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
```

또는 셀프 호스팅:
```bash
npm install @fontsource/noto-sans @fontsource/roboto
```
```js
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/700.css";
```

### Step 3: 비즈니스 상수 분리

`theme.js`에 포함된 비즈니스 상수(`SEND_AMOUNT_DEFAULT`, `RATE_CACHE_TTL` 등)는 제품별로 다릅니다.
**신규 프로젝트에서는 이 상수들을 별도 파일로 분리하세요:**

```js
// src/styles/theme.js — DS 토큰만 유지
// src/config/constants.js — 비즈니스 상수 이동
export const API_CACHE_TTL = 5 * 60 * 1000;
```

---

## 3. 시나리오 A — 신규 React 프로젝트

**전제:** Vite + React로 새 프로젝트를 시작. Denyx DS를 처음부터 적용.

### Step 1: 루트 레이아웃 설정

```jsx
// App.jsx
import { useTheme } from "./utils/useTheme";
import { fonts, tracking } from "./styles/theme";

export default function App() {
  const { mode, toggle, c } = useTheme();

  return (
    <div style={{
      minHeight: "100vh",
      background: c.bgPrimary,
      color: c.text,
      fontFamily: fonts.primary,
      letterSpacing: tracking.default,
      transition: "background 0.3s, color 0.3s",
    }}>
      {/* 테마 토글 버튼 */}
      <button onClick={toggle}>
        {mode === "dark" ? "☀️" : "🌙"}
      </button>

      {/* 앱 콘텐츠 */}
      <main>...</main>
    </div>
  );
}
```

### Step 2: 첫 번째 컴포넌트 작성

```jsx
// components/Card.jsx
import { useTheme } from "../utils/useTheme";
import { fontWeight as fw, lineHeight as lh, spacing, radius } from "../styles/theme";

export const Card = ({ title, children }) => {
  const { c } = useTheme();
  return (
    <div style={{
      background: c.bgCard,
      border: `1px solid ${c.borderLight}`,
      borderRadius: radius["3xl"],       // 14px
      padding: `${spacing["3xl"]}px`,    // 16px
    }}>
      <h3 style={{
        color: c.text,
        fontSize: "clamp(14px, 3.8vw, 16px)",
        fontWeight: fw.bold,
        lineHeight: lh.normal,
        margin: `0 0 ${spacing.md}px`,   // 0 0 8px
      }}>
        {title}
      </h3>
      <div style={{ color: c.textMuted, lineHeight: lh.relaxed }}>
        {children}
      </div>
    </div>
  );
};
```

### Step 3: Import 패턴 표준화

모든 컴포넌트에서 동일한 import 패턴을 사용합니다:

```jsx
// 훅 — 컬러 토큰 (테마 반응형)
import { useTheme } from "../utils/useTheme";

// 정적 토큰 — 테마에 무관한 값
import {
  fonts,                    // fonts.primary, fonts.numeric
  typeScale,                // typeScale.base, typeScale.xl
  fontWeight as fw,         // fw.bold, fw.semibold
  lineHeight as lh,         // lh.normal, lh.loose
  tracking,                 // tracking.default, tracking.display
  spacing,                  // spacing.md, spacing["3xl"]
  radius,                   // radius.lg, radius["2xl"]
} from "../styles/theme";
```

**규칙:**
- 필요한 토큰만 import (tree-shaking 효율)
- `fontWeight`는 항상 `fw`로, `lineHeight`는 항상 `lh`로 alias
- 컬러는 반드시 `useTheme()` 훅에서 `c`로 구조분해

---

## 4. 시나리오 B — 기존 프로젝트에 점진적 적용

**전제:** 이미 하드코딩된 스타일이 있는 프로젝트에 Denyx DS를 점진적으로 적용.

### Phase 1: 기반 구축 (Day 1)

```
1. theme.js, useTheme.js 파일 추가
2. 루트 컴포넌트에 useTheme 적용 (배경/텍스트 컬러만)
3. 기존 코드는 그대로 유지 — 깨지는 것 없음
```

### Phase 2: 컬러 마이그레이션 (Day 2-3)

**우선순위: 컬러가 가장 높음** — 다크 모드에 직접적 영향

```bash
# 하드코딩 컬러 검색
grep -rn "\"#[0-9a-fA-F]" src/components/ --include="*.jsx"
grep -rn "rgba(" src/components/ --include="*.jsx"
```

매핑 테이블 작성 후 일괄 치환:
| 하드코딩 값 | DS 토큰 |
|---|---|
| `"#222222"` | `c.text` |
| `"#757575"` | `c.textDim` |
| `"#E5E7EB"` | `c.border` |
| `"rgba(0,0,0,0.04)"` | `c.gridStroke` |
| `"rgba(0,0,0,0.15)"` | `c.shadow` |

### Phase 3: 레이아웃 토큰 (Day 4-5)

fontWeight → fw, lineHeight → lh 순서로 적용. 이 둘은:
- 토큰 수가 적고 (5개, 8개)
- 매핑이 1:1이며
- replace_all로 안전하게 일괄 치환 가능

```bash
# fontWeight 하드코딩 검색 (ESLint AST 기반이 더 정확)
grep -rn "fontWeight:[0-9]" src/ --include="*.jsx"
grep -rn "fontWeight: [0-9]" src/ --include="*.jsx"
```

### Phase 4: 스페이싱 & 라디우스 (Week 2)

가장 수량이 많고 주의가 필요한 단계.
- 단일 값(`gap:8`)부터 시작 → `gap:spacing.md`
- 컴파운드 값(`padding:"12px 16px"`)은 나중에 처리
- borderRadius 단일 값 치환

### Phase 5: 가드레일 설정 (Week 2 마무리)

ESLint + pre-commit hook 설정으로 새 raw 값 유입 차단.

### 점진적 적용 진행 추적

```markdown
## DS 토큰 마이그레이션 체크리스트

### 컬러 (목표: 100%)
- [x] App.jsx — 루트 배경/텍스트
- [x] Header.jsx — 네비게이션
- [ ] Dashboard.jsx — 차트 영역
- [ ] Modal.jsx — 오버레이

### fontWeight (목표: 100%)
- [x] 전체 일괄 치환 완료

### spacing (목표: 90%+)
- [x] gap 값 전체
- [x] margin/padding 단일 값
- [ ] 컴파운드 문자열 (선택)
```

---

## 5. 시나리오 C — Next.js / 프레임워크 환경

### Next.js App Router

```jsx
// app/layout.jsx
import { ThemeProvider } from "./providers/ThemeProvider";
import { fonts, tracking } from "@/styles/theme";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```jsx
// app/providers/ThemeProvider.jsx
"use client";
import { createContext, useContext } from "react";
import { useTheme } from "@/utils/useTheme";

const ThemeContext = createContext(null);
export const useDS = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={theme}>
      <div style={{
        minHeight: "100vh",
        background: theme.c.bgPrimary,
        color: theme.c.text,
        transition: "background 0.3s, color 0.3s",
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
```

**주의사항:**
- `useTheme`는 `localStorage`와 `window.matchMedia`를 사용하므로 **Client Component 전용**
- Server Component에서는 토큰 직접 import만 가능 (`fonts`, `spacing` 등 정적 값)
- SSR hydration mismatch 방지: 초기 렌더링 시 `data-theme` 속성으로 CSS 기반 전환 권장

### Remix / React Router v7

```jsx
// root.jsx
import { useTheme } from "./utils/useTheme";

export default function Root() {
  const { c } = useTheme();
  return (
    <html>
      <body style={{ background: c.bgPrimary, color: c.text }}>
        <Outlet />
      </body>
    </html>
  );
}
```

---

## 6. 시나리오 D — 비-React 환경 (Vue, Svelte, Vanilla)

Denyx DS 토큰은 순수 JS 객체이므로 프레임워크에 무관하게 사용 가능합니다.
다만 `useTheme.js` 훅은 React 전용이므로 각 프레임워크에 맞게 재구현이 필요합니다.

### CSS Custom Properties 변환 (범용)

프레임워크에 구애받지 않는 방법:

```js
// scripts/generate-css-tokens.js
const { getColors, fonts, typeScale, fontWeight, lineHeight, spacing, radius } = require("./src/styles/theme");

function generateCSS() {
  const light = getColors("light");
  const dark = getColors("dark");

  let css = `:root {\n`;

  // 컬러 토큰
  for (const [key, val] of Object.entries(light)) {
    css += `  --ds-${key}: ${val};\n`;
  }
  // 스페이싱 토큰
  for (const [key, val] of Object.entries(spacing)) {
    css += `  --ds-spacing-${key}: ${val}px;\n`;
  }
  // 라디우스 토큰
  for (const [key, val] of Object.entries(radius)) {
    css += `  --ds-radius-${key}: ${val}px;\n`;
  }
  // 폰트 웨이트
  for (const [key, val] of Object.entries(fontWeight)) {
    css += `  --ds-fw-${key}: ${val};\n`;
  }
  // 라인 하이트
  for (const [key, val] of Object.entries(lineHeight)) {
    css += `  --ds-lh-${key}: ${val};\n`;
  }

  css += `}\n\n`;
  css += `[data-theme="dark"] {\n`;
  for (const [key, val] of Object.entries(dark)) {
    css += `  --ds-${key}: ${val};\n`;
  }
  css += `}\n`;

  return css;
}

require("fs").writeFileSync("src/styles/tokens.css", generateCSS());
console.log("✅ tokens.css generated");
```

**출력 결과 (tokens.css):**
```css
:root {
  --ds-bgPrimary: #FFFFFF;
  --ds-text: #222222;
  --ds-accent: #296CF2;
  --ds-spacing-md: 8px;
  --ds-radius-lg: 8px;
  --ds-fw-bold: 700;
  --ds-lh-normal: 1.4;
  /* ... */
}

[data-theme="dark"] {
  --ds-bgPrimary: #0E1116;
  --ds-text: #E9EBEE;
  --ds-accent: #5A9AFF;
  /* ... */
}
```

### Vue 3 Composable

```js
// composables/useTheme.js
import { ref, computed, watchEffect } from "vue";
import { getColors } from "@/styles/theme";

const STORAGE_KEY = "app-theme";

function detectTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const mode = ref(detectTheme());

export function useTheme() {
  const c = computed(() => getColors(mode.value));

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, mode.value);
  }

  watchEffect(() => {
    document.documentElement.setAttribute("data-theme", mode.value);
  });

  return { mode, toggle, c };
}
```

### Svelte Store

```js
// stores/theme.js
import { writable, derived } from "svelte/store";
import { getColors } from "../styles/theme";

const STORAGE_KEY = "app-theme";

function detectTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const mode = writable(detectTheme());
export const c = derived(mode, ($mode) => getColors($mode));

mode.subscribe((m) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, m);
    document.documentElement.setAttribute("data-theme", m);
  }
});

export function toggle() {
  mode.update((m) => (m === "dark" ? "light" : "dark"));
}
```

### Vanilla JS

```js
// theme-manager.js
import { getColors } from "./styles/theme.js";

class ThemeManager {
  constructor() {
    this.mode = this.#detect();
    this.c = getColors(this.mode);
    this.#apply();
  }

  #detect() {
    const saved = localStorage.getItem("app-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  toggle() {
    this.mode = this.mode === "dark" ? "light" : "dark";
    this.c = getColors(this.mode);
    localStorage.setItem("app-theme", this.mode);
    this.#apply();
  }

  #apply() {
    document.documentElement.setAttribute("data-theme", this.mode);
    document.body.style.background = this.c.bgPrimary;
    document.body.style.color = this.c.text;
  }
}

export const theme = new ThemeManager();
```

---

## 7. 다크 모드 적용

### 7.1 핵심 원칙

```
1. 하드코딩 rgba(0,0,0,...) 절대 금지 → c.shadow, c.gridStroke 등 시맨틱 토큰 사용
2. 하드코딩 rgba(accent,...) 절대 금지 → c.accentBgSoft, c.accentBorder 등 사용
3. 차트 라이브러리(Recharts 등)의 stroke/fill도 반드시 토큰 연동
4. box-shadow는 항상 c.shadow 또는 c.shadowStrong 사용
5. CSS 애니메이션의 border-color/box-shadow도 토큰 인터폴레이션 필수
```

### 7.2 자주 실수하는 패턴

#### Bad: 하드코딩 그리드 (다크 모드에서 안 보임)
```jsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)"/>
```

#### Good: 토큰 기반 그리드
```jsx
<CartesianGrid strokeDasharray="3 3" stroke={c.gridStroke}/>
```

#### Bad: 하드코딩 오버레이
```jsx
<div style={{ background: "rgba(0,0,0,0.45)" }}>
```

#### Good: 시맨틱 오버레이
```jsx
<div style={{ background: c.bgOverlay }}>
```

#### Bad: 하드코딩 성공/경고 배경
```jsx
<div style={{ background: "rgba(0,180,66,0.04)" }}>
```

#### Good: 시맨틱 상태 배경
```jsx
<div style={{ background: c.successBgSoft }}>
```

### 7.3 다크 모드 컬러 토큰 매핑 가이드

| 용도 | Light 토큰 | Dark 토큰 | 설명 |
|---|---|---|---|
| 페이지 배경 | `c.bgPrimary` (#FFF) | `c.bgPrimary` (#0E1116) | 최하위 레이어 |
| 카드 배경 | `c.bgCard` (#F7F8FA) | `c.bgCard` (#181C22) | 한 단계 위 레이어 |
| 호버 배경 | `c.bgCardHover` (#EFF0F3) | `c.bgCardHover` (#1B2026) | 인터랙션 피드백 |
| 기본 텍스트 | `c.text` (#222) | `c.text` (#E9EBEE) | 본문 텍스트 |
| 보조 텍스트 | `c.textMuted` (#4C4C4C) | `c.textMuted` (#B7BDC6) | 설명, 라벨 |
| 비활성 텍스트 | `c.textDim` (#757575) | `c.textDim` (#8B929C) | 타임스탬프, 힌트 |
| 엑센트 | `c.accent` (#296CF2) | `c.accent` (#5A9AFF) | 다크에서 밝아짐 |
| 차트 그리드 | `c.gridStroke` (black 6%) | `c.gridStroke` (white 6%) | 방향 반전 |
| 그림자 | `c.shadow` (black 15%) | `c.shadow` (black 40%) | 다크에서 강화 |

### 7.4 다크 모드 QA 체크리스트

```
[ ] 모든 텍스트가 배경 대비 4.5:1 이상 (WCAG AA)
[ ] 차트 그리드라인이 보이는가
[ ] 툴팁 그림자가 자연스러운가
[ ] 성공/경고/위험 배경이 식별 가능한가
[ ] 오버레이(모달 뒤)가 충분히 어두운가
[ ] CSS 애니메이션(shimmer, glow)이 다크에서도 작동하는가
[ ] input focus 상태의 border/shadow가 보이는가
```

---

## 8. 가드레일 설정

### 8.1 ESLint 설정

```js
// .eslintrc.js (또는 eslint.config.js)
module.exports = {
  rules: {
    "no-restricted-syntax": [
      "warn",
      // fontWeight raw 값 차단
      {
        selector: "Property[key.name='fontWeight'][value.type='Literal'][value.value>=400]",
        message: "⚠️ DS 위반: fontWeight에 raw 숫자 사용 금지. fw.bold, fw.semibold 등 토큰을 사용하세요."
      },
      // borderRadius raw 값 차단
      {
        selector: "Property[key.name='borderRadius'][value.type='Literal'][value.raw=/^\\d+$/]",
        message: "⚠️ DS 위반: borderRadius에 raw 숫자 사용 금지. radius.lg 등 토큰을 사용하세요."
      },
      // fontFamily raw 문자열 차단
      {
        selector: "Property[key.name='fontFamily'][value.type='Literal']",
        message: "⚠️ DS 위반: fontFamily에 raw 문자열 사용 금지. fonts.primary 또는 fonts.numeric을 사용하세요."
      },
      // gap raw 값 차단
      {
        selector: "Property[key.name='gap'][value.type='Literal'][value.value>=2]",
        message: "⚠️ DS 위반: gap에 raw 숫자 사용 금지. spacing.md 등 토큰을 사용하세요."
      },
    ],
  },
};
```

### 8.2 Pre-commit Hook (Husky + lint-staged)

```bash
# 설치
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "src/**/*.jsx": [
      "eslint --fix --max-warnings 0"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
npx lint-staged
```

### 8.3 CI 파이프라인 연동

```yaml
# .github/workflows/ds-check.yml
name: DS Token Compliance
on: [pull_request]

jobs:
  ds-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx eslint src/ --ext .jsx --format compact
      - name: Check raw color values
        run: |
          VIOLATIONS=$(grep -rn "rgba(0,0,0" src/ --include="*.jsx" | grep -v "theme.js" | wc -l)
          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "❌ $VIOLATIONS개의 하드코딩 rgba(0,0,0,...) 발견"
            grep -rn "rgba(0,0,0" src/ --include="*.jsx" | grep -v "theme.js"
            exit 1
          fi
          echo "✅ 하드코딩 rgba 없음"
```

### 8.4 PR 리뷰 자동 코멘트 (선택)

```yaml
# .github/workflows/ds-review.yml
- name: DS Token Review
  uses: actions/github-script@v7
  with:
    script: |
      const { execSync } = require('child_process');
      const diff = execSync('git diff origin/main...HEAD -- "src/**/*.jsx"').toString();

      const violations = [];
      const lines = diff.split('\n');
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          if (/fontWeight:\s*\d/.test(line)) violations.push(`fontWeight raw: ${line.trim()}`);
          if (/rgba\(0,0,0/.test(line)) violations.push(`hardcoded rgba: ${line.trim()}`);
        }
      }

      if (violations.length > 0) {
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.issue.number,
          body: `### ⚠️ Denyx DS 토큰 위반 감지\n\n${violations.map(v => `- \`${v}\``).join('\n')}\n\n토큰 사용법: [DENYX-DS-ADOPTION-GUIDE.md](./docs/DENYX-DS-ADOPTION-GUIDE.md)`
        });
      }
```

---

## 9. 출시 전 체크리스트

### 기본 설정
```
[ ] theme.js 복사 완료
[ ] useTheme.js (또는 프레임워크별 동등 구현) 설정
[ ] 웹 폰트 로드 확인 (Noto Sans + Roboto)
[ ] 루트 컴포넌트에 bgPrimary + text + fontFamily 적용
[ ] 비즈니스 상수를 theme.js에서 분리
```

### 토큰 적용
```
[ ] 모든 컬러가 c.xxx 토큰 사용 (하드코딩 hex/rgba 없음)
[ ] fontWeight → fw.* 토큰 사용
[ ] lineHeight → lh.* 토큰 사용
[ ] borderRadius → radius.* 토큰 사용
[ ] gap → spacing.* 토큰 사용
[ ] fontFamily → fonts.* 토큰 사용
```

### 다크 모드
```
[ ] 라이트/다크 전환 정상 작동
[ ] localStorage 테마 저장 확인
[ ] system prefers-color-scheme 반영 확인
[ ] 모든 페이지에서 다크 모드 시각 확인
[ ] 차트/그래프 다크 모드 대응 확인
```

### 가드레일
```
[ ] ESLint no-restricted-syntax 룰 활성화
[ ] pre-commit hook 동작 확인
[ ] (선택) CI 파이프라인 DS 체크 추가
```

### 접근성
```
[ ] 텍스트-배경 대비 WCAG AA (4.5:1) 이상
[ ] 포커스 인디케이터 보임 (c.borderFocus)
[ ] 다크 모드에서도 색각이상 대응 확인
```

---

## 10. 트러블슈팅

### Q: `useTheme is not a function` 에러

**원인:** Server Component에서 호출 시도 (Next.js App Router)
**해결:** `"use client"` 지시어 추가 또는 Client Component로 감싸기

### Q: 다크 모드 전환 시 깜빡임 (FOUC)

**원인:** 초기 렌더링이 항상 light로 시작
**해결:**
```html
<!-- index.html <head>에 인라인 스크립트 추가 -->
<script>
  (function() {
    const saved = localStorage.getItem("app-theme");
    const mode = saved || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", mode);
    if (mode === "dark") document.documentElement.style.background = "#0E1116";
  })();
</script>
```

### Q: borderRadius:radius.lg 가 `NaN` 출력

**원인:** radius를 import하지 않고 사용, 또는 잘못된 키 접근
**확인:** `console.log(radius)` 로 객체 확인. 키에 따옴표 필요한 경우 `radius["2xl"]` 형태

### Q: spacing 값이 문자열 필요한 곳에서 숫자로 출력

**원인:** React inline style에서 padding 등은 숫자를 px로 자동 변환하지만, 
복합 값(`padding:"8px 16px"`)은 문자열이어야 함
**해결:** 
```jsx
// 단일 값 — 숫자 OK
padding: spacing["3xl"]  // → 16 → "16px"

// 복합 값 — 문자열 필수
padding: `${spacing.md}px ${spacing["3xl"]}px`  // → "8px 16px"
```

### Q: Figma의 토큰과 코드 토큰이 다름

**원인:** 수동 동기화로 인한 드리프트
**해결 (향후):** Figma Variables → `tokens.json` → `theme.js` 자동 생성 파이프라인 구축
**단기 해결:** 코드의 `theme.js`를 Single Source of Truth로 지정, Figma에서 수동 반영

### Q: 새 팀원이 raw 값을 사용

**해결:**
1. ESLint 경고가 에디터에서 즉시 표시
2. pre-commit hook이 커밋 차단
3. PR 자동 코멘트로 위반 안내
4. 이 가이드 문서를 온보딩 필독 자료로 지정

---

## 부록: 토큰 Quick Reference Card

```
┌─── 컬러 (useTheme → c) ─────────────────────────┐
│ 배경  c.bgPrimary  c.bgCard  c.bgCardHover       │
│ 텍스트 c.text  c.textMuted  c.textDim  c.textDark │
│ 엑센트 c.accent  c.accentBg  c.accentBorder       │
│ 상태  c.success  c.warning  c.danger  c.info      │
│ 알파  c.shadow  c.gridStroke  c.shimmer            │
│       c.accentBgSoft  c.successBgSoft  c.dangerBgSoft │
└──────────────────────────────────────────────────┘

┌─── 타이포 ───────────────────────────────────────┐
│ fonts.primary  "'Noto Sans', 'Noto Sans KR', ..."│
│ fonts.numeric  "Roboto, 'Noto Sans', ..."         │
│ fw.regular(400) .medium(500) .semibold(600)       │
│   .bold(700) .extrabold(800)                      │
│ lh.tight(1.2) .snug(1.3) .normal(1.4)            │
│   .relaxed(1.5) .loose(1.6) .spacious(1.7)       │
│   .airy(1.8)                                      │
│ tracking.display  .metric  .default  .caps        │
└──────────────────────────────────────────────────┘

┌─── 스페이싱 (px) ────────────────────────────────┐
│ 2xs(2) xs(4) sm(6) md(8) lg(10) xl(12)           │
│ 2xl(14) 3xl(16) 4xl(20) 5xl(24) 6xl(28) 7xl(32) │
└──────────────────────────────────────────────────┘

┌─── 라디우스 (px) ────────────────────────────────┐
│ xs(2) sm(4) md(6) lg(8) xl(10) 2xl(12)           │
│ 3xl(14) 4xl(16) 5xl(20) pill(50) full(9999)      │
└──────────────────────────────────────────────────┘

┌─── 타입 스케일 (px) ─────────────────────────────┐
│ chart(9) xs(10) sm(11) base(12) md(13) lg(14)    │
│ xl(16) 2xl(20) 3xl(24) 4xl(32) 5xl(48)           │
└──────────────────────────────────────────────────┘
```
