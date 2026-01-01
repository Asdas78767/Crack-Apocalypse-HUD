# Undertale Style AI Chat Combat Overlay

언더테일 스타일의 동적 전투 인터페이스로 AI 채팅을 변환하는 Tampermonkey 스크립트입니다.

## 📋 목차

- [개요](#개요)
- [설치 방법](#설치-방법)
- [조작 방법](#조작-방법)
- [기능 설명](#기능-설명)
- [UI 구조](#ui-구조)
- [커맨드 시스템](#커맨드-시스템)
- [커스터마이징](#커스터마이징)
- [테스트](#테스트)

## 개요

이 스크립트는 웹 기반 AI 채팅 사이트(Character.ai, JanitorAI 등)에서 정적인 텍스트 채팅을 **언더테일** 스타일의 동적 전투 인터페이스로 변환하여 몰입감을 제공합니다.

### 주요 특징

- ✅ 풀스크린 오버레이 (z-index: 9999)
- ✅ 실시간 채팅 로그 미러링
- ✅ 타이밍 미니게임 전투 시스템
- ✅ 4가지 커맨드 (FIGHT/ACT/ITEM/MERCY)
- ✅ 키보드 전용 조작
- ✅ 언더테일 스타일 UI/UX
- ✅ 한글 픽셀 폰트 지원

## 설치 방법

### 1. Tampermonkey 설치

먼저 브라우저에 Tampermonkey를 설치하세요:
- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### 2. 스크립트 설치

1. Tampermonkey 아이콘 클릭 → "새 스크립트 만들기"
2. `undertale-combat.user.js` 파일의 내용을 복사
3. 에디터에 붙여넣기
4. Ctrl+S (또는 Cmd+S)로 저장

### 3. 사이트 권한 설정

스크립트는 기본적으로 모든 사이트(`*://*/*`)에서 실행됩니다.
특정 사이트로 제한하려면 `@match` 부분을 수정하세요:

```javascript
// @match        https://character.ai/*
// @match        https://janitorai.com/*
```

## 조작 방법

### 키보드 컨트롤

| 동작 | 키 |
|------|-----|
| 커맨드 선택 (좌/우) | `←` `→` 또는 `A` `D` |
| 확인/선택 | `Enter` 또는 `Z` |
| 취소/뒤로 | `Shift` 또는 `X` |
| 아이템 선택 (상/하) | `↑` `↓` 또는 `W` `S` |

### 기본 사용 흐름

1. **텍스트 입력**: 중앙 박스에 행동이나 대사 입력
2. **커맨드 선택**: 좌/우 키로 원하는 버튼 선택
3. **실행**: Enter 키로 확인
4. **FIGHT 선택 시**: 타이밍 미니게임 플레이
5. **완료**: 메시지가 자동으로 전송되고 로그에 표시

## 기능 설명

### 1. 대화 로그 뷰 (상단 60%)

- **기능**: 실제 채팅 사이트의 메시지를 실시간으로 복사
- **MutationObserver**: DOM 변경을 감지하여 자동 업데이트
- **멀티미디어 지원**: 텍스트뿐만 아니라 이미지도 표시
- **스크롤**: 마우스 휠로 과거 대화 내역 확인 가능

### 2. 인터랙션 박스 (중앙 25%)

#### 입력 모드 (기본)
- 사용자가 대사나 행동을 입력하는 텍스트 영역
- 자동 포커스 유지
- 입력 내용은 state에 저장

#### 전투 모드 (FIGHT 선택 시)
- Canvas 기반 타이밍 미니게임
- 눈 모양의 타원형 UI
- 좌우로 움직이는 흰색 막대
- Enter 키로 정지하여 타이밍 판정

### 3. 상태 & 커맨드 HUD (하단 15%)

#### 상태 바
- **LV**: 레벨 표시 (기본값: 1)
- **HP 바**: 노란색 게이지로 체력 표시 (기본값: 20/20)
- **KR**: 장식 요소

#### 커맨드 버튼
- 4개 버튼: FIGHT, ACT, ITEM, MERCY
- 선택된 버튼은 노란색 + 하트 아이콘 표시
- 키보드로만 조작 가능

## UI 구조

```
┌──────────────────────────────────────────────┐
│                                              │
│           대화 로그 영역 (60%)                │
│         - 채팅 메시지 미러링                  │
│         - 이미지 지원                        │
│         - 스크롤 가능                        │
│                                              │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │    인터랙션 박스 (25%)                  │  │
│  │    - 입력 모드: 텍스트 입력             │  │
│  │    - 전투 모드: 타이밍 게임             │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
├──────────────────────────────────────────────┤
│  LV 1   HP [████████] 20/20   KR            │
│                                              │
│    [FIGHT]  [ACT]  [ITEM]  [MERCY]          │
└──────────────────────────────────────────────┘
```

## 커맨드 시스템

### FIGHT - 전투 공격

1. **입력**: 중앙 박스에 공격 행동 서술
   ```
   예: "검을 휘둘러 베어버린다"
   ```

2. **실행**: FIGHT 버튼 선택 후 Enter

3. **미니게임**:
   - 흰색 막대가 좌우로 빠르게 이동
   - Enter 키를 눌러 정지
   - 중앙(빨간 선)에 가까울수록 좋은 판정

4. **판정 기준**:
   | 판정 | 오차 범위 | 메시지 |
   |------|-----------|--------|
   | Perfect | 0~5% | ...효과는 치명적이었다! |
   | Great | 6~20% | ...효과는 굉장했다! |
   | Good | 21~50% | ...효과는 평범했다. |
   | Bad | 51~80% | ...효과는 미미했다... |
   | Miss | 81%+ | ...그러나 공격은 빗나갔다! |

5. **전송**: `* [입력 텍스트] [판정 메시지]` 형태로 자동 전송
   ```
   예: "* 검을 휘둘러 베어버린다 ...효과는 굉장했다!"
   ```

### ACT - 대화/행동

1. **입력**: 중앙 박스에 대사나 비전투 행동 서술
   ```
   예: "잠깐, 대화로 해결하자."
   ```

2. **실행**: ACT 버튼 선택 후 Enter

3. **전송**: 입력한 텍스트 그대로 즉시 전송 (미니게임 없음)

### ITEM - 아이템 사용

1. **실행**: ITEM 버튼 선택 후 Enter

2. **팝업**: 아이템 목록 표시
   - 포션 - HP 20 회복
   - 엘릭서 - HP 전체 회복
   - 붕대 - HP 10 회복

3. **선택**: ↑↓ 키로 아이템 선택, Enter로 사용

4. **전송**: `* [아이템명]을(를) 사용했다. HP가 회복되었다.`

### MERCY - 자비

1. **실행**: MERCY 버튼 선택 후 Enter

2. **전송**: `* 자비를 베풀었다.` 메시지 전송

## 커스터마이징

### 색상 변경

`undertale-combat.user.js` 파일에서 색상을 수정할 수 있습니다:

```css
/* 배경색 (검은색) */
background: #000000;

/* 텍스트 색 (흰색) */
color: #ffffff;

/* 선택 강조 색 (노란색) */
.cmd-btn.selected {
    color: #ffff00;
}

/* HP 바 색 (노란색) */
.hp-bar-fill {
    background: #ffff00;
}
```

### 폰트 변경

기본 폰트는 DotGothic16입니다. 다른 픽셀 폰트를 사용하려면:

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

font-family: 'Press Start 2P', 'Courier New', monospace;
```

### HP/레벨 수정

스크립트 시작 부분의 state 객체를 수정:

```javascript
const state = {
    hp: 20,      // 현재 HP
    maxHp: 20,   // 최대 HP
    lv: 1,       // 레벨
    // ...
};
```

### 미니게임 난이도 조정

막대 이동 속도를 변경:

```javascript
const state = {
    barSpeed: 0.03,  // 속도 (클수록 빠름, 기본: 0.03)
    // ...
};
```

### 아이템 목록 추가

HTML 템플릿의 아이템 리스트를 수정:

```html
<ul class="item-list">
    <li class="selected" data-item="포션">포션 - HP 20 회복</li>
    <li data-item="엘릭서">엘릭서 - HP 전체 회복</li>
    <li data-item="붕대">붕대 - HP 10 회복</li>
    <li data-item="새 아이템">새 아이템 - 설명</li>
</ul>
```

## 테스트

### 로컬 테스트

1. **Standalone 테스트 파일**:
   ```
   test-undertale-standalone.html
   ```
   브라우저에서 직접 열어서 테스트 가능

2. **Examples 폴더**:
   ```
   examples/test-undertale-combat.html
   ```
   스크립트를 별도로 로드하여 테스트

### 실제 사이트 테스트

1. Tampermonkey에 스크립트 설치
2. AI 채팅 사이트 방문 (Character.ai, JanitorAI 등)
3. 페이지 로드 시 자동으로 오버레이 활성화
4. 콘솔에서 확인:
   ```
   [Undertale Combat Overlay] 초기화 중...
   [Undertale Combat Overlay] 준비 완료!
   ```

### 디버깅

브라우저 콘솔(F12)에서 state 확인:

```javascript
// 현재 모드 확인
console.log(state.currentMode);

// HP 확인
console.log(`HP: ${state.hp}/${state.maxHp}`);

// 채팅 히스토리 확인
console.log(state.chatHistory);
```

## 호환성

### 지원 브라우저
- ✅ Chrome/Edge (Chromium 기반)
- ✅ Firefox
- ✅ Safari (부분 지원)

### 지원 사이트
- ✅ Character.ai
- ✅ JanitorAI
- ✅ ChatGPT (웹 버전)
- ✅ Claude (웹 버전)
- ✅ 기타 웹 기반 채팅 사이트

### 알려진 제한사항
- 일부 사이트에서 메시지 자동 전송이 작동하지 않을 수 있음
- React/Vue 기반 사이트에서 입력 이벤트 처리 필요
- 모바일 브라우저는 키보드 조작이 제한될 수 있음

## 문제 해결

### 오버레이가 표시되지 않음
1. Tampermonkey가 활성화되어 있는지 확인
2. 스크립트가 해당 사이트에서 실행 중인지 확인
3. 콘솔에서 오류 메시지 확인
4. 페이지 새로고침

### 키보드가 작동하지 않음
1. 페이지의 다른 요소에 포커스가 있는지 확인
2. 브라우저 단축키와 충돌하는지 확인
3. 콘솔에서 이벤트 리스너 확인

### 메시지가 전송되지 않음
1. 사이트의 입력창 선택자 확인
2. 콘솔에서 `sendMessageToChat` 함수 로그 확인
3. 사이트별 선택자를 스크립트에 추가

### 채팅 로그가 업데이트되지 않음
1. MutationObserver가 올바른 요소를 감시하는지 확인
2. 사이트의 메시지 요소 클래스/ID 확인
3. 콘솔에서 observer 로그 확인

## FAQ

**Q: 기존 채팅 인터페이스를 숨길 수 있나요?**
A: 네, CSS를 추가하여 가능합니다:
```css
/* 특정 사이트의 채팅 UI 숨김 */
.original-chat-container {
    display: none !important;
}
```

**Q: HP가 실제로 감소하나요?**
A: 현재 버전에서는 시각적 요소만 제공합니다. HP 시스템을 추가하려면 스크립트를 확장해야 합니다.

**Q: 여러 AI와 동시에 대화할 수 있나요?**
A: 현재는 단일 채팅 세션만 지원합니다.

**Q: 모바일에서 사용 가능한가요?**
A: 키보드가 필요하므로 모바일에서는 제한적입니다. 터치 UI 버전은 향후 고려 사항입니다.

## 라이선스

MIT License - 자유롭게 수정 및 배포 가능

## 기여

버그 리포트, 기능 제안, PR을 환영합니다!

GitHub: https://github.com/Asdas78767/Crack-Apocalypse-HUD

## 제작자

- **작성자**: Asdas78767
- **버전**: 1.0.0
- **최종 업데이트**: 2025-01-01

---

**🎮 즐거운 게임 되세요!**
