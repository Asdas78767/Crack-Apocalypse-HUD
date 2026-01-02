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
                
                #ut-overlay-root {
                    position: fixed;
                    inset: 0;
                    padding: 26px;
                    width: 100vw;
                    height: 100vh;
                    background: #000000;
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

                #ut-overlay-root * {
                    box-sizing: border-box;
                }

                #ut-frame {
                    position: relative;
                    width: min(600px, 90%);
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
                    border: 4px solid #FFFFFF;
                    color: #FFFFFF;
                    letter-spacing: 1px;
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cmd-btn:hover {
                    border-color: #FFFF00;
                    box-shadow: 0 0 8px #FFFF00;
                }

                /* Heart appears on hover */
                .cmd-btn:hover::before {
                    content: '';
                    position: absolute;
                    top: 8px;
                    left: 6px;
                    width: 20px;
                    height: 20px;
                    display: block;
                    background: #FF0000;
                    clip-path: polygon(50% 10%, 62% 2%, 75% 6%, 88% 20%, 88% 36%, 50% 80%, 12% 36%, 12% 20%, 25% 6%, 38% 2%);
                }

                @supports (clip-path: path('M16 28L2 12C-2 7 0 0 8 0c4 0 7 3 8 5 1-2 4-5 8-5 8 0 10 7 6 12z')) {
                    .cmd-btn:hover::before {
                        clip-path: path('M16 28L2 12C-2 7 0 0 8 0c4 0 7 3 8 5 1-2 4-5 8-5 8 0 10 7 6 12z');
                    }
                }

                .cmd-btn.selected {
                    color: #FFFF00;
                    border-color: #FFFF00;
                    box-shadow: 0 0 8px #FFFF00;
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

            <div id="ut-frame">
                <div class="dialogue-container" id="dialogueBox">
                    <div class="dialogue-text">
                        <span class="asterisk">*</span>마우스를 올리면<br>
                        <span class="asterisk">*</span>하트가 나타납니다.
                    </div>
                    <div class="attack-screen hidden">
                        <div class="attack-message"></div>
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
                        <button class="cmd-btn selected" data-index="0">FIGHT</button>
                        <button class="cmd-btn" data-index="1">ACT</button>
                        <button class="cmd-btn" data-index="2">ITEM</button>
                        <button class="cmd-btn" data-index="3">MERCY</button>
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
        `;

        document.body.appendChild(overlay);
        initializeEventListeners();
        startChatObserver();
    }

    // ==================== 이벤트 리스너 ====================
    function initializeEventListeners() {
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
        const userInput = document.getElementById('ut-user-input');
        const canvas = document.getElementById('ut-game-canvas');
        
        userInput.classList.add('hidden');
        canvas.classList.remove('hidden');
        
        startMinigame();
    }

    function switchToInputMode() {
        state.currentMode = MODE.INPUT;
        const userInput = document.getElementById('ut-user-input');
        const canvas = document.getElementById('ut-game-canvas');
        
        userInput.classList.remove('hidden');
        canvas.classList.add('hidden');
        
        state.gameActive = false;
    }

    function startMinigame() {
        state.gameActive = true;
        state.barPosition = 0;
        state.barDirection = 1;
        
        const canvas = document.getElementById('ut-game-canvas');
        const ctx = canvas.getContext('2d');
        
        // 캔버스 크기 설정
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        // 게임 루프
        function gameLoop() {
            if (!state.gameActive) return;
            
            // 막대 이동
            state.barPosition += state.barSpeed * state.barDirection;
            
            // 경계 반전
            if (state.barPosition >= 1 || state.barPosition <= 0) {
                state.barDirection *= -1;
            }
            
            // 화면 그리기
            drawMinigame(ctx, canvas);
            
            requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
        
        // Enter 키로 정지
        const stopHandler = (e) => {
            if (KEYS.CONFIRM.includes(e.key) && state.gameActive) {
                e.preventDefault();
                e.stopPropagation();
                state.gameActive = false;
                document.removeEventListener('keydown', stopHandler, true);
                
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

    function drawMinigame(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // 배경
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // 타겟 바 (눈 모양, 둥근 타원)
        const centerX = width / 2;
        const centerY = height / 2;
        const barWidth = width * 0.85;
        const barHeight = height * 0.6;
        
        // 흰색 테두리 타원
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, barWidth / 2, barHeight / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // 중앙 타겟 라인 (빨간색)
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - barHeight / 2);
        ctx.lineTo(centerX, centerY + barHeight / 2);
        ctx.stroke();
        
        // 움직이는 흰색 커서
        const minX = centerX - barWidth / 2 + 30;
        const maxX = centerX + barWidth / 2 - 30;
        const cursorX = minX + (state.barPosition * (maxX - minX));
        
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillRect(cursorX - 5, centerY - barHeight / 2, 10, barHeight);
        ctx.shadowBlur = 0;
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
