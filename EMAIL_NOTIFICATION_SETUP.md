# 📧 GitHub Actions 이메일 알림 설정 가이드

## 개요

GitHub Actions가 실행될 때마다 **the@designer-kyungho.com**으로 자동 이메일을 발송합니다.

---

## ✅ 자동 이메일 발송 시점

### 1. 성공 알림 (✅)
**발송 조건:** 데이터 업데이트가 성공적으로 완료되었을 때
- 매주 화요일, 금요일 오전 9시 자동 업데이트 후
- 수동 실행(workflow_dispatch) 후

**이메일 내용:**
```
제목: ✅ 해외송금 비교 - 데이터 업데이트 완료

내용:
- 업데이트 일시
- 커밋 정보
- 라이브 사이트 링크
- GitHub 저장소 링크
- Workflow 로그 링크
```

### 2. 실패 알림 (⚠️)
**발송 조건:** 업데이트 실패 시
- API 호출 실패
- 빌드 에러
- Firebase 배포 실패

**이메일 내용:**
```
제목: ⚠️ 해외송금 비교 - 업데이트 실패 알림

내용:
- 실패 일시
- 커밋 정보
- Workflow 로그 링크
- 자동 생성된 GitHub Issue 링크
- 가능한 원인 리스트
```

---

## 🔐 필수 설정: GitHub Secrets

이메일을 발송하려면 Gmail 계정 정보를 GitHub Secrets에 등록해야 합니다.

### 1단계: Gmail 앱 비밀번호 생성

#### Option A: Gmail 계정 사용 (추천)

1. **Google 계정으로 이동**
   - https://myaccount.google.com/ 접속

2. **보안** 탭 클릭

3. **2단계 인증** 활성화
   - 아직 활성화 안 되어 있다면 먼저 활성화
   - 휴대폰 번호 등록 필요

4. **앱 비밀번호 생성**
   - https://myaccount.google.com/apppasswords 접속
   - 앱 선택: "메일"
   - 기기 선택: "기타(맞춤 이름)" → "GitHub Actions" 입력
   - **생성** 클릭
   - ⚠️ **16자리 비밀번호 복사** (다시 볼 수 없습니다!)
   - 예: `abcd efgh ijkl mnop`

#### Option B: 다른 이메일 서비스 사용

**Naver 메일**
```
server_address: smtp.naver.com
server_port: 587
```

**Daum 메일**
```
server_address: smtp.daum.net
server_port: 587
```

**Outlook/Hotmail**
```
server_address: smtp-mail.outlook.com
server_port: 587
```

### 2단계: GitHub Secrets 등록

1. **GitHub 저장소 접속**
   - https://github.com/interfacedesigner/Cross-border-remittance-lookup

2. **Settings 탭** 클릭

3. **좌측 메뉴 → Secrets and variables → Actions** 클릭

4. **New repository secret** 클릭

5. **첫 번째 Secret 추가**
   - Name: `EMAIL_USERNAME`
   - Value: 발송용 Gmail 주소 (예: `your-email@gmail.com`)
   - **Add secret** 클릭

6. **두 번째 Secret 추가**
   - **New repository secret** 클릭
   - Name: `EMAIL_PASSWORD`
   - Value: 1단계에서 생성한 앱 비밀번호 (예: `abcd efgh ijkl mnop`)
   - ⚠️ **공백 포함해서 그대로 복사**
   - **Add secret** 클릭

---

## 🧪 테스트 방법

Secrets 설정이 완료되면 바로 테스트할 수 있습니다.

### 수동 실행으로 테스트

1. **GitHub Actions 탭** 접속
   - https://github.com/interfacedesigner/Cross-border-remittance-lookup/actions

2. 좌측에서 **"Update Remittance Data & Deploy"** 선택

3. 오른쪽 **"Run workflow"** 버튼 클릭

4. **"Run workflow"** 확인

5. **결과 확인**
   - 약 1-2분 후 워크플로우 완료
   - the@designer-kyungho.com으로 이메일 도착 확인
   - ✅ 성공 시: "데이터 업데이트 완료" 이메일
   - ⚠️ 실패 시: "업데이트 실패 알림" 이메일

---

## 📋 이메일 템플릿 예시

### ✅ 성공 이메일

```
From: Cross-border Remittance Lookup <noreply@github.com>
To: the@designer-kyungho.com
Subject: ✅ 해외송금 비교 - 데이터 업데이트 완료

안녕하세요,

해외송금 수수료 비교 서비스의 데이터가 성공적으로 업데이트되었습니다.

📊 업데이트 정보
- 일시: 2026-02-12T00:00:00Z
- 트리거: schedule
- 커밋: 2a8be646b0866129c0fa20140bf16d9930b92e18

🌐 라이브 사이트
https://cross-border-remittance-lookup.web.app

📈 GitHub Repository
https://github.com/interfacedesigner/Cross-border-remittance-lookup

🔍 Workflow 실행 로그
https://github.com/interfacedesigner/Cross-border-remittance-lookup/actions/runs/123456789

---
이 이메일은 GitHub Actions에서 자동으로 발송되었습니다.
```

