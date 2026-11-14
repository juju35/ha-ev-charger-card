/**
 * ev-charger-card / ev-charger-mini-card: an EV charger, illustrated. The wallbox, its cable and the car, with energy flowing
 * while it charges; the session in three tiles; pause / start, the current limit and the cable lock.
 * https://github.com/juju35/ha-ev-charger-card
 */

// Colour of each state: on the badge, the pill, the LED ring, the cable and the battery bar.
const EV_ACCENTS = { charging: "#2f80ed", waiting: "#e8a33d", done: "#2e9d5a", idle: "#9aa3ae", error: "#e5484d", offline: "#9aa3ae" };
const EV_ICONS = {
  charging: "mdi:ev-station",
  waiting: "mdi:ev-plug-type2",
  done: "mdi:battery-charging-100",
  idle: "mdi:ev-station",
  error: "mdi:alert-circle-outline",
  offline: "mdi:lan-disconnect",
};

// The illustration: the wall and the floor, the wallbox and its LED ring, the cable (with energy flowing along it while
// charging) and the car with its charging port; a glass pill with the car's battery level, else the charging power.
// No car when none is plugged in: the cable hangs from the wallbox.
const evScene = ({ state, dark, uid, pct, pill, label, animate }) => {
  const acc = EV_ACCENTS[state];
  const car = state !== "idle" && state !== "offline";
  const W = dark ? ["#262a30", "#1d2025", "#17191d"] : ["#f7f9fc", "#e8ecf2", "#dfe4eb"];
  const paint = dark ? ["#4a515b", "#30353c", "#666e79"] : ["#fbfcfe", "#dfe4ea", "#b9c1cb"];
  const glass = dark ? ["#232a33", "#0d1116"] : ["#6d7a8b", "#28313d"];
  const rim = dark ? ["#8f98a3", "#5c646e"] : ["#d9dee5", "#9aa3ae"];
  const txt = dark ? "#f0f0f0" : "#1f2329";
  const cable = car ? "M78 133 C78 180, 162 184, 198 160 S 222 128 227 121" : "M78 133 C78 172, 118 174, 120 150 C121 138, 112 132, 104 132";
  const flowing = animate && state === "charging";
  // Still (no animation): the particles stay along the cable, each frozen at a quarter of the way.
  const particles = state === "charging"
    ? [0, 1, 2, 3]
        .map((i) => {
          const motion = flowing
            ? `<animateMotion dur="1.8s" begin="${i * 0.45}s" repeatCount="indefinite"><mpath href="#c${uid}"/></animateMotion>`
            : `<animateMotion dur="1s" fill="freeze" calcMode="linear" keyPoints="${0.15 + i * 0.25};${0.15 + i * 0.25}" keyTimes="0;1"><mpath href="#c${uid}"/></animateMotion>`;
          return `<circle r="3" fill="#fff">${motion}</circle><circle r="6" fill="${acc}" opacity=".55" filter="url(#bl${uid})">${motion}</circle>`;
        })
        .join("")
    : "";
  const spokes = (cx) =>
    [0, 1, 2, 3, 4]
      .map((k) => {
        const a = k * 1.2566 + 0.3;
        return `<line x1="${cx}" y1="141" x2="${(cx + 9 * Math.cos(a)).toFixed(1)}" y2="${(141 + 9 * Math.sin(a)).toFixed(1)}" stroke="${rim[1]}" stroke-width="2.2" stroke-linecap="round"/>`;
      })
      .join("");
  const wheel = (cx) =>
    `<circle cx="${cx}" cy="141" r="18" fill="#1f2328"/><circle cx="${cx}" cy="141" r="11.5" fill="url(#rim${uid})"/>${spokes(cx)}<circle cx="${cx}" cy="141" r="2.6" fill="${rim[1]}"/>`;
  const carSvg = car
    ? `
    <ellipse cx="310" cy="159" rx="122" ry="8" fill="url(#sh${uid})"/>
    <path d="M196 136 C196 126 200 120 210 117 L232 112 C246 100 262 91 284 87 C302 83 320 81 338 82 C354 83 366 87 378 95 L398 108 C411 110 419 115 420 123 L420 134 C420 138 417 141 413 141 L398 141 A20 20 0 0 0 358 141 L276 141 A20 20 0 0 0 236 141 L204 141 C199 141 196 139 196 136 Z" fill="url(#p${uid})" stroke="${paint[2]}" stroke-width="1"/>
    <path d="M262 105 C272 97 287 91 304 89 L338 88 C351 89 361 93 371 100 L380 106 Z" fill="url(#g${uid})"/>
    <path d="M266 102 C286 92 310 90 330 90" stroke="#fff" stroke-opacity="${dark ? 0.12 : 0.35}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <line x1="324" y1="88.5" x2="322" y2="106" stroke="${paint[0]}" stroke-width="3"/>
    <path d="M214 121 C270 116 350 115 412 118" stroke="url(#hl${uid})" stroke-width="2" fill="none"/>
    <path d="M320 109 L318 139 M276 110 L276 128" stroke="${paint[2]}" stroke-width="1" fill="none" opacity=".8"/>
    <rect x="294" y="114" width="12" height="2.4" rx="1.2" fill="${paint[2]}"/><rect x="336" y="114" width="12" height="2.4" rx="1.2" fill="${paint[2]}"/>
    <path d="M372 102 l8 -1 l1 5 l-7 1 z" fill="${glass[1]}"/>
    <rect x="403" y="113" width="15" height="3.4" rx="1.7" fill="${dark ? "#ffe08a" : "#ffd166"}"/>
    <rect x="197" y="117" width="9" height="3.4" rx="1.7" fill="#e5484d"/>
    <rect x="222" y="115" width="10" height="8" rx="2.5" fill="${glass[1]}"/>
    <circle cx="227" cy="119" r="2.2" fill="${acc}"/><circle cx="227" cy="119" r="5" fill="${acc}" opacity=".35" filter="url(#bl${uid})"/>
    ${wheel(256)}${wheel(378)}`
    : "";
  const bar = pct != null ? `<rect x="304" y="44" width="98" height="6" rx="3" fill="${dark ? "#2c3138" : "#e3e8ef"}"/><rect x="304" y="44" width="${((98 * Math.max(0, Math.min(100, pct))) / 100).toFixed(1)}" height="6" rx="3" fill="${acc}"/>` : "";
  const pillTop = pct != null ? 36 : 43;
  return `
  <svg class="scene" viewBox="0 0 430 190" role="img" aria-label="${rcEsc([pill, label].filter(Boolean).join(" · "))}">
    <defs>
      <linearGradient id="w${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${W[0]}"/><stop offset="1" stop-color="${W[1]}"/></linearGradient>
      <linearGradient id="f${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${W[1]}"/><stop offset="1" stop-color="${W[2]}"/></linearGradient>
      <linearGradient id="p${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paint[0]}"/><stop offset=".55" stop-color="${paint[0]}"/><stop offset="1" stop-color="${paint[1]}"/></linearGradient>
      <linearGradient id="g${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${glass[0]}"/><stop offset="1" stop-color="${glass[1]}"/></linearGradient>
      <linearGradient id="hl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${dark ? 0.18 : 0.75}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="rim${uid}"><stop offset="0" stop-color="${rim[0]}"/><stop offset="1" stop-color="${rim[1]}"/></radialGradient>
      <radialGradient id="sh${uid}"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.55 : 0.28}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="halo${uid}"><stop offset="0" stop-color="${acc}" stop-opacity=".28"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>
      <filter id="bl${uid}" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5"/></filter>
      <filter id="ds${uid}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="${dark ? 0.4 : 0.12}"/></filter>
    </defs>
    <rect width="430" height="190" fill="url(#w${uid})"/>
    <rect y="152" width="430" height="38" fill="url(#f${uid})"/>
    <rect y="152" width="430" height="1" fill="#fff" opacity="${dark ? 0.06 : 0.7}"/>
    ${state === "idle" || state === "offline" ? "" : `<circle cx="78" cy="74" r="46" fill="url(#halo${uid})"/>`}
    <ellipse cx="78" cy="156" rx="30" ry="4" fill="url(#sh${uid})"/>
    <rect x="56" y="32" width="44" height="6" rx="3" fill="${W[2]}"/>
    <g filter="url(#ds${uid})">
      <rect x="52" y="30" width="52" height="102" rx="18" fill="url(#p${uid})" stroke="${paint[2]}" stroke-width="1"/>
      <rect x="59" y="40" width="38" height="66" rx="13" fill="${glass[1]}"/>
      <path d="M62 46 Q78 40 94 46" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="78" cy="73" r="14" fill="none" stroke="${acc}" stroke-opacity=".25" stroke-width="7"/>
      <circle class="${flowing ? "ring" : state === "error" && animate ? "ring err" : ""}" cx="78" cy="73" r="14" fill="none" stroke="${acc}" stroke-width="2.6"/>
      <path d="M80.5 64.5l-7 10.5h5.2l-2 8 7.3-11.2h-5.3z" fill="${acc}"/>
      <rect x="70" y="114" width="16" height="4" rx="2" fill="${paint[2]}"/>
    </g>
    <path id="c${uid}" d="${cable}" fill="none" stroke="${dark ? "#0f1216" : "#2f3540"}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="${cable}" fill="none" stroke="#fff" stroke-opacity="${dark ? 0.08 : 0.22}" stroke-width="1.6" stroke-linecap="round" transform="translate(-1 -1.5)"/>
    ${particles}${carSvg}
    ${
      pill
        ? `    <g filter="url(#ds${uid})"><rect x="290" y="16" width="126" height="44" rx="14" fill="${dark ? "rgba(20,22,26,.72)" : "rgba(255,255,255,.82)"}" stroke="${dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"}"/></g>
    <text x="304" y="${pillTop}" font-family="Roboto,sans-serif" font-size="17" font-weight="700" fill="${txt}">${rcEsc(pill)}</text>
    <text x="${304 + pill.length * 9.6 + 10}" y="${pillTop - 1}" font-family="Roboto,sans-serif" font-size="10.5" font-weight="500" fill="${acc}">${rcEsc(label)}</text>
    ${bar}
