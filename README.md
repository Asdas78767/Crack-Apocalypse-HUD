# Crack Apocalypse Tactical HUD

**해킹된 아포칼립스 전술 단말기** - AI 텍스트를 실시간으로 파싱하여 사이버펑크 HUD로 시각화하는 Tampermonkey 유저스크립트

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tampermonkey](https://img.shields.io/badge/tampermonkey-required-orange)

## 🎯 프로젝트 개요

본 프로젝트는 Tampermonkey를 활용하여 웹 브라우저 위에 **'해킹된 아포칼립스 전술 단말기'**를 오버레이로 구현합니다. 핵심 기능은 실시간 텍스트 파싱으로, AI가 출력하는 특정 포맷(`[T9]`)의 데이터를 스크립트가 감지하여 즉시 고퀄리티 그래픽 UI로 변환해 시각화합니다.

### ✨ 주요 특징

- **실시간 텍스트 파싱**: AI가 출력하는 `[T9]` 포맷 데이터를 자동 감지 및 파싱
- **5개 핵심 모듈**: 프로필, 스탯, 환경 센서, 스쿼드, 미션
- **사이버펑크 스타일**: CRT 스캔라인, 노이즈, 글리치 효과
- **동적 반응형 UI**: 게임 진행에 따라 실시간 업데이트
- **크로스 브라우저**: 모든 웹사이트에서 작동

## 📦 설치 방법

### 1. Tampermonkey 설치

먼저 브라우저에 Tampermonkey 확장 프로그램을 설치합니다:

- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- [Safari](https://apps.apple.com/app/tampermonkey/id1482490089)

### 2. 스크립트 설치

1. Tampermonkey 아이콘 클릭
2. "새 스크립트 만들기" 선택
3. `apocalypse-hud.user.js` 파일의 내용을 복사하여 붙여넣기
4. `Ctrl+S` (또는 `Cmd+S`)로 저장

### 3. 스크립트 활성화

- Tampermonkey 아이콘을 클릭하고 "Crack Apocalypse Tactical HUD"가 활성화되어 있는지 확인
- 웹페이지를 새로고침하면 우측 상단에 HUD가 나타납니다

## 🎮 사용 방법

### [T9] 데이터 포맷

HUD를 업데이트하려면 웹페이지 어디에나 다음 포맷으로 텍스트를 삽입하면 됩니다:

```
[T9:카테고리:키1=값1|키2=값2|키3=값3]
```

### 📋 카테고리별 명령어

#### 1. 프로필 (Profile)

캐릭터의 기본 정보를 설정합니다.

```
[T9:profile:name=김철수|job=전투원|funds=15000]
[T9:p:name=박영희|class=의무병|money=8500]
```

**지원 키:**
- `name`: 캐릭터 이름
- `job` 또는 `class`: 직업/역할
- `funds` 또는 `money`: 보유 자금

#### 2. 스탯 (Stats)

캐릭터의 생체 데이터를 업데이트합니다.

```
[T9:stats:health=85|stamina=60|mental=90|combat=75]
[T9:s:health=50|health_grade=D|stamina_max=120]
```

**지원 키:**
- `health`: 체력 (0-100)
- `stamina`: 스태미나 (0-100)
- `mental`: 정신력 (0-100)
- `combat`: 전투력 (0-100)
- `[stat]_max`: 최대값 설정
- `[stat]_grade`: 등급 (S/A/B/C/D/F)

#### 3. 환경 (Environment)

현재 환경 정보를 업데이트합니다.

```
[T9:environment:time=14:30|location=폐허 상가|danger=75]
[T9:env:time=02:15|loc=지하 벙커|danger=25]
[T9:e:time=18:00|location=안전가옥|danger=10]
```

**지원 키:**
- `time`: 시간 (HH:MM 형식)
- `location` 또는 `loc`: 현재 위치
- `danger`: 위험도 (0-100)

#### 4. 스쿼드 (Squad)

팀원 상태를 업데이트합니다.

```
[T9:squad:index=0|name=이상민|health=100|status=alive]
[T9:squad:id=1|name=최은정|health=45|status=injured]
[T9:sq:index=2|name=박준호|health=0|status=dead]
[T9:squad:index=3|name=김다혜|health=85|status=alive]
```

**지원 키:**
- `index` 또는 `id`: 슬롯 번호 (0-3)
- `name`: 팀원 이름
- `health`: 체력 (0-100)
- `status`: 상태 (alive/injured/critical/dead/empty)

#### 5. 미션 (Mission)

현재 미션 정보를 업데이트합니다.

```
[T9:mission:title=폐허 탐사|progress=65]
[T9:m:name=생존자 구출|prog=40]
```

**지원 키:**
- `title` 또는 `name`: 미션 제목
- `progress` 또는 `prog`: 진행률 (0-100)

## 💡 사용 예제

### 예제 1: 전투 시나리오

```html
<div id="game-narrative">
AI 출력: 당신은 폐허가 된 건물에 진입했습니다. 
[T9:profile:name=김지훈|job=스카벤저|funds=12500]
[T9:env:time=15:45|location=폐허 빌딩 3층|danger=60]
[T9:stats:health=85|stamina=70|mental=80|combat=65]
[T9:mission:title=물자 탐색|progress=35]
</div>
```

### 예제 2: 팀 편성

```html
<div class="ai-response">
당신의 팀이 준비되었습니다:
[T9:squad:index=0|name=리더 박철수|health=100|status=alive]
[T9:squad:index=1|name=저격수 김영희|health=90|status=alive]
[T9:squad:index=2|name=의무병 이민준|health=100|status=alive]
[T9:squad:index=3|name=공병 최서연|health=95|status=alive]
</div>
```

### 예제 3: 전투 피해

```html
<div class="combat-log">
적의 공격! 당신은 부상을 입었습니다.
[T9:s:health=45|health_grade=D]
[T9:squad:id=1|health=30|status=critical]
[T9:env:danger=85]
</div>
```

### 예제 4: 미션 완료

```html
<div class="mission-update">
목표 지점 도달! 미션 완료가 임박했습니다.
[T9:mission:progress=95]
[T9:profile:funds=25000]
[T9:stats:mental=95|combat=80]
</div>
```

## 🎨 UI 모듈 설명

### 1. OPERATOR PROFILE (프로필)
- 캐릭터 이름, 직업, 보유 자금 표시
- Bitcoin(₿) 단위로 자금 표시

### 2. BIOMETRIC STATUS (스탯)
- 4가지 주요 스탯: HEALTH, STAMINA, MENTAL, COMBAT
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
역할: 당신은 포스트 아포칼립스 게임 마스터입니다.
게임 상태는 [T9] 포맷으로 출력해주세요.

예시:
"당신은 폐허를 탐험합니다. [T9:env:location=폐허 도시|danger=60]
체력이 소모되었습니다. [T9:stats:health=70|stamina=50]"
```

## 🐛 문제 해결

### HUD가 나타나지 않는 경우

1. Tampermonkey가 활성화되어 있는지 확인
2. 스크립트가 현재 사이트에서 실행 중인지 확인
3. 브라우저 콘솔(F12)에서 오류 메시지 확인
4. 페이지 새로고침 시도

### 데이터가 업데이트되지 않는 경우

1. `[T9]` 포맷이 정확한지 확인
2. 콘솔에서 "[Apocalypse HUD] 전술 단말기 해킹 완료" 메시지 확인
3. 동적 콘텐츠는 MutationObserver가 감지 중

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
