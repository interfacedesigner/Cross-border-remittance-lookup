# Firebase Service Account 설정 가이드

## 개요

GitHub Actions가 자동으로 Firebase에 배포하려면 Firebase Service Account 인증 정보가 필요합니다. 이 가이드는 Service Account JSON 키를 생성하고 GitHub Secrets에 등록하는 방법을 설명합니다.

---

## 1단계: Firebase Service Account 키 생성

### 1. Firebase Console 접속

https://console.firebase.google.com 접속

### 2. 프로젝트 선택

"cross-border-remittance-lookup" 프로젝트 선택

### 3. 프로젝트 설정으로 이동

1. 왼쪽 메뉴 상단의 **⚙️ 아이콘** (프로젝트 설정) 클릭
2. 또는 프로젝트 개요 옆 톱니바퀴 → **프로젝트 설정** 클릭

### 4. Service Accounts 탭으로 이동

1. 상단 탭에서 **Service accounts** 클릭
2. "Firebase Admin SDK" 섹션을 찾으세요

### 5. 새 비공개 키 생성

1. **"Generate new private key"** 버튼 클릭
2. 확인 대화상자에서 **"Generate key"** 클릭
3. JSON 파일이 자동으로 다운로드됩니다
   - 파일명 예: `cross-border-remittance-lookup-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

### 6. JSON 파일 내용 확인

다운로드된 JSON 파일을 텍스트 에디터로 열면 다음과 같은 구조입니다:

```json
{
  "type": "service_account",
  "project_id": "cross-border-remittance-lookup",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@cross-border-remittance-lookup.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

⚠️ **보안 주의사항:**
- 이 파일에는 민감한 인증 정보가 포함되어 있습니다
- 절대 Git에 커밋하거나 공개하지 마세요
- 사용 후 로컬에서 안전하게 삭제하세요

---

## 2단계: GitHub Secrets에 등록

### 1. GitHub 저장소 접속

https://github.com/[YOUR_USERNAME]/cross-border-remittance-lookup

### 2. Settings → Secrets 이동

1. 저장소 상단의 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Secrets and variables** 펼치기
3. **Actions** 클릭

### 3. 새 Secret 생성

1. **"New repository secret"** 버튼 클릭 (우측 상단)
2. 다음 정보 입력:

   **Name:**
   ```
   FIREBASE_SERVICE_ACCOUNT
   ```

   **Secret:**
   - 다운로드한 JSON 파일의 **전체 내용**을 복사하여 붙여넣기
   - 파일을 텍스트 에디터로 열고 Ctrl+A → Ctrl+C
   - GitHub Secret 입력창에 Ctrl+V

3. **"Add secret"** 버튼 클릭

### 4. Secret 등록 확인

- Secrets 목록에 `FIREBASE_SERVICE_ACCOUNT`가 표시되어야 합니다
- Secret 값은 보안상 `***` 으로 표시되며, 생성 후에는 볼 수 없습니다

---

## 3단계: 검증

### 로컬에서 Firebase 프로젝트 ID 확인

`.firebaserc` 파일을 열어 프로젝트 ID가 올바른지 확인:

```bash
cat .firebaserc
```

**예상 출력:**
```json
{
  "projects": {
    "default": "cross-border-remittance-lookup"
  }
}
```

프로젝트 ID가 다르면 수정:
```bash
firebase use cross-border-remittance-lookup
```

### GitHub Actions 워크플로우에서 사용 확인

`.github/workflows/update-remittance-data.yml` 파일에 다음이 포함되어 있는지 확인:

```yaml
- name: Deploy to Firebase
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: ${{ secrets.GITHUB_TOKEN }}
    firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
    projectId: cross-border-remittance-lookup
    channelId: live
```

---

## 4단계: 테스트

### 수동 워크플로우 실행

1. GitHub 저장소 → **Actions** 탭
2. 왼쪽에서 **"Update Remittance Data & Deploy"** 선택
3. 오른쪽 **"Run workflow"** 버튼 클릭
4. 드롭다운에서 브랜치 선택 (기본: main)
5. **"Run workflow"** 확인

### 실행 결과 확인

1. 워크플로우 실행이 시작됨 (노란 점 🟡)
2. 각 스텝 확인:
   - ✅ Checkout repository
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run data update script
   - ✅ Check for data changes
   - ✅ Commit updated data (변경사항 있을 경우)
   - ✅ Build application
   - ✅ **Deploy to Firebase** ← 여기서 Secret 사용
3. 전체 성공 시 녹색 체크 ✅
4. 실패 시 빨간 X ❌ (로그에서 에러 확인)

### Firebase Console에서 배포 확인

1. https://console.firebase.google.com
2. "cross-border-remittance-lookup" 프로젝트 선택
3. 왼쪽 메뉴 → **Hosting**
4. 배포 이력에서 최신 배포 확인:
   - 배포 시간
   - 배포 상태 (Live)
   - 배포 소스 (github-actions[bot])

---

## 문제 해결

### "Error: Authentication failed"

**원인:** Secret이 올바르게 등록되지 않았거나 JSON 형식 오류

**해결방법:**
1. GitHub Secrets에서 `FIREBASE_SERVICE_ACCOUNT` 삭제
2. Firebase Console에서 새 Service Account 키 생성
3. **전체 JSON 파일 내용**을 정확히 복사하여 다시 등록
4. JSON 파일에 여분의 공백이나 줄바꿈이 없는지 확인

### "Error: Project not found"

**원인:** 프로젝트 ID 불일치

**해결방법:**
1. `.firebaserc` 파일 확인
2. Firebase Console에서 프로젝트 ID 재확인:
   - 프로젝트 설정 → 일반 → 프로젝트 ID
3. 워크플로우 파일의 `projectId` 확인

### "Error: Permission denied"

**원인:** Service Account에 Hosting 권한이 없음

**해결방법:**
1. Firebase Console → 프로젝트 설정 → Service accounts
2. Service Account 이메일 확인
3. Google Cloud Console → IAM & Admin → IAM
4. 해당 Service Account에 "Firebase Hosting Admin" 역할 추가

### "Secret is missing or invalid"

**원인:** Secret 이름 오타 또는 등록 누락

**해결방법:**
1. GitHub 저장소 → Settings → Secrets → Actions
2. Secret 이름이 정확히 `FIREBASE_SERVICE_ACCOUNT` 인지 확인 (대소문자 구분)
3. 워크플로우 파일에서 `${{ secrets.FIREBASE_SERVICE_ACCOUNT }}` 사용 확인

---

## 보안 모범 사례

### ✅ 해야 할 것

1. **Service Account JSON 파일 보안 관리**
   - 사용 후 로컬에서 안전하게 삭제
   - 절대 Git 저장소에 커밋하지 않기
   - `.gitignore`에 `*-firebase-adminsdk-*.json` 추가

2. **최소 권한 원칙**
   - Service Account에 필요한 최소 권한만 부여
   - 현재 필요한 권한: Firebase Hosting Admin

3. **정기적인 키 로테이션**
   - 6-12개월마다 새 Service Account 키 생성
   - 기존 키 삭제

4. **GitHub Secret 관리**
   - Repository Secrets 사용 (Environment Secrets는 불필요)
   - Secret 값은 생성 후 다시 볼 수 없으므로 필요 시 재생성

### ❌ 하지 말아야 할 것

1. Service Account JSON을 Git에 커밋
2. Secret을 코드에 하드코딩
3. Secret을 로그에 출력
4. Service Account 키를 여러 프로젝트에서 공유
5. 만료되거나 사용하지 않는 Service Account 방치

---

## Service Account 키 갱신

### 언제 갱신해야 하나요?

- 키가 유출되었거나 의심되는 경우 (즉시)
- 정기 보안 정책 (6-12개월마다)
- 권한 에러가 지속되는 경우

### 갱신 절차

1. **새 키 생성**
   - Firebase Console → Service accounts
   - "Generate new private key" 클릭
   - 새 JSON 파일 다운로드

2. **GitHub Secret 업데이트**
   - GitHub → Settings → Secrets → Actions
   - `FIREBASE_SERVICE_ACCOUNT` 옆 **"Update"** 클릭
   - 새 JSON 파일 내용으로 교체

3. **워크플로우 테스트**
   - Actions → "Run workflow"로 수동 실행
   - 배포 성공 확인

4. **기존 키 삭제**
   - Firebase Console → Service accounts
   - "Manage service account permissions" 클릭
   - Google Cloud Console에서 기존 키 삭제

---

## 추가 리소스

### Firebase 문서
- Service Accounts: https://firebase.google.com/docs/admin/setup#initialize-sdk
- Hosting 배포: https://firebase.google.com/docs/hosting/github-integration

### GitHub Actions 문서
- Encrypted secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Firebase action: https://github.com/FirebaseExtended/action-hosting-deploy

### 관련 문서
- `AUTOMATION.md` - 자동화 시스템 전체 가이드
- `.github/workflows/update-remittance-data.yml` - 워크플로우 설정
- `.firebaserc` - Firebase 프로젝트 설정

---

## 체크리스트

배포 전 확인사항:

- [ ] Firebase Service Account JSON 키 생성 완료
- [ ] GitHub Secret `FIREBASE_SERVICE_ACCOUNT` 등록 완료
- [ ] `.firebaserc`의 프로젝트 ID 확인 (`cross-border-remittance-lookup`)
- [ ] 워크플로우 파일에 `projectId` 올바르게 설정
- [ ] 수동 워크플로우 실행으로 배포 성공 확인
- [ ] 로컬의 Service Account JSON 파일 안전하게 삭제

배포 후 확인사항:

- [ ] Firebase Console에서 배포 이력 확인
- [ ] 사이트에서 최신 데이터 표시 확인
- [ ] GitHub Actions에서 녹색 체크 확인
- [ ] 다음 스케줄 실행 대기 (화요일 또는 금요일)

---

## 문의

Firebase 배포 관련 문제가 있으시면 GitHub Issue를 생성해주세요.
