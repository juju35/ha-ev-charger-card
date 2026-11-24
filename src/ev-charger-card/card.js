// ── Card ─────────────────────────────────────────────────────────────────────
// The width of an element's whole text in its own font, in fractional pixels (scrollWidth is rounded).
import { EV_ICONS, EV_SVG, evIcon, evScene } from "./core.js";

export let evCards = 0;

export let evTextCtx;
export const evTextWidth = (el) => {
  const cs = getComputedStyle(el);
  evTextCtx ??= document.createElement("canvas").getContext?.("2d");
  if (!evTextCtx) return el.scrollWidth;
  evTextCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(el.scrollWidth, evTextCtx.measureText(el.textContent.trim()).width + pad);
};

export class EvChargerCard extends RcCard {
  static tag = "ev-charger-card";
  static i18n = EV_I18N;
  static defaults = { show_scene: true, animations: true, show_controls: true, show_settings: true };

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
    if (c.device) return c.device;
    if (c.entity) return evDeviceOf(this._hass, c.entity);
    // The chargers of the home only change with the registries: not scanned again at every update.
    const h = this._hass;
    return rcMemo((this._memo ||= {}), "chargers", [h.entities, h.devices], () => evChargers(h))[0];
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
    // Only the states of the device's entities and of the overrides count, not every state of the home.
    const watched = [...(device ? evDeviceEntities(h)[device] || [] : []), ...Object.values(c.entities || {})];
    const deps = [device, c.entities, h.entities, h.devices, ...watched.map((id) => (typeof id === "string" ? h.states[id] : id))];
    const e = rcMemo((this._memo ||= {}), "find", deps, () => evFind(h, device, c.entities || {}));
    const st = (role) => (e[role] ? h.states[e[role]] : undefined);
    const on = (role) => st(role)?.state === "on";
    const watts = evWatts(st("power"));
    const raw = st("status");
    const errSt = st("error");
    const errOn = errSt && !rcUnavailable(errSt) && (errSt.entity_id.startsWith("binary_sensor.") ? errSt.state === "on" : !EV_NO_ERROR.test(evNorm(errSt.state)) && !!errSt.state);
    let state = raw && !rcUnavailable(raw) ? evStateOf(raw.state) : undefined;
    // OCPP publishes "Unavailable" with a capital: offline too.
    const rawOff = raw && (rcUnavailable(raw) || evNorm(raw.state) === "unavailable");
    if (!state) state = watts > 50 || on("charging") ? "charging" : st("plug") ? (on("plug") ? "waiting" : "idle") : rawOff ? "offline" : "idle";
    if (errOn) state = "error";
    const limit = st("limit");
    const lock = st("lock");
    const dev = device && h.devices?.[device];
    const battery = c.battery ? h.states[c.battery] : st("battery");
    const swName = e.switch ? `${e.switch} ${h.states[e.switch]?.attributes.friendly_name || ""}` : "";
    // A "Pause charging" switch is on while paused: pause turns it on, start turns it off.
    const switchPause = !!e.switch && /pause/i.test(swName) && !/resume/i.test(swName);
    // Paused (V2C's pause switch on, a status saying so): a car plugged in that the charger holds back.
    const paused = state === "waiting" && ((switchPause && on("switch")) || /paus/.test(evNorm(raw?.state)));
    const session = evKwh(st("energy"));
    return {
      device,
      none: !device || !Object.values(e).some(Boolean),
      ids: e,
      state,
      raw: raw ? h.formatEntityState?.(raw) || raw.state : "",
      name: c.title || dev?.name_by_user || dev?.name || this._t("title"),
      sub: [h.areas?.[dev?.area_id]?.name, dev?.model].filter(Boolean).join(" · "),
      watts,
      paused,
      session,
      last: this._lastKwh(e.energy, session, state),
      total: evKwh(st("total")),
      amps: evNum(st("current")),
      phases: evNum(st("phases")),
      duration: evDuration(st("duration")),
      cost: st("cost") && evNum(st("cost")) != null ? h.formatEntityState?.(st("cost")) || `${st("cost").state} ${st("cost").attributes.unit_of_measurement || ""}` : null,
      error: errOn ? (errSt.entity_id.startsWith("binary_sensor.") ? this._t("st_error") : h.formatEntityState?.(errSt) || errSt.state) : null,
      limit: limit && !rcUnavailable(limit)
        ? { id: limit.entity_id, value: evNum(limit), min: limit.attributes.min ?? 6, max: limit.attributes.max ?? 32, step: limit.attributes.step || 1 }
        : null,
      // A lock named after the cable locks the cable (Easee); any other locks the whole charger (Wallbox).
      lock: lock && !rcUnavailable(lock)
        ? {
            id: lock.entity_id,
            locked: lock.state === "locked" || lock.state === "on",
            domain: lock.entity_id.split(".")[0],
            cable: /cable|c[aâ]ble|kabel|cavo|plug|connector|stecker/i.test(`${lock.entity_id} ${lock.attributes.friendly_name || ""}`),
          }
        : null,
      switchId: e.switch && h.states[e.switch] && !rcUnavailable(h.states[e.switch]) ? e.switch : null,
      switchOn: on("switch"),
      switchPause,
      startId: e.start && h.states[e.start] ? e.start : null,
      stopId: e.stop && h.states[e.stop] ? e.stop : null,
      soc: evNum(battery),
      settings: this._settingsOf(device, e, dev?.name_by_user || dev?.name || ""),
    };
  }

  // The energy of the last session: the session sensor while it holds it; once it is back to 0 out of a charge (V2C
  // resets it when the car leaves), its last value above 0 in the past week, looked up once per reset; none meanwhile.
  _lastKwh(id, session, state) {
    if (session == null || session > 0 || state === "charging") return session;
    const s = this._hass.states[id];
    const key = `${id}|${s.last_changed}`;
    if (this._last?.key === key) return this._last.value;
    const entry = { key, value: null };
    this._last = entry;
    const start = new Date(Date.now() - 7 * 864e5).toISOString();
    Promise.resolve(
      this._hass.callWS?.({ type: "history/history_during_period", start_time: start, entity_ids: [id], minimal_response: true, no_attributes: true }),
    )
      .then((res) => {
        const rows = res?.[id] || [];
        for (let i = rows.length - 1; i >= 0; i--) {
          const v = evKwh({ state: rows[i].s ?? rows[i].state, attributes: s.attributes });
          if (v > 0) {
            entry.value = v;
            break;
          }
        }
        if (entry.value != null && this._last === entry) {
          this._sig = null;
          this._render();
        }
      })
      .catch(() => {});
    return null;
  }

  // The charger's own settings (V2C's dynamic control and timer, a charge mode…): the switches, selects and numbers of
  // its device that no role uses, diagnostic ones aside; `settings` lists them instead, `show_settings: false` hides them.
  _settingsOf(device, roles, devName) {
    const h = this._hass;
    const c = this._config;
    if (c.show_settings === false || c.show_controls === false) return [];
    const used = new Set(Object.values(roles).filter(Boolean));
    const ids = Array.isArray(c.settings)
      ? c.settings
      : (device ? evDeviceEntities(h)[device] || [] : []).filter((id) => /^(switch|select|number)\./.test(id) && !used.has(id) && h.entities[id]?.entity_category !== "diagnostic");
    const lower = devName.toLowerCase();
    return ids
      .map((id) => h.states[id])
      .filter((s) => s && !rcUnavailable(s))
      .map((s) => {
        const dom = s.entity_id.split(".")[0];
        const a = s.attributes;
        const full = a.friendly_name || s.entity_id;
        const bare = lower && full.toLowerCase().startsWith(`${lower} `) ? full.slice(lower.length + 1) : full;
        return {
          id: s.entity_id,
          dom,
          name: bare.charAt(0).toUpperCase() + bare.slice(1),
          state: s.state,
          on: s.state === "on",
          options: dom === "select" ? (a.options || []).map((o) => [o, h.formatEntityState?.(s, o) || o]) : null,
          value: dom === "number" ? evNum(s) : null,
          min: a.min,
          max: a.max,
          step: a.step || 1,
          unit: a.unit_of_measurement || "",
        };
      });
  }

  // The state's label, *Paused* for a car held back.
  _stateLabel(m) {
    return this._t(m.paused ? "st_paused" : `st_${m.state}`);
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // Night backdrop: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the
  // day sky after sunset).
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night") return true;
    if (theme === "day") return false;
    return this._dark();
  }

  // The pill of the illustration and of the header: the car's level when known, else the charging power.
  _power(m) {
    return m.watts != null ? `${this._fmt(m.watts / 1000, 1)} kW` : "";
  }

  _status(m) {
    const label = this._stateLabel(m);
    return m.state === "charging" && m.watts != null ? `${label} · ${this._power(m)}` : label;
  }

  // Three tiles, the ones that matter in this state, among what the charger reports.
  _tileList(m) {
    // A lifetime total reads in whole kWh (2,840 kWh), a session with one decimal.
    const kwh = (v) => (v != null ? [this._fmt(v, v >= 100 ? 0 : 1), "kWh"] : null);
    const amps = m.limit?.value != null ? [String(Math.round(m.limit.value)), m.phases > 1 ? `A · ${this._tn("phases", m.phases)}` : "A"] : null;
    const all = {
      session: ["energy", "t_session", kwh(m.session)],
      last: ["energy", "t_last", kwh(m.last)],
      power: ["power", "t_power", m.watts != null ? (m.watts >= 1000 ? [this._fmt(m.watts / 1000, 1), "kW"] : [this._fmt(m.watts, 0), "W"]) : null],
      time: ["time", "t_time", m.duration ? [m.duration, ""] : null],
      cost: ["cost", "t_cost", m.cost ? [m.cost, ""] : null],
      current: ["current", "t_current", m.amps != null ? [this._fmt(m.amps, 0), "A"] : null],
      limit: ["current", "t_limit", amps],
      total: ["total", "t_total", kwh(m.total)],
    };
    const order = {
      charging: ["session", "time", "cost", "power", "current", "total"],
      done: ["session", "time", "cost", "total"],
      waiting: ["limit", "last", "total", "time"],
    }[m.state] || ["last", "total", "limit"];
    // The stepper under the tiles shows the limit already.
    const stepper = this._config.show_controls !== false && m.limit;
    return order
      .filter((k) => !(stepper && k === "limit"))
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
    if ((m.state === "done" || m.state === "idle") && m.lock?.locked && m.lock.cable) return "unlock";
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

  // The illustrated header, as on the flight and train boards: 90 px high, the scene at the right (the wallbox on the
  // house wall, the cable and the car), a concrete strip edge to edge at the bottom; on the sky at the left the badge
  // and `text`. The badge is a car in the state's colour (full card) or the battery ring (mini).
  // The status pill: the state's colour (the badge's) as a dot and a tint, its label.
  _chip(status, raw) {
    return `<span class="chip" title="${rcEsc(raw || status)}" aria-label="${rcEsc(status)}"><span class="dot"></span><span class="ct">${rcEsc(status)}</span></span>`;
  }

  // The banner's text: the title line (the title, then the status pill), the subtitle, then a line with the car's level.
  // Where the pill goes is measured (_fitPill): beside the whole title, else on that last line (its copy there) under
  // the subtitle, else only its dot (its text stays in its title and aria-label).
  _subLine(parts) {
    const text = parts.filter(Boolean).join(" · ");
    return text ? `<div class="subt" title="${rcEsc(text)}">${rcEsc(text)}</div>` : "";
  }

  // The status pill, measured after each render and on a new width (in every language), on the banner, the classic
  // header and the classic mini card: it sits on the title's row, right after the title, only when the whole title and
  // the pill's whole label fit there; otherwise it takes the line under the subtitle (.below), the title whole on its
  // row (cut only when it does not fit alone). When the lines do not fit in the banner above the drive, or the label
  // does not fit its line, the pill shows its dot alone (.dot-only): beside the title when the whole title leaves it
  // room, else under the subtitle.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".tt, .mini .body") || []) {
      const mini = t.matches(".body");
      const row = mini ? t.querySelector(".head") : t.querySelector(".trow");
      const pill = row?.querySelector(":scope > .chip, :scope > .st");
      if (!pill?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".title, .big") || row.firstElementChild;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const outer = (c) => c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginLeft) || 0) + (parseFloat(getComputedStyle(c).marginRight) || 0);
      const others = [...row.children].filter((c) => c !== name && c !== pill && c.getClientRects().length);
      const room = row.getBoundingClientRect().width - others.reduce((w, c) => w + outer(c) + gap, 0);
      const title = evTextWidth(name) + gap;
      if (title + pill.getBoundingClientRect().width <= room) continue;
      t.classList.add("below");
      const line = mini ? pill : t.querySelector(".pl > .chip");
      const banner = t.closest(".banner");
      const ground = banner?.querySelector(".ground");
      const floor = banner ? (ground ? ground.getBoundingClientRect().top : banner.getBoundingClientRect().bottom - 10) : Infinity;
      const box = t.getBoundingClientRect();
      const tx = line?.querySelector(".ct, .pt");
      const whole = !tx || (tx.scrollWidth <= tx.clientWidth + 0.5 && line.getBoundingClientRect().right <= box.right + 0.5);
      if (whole && box.bottom <= floor + 0.5 && (!banner || box.top >= banner.getBoundingClientRect().top - 0.5)) continue;
      t.classList.add("dot-only");
      if (title + (line || pill).getBoundingClientRect().width <= room) t.classList.remove("below");
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
    if (!this._fitObserver && typeof ResizeObserver === "function") this._fitObserver = new ResizeObserver(() => this._fitPill());
    this._fitObserver?.observe(this);
    document.fonts?.ready?.then(() => this._fitPill());
  }

  _titleRow(title, pill, sub, extra = "") {
    return `<div class="trow">${title}${pill}</div>${sub}<div class="bs"><span class="pl">${pill}</span>${extra}</div>`;
  }

  _banner(m, badge, text) {
    const c = this._config;
    const nav = c.navigation_path;
    const status = this._status(m);
    const scene = evScene({
      state: m.state,
      dark: this._dark(),
      night: this._night(),
      uid: (this._uid ||= `evc${(++evCards).toString(36)}`),
      backdrop: c.show_background !== false,
      label: status,
      animate: this._animate(),
      vehicle: c.vehicle,
      color: c.color,
    });
    return `
      <div class="banner${c.show_background === false ? " bare" : this._night() ? " night" : ""}">
        <button class="sc" title="${rcEsc(m.raw || status)}">${scene}</button>
        ${c.show_background === false ? "" : '<div class="ground" aria-hidden="true"></div>'}
        <div class="head bh${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge">${badge}</div>
          <div class="tt">${text}</div>
        </div>
      </div>`;
  }

  // The car's battery level as a bar and a figure, when a car is plugged in and its level known.
  _soc(m) {
    if (m.soc == null || m.state === "idle" || m.state === "offline") return "";
    const pct = Math.max(0, Math.min(100, m.soc));
    return `<div class="soc"><span class="bar"><i style="width:${pct.toFixed(0)}%"></i></span><b>${Math.round(m.soc)} %</b></div>`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._status(m);
    const tiles = this._tileList(m);
    const banner = c.show_scene !== false && !m.none;
    // Redrawn only when something shown changes: a session energy moving by a few Wh, still 12.4 kWh on screen, must
    // not rebuild the card (and restart the energy flowing along the cable).
    const parts = [m.none, m.state, m.paused, m.raw, m.name, m.sub, status, m.soc != null && Math.round(m.soc), tiles, m.error, m.limit, m.lock, m.switchId, m.startId, m.stopId, this._armLock, m.settings, this._presetsOpen, this._settingsOpen, this._dark(), this._night()];
    if (!this._changed(parts)) return;
    const icon = `<ha-icon icon="${m.none ? "mdi:ev-station" : EV_ICONS[m.state]}"></ha-icon>`;
    const head = banner
      ? this._banner(
          m,
          '<ha-icon icon="mdi:car"></ha-icon>',
          // The pill says the state, the power leads the subtitle: the pill keeps its whole label on a narrow card.
          this._titleRow(
            `<div class="title">${rcEsc(m.name)}</div>`,
            this._chip(this._stateLabel(m), m.raw || status),
            this._subLine([m.state === "charging" ? this._power(m) : "", m.sub]),
            this._soc(m),
          ),
        )
      : `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge">${icon}</div>
        <div class="tt">${
          m.none
            ? `<div class="title">${rcEsc(m.name)}</div>`
            : this._titleRow(`<div class="title">${rcEsc(m.name)}</div>`, this._chip(status, m.raw || status), this._subLine([m.sub]))
        }</div>
      </div>`;
    // No charger: say so, rather than draw one with no car.
    if (m.none) {
      this._paint("idle", `${head}<div class="none">${rcEsc(this._t("no_charger"))}</div>`, "");
      return;
    }
    const error = m.error ? `<div class="err" role="alert">${rcEsc(m.error)}</div>` : "";
    this._paint(m.state, head + error, tiles.map((t) => this._tile(t)).join(""));
    this._fitPill();
  }

  _afterGrid() {
    const m = this._items;
    if (!m || m.none || this._config.show_controls === false) return "";
    const primary = this._primary(m);
    // Paused, the start button resumes.
    const label = primary === "start" && m.paused ? "resume" : primary;
    const btn = primary
      ? `<button class="pb act-${primary}" data-k="primary">${evIcon(EV_SVG[primary])}<span>${rcEsc(this._t(label))}</span></button>`
      : "";
    // The value between − and + opens the current presets, when there are some.
    const presets = m.limit ? this._presetList(m.limit) : [];
    const amps = m.limit ? rcEsc(m.limit.value != null ? `${Math.round(m.limit.value)} A` : "—") : "";
    const value = presets.length
      ? `<button class="val sv" data-k="presets" aria-expanded="${!!this._presetsOpen}" aria-label="${rcEsc(this._t("choose_current"))}" aria-live="polite">${amps}</button>`
      : `<b class="val" aria-live="polite">${amps}</b>`;
    const step = m.limit
      ? `<span class="seg" role="group" aria-label="${rcEsc(this._t("t_limit"))}"><button class="act-lower" data-k="lower" aria-label="${rcEsc(this._t("lower"))}"${m.limit.value <= m.limit.min ? " disabled" : ""}>−</button>${value}<button class="act-raise" data-k="raise" aria-label="${rcEsc(this._t("raise"))}"${m.limit.value >= m.limit.max ? " disabled" : ""}>+</button></span>`
      : "";
    const asked = this._askedLimit(m.limit);
    const cur = Math.round(asked ?? m.limit?.value ?? Number.NaN);
    const row =
      presets.length && this._presetsOpen
        ? `<div class="presets" role="group" aria-label="${rcEsc(this._t("choose_current"))}">${presets.map((v) => `<button class="ps${v === cur ? " on" : ""}" data-k="ps-${v}" data-v="${v}" aria-pressed="${v === cur}">${v} A</button>`).join("")}</div>`
        : "";
    // The lock button says what a press does (its state is aria-pressed); unlocking while charging asks for a second press.
    const action = m.lock ? `${m.lock.locked ? "unlock" : "lock"}${m.lock.cable ? "" : "_box"}` : "";
    const lock =
      m.lock && primary !== "unlock"
        ? `<button class="gb act-lock${this._armLock ? " armed" : ""}" data-k="lock" aria-pressed="${m.lock.locked}" title="${rcEsc(this._t(m.lock.locked ? "locked" : "unlocked"))}">${evIcon(EV_SVG[m.lock.locked ? "lock" : "unlock"])}<span>${rcEsc(this._t(this._armLock ? "confirm" : action))}</span></button>`
        : "";
    return `${btn || step || lock ? `<div class="ctl">${btn}${step}${lock}</div>` : ""}${row}${this._settingsHtml(m)}`;
  }

  // The current presets: `current_presets` (6, 10, 13, 16, 20, 25 and 32 A by default; false: none), within the
  // limit's range.
  _presetList(l) {
    const p = this._config.current_presets;
    if (p === false) return [];
    return (Array.isArray(p) ? p : [6, 10, 13, 16, 20, 25, 32]).map(Number).filter((v) => Number.isFinite(v) && v >= l.min && v <= l.max);
  }

  // The limit asked last, until the charger reports it (5 s at most).
  _askedLimit(l) {
    const a = this._limitAsked;
    return l && a && a.id === l.id && Date.now() - a.at < 5000 ? a.value : null;
  }

  // The settings section, folded under its header (chevron right folded, down unfolded).
  _settingsHtml(m) {
    if (!m.settings?.length) return "";
    const open = !!this._settingsOpen;
    const k = (s, x = "") => `data-id="${rcEsc(s.id)}" data-k="set-${rcEsc(s.id)}${x}"`;
    const row = (s) => {
      let ctl;
      if (s.dom === "switch") {
        ctl = `<button class="tg${s.on ? " on" : ""}" role="switch" aria-checked="${s.on}" aria-label="${rcEsc(s.name)}" ${k(s)}><i></i></button>`;
      } else if (s.dom === "select") {
        ctl = `<select class="ss" aria-label="${rcEsc(s.name)}" ${k(s)}>${s.options.map(([o, label]) => `<option value="${rcEsc(o)}"${o === s.state ? " selected" : ""}>${rcEsc(label)}</option>`).join("")}</select>`;
      } else {
        const v = s.value != null ? `${this._fmt(s.value, Number.isInteger(s.step) ? 0 : 1)}${s.unit ? ` ${s.unit}` : ""}` : "—";
        ctl = `<span class="seg sm"><button ${k(s, "-")} data-d="-1" aria-label="${rcEsc(`${s.name} −`)}"${s.min != null && s.value <= s.min ? " disabled" : ""}>−</button><b>${rcEsc(v)}</b><button ${k(s, "+")} data-d="1" aria-label="${rcEsc(`${s.name} +`)}"${s.max != null && s.value >= s.max ? " disabled" : ""}>+</button></span>`;
      }
      return `<div class="sr"><span class="sn" title="${rcEsc(s.name)}">${rcEsc(s.name)}</span>${ctl}</div>`;
    };
    return `<div class="set${open ? " open" : ""}"><button class="sh" data-k="settings" aria-expanded="${open}">${evIcon(EV_SVG.settings)}<span>${rcEsc(this._t("settings"))}</span>${evIcon(EV_SVG.chevron)}</button>${open ? `<div class="sl">${m.settings.map(row).join("")}</div>` : ""}</div>`;
  }

  // The presets row and the settings section fold back on a click elsewhere (as the mini card's zoom), and when the
  // card leaves the page.
  _watchFold() {
    this._foldWatch ??= watchOutside(this, (ev) => {
      if (!rcOutside(this, ev) || !(this._presetsOpen || this._settingsOpen)) return;
      this._presetsOpen = false;
      this._settingsOpen = false;
      this._watchFold();
      this._render();
    });
    if (this._presetsOpen || this._settingsOpen) this._foldWatch.on();
    else this._foldWatch.off();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._fitObserver?.disconnect();
    clearTimeout(this._armTimer);
    this._armLock = false;
    this._presetsOpen = false;
    this._settingsOpen = false;
    this._foldWatch?.off();
  }

  _bindAfter(root) {
    const m = this._items;
    const h = this._hass;
    if (!m || m.none) return;
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
    on(".act-lock", () => {
      clearTimeout(this._armTimer);
      // Unlocking during a charge stops it: a first press arms, a second within 4 s unlocks.
      if (m.lock.locked && m.state === "charging" && !this._armLock) {
        this._armLock = true;
        this._armTimer = setTimeout(() => {
          this._armLock = false;
          this._render();
        }, 4000);
      } else {
        this._armLock = false;
        lockTo(!m.lock.locked);
      }
      this._render();
    });
    // Quick presses add up: each step starts from the value asked last (until the charger reports it), shown at once.
    const setTo = (value, from) => {
      const l = m.limit;
      if (value === from) return;
      this._limitAsked = { id: l.id, value, at: Date.now() };
      const shown = root.querySelector(".seg .val");
      if (shown) shown.textContent = `${Math.round(value)} A`;
      rcCall(h, "number", "set_value", { entity_id: l.id, value });
    };
    const setLimit = (delta) => {
      const l = m.limit;
      const from = this._askedLimit(l) ?? l.value ?? l.min;
      setTo(Math.min(l.max, Math.max(l.min, from + delta * l.step)), from);
    };
    on(".act-lower", () => setLimit(-1));
    on(".act-raise", () => setLimit(1));
    const fold = (key) => {
      this[key] = !this[key];
      this._watchFold();
      this._render();
    };
    on(".sv", () => fold("_presetsOpen"));
    root.querySelector(".presets")?.addEventListener("click", (ev) => {
      const b = ev.target.closest?.(".ps");
      if (!b) return;
      ev.stopPropagation();
      setTo(Number(b.dataset.v), this._askedLimit(m.limit) ?? m.limit.value);
      this._presetsOpen = false;
      this._watchFold();
      this._sig = null;
      this._render();
    });
    const set = root.querySelector(".set");
    set?.addEventListener("click", (ev) => {
      const b = ev.target.closest?.("button");
      if (!b) return;
      ev.stopPropagation();
      if (b.matches(".sh")) return fold("_settingsOpen");
      const s = m.settings.find((x) => x.id === b.dataset.id);
      if (s?.dom === "switch") rcCall(h, "switch", s.on ? "turn_off" : "turn_on", { entity_id: s.id });
      if (s?.dom !== "number") return;
      const from = s.value ?? s.min ?? 0;
      let value = +(from + Number(b.dataset.d) * s.step).toFixed(6);
      if (s.min != null) value = Math.max(s.min, value);
      if (s.max != null) value = Math.min(s.max, value);
      if (value !== from) rcCall(h, "number", "set_value", { entity_id: s.id, value });
    });
    // An open select is not rewritten under the pointer: the updates wait until it is closed.
    set?.addEventListener("focusin", (ev) => {
      if (ev.target.localName === "select") this._pressing = true;
    });
    set?.addEventListener("focusout", (ev) => {
      if (ev.target.localName === "select") this._released();
    });
    set?.addEventListener("change", (ev) => {
      const el = ev.target;
      if (el.localName === "select") rcCall(h, "select", "select_option", { entity_id: el.dataset.id, option: el.value });
    });
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
    /* The illustrated header: the card's top, edge to edge, in the sky's colours (as the flight and train boards). */
    .banner { --sw: min(200px, 54%); position: relative; isolation: isolate; display: flex; align-items: center; box-sizing: border-box;
              padding: 0 0 10px 12px; overflow: hidden; height: 90px; margin: -12px -12px 0; color: #0d2a45;
              background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
    .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
    /* The house wall fades into the sky by itself: no mask on the scene. */
    .sc { all: unset; position: absolute; z-index: -1; right: 0; bottom: 10px; height: 80px; width: var(--sw); cursor: pointer; }
    .sc:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
    .scene { display: block; width: 100%; height: 100%; }
    /* The concrete drive in front of the house, edge to edge. */
    .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; pointer-events: none; background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
    .banner.night .ground { background: #2c323b; box-shadow: inset 0 2px 0 #3a414c; }
    .bh { flex: 0 1 auto; min-width: 0; max-width: calc(100% - var(--sw) + 4px); padding-right: 6px; }
    .banner .badge { color: var(--c); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
    .banner.night .badge { color: color-mix(in srgb, var(--c) 45%, #fff); background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: inherit; font-weight: 600; }
    .banner .subt { color: #3b5b78; }
    .banner.night .subt { color: rgba(255,255,255,.82); }
    /* The title line: the title, then the status pill when the whole title and the pill's whole label fit there
       (measured, see _fitPill); otherwise the pill goes under the subtitle (its copy on the level's line), the subtitle
       on one line; when that does not fit above the drive, or on a card of 200 px or less, only its dot stays. */
    .bh { flex: 1 1 auto; }
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > :first-child { flex: 0 1 auto; min-width: 0; }
    .trow > .chip { flex: none; }
    .tt.below .trow > .chip { display: none; }
    .tt.below .pl { display: flex; }
    .tt.below .bs { margin-top: 3px; }
    .pl .chip { max-width: 100%; }
    .tt.dot-only .chip { padding: 4px; } .tt.dot-only .chip .ct { display: none; }
    .bs { display: flex; align-items: center; gap: 8px; margin-top: 4px; min-width: 0; }
    .pl { display: none; flex: none; max-width: 100%; }
    /* On that line the pill keeps its label; the car's level goes to the next line when both do not fit. */
    .bs { flex-wrap: wrap; row-gap: 3px; }
    .bs:not(:has(.soc)) { margin-top: 0; }
    .chip { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; padding: 1px 8px; border-radius: 12px; font-size: 11px;
            font-weight: 500; line-height: 16px; white-space: nowrap; overflow: hidden;
            background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .chip .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; }
    .chip .ct { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .soc { flex: 0 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .soc b { white-space: nowrap; }
    .soc .bar { flex: 0 1 56px; min-width: 24px; height: 5px; border-radius: 3px; background: color-mix(in srgb, var(--c) 20%, transparent); overflow: hidden; }
    .soc .bar i { display: block; height: 100%; border-radius: 3px; background: var(--c); }
    .banner .zoom { color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    /* show_background: false — the wallbox, the cable and the car on the card itself, in the theme's colours. */
    .banner.bare { color: var(--primary-text-color); background: none; }
    .banner.bare .subt { color: var(--secondary-text-color); }
    .banner.bare .badge { background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: none; }
    /* The classic header (show_scene: false): the pill in the theme's colours. */
    .head:not(.bh) .chip { background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    .banner.bare .chip { background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    .banner.bare .zoom { color: var(--secondary-text-color); background: none; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
    :host([hide-title]) .banner .tt { visibility: visible; }
    :host([hide-title]) .banner .title, :host([hide-title]) .banner .subt { display: none; }
    @container (max-width: 320px) { .banner { --sw: 46%; } }
    /* A card of 200 px or less: only the pill's dot (where it goes is measured all the same). */
    ha-card { container: ev-card / inline-size; }
    @container ev-card (max-width: 200px) {
      .chip { padding: 4px; }
      .chip .ct { display: none; }
    }
    @keyframes ev-ring { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
    .ring { animation: ev-ring 1.8s ease-in-out infinite; }
    @keyframes ev-twinkle { from { opacity: .35 } to { opacity: 1 } }
    .scene .tw { animation: ev-twinkle 3.2s ease-in-out infinite alternate; }
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
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .gb { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .pb svg, .gb svg { width: 17px; height: 17px; }
    .seg { display: inline-flex; align-items: center; min-height: 44px; padding: 0 2px; border-radius: 999px; background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .seg button { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--primary-text-color); }
    .seg button:hover:not([disabled]) { background: color-mix(in srgb, var(--c) 15%, transparent); }
    .seg button[disabled] { opacity: .35; cursor: default; }
    .seg b, .sv { min-width: 48px; text-align: center; font-size: 14px; font-weight: 500; }
    .sv { all: unset; box-sizing: border-box; min-width: 56px; height: 36px; padding: 0 8px; border-radius: 999px; cursor: pointer; text-align: center; font-size: 14px; font-weight: 500; }
    .sv:hover, .sv[aria-expanded="true"] { background: color-mix(in srgb, var(--c) 15%, transparent); }
    /* The current presets, a row of pills under the controls. */
    .presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .ps { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; min-height: 32px; padding: 0 12px; border-radius: 999px;
          font-size: 13px; font-weight: 500; color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .ps:hover { background: color-mix(in srgb, var(--c) 15%, transparent); }
    .ps.on { color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 18%, transparent);
             box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 40%, transparent); }
    /* The charger's settings, folded under a header row. */
    .set { margin-top: 10px; border-radius: 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .sh { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; min-height: 40px; padding: 0 12px;
          border-radius: 12px; font-size: 13px; font-weight: 500; color: var(--primary-text-color); }
    .sh svg { flex: none; width: 16px; height: 16px; color: var(--c); }
    .sh span { flex: 1 1 auto; min-width: 0; }
    .sh svg:last-child { color: var(--secondary-text-color); transition: transform .2s; }
    .set.open .sh svg:last-child { transform: rotate(90deg); }
    .sl { display: flex; flex-direction: column; padding: 0 12px 6px; }
    .sr { display: flex; align-items: center; gap: 10px; min-height: 44px; border-top: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .sn { flex: 1 1 auto; min-width: 0; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tg { all: unset; box-sizing: border-box; cursor: pointer; flex: none; position: relative; width: 36px; height: 20px; border-radius: 10px;
          background: color-mix(in srgb, var(--secondary-text-color, #727272) 35%, transparent); transition: background .2s; }
    .tg i { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: transform .2s; }
    .tg.on { background: var(--c); }
    .tg.on i { transform: translateX(16px); }
    .seg.sm { flex: none; min-height: 32px; }
    .seg.sm button { width: 30px; height: 30px; font-size: 16px; }
    .seg.sm b { min-width: 52px; font-size: 13px; }
    .ss { flex: 0 1 auto; max-width: 55%; min-height: 30px; padding: 0 8px; border-radius: 8px; font: inherit; font-size: 13px; color: var(--primary-text-color);
          background: var(--card-background-color, transparent); border: 1px solid var(--divider-color, rgba(127,127,127,.3)); }
    .sv:focus-visible, .ps:focus-visible, .sh:focus-visible, .tg:focus-visible, .ss:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .pb:focus-visible, .gb:focus-visible, .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .gb.armed { color: color-mix(in srgb, var(--rc-warn) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--rc-warn) 18%, transparent); }
    .none { margin-top: 10px; padding: 12px; border-radius: 12px; font-size: 13px; color: var(--secondary-text-color);
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    @container (max-width: 300px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      /* Three tiles on two columns: the third spans the row rather than stand alone. */
      .grid > :nth-child(3):last-child { grid-column: 1 / -1; }
    }
    @media (prefers-reduced-motion: reduce) { .ring, .scene .tw { animation: none; } .tg, .tg i, .sh svg { transition: none; } }
  `;
}
