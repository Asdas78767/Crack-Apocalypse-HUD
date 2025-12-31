# 사용 가이드 (Usage Guide)

## 빠른 시작

### 1단계: 설치

1. **Tampermonkey 설치**
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)

2. **스크립트 설치**
   ```
   1. Tampermonkey 아이콘 클릭
   2. "새 스크립트 만들기" 선택
   3. apocalypse-hud.user.js 파일 내용 복사 & 붙여넣기
   4. Ctrl+S (Cmd+S) 저장
   ```

3. **확인**
   - 웹페이지를 새로고침
   - 우측 상단에 녹색 HUD가 나타나면 성공!

### 2단계: 테스트

`examples/test-basic.html` 파일을 브라우저로 열어서 버튼을 클릭해보세요.

## [T9] 포맷 상세 가이드

### 기본 구조

```
[T9:카테고리:키1=값1|키2=값2|키3=값3]
```

- `T9`: 고정 태그 (Tactical-9 시스템)
- `카테고리`: profile, stats, env, squad, mission (단축형 사용 가능)
- `키=값`: 파이프(`|`)로 구분된 데이터 쌍

### 카테고리별 완전 가이드

## 1️⃣ PROFILE (프로필)

**단축형**: `p`

**키 목록**:
| 키 | 별칭 | 설명 | 예시 |
|---|---|---|---|
| name | - | 캐릭터 이름 | `name=김철수` |
| job | class | 직업/역할 | `job=전투원` |
| funds | money | 보유 자금 | `funds=15000` |

**예제**:
```
[T9:profile:name=김철수|job=전투원|funds=15000]
[T9:p:name=박영희|class=의무병|money=8500]
```

## 2️⃣ STATS (스탯)

**단축형**: `s`

**키 목록**:
| 키 | 범위 | 설명 | 등급 기준 |
|---|---|---|---|
| health | 0-100 | 체력 | S(90+), A(75+), B(60+), C(40+), D(20+), F(0+) |
| stamina | 0-100 | 스태미나 | 동일 |
| mental | 0-100 | 정신력 | 동일 |
| combat | 0-100 | 전투력 | 동일 |
| [stat]_max | 1-999 | 최대값 | - |
| [stat]_grade | S/A/B/C/D/F | 등급 강제 설정 | - |

**예제**:
```
# 기본 스탯 설정
[T9:stats:health=85|stamina=60|mental=90|combat=75]

# 최대값 변경
[T9:s:health=50|health_max=200|health_grade=B]

# 위급 상황
[T9:s:health=15|health_grade=F|mental=30]
```

## 3️⃣ ENVIRONMENT (환경)

**단축형**: `env`, `e`

**키 목록**:
| 키 | 별칭 | 형식 | 설명 |
|---|---|---|---|
| time | - | HH:MM | 현재 시간 |
| location | loc | 문자열 | 현재 위치 |
| danger | - | 0-100 | 위험도 |

**위험도 단계**:
- 0-24: SAFE (녹색)
- 25-49: CAUTION (노란색)
- 50-74: DANGER (주황색)
- 75-100: CRITICAL (빨간색)

**예제**:
```
[T9:environment:time=14:30|location=폐허 상가|danger=75]
[T9:env:time=02:15|loc=지하 벙커|danger=25]
[T9:e:time=18:00|location=안전가옥|danger=10]
```

## 4️⃣ SQUAD (스쿼드)

**단축형**: `sq`

**키 목록**:
| 키 | 별칭 | 설명 | 값 |
|---|---|---|---|
| index | id | 슬롯 번호 | 0-3 |
| name | - | 팀원 이름 | 문자열 |
| health | - | 체력 | 0-100 |
| status | - | 상태 | alive/injured/critical/dead/empty |

**상태 자동 판정**:
- health > 75: OK (녹색)
- health > 40: INJURED (노란색)
- health > 0: CRITICAL (주황색 깜빡임)
- health = 0: K.I.A. (빨간색)

**예제**:
```
# 팀원 추가
[T9:squad:index=0|name=리더 박철수|health=100|status=alive]
[T9:squad:id=1|name=저격수 김영희|health=90]

# 전투 피해
[T9:sq:index=1|health=25|status=critical]

# 사망
[T9:squad:id=3|health=0|status=dead]
```

## 5️⃣ MISSION (미션)

**단축형**: `m`

**키 목록**:
| 키 | 별칭 | 설명 | 값 |
|---|---|---|---|
| title | name | 미션 제목 | 문자열 |
| progress | prog | 진행률 | 0-100 |

**예제**:
```
[T9:mission:title=폐허 탐사|progress=65]
[T9:m:name=생존자 구출|prog=40]
[T9:m:progress=100]
```

## 실전 시나리오 예제

