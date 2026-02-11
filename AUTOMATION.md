# 🤖 자동화 시스템 가이드

## 개요

해외송금 비교 서비스는 **주 2회 자동으로 환율 및 수수료 데이터를 업데이트**합니다.
- **일정**: 매주 화요일 & 금요일 오전 9시 (KST)
- **비용**: 완전 무료 (GitHub Actions 무료 티어 사용)
- **자동화**: 100% 자동 - 수동 개입 불필요

---

## 자동화 일정

### 정기 업데이트
- **요일**: 화요일, 금요일
- **시간**: 오전 9:00 (KST) = 00:00 (UTC)
- **Cron**: `0 0 * * 2,5`

### 업데이트 프로세스
```
1. 환율 데이터 수집 (open.er-api.com)
2. 서비스 수수료 수집 (Wise API + 고정 데이터)
3. fee-data.json 파일 업데이트
4. Git commit & push
5. 빌드 (npm run build)
6. Firebase Hosting 배포
```

---

## 수동 업데이트 방법

긴급하게 데이터를 업데이트해야 할 경우:

### GitHub 웹 인터페이스
1. GitHub 저장소 접속
2. **Actions** 탭 클릭
3. 왼쪽에서 **"Update Remittance Data & Deploy"** 선택
4. 오른쪽 **"Run workflow"** 버튼 클릭
5. "Run workflow" 확인

### 로컬에서 직접 실행
```bash
# 1. 데이터 업데이트
node scripts/update-fees.mjs

# 2. 변경사항 확인
git diff public/fee-data.json

# 3. 커밋 & 푸시
git add public/fee-data.json
git commit -m "chore: manual data update"
git push

# 4. 빌드 & 배포
npm run build
firebase deploy
```

---

## 실행 이력 확인

### GitHub Actions 대시보드
1. GitHub 저장소 → **Actions** 탭
2. 최근 실행 목록 확인:
   - ✅ 녹색 체크: 성공
   - ❌ 빨간 X: 실패
   - 🟡 노란 점: 실행 중

### 커밋 이력
1. GitHub 저장소 → **Commits** 탭
2. "chore: update remittance data" 커밋 검색
3. 커밋 상세 정보 확인

### Firebase 콘솔
1. https://console.firebase.google.com 접속
2. 프로젝트: `cross-border-remittance-lookup`
3. **Hosting** → 배포 이력 확인

---

## 데이터 소스

### 1. 환율 데이터
- **API**: open.er-api.com/v6/latest/KRW
- **비용**: 무료 (API 키 불필요)
- **업데이트**: 매일
- **통화**: USD, JPY, EUR, GBP, CNY, AUD, CAD, SGD

### 2. 서비스 수수료 - 해외 서비스
- **API**: Wise Comparison API
- **비용**: 무료 (인증 불필요)
- **서비스**: Wise, SentBe 등
- **데이터**: 수수료, 스프레드, 예상 도착 시간

### 3. 서비스 수수료 - 한국 서비스
- **파일**: `/scripts/fixed-fees.json`
- **업데이트**: 수동 (월 1~2회)
- **서비스**: MOIN, 토스, WireBarley, 하나은행, 신한은행, PayPal

---

## 업데이트 결과 확인

### 사이트에서 직접 확인
1. https://cross-border-remittance-lookup.web.app 접속
2. "실시간 비교" 버튼 클릭
3. 최신 환율 및 수수료 확인
4. 하단에 업데이트 시간 표시 확인

### fee-data.json 파일 확인
1. GitHub → `/public/fee-data.json` 파일 열기
2. 파일 상단 `updatedAt` 필드 확인
3. `stats` 필드에서 업데이트 성공 여부 확인

---

## 에러 처리

### 자동 복구
다음 상황에서는 자동으로 복구됩니다:
- ✅ **API 일시 실패**: 기존 데이터 유지, 다음 스케줄에 재시도
- ✅ **일부 통화 실패**: 성공한 통화만 업데이트
- ✅ **변경사항 없음**: 배포 건너뛰기, 정상 종료

### 알림 시스템
**실패 시 자동 알림:**
- GitHub Issue 자동 생성
- 제목: "⚠️ Automated Data Update Failed"
- 레이블: `automation`, `bug`
- 내용: 실패 시간, 로그 링크, 일반적인 원인

### 문제 해결

