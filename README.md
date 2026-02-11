# 해외송금 공정 비교기 v7 — 완전 무료 자동화

## 아키텍처

```
GitHub Actions (cron 화/금 09:00 KST)
  │
  ├─ open.er-api.com → 실시간 중간환율 (무료, API키 불필요)
  ├─ Wise Comparison API → Wise/PayPal 등 수수료+환율 (무료, 인증 불필요)
  └─ fixed-fees.json → 한국 서비스 수수료 (수동 관리, 월 1~2회)
  │
  ▼
  fee-data.json 자동 생성 → git commit → Firebase 배포
```

## 🤖 자동 업데이트

- **일정**: 매주 화요일 & 금요일 오전 9시 (KST)
- **프로세스**: 데이터 수집 → 빌드 → 배포 (완전 자동)
- **비용**: ₩0 (GitHub Actions 무료 티어)
- **모니터링**:
  - GitHub Actions 탭에서 실행 이력 확인
  - 실패 시 자동으로 GitHub Issue 생성
- **수동 실행**: Actions → "Update Remittance Data & Deploy" → "Run workflow"
- **상세 가이드**: [AUTOMATION.md](AUTOMATION.md) 참고

## 📱 PWA (Progressive Web App)

- **홈 화면 추가**: Android/iOS에서 앱처럼 설치 가능
- **전체 화면 실행**: 브라우저 UI 없이 네이티브 앱처럼 사용
- **자동 업데이트**: 화/금 자동 업데이트 즉시 반영
- **오프라인 작동**: 네트워크 없어도 기본 기능 사용 가능
- **빠른 로딩**: Service Worker 캐싱
- **비용**: ₩0 (앱 스토어 수수료 없음)
- **상세 가이드**: [PWA_SETUP_GUIDE.md](PWA_SETUP_GUIDE.md) 참고

## 월 운영비: $0

| 항목 | 비용 |
|---|---|
| GitHub Actions cron | 무료 (2,000분/월) |
| open.er-api.com | 무료 (API키 불필요) |
| Wise Comparison API | 무료 (인증 불필요) |
| Firebase Hosting | 무료 (Spark Plan) |
| **합계** | **$0** |

## 데이터 소스

| 항목 | 소스 | 자동? | 갱신주기 |
|---|---|---|---|
| 중간환율 (8통화) | open.er-api.com | ✅ 자동 | 주 2회 (화/금) |
| Wise 수수료/환율 | Wise API v4 | ✅ 자동 | 주 2회 (화/금) |
| PayPal 수수료/환율 | Wise Comparison API | ✅ 자동 | 주 2회 (화/금) |
| SentBe, MOIN, 토스, WireBarley | fixed-fees.json | ⚠️ 수동 | 월 1~2회 |
| 하나은행, 신한은행 | fixed-fees.json | ⚠️ 수동 | 월 1~2회 |

## 수동 업데이트 (한국 서비스 수수료)

`scripts/fixed-fees.json` 을 편집 후 `git push`:

```bash
# 수수료 변경 확인 후
vi scripts/fixed-fees.json
git add scripts/fixed-fees.json
git commit -m "update: korean service fees"
git push
```

## 설정

```bash
npm install
npm run build
firebase deploy
```

GitHub Secrets 필요: `FIREBASE_SERVICE_ACCOUNT`
(Anthropic API키 불필요!)