### 시나리오 1: 게임 시작

```html
당신은 황폐해진 도시에서 눈을 뜹니다.
[T9:profile:name=생존자 A-7|job=탐색자|funds=1000]
[T9:env:time=08:00|location=폐허 아파트|danger=20]
[T9:stats:health=100|stamina=100|mental=80|combat=50]
[T9:mission:title=식량 확보|progress=0]
```

### 시나리오 2: 동료 만남

```html
라디오에서 신호가 잡힙니다. 생존자들이 응답합니다!
[T9:squad:index=0|name=전투원 김준|health=100]
[T9:squad:index=1|name=의무병 이서|health=100]
[T9:mission:progress=25]
```

### 시나리오 3: 전투 발생

```html
변이체 무리와 조우! 전투가 시작됩니다!
[T9:env:danger=90]
[T9:stats:health=70|stamina=50|combat=75|combat_grade=B]
[T9:squad:id=0|health=60]
[T9:squad:id=1|health=40|status=injured]
[T9:mission:progress=50]
```

### 시나리오 4: 승리와 보상

```html
승리했습니다! 전투 경험을 얻었습니다.
[T9:env:danger=10]
[T9:stats:health=65|combat=90|combat_grade=A]
[T9:profile:funds=8500]
[T9:mission:progress=100]
```

### 시나리오 5: 위기 상황

```html
매복! 팀이 큰 피해를 입었습니다!
[T9:stats:health=20|health_grade=F|stamina=15|mental=40]
[T9:squad:id=0|health=25|status=critical]
[T9:squad:id=1|health=0|status=dead]
[T9:env:danger=95|location=함정 지역]
```

## 고급 활용법

### 여러 명령어 동시 실행

한 번에 여러 모듈을 업데이트할 수 있습니다:

```html
전투 종료. 모든 상태가 업데이트되었습니다.
[T9:profile:funds=15000]
[T9:stats:health=55|stamina=40|mental=70|combat=85|combat_grade=A]
[T9:env:danger=15|location=안전 구역]
[T9:mission:progress=100]
[T9:squad:id=0|health=70]
[T9:squad:id=1|health=80]
```

### 점진적 업데이트

스토리 진행에 따라 단계적으로 업데이트:

```html
<!-- 1단계: 탐색 시작 -->
물자를 찾아 건물에 진입합니다.
[T9:mission:progress=10]

<!-- 2단계: 장소 이동 -->
2층에 도착했습니다.
[T9:mission:progress=30]
[T9:stats:stamina=85]

<!-- 3단계: 위험 감지 -->
적의 흔적이 발견되었습니다.
[T9:env:danger=60]
[T9:mission:progress=50]
```

### AI와 통합

ChatGPT, Claude 등 AI에게 다음과 같이 요청:

```
당신은 포스트 아포칼립스 게임 마스터입니다.
게임 상태는 [T9] 포맷으로 표현해주세요.

포맷 예시:
- 프로필: [T9:profile:name=이름|job=직업|funds=자금]
- 스탯: [T9:stats:health=체력|stamina=스태미나]
- 환경: [T9:env:time=시간|location=위치|danger=위험도]
- 스쿼드: [T9:squad:index=번호|name=이름|health=체력]
- 미션: [T9:mission:title=제목|progress=진행률]

이제 게임을 시작해주세요.
```

## 문제 해결

### HUD가 보이지 않음
1. Tampermonkey 확장 프로그램이 활성화되어 있는지 확인
2. 스크립트가 활성화되어 있는지 확인
3. 페이지 새로고침 (F5)
4. 브라우저 콘솔(F12)에서 오류 확인

### 데이터가 업데이트되지 않음
1. `[T9]` 포맷이 정확한지 확인
2. 값이 허용 범위 내인지 확인 (예: health는 0-100)
3. 브라우저 콘솔에서 "[Apocalypse HUD] 전술 단말기 해킹 완료" 메시지 확인

### 성능 문제
- HUD는 매우 가볍습니다 (CPU/메모리 사용량 < 1%)
- 만약 문제가 있다면 Tampermonkey 설정에서 특정 도메인만 허용

## 키보드 단축키

현재 버전에는 키보드 단축키가 없습니다. HUD는 자동으로 작동합니다.

## 다음 버전 계획

- [ ] 키보드 단축키로 HUD 표시/숨김
- [ ] 테마 변경 (파란색, 빨간색, 황금색)
- [ ] HUD 위치 드래그 앤 드롭
- [ ] 미니맵 모듈 추가
- [ ] 인벤토리 시스템
- [ ] 사운드 효과
- [ ] 데이터 저장/로드

## 지원

문제가 있거나 제안사항이 있으시면 GitHub Issues에 등록해주세요.