`
        : ""
    }
  </svg>`;
};

const evIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const EV_SVG = {
  energy: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M21 10v4M9 9l-2 3h4l-2 3"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cost: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  current: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  total: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  start: '<path d="M7 4l12 8-12 8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
};

// ── Card ─────────────────────────────────────────────────────────────────────
class EvChargerCard extends RcCard {
  static tag = "ev-charger-card";
  static i18n = EV_I18N;
  static defaults = { show_scene: true, animations: true, show_controls: true };

  // The most likely charger of the home.
  static getStubConfig(hass) {
    const device = hass ? evChargers(hass)[0] : undefined;
    return device ? { device } : {};
  }

  getCardSize() {
    return this._config?.show_scene === false ? 3 : 6;
  }

  _cols() {
    return 3;
  }

  _deviceId() {
    const c = this._config;
    return c.device || (c.entity && evDeviceOf(this._hass, c.entity)) || evChargers(this._hass)[0];
  }

  _fmt(v, digits) {
    try {
      return new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return v.toFixed(digits);
    }
  }

  // The charger's state and readings.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const device = this._deviceId();
    // The roles depend on the states too (a status sensor reading "unknown" at start is skipped): found again when they change.
    const e = rcMemo((this._memo ||= {}), "find", [device, c.entities, h.entities, h.devices, h.states], () => evFind(h, device, c.entities || {}));
    const st = (role) => (e[role] ? h.states[e[role]] : undefined);
    const on = (role) => st(role)?.state === "on";
    const watts = evWatts(st("power"));
    const raw = st("status");
    const errSt = st("error");
    const errOn = errSt && !rcUnavailable(errSt) && (errSt.entity_id.startsWith("binary_sensor.") ? errSt.state === "on" : !EV_NO_ERROR.test(evNorm(errSt.state)) && !!errSt.state);
    let state = raw && !rcUnavailable(raw) ? evStateOf(raw.state) : undefined;
    // OCPP publishes "Unavailable" with a capital: offline too.
    const rawOff = raw && (rcUnavailable(raw) || evNorm(raw.state) === "unavailable");
    if (!state) state = watts > 50 ? "charging" : st("plug") ? (on("plug") ? "waiting" : "idle") : rawOff ? "offline" : "idle";
    if (errOn) state = "error";
    const limit = st("limit");
    const lock = st("lock");
    const dev = device && h.devices?.[device];
    const battery = c.battery ? h.states[c.battery] : st("battery");
    return {
      device,
      ids: e,
      state,
      raw: raw ? h.formatEntityState?.(raw) || raw.state : "",
      name: c.title || dev?.name_by_user || dev?.name || this._t("title"),
      sub: [h.areas?.[dev?.area_id]?.name, dev?.model].filter(Boolean).join(" · "),
      watts,
      session: evKwh(st("energy")),
      total: evKwh(st("total")),
      amps: evNum(st("current")),
      phases: evNum(st("phases")),
      duration: evDuration(st("duration")),
      cost: st("cost") && evNum(st("cost")) != null ? h.formatEntityState?.(st("cost")) || `${st("cost").state} ${st("cost").attributes.unit_of_measurement || ""}` : null,
      error: errOn ? (errSt.entity_id.startsWith("binary_sensor.") ? this._t("st_error") : h.formatEntityState?.(errSt) || errSt.state) : null,
      limit: limit && !rcUnavailable(limit)
        ? { id: limit.entity_id, value: evNum(limit), min: limit.attributes.min ?? 6, max: limit.attributes.max ?? 32, step: limit.attributes.step || 1 }
        : null,
      lock: lock && !rcUnavailable(lock) ? { id: lock.entity_id, locked: lock.state === "locked" || lock.state === "on", domain: lock.entity_id.split(".")[0] } : null,
      switchId: e.switch && h.states[e.switch] && !rcUnavailable(h.states[e.switch]) ? e.switch : null,
      switchOn: on("switch"),
      // A "Pause charging" switch is on while paused: pause turns it on, start turns it off.
      switchPause: !!e.switch && /pause/i.test(`${e.switch} ${h.states[e.switch]?.attributes.friendly_name || ""}`) && !/resume/i.test(`${e.switch} ${h.states[e.switch]?.attributes.friendly_name || ""}`),
      startId: e.start && h.states[e.start] ? e.start : null,
      stopId: e.stop && h.states[e.stop] ? e.stop : null,
      soc: evNum(battery),
    };
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // The pill of the illustration and of the header: the car's level when known, else the charging power.
  _power(m) {
    return m.watts != null ? `${this._fmt(m.watts / 1000, 1)} kW` : "";
  }

