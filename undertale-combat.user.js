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
                @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
                
                #ut-overlay-root {
                    position: fixed;
                    inset: 0;
                    padding: 26px;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at 50% 28%, #0f162b 0%, #05070d 45%, #010103 100%);
                    color: #f7f9ff;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    font-size: 16px;
                    z-index: ${Z_INDEX};
                    display: flex;
                    justify-content: center;
                    align-items: stretch;
                    overflow: hidden;
                    user-select: none;
                    letter-spacing: 0.2px;
                }

                #ut-overlay-root * {
                    box-sizing: border-box;
                }

                #ut-overlay-root::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(90deg, rgba(102, 209, 255, 0.06) 1px, transparent 1px),
                        linear-gradient(0deg, rgba(102, 209, 255, 0.06) 1px, transparent 1px);
                    background-size: 42px 42px;
                    opacity: 0.6;
                    pointer-events: none;
                }

                #ut-overlay-root::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, transparent 0%, transparent 45%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.8) 100%);
                    pointer-events: none;
                }

                #ut-frame {
                    position: relative;
                    width: min(1180px, 100%);
                    height: calc(100% - 12px);
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.82);
                    border: 3px solid #7be0ff;
                    border-radius: 14px;
                    box-shadow:
                        0 0 0 2px #0d3b5c,
                        0 0 24px rgba(66, 173, 255, 0.45),
                        inset 0 0 20px rgba(123, 224, 255, 0.25);
                    overflow: hidden;
                }

                .ut-scanlines {
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        to bottom,
                        rgba(255, 255, 255, 0.03),
                        rgba(255, 255, 255, 0.03) 3px,
                        transparent 3px,
                        transparent 6px
                    );
                    mix-blend-mode: screen;
                    opacity: 0.45;
                    pointer-events: none;
                    animation: scan-move 12s linear infinite;
                }

                @keyframes scan-move {
                    from { background-position-y: 0; }
                    to { background-position-y: 120px; }
                }

                #ut-top-bar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 2px solid #66d1ff;
                    border-radius: 10px;
                    padding: 10px 14px;
                    background: linear-gradient(90deg, rgba(91, 196, 255, 0.18), rgba(255, 255, 255, 0.05));
                    box-shadow:
                        0 0 12px rgba(102, 209, 255, 0.3) inset,
                        0 10px 20px rgba(0,0,0,0.35),
                        0 0 20px rgba(102, 209, 255, 0.35);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    z-index: 2;
                }

                #ut-top-bar .ut-badge {
                    color: #9de2ff;
                    font-size: 13px;
                }

                #ut-top-bar .ut-top-status {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                /* 로그 카드 */
                #ut-log-card {
                    flex: 1;
                    min-height: 260px;
                    display: flex;
                    flex-direction: column;
                    background: #05070d;
                    border: 2px solid #66d1ff;
                    border-radius: 12px;
                    box-shadow:
                        0 6px 22px rgba(0,0,0,0.45),
                        0 0 18px rgba(102, 209, 255, 0.18);
                    overflow: hidden;
                    position: relative;
                }

                .panel-heading {
                    font-size: 12px;
                    letter-spacing: 2px;
                    color: #66d1ff;
                    padding: 8px 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: linear-gradient(90deg, rgba(102, 209, 255, 0.2), rgba(5, 7, 13, 0.95));
                    text-shadow: 0 0 8px rgba(102, 209, 255, 0.45);
                }

                #ut-log-container {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background: linear-gradient(180deg, rgba(7, 11, 20, 0.82), rgba(5, 7, 13, 0.96));
                    scrollbar-width: thin;
                    scrollbar-color: #66d1ff #020305;
                }

                #ut-log-container::-webkit-scrollbar {
                    width: 10px;
                }

                #ut-log-container::-webkit-scrollbar-track {
                    background: #020305;
                }

                #ut-log-container::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #66d1ff, #1b86ff);
                    border-radius: 6px;
                }

                .log-message {
                    margin-bottom: 14px;
                    line-height: 1.6;
                    word-wrap: break-word;
                    padding: 10px 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(102, 209, 255, 0.25);
                    box-shadow: 0 0 14px rgba(102, 209, 255, 0.08);
                }

                .log-message.from-player {
                    color: #ffe57a;
                    border-color: rgba(255, 207, 102, 0.5);
                    box-shadow: 0 0 14px rgba(255, 207, 102, 0.12);
                }

                .log-message img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 10px 0;
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }

                /* 중단: 전투 박스 */
                #ut-middle-box {
                    min-height: 240px;
                    width: 100%;
                    border: 4px solid #ffffff;
                    border-radius: 12px;
                    background:
                        radial-gradient(circle at 50% 35%, rgba(103, 197, 255, 0.14), transparent 38%),
                        radial-gradient(circle at 30% 60%, rgba(255, 255, 255, 0.12), transparent 38%),
                        #000000;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow:
                        0 0 0 3px rgba(102, 209, 255, 0.5),
                        0 0 18px rgba(123, 224, 255, 0.35),
                        inset 0 0 12px rgba(255, 255, 255, 0.08);
                    overflow: hidden;
                }

                #ut-middle-box::before,
                #ut-middle-box::after {
                    content: '';
                    position: absolute;
                    inset: 8px;
                    border: 2px dashed rgba(255, 255, 255, 0.2);
                    pointer-events: none;
                }

                #ut-middle-box::after {
                    inset: 16px;
                    border-style: solid;
                    border-color: rgba(123, 224, 255, 0.35);
                    filter: drop-shadow(0 0 12px rgba(123, 224, 255, 0.4));
                }

                .ut-heart-marker {
                    position: absolute;
                    bottom: 18px;
                    right: 18px;
                    font-size: 22px;
                    color: #ff6b6b;
                    opacity: 0.85;
                    animation: heartFloat 3s ease-in-out infinite;
                    pointer-events: none;
                    text-shadow: 0 0 10px rgba(255, 107, 107, 0.6);
                    z-index: 2;
                }

                @keyframes heartFloat {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                    100% { transform: translateY(0); }
                }

                #ut-user-input {
                    width: 92%;
                    height: 82%;
                    background: rgba(0, 0, 0, 0.72);
                    border: 2px solid rgba(255, 255, 255, 0.35);
                    color: #e9f5ff;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    font-size: 18px;
                    padding: 12px;
                    resize: none;
                    outline: none;
                    box-shadow:
                        inset 0 0 18px rgba(102, 209, 255, 0.15),
                        0 0 0 2px rgba(123, 224, 255, 0.28);
                    border-radius: 8px;
                    position: relative;
                    z-index: 1;
                }

                #ut-user-input::placeholder {
                    color: #9fb4c8;
                }

                #ut-game-canvas {
                    width: 96%;
                    height: 86%;
                    background: transparent;
                    z-index: 1;
                }

                /* 하단: 상태 및 커맨드 */
                #ut-bottom-hud {
                    padding: 12px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    border: 2px solid #66d1ff;
                    border-radius: 10px;
                    background: linear-gradient(90deg, rgba(102, 209, 255, 0.16), rgba(5, 7, 13, 0.92));
                    box-shadow:
                        0 0 0 2px rgba(13, 59, 92, 0.8),
                        0 10px 22px rgba(0,0,0,0.35);
                }

                .status-bar {
                    display: flex;
                    align-items: center;
                    gap: 22px;
                    font-size: 18px;
                }

                .status-lv {
                    font-weight: bold;
                    color: #b6e8ff;
                    letter-spacing: 1px;
                }

                .status-hp {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .hp-bar-container {
                    width: 220px;
                    height: 20px;
                    border: 2px solid #ffffff;
                    background: #000000;
                    position: relative;
                    box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.12);
                }

                .hp-bar-container.slim {
                    width: 200px;
                    height: 16px;
                }

                .hp-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #f2e92b, #ffb347);
                    box-shadow: 0 0 12px rgba(255, 231, 59, 0.65);
                    transition: width 0.3s ease;
                }

                .hp-text {
                    color: #fffbe7;
                    text-shadow: 0 0 6px rgba(255, 231, 59, 0.65);
                }

                .status-kr {
                    padding: 4px 10px;
                    border: 2px solid #ffffff;
                    border-radius: 6px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.08);
                }

                .status-kr.pill {
                    padding: 6px 12px;
                    background: rgba(123, 224, 255, 0.18);
                    border-color: rgba(123, 224, 255, 0.8);
                }

                .command-buttons {
                    display: flex;
                    gap: 28px;
                    justify-content: center;
                }

                .cmd-btn {
                    padding: 12px 22px;
                    font-size: 18px;
                    cursor: pointer;
                    position: relative;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    background: rgba(0, 0, 0, 0.6);
                    border: 2px solid rgba(255, 255, 255, 0.45);
                    color: #e7f7ff;
                    letter-spacing: 1px;
                    border-radius: 10px;
                    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
                    box-shadow: 0 6px 14px rgba(0,0,0,0.35);
                }

                .cmd-btn:hover {
                    transform: translateY(-2px);
                    border-color: #66d1ff;
                    box-shadow: 0 12px 20px rgba(0,0,0,0.4), 0 0 12px rgba(102, 209, 255, 0.35);
                }

                .cmd-btn.selected {
                    color: #ffff8f;
                    border-color: #ffff8f;
                    box-shadow:
                        0 12px 22px rgba(0,0,0,0.45),
                        0 0 12px rgba(255, 235, 130, 0.45);
                }

                .cmd-btn.selected::before {
                    content: '❤';
                    position: absolute;
                    left: -18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #ff6b6b;
                    text-shadow: 0 0 10px rgba(255, 107, 107, 0.55);
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
                    background: rgba(5, 7, 13, 0.98);
                    border: 4px solid #66d1ff;
                    padding: 20px;
                    z-index: ${Z_INDEX + 1};
                    min-width: 320px;
                    border-radius: 12px;
                    box-shadow:
                        0 0 0 2px #0d3b5c,
                        0 18px 28px rgba(0, 0, 0, 0.45),
                        0 0 16px rgba(102, 209, 255, 0.35);
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
                    border-radius: 8px;
                    border: 1px solid rgba(123, 224, 255, 0.5);
                    background: rgba(255, 255, 255, 0.04);
                    color: #e7f7ff;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    font-size: 14px;
                }

                .item-add button {
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 2px solid #66d1ff;
                    background: rgba(123, 224, 255, 0.15);
                    color: #e7f7ff;
                    cursor: pointer;
                    font-family: 'DotGothic16', 'Courier New', monospace;
                    transition: background 0.12s ease, transform 0.12s ease;
                }

                .item-add button:hover {
                    background: rgba(123, 224, 255, 0.28);
                    transform: translateY(-1px);
                }

                .item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .item-list li {
                    padding: 10px;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: background 0.15s ease;
                }

                .item-list li:hover {
                    background: rgba(123, 224, 255, 0.08);
                }

                .item-list li.selected {
                    color: #ffff8f;
                    background: rgba(255, 235, 130, 0.08);
                    border: 1px solid rgba(255, 235, 130, 0.35);
                }

                .item-list li.selected::before {
                    content: '❤ ';
                }
            </style>

            <div id="ut-frame">
                <div class="ut-scanlines"></div>

                <div id="ut-top-bar">
                    <div class="ut-badge">C2 // SANS FIGHT SIM</div>
                    <div class="ut-top-status">
                        <span class="status-lv">LV ${state.lv}</span>
                        <div class="status-hp">
                            <span class="hp-label">HP</span>
                            <div class="hp-bar-container slim">
                                <div class="hp-bar-fill" style="width: 100%;"></div>
                            </div>
                            <span class="hp-text">${state.hp} / ${state.maxHp}</span>
                        </div>
                        <span class="status-kr pill">KR</span>
                    </div>
                </div>

                <div id="ut-log-card">
                    <div class="panel-heading">DIALOG FEED // BATTLE CHANNEL</div>
                    <div id="ut-log-container">
                        <div class="log-message">대화 내용이 여기에 표시됩니다...</div>
                    </div>
                </div>

                <div id="ut-middle-box">
                    <div class="ut-heart-marker">❤</div>
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