#### 1. API Rate Limit 초과
**증상**: 특정 통화 업데이트 실패
**해결**: 다음 스케줄까지 대기 (자동 복구)

#### 2. Firebase 배포 실패
**증상**: 워크플로우 실패, Issue 생성됨
**해결 방법**:
1. GitHub 저장소 → Settings → Secrets
2. `FIREBASE_SERVICE_ACCOUNT` 값 확인
3. 만료된 경우 Firebase Console에서 새 키 생성

#### 3. Git Push 실패
**증상**: "커밋 & 푸시" 단계 실패
**해결 방법**:
1. GitHub 저장소 → Settings → Actions → General
2. "Workflow permissions" → "Read and write permissions" 선택
3. 저장 후 워크플로우 재실행

#### 4. 빌드 실패
**증상**: "Build application" 단계 실패
**해결 방법**:
```bash
# 로컬에서 테스트
npm install
npm run build

# 에러 확인 후 수정
git commit -am "fix: build error"
git push
```

---

## 워크플로우 비활성화

긴급하게 자동 업데이트를 중단해야 할 경우:

### 임시 비활성화
1. GitHub → `.github/workflows/update-remittance-data.yml` 파일 수정
2. `schedule:` 섹션 주석 처리:
   ```yaml
   # schedule:
   #   - cron: '0 0 * * 2,5'
   ```
3. 커밋 & 푸시

### 완전 비활성화
1. GitHub → Actions → Workflows
2. "Update Remittance Data & Deploy" 선택
3. 오른쪽 "..." 메뉴 → "Disable workflow"

---

## 보안

### GitHub Secrets
민감한 정보는 GitHub Secrets에 암호화 저장:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase 배포 인증 정보
- `GITHUB_TOKEN`: 자동 생성 (커밋/Issue 생성 권한)

### 권한 최소화
워크플로우는 필요한 최소 권한만 사용:
- `contents: write` - 파일 커밋 권한
- `issues: write` - 에러 Issue 생성 권한

### 감사 추적
모든 변경사항은 Git 이력에 기록:
- 누가 (github-actions[bot])
- 언제 (커밋 시간)
- 무엇을 (fee-data.json 변경 내용)

---

## 비용

### GitHub Actions
- **무료 티어**: 2,000분/월
- **사용량**: ~5분/회 × 8회/월 = 40분/월
- **비용**: ₩0

### Firebase Hosting
- **무료 티어**: 10GB 저장소, 360MB/일 대역폭
- **사용량**: ~5MB 저장소
- **비용**: ₩0

### API 호출
- **open.er-api.com**: 무료, 무제한
- **Wise API**: 무료, 무제한
- **비용**: ₩0

**총 비용: ₩0/월**

---

## FAQ

### Q: 업데이트가 실행되지 않았어요
A: GitHub Actions 탭에서 실행 이력을 확인하세요. 데이터에 변경사항이 없으면 배포가 건너뛰어집니다.

### Q: 수동으로 업데이트하고 싶어요
A: GitHub Actions → "Update Remittance Data & Deploy" → "Run workflow" 버튼을 클릭하세요.

### Q: 업데이트 일정을 변경하고 싶어요
A: `.github/workflows/update-remittance-data.yml` 파일의 cron 표현식을 수정하세요.
- 예: 매일 오전 9시 → `0 0 * * *`
- 예: 주 3회 (월/수/금) → `0 0 * * 1,3,5`

### Q: Firebase 인증 에러가 발생해요
A: `FIREBASE_SERVICE_ACCOUNT` Secret을 다시 설정하세요. 자세한 내용은 `FIREBASE_SETUP_GUIDE.md` 참고.

### Q: 특정 통화만 업데이트 실패해요
A: 일부 통화 실패는 정상입니다. 다음 스케줄에 자동 재시도됩니다. 지속적으로 실패하면 Issue가 생성됩니다.

---

## 관련 문서

- `FIREBASE_SETUP_GUIDE.md` - Firebase Service Account 설정 가이드
- `scripts/update-fees.mjs` - 데이터 업데이트 스크립트
- `scripts/fixed-fees.json` - 한국 서비스 고정 수수료
- `.github/workflows/update-remittance-data.yml` - 워크플로우 설정

---

## 문의

기술적 문제나 개선 제안이 있으시면 GitHub Issue를 생성해주세요.