  _status(m) {
    const label = this._t(`st_${m.state}`);
    return m.state === "charging" && m.watts != null ? `${label} · ${this._power(m)}` : label;
  }

  // Three tiles, the ones that matter in this state, among what the charger reports.
  _tileList(m) {
    // A lifetime total reads in whole kWh (2,840 kWh), a session with one decimal.
    const kwh = (v) => (v != null ? [this._fmt(v, v >= 100 ? 0 : 1), "kWh"] : null);
    const amps = m.limit?.value != null ? [String(Math.round(m.limit.value)), m.phases > 1 ? `A · ${this._tn("phases", m.phases)}` : "A"] : null;
    const all = {
      session: ["energy", "t_session", kwh(m.session)],
      last: ["energy", "t_last", kwh(m.session)],
      time: ["time", "t_time", m.duration ? [m.duration, ""] : null],
      cost: ["cost", "t_cost", m.cost ? [m.cost, ""] : null],
      current: ["current", "t_current", m.amps != null ? [this._fmt(m.amps, 0), "A"] : null],
      limit: ["current", "t_limit", amps],
      total: ["total", "t_total", kwh(m.total)],
    };
    const order = {
      charging: ["session", "time", "cost", "current", "total"],
      done: ["session", "time", "cost", "total"],
      waiting: ["limit", "last", "total", "time"],
    }[m.state] || ["last", "total", "limit"];
    return order
      .map((k) => all[k])
      .filter((t) => t[2])
      .slice(0, 3);
  }

