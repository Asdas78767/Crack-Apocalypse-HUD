# Crack Apocalypse HUD Collection

포스트 아포칼립스 테마의 AI 채팅 오버레이 모음입니다.

## 🎮 오버레이 종류

### 1. Tactical HUD (전술 HUD)
**파일**: `apocalypse-hud.user.js`, `tampermonkey-hud.user.js`

사이버펑크 스타일의 CRT 모니터 전술 인터페이스입니다.
- AI 채팅에서 `[T숫자]` 형식의 데이터를 파싱하여 시각화
- 프로필, 스탯, 환경 센서, 스쿼드 상태, 미션 목표 표시
- 네온 그린 테마와 글리치 효과

### 2. Undertale Combat Overlay (언더테일 전투 오버레이) 🆕
**파일**: `undertale-combat.user.js`

언더테일 스타일의 동적 전투 인터페이스입니다.
- 풀스크린 전투 오버레이 (검은 배경 + 흰색 픽셀 폰트)
- 실시간 채팅 로그 미러링
- 타이밍 미니게임 전투 시스템
- 4가지 커맨드: FIGHT, ACT, ITEM, MERCY
- 키보드 전용 조작 (WASD/방향키)
- **[📖 Undertale 오버레이 상세 가이드](UNDERTALE_GUIDE.md)**
- **[🧪 Standalone 테스트 페이지](test-undertale-standalone.html)**
- **[❤️ 하트 호버 UI 샘플](examples/undertale-custom-heart.html)**

---

## Tactical HUD 문서

### 스쿼드 멤버 예시

```
▣ 시라이 쿠로코
▣ 우이하루 카자리
▣ 사텐 루이코
```

#### 6. 임무 (Mission)

```
▣ 임무: 임무명
▣ 임무없음
```

**예제**:
```
▣ 임무: 정보 수집
▣ 임무: 변이체 소탕
▣ 임무없음
```

## 💡 사용 예제

### 예제 1: 게임 시작 (초기 상태)

```
[T0]
-
[ 미사카 미코토 | 미정 | 미정/미정 | ??? B ]
[ 스탯 | 신체:미정 | 언변:미정 | 행운:미정 ]
-
[ 2057년 10월 28일 | ??시 ??분 ]
[ 위치 | ??? | ⚪ ]
-
▣ 캐릭터없음
-
▣ 임무없음
```

### 예제 2: 캐릭터 등록

```
[T1]
-
[ 미사카 미코토 | 레일건 | 학생/능력자 | 5000 B ]
[ 스탯 | 신체:85 | 언변:70 | 행운:90 ]
-
[ 2057년 10월 28일 | 14시 30분 ]
[ 위치 | 학원도시 제7학구 | ⚪ ]
-
▣ 캐릭터없음
-
▣ 임무없음
```

### 예제 3: 스쿼드 편성

```
[T2]
-
[ 미사카 미코토 | 레일건 | 학생/능력자 | 7500 B ]
[ 스탯 | 신체:85 | 언변:70 | 행운:90 ]
-
[ 2057년 10월 28일 | 16시 00분 ]
[ 위치 | 제7학구 안전가옥 | ⚪ ]
-
▣ 시라이 쿠로코
▣ 우이하루 카자리
▣ 사텐 루이코
-
▣ 임무: 정보 수집
```

### 예제 4: 전투 상황

```
[T5]
-
[ 미사카 미코토 | 레일건 | 학생/능력자 | 7500 B ]
[ 스탯 | 신체:65 | 언변:70 | 행운:90 ]
-
[ 2057년 10월 28일 | 19시 45분 ]
[ 위치 | 폐허 지구 전투 지역 | 🔴 ]
-
▣ 시라이 쿠로코
▣ 우이하루 카자리
▣ 사텐 루이코
-
▣ 임무: 변이체 소탕
```

### 예제 5: 임무 완료

