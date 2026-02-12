# 📧 IFTTT를 이용한 초간단 이메일 알림 설정

## 🎯 개요

**IFTTT** (If This Then That) 무료 서비스를 사용하여 GitHub Actions → 이메일 알림을 설정합니다.

**장점:**
- ✅ Gmail 앱 비밀번호 불필요
- ✅ 완전 무료
- ✅ 5분 안에 설정 완료
- ✅ 클릭만으로 간편 설정

---

## 🚀 초간단 설정 (5분!)

### 1단계: IFTTT 가입 (1분)

1. **IFTTT 웹사이트 접속**
   - https://ifttt.com/ 접속

2. **가입하기**
   - "Get started" 클릭
   - Google 계정으로 로그인 (추천)
   - 또는 이메일로 가입

3. **무료 플랜 선택**
   - "Start for free" 클릭
   - 무료 플랜은 최대 2개 Applet 사용 가능 (우리는 2개만 필요!)

---

### 2단계: 성공 알림 Applet 만들기 (2분)

#### Step 1: Applet 생성

1. **Create 버튼 클릭**
   - 우측 상단 또는 https://ifttt.com/create 접속

2. **"If This" 설정**
   - "Add" 버튼 클릭
   - 검색창에 "Webhooks" 입력
   - "Webhooks" 서비스 선택
   - "Receive a web request" 선택
   - Event Name: `remittance_update_success` 입력
   - "Create trigger" 클릭

3. **"Then That" 설정**
   - "Add" 버튼 클릭
   - 검색창에 "Email" 입력
   - "Email" 서비스 선택
   - "Send me an email" 선택

4. **이메일 내용 작성**
   ```
   Subject: ✅ 해외송금 비교 - 데이터 업데이트 완료

   Body:
   안녕하세요,

   해외송금 수수료 비교 서비스의 데이터가 성공적으로 업데이트되었습니다.

   📊 상태: {{Value1}}
   🌐 라이브 사이트: {{Value2}}
   🔍 로그: {{Value3}}

   자동으로 발송된 이메일입니다.
   ```

5. **"Create action" 클릭**

6. **"Continue" 클릭**

7. **"Finish" 클릭**

✅ 첫 번째 Applet 완성!

---

### 3단계: 실패 알림 Applet 만들기 (2분)

위의 2단계를 한 번 더 반복하되, 다음만 다르게 설정:

**"If This" 설정:**
- Event Name: `remittance_update_failure` (다른 이름!)

**이메일 내용:**
```
Subject: ⚠️ 해외송금 비교 - 업데이트 실패 알림

Body:
경고: 데이터 업데이트가 실패했습니다.

⚠️ 상태: {{Value1}}
🔍 로그: {{Value2}}
📋 메모: {{Value3}}

빠른 확인 부탁드립니다.
```

✅ 두 번째 Applet 완성!

---

### 4단계: Webhook Key 가져오기 (30초)

1. **IFTTT Webhooks 설정 페이지 접속**
   - https://ifttt.com/maker_webhooks 접속
   - 또는: IFTTT 홈 → 우측 상단 프로필 → "My services" → "Webhooks" 클릭

2. **"Documentation" 버튼 클릭**

3. **Key 복사**
   - 페이지 상단에 "Your key is: XXXXXXXXXXXX" 표시
   - 이 키를 복사 (예: `dA1b2C3d4E5f6G7h8I9j0`)

---

### 5단계: GitHub에 Key 등록 (1분)

1. **GitHub Secrets 페이지 접속**
   - https://github.com/interfacedesigner/Cross-border-remittance-lookup/settings/secrets/actions

2. **New repository secret 클릭**

3. **Secret 추가**
   - Name: `IFTTT_WEBHOOK_KEY`
   - Value: 위에서 복사한 Key (예: `dA1b2C3d4E5f6G7h8I9j0`)
   - "Add secret" 클릭

---

## 🧪 테스트

### 수동 테스트

1. **GitHub Actions 실행**
   - https://github.com/interfacedesigner/Cross-border-remittance-lookup/actions
   - "Update Remittance Data & Deploy" 클릭
   - "Run workflow" 클릭

2. **이메일 확인**
   - 약 1-2분 후 IFTTT 가입 시 사용한 이메일로 알림 도착
   - 제목: "✅ 해외송금 비교 - 데이터 업데이트 완료"

3. **스팸 폴더 확인**
   - 첫 이메일은 스팸 폴더로 갈 수 있음
   - "안전한 발신자" 등록

---

## 📧 받는 이메일 주소 변경

IFTTT 계정과 다른 이메일로 받고 싶다면:

1. **IFTTT 설정 변경**
   - 각 Applet 열기
   - "Then That" 단계의 "Email" 클릭
   - "Settings" 클릭
   - 이메일 주소 변경

---

## 🎨 이메일 커스터마이징

### 제목 변경
```
Subject: [프로젝트명] - 업데이트 완료 ✅
```

