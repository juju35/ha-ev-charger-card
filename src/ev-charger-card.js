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

// The cars, seen from the side, rear to the wallbox: each one is its wheels (rear and front axle, radius, wheel arch,
// sill), its body and window outlines, its lights, door lines, handles and mirror, drawn by `evCar` with the same
// paint, glass, aero wheels and shadows. The charging port sits on the rear wing, at the same place on every car,
// where the cable ends.
const EV_VEHICLES = {
  // A fastback saloon with a glass roof, Tesla Model 3 style.
  sedan: {
    R: 242, F: 378, r: 18, ar: 21.5, sill: 146, top: 87, shadow: [310, 124],
    body: "M204 146 C199 146 197 143 197 139 L197 126 C197 120 198 115 201 112 L214 108.5 C238 99 262 90 292 88 C306 87.2 318 87.6 328 89.5 C340 92 352 99 362 105.5 C384 107.5 404 110 413 114 C419 117 421 122 421 128 L421 138 C421 143 418 146 413 146",
    glass: "M219 108.2 C240 99.6 263 90.9 292 89 C306 88.2 318 88.6 327.6 90.4 C339 93 350 99.4 357.6 105.2 L356.6 107.8 Z",
    refl: "M232 102.6 C252 95.6 272 92 292 90.8",
    pillars: "M313 89.6 L316 107.6",
    shoulder: "M214 109.5 C262 110 340 109 362 107.5 C388 109.5 405 112 413 115",
    crease: "M206 122 C260 121 330 121.5 400 123",
    doors: "M316 108.5 C315.5 120 316 132 317.5 140 M268 108.5 C266 116 265.5 120 266 124",
    handles: [292, 333, 112.4],
    mirror: "M350 104.5 C352 101 357 100.5 360 102 L360 106.5 L351 106.5 Z",
    head: "M403 115.4 C409 116.2 415 117.6 419.5 120",
    tail: "M197.6 116 C202 112.5 207 110.6 214 109.2",
    sideskirt: "M262 141.5 L356 141.5",
  },
  // A crossover SUV: taller, roof rails, black wheel-arch and sill cladding.
  suv: {
    R: 244, F: 376, r: 19.5, ar: 23.5, sill: 143, top: 80, shadow: [310, 124], cladding: true,
    body: "M205 146 C200 146 198 143 198 139 L198 112 C198 104 201 98 206 95 L214 89 C222 84.5 236 82 260 81 L318 80.5 C330 80.5 338 82 346 86 C354 90 362 96 368 101 C388 103 404 106 412 110 C418 113 421 118 421 124 L421 139 C421 143 418 146 414 146",
    glass: "M214 99 L217 92 C224 88 238 86 262 85.4 L318 85 C328 85 335 86.5 342 90 C350 94 356 98.5 361 102.6 L215 102.6 Z",
    refl: "M222 96 C240 90 268 88 300 87.6",
    pillars: "M248 85.6 L250 102.6 M305 85.2 L307 102.6",
    rails: "M228 83.2 C238 81.4 250 80.4 262 80 L326 79.8",
    shoulder: "M202 104.5 L362 104.5 C386 106 404 108.5 413 112",
    crease: "M203 121 C260 120 330 120.5 404 122",
    doors: "M306 104 C305.6 116 305.8 126 306.6 136 M252 104 C251 112 251 116 252 120",
    handles: [282, 333, 108.6],
    mirror: "M356 99.5 C358 96 363 95.5 366 97 L366 102 L357 102 Z",
    head: "M402 110.5 C409 111.6 415 113.4 419.8 116.6",
    tail: "M198.6 110 L198.6 99.5 C199.5 97 201.5 95.5 204 94.6",
  },
  // A city car: short, upright, two short overhangs.
  city: {
    R: 238, F: 350, r: 18, ar: 21.5, sill: 146, top: 83, shadow: [293, 100],
    body: "M207 146 C202 146 200 143 200 139 L200 112 C200 104 202 98 206 94 L211 89 C217 85 228 83.5 246 83.2 L292 83 C302 83.2 309 85 316 89.5 C323 94 330 99.5 336 104 C356 106 372 109 380 113 C384 116 386 120 386 126 L386 138 C386 143 383 146 379 146",
    glass: "M214 100 L216 93 C221 89 232 87.5 248 87.4 L290 87.3 C299 87.5 305 89 310.5 92.5 C317 97 322.5 100.5 327 104 L214 104 Z",
    refl: "M220 97 C236 91 258 89.4 284 88.6",
    pillars: "M270 87.4 L271.5 104",
    shoulder: "M204 106 L330 106 C352 107.5 370 110 380 114",
    crease: "M205 121 C250 120 310 120.5 380 122",
    doors: "M272 105 C271.6 118 272 130 273 140 M232 105 C231 112 231 116 232 121",
    handles: [250, 300, 109.6],
    mirror: "M322 100.5 C324 97 329 96.5 332 98 L332 103 L323 103 Z",
    head: "M372 111.8 C378 112.8 382 114.4 385.4 117",
    tail: "M200.6 110 L200.6 101",
  },
};
const EV_CABLE = "M78 133 C78 180, 150 186, 184 162 S 207 128 213 121";
const EV_CABLE_HANGING = "M78 133 C78 172, 118 174, 120 150 C121 138, 112 132, 104 132";