```
[T10]
-
[ 미사카 미코토 | 레일건 | 학생/능력자 | 25000 B ]
[ 스탯 | 신체:95 | 언변:85 | 행운:100 ]
-
[ 2057년 10월 29일 | 02시 30분 ]
[ 위치 | 기지 메디컬 베이 | ⚪ ]
-
▣ 시라이 쿠로코
▣ 우이하루 카자리
▣ 사텐 루이코
-
▣ 임무: 완료 - 보고 대기
```

## 🎨 UI 모듈 설명

### 1. OPERATOR PROFILE (프로필)
- 캐릭터 이름, 직업, 보유 자금 표시
- Bitcoin(₿) 단위로 자금 표시

### 2. BIOMETRIC STATUS (스탯)
- 3가지 주요 스탯: 신체 (BODY), 언변 (SPEECH), 행운 (LUCK)
- 신체는 1개의 바로 표시 (BODY)
- 입력 라벨은 `[ 스탯 | ... ]`과 `[ 능력치 | ... ]` 모두 인식
- 등급별 색상 코딩:
  - **S등급**: 핑크/마젠타 (최상급)
  - **A등급**: 시안/청록 (우수)
  - **B등급**: 녹색 (양호)
  - **C등급**: 노란색 (보통)
  - **D등급**: 주황색 (낮음)
  - **F등급**: 빨간색 (위험)

### 3. ENVIRONMENT SCAN (환경 센서)
- 시간, 위치, 위험도 표시
- 위험도 단계별 표시:
  - **SAFE** (0-24): 녹색 (안전)
  - **CAUTION** (25-49): 노란색 (주의)
  - **DANGER** (50-74): 주황색 (위험)
  - **CRITICAL** (75-100): 빨간색 (치명적)

### 4. SQUAD STATUS (스쿼드)
- 최대 4명의 팀원 상태 표시
- 상태별 시각 효과:
  - **OK**: 녹색 테두리 (건강)
  - **INJURED**: 노란색 테두리 (부상)
  - **CRITICAL**: 주황색 테두리 + 깜빡임 (위급)
  - **K.I.A.**: 빨간색 테두리 + 투명도 (사망)
  - **EMPTY**: 회색 테두리 (빈 슬롯)

### 5. MISSION OBJECTIVE (미션)
- 현재 미션 제목 및 진행률 표시
- 진행률 바로 시각적 피드백

## 🎨 시각 효과

### CRT 모니터 효과
- **스캔라인**: 수평 주사선 애니메이션
- **노이즈**: 미세한 화면 떨림
- **플리커**: 화면 깜빡임 효과

### 글리치 효과
- 헤더 텍스트에 RGB 분리 글리치
- 위험 상황 시 강조 효과
- 동적 그림자 및 광선 효과