  _tile([icon, label, [value, unit]]) {
    return `<div class="xt"><span class="xh">${evIcon(EV_SVG[icon])}<span class="xl">${rcEsc(this._t(label))}</span></span><span class="xv">${rcEsc(value)}${unit ? `<small>${rcEsc(unit)}</small>` : ""}</span></div>`;
  }

  // The primary action of the state: pause while charging, start when a car waits, unlock the cable when charged.
  _primary(m) {
    if (m.state === "charging" && (m.stopId || m.switchId)) return "pause";
    if (m.state === "waiting" && (m.startId || m.switchId)) return "start";
    if ((m.state === "done" || m.state === "idle") && m.lock?.locked) return "unlock";
    return null;
  }

  // The energy flowing along the cable is an SVG animation, which CSS cannot stop: off with `animations: false` and when
  // the system asks for reduced motion.
  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  _draw(m) {
    const c = this._config;
    const dark = this._dark();
    const parts = [m.state, m.raw, m.name, m.sub, m.watts && Math.round(m.watts / 100), m.session, m.total, m.duration, m.cost, m.error, m.limit, m.lock, m.switchOn, m.soc, m.amps, m.phases, dark];
    if (!this._changed(parts)) return;
    const status = this._status(m);
    const head = `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${EV_ICONS[m.state]}"></ha-icon></div>
        <div class="tt"><div class="title">${rcEsc(m.name)}</div>${m.sub ? `<div class="subt">${rcEsc(m.sub)}</div>` : ""}</div>
        <span class="pill" title="${rcEsc(m.raw || status)}"><span class="pt">${rcEsc(status)}</span></span>
      </div>`;
    // The car's level when one is plugged in and known, else the charging power; with no car, the state alone.
    const noCar = m.state === "idle" || m.state === "offline";
    const pill = noCar ? "" : m.soc != null ? `${Math.round(m.soc)} %` : this._power(m) || this._t(`st_${m.state}`);
    const scene =
      c.show_scene === false
        ? ""
        : `<button class="sc" title="${rcEsc(m.raw || status)}">${evScene({ state: m.state, dark, uid: `${this._uid ||= Math.random().toString(36).slice(2, 8)}`, pct: m.soc != null && !noCar ? m.soc : null, pill, label: !pill || pill === this._t(`st_${m.state}`) ? "" : this._t(`st_${m.state}`), animate: this._animate() })}</button>`;
    const error = m.error ? `<div class="err" role="alert">${rcEsc(m.error)}</div>` : "";
    this._paint(m.state, head + scene + error, this._tileList(m).map((t) => this._tile(t)).join(""));
  }

