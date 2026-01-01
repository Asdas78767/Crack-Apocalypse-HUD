// ==UserScript==
// @name         Undertale Style AI Chat Combat Overlay
// @namespace    https://github.com/Asdas78767/Crack-Apocalypse-HUD
// @version      1.0.0
// @description  언더테일 스타일의 동적 전투 인터페이스로 AI 채팅을 변환
// @author       Asdas78767
// @match        *://*/*
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
        barSpeed: 0.03
    };

    // ==================== DOM 생성 ====================
    function createOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
                
                #ut-overlay-root {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #000000;
                    color: #ffffff;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    font-size: 16px;
                    z-index: ${Z_INDEX};
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    user-select: none;
                }

                #ut-overlay-root * {
                    box-sizing: border-box;
                }

                /* 상단: 대화 로그 (60%) */
                #ut-log-container {
                    height: 60%;
                    padding: 20px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    border-bottom: 2px solid #ffffff;
                    scrollbar-width: thin;
                    scrollbar-color: #ffffff #000000;
                }

                #ut-log-container::-webkit-scrollbar {
                    width: 8px;
                }

                #ut-log-container::-webkit-scrollbar-track {
                    background: #000000;
                }

                #ut-log-container::-webkit-scrollbar-thumb {
                    background: #ffffff;
                }

                .log-message {
                    margin-bottom: 15px;
                    line-height: 1.5;
                    word-wrap: break-word;
                }

                .log-message img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 10px 0;
                }

                /* 중단: 인터랙션 박스 */
                #ut-middle-box {
                    height: 25%;
                    margin: 20px auto;
                    width: 80%;
                    max-width: 600px;
                    border: 4px solid #ffffff;
                    background: #000000;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                #ut-user-input {
                    width: 95%;
                    height: 90%;
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    font-size: 16px;
                    padding: 10px;
                    resize: none;
                    outline: none;
                }

                #ut-user-input::placeholder {
                    color: #888888;
                }

                #ut-game-canvas {
                    width: 100%;
                    height: 100%;
                }

                /* 하단: 상태 및 커맨드 (15%) */
                #ut-bottom-hud {
                    height: 15%;
                    padding: 10px 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .status-bar {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    font-size: 18px;
                    margin-bottom: 10px;
                }

                .status-lv {
                    font-weight: bold;
                }

                .status-hp {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .hp-bar-container {
                    width: 200px;
                    height: 20px;
                    border: 2px solid #ffffff;
                    background: #000000;
                    position: relative;
                }

                .hp-bar-fill {
                    height: 100%;
                    background: #ffff00;
                    transition: width 0.3s ease;
                }

                .command-buttons {
                    display: flex;
                    gap: 30px;
                    justify-content: center;
                }

                .cmd-btn {
                    padding: 10px 20px;
                    font-size: 18px;
                    cursor: pointer;
                    position: relative;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    background: transparent;
                    border: none;
                    color: #ffffff;
                }

                .cmd-btn.selected {
                    color: #ffff00;
                }

                .cmd-btn.selected::before {
                    content: '❤️';
                    position: absolute;
                    left: -25px;
                    top: 50%;
                    transform: translateY(-50%);
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
                    border: 4px solid #ffffff;
                    padding: 20px;
                    z-index: ${Z_INDEX + 1};
                    min-width: 300px;
                }

                .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .item-list li {
                    padding: 10px;
                    cursor: pointer;
                }

                .item-list li.selected {
                    color: #ffff00;
                }

                .item-list li.selected::before {
                    content: '❤️ ';
                }
            </style>

            <div id="ut-log-container">
                <div class="log-message">대화 내용이 여기에 표시됩니다...</div>
            </div>

            <div id="ut-middle-box">
                <textarea id="ut-user-input" placeholder="행동이나 대사를 입력하세요..."></textarea>
                <canvas id="ut-game-canvas" class="hidden"></canvas>
            </div>

            <div id="ut-bottom-hud">
                <div class="status-bar">
                    <span class="status-lv">LV ${state.lv}</span>
                    <div class="status-hp">
                        <span>HP</span>
                        <div class="hp-bar-container">
                            <div class="hp-bar-fill" style="width: 100%;"></div>
                        </div>
                        <span class="hp-text">${state.hp} / ${state.maxHp}</span>
                    </div>
                    <span class="status-kr">KR</span>
                </div>
                <div class="command-buttons">
                    <button class="cmd-btn selected" data-index="0">FIGHT</button>
                    <button class="cmd-btn" data-index="1">ACT</button>
                    <button class="cmd-btn" data-index="2">ITEM</button>
                    <button class="cmd-btn" data-index="3">MERCY</button>
                </div>
            </div>

            <div id="ut-item-popup" class="hidden">
                <ul class="item-list">
                    <li class="selected" data-item="포션">포션 - HP 20 회복</li>
                    <li data-item="엘릭서">엘릭서 - HP 전체 회복</li>
                    <li data-item="붕대">붕대 - HP 10 회복</li>
                </ul>
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
        
        // 눈 모양 타원 (중앙)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width * 0.35, height * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // 중앙선 (타겟)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 5, height / 2 - height * 0.25);
        ctx.lineTo(width / 2 - 5, height / 2 + height * 0.25);
        ctx.moveTo(width / 2 + 5, height / 2 - height * 0.25);
        ctx.lineTo(width / 2 + 5, height / 2 + height * 0.25);
        ctx.stroke();
        
        // 움직이는 흰색 막대
        const barX = (width * 0.15) + (state.barPosition * width * 0.7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX - 3, height / 2 - height * 0.25, 6, height * 0.5);
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
        popup.classList.remove('hidden');
        
        let selectedItem = 0;
        const items = popup.querySelectorAll('.item-list li');
        
        function updateItemSelection() {
            items.forEach((item, idx) => {
                if (idx === selectedItem) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        const itemHandler = (e) => {
            if (KEYS.UP.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                selectedItem = Math.max(0, selectedItem - 1);
                updateItemSelection();
            } else if (KEYS.DOWN.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                selectedItem = Math.min(items.length - 1, selectedItem + 1);
                updateItemSelection();
            } else if (KEYS.CONFIRM.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                
                const itemName = items[selectedItem].dataset.item;
                const finalText = `* ${itemName}을(를) 사용했다. HP가 회복되었다.`;
                sendMessageToChat(finalText);
                
                popup.classList.add('hidden');
                document.removeEventListener('keydown', itemHandler, true);
            } else if (KEYS.CANCEL.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                popup.classList.add('hidden');
                document.removeEventListener('keydown', itemHandler, true);
            }
        };
        
        document.addEventListener('keydown', itemHandler, true);
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
            nativeInput = document.querySelector(selector);
            if (nativeInput && nativeInput.id !== 'ut-user-input') break;
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
                sendButton = document.querySelector(selector);
                if (sendButton && !sendButton.closest('#ut-overlay-root')) break;
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
                    if (node.nodeType === 1 && node.id !== OVERLAY_ID) {
                        // AI 응답으로 보이는 요소 감지
                        if (node.matches && (
                            node.matches('[class*="message"]') ||
                            node.matches('[class*="chat"]') ||
                            node.matches('[role="article"]')
                        )) {
                            const text = node.textContent || '';
                            const images = node.querySelectorAll('img');
                            
                            if (text.trim() && !text.includes('ut-overlay-root')) {
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