### 본문 변경
```
Body:
프로젝트: 해외송금 비교
상태: {{Value1}}
링크: {{Value2}}

더 자세한 내용은 {{Value3}}에서 확인하세요.
```

### 변수 설명
- `{{Value1}}`: 상태 메시지
- `{{Value2}}`: 라이브 사이트 URL
- `{{Value3}}`: Workflow 로그 URL

---

## 🔧 고급 기능

### 여러 명에게 발송

**Option 1: IFTTT Filter Code (Pro 플랜 필요)**
- 유료 플랜에서만 가능

**Option 2: 여러 Applet 만들기**
- 같은 Event Name으로 여러 개 만들기
- 각각 다른 이메일 주소 설정
- 무료 플랜: 최대 2개

**Option 3: Slack/Discord로도 알림**
- "Then That"에서 "Email" 대신 "Slack" 또는 "Discord" 선택
- 팀 전체에게 알림 가능

---

## 🐛 문제 해결

### 이메일이 안 옴

#### 1. Applet 활성화 확인
- IFTTT → My Applets 확인
- Applet이 "Connected" 상태인지 확인
- 비활성화되었다면 "Turn on" 클릭

#### 2. Webhook Key 확인
- GitHub Secrets의 `IFTTT_WEBHOOK_KEY`가 정확한지 확인
- IFTTT Webhooks 페이지에서 Key 재확인

#### 3. Event Name 확인
- Applet의 Event Name: `remittance_update_success`
- GitHub Actions의 Event Name: `remittance_update_success`
- 대소문자, 철자 정확히 일치해야 함

#### 4. Workflow 로그 확인
- GitHub Actions 실행 로그 확인
- "Send success notification via webhook" 단계 확인
- 에러 메시지가 있는지 확인

#### 5. IFTTT Activity 확인
- IFTTT → My Applets → Applet 클릭 → "View activity"
- Webhook이 실제로 수신되었는지 확인

### 스팸 폴더에 들어감

1. **안전한 발신자 등록**
   - IFTTT 이메일 주소: `action@ifttt.com`
   - 이메일 주소록에 추가

2. **"스팸 아님" 표시**
   - 첫 이메일에 "스팸 아님" 클릭

---

## 💰 비용

**완전 무료!**
- IFTTT 무료 플랜: 2개 Applet (성공/실패 알림)
- 이메일 발송: 무제한 무료
- 현재 사용량: 주 2회 = 월 8회

---

## 🔒 보안

### 안전성
- ✅ Webhook Key는 암호화되어 GitHub Secrets에 저장
- ✅ Workflow 로그에 노출 안 됨
- ✅ IFTTT는 신뢰할 수 있는 서비스 (2011년부터 운영)

### 권장 사항
- 🔐 Webhook Key 정기적으로 재생성 (6개월마다)
- 🔐 IFTTT 계정 2단계 인증 활성화

---

## 📊 비교: Gmail vs IFTTT

| 항목 | Gmail SMTP | IFTTT |
|------|-----------|-------|
| **설정 난이도** | ⭐⭐⭐⭐⭐ 어려움 | ⭐ 매우 쉬움 |
| **앱 비밀번호** | 필요 | 불필요 |
| **2단계 인증** | 필수 | 선택 |
| **설정 시간** | 10분 | 5분 |
| **이메일 커스터마이징** | 자유로움 | 제한적 |
| **비용** | 무료 | 무료 |
| **신뢰도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**추천:** 간편함이 최우선이면 IFTTT! 🚀

---

## ✅ 설정 완료 체크리스트

- [ ] IFTTT 가입 완료
- [ ] 성공 알림 Applet 생성
- [ ] 실패 알림 Applet 생성
- [ ] Webhook Key 복사
- [ ] GitHub Secrets에 Key 등록
- [ ] 수동 테스트 실행
- [ ] 이메일 수신 확인
- [ ] 스팸 폴더 확인

---

## 🎉 완료!

설정이 완료되면:
- ✅ 매주 화/금 오전 9시 자동 업데이트 후 이메일 수신
- ✅ 실패 시 즉시 알림 이메일 수신
- ✅ Gmail 앱 비밀번호 불필요!
- ✅ 5분 만에 설정 완료!

**정말 쉽죠? 🚀✨**

---

## 📞 추가 지원

### IFTTT 도움말
- https://help.ifttt.com/

### Webhooks 문서
- https://ifttt.com/maker_webhooks

### 문제가 계속되면
- IFTTT 고객 지원: support@ifttt.com
- GitHub Issues: https://github.com/interfacedesigner/Cross-border-remittance-lookup/issues

---

**문서 버전**: 2.0 (IFTTT 간편 버전)
**최종 업데이트**: 2026-02-12
**작성자**: Claude (Anthropic)

🎊 **Gmail 앱 비밀번호 없이도 이메일 알림 완성!** 🎊
