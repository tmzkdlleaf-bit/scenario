# CASE FILE — 앱 만들기 안내

이 저장소에 파일을 올리면 깃허브가 자동으로 아래 세 가지를 만들어 줘.

| 만들어지는 것 | 받는 곳 |
|---|---|
| 안드로이드 앱 `CASE-FILE-1.0.N.apk` | 저장소 오른쪽 **Releases** |
| 윈도우 설치 파일 `CASE-FILE-Setup-1.0.N.exe` | 저장소 오른쪽 **Releases** |
| 웹 버전 (공유 링크가 열리는 곳) | `https://<아이디>.github.io/<저장소이름>/` |

`N`은 빌드할 때마다 1씩 올라가는 번호야.

---

## 처음 한 번만 하는 설정

### 1. 저장소 만들기
1. github.com 로그인 → 오른쪽 위 **+** → **New repository**
2. 이름: `casefile` (아무거나 괜찮아) · **Public** 선택 → **Create repository**
   - Public이어야 웹 버전(깃허브 페이지)을 무료로 쓸 수 있어. 진상·KP 메모는 Supabase에 있어서 코드가 공개돼도 보이지 않아.

### 2. 웹 버전 켜기
저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿔.

### 3. 서명키 넣기 (중요)
안드로이드 앱은 '서명키'라는 고유 도장이 찍혀 있어야 다음 버전을 덮어 설치할 수 있어.
**Settings → Secrets and variables → Actions → New repository secret** 에서 두 개를 만들어.

| Name | Secret (값) |
|---|---|
| `CF_KEYSTORE_PASSWORD` | 따로 받은 `서명키_비밀값.txt` 의 첫 번째 값 |
| `CF_KEYSTORE_BASE64` | 같은 파일의 두 번째 값 (아주 긴 글자 한 줄 전체) |

`서명키_비밀값.txt` 는 **저장소에 올리지 말고** 따로 보관해 줘. 잃어버리면 새 키로 바꿔야 하고, 그때는 휴대폰 앱을 한 번 지우고 다시 설치해야 해.

### 4. 파일 올리기
1. 저장소 첫 화면 → **uploading an existing file** (또는 **Add file → Upload files**)
2. zip을 푼 폴더 **안의 내용 전부**를 끌어다 놓기 → **Commit changes**
3. 파일 목록에 `.github` 폴더가 보이는지 확인해. 안 보이면 아래 '`.github`가 안 올라갔을 때'를 따라 해.

### 5. 기다렸다가 받기
- 저장소 위쪽 **Actions** 탭에서 '앱 만들기'가 돌아가는 게 보여. 10~15분 걸려.
- 초록 체크가 뜨면 저장소 첫 화면 오른쪽 **Releases** → 최신 버전에서 파일을 받아.

### 6. Supabase에 웹 주소 등록
비밀번호 재설정·가입 확인 메일이 웹 버전으로 오게 하려면:
Supabase 대시보드 → **Authentication → URL Configuration → Redirect URLs** 에
`https://<아이디>.github.io/<저장소이름>/` 추가.

---

## 설치하기

**안드로이드**: 휴대폰 브라우저로 Releases 페이지를 열고 `.apk` 를 눌러 받기 → 열기.
'출처를 알 수 없는 앱' 경고가 나오면 **설정 → 이 출처 허용** 을 켜고 다시 설치.

**윈도우**: `.exe` 를 받아 실행. 'Windows의 PC 보호' 파란 창이 나오면 **추가 정보 → 실행**.
(유료 인증서가 없는 프로그램이라 처음 한 번 나오는 경고야.)

---

## 고칠 때

- 앱 내용은 **`index.html` 하나만** 고치면 돼. 저장소에서 `index.html` 을 새 파일로 올려 덮어쓰면 자동으로 새 버전이 만들어져.
- 안드로이드는 새 apk를 그냥 설치하면 덮어써져 (데이터는 계정에 있어서 그대로).

---

## 앱에서 달라지는 점

| 기능 | 웹 | 안드로이드 | 윈도우 |
|---|---|---|---|
| 파일 받기 (.md · .docx · .json · .txt) | 다운로드 | `문서/CASE FILE` 폴더에 저장 + 보내기 버튼 | 저장 위치 고르는 창 |
| 인쇄 · PDF | 브라우저 인쇄 | 안드로이드 인쇄 창 (PDF로 저장 가능) | 윈도우 인쇄 창 |
| 공유 링크 | 지금 주소 | 웹 버전 주소 | 웹 버전 주소 |
| 바깥 링크 | 새 탭 | 기본 브라우저 | 기본 브라우저 |
| 뒤로 가기 버튼 | — | 열린 창부터 차례로 닫고, 마지막엔 앱을 내림 | — |

---

## 문제가 생기면

**`.github`가 안 올라갔을 때**
**Add file → Create new file** → 파일 이름 칸에 `.github/workflows/build.yml` 입력 →
`build.yml.txt` 내용을 전부 붙여넣기 → **Commit changes**.

**이미 쓰는 웹 주소가 따로 있을 때**
**Settings → Secrets and variables → Actions → Variables** 탭 → **New repository variable**
Name `WEB_URL`, Value `https://내-주소/` . 그러면 깃허브 페이지는 안 만들고 그 주소를 공유 링크에 써.

**Actions에 빨간 X가 떴을 때**
빨간 항목을 눌러 펼친 화면을 캡처해서 보여 줘. '웹 버전' 항목만 빨간 거면 2단계(Pages 켜기)를 확인해.
