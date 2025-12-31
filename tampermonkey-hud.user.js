// ==UserScript==
// @name         Crack Apocalypse HUD Overlay
// @namespace    https://github.com/Asdas78767/Crack-Apocalypse-HUD
// @version      0.1.0
// @description  Render CRT-style tactical HUD from AI [T9] text output
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  const MAX_Z_INDEX = 2147483647;
  const T9_MAX_BLOCK_SIZE = 800;
  const SCAN_INTERVAL_MS = 1200;
  const MAX_SCAN_LENGTH = 5000;
  const T9_REGEX = new RegExp(`\\[T9\\]([\\s\\S]{0,${T9_MAX_BLOCK_SIZE}})(?=\\n\\[T9\\]|$)`, "m");

  const HOST_ID = "ca-hud-root";
  if (document.getElementById(HOST_ID)) return;

  const defaultData = {
    profile: { name: "UNKNOWN", job: "STANDBY", funds: 0, currency: "B" },
    stats: [
      { label: "HEALTH", value: 62, max: 100, grade: "B" },
      { label: "ARMOR", value: 48, max: 100, grade: "C" },
      { label: "STAMINA", value: 72, max: 100, grade: "B" },
    ],
    env: { time: "--:--", location: "NO SIGNAL", danger: "LOW" },
    squad: [
      { name: "RAVEN", status: "ALIVE" },
      { name: "GHOST", status: "DOWN" },
      { name: "HEX", status: "MISSING" },
    ],
    mission: { title: "STANDBY", progress: 0 },
  };

  const state = { lastRaw: "", data: defaultData };

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.inset = "10px";
  host.style.pointerEvents = "none";
  host.style.zIndex = String(MAX_Z_INDEX);
  host.style.fontFamily = '"Share Tech Mono", "IBM Plex Mono", monospace';
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host {
      color: #b6f7b6;
    }
    @keyframes scan {
      0% { background-position: 0 -100%; }
      100% { background-position: 0 100%; }
    }
    @keyframes flicker {
      0% { opacity: 1; }
      10% { opacity: 0.95; }
      20% { opacity: 1; }
      30% { opacity: 0.97; }
      40% { opacity: 1; }
      50% { opacity: 0.92; }
      60% { opacity: 1; }
      70% { opacity: 0.98; }
      80% { opacity: 1; }
      90% { opacity: 0.96; }
      100% { opacity: 1; }
    }
    .hud {
      position: relative;
      width: min(1180px, 100%);
      margin: 0 auto;
      height: calc(100vh - 20px);
      border: 1px solid rgba(96, 255, 128, 0.35);
      box-shadow:
        0 0 12px rgba(96, 255, 128, 0.4),
        inset 0 0 24px rgba(96, 255, 128, 0.15);
      backdrop-filter: blur(1px);
      background: radial-gradient(circle at 15% 10%, rgba(96,255,128,0.12), transparent 40%),
                  radial-gradient(circle at 80% 30%, rgba(96,255,128,0.08), transparent 35%),
                  rgba(6, 20, 8, 0.75);
      overflow: hidden;
      pointer-events: none;
    }
    .hud::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        rgba(255,255,255,0.03),
        rgba(0,0,0,0.07)
      );
      background-size: 100% 3px;
      mix-blend-mode: screen;
      opacity: 0.35;
      pointer-events: none;
    }
    .hud::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(96,255,128,0.08) 50%, rgba(0,0,0,0) 100%);
      background-size: 100% 220%;
      animation: scan 4s linear infinite;
      mix-blend-mode: screen;
      opacity: 0.25;
      pointer-events: none;
    }
    .hud__grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-template-rows: auto 1fr 1fr;
      gap: 12px;
      padding: 18px;
      height: 100%;
      box-sizing: border-box;
      animation: flicker 6s infinite;
    }
    .module {
      border: 1px solid rgba(96, 255, 128, 0.35);
      padding: 12px;
      position: relative;
      overflow: hidden;
      min-height: 120px;
      background: linear-gradient(135deg, rgba(96,255,128,0.07), rgba(0,0,0,0.2));
      box-shadow: inset 0 0 16px rgba(96,255,128,0.12);
    }
    .module::after {
      content: "";
      position: absolute;
      inset: -1px;
      border: 1px dashed rgba(96,255,128,0.15);
      pointer-events: none;
    }
    .module__title {
      font-size: 12px;
      letter-spacing: 0.12em;
      color: #7effc0;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      text-shadow: 0 0 6px rgba(126,255,192,0.7);
    }
    .module__title span {
      display: inline-block;
      width: 8px;
      height: 8px;
      border: 1px solid rgba(96,255,128,0.7);
      box-shadow: 0 0 6px rgba(96,255,128,0.5);
      background: rgba(96,255,128,0.15);
    }
    .profile {
      grid-column: span 5;
    }
    .stats {
      grid-column: span 7;
    }
    .env {
      grid-column: span 5;
    }
    .squad {
      grid-column: span 4;
    }
    .mission {
      grid-column: span 3;
    }
    .profile__name {
      font-size: 24px;
      letter-spacing: 0.08em;
      margin: 2px 0;
      color: #c4ffc4;
      text-shadow: 0 0 12px rgba(196,255,196,0.55);
    }
    .profile__meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      opacity: 0.85;
      letter-spacing: 0.05em;
    }
    .profile__funds {
      margin-top: 10px;
      font-size: 14px;
      color: #92ff92;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .profile__funds .chip {
      padding: 4px 8px;
      border: 1px solid rgba(146,255,146,0.4);
      background: rgba(146,255,146,0.12);
      box-shadow: inset 0 0 8px rgba(146,255,146,0.3);
    }
    .stat {
      margin-bottom: 10px;
    }
    .stat__label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      opacity: 0.8;
      letter-spacing: 0.05em;
    }
    .stat__bar {
      position: relative;
      height: 12px;
      background: rgba(96,255,128,0.08);
      border: 1px solid rgba(96,255,128,0.2);
      margin-top: 4px;
      overflow: hidden;
    }
    .stat__bar-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, rgba(96,255,128,0.4), rgba(96,255,128,0.9));
      box-shadow: 0 0 12px rgba(96,255,128,0.45);
      transition: width 0.4s ease;
    }
    .grade {
      font-weight: bold;
      color: #bfffbf;
      text-shadow: 0 0 8px rgba(191,255,191,0.4);
    }
    .grade--hi { color: #c5ffb5; }
    .grade--mid { color: #bfffbf; }
    .grade--low { color: #e1ff7e; }
    .env__row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      font-size: 13px;
    }
    .tag {
      border: 1px solid rgba(96,255,128,0.25);
      padding: 6px;
      background: rgba(96,255,128,0.08);
      text-align: center;
    }
    .danger {
      font-weight: bold;
      text-transform: uppercase;
    }
    .danger.low { color: #7effc0; }
    .danger.medium { color: #e1ff7e; }
    .danger.high { color: #ffae7e; }
    .danger.critical { color: #ff7e7e; }
    .squad__list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .squad__member {
      border: 1px solid rgba(96,255,128,0.2);
      padding: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(96,255,128,0.05);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
    }
    .dot.alive { color: #7effc0; }
    .dot.down { color: #ffae7e; }
    .dot.missing { color: #e1ff7e; }
    .dot.dead { color: #ff7e7e; }
    .mission__title {
      font-size: 13px;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .mission__bar {
      height: 14px;
      border: 1px solid rgba(96,255,128,0.35);
      background: rgba(96,255,128,0.08);
      position: relative;
      overflow: hidden;
    }
    .mission__bar-fill {
      position: absolute;
      inset: 0;
      width: 0;
      background: repeating-linear-gradient(
        135deg,
        rgba(96,255,128,0.7),
        rgba(96,255,128,0.7) 8px,
        rgba(96,255,128,0.35) 8px,
        rgba(96,255,128,0.35) 16px
      );
      box-shadow: 0 0 10px rgba(96,255,128,0.4);
      transition: width 0.4s ease;
    }
    .caption {
      font-size: 10px;
      opacity: 0.75;
      margin-top: 6px;
      letter-spacing: 0.05em;
    }
    .header {
      grid-column: span 12;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      letter-spacing: 0.12em;
      color: #7effc0;
      text-shadow: 0 0 10px rgba(126,255,192,0.45);
    }
    .header__left {
      display: flex;
      gap: 12px;
    }
    .header__chip {
      padding: 4px 8px;
      border: 1px solid rgba(96,255,128,0.35);
      background: rgba(96,255,128,0.08);
    }
  `;

  const container = document.createElement("div");
  container.className = "hud";
  container.innerHTML = `
    <div class="hud__grid">
      <div class="header">
        <div class="header__left">
          <div class="header__chip">TACTICAL TERMINAL</div>
          <div class="header__chip">CHANNEL // CRACK-APOC</div>
        </div>
        <div class="header__chip">SIGNAL: LIVE</div>
      </div>
      <section class="module profile">
        <div class="module__title"><span></span> PROFILE</div>
        <div class="profile__name" id="profile-name"></div>
        <div class="profile__meta">
          <div id="profile-job"></div>
          <div id="profile-code"></div>
        </div>
        <div class="profile__funds">
          <span id="profile-funds-label">FUNDS B</span>
          <div class="chip" id="profile-funds"></div>
        </div>
      </section>
      <section class="module stats">
        <div class="module__title"><span></span> STATS</div>
        <div id="stats-list"></div>
      </section>
      <section class="module env">
        <div class="module__title"><span></span> ENV SENSORS</div>
        <div class="env__row">
          <div class="tag" id="env-time"></div>
          <div class="tag" id="env-location"></div>
          <div class="tag danger" id="env-danger"></div>
        </div>
        <div class="caption">Real-time stream parsed from [T9]</div>
      </section>
      <section class="module squad">
        <div class="module__title"><span></span> SQUAD STATUS</div>
        <div class="squad__list" id="squad-list"></div>
      </section>
      <section class="module mission">
        <div class="module__title"><span></span> MISSION</div>
        <div class="mission__title" id="mission-title"></div>
        <div class="mission__bar">
          <div class="mission__bar-fill" id="mission-bar"></div>
        </div>
        <div class="caption" id="mission-progress"></div>
      </section>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);
  document.body.appendChild(host);

  const refs = {
    name: shadow.getElementById("profile-name"),
    job: shadow.getElementById("profile-job"),
    code: shadow.getElementById("profile-code"),
    funds: shadow.getElementById("profile-funds"),
    fundsLabel: shadow.getElementById("profile-funds-label"),
    stats: shadow.getElementById("stats-list"),
    time: shadow.getElementById("env-time"),
    location: shadow.getElementById("env-location"),
    danger: shadow.getElementById("env-danger"),
    squad: shadow.getElementById("squad-list"),
    missionTitle: shadow.getElementById("mission-title"),
    missionBar: shadow.getElementById("mission-bar"),
    missionProgress: shadow.getElementById("mission-progress"),
  };

  function cap(str = "") {
    return str.toString().trim().toUpperCase();
  }

  function parseKeyValues(segment = "") {
    return segment
      .split(/[|,;]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce((acc, part) => {
        const [rawK, ...rest] = part.split(/[:=]/);
        if (!rawK || !rest.length) return acc;
        acc[rawK.trim().toLowerCase()] = rest.join(":").trim();
        return acc;
      }, {});
  }

  function parseStats(segment = "") {
    const stats = [];
    const matches = segment.split(/[,|;]+/);
    matches.forEach((item) => {
      const match = item.match(/([\w\s]+)[=:]?\s*(\d+)\s*\/\s*(\d+)\s*(?:\(([A-Z])\))?/i);
      if (match) {
        stats.push({
          label: cap(match[1]),
          value: Number(match[2]),
          max: Number(match[3]),
          grade: match[4] ? match[4].toUpperCase() : undefined,
        });
      }
    });
    return stats;
  }

  function parseSquad(segment = "") {
    return segment
      .split(/[,|;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [name, status] = item.split(/[:=]/);
        return { name: cap(name || "UNKNOWN"), status: cap(status || "ALIVE") };
      });
  }

  function parseMission(segment = "") {
    const progressMatch = segment.match(/(\d+)\s*%/);
    const title = segment.replace(/\d+\s*%/, "").replace(/progress[:=]?/i, "").trim();
    return {
      title: title || "EXECUTE OBJECTIVE",
      progress: progressMatch ? Number(progressMatch[1]) : 0,
    };
  }

  function parseT9(raw = "") {
    const lines = raw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed = { ...defaultData };

    lines.forEach((line) => {
      const upper = line.toUpperCase();
      if (upper.startsWith("PROFILE")) {
        const kv = parseKeyValues(line.replace(/PROFILE[:\s-]*/i, ""));
        const currency = kv.fundsb || kv.b ? "B" : defaultData.profile.currency;
        parsed.profile = {
          name: kv.name ? cap(kv.name) : defaultData.profile.name,
          job: kv.job ? cap(kv.job) : defaultData.profile.job,
          funds: kv.funds ?? kv.fundsb ?? kv.b ?? defaultData.profile.funds,
          currency,
        };
      } else if (upper.startsWith("STATS")) {
        const payload = line.replace(/STATS[:\s-]*/i, "");
        const stats = parseStats(payload);
        parsed.stats = stats.length ? stats : defaultData.stats;
      } else if (upper.startsWith("ENV")) {
        const kv = parseKeyValues(line.replace(/ENV[\w\s-]*[:\s-]*/i, ""));
        parsed.env = {
          time: kv.time || defaultData.env.time,
          location: kv.location || kv.loc || defaultData.env.location,
          danger: kv.danger || defaultData.env.danger,
        };
      } else if (upper.startsWith("SQUAD")) {
        const segment = line.replace(/SQUAD[:\s-]*/i, "");
        const squad = parseSquad(segment);
        parsed.squad = squad.length ? squad : defaultData.squad;
      } else if (upper.startsWith("MISSION")) {
        const mission = parseMission(line.replace(/MISSION[:\s-]*/i, ""));
        parsed.mission = mission;
      }
    });

    return parsed;
  }

  function gradeClass(grade) {
    if (!grade) return "";
    const letter = grade.toUpperCase();
    if (["S", "A"].includes(letter)) return "grade--hi";
    if (letter === "B") return "grade--mid";
    return "grade--low";
  }

  function render(data = state.data) {
    refs.name.textContent = data.profile.name;
    refs.job.textContent = `JOB ${data.profile.job}`;
    refs.code.textContent = `CODE ${(data.profile.name || "").slice(0, 2) || "UN"}`;
    refs.funds.textContent = `${data.profile.funds}`;
    refs.fundsLabel.textContent = `FUNDS ${data.profile.currency || "B"}`;

    refs.stats.innerHTML = "";
    data.stats.forEach((stat) => {
      const pct = Math.max(0, Math.min(100, Math.round((stat.value / stat.max) * 100)));
      const row = document.createElement("div");
      row.className = "stat";

      const label = document.createElement("div");
      label.className = "stat__label";

      const left = document.createElement("span");
      left.textContent = stat.label;
      const right = document.createElement("span");
      const gradeSpan = document.createElement("span");
      const gradeCls = gradeClass(stat.grade);
      gradeSpan.className = gradeCls ? `grade ${gradeCls}` : "grade";
      gradeSpan.textContent = stat.grade || "";
      right.appendChild(gradeSpan);
      right.appendChild(document.createTextNode(` ${stat.value}/${stat.max}`));

      label.appendChild(left);
      label.appendChild(right);

      const bar = document.createElement("div");
      bar.className = "stat__bar";
      const fill = document.createElement("div");
      const fillGradeCls = gradeClass(stat.grade);
      fill.className = fillGradeCls ? `stat__bar-fill ${fillGradeCls}` : "stat__bar-fill";
      fill.style.width = `${pct}%`;
      bar.appendChild(fill);

      row.appendChild(label);
      row.appendChild(bar);
      refs.stats.appendChild(row);
    });

    refs.time.textContent = `TIME ${data.env.time}`;
    refs.location.textContent = `LOC ${data.env.location}`;
    const dangerLevel = cap(data.env.danger);
    refs.danger.textContent = `DANGER ${dangerLevel}`;
    refs.danger.className = `tag danger ${dangerLevel.toLowerCase()}`;

    refs.squad.innerHTML = "";
    data.squad.forEach((member) => {
      const status = member.status.toLowerCase();
      const item = document.createElement("div");
      item.className = "squad__member";

      const dot = document.createElement("div");
      dot.className = `dot ${status}`;

      const textWrap = document.createElement("div");
      const nameEl = document.createElement("div");
      nameEl.textContent = member.name;
      const statusEl = document.createElement("div");
      statusEl.className = "caption";
      statusEl.textContent = member.status;

      textWrap.appendChild(nameEl);
      textWrap.appendChild(statusEl);

      item.appendChild(dot);
      item.appendChild(textWrap);

      refs.squad.appendChild(item);
    });

    refs.missionTitle.textContent = data.mission.title.toUpperCase();
    const progress = Math.max(0, Math.min(100, data.mission.progress));
    refs.missionBar.style.width = `${progress}%`;
    refs.missionProgress.textContent = `PROGRESS ${progress}%`;
  }

  function scanForT9() {
    if (!document.body) return;
    const rawText = (document.body.textContent || "").slice(-MAX_SCAN_LENGTH);
    const match = rawText.match(T9_REGEX);
    if (!match) return;
    const raw = match[1].trim();
    if (!raw || raw === state.lastRaw) return;
    state.lastRaw = raw;
    state.data = parseT9(raw);
    render();
  }

  let scanScheduled = false;
  const observer = new MutationObserver(() => {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      scanForT9();
    });
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  setInterval(scanForT9, SCAN_INTERVAL_MS);
  render(defaultData);
})();
