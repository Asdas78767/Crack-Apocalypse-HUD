// ==UserScript==
// @name         Undertale Style AI Chat Combat Overlay
// @namespace    https://github.com/Asdas78767/Crack-Apocalypse-HUD
// @version      1.0.0
// @description  언더테일 스타일의 동적 전투 인터페이스로 AI 채팅을 변환
// @author       Asdas78767
// @match        https://crack.wrtn.ai/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 상수 정의 ====================
    const OVERLAY_ID = 'ut-overlay-root';
    const Z_INDEX = 9999;
    
    // 키보드 매핑
    const KEYS = {
        UP: ['ArrowUp', 'w', 'W'],
        DOWN: ['ArrowDown', 's', 'S'],
        LEFT: ['ArrowLeft', 'a', 'A'],
        RIGHT: ['ArrowRight', 'd', 'D'],
        CONFIRM: ['Enter', 'z', 'Z'],
        CANCEL: ['Shift', 'x', 'X']
    };

    // 모드
    const MODE = {
        INPUT: 'input',
        FIGHT: 'fight'
    };

    // 커맨드 버튼
    const COMMANDS = ['FIGHT', 'ACT', 'ITEM', 'MERCY'];

    // 판정 기준 (중앙으로부터의 거리 비율)
    const JUDGMENT = {
        PERFECT: { max: 0.05, text: '...효과는 치명적이었다!' },
        GREAT: { max: 0.20, text: '...효과는 굉장했다!' },
        GOOD: { max: 0.50, text: '...효과는 평범했다.' },
        BAD: { max: 0.80, text: '...효과는 미미했다...' },
        MISS: { max: 1.00, text: '...그러나 공격은 빗나갔다!' }
    };

    // ==================== 상태 관리 ====================
    const state = {
        currentMode: MODE.INPUT,
        selectedCommand: 0,
        userInput: '',
        hp: 20,
        maxHp: 20,
        lv: 1,
        chatHistory: [],
        gameActive: false,
        barPosition: 0,
        barDirection: 1,
        barSpeed: 0.03,
        items: [
            { name: '포션', desc: 'HP 20 회복' },
            { name: '엘릭서', desc: 'HP 전체 회복' },
            { name: '붕대', desc: 'HP 10 회복' }
        ]
    };

    // ==================== DOM 생성 ====================
    function createOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                
                /* 토글 버튼 */
                .ut-toggle-btn {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    background: #000000;
                    color: #FFFFFF;
                    border: 2px solid #FFFFFF;
                    padding: 8px 12px;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 12px;
                    cursor: pointer;
                    z-index: ${Z_INDEX + 1};
                    user-select: none;
                }

                .ut-toggle-btn:hover {
                    border-color: #FFFF00;
                    color: #FFFF00;
                }
                
                #ut-overlay-root {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.9);
                    color: #FFFFFF;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 16px;
                    z-index: ${Z_INDEX};
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    user-select: none;
                    image-rendering: pixelated;
                    -webkit-font-smoothing: none;
                }
                
                #ut-overlay-root.hidden {
                    display: none;
                }

                #ut-overlay-root * {
                    box-sizing: border-box;
                }

                /* 팝업 컨테이너 */
                .popup {
                    background: rgba(0, 0, 0, 0.95);
                    border: 4px solid #FFFFFF;
                    padding: 20px 22px 26px;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
                }

                #ut-frame {
                    position: relative;
                    width: 600px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    padding: 0;
                    background: transparent;
                    overflow: visible;
                }

                /* 대화창 */
                .dialogue-container {
                    width: 100%;
                    height: 150px;
                    border: 4px solid #FFFFFF;
                    box-sizing: border-box;
                    margin-bottom: 15px;
                    position: relative;
                    padding: 25px;
                    font-size: 18px;
                    line-height: 1.6;
                    background: #000000;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                
                .dialogue-container::-webkit-scrollbar {
                    width: 8px;
                }
                
                .dialogue-container::-webkit-scrollbar-track {
                    background: #000000;
                }
                
                .dialogue-container::-webkit-scrollbar-thumb {
                    background: #FFFFFF;
                }
                
                .log-message {
                    margin-bottom: 10px;
                    line-height: 1.6;
                    word-wrap: break-word;
                }
                
                .log-message.from-player {
                    color: #FFFF00;
                }

                .asterisk { 
                    margin-right: 15px; 
                    vertical-align: top; 
                }
                
                /* 공격 타이밍 화면 */
                .attack-screen {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    background-color: #000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                
                .attack-screen.hidden {
                    display: none;
                }
                
                /* 타겟 바 (눈 모양 이미지) */
                .target-bar {
                    background-image: url('https://i.ibb.co/GkBrsc/image.png');
                    width: 95%;
                    height: 120px;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    position: relative;
                }
                
                /* 움직이는 커서 (이미지) */
                .attack-cursor {
                    background-image: url('https://i.ibb.co/wM7gzg/image.png');
                    width: 100px;
                    height: 250px;
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    position: absolute;
                    top: 100%;
                    transform: translateY(-50%);
                    left: 3%;
                    animation: moveCursor 1.5s linear infinite alternate;
                }
                
                @keyframes moveCursor {
                    0% { left: 3%; }
                    100% { left: 94%; }
                }
                
                .attack-message {
                    color: #FFFFFF;
                    font-size: 18px;
                    text-align: center;
                }
                
                .dialogue-text {
                    display: block;
                }
                
                .show-attack .dialogue-text {
                    display: none;
                }
                
                .show-attack .attack-screen {
                    display: flex;
                }

                /* 중단: 전투 박스 */
                #ut-middle-box {
                    min-height: 150px;
                    width: 100%;
                    border: 4px solid #ffffff;
                    background: #000000;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .ut-heart-marker {
                    display: none;
                }

                #ut-user-input {
                    width: 92%;
                    height: 82%;
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid rgba(255, 255, 255, 0.35);
                    color: #FFFFFF;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 14px;
                    padding: 12px;
                    resize: none;
                    outline: none;
                    position: relative;
                    z-index: 1;
                }

                #ut-user-input::placeholder {
                    color: #999999;
                }

                #ut-game-canvas {
                    width: 96%;
                    height: 86%;
                    background: transparent;
                    z-index: 1;
                }

                /* 하단: 상태 및 커맨드 */
                #ut-bottom-hud {
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .status-bar {
                    display: flex;
                    align-items: center;
                    gap: 30px;
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 0;
                    padding-left: 5px;
                    box-sizing: border-box;
                }
                
                .name {
                    margin-right: 0;
                }

                .status-lv {
                    font-weight: bold;
                    color: #FFFFFF;
                    letter-spacing: 1px;
                }

                .status-hp {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .hp-label {
                    font-size: 14px;
                    margin-top: 5px;
                    margin-right: 0;
                }

                .hp-bar-container {
                    width: 200px;
                    height: 20px;
                    border: none;
                    background: #FF0000;
                    position: relative;
                }

                .hp-bar-container.slim {
                    width: 200px;
                    height: 16px;
                }

                .hp-bar-fill {
                    height: 100%;
                    background: #FFFF00;
                    transition: width 0.3s ease;
                }

                .hp-text {
                    color: #FFFFFF;
                }

                .status-kr {
                    display: none;
                }

                .status-kr.pill {
                    display: none;
                }

                .command-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: space-between;
                }

                .cmd-btn {
                    width: 110px;
                    height: 38px;
                    font-size: 14px;
                    cursor: pointer;
                    position: relative;
                    font-family: 'Press Start 2P', cursive;
                    background: #000000;
                    color: transparent;
                    letter-spacing: 1px;
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background-repeat: no-repeat;
                    background-size: 100% auto;
                    background-position: 0 0;
                }
                
                /* 버튼별 이미지 매핑 */
                .cmd-btn[data-index="0"] { 
                    background-image: url('https://i.ibb.co/GnTODZ/image.png');
                }
                .cmd-btn[data-index="1"] { 
                    background-image: url('https://i.ibb.co/q15wco/image.png');
                }
                .cmd-btn[data-index="2"] { 
                    background-image: url('https://i.ibb.co/v5qNts/image.png');
                }
                .cmd-btn[data-index="3"] { 
                    background-image: url('https://i.ibb.co/FwOLMJ/image.png');
                }

                .cmd-btn:hover {
                    background-position: 0 53%;
                }

                /* Heart appears on hover */
                .cmd-btn:hover::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 4px;
                    width: 20px;
                    height: 20px;
                    display: block;
                    background-color: #000000;
                    background-image: url('https://i.ibb.co/pF8sGP/image.png');
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: contain;
                }

                .cmd-btn.selected::after {
                    content: '❤';
                    position: absolute;
                    left: -22px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #FF0000;
                    font-size: 16px;
                }

                /* 숨김 클래스 */
                .hidden {
                    display: none !important;
                }

                /* 아이템 팝업 */
                #ut-item-popup {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #000000;
                    border: 4px solid #FFFFFF;
                    padding: 20px;
                    z-index: ${Z_INDEX + 1};
                    min-width: 320px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .item-add {
                    display: flex;
                    gap: 8px;
                }

                .item-add input {
                    flex: 1;
                    padding: 10px;
                    border: 2px solid #FFFFFF;
                    background: #000000;
                    color: #FFFFFF;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 12px;
                }

                .item-add button {
                    padding: 10px 14px;
                    border: 2px solid #FFFFFF;
                    background: #000000;
                    color: #FFFFFF;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 12px;
                }

                .item-add button:hover {
                    background: #FFFFFF;
                    color: #000000;
                }

                .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .item-list li {
                    padding: 10px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }

                .item-list li:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .item-list li.selected {
                    color: #FFFF00;
                    background: rgba(255, 255, 0, 0.1);
                    border: 1px solid #FFFF00;
                }

                .item-list li.selected::before {
                    content: '❤ ';
                    color: #FF0000;
                }
            </style>

            <div id="ut-overlay-root">
                <div class="popup">
                    <div id="ut-frame">
                        <div class="dialogue-container" id="dialogueBox">
                            <div class="dialogue-text" id="ut-log-container">
                                <div class="log-message">
                                    <span class="asterisk">*</span>대화 내용이 여기에 표시됩니다...
                                </div>
                            </div>
                            <div class="attack-screen hidden">
                                <div class="target-bar">
                                    <div class="attack-cursor"></div>
                                </div>
                            </div>
                        </div>

                        <div id="ut-middle-box">
                            <textarea id="ut-user-input" placeholder="행동이나 대사를 입력하세요..."></textarea>
                            <canvas id="ut-game-canvas" class="hidden"></canvas>
                        </div>

                        <div id="ut-bottom-hud">
                            <div class="status-bar">
                                <span class="name">CHARA</span>
                                <span class="status-lv">LV ${state.lv}</span>
                                <div class="status-hp">
                                    <span class="hp-label">HP</span>
                                    <div class="hp-bar-container">
                                        <div class="hp-bar-fill" style="width: 100%;"></div>
                                    </div>
                                    <span class="hp-text">${state.hp} / ${state.maxHp}</span>
                                </div>
                            </div>
                            <div class="command-buttons">
                                <button class="cmd-btn selected" data-index="0"></button>
                                <button class="cmd-btn" data-index="1"></button>
                                <button class="cmd-btn" data-index="2"></button>
                                <button class="cmd-btn" data-index="3"></button>
                            </div>
                        </div>

                        <div id="ut-item-popup" class="hidden">
                            <div class="item-add">
                                <input id="ut-item-input" type="text" placeholder="예: 수퍼 포션 - HP 40 회복">
                                <button id="ut-item-add-btn">추가</button>
                            </div>
                            <ul class="item-list"></ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // 토글 버튼을 별도로 생성 (overlay와 독립적)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ut-toggle-btn';
        toggleBtn.id = 'ut-toggle';
        toggleBtn.textContent = 'UI 숨기기';
        document.body.appendChild(toggleBtn);
        
        initializeEventListeners();
        startChatObserver();
    }

    // ==================== 이벤트 리스너 ====================
    function initializeEventListeners() {
        // 토글 버튼 이벤트
        const toggleBtn = document.getElementById('ut-toggle');
        const overlayRoot = document.getElementById('ut-overlay-root');
        if (toggleBtn && overlayRoot) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = overlayRoot.classList.toggle('hidden');
                toggleBtn.textContent = isHidden ? 'UI 표시' : 'UI 숨기기';
            });
        }

        // 키보드 이벤트
        document.addEventListener('keydown', handleKeydown, true);

        // 마우스 스크롤 (로그 영역에서만)
        const logContainer = document.getElementById('ut-log-container');
        if (logContainer) {
            logContainer.addEventListener('wheel', (e) => {
                e.stopPropagation();
            }, true);
        }

        // 입력창 포커스 유지
        const userInput = document.getElementById('ut-user-input');
        if (userInput) {
            userInput.addEventListener('input', (e) => {
                state.userInput = e.target.value;
            });
        }
    }

    // 키보드 핸들러
    function handleKeydown(e) {
        // 입력 모드에서 텍스트 입력 중이면 방향키만 차단
        const userInput = document.getElementById('ut-user-input');
        const isTyping = userInput && document.activeElement === userInput;

        // 방향키 처리
        if (KEYS.LEFT.includes(e.key) || KEYS.RIGHT.includes(e.key)) {
            if (!isTyping) {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation(e.key);
            }
        }

        // 확인/취소 키 처리
        if (KEYS.CONFIRM.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            handleConfirm();
        }

        if (KEYS.CANCEL.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
        }

        // 위/아래 키는 항상 차단 (기본 스크롤 방지)
        if (KEYS.UP.includes(e.key) || KEYS.DOWN.includes(e.key)) {
            if (!isTyping) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    // 네비게이션 처리
    function handleNavigation(key) {
        if (KEYS.LEFT.includes(key)) {
            state.selectedCommand = Math.max(0, state.selectedCommand - 1);
        } else if (KEYS.RIGHT.includes(key)) {
            state.selectedCommand = Math.min(COMMANDS.length - 1, state.selectedCommand + 1);
        }

        updateCommandButtons();
    }

    // 커맨드 버튼 업데이트
    function updateCommandButtons() {
        const buttons = document.querySelectorAll('.cmd-btn');
        buttons.forEach((btn, idx) => {
            if (idx === state.selectedCommand) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // 확인 키 처리
    function handleConfirm() {
        const command = COMMANDS[state.selectedCommand];
        
        switch (command) {
            case 'FIGHT':
                handleFightCommand();
                break;
            case 'ACT':
                handleActCommand();
                break;
            case 'ITEM':
                handleItemCommand();
                break;
            case 'MERCY':
                handleMercyCommand();
                break;
        }
    }

    // 취소 키 처리
    function handleCancel() {
        // 게임 모드에서 입력 모드로 전환
        if (state.currentMode === MODE.FIGHT) {
            switchToInputMode();
        }
        
        // 아이템 팝업 닫기
        const itemPopup = document.getElementById('ut-item-popup');
        if (itemPopup && !itemPopup.classList.contains('hidden')) {
            itemPopup.classList.add('hidden');
        }
    }

    // ==================== 커맨드 핸들러 ====================
    
    // FIGHT: 타이밍 미니게임
    function handleFightCommand() {
        if (!state.userInput.trim()) {
            addLogMessage('먼저 공격 행동을 입력하세요.');
            return;
        }

        switchToFightMode();
    }

    function switchToFightMode() {
        state.currentMode = MODE.FIGHT;
        const dialogueBox = document.getElementById('dialogueBox');
        const attackScreen = dialogueBox.querySelector('.attack-screen');
        
        // 대화창에서 attack screen 표시 (이미지 기반)
        dialogueBox.classList.add('show-attack');
        if (attackScreen) {
            attackScreen.classList.remove('hidden');
        }
        
        startImageMinigame();
    }

    function switchToInputMode() {
        state.currentMode = MODE.INPUT;
        const dialogueBox = document.getElementById('dialogueBox');
        const attackScreen = dialogueBox.querySelector('.attack-screen');
        
        // 대화창으로 복귀
        dialogueBox.classList.remove('show-attack');
        if (attackScreen) {
            attackScreen.classList.add('hidden');
        }
        
        state.gameActive = false;
    }

    function startImageMinigame() {
        state.gameActive = true;
        state.barPosition = 0;
        state.barDirection = 1;
        
        // CSS 애니메이션을 사용하므로 별도의 게임 루프가 필요 없음
        // 커서는 이미 CSS animation으로 움직이고 있음
        
        // Enter 키로 정지하고 판정
        const stopHandler = (e) => {
            if (KEYS.CONFIRM.includes(e.key) && state.gameActive) {
                e.preventDefault();
                e.stopPropagation();
                state.gameActive = false;
                document.removeEventListener('keydown', stopHandler, true);
                
                // 커서 위치를 CSS animation에서 계산
                const cursor = document.querySelector('.attack-cursor');
                if (cursor) {
                    const rect = cursor.getBoundingClientRect();
                    const container = cursor.parentElement.getBoundingClientRect();
                    const relativePos = (rect.left - container.left) / container.width;
                    state.barPosition = Math.max(0, Math.min(1, relativePos));
                }
                
                // 판정 계산
                const judgment = calculateJudgment(state.barPosition);
                const finalText = `* ${state.userInput} ${judgment}`;
                
                // 메시지 전송
                sendMessageToChat(finalText);
                
                // UI 초기화
                switchToInputMode();
                state.userInput = '';
                document.getElementById('ut-user-input').value = '';
            }
        };
        
        document.addEventListener('keydown', stopHandler, true);
    }

    function calculateJudgment(position) {
        const distance = Math.abs(position - 0.5) * 2; // 중앙(0.5)으로부터의 거리를 0~1로 정규화
        
        for (const [key, value] of Object.entries(JUDGMENT)) {
            if (distance <= value.max) {
                return value.text;
            }
        }
        
        return JUDGMENT.MISS.text;
    }

    // 아이템 렌더링
    function renderItemList(selectedIndex = 0) {
        const listEl = document.querySelector('#ut-item-popup .item-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        state.items.forEach((item, idx) => {
            const li = document.createElement('li');
            li.dataset.item = item.name;
            li.textContent = item.desc ? `${item.name} - ${item.desc}` : item.name;
            if (idx === selectedIndex) {
                li.classList.add('selected');
            }
            listEl.appendChild(li);
        });
    }

    // ACT: 직접 전송
    function handleActCommand() {
        if (!state.userInput.trim()) {
            addLogMessage('먼저 대사나 행동을 입력하세요.');
            return;
        }

        const finalText = `${state.userInput}`;
        sendMessageToChat(finalText);
        
        // 입력창 초기화
        state.userInput = '';
        document.getElementById('ut-user-input').value = '';
    }

    // ITEM: 아이템 사용
    function handleItemCommand() {
        const popup = document.getElementById('ut-item-popup');
        if (!popup) return;

        popup.classList.remove('hidden');
        
        let selectedItem = 0;
        const itemListEl = popup.querySelector('.item-list');
        const addInput = document.getElementById('ut-item-input');
        const addBtn = document.getElementById('ut-item-add-btn');

        function updateItemSelection() {
            const items = itemListEl.querySelectorAll('li');
            items.forEach((item, idx) => {
                if (idx === selectedItem) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        function addItemFromInput() {
            const raw = (addInput?.value || '').trim();
            if (!raw) return;
            const [namePart, descPart] = raw.split(/-(.+)/);
            const name = namePart.trim();
            const desc = (descPart || '').trim();
            if (!name) return;
            state.items.push({ name, desc });
            addInput.value = '';
            selectedItem = state.items.length - 1;
            renderItemList(selectedItem);
            updateItemSelection();
        }

        const inputKeyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItemFromInput();
            }
        };

        const itemHandler = (e) => {
            const items = itemListEl.querySelectorAll('li');
            const lastIndex = Math.max(items.length - 1, 0);
            if (KEYS.UP.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                selectedItem = Math.max(0, selectedItem - 1);
                updateItemSelection();
            } else if (KEYS.DOWN.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                selectedItem = Math.min(lastIndex, selectedItem + 1);
                updateItemSelection();
            } else if (KEYS.CONFIRM.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!state.items.length) {
                    addLogMessage('아이템이 없습니다. 먼저 추가하세요.');
                    cleanup();
                    return;
                }
                const item = state.items[selectedItem] || state.items[0];
                const label = item.desc ? `${item.name} - ${item.desc}` : item.name;
                const finalText = `* ${label}을(를) 사용했다. HP가 회복되었다.`;
                sendMessageToChat(finalText);
                
                popup.classList.add('hidden');
                cleanup();
            } else if (KEYS.CANCEL.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                popup.classList.add('hidden');
                cleanup();
            }
        };

        function cleanup() {
            document.removeEventListener('keydown', itemHandler, true);
            addBtn?.removeEventListener('click', addItemFromInput);
            addInput?.removeEventListener('keydown', inputKeyHandler);
        }

        document.addEventListener('keydown', itemHandler, true);
        addBtn?.addEventListener('click', addItemFromInput);
        addInput?.addEventListener('keydown', inputKeyHandler);

        renderItemList(selectedItem);
        updateItemSelection();
    }

    // MERCY: 자비
    function handleMercyCommand() {
        const finalText = '* 자비를 베풀었다.';
        sendMessageToChat(finalText);
    }

    // ==================== 메시지 전송 ====================
    function sendMessageToChat(finalText) {
        addLogMessage(`[YOU] ${finalText}`);
        
        // 실제 사이트의 입력창 찾기 시도
        // 일반적인 선택자들을 시도
        const selectors = [
            'textarea[placeholder*="메시지"]',
            'textarea[placeholder*="message"]',
            'textarea.chat-input',
            'textarea[class*="input"]',
            'div[contenteditable="true"]'
        ];
        
        let nativeInput = null;
        let sendButton = null;
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.id !== 'ut-user-input') {
                nativeInput = element;
                break;
            }
        }
        
        if (nativeInput && nativeInput.id !== 'ut-user-input') {
            // React/Vue 가상 DOM 호환
            const isTextarea = nativeInput.tagName === 'TEXTAREA';
            const isContentEditable = nativeInput.contentEditable === 'true';
            
            if (isTextarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 
                    "value"
                ).set;
                nativeInputValueSetter.call(nativeInput, finalText);
                nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (isContentEditable) {
                nativeInput.textContent = finalText;
                nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            // 전송 버튼 찾기
            const buttonSelectors = [
                'button[aria-label*="전송"]',
                'button[aria-label*="send"]',
                'button.send-message',
                'button[type="submit"]'
            ];
            
            for (const selector of buttonSelectors) {
                const element = document.querySelector(selector);
                if (element && !element.closest('#ut-overlay-root')) {
                    sendButton = element;
                    break;
                }
            }
            
            if (sendButton) {
                setTimeout(() => sendButton.click(), 100);
            }
        } else {
            // No native input found, log message only goes to overlay
            console.log('[Undertale Overlay] No native chat input found on page');
        }
    }

    // ==================== 채팅 로그 관찰 ====================
    function startChatObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // Only process element nodes that are not part of the overlay
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        node.id !== OVERLAY_ID && 
                        !node.closest && !node.querySelector('#' + OVERLAY_ID)) {
                        // AI 응답으로 보이는 요소 감지
                        if (node.matches && (
                            node.matches('[class*="message"]') ||
                            node.matches('[class*="chat"]') ||
                            node.matches('[role="article"]')
                        )) {
                            const text = node.textContent || '';
                            const images = node.querySelectorAll('img');
                            
                            // Check text content doesn't belong to overlay
                            if (text.trim() && !node.closest('#' + OVERLAY_ID)) {
                                addLogMessage(text, images);
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 로그 메시지 추가
    function addLogMessage(text, images = null) {
        const logContainer = document.getElementById('ut-log-container');
        if (!logContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'log-message';
        if ((text || '').trim().startsWith('[YOU]')) {
            messageDiv.classList.add('from-player');
        }
        messageDiv.textContent = text;
        
        if (images && images.length > 0) {
            images.forEach((img) => {
                const clonedImg = img.cloneNode(true);
                messageDiv.appendChild(clonedImg);
            });
        }
        
        logContainer.appendChild(messageDiv);
        
        // 자동 스크롤
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // 히스토리 저장
        state.chatHistory.push({ text, images });
    }

    // ==================== 초기화 ====================
    function init() {
        console.log('[Undertale Combat Overlay] 초기화 중...');
        createOverlay();
        console.log('[Undertale Combat Overlay] 준비 완료!');
    }

    // 페이지 로드 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