const evN = (n) => +n.toFixed(1);
// The cut of a wheel arch in the body's outline, from the front of the arch to its rear, over the top.
const evArch = (cx, cy, r, sill) => {
  const dx = Math.sqrt(r * r - (sill - cy) ** 2);
  return `L${evN(cx + dx)} ${sill} A${r} ${r} 0 1 0 ${evN(cx - dx)} ${sill}`;
};
// A tyre and its aero wheel: a disc with five openings and the hub.
const evWheel = (cx, cy, r, k, dark) => {
  const rr = r * 0.68;
  const at = (rad, a) => `${evN(cx + rad * Math.cos(a))} ${evN(cy + rad * Math.sin(a))}`;
  const ro = rr * 0.9;
  const ri = rr * 0.5;
  const pockets = [0, 1, 2, 3, 4]
    .map((i) => {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2 + 0.2;
      return `M${at(ro, a - 0.38)} A${evN(ro)} ${evN(ro)} 0 0 1 ${at(ro, a + 0.38)} L${at(ri, a + 0.24)} A${evN(ri)} ${evN(ri)} 0 0 0 ${at(ri, a - 0.24)} Z`;
    })
    .join(" ");
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#16181b"/><circle cx="${cx}" cy="${cy}" r="${evN(r - 1.6)}" fill="none" stroke="#2b2f35"/><circle cx="${cx}" cy="${cy}" r="${evN(rr + 0.8)}" fill="#0c0d0f"/><circle cx="${cx}" cy="${cy}" r="${evN(rr)}" fill="url(#rim${k})"/><path d="${pockets}" fill="${dark ? "#0b0c0e" : "#22262c"}"/><circle cx="${cx}" cy="${cy}" r="${evN(rr * 0.32)}" fill="url(#hub${k})"/><circle cx="${cx}" cy="${cy}" r="${evN(rr)}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".6"/>`;
};
// A car of EV_VEHICLES: contact shadows, wheel wells, the body and its lower trim, the windows, the lines and details,
// the lights, the charging port (in the colour of the state) and the wheels.
const evCar = (v, { uid, dark, acc }) => {
  const k = `v${uid}`;
  const p = dark
    ? { hi: "#7b838e", base: "#4b525c", crease: "#3c424a", low: "#2a2e34", line: "#22262b", trim: "#121417" }
    : { hi: "#ffffff", base: "#f3f5f8", crease: "#dde2e8", low: "#c3cad3", line: "#aab2bc", trim: "#1d2126" };
  const glass = dark ? ["#2a323c", "#12171d", "#07090c"] : ["#5d6b7c", "#252d38", "#11161c"];
  const cy = 159 - v.r;
  const body = `${v.body} ${evArch(v.F, cy, v.ar, v.sill)} ${evArch(v.R, cy, v.ar, v.sill)} Z`;
  const axles = [v.R, v.F];
  const well = (cx) => {
    const dx = Math.sqrt(v.ar ** 2 - (v.sill - cy) ** 2);
    return `<path d="M${evN(cx - dx)} ${v.sill} A${v.ar} ${v.ar} 0 1 1 ${evN(cx + dx)} ${v.sill} Z" fill="#0d0f12"/>`;
  };
  // Black plastic around the wheel arches (SUV).
  const cladding = (cx) => {
    const y = v.sill + 3;
    const ro = v.ar + 3.2;
    const di = Math.sqrt(v.ar ** 2 - (y - cy) ** 2);
    return `<path d="M${evN(cx - ro + 0.2)} ${y} A${ro} ${ro} 0 0 1 ${evN(cx + ro - 0.2)} ${y} L${evN(cx + di)} ${y} A${v.ar} ${v.ar} 0 0 0 ${evN(cx - di)} ${y} Z" fill="${p.trim}" opacity=".85"/>`;
  };
  const lowY = v.cladding ? 136 : 139;
  const light = (d, color, glow) =>
    `<path d="${d}" stroke="${color}" stroke-width="2.5" stroke-linecap="round" fill="none"/>${glow ? `<path d="${d}" stroke="${glow}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".35" filter="url(#bl${uid})"/>` : ""}`;
  return `
    <defs>
      <linearGradient id="bd${k}" x1="0" x2="0" y1="${v.top}" y2="147" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.hi}"/><stop offset=".38" stop-color="${p.base}"/><stop offset=".5" stop-color="${p.crease}"/><stop offset=".56" stop-color="${p.base}"/><stop offset=".82" stop-color="${p.base}"/><stop offset="1" stop-color="${p.low}"/></linearGradient>
      <linearGradient id="gl${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${glass[0]}"/><stop offset=".55" stop-color="${glass[1]}"/><stop offset="1" stop-color="${glass[2]}"/></linearGradient>
      <linearGradient id="rf${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${dark ? 0.12 : 0.28}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="sl${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="${dark ? 0.22 : 0.9}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="rim${k}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${dark ? "#c9ced5" : "#eef1f4"}"/><stop offset=".6" stop-color="${dark ? "#8a929c" : "#b8bfc8"}"/><stop offset="1" stop-color="${dark ? "#5b626b" : "#808892"}"/></radialGradient>
      <radialGradient id="hub${k}"><stop offset="0" stop-color="#6b737d"/><stop offset="1" stop-color="#2a2f35"/></radialGradient>
      <clipPath id="bc${k}"><path d="${body}"/></clipPath>
    </defs>
    <ellipse cx="${v.shadow[0]}" cy="158" rx="${v.shadow[1]}" ry="5.5" fill="url(#sh${uid})"/>
    ${axles.map((x) => `<ellipse cx="${x}" cy="158.5" rx="${v.ar}" ry="2.5" fill="#000" opacity="${dark ? 0.6 : 0.35}"/>`).join("")}
    ${axles.map(well).join("")}
    <path d="${body}" fill="url(#bd${k})" stroke="${p.line}" stroke-width=".8"/>
    <g clip-path="url(#bc${k})"><rect x="190" y="${lowY}" width="240" height="12" fill="${p.trim}" opacity="${v.cladding ? 0.85 : dark ? 0.55 : 0.12}"/></g>
    ${v.sideskirt ? `<path d="${v.sideskirt}" stroke="${p.trim}" stroke-width="5" opacity=".72"/>` : ""}
    ${v.cladding ? axles.map(cladding).join("") : ""}
    ${v.rails ? `<path d="${v.rails}" stroke="${p.trim}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".85"/>` : ""}
    <path d="${v.glass}" fill="url(#gl${k})"/>
    <path d="${v.refl}" stroke="url(#rf${k})" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="${v.pillars}" stroke="${p.trim}" stroke-width="3"/>
    <path d="${v.shoulder}" stroke="url(#sl${k})" stroke-width="1.6" fill="none"/>
    <path d="${v.crease}" stroke="${p.line}" stroke-width=".7" fill="none" opacity=".7"/>
    <path d="${v.doors}" stroke="${p.line}" stroke-width=".8" fill="none"/>
    ${v.handles.slice(0, 2).map((x) => `<rect x="${x}" y="${v.handles[2]}" width="12" height="2.2" rx="1.1" fill="${p.line}"/>`).join("")}
    <path d="${v.mirror}" fill="${p.trim}"/>
    ${light(v.head, dark ? "#ffe9b0" : "#fff3cf", "#ffd166")}${light(v.tail, "#e5484d")}
    <rect x="207" y="112.5" width="12" height="9.5" rx="3" fill="#15181c"/>
    <circle cx="213" cy="117.2" r="2.3" fill="${acc}"/><circle cx="213" cy="117.2" r="5.5" fill="${acc}" opacity=".4" filter="url(#bl${uid})"/>
    ${axles.map((x) => evWheel(x, cy, v.r, k, dark)).join("")}`;
};

// The illustration: the wall and the floor, the wallbox and its LED ring, the cable (with energy flowing along it while
// charging) and the car (`vehicle`: sedan, suv or city) with its charging port; a glass pill with the car's battery
// level, else the charging power. No car when none is plugged in: the cable hangs from the wallbox.
const evScene = ({ state, dark, uid, pct, pill, label, animate, vehicle }) => {
  const acc = EV_ACCENTS[state];
  const car = state !== "idle" && state !== "offline";
  const W = dark ? ["#262a30", "#1d2025", "#17191d"] : ["#f7f9fc", "#e8ecf2", "#dfe4eb"];
  const paint = dark ? ["#4a515b", "#30353c", "#666e79"] : ["#fbfcfe", "#dfe4ea", "#b9c1cb"];
  const glass = dark ? ["#232a33", "#0d1116"] : ["#6d7a8b", "#28313d"];
  const txt = dark ? "#f0f0f0" : "#1f2329";
  const cable = car ? EV_CABLE : EV_CABLE_HANGING;
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
  const carSvg = car ? evCar(EV_VEHICLES[vehicle] || EV_VEHICLES.sedan, { uid, dark, acc }) : "";
  const bar = pct != null ? `<rect x="304" y="44" width="98" height="6" rx="3" fill="${dark ? "#2c3138" : "#e3e8ef"}"/><rect x="304" y="44" width="${((98 * Math.max(0, Math.min(100, pct))) / 100).toFixed(1)}" height="6" rx="3" fill="${acc}"/>` : "";
  const pillTop = pct != null ? 36 : 43;
  return `
  <svg class="scene" viewBox="0 0 430 190" role="img" aria-label="${rcEsc([pill, label].filter(Boolean).join(" · "))}">
    <defs>
      <linearGradient id="w${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${W[0]}"/><stop offset="1" stop-color="${W[1]}"/></linearGradient>
      <linearGradient id="f${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${W[1]}"/><stop offset="1" stop-color="${W[2]}"/></linearGradient>
      <linearGradient id="p${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paint[0]}"/><stop offset=".55" stop-color="${paint[0]}"/><stop offset="1" stop-color="${paint[1]}"/></linearGradient>
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
        ? `    <g class="glass"><g filter="url(#ds${uid})"><rect x="290" y="16" width="126" height="44" rx="14" fill="${dark ? "rgba(20,22,26,.72)" : "rgba(255,255,255,.82)"}" stroke="${dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"}"/></g>
    <text x="304" y="${pillTop}" font-family="Roboto,sans-serif" font-size="17" font-weight="700" fill="${txt}">${rcEsc(pill)}</text>
    <text x="402" y="${pillTop - 1}" text-anchor="end" font-family="Roboto,sans-serif" font-size="10.5" font-weight="500" fill="${dark ? acc : `color-mix(in srgb, ${acc} 60%, #1f2329)`}">${rcEsc(label)}</text>
    ${bar}</g>
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
      none: !device || !Object.values(e).some(Boolean),
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

  _draw(m) {
    const c = this._config;
    const dark = this._dark();
    const status = this._status(m);
    // The car's level when one is plugged in and known, else the charging power; with no car, the state alone.
    const noCar = m.state === "idle" || m.state === "offline";
    const pill = noCar ? "" : m.soc != null ? `${Math.round(m.soc)} %` : this._power(m) || this._t(`st_${m.state}`);
    const label = !pill || pill === this._t(`st_${m.state}`) ? "" : this._t(`st_${m.state}`);
    const tiles = this._tileList(m);
    // Redrawn only when something shown changes: a session energy moving by a few Wh, still 12.4 kWh on screen, must
    // not rebuild the card (and restart the energy flowing along the cable).
    const parts = [m.none, m.state, m.raw, m.name, m.sub, status, pill, label, tiles, m.error, m.limit, m.lock, m.switchId, m.startId, m.stopId, this._armLock, dark];
    if (!this._changed(parts)) return;
    const head = `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${m.none ? "mdi:ev-station" : EV_ICONS[m.state]}"></ha-icon></div>
        <div class="tt"><div class="title">${rcEsc(m.name)}</div>${m.sub ? `<div class="subt">${rcEsc(m.sub)}</div>` : ""}</div>
        ${m.none ? "" : `<span class="pill" title="${rcEsc(m.raw || status)}"><span class="pt">${rcEsc(status)}</span></span>`}
      </div>`;
    // No charger: say so, rather than draw one with no car.
    if (m.none) {
      this._paint("idle", `${head}<div class="none">${rcEsc(this._t("no_charger"))}</div>`, "");
      return;
    }
    const scene =
      c.show_scene === false
        ? ""
        : `<button class="sc" title="${rcEsc(m.raw || status)}">${evScene({ state: m.state, dark, uid: `${this._uid ||= Math.random().toString(36).slice(2, 8)}`, pct: m.soc != null && !noCar ? m.soc : null, pill, label, animate: this._animate(), vehicle: c.vehicle })}</button>${pill ? `<div class="sl">${rcEsc([pill, label].filter(Boolean).join(" · "))}</div>` : ""}`;
    const error = m.error ? `<div class="err" role="alert">${rcEsc(m.error)}</div>` : "";
    this._paint(m.state, head + scene + error, tiles.map((t) => this._tile(t)).join(""));
  }

  _afterGrid() {
    const m = this._items;
    if (!m || m.none || this._config.show_controls === false) return "";
    const primary = this._primary(m);
    const btn = primary
      ? `<button class="pb act-${primary}" data-k="primary">${evIcon(EV_SVG[primary])}<span>${rcEsc(this._t(primary))}</span></button>`
      : "";
    const step = m.limit
      ? `<span class="seg" role="group" aria-label="${rcEsc(this._t("t_limit"))}"><button class="act-lower" data-k="lower" aria-label="${rcEsc(this._t("lower"))}"${m.limit.value <= m.limit.min ? " disabled" : ""}>−</button><b aria-live="polite">${rcEsc(m.limit.value != null ? `${Math.round(m.limit.value)} A` : "—")}</b><button class="act-raise" data-k="raise" aria-label="${rcEsc(this._t("raise"))}"${m.limit.value >= m.limit.max ? " disabled" : ""}>+</button></span>`
      : "";
    // The lock button says what a press does (its state is aria-pressed); unlocking while charging asks for a second press.
    const action = m.lock ? `${m.lock.locked ? "unlock" : "lock"}${m.lock.cable ? "" : "_box"}` : "";
    const lock =
      m.lock && primary !== "unlock"
        ? `<button class="gb act-lock${this._armLock ? " armed" : ""}" data-k="lock" aria-pressed="${m.lock.locked}" title="${rcEsc(this._t(m.lock.locked ? "locked" : "unlocked"))}">${evIcon(EV_SVG[m.lock.locked ? "lock" : "unlock"])}<span>${rcEsc(this._t(this._armLock ? "confirm" : action))}</span></button>`
        : "";
    return btn || step || lock ? `<div class="ctl">${btn}${step}${lock}</div>` : "";
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearTimeout(this._armTimer);
    this._armLock = false;
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
    const setLimit = (delta) => {
      const l = m.limit;
      const pending = this._limitAsked && Date.now() - this._limitAsked.at < 5000 && this._limitAsked.id === l.id ? this._limitAsked.value : null;
      const from = pending ?? l.value ?? l.min;
      const value = Math.min(l.max, Math.max(l.min, from + delta * l.step));
      if (value === from) return;
      this._limitAsked = { id: l.id, value, at: Date.now() };
      const shown = root.querySelector(".seg b");
      if (shown) shown.textContent = `${Math.round(value)} A`;
      rcCall(h, "number", "set_value", { entity_id: l.id, value });
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
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .gb { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .pb svg, .gb svg { width: 17px; height: 17px; }
    .seg { display: inline-flex; align-items: center; min-height: 44px; padding: 0 2px; border-radius: 999px; background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .seg button { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--primary-text-color); }
    .seg button:hover:not([disabled]) { background: color-mix(in srgb, var(--c) 15%, transparent); }
    .seg button[disabled] { opacity: .35; cursor: default; }
    .seg b { min-width: 48px; text-align: center; font-size: 14px; font-weight: 500; }
    .pb:focus-visible, .gb:focus-visible, .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .gb.armed { color: color-mix(in srgb, var(--rc-warn) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--rc-warn) 18%, transparent); }
    .none { margin-top: 10px; padding: 12px; border-radius: 12px; font-size: 13px; color: var(--secondary-text-color);
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    /* The glass pill's text, drawn in the scene, gets too small on a narrow card: a line under it instead. */
    .sl { display: none; margin-top: 6px; font-size: 13px; font-weight: 500; color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    @container (max-width: 360px) { .glass { display: none; } .sl { display: block; } }
    @container (max-width: 300px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      /* Three tiles on two columns: the third spans the row rather than stand alone. */
      .grid > :nth-child(3):last-child { grid-column: 1 / -1; }
    }
    @media (prefers-reduced-motion: reduce) { .ring { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const evSchema = (booleans) => (lang) => [
  { name: "device", selector: { device: {} } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "battery", selector: { entity: { domain: "sensor", device_class: "battery" } } },
  {
    name: "vehicle",
    selector: { select: { mode: "dropdown", options: Object.keys(EV_VEHICLES).map((value) => ({ value, label: rcT(EV_I18N, lang, `ed_vehicle_${value}`) })) } },
  },
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
