// ==UserScript==
// @name         Crack Apocalypse Tactical HUD
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  해킹된 아포칼립스 전술 단말기 - AI 텍스트를 실시간으로 파싱하여 사이버펑크 HUD로 시각화
// @author       Asdas78767
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 데이터 구조 ====================
    const hudData = {
        profile: {
            name: '미확인',
            job: '생존자',
            funds: 0
        },
        stats: {
            health: { value: 100, max: 100, grade: 'S' },
            stamina: { value: 100, max: 100, grade: 'A' },
            mental: { value: 100, max: 100, grade: 'B' },
            combat: { value: 50, max: 100, grade: 'C' }
        },
        environment: {
            time: '--:--',
            location: '알 수 없음',
            danger: 0
        },
        squad: [
            { name: '슬롯1', status: 'empty', health: 0 },
            { name: '슬롯2', status: 'empty', health: 0 },
            { name: '슬롯3', status: 'empty', health: 0 },
            { name: '슬롯4', status: 'empty', health: 0 }
        ],
        mission: {
            title: '임무 대기중',
            progress: 0
        }
    };

    // ==================== HUD UI 생성 ====================
    function createHUD() {
        const hudContainer = document.createElement('div');
        hudContainer.id = 'apocalypse-hud';
        hudContainer.innerHTML = `
            <style>
                #apocalypse-hud {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 380px;
                    font-family: 'Courier New', monospace;
                    color: #00ff41;
                    background: rgba(0, 0, 0, 0.85);
                    border: 2px solid #00ff41;
                    box-shadow: 0 0 20px rgba(0, 255, 65, 0.5), inset 0 0 20px rgba(0, 255, 65, 0.1);
                    padding: 15px;
                    z-index: 999999;
                    pointer-events: none;
                    user-select: none;
                    animation: hudFlicker 0.1s infinite;
                }

                @keyframes hudFlicker {
                    0%, 100% { opacity: 0.98; }
                    50% { opacity: 1; }
                }

                #apocalypse-hud::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(0, 255, 65, 0.03) 0px,
                        transparent 1px,
                        transparent 2px,
                        rgba(0, 255, 65, 0.03) 3px
                    );
                    pointer-events: none;
                    animation: scanline 8s linear infinite;
                }

                @keyframes scanline {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(100%); }
                }

                #apocalypse-hud::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 255, 65, 0.02);
                    pointer-events: none;
                    animation: noise 0.2s infinite;
                }

                @keyframes noise {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.15; }
                }

                .hud-section {
                    margin-bottom: 12px;
                    border-bottom: 1px solid rgba(0, 255, 65, 0.3);
                    padding-bottom: 8px;
                }

                .hud-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }

                .hud-title {
                    font-size: 11px;
                    color: #00ff41;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    text-shadow: 0 0 5px rgba(0, 255, 65, 0.8);
                    letter-spacing: 2px;
                }

                .hud-header {
                    font-size: 10px;
                    color: #00cc33;
                    margin-bottom: 10px;
                    text-align: center;
                    border-bottom: 1px solid #00ff41;
                    padding-bottom: 5px;
                    animation: glitch 3s infinite;
                }

                @keyframes glitch {
                    0%, 100% { text-shadow: 0 0 5px rgba(0, 255, 65, 0.8); }
                    25% { text-shadow: -2px 0 5px rgba(255, 0, 0, 0.5), 2px 0 5px rgba(0, 255, 255, 0.5); }
                    50% { text-shadow: 0 0 5px rgba(0, 255, 65, 0.8); }
                    75% { text-shadow: 2px 0 5px rgba(255, 0, 0, 0.5), -2px 0 5px rgba(0, 255, 255, 0.5); }
                }

                /* 프로필 모듈 */
                .profile-item {
                    font-size: 11px;
                    margin-bottom: 4px;
                    display: flex;
                    justify-content: space-between;
                }

                .profile-label {
                    color: #00cc33;
                }

                .profile-value {
                    color: #00ff41;
                    font-weight: bold;
                }

                /* 스탯 모듈 */
                .stat-item {
                    margin-bottom: 6px;
                }

                .stat-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    margin-bottom: 2px;
                }

                .stat-name {
                    color: #00cc33;
                }

                .stat-value {
                    color: #00ff41;
                }

                .stat-bar-container {
                    height: 8px;
                    background: rgba(0, 50, 20, 0.5);
                    border: 1px solid #00ff41;
                    position: relative;
                    overflow: hidden;
                }

                .stat-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #00ff41, #00cc33);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
                    transition: width 0.5s ease;
                }

                .stat-bar.grade-S { background: linear-gradient(90deg, #ff00ff, #ff0080); box-shadow: 0 0 10px rgba(255, 0, 255, 0.8); }
                .stat-bar.grade-A { background: linear-gradient(90deg, #00ffff, #0080ff); box-shadow: 0 0 10px rgba(0, 255, 255, 0.8); }
                .stat-bar.grade-B { background: linear-gradient(90deg, #00ff41, #00cc33); box-shadow: 0 0 10px rgba(0, 255, 65, 0.8); }
                .stat-bar.grade-C { background: linear-gradient(90deg, #ffff00, #ffcc00); box-shadow: 0 0 10px rgba(255, 255, 0, 0.8); }
                .stat-bar.grade-D { background: linear-gradient(90deg, #ff8800, #ff6600); box-shadow: 0 0 10px rgba(255, 136, 0, 0.8); }
                .stat-bar.grade-F { background: linear-gradient(90deg, #ff0000, #cc0000); box-shadow: 0 0 10px rgba(255, 0, 0, 0.8); }

                /* 환경 센서 모듈 */
                .env-item {
                    font-size: 10px;
                    margin-bottom: 3px;
                    display: flex;
                    justify-content: space-between;
                }

                .env-label {
                    color: #00cc33;
                }

                .env-value {
                    color: #00ff41;
                }

                .danger-indicator {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    margin-left: 5px;
                    animation: pulse 1s infinite;
                }

                .danger-low { background: #00ff00; box-shadow: 0 0 5px #00ff00; }
                .danger-medium { background: #ffff00; box-shadow: 0 0 5px #ffff00; }
                .danger-high { background: #ff8800; box-shadow: 0 0 5px #ff8800; }
                .danger-critical { background: #ff0000; box-shadow: 0 0 5px #ff0000; }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* 스쿼드 모듈 */
                .squad-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }

                .squad-member {
                    font-size: 9px;
                    padding: 4px;
                    border: 1px solid #00ff41;
                    background: rgba(0, 50, 20, 0.3);
                    position: relative;
                }

                .squad-member.alive { border-color: #00ff41; }
                .squad-member.injured { border-color: #ffff00; }
                .squad-member.critical { border-color: #ff8800; animation: critical-pulse 0.5s infinite; }
                .squad-member.dead { border-color: #ff0000; opacity: 0.5; }
                .squad-member.empty { border-color: #333333; opacity: 0.3; }

                @keyframes critical-pulse {
                    0%, 100% { box-shadow: 0 0 5px rgba(255, 136, 0, 0.5); }
                    50% { box-shadow: 0 0 15px rgba(255, 136, 0, 1); }
                }

                .squad-name {
                    color: #00ff41;
                    font-weight: bold;
                    margin-bottom: 2px;
                }

                .squad-status {
                    color: #00cc33;
                    font-size: 8px;
                }

                /* 미션 모듈 */
                .mission-title {
                    font-size: 10px;
                    color: #00ff41;
                    margin-bottom: 4px;
                }

                .mission-bar-container {
                    height: 12px;
                    background: rgba(0, 50, 20, 0.5);
                    border: 1px solid #00ff41;
                    position: relative;
                    overflow: hidden;
                }

                .mission-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #00ff41, #00ffff);
                    box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
                    transition: width 0.5s ease;
                }

                .mission-progress-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 9px;
                    color: #000;
                    font-weight: bold;
                    text-shadow: 0 0 3px rgba(0, 255, 65, 0.8);
                    z-index: 1;
                }
            </style>

            <div class="hud-header">
                ◢◤ APOCALYPSE TACTICAL TERMINAL ◥◣<br>
                [ SYSTEM STATUS: HACKED ]
            </div>

            <!-- 프로필 모듈 -->
            <div class="hud-section">
                <div class="hud-title">▶ OPERATOR PROFILE</div>
                <div class="profile-item">
                    <span class="profile-label">NAME:</span>
                    <span class="profile-value" id="hud-name">미확인</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">CLASS:</span>
                    <span class="profile-value" id="hud-job">생존자</span>
                </div>
                <div class="profile-item">
                    <span class="profile-label">FUNDS:</span>
                    <span class="profile-value" id="hud-funds">0 ₿</span>
                </div>
            </div>

            <!-- 스탯 모듈 -->
            <div class="hud-section">
                <div class="hud-title">▶ BIOMETRIC STATUS</div>
                <div class="stat-item">
                    <div class="stat-header">
                        <span class="stat-name">신체 (BODY)</span>
                        <span class="stat-value" id="stat-health-text">100/100 [S]</span>
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar grade-S" id="stat-health-bar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-header">
                        <span class="stat-name">신체 (STAMINA)</span>
                        <span class="stat-value" id="stat-stamina-text">100/100 [A]</span>
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar grade-A" id="stat-stamina-bar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-header">
                        <span class="stat-name">언변 (SPEECH)</span>
                        <span class="stat-value" id="stat-mental-text">100/100 [B]</span>
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar grade-B" id="stat-mental-bar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-header">
                        <span class="stat-name">행운 (LUCK)</span>
                        <span class="stat-value" id="stat-combat-text">50/100 [C]</span>
                    </div>
                    <div class="stat-bar-container">
                        <div class="stat-bar grade-C" id="stat-combat-bar" style="width: 50%"></div>
                    </div>
                </div>
            </div>

            <!-- 환경 센서 모듈 -->
            <div class="hud-section">
                <div class="hud-title">▶ ENVIRONMENT SCAN</div>
                <div class="env-item">
                    <span class="env-label">TIME:</span>
                    <span class="env-value" id="env-time">--:--</span>
                </div>
                <div class="env-item">
                    <span class="env-label">LOCATION:</span>
                    <span class="env-value" id="env-location">알 수 없음</span>
                </div>
                <div class="env-item">
                    <span class="env-label">DANGER:</span>
                    <span class="env-value">
                        <span id="env-danger-text">SAFE</span>
                        <span class="danger-indicator danger-low" id="env-danger-indicator"></span>
                    </span>
                </div>
            </div>

            <!-- 스쿼드 모듈 -->
            <div class="hud-section">
                <div class="hud-title">▶ SQUAD STATUS</div>
                <div class="squad-grid" id="squad-grid">
                    <div class="squad-member empty" id="squad-0">
                        <div class="squad-name">슬롯1</div>
                        <div class="squad-status">EMPTY</div>
                    </div>
                    <div class="squad-member empty" id="squad-1">
                        <div class="squad-name">슬롯2</div>
                        <div class="squad-status">EMPTY</div>
                    </div>
                    <div class="squad-member empty" id="squad-2">
                        <div class="squad-name">슬롯3</div>
                        <div class="squad-status">EMPTY</div>
                    </div>
                    <div class="squad-member empty" id="squad-3">
                        <div class="squad-name">슬롯4</div>
                        <div class="squad-status">EMPTY</div>
                    </div>
                </div>
            </div>

            <!-- 미션 모듈 -->
            <div class="hud-section">
                <div class="hud-title">▶ MISSION OBJECTIVE</div>
                <div class="mission-title" id="mission-title">임무 대기중</div>
                <div class="mission-bar-container">
                    <div class="mission-bar" id="mission-bar" style="width: 0%"></div>
                    <div class="mission-progress-text" id="mission-progress">0%</div>
                </div>
            </div>
        `;

        document.body.appendChild(hudContainer);
    }

    // ==================== HUD 업데이트 함수 ====================
    function updateHUD() {
        // 프로필
        document.getElementById('hud-name').textContent = hudData.profile.name;
        document.getElementById('hud-job').textContent = hudData.profile.job;
        document.getElementById('hud-funds').textContent = hudData.profile.funds + ' ₿';

        // 스탯
        Object.keys(hudData.stats).forEach(statName => {
            const stat = hudData.stats[statName];
            const percentage = (stat.value / stat.max) * 100;
            document.getElementById(`stat-${statName}-text`).textContent = 
                `${stat.value}/${stat.max} [${stat.grade}]`;
            const barElement = document.getElementById(`stat-${statName}-bar`);
            barElement.style.width = percentage + '%';
            barElement.className = `stat-bar grade-${stat.grade}`;
        });

        // 환경
        document.getElementById('env-time').textContent = hudData.environment.time;
        document.getElementById('env-location').textContent = hudData.environment.location;
        
        const danger = hudData.environment.danger;
        const dangerText = document.getElementById('env-danger-text');
        const dangerIndicator = document.getElementById('env-danger-indicator');
        
        if (danger < 25) {
            dangerText.textContent = 'SAFE';
            dangerIndicator.className = 'danger-indicator danger-low';
        } else if (danger < 50) {
            dangerText.textContent = 'CAUTION';
            dangerIndicator.className = 'danger-indicator danger-medium';
        } else if (danger < 75) {
            dangerText.textContent = 'DANGER';
            dangerIndicator.className = 'danger-indicator danger-high';
        } else {
            dangerText.textContent = 'CRITICAL';
            dangerIndicator.className = 'danger-indicator danger-critical';
        }

        // 스쿼드
        hudData.squad.forEach((member, index) => {
            const element = document.getElementById(`squad-${index}`);
            element.querySelector('.squad-name').textContent = member.name;
            
            let statusText = '';
            let statusClass = '';
            
            if (member.status === 'empty') {
                statusText = 'EMPTY';
                statusClass = 'empty';
            } else if (member.status === 'dead') {
                statusText = 'K.I.A.';
                statusClass = 'dead';
            } else if (member.health > 75) {
                statusText = `OK [${member.health}%]`;
                statusClass = 'alive';
            } else if (member.health > 40) {
                statusText = `INJURED [${member.health}%]`;
                statusClass = 'injured';
            } else if (member.health > 0) {
                statusText = `CRITICAL [${member.health}%]`;
                statusClass = 'critical';
            }
            
            element.querySelector('.squad-status').textContent = statusText;
            element.className = `squad-member ${statusClass}`;
        });

        // 미션
        document.getElementById('mission-title').textContent = hudData.mission.title;
        document.getElementById('mission-bar').style.width = hudData.mission.progress + '%';
        document.getElementById('mission-progress').textContent = Math.round(hudData.mission.progress) + '%';
    }

    // ==================== 텍스트 파서 ====================
    function parseT9Format(text) {
        // 실제 채팅 형식 파싱
        // [T숫자]로 시작하는 info 블록을 찾음
        const turnMatch = text.match(/\[T(\d+)\]/);
        if (!turnMatch) return false;
        
        let updated = false;
        
        // 1. 프로필 파싱: [ 이름 | 직업 | 추가정보 | 자금 B ]
        const profileMatch = text.match(/\[\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^B]+)\s*B\s*\]/);
        if (profileMatch) {
            const name = profileMatch[1].trim();
            const job = profileMatch[2].trim();
            const fundsStr = profileMatch[4].trim();
            
            if (name && name !== '미정' && name !== '???') {
                hudData.profile.name = name;
                updated = true;
            }
            if (job && job !== '미정' && job !== '???') {
                hudData.profile.job = job;
                updated = true;
            }
            if (fundsStr && fundsStr !== '???' && fundsStr !== '미정') {
                const funds = parseInt(fundsStr.replace(/[,\s]/g, ''));
                if (!isNaN(funds)) {
                    hudData.profile.funds = funds;
                    updated = true;
                }
            }
        }
        
        // 2. 스탯 파싱: [ 스탯 | 신체:값 | 언변:값 | 행운:값 ]
        const statsMatch = text.match(/\[\s*스탯\s*\|([^\]]+)\]/);
        if (statsMatch) {
            const statsContent = statsMatch[1];
            
            // 신체 (health/stamina로 매핑)
            const bodyMatch = statsContent.match(/신체\s*[:：]\s*(\d+)/);
            if (bodyMatch) {
                const value = parseInt(bodyMatch[1]);
                if (!isNaN(value)) {
                    hudData.stats.health.value = Math.min(value, hudData.stats.health.max);
                    hudData.stats.stamina.value = Math.min(value, hudData.stats.stamina.max);
                    updated = true;
                }
            }
            
            // 언변 (mental로 매핑)
            const speechMatch = statsContent.match(/언변\s*[:：]\s*(\d+)/);
            if (speechMatch) {
                const value = parseInt(speechMatch[1]);
                if (!isNaN(value)) {
                    hudData.stats.mental.value = Math.min(value, hudData.stats.mental.max);
                    updated = true;
                }
            }
            
            // 행운 (combat로 매핑)
            const luckMatch = statsContent.match(/행운\s*[:：]\s*(\d+)/);
            if (luckMatch) {
                const value = parseInt(luckMatch[1]);
                if (!isNaN(value)) {
                    hudData.stats.combat.value = Math.min(value, hudData.stats.combat.max);
                    updated = true;
                }
            }
        }
        
        // 3. 날짜/시간 파싱: [ 2057년 10월 28일 | 14시 30분 ]
        const dateTimeMatch = text.match(/\[\s*(\d+)년\s*(\d+)월\s*(\d+)일\s*\|\s*(\d+)시\s*(\d+)분\s*\]/);
        if (dateTimeMatch) {
            const hour = dateTimeMatch[4].padStart(2, '0');
            const minute = dateTimeMatch[5].padStart(2, '0');
            hudData.environment.time = `${hour}:${minute}`;
            updated = true;
        }
        
        // 4. 위치 파싱: [ 위치 | 장소명 | 위험도 ]
        const locationMatch = text.match(/\[\s*위치\s*\|([^|]+)\|([^\]]+)\]/);
        if (locationMatch) {
            const location = locationMatch[1].trim();
            const dangerIndicator = locationMatch[2].trim();
            
            if (location && location !== '???' && location !== '미정') {
                hudData.environment.location = location;
                updated = true;
            }
            
            // 위험도 파싱 (⚪⚫🔴🟠🟡 등의 이모지나 텍스트)
            let dangerLevel = 0;
            if (dangerIndicator.includes('⚪') || dangerIndicator.toLowerCase().includes('safe')) {
                dangerLevel = 10;
            } else if (dangerIndicator.includes('🟢') || dangerIndicator.includes('녹색')) {
                dangerLevel = 20;
            } else if (dangerIndicator.includes('🟡') || dangerIndicator.includes('노란')) {
                dangerLevel = 40;
            } else if (dangerIndicator.includes('🟠') || dangerIndicator.includes('주황')) {
                dangerLevel = 65;
            } else if (dangerIndicator.includes('🔴') || dangerIndicator.includes('⚫') || dangerIndicator.includes('빨간')) {
                dangerLevel = 90;
            }
            
            if (dangerLevel > 0) {
                hudData.environment.danger = dangerLevel;
                updated = true;
            }
        }
        
        // 5. 캐릭터/스쿼드 파싱: ▣ 캐릭터명 또는 ▣ 캐릭터없음
        const squadLines = text.match(/▣\s*([^\n]+)/g);
        if (squadLines) {
            let squadIndex = 0;
            squadLines.forEach(line => {
                const content = line.replace('▣', '').trim();
                
                if (content === '캐릭터없음' || content === '동료없음' || content === '스쿼드없음') {
                    // 스쿼드 없음 - 초기화
                    for (let i = 0; i < 4; i++) {
                        hudData.squad[i] = { name: `슬롯${i+1}`, status: 'empty', health: 0 };
                    }
                    updated = true;
                } else if (content && squadIndex < 4) {
                    // 캐릭터가 있으면 스쿼드에 추가
                    hudData.squad[squadIndex].name = content;
                    hudData.squad[squadIndex].status = 'alive';
                    hudData.squad[squadIndex].health = 100;
                    squadIndex++;
                    updated = true;
                }
            });
        }
        
        // 6. 임무 파싱: ▣ 임무명 또는 ▣ 임무없음
        const missionMatch = text.match(/▣\s*임무[：:]\s*([^\n]+)|▣\s*([^▣\n]+임무[^\n]*)/);
        if (missionMatch) {
            const mission = (missionMatch[1] || missionMatch[2] || '').trim();
            if (mission && mission !== '임무없음' && mission !== '없음') {
                hudData.mission.title = mission;
                // 임무 진행률은 별도로 파싱하거나 기본값 유지
                updated = true;
            } else if (mission === '임무없음' || mission === '없음') {
                hudData.mission.title = '임무 대기중';
                hudData.mission.progress = 0;
                updated = true;
            }
        }
        
        if (updated) {
            updateHUD();
        }
        
        return updated;
    }

    // ==================== MutationObserver 설정 ====================
    function observeTextChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent || '';
                            if (/\[T\d+:/.test(text)) {
                                parseT9Format(text);
                            }
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    const text = mutation.target.textContent || '';
                    if (/\[T\d+:/.test(text)) {
                        parseT9Format(text);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 초기 페이지 스캔
        const bodyText = document.body.textContent || '';
        parseT9Format(bodyText);
    }

    // ==================== 초기화 ====================
    function init() {
        // 이미 HUD가 존재하면 제거
        const existingHUD = document.getElementById('apocalypse-hud');
        if (existingHUD) {
            existingHUD.remove();
        }

        // HUD 생성 및 초기 렌더링
        createHUD();
        updateHUD();
        
        // 텍스트 변경 감시 시작
        observeTextChanges();

        console.log('[Apocalypse HUD] 전술 단말기 해킹 완료. 시스템 가동중...');
    }

    // ==================== 시작 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