  _afterGrid() {
    const m = this._items;
    if (!m || this._config.show_controls === false) return "";
    const primary = this._primary(m);
    const btn = primary
      ? `<button class="pb act-${primary}">${evIcon(EV_SVG[primary])}<span>${rcEsc(this._t(primary))}</span></button>`
      : "";
    const step = m.limit
      ? `<span class="seg" role="group" aria-label="${rcEsc(this._t("t_limit"))}"><button class="act-lower" aria-label="${rcEsc(this._t("lower"))}"${m.limit.value <= m.limit.min ? " disabled" : ""}>−</button><b>${rcEsc(m.limit.value != null ? `${Math.round(m.limit.value)} A` : "—")}</b><button class="act-raise" aria-label="${rcEsc(this._t("raise"))}"${m.limit.value >= m.limit.max ? " disabled" : ""}>+</button></span>`
      : "";
    const lock =
      m.lock && primary !== "unlock"
        ? `<button class="gb act-lock" title="${rcEsc(this._t(m.lock.locked ? "unlock" : "lock"))}">${evIcon(EV_SVG[m.lock.locked ? "lock" : "unlock"])}<span>${rcEsc(this._t(m.lock.locked ? "locked" : "unlocked"))}</span></button>`
        : "";
    return btn || step || lock ? `<div class="ctl">${btn}${step}${lock}</div>` : "";
  }