### 색상 테마
- 주요 색상: 네온 그린 (#00ff41)
- 배경: 반투명 검은색
- 동적 그라데이션 바

## 🔧 커스터마이징

### HUD 위치 변경

`apocalypse-hud.user.js` 파일에서 다음 CSS를 수정:

```css
#apocalypse-hud {
    position: fixed;
    top: 20px;        /* 상단 거리 */
    right: 20px;      /* 우측 거리 */
    /* 또는 */
    left: 20px;       /* 좌측에 배치 */
    bottom: 20px;     /* 하단에 배치 */
}
```

### HUD 크기 조정

```css
#apocalypse-hud {
    width: 380px;     /* 너비 조정 */
    padding: 15px;    /* 내부 여백 */
}
```

### 색상 테마 변경

메인 색상을 변경하려면 `#00ff41`을 원하는 색상으로 교체:

```css
/* 예: 파란색 테마 */
color: #00ccff;
border: 2px solid #00ccff;
box-shadow: 0 0 20px rgba(0, 204, 255, 0.5);
```

## 🧪 테스트

### 수동 테스트

브라우저 콘솔에서 직접 테스트할 수 있습니다:

```javascript
// 테스트용 div 생성
const testDiv = document.createElement('div');
testDiv.textContent = '[T9:profile:name=테스터|job=개발자|funds=99999]';
document.body.appendChild(testDiv);

// 여러 명령어 한번에 테스트
testDiv.textContent = `
[T9:profile:name=전사|job=전투원|funds=50000]
[T9:stats:health=75|stamina=60|mental=85|combat=90]
[T9:env:time=23:45|location=전투 지역|danger=95]
[T9:mission:title=최종 전투|progress=80]
`;
```

### AI 통합 테스트

ChatGPT, Claude 등 AI 채팅에서 다음처럼 요청:

```
당신은 포스트 아포칼립스 세계의 게임 마스터입니다.
게임 정보는 다음 형식으로 출력해주세요:

[T숫자]
-
[ 캐릭터이름 | 직업 | 정보 | 자금 B ]
[ 스탯 | 신체:값 | 언변:값 | 행운:값 ]
-
[ 연도년 월월 일일 | 시시 분분 ]
[ 위치 | 장소명 | 위험도 ]
-
▣ 동료이름 (있을 경우)
-
▣ 임무: 임무명

예시:
[T1]
-
[ 미사카 미코토 | 레일건 | 학생/능력자 | 5000 B ]
[ 스탯 | 신체:85 | 언변:70 | 행운:90 ]
-
[ 2057년 10월 28일 | 14시 30분 ]
[ 위치 | 학원도시 제7학구 | ⚪ ]
-
▣ 시라이 쿠로코
-
▣ 임무: 정보 수집

이제 게임을 시작해주세요.
```

## 🐛 문제 해결

### HUD가 나타나지 않는 경우

1. Tampermonkey가 활성화되어 있는지 확인
2. 스크립트가 현재 사이트에서 실행 중인지 확인
3. 브라우저 콘솔(F12)에서 오류 메시지 확인
4. 페이지 새로고침 시도

### 데이터가 업데이트되지 않는 경우

1. 정확한 포맷을 사용하고 있는지 확인
2. `[T숫자]`로 시작하는지 확인
3. 대괄호 `[ ]`와 파이프 `|` 구분자가 올바른지 확인
4. 브라우저 콘솔에서 "[Apocalypse HUD] 전술 단말기 해킹 완료" 메시지 확인

### 성능 이슈

- HUD는 매우 가벼우며 성능에 거의 영향을 주지 않습니다
- 만약 성능 문제가 발생하면 Tampermonkey 설정에서 스크립트를 특정 도메인으로 제한

## 📄 라이선스

MIT License - 자유롭게 수정 및 배포 가능

## 🤝 기여

버그 리포트, 기능 제안, PR을 환영합니다!

## 📞 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**제작자**: Asdas78767  
**버전**: 1.0.0  
**최종 업데이트**: 2025-12-31
=======
# Crack Apocalypse HUD

CRT-styled Tampermonkey overlay that listens for AI text blocks formatted with a `[T9]` prefix and renders them as a tactical interface (profile, stats, environment sensors, squad status, and mission progress) on top of any page.

## Quick start (demo)
Open `demo.html` in a browser to see the HUD parse the sample `[T9]` payload and render the overlay. The HUD script is plain JavaScript, so it runs without a build step.

## Using as a userscript
1. Install Tampermonkey (or a compatible userscript manager).
2. Create a new userscript and paste the contents of `tampermonkey-hud.user.js`, or drag the file into your browser to import it.
3. Ensure the AI output includes a block like:
   ```
   [T9]
   PROFILE: Name=Echo Grey | Job=Fixer | FundsB=12800
   STATS: Health=78/100 (A), Armor=64/100 (B), Stamina=54/100 (C)
   ENV: Time=23:41 | Location=Outer Wall S7 | Danger=High
   SQUAD: Raven=Alive, Ghost=Down, Hex=Missing, Viper=Dead
   MISSION: Breach S7 GATE // Progress=42%
   ```
