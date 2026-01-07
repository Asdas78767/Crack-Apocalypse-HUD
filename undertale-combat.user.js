// ==UserScript==
// @name         Undertale Style AI Chat Combat Overlay
// @namespace    https://github.com/Asdas78767/Crack-Apocalypse-HUD
// @version      1.6.8
// @description  언더테일 스타일 전투 UI (외부 이미지, CSS 막대 커서, hover 하트, 선택 외곽선 없음, LV/HP 조절 저장, BGM 반복, 아이템 취소, WASD 이동 제거, 기본 LV20 HP99/99, CHARA 흰색, 컴팩트 UI, UI 숨김 시 키패스)
// @autor        Asdas78767
// @match        https://crack.wrtn.ai/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const OVERLAY_ID = 'ut-overlay-root';
    const WINDOW_ID = 'ut-window';
    const Z_INDEX = 9999;
    const BGM_IFRAME_ID = 'ut-bgm-iframe';
    const STORAGE_KEY = 'ut-overlay-settings-v1';
    const STORAGE_BGM_KEY = 'ut-overlay-bgm-v1';

    const ASSET = {
        targetBar: 'https://i.ifh.cc/GkBrsc.png',
        heart:     'https://i.ifh.cc/pF8sGP.png',
        fight:     'https://i.ifh.cc/GnTODZ.png',
        act:       'https://i.ifh.cc/q15wco.png',
        item:      'https://i.ifh.cc/v5qNts.png',
        mercy:     'https://i.ifh.cc/FwOLMJ.png'
    };

    // 화살표만 사용 (WASD 제거)
    const KEYS = {
        UP: ['ArrowUp'],
        DOWN: ['ArrowDown'],
        LEFT: ['ArrowLeft'],
        RIGHT: ['ArrowRight'],
        CONFIRM: ['Enter', 'z', 'Z'],
        CANCEL: ['Shift', 'x', 'X']
    };

    const MODE = { INPUT: 'input', FIGHT: 'fight' };
    const COMMANDS = ['FIGHT', 'ACT', 'ITEM', 'MERCY'];

    const JUDGMENT = {
        PERFECT: { max: 0.05, text: '...효과는 치명적이었다!' },
        GREAT:   { max: 0.20, text: '...효과는 굉장했다!' },
        GOOD:    { max: 0.50, text: '...효과는 평범했다.' },
        BAD:     { max: 0.80, text: '...효과는 미미했다...' },
        MISS:    { max: 1.00, text: '...그러나 공격은 빗나갔다!' }
    };

    const state = {
        currentMode: MODE.INPUT,
        selectedCommand: 0,
        userInput: '',
        hp: 99,
        maxHp: 99,
        lv: 20,
        stats: {
            atkBase: 38,
            defBase: 4,
            atkEquip: 99,
            defEquip: 99,
            weapon: '진짜 칼',
            armor: '로켓',
            weaponInv: '나뭇가지(0), 장난감 칼(3), 질긴 장갑(5), 튼튼한 반다나(7), 찢어진 공책(2), 빈 권총(12), 녹슨 칼(15), 단도(15)',
            armorInv: '낡은 붕대(0), 빛바랜 리본(3), 심술궂은 반다나(7), 낡은 가슴장식(10), 흐린 안경(6), 에이프런(11), 카우보이 모자(12), 메달(15), 테미 갑옷(20)'
        },
        chatHistory: [],
        gameActive: false,
        items: [],
        lastBgm: null
    };

    let observer = null;

    function cssForImages() {
        const use = (url) => `url('${url}')`;
        return `
            .target-bar {
                position: relative;
                width: 95%;
                height: 110px;
                border: 3px solid #fff;
                background: #000;
                overflow: hidden;
                background-image: ${use(ASSET.targetBar)};
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            }
            .target-bar::after {
                content: '';
                position: absolute;
                top: 0; bottom: 0;
                left: 45%; width: 10%;
                background: rgba(255, 255, 0, 0.15);
                border-left: 2px solid #ffff00;
                border-right: 2px solid #ffff00;
            }
            .attack-cursor {
                position: absolute;
                top: -8px;
                width: 8px;
                height: 130px;
                background: #ff3b3b;
                box-shadow: 0 0 8px #ff3b3b;
                left: 3%;
                animation: moveCursor 1.5s linear infinite alternate;
            }
            @keyframes moveCursor { 0% { left: 3%; } 100% { left: 93%; } }

            .cmd-btn { background-size: 100% auto; background-repeat: no-repeat; }
            .cmd-btn[data-index="0"] { background-image: ${use(ASSET.fight)}; }
            .cmd-btn[data-index="1"] { background-image: ${use(ASSET.act)}; }
            .cmd-btn[data-index="2"] { background-image: ${use(ASSET.item)}; }
            .cmd-btn[data-index="3"] { background-image: ${use(ASSET.mercy)}; }
            .cmd-btn:hover { background-position: 0 53%; }
            .cmd-btn:hover::before {
                content: '';
                position: absolute;
                top: 8px; left: 6px;
                width: 20px; height: 20px;
                background: #000;
                background-image: ${use(ASSET.heart)};
                background-size: contain;
                background-repeat: no-repeat;
            }
        `;
    }

    function createOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                :root { --yellow: #ffff00; --red: #ff0000; }

                #${OVERLAY_ID} { position: fixed; inset: 0; pointer-events: none; z-index: ${Z_INDEX}; }
                #${WINDOW_ID} {
                    position: fixed;
                    width: 620px;
                    background: rgba(0,0,0,0.95);
                    border: 3px solid #fff;
                    box-shadow: 0 10px 24px rgba(0,0,0,0.55);
                    pointer-events: auto;
                    user-select: none;
                }
                .ut-drag-handle {
                    display: flex; align-items: center; justify-content: space-between;
                    background: #000; color: #fff; border-bottom: 3px solid #fff;
                    padding: 8px 12px; font-family: 'Press Start 2P', cursive; font-size: 11px;
                    cursor: move;
                }
                .ut-drag-title { letter-spacing: 1px; }
                .ut-controls { display: flex; align-items: center; gap: 8px; }
                .ut-gear-btn {
                    background: #000; color: #fff; border: 2px solid #fff;
                    padding: 3px 7px; font-family: 'Press Start 2P', cursive; font-size: 10px;
                    cursor: pointer; user-select: none;
                }
                .ut-gear-btn:hover { border-color: var(--yellow); color: var(--yellow); }
                .ut-toggle-btn {
                    position: fixed; top: 12px; right: 12px;
                    background: #000; color: #fff; border: 2px solid #fff;
                    padding: 6px 10px; font-family: 'Press Start 2P', cursive; font-size: 11px;
                    cursor: pointer; z-index: ${Z_INDEX + 1}; user-select: none; pointer-events: auto;
                }
                .ut-toggle-btn:hover { border-color: var(--yellow); color: var(--yellow); }

                #ut-frame { position: relative; width: 100%; display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 16px; box-sizing: border-box; }
                .dialogue-container {
                    width: 100%; height: 130px; border: 3px solid #fff;
                    margin-bottom: 10px; position: relative; padding: 20px;
                    font-size: 17px; line-height: 1.5; background: #000;
                    overflow-y: auto; overflow-x: hidden;
                }
                .dialogue-container::-webkit-scrollbar { width: 7px; }
                .dialogue-container::-webkit-scrollbar-track { background: #000; }
                .dialogue-container::-webkit-scrollbar-thumb { background: #fff; }
                .log-message { margin-bottom: 8px; line-height: 1.5; word-wrap: break-word; }
                .log-message.from-player { color: var(--yellow); }
                .asterisk { margin-right: 12px; vertical-align: top; }

                .attack-screen { width: 100%; height: 100%; position: absolute; top:0; left:0; background: #000; display: none; align-items: center; justify-content: center; z-index: 10; }
                .attack-screen.hidden { display: none; }
                .show-attack .dialogue-text { display: none; }
                .show-attack .attack-screen { display: flex; }

                #ut-middle-box {
                    min-height: 130px; width: 100%; border: 3px solid #fff; background: #000;
                    position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;
                }
                #ut-user-input {
                    width: 92%; height: 80%; background: rgba(0,0,0,0.9);
                    border: 2px solid rgba(255,255,255,0.35); color: #fff;
                    font-family: 'Press Start 2P', cursive; font-size: 13px;
                    padding: 10px; resize: none; outline: none; z-index: 1;
                }
                #ut-user-input::placeholder { color: #999; }

                #ut-bottom-hud { display: flex; flex-direction: column; gap: 14px; }
                .status-bar { display: flex; align-items: center; gap: 24px; font-size: 18px; font-weight: bold; padding-left: 4px; }
                .name { margin-right: 0; color: #fff; }
                .status-lv { color: #fff; letter-spacing: 1px; }
                .status-hp { display: flex; align-items: center; gap: 10px; }
                .hp-label { font-size: 13px; margin-top: 4px; }
                .hp-bar-container { width: 180px; height: 18px; background: var(--red); position: relative; }
                .hp-bar-fill { height: 100%; background: var(--yellow); transition: width 0.3s ease; }
                .hp-text { color: #fff; }

                .command-buttons { display: flex; gap: 8px; justify-content: space-between; }
                .cmd-btn {
                    width: 104px; height: 34px; font-size: 11px; letter-spacing: 1px;
                    cursor: pointer; position: relative; font-family: 'Press Start 2P', cursive;
                    background: #000; color: transparent;
                    border: 0; outline: none; box-shadow: none;
                    transition: background 0.1s ease, color 0.1s ease;
                }
                .cmd-btn:hover { color: transparent; }
                .cmd-btn.selected { box-shadow: none; }
                .cmd-btn.selected::after { content: none; }

                .hidden { display: none !important; }

                .ut-stat-panel {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px 10px;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid rgba(255,255,255,0.25);
                    padding: 8px 10px;
                    font-size: 11px;
                    color: #fff;
                    letter-spacing: 0.5px;
                }
                .ut-stat-row { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .ut-stat-row strong { color: var(--yellow); }
                #ut-weapon-inv, #ut-armor-inv { grid-column: span 2; font-size: 10px; }

                #ut-item-popup {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: #000; border: 3px solid #fff; padding: 14px; z-index: ${Z_INDEX + 1};
                    min-width: 300px; display: flex; flex-direction: column; gap: 10px;
                }
                .item-add { display: flex; gap: 8px; }
                .item-add input {
                    flex: 1; padding: 8px; border: 2px solid #fff; background: #000; color: #fff;
                    font-family: 'Press Start 2P', cursive; font-size: 12px;
                }
                .item-add button {
                    padding: 8px 10px; border: 2px solid #fff; background: #000; color: #fff;
                    cursor: pointer; font-family: 'Press Start 2P', cursive; font-size: 12px;
                }
                .item-add button:hover { background: #fff; color: #000; }
                .item-list { list-style: none; padding: 0; margin: 0; max-height: 170px; overflow-y: auto; }
                .item-list li { padding: 8px; cursor: pointer; transition: background 0.15s ease; }
                .item-list li:hover { background: rgba(255,255,255,0.1); }
                .item-list li.selected { color: var(--yellow); background: rgba(255,255,0,0.1); border: 1px solid var(--yellow); }
                .item-list li.selected::before { content: '❤ '; color: var(--red); }

                #ut-settings {
                    position: absolute;
                    top: 42px; right: 10px;
                    background: #000;
                    border: 3px solid #fff;
                    padding: 10px;
                    display: none;
                    flex-direction: column;
                    gap: 8px;
                    width: 210px;
                    z-index: ${Z_INDEX + 2};
                }
                #ut-settings label {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                    color: #fff;
                }
                #ut-settings input {
                    width: 90px;
                    padding: 6px;
                    background: #000;
                    color: #fff;
                    border: 2px solid #fff;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 11px;
                }
                #ut-settings button {
                    padding: 6px 8px;
                    background: #000;
                    color: #fff;
                    border: 2px solid #fff;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 11px;
                    cursor: pointer;
                }
                #ut-settings button:hover { background: #fff; color: #000; }
                ${cssForImages()}
            </style>

            <div id="${OVERLAY_ID}">
                <div id="${WINDOW_ID}">
                    <div class="ut-drag-handle">
                        <span class="ut-drag-title">UNDERTALE COMBAT</span>
                        <div class="ut-controls">
                            <button class="ut-gear-btn" id="ut-gear-btn">⚙</button>
                        </div>
                    </div>
                    <div id="ut-frame">
                        <div class="dialogue-container" id="dialogueBox">
                            <div class="dialogue-text" id="ut-log-container">
                                <div class="log-message"><span class="asterisk">*</span>대화 내용이 여기에 표시됩니다...</div>
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
                                <span class="status-lv" id="ut-lv-text">LV ${state.lv}</span>
                                <div class="status-hp">
                                    <span class="hp-label">HP</span>
                                    <div class="hp-bar-container"><div class="hp-bar-fill" id="ut-hp-fill" style="width: 100%;"></div></div>
                                    <span class="hp-text" id="ut-hp-text">${state.hp} / ${state.maxHp}</span>
                                </div>
                            </div>
                            <div class="ut-stat-panel" id="ut-stat-panel">
                                <div class="ut-stat-row" id="ut-base-stats"></div>
                                <div class="ut-stat-row" id="ut-total-atk"></div>
                                <div class="ut-stat-row" id="ut-total-def"></div>
                                <div class="ut-stat-row" id="ut-equip-info"></div>
                                <div class="ut-stat-row" id="ut-weapon-inv"></div>
                                <div class="ut-stat-row" id="ut-armor-inv"></div>
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
                            <div style="display:flex; gap:8px; justify-content:flex-end;">
                                <button id="ut-item-cancel" style="padding:6px 10px; border:2px solid #fff; background:#000; color:#fff; font-family:'Press Start 2P', cursive; font-size:11px; cursor:pointer;">취소</button>
                            </div>
                        </div>

                        <div id="ut-settings">
                            <label>LV <input type="number" id="ut-set-lv" min="1" value="${state.lv}"></label>
                            <label>Max HP <input type="number" id="ut-set-maxhp" min="1" value="${state.maxHp}"></label>
                            <label>HP <input type="number" id="ut-set-hp" min="0" value="${state.hp}"></label>
                            <label>ATK Base <input type="number" id="ut-set-atk-base" min="0" value="${state.stats.atkBase}"></label>
                            <label>ATK Equip <input type="number" id="ut-set-atk-eq" min="0" value="${state.stats.atkEquip}"></label>
                            <label>DEF Base <input type="number" id="ut-set-def-base" min="0" value="${state.stats.defBase}"></label>
                            <label>DEF Equip <input type="number" id="ut-set-def-eq" min="0" value="${state.stats.defEquip}"></label>
                            <label>Weapon <input type="text" id="ut-set-weapon" value="${state.stats.weapon}"></label>
                            <label>Armor <input type="text" id="ut-set-armor" value="${state.stats.armor}"></label>
                            <label>무기 보유 <input type="text" id="ut-set-weapon-inv" value="${state.stats.weaponInv}"></label>
                            <label>악세 보유 <input type="text" id="ut-set-armor-inv" value="${state.stats.armorInv}"></label>
                            <button id="ut-settings-apply">적용</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'ut-toggle-btn';
        toggleBtn.id = 'ut-toggle';
        toggleBtn.textContent = 'UI 숨기기';
        document.body.appendChild(toggleBtn);

        loadSettingsFromStorage();
        centerWindow();
        enableDrag();
        initializeEventListeners();
        startChatObserver();
        updateStatusUI();
        if (state.lastBgm) startBgm(state.lastBgm);
    }

    function loadSettingsFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (typeof saved.lv === 'number') state.lv = Math.max(1, saved.lv);
                if (typeof saved.maxHp === 'number') state.maxHp = Math.max(1, saved.maxHp);
                if (typeof saved.hp === 'number') state.hp = Math.min(state.maxHp, Math.max(0, saved.hp));
                if (saved.stats) {
                    state.stats.atkBase = Math.max(0, saved.stats.atkBase ?? state.stats.atkBase);
                    state.stats.defBase = Math.max(0, saved.stats.defBase ?? state.stats.defBase);
                    state.stats.atkEquip = Math.max(0, saved.stats.atkEquip ?? state.stats.atkEquip);
                    state.stats.defEquip = Math.max(0, saved.stats.defEquip ?? state.stats.defEquip);
                    state.stats.weapon = saved.stats.weapon || state.stats.weapon;
                    state.stats.armor = saved.stats.armor || state.stats.armor;
                    state.stats.weaponInv = saved.stats.weaponInv || state.stats.weaponInv;
                    state.stats.armorInv = saved.stats.armorInv || state.stats.armorInv;
                }
            }
            const bgm = localStorage.getItem(STORAGE_BGM_KEY);
            if (bgm) state.lastBgm = bgm;
        } catch (e) { console.warn('[UT Overlay] failed to load settings', e); }
    }

    function saveSettingsToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                lv: state.lv,
                maxHp: state.maxHp,
                hp: state.hp,
                stats: { ...state.stats }
            }));
            if (state.lastBgm) localStorage.setItem(STORAGE_BGM_KEY, state.lastBgm);
        } catch (e) { console.warn('[UT Overlay] failed to save settings', e); }
    }

    function centerWindow() { const win=document.getElementById(WINDOW_ID); if(!win)return; requestAnimationFrame(()=>{const rect=win.getBoundingClientRect(); const left=Math.max(12,(window.innerWidth-rect.width)/2); const top=Math.max(12,(window.innerHeight-rect.height)/2); win.style.left=`${left}px`; win.style.top=`${top}px`;});}
    function enableDrag(){const win=document.getElementById(WINDOW_ID); const handle=win?.querySelector('.ut-drag-handle'); if(!win||!handle)return; let dragging=false,startX=0,startY=0,origX=0,origY=0; const onMouseDown=(e)=>{dragging=true;startX=e.clientX;startY=e.clientY;const rect=win.getBoundingClientRect();origX=rect.left;origY=rect.top;document.addEventListener('mousemove',onMouseMove,true);document.addEventListener('mouseup',onMouseUp,true);}; const onMouseMove=(e)=>{if(!dragging)return;e.preventDefault();const dx=e.clientX-startX;const dy=e.clientY-startY;const newX=Math.max(4,Math.min(window.innerWidth-80,origX+dx));const newY=Math.max(4,Math.min(window.innerHeight-80,origY+dy));win.style.left=`${newX}px`;win.style.top=`${newY}px`;}; const onMouseUp=()=>{dragging=false;document.removeEventListener('mousemove',onMouseMove,true);document.removeEventListener('mouseup',onMouseUp,true);}; handle.addEventListener('mousedown',onMouseDown,true);}

    function initializeEventListeners() {
        const toggleBtn = document.getElementById('ut-toggle');
        const overlayRoot = document.getElementById(OVERLAY_ID);
        toggleBtn?.addEventListener('click', () => {
            const isHidden = overlayRoot.classList.toggle('hidden');
            toggleBtn.textContent = isHidden ? 'UI 표시' : 'UI 숨기기';
        });

        window.addEventListener('resize', () => centerWindow());

        document.addEventListener('keydown', handleKeydown, true);

        const logContainer = document.getElementById('ut-log-container');
        logContainer?.addEventListener('wheel', (e) => e.stopPropagation(), true);

        const userInput = document.getElementById('ut-user-input');
        userInput?.addEventListener('input', (e) => {
            state.userInput = e.target.value;
            handleYouTubeFromText(state.userInput);
        });

        document.querySelectorAll('.cmd-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const idx = Number(e.currentTarget.dataset.index || 0);
                state.selectedCommand = Math.min(COMMANDS.length - 1, Math.max(0, idx));
                updateCommandButtons();
                handleConfirm();
            });
        });

        const gearBtn = document.getElementById('ut-gear-btn');
        const settings = document.getElementById('ut-settings');
        gearBtn?.addEventListener('click', () => {
            settings.style.display = settings.style.display === 'flex' ? 'none' : 'flex';
        });

        const applyBtn = document.getElementById('ut-settings-apply');
        applyBtn?.addEventListener('click', () => applySettings());

        document.addEventListener('mousedown', (e) => {
            if (!settings) return;
            if (settings.contains(e.target) || gearBtn.contains(e.target)) return;
            settings.style.display = 'none';
        }, true);

        const itemCancel = document.getElementById('ut-item-cancel');
        const itemPopup = document.getElementById('ut-item-popup');
        itemCancel?.addEventListener('click', () => itemPopup?.classList.add('hidden'));
    }

    function handleYouTubeFromText(text) {
        const videoId = extractYouTubeId(text || '');
        if (videoId) {
            state.lastBgm = videoId;
            saveSettingsToStorage();
            startBgm(videoId);
            addLogMessage(`*BGM 재생: https://youtu.be/${videoId}*`);
        }
        parseStatsFromNote(text);
    }

    function formatMessage(text) {
        let t = (text || '').trim();
        if (!t.startsWith('*')) t = `*${t}`;
        if (!t.endsWith('*')) t = `${t}*`;
        return t;
    }

    function parseStatsFromNote(rawText) {
        if (!rawText) return;
        const lines = [];
        const commentMatches = rawText.match(/\[\/\/\]:\s?#\s?\([^\)]+\)/g);
        if (commentMatches) {
            commentMatches.forEach((m) => {
                const inner = m.replace(/^\[\/\/\]:\s?#\s?\(/, '').replace(/\)$/, '');
                lines.push(inner);
            });
        } else {
            lines.push(rawText);
        }

        let updated = false;

        lines.forEach((line) => {
            // 레벨/HP
            const lvHp = line.match(/레벨:\s*(\d+)[^|]*\|\s*HP:\s*(\d+)\s*\/\s*(\d+)/);
            if (lvHp) {
                state.lv = Math.max(1, parseInt(lvHp[1], 10));
                state.hp = Math.max(0, parseInt(lvHp[2], 10));
                state.maxHp = Math.max(state.hp, parseInt(lvHp[3], 10));
                updated = true;
                return;
            }

            // 기본 능력치
            const base = line.match(/기본 능력치:\s*ATK\s*(\d+),\s*DEF\s*(\d+)/);
            if (base) {
                state.stats.atkBase = Math.max(0, parseInt(base[1], 10));
                state.stats.defBase = Math.max(0, parseInt(base[2], 10));
                updated = true;
                return;
            }

            // 총 능력치 (장비 포함)
            const total = line.match(/총 ATK:\s*([0-9]+)(?:\[\+([0-9]+)\])?.*총 DEF:\s*([0-9]+)(?:\[\+([0-9]+)\])?/);
            if (total) {
                // 총 = base + equip (단, UI 표시에서는 99 cap)
                const atkOverflow = parseInt(total[2] || '0', 10);
                const defOverflow = parseInt(total[4] || '0', 10);
                // 총 수치가 99[+X] 형태라면 base + equip = 99 + X
                const atkTotalRaw = parseInt(total[1], 10) + atkOverflow;
                const defTotalRaw = parseInt(total[3], 10) + defOverflow;
                // 장비 수치는 (총 - base) 로 역산 (음수 방지)
                state.stats.atkEquip = Math.max(0, atkTotalRaw - state.stats.atkBase);
                state.stats.defEquip = Math.max(0, defTotalRaw - state.stats.defBase);
                updated = true;
                return;
            }

            // 장착중 무기/방어구
            const equip = line.match(/장착중:\s*([^,(]+)\(ATK\+(\d+)\),\s*([^,(]+)\(DEF\+(\d+)\)/);
            if (equip) {
                state.stats.weapon = equip[1].trim();
                state.stats.atkEquip = Math.max(0, parseInt(equip[2], 10));
                state.stats.armor = equip[3].trim();
                state.stats.defEquip = Math.max(0, parseInt(equip[4], 10));
                updated = true;
                return;
            }

            const weaponInv = line.match(/무기 보유:\s*(.+)/);
            if (weaponInv) {
                state.stats.weaponInv = weaponInv[1].trim();
                updated = true;
                return;
            }

            const armorInv = line.match(/악세사리 보유:\s*(.+)/);
            if (armorInv) {
                state.stats.armorInv = armorInv[1].trim();
                updated = true;
                return;
            }
        });

        if (updated) {
            updateStatusUI();
            saveSettingsToStorage();
        }
    }

    function extractYouTubeId(str) {
        const rx1 = /youtu\.be\/([A-Za-z0-9_-]{6,})/;
        const rx2 = /youtube\.com\/.*[?&]v=([A-Za-z0-9_-]{6,})/;
        const m1 = rx1.exec(str);
        if (m1 && m1[1]) return m1[1];
        const m2 = rx2.exec(str);
        if (m2 && m2[1]) return m2[1];
        return null;
    }

    function startBgm(videoId) {
        if (!videoId) return;
        let iframe = document.getElementById(BGM_IFRAME_ID);
        const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = BGM_IFRAME_ID;
            iframe.style.position = 'fixed';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.allow = 'autoplay';
            document.body.appendChild(iframe);
        }
        iframe.src = src;
    }

    function applySettings() {
        const lvInput = document.getElementById('ut-set-lv');
        const maxInput = document.getElementById('ut-set-maxhp');
        const hpInput = document.getElementById('ut-set-hp');
        const atkBaseInput = document.getElementById('ut-set-atk-base');
        const atkEqInput = document.getElementById('ut-set-atk-eq');
        const defBaseInput = document.getElementById('ut-set-def-base');
        const defEqInput = document.getElementById('ut-set-def-eq');
        const weaponInput = document.getElementById('ut-set-weapon');
        const armorInput = document.getElementById('ut-set-armor');
        const weaponInvInput = document.getElementById('ut-set-weapon-inv');
        const armorInvInput = document.getElementById('ut-set-armor-inv');
        const newLv = Math.max(1, parseInt(lvInput.value || state.lv, 10));
        const newMax = Math.max(1, parseInt(maxInput.value || state.maxHp, 10));
        let newHp = parseInt(hpInput.value || state.hp, 10);
        newHp = isNaN(newHp) ? state.hp : newHp;
        newHp = Math.min(newMax, Math.max(0, newHp));
        const newAtkBase = Math.max(0, parseInt(atkBaseInput?.value || state.stats.atkBase, 10));
        const newAtkEq = Math.max(0, parseInt(atkEqInput?.value || state.stats.atkEquip, 10));
        const newDefBase = Math.max(0, parseInt(defBaseInput?.value || state.stats.defBase, 10));
        const newDefEq = Math.max(0, parseInt(defEqInput?.value || state.stats.defEquip, 10));
        state.lv = newLv;
        state.maxHp = newMax;
        state.hp = newHp;
        state.stats.atkBase = newAtkBase;
        state.stats.atkEquip = newAtkEq;
        state.stats.defBase = newDefBase;
        state.stats.defEquip = newDefEq;
        state.stats.weapon = weaponInput?.value || state.stats.weapon;
        state.stats.armor = armorInput?.value || state.stats.armor;
        state.stats.weaponInv = weaponInvInput?.value || state.stats.weaponInv;
        state.stats.armorInv = armorInvInput?.value || state.stats.armorInv;
        updateStatusUI();
        saveSettingsToStorage();
    }

    function handleKeydown(e) {
        const overlayRoot = document.getElementById(OVERLAY_ID);
        if (overlayRoot && overlayRoot.classList.contains('hidden')) return; // UI 숨김 시 키패스
        const userInput = document.getElementById('ut-user-input');
        const isTyping = userInput && document.activeElement === userInput;

        if (!isTyping && (KEYS.LEFT.includes(e.key) || KEYS.RIGHT.includes(e.key))) {
            e.preventDefault(); e.stopPropagation(); handleNavigation(e.key);
        }

        if (KEYS.CONFIRM.includes(e.key)) {
            e.preventDefault(); e.stopPropagation(); handleConfirm();
        }

        if (KEYS.CANCEL.includes(e.key)) {
            e.preventDefault(); e.stopPropagation(); handleCancel();
        }

        if (!isTyping && (KEYS.UP.includes(e.key) || KEYS.DOWN.includes(e.key))) {
            e.preventDefault(); e.stopPropagation();
        }
    }

    function handleNavigation(key) {
        if (KEYS.LEFT.includes(key)) state.selectedCommand = Math.max(0, state.selectedCommand - 1);
        else if (KEYS.RIGHT.includes(key)) state.selectedCommand = Math.min(COMMANDS.length - 1, state.selectedCommand + 1);
        updateCommandButtons();
    }

    function updateCommandButtons() {
        document.querySelectorAll('.cmd-btn').forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === state.selectedCommand);
        });
    }

    function handleConfirm() {
        const command = COMMANDS[state.selectedCommand];
        switch (command) {
            case 'FIGHT': return handleFightCommand();
            case 'ACT':   return handleActCommand();
            case 'ITEM':  return handleItemCommand();
            case 'MERCY': return handleMercyCommand();
        }
    }

    function handleCancel() {
        if (state.currentMode === MODE.FIGHT) switchToInputMode();
        const itemPopup = document.getElementById('ut-item-popup');
        if (itemPopup && !itemPopup.classList.contains('hidden')) itemPopup.classList.add('hidden');
    }

    function handleFightCommand() {
        if (!state.userInput.trim()) { addLogMessage('먼저 공격 행동을 입력하세요.'); return; }
        switchToFightMode();
    }

    function switchToFightMode() {
        state.currentMode = MODE.FIGHT;
        const dialogueBox = document.getElementById('dialogueBox');
        const attackScreen = dialogueBox?.querySelector('.attack-screen');
        dialogueBox?.classList.add('show-attack');
        attackScreen?.classList.remove('hidden');
        startImageMinigame();
    }

    function switchToInputMode() {
        state.currentMode = MODE.INPUT;
        const dialogueBox = document.getElementById('dialogueBox');
        const attackScreen = dialogueBox?.querySelector('.attack-screen');
        dialogueBox?.classList.remove('show-attack');
        attackScreen?.classList.add('hidden');
        state.gameActive = false;
    }

    function startImageMinigame() {
        state.gameActive = true;

        const stopHandler = (e) => {
            if (!state.gameActive) return;
            if (KEYS.CONFIRM.includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
                state.gameActive = false;
                document.removeEventListener('keydown', stopHandler, true);

                const cursor = document.querySelector('.attack-cursor');
                const container = cursor?.parentElement;
                if (cursor && container) {
                    const rect = cursor.getBoundingClientRect();
                    const crect = container.getBoundingClientRect();
                    const relativePos = (rect.left - crect.left) / crect.width;
                    const clamped = Math.max(0, Math.min(1, relativePos));
                    const judgment = calculateJudgment(clamped);
                    sendMessageToChat(`* ${state.userInput} ${judgment}*`);
                }

                switchToInputMode();
                state.userInput = '';
                const userInputEl = document.getElementById('ut-user-input');
                if (userInputEl) userInputEl.value = '';
            }
        };
        document.addEventListener('keydown', stopHandler, true);
    }

    function calculateJudgment(position) {
        const distance = Math.abs(position - 0.5) * 2;
        for (const value of Object.values(JUDGMENT)) if (distance <= value.max) return value.text;
        return JUDGMENT.MISS.text;
    }

    function handleActCommand() {
        if (!state.userInput.trim()) { addLogMessage('먼저 대사나 행동을 입력하세요.'); return; }
        sendMessageToChat(state.userInput);
        state.userInput = '';
        const userInputEl = document.getElementById('ut-user-input');
        if (userInputEl) userInputEl.value = '';
    }

    function handleItemCommand() {
        const popup = document.getElementById('ut-item-popup');
        if (!popup) return;
        popup.classList.remove('hidden');

        let selectedItem = 0;
        const itemListEl = popup.querySelector('.item-list');
        const addInput = document.getElementById('ut-item-input');
        const addBtn = document.getElementById('ut-item-add-btn');
        const cancelBtn = document.getElementById('ut-item-cancel');

        function updateItemSelection() {
            const items = itemListEl.querySelectorAll('li');
            items.forEach((item, idx) => item.classList.toggle('selected', idx === selectedItem));
        }

        function renderItemList(idx = 0) {
            if (!itemListEl) return;
            itemListEl.innerHTML = '';
            state.items.forEach((item, i) => {
                const li = document.createElement('li');
                li.dataset.item = item.name;
                li.textContent = item.desc ? `${item.name} - ${item.desc}` : item.name;
                if (i === idx) li.classList.add('selected');
                li.addEventListener('click', () => { selectedItem = i; updateItemSelection(); });
                itemListEl.appendChild(li);
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

        const inputKeyHandler = (e) => { if (e.key === 'Enter') { e.preventDefault(); addItemFromInput(); } };

        const itemKeyHandler = (e) => {
            const items = itemListEl.querySelectorAll('li');
            const lastIndex = Math.max(items.length - 1, 0);

            if (KEYS.UP.includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
                selectedItem = Math.max(0, selectedItem - 1); updateItemSelection();
            } else if (KEYS.DOWN.includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
                selectedItem = Math.min(lastIndex, selectedItem + 1); updateItemSelection();
            } else if (KEYS.CONFIRM.includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
                if (!state.items.length) {
                    addLogMessage('아이템이 없습니다. 먼저 추가하세요.');
                    cleanup(); popup.classList.add('hidden'); return;
                }
                const item = state.items[selectedItem] || state.items[0];
                const label = item.desc ? `${item.name} - ${item.desc}` : item.name;
                sendMessageToChat(`*${label}을(를) 사용했다. HP가 회복되었다.*`);
                popup.classList.add('hidden');
                cleanup();
            } else if (KEYS.CANCEL.includes(e.key)) {
                e.preventDefault(); e.stopPropagation();
                popup.classList.add('hidden');
                cleanup();
            }
        };

        function cleanup() {
            document.removeEventListener('keydown', itemKeyHandler, true);
            addBtn?.removeEventListener('click', addItemFromInput);
            addInput?.removeEventListener('keydown', inputKeyHandler);
            cancelBtn?.removeEventListener('click', cancelHandler);
        }

        const cancelHandler = () => {
            popup.classList.add('hidden');
            cleanup();
        };

        document.addEventListener('keydown', itemKeyHandler, true);
        addBtn?.addEventListener('click', addItemFromInput);
        addInput?.addEventListener('keydown', inputKeyHandler);
        cancelBtn?.addEventListener('click', cancelHandler);

        renderItemList(selectedItem);
        updateItemSelection();
    }

    function handleMercyCommand() {
        sendMessageToChat('* 자비를 베풀었다.*');
    }

    function sendMessageToChat(finalText) {
        const normalized = formatMessage(finalText);
        addLogMessage(`[YOU] ${normalized}`);

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
            if (element && element.id !== 'ut-user-input' && !element.closest(`#${OVERLAY_ID}`)) {
                nativeInput = element; break;
            }
        }

        if (nativeInput) {
            const isTextarea = nativeInput.tagName === 'TEXTAREA';
            const isContentEditable = nativeInput.contentEditable === 'true';

            if (isTextarea) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                setter?.call(nativeInput, normalized);
                nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (isContentEditable) {
                nativeInput.textContent = normalized;
                nativeInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const buttonSelectors = [
                'button[aria-label*="전송"]',
                'button[aria-label*="send"]',
                'button.send-message',
                'button[type="submit"]'
            ];
            for (const selector of buttonSelectors) {
                const element = document.querySelector(selector);
                if (element && !element.closest(`#${OVERLAY_ID}`)) { sendButton = element; break; }
            }
            if (sendButton) setTimeout(() => sendButton.click(), 100);
        } else {
            console.log('[Undertale Overlay] No native chat input found on page');
        }
    }

    function startChatObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    const el = /** @type {Element} */ (node);
                    if (el.closest && el.closest(`#${OVERLAY_ID}`)) return;

                    const looksLikeMessage =
                        el.matches('[class*="message"]') ||
                        el.matches('[class*="chat"]') ||
                        el.matches('[role="article"]');

                    if (!looksLikeMessage) return;

                    const text = (el.textContent || '').trim();
                    const images = el.querySelectorAll('img');
                    if (text) {
                        addLogMessage(text, images);
                        handleYouTubeFromText(text);
                        parseStatsFromNote(text);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function updateStatusUI() {
        const hpFill = document.getElementById('ut-hp-fill');
        const hpText = document.getElementById('ut-hp-text');
        const lvText = document.getElementById('ut-lv-text');
        const max = Math.max(1, state.maxHp);
        const hp = Math.min(max, Math.max(0, state.hp));
        state.hp = hp;
        const pct = Math.max(0, Math.min(100, (hp / max) * 100));
        if (hpFill) hpFill.style.width = `${pct}%`;
        if (hpText) hpText.textContent = `${hp} / ${max}`;
        if (lvText) lvText.textContent = `LV ${state.lv}`;

        const lvInput = document.getElementById('ut-set-lv');
        const maxInput = document.getElementById('ut-set-maxhp');
        const hpInput = document.getElementById('ut-set-hp');
        const atkBaseInput = document.getElementById('ut-set-atk-base');
        const atkEqInput = document.getElementById('ut-set-atk-eq');
        const defBaseInput = document.getElementById('ut-set-def-base');
        const defEqInput = document.getElementById('ut-set-def-eq');
        const weaponInput = document.getElementById('ut-set-weapon');
        const armorInput = document.getElementById('ut-set-armor');
        const weaponInvInput = document.getElementById('ut-set-weapon-inv');
        const armorInvInput = document.getElementById('ut-set-armor-inv');
        if (lvInput) lvInput.value = state.lv;
        if (maxInput) maxInput.value = state.maxHp;
        if (hpInput) hpInput.value = state.hp;
        if (atkBaseInput) atkBaseInput.value = state.stats.atkBase;
        if (atkEqInput) atkEqInput.value = state.stats.atkEquip;
        if (defBaseInput) defBaseInput.value = state.stats.defBase;
        if (defEqInput) defEqInput.value = state.stats.defEquip;
        if (weaponInput) weaponInput.value = state.stats.weapon;
        if (armorInput) armorInput.value = state.stats.armor;
        if (weaponInvInput) weaponInvInput.value = state.stats.weaponInv;
        if (armorInvInput) armorInvInput.value = state.stats.armorInv;

        const baseRow = document.getElementById('ut-base-stats');
        const totalAtkRow = document.getElementById('ut-total-atk');
        const totalDefRow = document.getElementById('ut-total-def');
        const equipRow = document.getElementById('ut-equip-info');
        const weaponInvRow = document.getElementById('ut-weapon-inv');
        const armorInvRow = document.getElementById('ut-armor-inv');
        const formatOverflow = (base, eq) => {
            const total = base + eq;
            if (total > 99) return `99[+${total - 99}]`;
            return String(total);
        };
        if (baseRow) baseRow.innerHTML = `기본 능력치: <strong>ATK ${state.stats.atkBase}</strong>, <strong>DEF ${state.stats.defBase}</strong>`;
        if (totalAtkRow) totalAtkRow.innerHTML = `총 ATK: <strong>${formatOverflow(state.stats.atkBase, state.stats.atkEquip)}</strong> (기본 ${state.stats.atkBase} + 장비 ${state.stats.atkEquip})`;
        if (totalDefRow) totalDefRow.innerHTML = `총 DEF: <strong>${formatOverflow(state.stats.defBase, state.stats.defEquip)}</strong> (기본 ${state.stats.defBase} + 장비 ${state.stats.defEquip})`;
        if (equipRow) equipRow.innerHTML = `장착중: ${state.stats.weapon}(ATK+${state.stats.atkEquip}), ${state.stats.armor}(DEF+${state.stats.defEquip})`;
        if (weaponInvRow) weaponInvRow.textContent = `무기 보유: ${state.stats.weaponInv}`;
        if (armorInvRow) armorInvRow.textContent = `악세사리 보유: ${state.stats.armorInv}`;
    }

    function addLogMessage(text, images = null) {
        const logContainer = document.getElementById('ut-log-container');
        if (!logContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'log-message';
        if ((text || '').trim().startsWith('[YOU]')) messageDiv.classList.add('from-player');
        messageDiv.textContent = text;
        if (images && images.length > 0) {
            images.forEach((img) => {
                const cloned = img.cloneNode(true);
                messageDiv.appendChild(cloned);
            });
        }
        logContainer.appendChild(messageDiv);
        logContainer.scrollTop = logContainer.scrollHeight;
        state.chatHistory.push({ text, images });
        parseStatsFromNote(text);
    }

    function init() {
        console.log('[Undertale Combat Overlay] 초기화 중...');
        createOverlay();
        console.log('[Undertale Combat Overlay] 준비 완료!');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(); 