### ⚠️ 실패 이메일

```
From: Cross-border Remittance Lookup <noreply@github.com>
To: the@designer-kyungho.com
Subject: ⚠️ 해외송금 비교 - 업데이트 실패 알림

경고: 데이터 업데이트가 실패했습니다.

⚠️ 실패 정보
- 일시: 2026-02-12T00:00:00Z
- 트리거: schedule
- 커밋: 2a8be646b0866129c0fa20140bf16d9930b92e18

🔍 Workflow 실행 로그
https://github.com/interfacedesigner/Cross-border-remittance-lookup/actions/runs/123456789

📋 자동 생성된 Issue
https://github.com/interfacedesigner/Cross-border-remittance-lookup/issues

가능한 원인:
- API rate limiting
- 네트워크 연결 문제
- Firebase 인증 실패
- 빌드 에러

빠른 시일 내에 확인 부탁드립니다.

---
이 이메일은 GitHub Actions에서 자동으로 발송되었습니다.
```

---

## 🔧 커스터마이징

### 받는 사람 변경

`.github/workflows/update-remittance-data.yml` 파일에서:

```yaml
to: the@designer-kyungho.com
```

→ 원하는 이메일로 변경

### 여러 명에게 발송

```yaml
to: the@designer-kyungho.com,other@example.com,another@example.com
```

→ 쉼표로 구분하여 여러 이메일 추가

### 이메일 제목 변경

```yaml
subject: '✅ [프로젝트명] - 데이터 업데이트 완료'
```

→ 원하는 제목으로 변경

### 발송자 이름 변경

```yaml
from: Cross-border Remittance Lookup <noreply@github.com>
```

→ 원하는 이름으로 변경

---

## 🐛 문제 해결

### 이메일이 안 옴

#### 1. Secrets 확인
- `EMAIL_USERNAME`: Gmail 주소 정확한지 확인
- `EMAIL_PASSWORD`: 앱 비밀번호 정확한지 확인 (일반 비밀번호 아님!)

#### 2. Gmail 앱 비밀번호 재생성
- 기존 앱 비밀번호 삭제
- 새로 생성
- GitHub Secrets 업데이트

#### 3. 스팸 폴더 확인
- the@designer-kyungho.com 계정의 스팸 폴더 확인
- noreply@github.com을 안전한 발신자로 등록

#### 4. Workflow 로그 확인
- GitHub Actions 탭 → 실행된 workflow 클릭
- "Send email notification" 단계 확인
- 에러 메시지 확인

### 흔한 에러

**Error: Invalid login**
- 앱 비밀번호가 잘못되었거나 만료됨
- 2단계 인증이 비활성화됨
- 해결: 앱 비밀번호 재생성

**Error: Connection timeout**
- SMTP 포트 차단
- 해결: 다른 네트워크에서 시도 또는 포트 변경 (465)

**Error: Recipient address rejected**
- 받는 사람 이메일 주소 오타
- 해결: 이메일 주소 확인

---

## 📊 비용

**완전 무료!**
- GitHub Actions: 무료 티어 (2,000분/월)
- Gmail SMTP: 무료 (하루 500통 제한)
- 현재 사용량: 주 2회 = 월 8통

---

## 🔒 보안

### Secrets 보호
- ✅ GitHub Secrets는 암호화되어 저장
- ✅ Workflow 로그에 절대 노출 안 됨
- ✅ 앱 비밀번호 사용 (계정 비밀번호 아님)

### 권장 사항
- 🔐 Gmail 2단계 인증 활성화
- 🔐 앱 비밀번호 정기 갱신 (6개월마다)
- 🔐 프로젝트 전용 Gmail 계정 사용 (선택사항)

---

## ✅ 설정 완료 체크리스트

- [ ] Gmail 2단계 인증 활성화
- [ ] Gmail 앱 비밀번호 생성
- [ ] GitHub Secrets에 `EMAIL_USERNAME` 등록
- [ ] GitHub Secrets에 `EMAIL_PASSWORD` 등록
- [ ] 수동 실행으로 테스트
- [ ] 이메일 수신 확인
- [ ] 스팸 폴더 확인 및 안전한 발신자 등록

---

## 📞 추가 지원

### GitHub Actions 문서
- https://docs.github.com/en/actions

### 이메일 Action 문서
- https://github.com/dawidd6/action-send-mail

### Gmail 앱 비밀번호
- https://support.google.com/accounts/answer/185833

---

## 🎉 마무리

설정이 완료되면:
- ✅ 매주 화/금 오전 9시 자동 업데이트 후 이메일 수신
- ✅ 실패 시 즉시 알림 이메일 수신
- ✅ 완전 자동화된 모니터링 시스템 완성!

**축하합니다! 🚀**

---

**문서 버전**: 1.0
**최종 업데이트**: 2026-02-12
**작성자**: Claude (Anthropic)