  _bindAfter(root) {
    const m = this._items;
    const h = this._hass;
    if (!m) return;
    const on = (sel, fn) => root.querySelector(sel)?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      fn();
    });
    root.querySelector(".sc")?.addEventListener("click", () => rcMoreInfo(this, m.ids.status || m.ids.power || m.ids.limit));
    const allow = (yes) => rcCall(h, "switch", yes !== m.switchPause ? "turn_on" : "turn_off", { entity_id: m.switchId });
    on(".act-pause", () => (m.stopId ? rcCall(h, "button", "press", { entity_id: m.stopId }) : allow(false)));
    on(".act-start", () => (m.startId ? rcCall(h, "button", "press", { entity_id: m.startId }) : allow(true)));
    const lockTo = (locked) =>
      m.lock.domain === "lock"
        ? rcCall(h, "lock", locked ? "lock" : "unlock", { entity_id: m.lock.id })
        : rcCall(h, "switch", locked ? "turn_on" : "turn_off", { entity_id: m.lock.id });
    on(".act-unlock", () => lockTo(false));
    on(".act-lock", () => lockTo(!m.lock.locked));
    const setLimit = (delta) => {
      const l = m.limit;
      const value = Math.min(l.max, Math.max(l.min, (l.value ?? l.min) + delta * l.step));
      if (value !== l.value) rcCall(h, "number", "set_value", { entity_id: l.id, value });
    };
    on(".act-lower", () => setLimit(-1));
    on(".act-raise", () => setLimit(1));
  }

  static styles = `
    :host { --ev-charging: #2f80ed; }
    ha-card.lvl-charging { --c: var(--ev-charging); }
    ha-card.lvl-waiting  { --c: var(--rc-warn); }
    ha-card.lvl-done     { --c: var(--rc-ok); }
    ha-card.lvl-idle, ha-card.lvl-offline { --c: var(--rc-idle); }
    ha-card.lvl-error    { --c: var(--rc-alert); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .sc { all: unset; display: block; box-sizing: border-box; width: 100%; cursor: pointer; margin-top: 10px; border-radius: 14px; overflow: hidden; }
    .sc:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .scene { display: block; width: 100%; height: auto; }
    @keyframes ev-ring { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
    .ring { animation: ev-ring 1.8s ease-in-out infinite; }
    .ring.err { animation-duration: .9s; }
    .err { margin-top: 8px; padding: 8px 10px; border-radius: 10px; font-size: 13px; color: var(--rc-alert);
           background: color-mix(in srgb, var(--rc-alert) 12%, transparent); }
    .grid { margin-top: 10px; gap: 8px; }
    .xt { min-width: 0; border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 5px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .xh { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--c); }
    .xh svg { flex: none; width: 15px; height: 15px; }
    .xl { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xv { font-size: 18px; font-weight: 500; line-height: 1.15; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .xv small { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); margin-left: 2px; }
    .ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
    .pb, .gb, .seg button { all: unset; box-sizing: border-box; cursor: pointer; }
    .pb { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14px; font-weight: 500;
          color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .gb { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .pb svg, .gb svg { width: 17px; height: 17px; }
    .seg { display: inline-flex; align-items: center; min-height: 40px; padding: 0 3px; border-radius: 999px; background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .seg button { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--primary-text-color); }
    .seg button:hover:not([disabled]) { background: color-mix(in srgb, var(--c) 15%, transparent); }
    .seg button[disabled] { opacity: .35; cursor: default; }
    .seg b { min-width: 48px; text-align: center; font-size: 14px; font-weight: 500; }
    .pb:focus-visible, .gb:focus-visible, .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    @container (max-width: 300px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: reduce) { .ring { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const evSchema = (booleans) => (lang) => [
  { name: "device", selector: { device: {} } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "battery", selector: { entity: { domain: "sensor", device_class: "battery" } } },
  ...rcBooleans(...booleans),
  ...rcAdvanced(EV_I18N, lang, "entities", "language"),
];

const EV_HELPERS = ["title", "battery", "zoom", "entities", "language"];

const EvChargerCardEditor = rcEditor({
  card: EvChargerCard,
  helpers: EV_HELPERS,
  schema: evSchema(["show_title", "show_scene", "animations", "show_controls"]),
});

rcRegister(
  EvChargerCard,
  EvChargerCardEditor,
  "EV Charger Card",
  "An EV charger, illustrated: wallbox, cable and car, charging power, session, pause / start, current limit and cable lock",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The charger on two lines: a ring with the car's battery level (or the charging power) as the badge, the title and the
// state, then the key readings as pills; the zoom button opens the full card in place.
class EvChargerMiniCard extends rcMini(
  EvChargerCard,
  "ev-charger-mini-card",
  `
    .mini > .badge { background: none; }
    .ringb { width: 40px; height: 40px; }
    .r { --t: var(--c); }
    .r.dim { --t: var(--rc-idle); }
  `,
) {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    if (!this._changed(["mini", m.state, m.watts && Math.round(m.watts / 100), m.session, m.duration, m.soc, m.error, m.limit?.value, m.name])) return;
    const id = m.ids.status || m.ids.power || "";
    const chip = (text, dim) => `<button class="r pill${dim ? " dim" : ""}" data-id="${rcEsc(id)}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const kwh = m.session != null ? `${this._fmt(m.session, 1)} kWh` : null;
    const chips = {
      charging: [this._power(m), m.soc != null ? `${Math.round(m.soc)} %` : kwh, m.duration],
      waiting: [this._t("st_waiting"), m.soc != null ? `${Math.round(m.soc)} %` : null, m.limit?.value != null ? `${Math.round(m.limit.value)} A` : null],
      done: [this._t("st_done"), kwh, m.duration],
      error: [m.error || this._t("st_error")],
    }[m.state] || [this._t(`st_${m.state}`), m.session != null ? `${this._t("t_last")} ${kwh}` : null];
    const html = chips
      .filter(Boolean)
      .map((t, i) => chip(t, i > 0))
      .join("");
    this._paintMini({ level: m.state, icon: EV_ICONS[m.state], status: "", chips: html });
    // The charger's name (or the title), as on the full card.
    const title = this.shadowRoot.querySelector(".mini .title");
    if (title) title.textContent = m.name;
    // The badge is a ring: the car's level when known, else the charging power against `max_power` (kW).
    const max = (Number(this._config.max_power) || 7.4) * 1000;
    const pct = m.soc != null ? m.soc : m.watts != null ? Math.min(100, (100 * m.watts) / max) : 0;
    const L = 2 * Math.PI * 17;
    const badge = this.shadowRoot.querySelector(".mini > .badge");
    if (badge) {
      badge.innerHTML = `<svg class="ringb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--c) 18%, transparent)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="var(--c)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${((L * pct) / 100).toFixed(1)} 999" transform="rotate(-90 20 20)"/><path d="M21 12l-5 9h4l-1 7 6-10h-4z" fill="var(--c)"/></svg>`;
    }
  }
}

const EvChargerMiniCardEditor = rcEditor({
  card: EvChargerMiniCard,
  helpers: [...EV_HELPERS, "max_power"],
  schema: (lang) => [
    ...evSchema(["show_title", "show_scene", "animations", "show_controls", "zoom"])(lang).slice(0, -1),
    { name: "max_power", selector: { number: { min: 1, max: 50, step: 0.1, mode: "box", unit_of_measurement: "kW" } } },
    ...rcAdvanced(EV_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  EvChargerMiniCard,
  EvChargerMiniCardEditor,
  "EV Charger Mini Card",
  "The charger on two lines: a battery ring, the state and the key readings, with a zoom to the full card",
);
