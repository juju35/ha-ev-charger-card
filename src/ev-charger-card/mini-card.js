// ── Mini card ────────────────────────────────────────────────────────────────
// The charger on two lines: a ring with the car's battery level (or the charging power) as the badge, the title and the
// state, then the key readings as pills; the zoom button opens the full card in place.
import { EV_ICONS } from "./core.js";
import { EvChargerCard } from "./card.js";
import { EV_HELPERS, evSchema } from "./editor.js";

export class EvChargerMiniCard extends rcMini(
  EvChargerCard,
  "ev-charger-mini-card",
  `
    .mini > .badge { background: none; }
    /* The classic mini card: the status pill after the whole title (measured, see _fitPill), else under it, else its dot. */
    .mini .body.below .head { flex-wrap: wrap; row-gap: 4px; }
    .mini .body.below .head::after { content: none; }
    .mini .body.below .head > .title { flex: 1 1 calc(100% - 32px); }
    .mini .body.below .head:not(:has(> .zoom)) > .title { flex-basis: 100%; }
    .mini .body.below .head > .st { order: 3; margin-left: 0; }
    .mini .body.dot-only .head > .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .mini .body.dot-only .head > .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .mini .body.dot-only .head > .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .ringb { width: 40px; height: 40px; }
    ha-card.mb { padding: 0; }
    .mb > .banner { height: 90px; margin: 0; }
    .banner .ringb { width: 40px; height: 40px; }
    .banner .badge:has(.ringb) { background: rgba(255,255,255,.62); }
    .banner.night .badge:has(.ringb) { background: rgba(255,255,255,.12); }
    .banner.bare .badge:has(.ringb) { background: none; }
    .big { font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .big.word { font-size: 18px; }
    .r { --t: var(--c); }
    .r.dim { --t: var(--rc-idle); }
  `,
) {
  getCardSize() {
    if (this._zoomed) return super.getCardSize();
    return this._config.show_scene === false ? 1 : 2;
  }

  // The battery ring of the badge: the car's level when known, else the charging power against `max_power` (kW).
  _ring(m) {
    const max = (Number(this._config.max_power) || 7.4) * 1000;
    const pct = m.soc != null ? m.soc : m.watts != null ? Math.min(100, (100 * m.watts) / max) : 0;
    const L = 2 * Math.PI * 17;
    return `<svg class="ringb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--c) 18%, transparent)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="var(--c)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${((L * pct) / 100).toFixed(1)} 999" transform="rotate(-90 20 20)"/><path d="M21 12l-5 9h4l-1 7 6-10h-4z" fill="var(--c)"/></svg>`;
  }

  // The illustrated mini card: the ring, the car's level (or the charging power) in large with the state as a chip,
  // then the name and the key readings; the scene at the right.
  _drawBanner(m) {
    const c = this._config;
    const car = m.state !== "idle" && m.state !== "offline";
    const kwh = m.session != null ? `${this._fmt(m.session, 1)} kWh` : null;
    const big = car && m.soc != null ? `${Math.round(m.soc)} %` : m.state === "charging" ? this._power(m) : "";
    const state = m.state === "error" ? m.error || this._t("st_error") : this._t(`st_${m.state}`);
    const readings = {
      charging: [big === this._power(m) ? kwh : this._power(m), m.duration],
      waiting: [m.limit?.value != null ? `${Math.round(m.limit.value)} A` : null],
      done: [kwh, m.duration],
    }[m.state] || [m.session != null ? `${this._t("t_last")} ${kwh}` : null];
    // The car's level (or the power) in large as the title, else the charger's name; the state as the pill after it.
    const named = !big && c.show_title !== false;
    const line = [c.show_title === false || named ? null : m.name, ...readings].filter(Boolean).join(" · ");
    const lead = this._titleRow(
      big ? `<b class="big">${rcEsc(big)}</b>` : `<b class="big word">${rcEsc(named ? m.name : state)}</b>`,
      this._chip(state, m.raw),
      line ? `<div class="subt" title="${rcEsc(line)}">${rcEsc(line)}</div>` : "",
    );
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} mb">${this._banner(m, this._ring(m), lead)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    root.querySelector(".sc")?.addEventListener("click", () => rcMoreInfo(this, m.ids.status || m.ids.power || m.ids.limit));
    this._fitPill();
  }

  _drawMini(m) {
    if (this._config.show_scene !== false) {
      const sig = ["banner", m.state, m.raw, m.watts && Math.round(m.watts / 100), m.session, m.duration, m.soc, m.error, m.limit?.value, m.name, this._dark(), this._night()];
      if (this._changed(sig)) this._drawBanner(m);
      return;
    }
    if (!this._changed(["mini", m.state, m.watts && Math.round(m.watts / 100), m.session, m.duration, m.soc, m.error, m.limit?.value, m.name])) return;
    const id = m.ids.status || m.ids.power || "";
    const chip = (text, dim) => `<button class="r pill${dim ? " dim" : ""}" data-id="${rcEsc(id)}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const kwh = m.session != null ? `${this._fmt(m.session, 1)} kWh` : null;
    // The state is the status pill after the title; the chips are the readings.
    const status = m.state === "error" ? m.error || this._t("st_error") : this._t(`st_${m.state}`);
    const chips = {
      charging: [this._power(m), m.soc != null ? `${Math.round(m.soc)} %` : kwh, m.duration],
      waiting: [m.soc != null ? `${Math.round(m.soc)} %` : null, m.limit?.value != null ? `${Math.round(m.limit.value)} A` : null],
      done: [kwh, m.duration],
      error: [],
    }[m.state] || [m.session != null ? `${this._t("t_last")} ${kwh}` : null];
    const html = chips
      .filter(Boolean)
      .map((t, i) => chip(t, i > 0))
      .join("");
    this._paintMini({ level: m.state, icon: EV_ICONS[m.state], status, chips: html });
    // The charger's name (or the title), as on the full card.
    const title = this.shadowRoot.querySelector(".mini .title");
    if (title) title.textContent = m.name;
    // The badge is the battery ring.
    const badge = this.shadowRoot.querySelector(".mini > .badge");
    if (badge) badge.innerHTML = this._ring(m);
  }
}

export const EvChargerMiniCardEditor = rcEditor({
  card: EvChargerMiniCard,
  helpers: [...EV_HELPERS, "max_power"],
  schema: (lang) => [
    ...evSchema(["show_title", "show_scene", "show_background", "animations", "show_controls", "zoom"])(lang).slice(0, -1),
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
