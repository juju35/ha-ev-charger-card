import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const ev = load();
const { cards } = ev;
const json = (v) => JSON.parse(JSON.stringify(v));

// A card whose shadow root answers every selector with nodes recording their click listeners.
const make = (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  return card;
};
const click = (card, sel) => card._nodes[sel].listeners.click({ stopPropagation() {} });

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["ev-charger-card", "ev-charger-mini-card"]) {
    assert.ok(ev.customElements.get(tag), tag);
    assert.ok(ev.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(ev.window.customCards.map((c) => c.type)), ["ev-charger-card", "ev-charger-mini-card"]);
});

test("states: the integrations' words brought down to five", () => {
  const cases = {
    charging: "charging",
    Charging: "charging",
    connected_charging: "charging",
    awaiting_start: "waiting",
    ready_to_charge: "waiting",
    "Paused by user": "waiting",
    "Waiting for car demand": "waiting",
    WaitCar: "waiting",
    plugged_in: "waiting",
    completed: "done",
    connected_finished: "done",
    Complete: "done",
    disconnected: "idle",
    "Waiting for car": "idle",
    unplugged: "idle",
    Idle: "idle",
    error: "error",
    Fault: "error",
    Ready: "idle",
    no_ev_connected: "idle",
    not_charging: "waiting",
    charging_stopped: "waiting",
    Finishing: "done",
    Reserved: "waiting",
    Faulted: "error",
    "Waiting MID failed": "error",
    // V2C Trydan, in English, Spanish and Italian.
    "Waiting for vehicle": "idle",
    "Vehicle connected (idle)": "waiting",
    "Manguera no conectada": "idle",
    "Manguera conectada (NO CARGA)": "waiting",
    "Manguera conectada (CARGANDO)": "charging",
    "Esperando vehículo": "idle",
    "Vehículo conectado (inactivo)": "waiting",
    Cargando: "charging",
    "In attesa del veicolo": "idle",
    "Veicolo collegato": "waiting",
    "In carica": "charging",
    "System fault / leak detected": "error",
    "Ventilation required": "error",
  };
  for (const [raw, want] of Object.entries(cases)) assert.equal(ev.evStateOf(raw), want, raw);
  assert.equal(ev.evStateOf("unavailable"), undefined);
  assert.equal(ev.evStateOf("42"), undefined);
});

test("discovery: a plug feeding a phone charger is not taken for a car charger", () => {
  const h = makeHass();
  for (const [id, r] of Object.entries(h.entities)) if (r.platform === "easee") h.entities[id] = { ...r, platform: "zha" };
  assert.deepEqual(json(ev.evChargers(h)), ["charger"]);
  h.devices.charger = { ...h.devices.charger, name: "Phone charger plug" };
  assert.deepEqual(json(ev.evChargers(h)), []);
});

test("discovery: each role on the charger's device, the most likely charger picked", () => {
  const h = makeHass();
  assert.deepEqual(json(ev.evChargers(h)), ["charger"]);
  const r = ev.evFind(h, "charger");
  assert.equal(r.status, "sensor.garage_status");
  assert.equal(r.power, "sensor.garage_power");
  assert.equal(r.energy, "sensor.garage_session_energy");
  assert.equal(r.total, "sensor.garage_lifetime_energy");
  assert.equal(r.limit, "number.garage_dynamic_charger_limit");
  assert.equal(r.switch, "switch.garage_charger_enabled");
  assert.equal(r.lock, "lock.garage_cable_locked");
  assert.equal(r.error, "sensor.garage_error");
  assert.equal(r.duration, "sensor.garage_charging_time");
  assert.equal(r.cost, "sensor.garage_session_cost");
  // An override wins.
  assert.equal(ev.evFind(h, "charger", { power: "sensor.car_power" }).power, "sensor.car_power");
  // The stub picks the charger.
  assert.deepEqual(json(cards["ev-charger-card"].getStubConfig(h)), { device: "charger" });
});

test("charging: status, power, session tiles and the pause button", () => {
  const card = make("ev-charger-card", { device: "charger", battery: "sensor.car_battery" });
  const m = card._items;
  assert.equal(m.state, "charging");
  assert.equal(m.watts, 7200);
  assert.equal(m.soc, 68);
  assert.equal(card._status(m), "Charging · 7.2 kW");
  assert.deepEqual(json(card._tileList(m).map((t) => t[1])), ["t_session", "t_time", "t_cost"]);
  assert.equal(m.duration, "1 h 42");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /lvl-charging/);
  assert.match(html, /animateMotion/);
  assert.match(html, /68 %/);
  assert.match(html, /act-pause/);
  assert.match(html, /32 A/);
});

test("actions: pause turns the switch off, the limit steps within its range, the lock toggles", () => {
  const h = makeHass();
  const card = make("ev-charger-card", { device: "charger" }, h);
  click(card, ".act-pause");
  click(card, ".act-lower");
  // Unlocking while charging: the first press arms, the second unlocks.
  click(card, ".act-lock");
  assert.match(card.shadowRoot.innerHTML, /act-lock armed[\s\S]*Press again to unlock/);
  click(card, ".act-lock");
  assert.deepEqual(json(h.calls), [
    ["switch", "turn_off", { entity_id: "switch.garage_charger_enabled" }],
    ["number", "set_value", { entity_id: "number.garage_dynamic_charger_limit", value: 31 }],
    ["lock", "unlock", { entity_id: "lock.garage_cable_locked" }],
  ]);
  // At its maximum, the + button is disabled and does nothing.
  assert.match(card.shadowRoot.innerHTML, /act-raise[^>]*disabled/);
});

test("waiting, done, idle: the primary action follows the state", () => {
  const waiting = make("ev-charger-card", { device: "charger" }, makeHass({ status: "awaiting_start", power: "0" }));
  assert.equal(waiting._items.state, "waiting");
  assert.equal(waiting._primary(waiting._items), "start");
  const done = make("ev-charger-card", { device: "charger" }, makeHass({ status: "completed", power: "0" }));
  assert.equal(done._primary(done._items), "unlock");
  assert.match(done.shadowRoot.innerHTML, /act-unlock/);
  const idle = make("ev-charger-card", { device: "charger" }, makeHass({ status: "disconnected", power: "0" }));
  assert.equal(idle._items.state, "idle");
  assert.doesNotMatch(idle.shadowRoot.innerHTML, /animateMotion|A20 20 0 0 0 358 141/, "no car, no flow");
});

test("error: from the error sensor, shown under the illustration", () => {
  const card = make("ev-charger-card", { device: "charger" }, makeHass({ status: "charging", error: "earth_fault" }));
  assert.equal(card._items.state, "error");
  assert.match(card.shadowRoot.innerHTML, /class="err" role="alert">earth_fault/);
});

test("offline, and a charger without a status sensor", () => {
  const h = makeHass();
  h.states["sensor.garage_status"] = st("sensor.garage_status", "unavailable");
  h.states["sensor.garage_power"] = st("sensor.garage_power", "unavailable", { device_class: "power" });
  assert.equal(make("ev-charger-card", { device: "charger" }, h)._items.state, "offline");
  const noStatus = makeHass();
  delete noStatus.states["sensor.garage_status"];
  assert.equal(make("ev-charger-card", { device: "charger" }, noStatus)._items.state, "charging", "power above 50 W");
});

test("OCPP: a capitalised Unavailable is offline", () => {
  const h = makeHass({ status: "Unavailable", power: "0" });
  assert.equal(make("ev-charger-card", { device: "charger" }, h)._items.state, "offline");
});

test("a status reading unknown at start is found once it reports", () => {
  const h = makeHass({ status: "unknown", power: "0" });
  h.states["sensor.garage_status"].attributes.friendly_name = "Garage Charger mode";
  const card = make("ev-charger-card", { device: "charger" }, h);
  card.hass = { ...h, states: { ...h.states, "sensor.garage_status": st("sensor.garage_status", "connected_charging", { friendly_name: "Garage Charger mode" }) } };
  assert.equal(card._items.state, "charging");
});

test("a pause switch works the other way round", () => {
  const h = makeHass({ status: "charging" });
  delete h.states["switch.garage_charger_enabled"];
  h.entities["switch.garage_pause_charging"] = { device_id: "charger", platform: "zappi" };
  h.states["switch.garage_pause_charging"] = st("switch.garage_pause_charging", "off", { friendly_name: "Garage Pause charging" });
  const card = make("ev-charger-card", { device: "charger" }, h);
  click(card, ".act-pause");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_on", { entity_id: "switch.garage_pause_charging" }]);
});

test("redraws when the current changes", () => {
  const h = makeHass();
  delete h.states["sensor.garage_charging_time"];
  delete h.states["sensor.garage_session_cost"];
  h.entities["sensor.garage_current"] = { device_id: "charger", platform: "easee" };
  const amps = (v) => ({ ...h.states, "sensor.garage_current": st("sensor.garage_current", v, { device_class: "current", unit_of_measurement: "A" }) });
  const card = make("ev-charger-card", { device: "charger" }, { ...h, states: amps("16") });
  assert.match(card.shadowRoot.innerHTML, /16<small>A/);
  card.hass = { ...h, states: amps("6") };
  assert.match(card.shadowRoot.innerHTML, /6<small>A/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /16<small>A/);
});

test("a charger lock (Wallbox) is no cable lock: no unlock after charging, its own label", () => {
  const h = makeHass({ status: "completed", power: "0" });
  delete h.states["lock.garage_cable_locked"];
  h.entities["lock.garage_locked"] = { device_id: "charger", platform: "wallbox" };
  h.states["lock.garage_locked"] = st("lock.garage_locked", "locked", { friendly_name: "Garage Locked" });
  const card = make("ev-charger-card", { device: "charger" }, h);
  assert.equal(card._primary(card._items), null);
  assert.match(card.shadowRoot.innerHTML, /act-lock" data-k="lock" aria-pressed="true"[^>]*>[\s\S]*?<span>Unlock the charger<\/span>/);
  const easee = make("ev-charger-card", { device: "charger" }, makeHass({ status: "completed", power: "0" }));
  assert.equal(easee._primary(easee._items), "unlock");
});

test("quick presses on the limit add up, shown at once", () => {
  const h = makeHass({ status: "awaiting_start", power: "0" });
  const card = make("ev-charger-card", { device: "charger" }, h);
  for (let i = 0; i < 3; i++) click(card, ".act-lower");
  assert.deepEqual(json(h.calls.map((c) => c[2].value)), [31, 30, 29]);
  assert.equal(card._nodes[".seg .val"].textContent, "29 A");
  assert.doesNotMatch(card.shadowRoot.innerHTML, /<span class="xl">Limit/, "no limit tile above the stepper");
});

test("redraws only when something shown changes", () => {
  const h = makeHass();
  const card = make("ev-charger-card", { device: "charger" }, h);
  let writes = 0;
  const root = card.shadowRoot;
  let html = root.innerHTML;
  Object.defineProperty(root, "innerHTML", { get: () => html, set: (v) => { writes++; html = v; } });
  for (let i = 1; i <= 50; i++) {
    card.hass = { ...h, states: { ...h.states, "sensor.garage_session_energy": st("sensor.garage_session_energy", String(12.4 + i * 0.0004), { device_class: "energy", unit_of_measurement: "kWh", friendly_name: "Garage Session energy" }) } };
  }
  assert.equal(writes, 0);
});

test("no charger: a message, no scene", () => {
  const h = makeHass();
  h.entities = {};
  const card = make("ev-charger-card", {}, h);
  assert.match(card.shadowRoot.innerHTML, /No charger found/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="scene"|class="ctl"/);
});

test("reduced motion: the energy stops flowing", () => {
  const prev = ev.window.matchMedia;
  ev.window.matchMedia = (q) => ({ matches: q.includes("reduce") });
  try {
    assert.doesNotMatch(make("ev-charger-card", { device: "charger" }).shadowRoot.innerHTML, /repeatCount="indefinite"/);
  } finally {
    ev.window.matchMedia = prev;
  }
});

test("discovery: a charge mode select is no status", () => {
  const h = makeHass();
  h.entities = { "select.garage_charge_mode": { device_id: "charger", platform: "easee" }, ...h.entities };
  h.states["select.garage_charge_mode"] = st("select.garage_charge_mode", "eco", { friendly_name: "Garage Charge mode", options: ["eco", "fast"] });
  assert.equal(ev.evFind(h, "charger").status, "sensor.garage_status");
  assert.equal(make("ev-charger-card", { device: "charger" }, h)._items.state, "charging");
  // A select named a status still counts when it is the only one.
  const only = makeHass();
  delete only.states["sensor.garage_status"];
  only.entities = { "select.garage_charger_status": { device_id: "charger", platform: "easee" }, ...only.entities };
  only.states["select.garage_charger_status"] = st("select.garage_charger_status", "charging", { friendly_name: "Garage Charger status" });
  assert.equal(ev.evFind(only, "charger").status, "select.garage_charger_status");
});

test("options: no illustration, no animation, no controls", () => {
  const card = make("ev-charger-card", { device: "charger", show_scene: false, show_controls: false });
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="scene"|class="ctl"/);
  const still = make("ev-charger-card", { device: "charger", animations: false }).shadowRoot.innerHTML;
  assert.doesNotMatch(still, /repeatCount="indefinite"/, "nothing moves");
  assert.match(still, /fill="freeze"/, "the particles stay on the cable");
});

test("options: each car and paint draws its own illustration, an unknown one the saloon", () => {
  const scene = (config) => {
    const card = make("ev-charger-card", { device: "charger", animations: false, ...config });
    const html = card.shadowRoot.innerHTML;
    const start = html.indexOf('<svg class="scene"');
    return html.slice(start, html.indexOf("</svg>", start)).replace(new RegExp(`${card._uid}(?=[")])`, "g"), "");
  };
  const cars = ["sedan", "hatch", "estate", "crossover", "coupe_suv", "small_suv", "suv", "city", "van"].map((vehicle) => scene({ vehicle }));
  assert.equal(new Set(cars).size, cars.length, "nine different cars");
  assert.equal(scene({ vehicle: "spaceship" }), scene({}), "unknown car: the saloon");
  const paints = ["white", "silver", "grey", "black", "blue", "red", "green"].map((color) => scene({ color }));
  assert.equal(new Set(paints).size, paints.length, "seven different paints");
  assert.equal(scene({ color: "pink" }), scene({}), "unknown paint: the theme's");
});

test("illustration theme: forced, else the sun below the horizon or the dark theme", () => {
  const sky = (config, hass) => {
    const html = make("ev-charger-card", { device: "charger", ...config }, hass).shadowRoot.innerHTML;
    return /class="banner night"/.test(html) && /#3a3530/.test(html.slice(html.indexOf('<svg class="scene"'))) ? "night" : "day";
  };
  const sun = (state, dark = false) => {
    const h = makeHass();
    h.states["sun.sun"] = st("sun.sun", state);
    h.themes = { darkMode: dark };
    return h;
  };
  assert.equal(sky({ illustration_theme: "night" }, sun("above_horizon")), "night");
  assert.equal(sky({ illustration_theme: "day" }, sun("below_horizon", true)), "day");
  assert.equal(sky({}, sun("below_horizon")), "day", "light theme after sunset: day");
  assert.equal(sky({}, sun("below_horizon", true)), "night", "dark theme after sunset: night");
  assert.equal(sky({}, sun("above_horizon", true)), "night", "dark theme while the sun is up: night");
  assert.equal(sky({}, sun("above_horizon")), "day", "light theme while the sun is up: day");
  assert.equal(sky({ illustration_theme: "day" }, sun("above_horizon", true)), "day");
  const noSun = makeHass();
  delete noSun.states["sun.sun"];
  noSun.themes = { darkMode: true };
  assert.equal(sky({}, noSun), "night", "no sun: the dark theme");
});

test("banner: the house wall, the concrete strip, a car icon in the state's colour, unique ids", () => {
  const card = make("ev-charger-card", { device: "charger" });
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="ground"/, "the concrete strip");
  assert.match(html, /#efe3cf/, "the house wall");
  assert.match(html, /<ha-icon icon="mdi:car">/, "the car icon");
  assert.match(html, /\.banner \{[^}]*height: 90px/, "90 px high");
  const other = make("ev-charger-card", { device: "charger" }).shadowRoot.innerHTML;
  const ids = (h) => [...h.matchAll(/id="(wm[^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids(html).length && ids(html)[0] !== ids(other)[0], "each card its own ids");
});

test("show_background: false keeps the wallbox and the car, not the backdrop", () => {
  const html = make("ev-charger-card", { device: "charger", show_background: false }).shadowRoot.innerHTML;
  const svg = html.slice(html.indexOf('<svg class="scene"'));
  assert.match(html, /class="banner bare"/);
  assert.doesNotMatch(svg, /#a7d39f|#1d3a4a|#efe3cf/, "no hill, no house wall");
  assert.doesNotMatch(html, /class="ground"/, "no concrete strip");
  assert.match(svg, /animateMotion|<circle/, "the wallbox and its cable");
  assert.match(svg, /id="bdv/, "the car");
  const mini = make("ev-charger-mini-card", { device: "charger", show_background: false }).shadowRoot.innerHTML;
  assert.match(mini, /class="banner bare"/);
});

test("mini card: the illustrated banner — the ring, the level in large, the state and the readings", () => {
  const mini = make("ev-charger-mini-card", { device: "charger", battery: "sensor.car_battery" });
  const html = mini.shadowRoot.innerHTML;
  assert.match(html, /class="lvl-charging mb"/);
  assert.match(html, /<svg class="scene"/);
  assert.match(html, /class="ringb"/);
  // The level in large as the title, the state as the pill right after it (its copy under the subtitle when narrow).
  assert.match(html, /class="trow"><b class="big">68 %<\/b><span class="chip"[^>]*><span class="dot"><\/span><span class="ct">Charging<\/span>/);
  assert.match(html, /class="pl"><span class="chip"/);
  assert.match(html, /7.2 kW · 1 h 42/);
  assert.equal(mini._config.zoom, true);
  assert.equal(mini.getCardSize(), 2);
});

test("mini card without the illustration: the readings as pills, a ring badge", () => {
  const mini = make("ev-charger-mini-card", { device: "charger", battery: "sensor.car_battery", show_scene: false });
  const html = mini.shadowRoot.innerHTML;
  assert.doesNotMatch(html, /<svg class="scene"/);
  assert.match(html, /class="r pill/);
  assert.match(html, /class="st"[^>]*><span class="pt">Charging</, "the state as the status pill after the title");
  assert.match(html, /7.2 kW/);
  assert.match(html, /68 %/);
  assert.equal(mini.getCardSize(), 1);
});

test("full card: the illustrated header, or the classic one without the illustration", () => {
  const card = make("ev-charger-card", { device: "charger", battery: "sensor.car_battery" }).shadowRoot.innerHTML;
  assert.match(card, /class="banner/);
  assert.match(card, /class="trow"><div class="title">[^<]*<\/div><span class="chip"[^>]*><span class="dot"><\/span><span class="ct">Charging</);
  assert.match(card, /class="subt" title="[^"]*">7.2 kW · /);
  assert.match(card, /<b>68 %<\/b>/);
  const plain = make("ev-charger-card", { device: "charger", show_scene: false }).shadowRoot.innerHTML;
  assert.doesNotMatch(plain, /class="banner/);
  // The classic header: the status pill right after the title too (where it goes is measured in the browser).
  assert.match(plain, /class="trow"><div class="title">[^<]*<\/div><span class="chip"[^>]*><span class="dot"><\/span><span class="ct">Charging[^<]*</);
});

test("editors: defaults stay out of the YAML, every field has a label", () => {
  const flat = (schema) => schema.flatMap((f) => (f.schema ? flat(f.schema) : [f]));
  for (const tag of ["ev-charger-card", "ev-charger-mini-card"]) {
    const ed = new (ev.customElements.get(`${tag}-editor`))();
    ed.appendChild = () => {};
    ed.setConfig({ type: `custom:${tag}`, device: "charger" });
    ed.hass = makeHass();
    for (const f of flat(ed._form.schema)) {
      assert.notEqual(ed._form.computeLabel(f), `ed_${f.name}`, `${tag}: no label for ${f.name}`);
      const helper = ed._form.computeHelper(f);
      if (helper !== undefined) assert.notEqual(helper, `ed_${f.name}_helper`, `${tag}: no helper for ${f.name}`);
    }
    let out;
    ed.dispatchEvent = (e) => (out = e.detail.config);
    ed._form.listeners["value-changed"]({ detail: { value: { type: `custom:${tag}`, device: "charger", show_scene: true, animations: true } } });
    assert.deepEqual(json(out), { type: `custom:${tag}`, device: "charger" });
  }
});

test("translations: every language has every key of English, with the same placeholders", () => {
  const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];
  const vars = (s) => s.match(/\{\w+\}/g)?.sort() ?? [];
  for (const [name, table] of [["shared", ev.RC_I18N], ["ev", ev.EV_I18N]]) {
    assert.deepEqual(json(Object.keys(table)), LANGS, name);
    const ref = json(Object.keys(table.en)).sort();
    for (const lang of LANGS) {
      const keys = json(Object.keys(table[lang])).filter((k) => !["open_f", "closed_f"].includes(k) && !k.endsWith("_few"));
      assert.deepEqual(keys.sort(), ref, `${name}.${lang}`);
      for (const k of ref) assert.deepEqual(json(vars(table[lang][k])), json(vars(table.en[k])), `${name}.${lang}.${k}`);
    }
  }
  const fr = make("ev-charger-card", { device: "charger", language: "fr" });
  assert.equal(fr._status(fr._items), "En charge · 7,2 kW");
});

// A V2C Trydan as each integration names it: [entity_id, translation_key, state, attributes].
const v2cHass = (platform, rows) => {
  const h = makeHass();
  h.devices = { trydan: { name: "Trydan", model: "Trydan" } };
  h.entities = Object.fromEntries(rows.map(([id, key]) => [id, { device_id: "trydan", platform, translation_key: key }]));
  h.states = Object.fromEntries(rows.map(([id, , state, attrs = {}]) => [id, st(id, state, attrs)]));
  return h;
};
const W = { device_class: "power", unit_of_measurement: "W" };
const A = { unit_of_measurement: "A", min: 6, max: 32, step: 1 };

test("V2C Trydan, built-in integration: charge power and session, the intensity, the pause switch, no meter error", () => {
  const rows = (charging) => [
    ["binary_sensor.trydan_connected", "connected", "on", { device_class: "plug" }],
    ["binary_sensor.trydan_charging", null, charging ? "on" : "off", { device_class: "battery_charging" }],
    ["sensor.trydan_house_power", "house_power", "2300", W],
    ["sensor.trydan_photovoltaic_power", "fv_power", "3100", W],
    ["sensor.trydan_charge_power", "charge_power", charging ? "7200" : "0", W],
    ["sensor.trydan_charge_energy", "charge_energy", "8.4", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing" }],
    ["sensor.trydan_charge_time", "charge_time", "5400", { device_class: "duration", unit_of_measurement: "s" }],
    ["sensor.trydan_meter_error", "meter_error", "clamp_not_connected", { device_class: "enum", friendly_name: "Trydan Meter error" }],
    ["number.trydan_max_intensity", "max_intensity", "32", { ...A, friendly_name: "Trydan Max intensity" }],
    ["number.trydan_intensity", "intensity", "16", { ...A, friendly_name: "Trydan Intensity" }],
    ["switch.trydan_pause_dynamic_control_modulation", "pause_dynamic", "off", { friendly_name: "Trydan Pause dynamic control modulation" }],
    ["switch.trydan_pause_session", "paused", "off", { friendly_name: "Trydan Pause session" }],
    ["switch.trydan_lock_evse", "locked", "off", { friendly_name: "Trydan Lock EVSE" }],
  ];
  const h = v2cHass("v2c", rows(true));
  assert.deepEqual(json(ev.evChargers(h)), ["trydan"]);
  const r = ev.evFind(h, "trydan");
  assert.equal(r.power, "sensor.trydan_charge_power");
  assert.equal(r.energy, "sensor.trydan_charge_energy");
  assert.equal(r.total, undefined, "the session energy is no lifetime total");
  assert.equal(r.limit, "number.trydan_intensity");
  assert.equal(r.switch, "switch.trydan_pause_session");
  assert.equal(r.lock, "switch.trydan_lock_evse");
  assert.equal(r.error, undefined, "the meter's link is no charger fault");
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.equal(card._items.state, "charging");
  assert.equal(card._items.duration, "1 h 30");
  assert.equal(card._items.switchPause, true);
  assert.equal(card._items.lock.cable, false);
  // Plugged in, paused: waiting, even with a little standby power.
  const paused = v2cHass("v2c", rows(false));
  assert.equal(make("ev-charger-card", { device: "trydan" }, paused)._items.state, "waiting");
});

test("V2C Trydan, Rain1971's integration: its Spanish charge state and its HH:MM:SS charge time", () => {
  const h = v2cHass("v2c_trydan", [
    ["sensor.v2c_trydan_charge_state", "chargestate", "Manguera conectada (CARGANDO)", { device_class: "enum", friendly_name: "V2C Trydan Charge State" }],
    ["sensor.v2c_trydan_numerical_status", null, "2", { friendly_name: "V2C trydan NumericalStatus" }],
    ["sensor.v2c_trydan_charge_power", "chargepower", "7360", W],
    ["sensor.v2c_trydan_house_power", "housepower", "900", W],
    ["sensor.v2c_trydan_charge_energy", "chargeenergy", "3.2", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing" }],
    ["sensor.v2c_trydan_charge_time", "chargetime", "01:42:10", { friendly_name: "V2C Trydan Charge Time" }],
    ["sensor.v2c_trydan_charge_intensity", "intensity", "16", { device_class: "current", unit_of_measurement: "A" }],
    ["sensor.v2c_trydan_slave_error", "slaveerror", "4", { friendly_name: "V2C Trydan Slave Error" }],
    ["number.v2c_trydan_maximum_intensity", "max_intensity", "32", A],
    ["number.v2c_trydan_charge_intensity", "intensity", "16", A],
    ["switch.v2c_trydan_dynamic_charge", "dynamic", "off", { friendly_name: "V2C Trydan Dynamic Charge" }],
    ["switch.v2c_trydan_pause_charge", "paused", "off", { friendly_name: "V2C Trydan Pause Charge" }],
    ["switch.v2c_trydan_lock_charger", "locked", "off", { friendly_name: "V2C Trydan Lock Charger" }],
  ]);
  assert.deepEqual(json(ev.evChargers(h)), ["trydan"]);
  const r = ev.evFind(h, "trydan");
  assert.equal(r.status, "sensor.v2c_trydan_charge_state");
  assert.equal(r.limit, "number.v2c_trydan_charge_intensity");
  assert.equal(r.switch, "switch.v2c_trydan_pause_charge");
  assert.equal(r.error, undefined);
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.equal(card._items.state, "charging");
  assert.equal(card._items.watts, 7360);
  assert.equal(card._items.duration, "1 h 42");
});

test("V2C Trydan, V2C Cloud integration: its charge state, the current intensity and the charging pause", () => {
  const h = v2cHass("v2c_cloud", [
    ["binary_sensor.trydan_v2c_cloud_connection_status", "connected", "on", { device_class: "connectivity" }],
    ["sensor.trydan_charging_state", "charge_state", "Vehicle connected (idle)", { friendly_name: "Trydan Charging state" }],
    ["sensor.trydan_ready_state", "ready_state", "Ready", { friendly_name: "Trydan Ready state" }],
    ["sensor.trydan_battery_power", "battery_power", "-1200", W],
    ["sensor.trydan_charging_power", "charge_power", "0", W],
    ["sensor.trydan_charging_energy", "charge_energy", "11.0", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing" }],
    ["sensor.trydan_device_error_code", "slave_error", "Waiting Wi-Fi", { friendly_name: "Trydan Device error code" }],
    ["sensor.trydan_phase_1_current", "intensity_l1", "0", { device_class: "current", unit_of_measurement: "A" }],
    ["number.trydan_maximum_intensity", "max_intensity", "32", A],
    ["number.trydan_current_intensity", "current_intensity", "10", A],
    ["switch.trydan_pause_dynamic_control", "pause_dynamic", "off", { friendly_name: "Trydan Pause dynamic control" }],
    ["switch.trydan_charging_pause", "charging_pause", "on", { friendly_name: "Trydan Charging pause" }],
    ["switch.trydan_charger_lock", "locked", "off", { friendly_name: "Trydan Charger lock" }],
  ]);
  const r = ev.evFind(h, "trydan");
  assert.equal(r.status, "sensor.trydan_charging_state");
  assert.equal(r.power, "sensor.trydan_charging_power");
  assert.equal(r.limit, "number.trydan_current_intensity");
  assert.equal(r.switch, "switch.trydan_charging_pause");
  assert.equal(r.error, undefined);
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.equal(card._items.state, "waiting");
  // Paused with a car waiting: start turns the pause switch off.
  click(card, ".act-start");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_off", { entity_id: "switch.trydan_charging_pause" }]);
});

test("discovery: a charger named after the house keeps the max power out of the charging power", () => {
  const h = makeHass();
  delete h.states["sensor.garage_power"];
  const add = (id, name, v) => {
    h.entities[id] = { device_id: "charger", platform: "zha" };
    h.states[id] = st(id, v, { device_class: "power", unit_of_measurement: "W", friendly_name: name });
  };
  add("sensor.borne_maison_max_power", "Borne maison Max power", "22000");
  add("sensor.borne_maison_house_power", "Borne maison House power", "2300");
  add("sensor.borne_maison_power", "Borne maison Power", "7200");
  assert.equal(ev.evFind(h, "charger").power, "sensor.borne_maison_power");
});

// A click delegated to a container: the button found by `closest`.
const tap = (card, sel, button, type = "click") => {
  const target = { localName: button.localName || "button", value: button.value, dataset: button.dataset || {}, matches: (s) => s === button.cls };
  target.closest = () => target;
  card._nodes[sel].listeners[type]({ stopPropagation() {}, target });
};

const trydan = (paused, energy = "8.4") => [
  ["binary_sensor.trydan_connected", "connected", "on", { device_class: "plug" }],
  ["sensor.trydan_charge_power", "charge_power", paused ? "0" : "7200", W],
  ["sensor.trydan_charge_energy", "charge_energy", energy, { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing" }],
  ["sensor.trydan_charge_time", "charge_time", "5400", { device_class: "duration", unit_of_measurement: "s" }],
  ["number.trydan_intensity", "intensity", "16", { ...A, friendly_name: "Trydan Intensity" }],
  ["number.trydan_max_intensity", "max_intensity", "32", { ...A, friendly_name: "Trydan Max intensity" }],
  ["switch.trydan_pause_dynamic_control_modulation", "pause_dynamic", "off", { friendly_name: "Trydan Pause dynamic control modulation" }],
  ["switch.trydan_pause_session", "paused", paused ? "on" : "off", { friendly_name: "Trydan Pause session" }],
  ["switch.trydan_lock_evse", "locked", "off", { friendly_name: "Trydan Lock EVSE" }],
  ["select.trydan_charge_mode", "mode", "solar", { options: ["grid", "solar"], friendly_name: "Trydan Charge mode" }],
  ["sensor.trydan_ip", "ip", "10.0.0.9", { friendly_name: "Trydan IP" }],
];

test("V2C paused: the state says Paused, the start button resumes by turning the pause switch off", () => {
  const h = v2cHass("v2c", trydan(true));
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.equal(card._items.state, "waiting");
  assert.equal(card._items.paused, true);
  assert.equal(card._status(card._items), "Paused");
  assert.match(card.shadowRoot.innerHTML, /act-start" data-k="primary">[\s\S]*?<span>Resume<\/span>/);
  click(card, ".act-start");
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_off", { entity_id: "switch.trydan_pause_session" }]);
  const fr = make("ev-charger-card", { device: "trydan", language: "fr" }, h);
  assert.equal(fr._status(fr._items), "En pause");
  // Not paused, plugged in: Plugged in, Start.
  const waiting = make("ev-charger-card", { device: "trydan" }, makeHass({ status: "awaiting_start", power: "0" }));
  assert.equal(waiting._items.paused, false);
});

test("charging with no cost: session, time and power in the tiles", () => {
  const card = make("ev-charger-card", { device: "trydan" }, v2cHass("v2c", trydan(false)));
  assert.deepEqual(json(card._tileList(card._items).map((t) => [t[1], t[2].join(" ")])), [["t_session", "8.4 kWh"], ["t_time", "1 h 30 "], ["t_power", "7.2 kW"]]);
  // A cost keeps its place before the power.
  assert.deepEqual(json(make("ev-charger-card", { device: "charger" })._tileList(make("ev-charger-card", { device: "charger" })._items).map((t) => t[1])), ["t_session", "t_time", "t_cost"]);
});

test("last session: a session energy back to 0 out of a charge reads its last value above 0 from the history", async () => {
  const rows = trydan(false, "0").map((r) => (r[0] === "sensor.trydan_charge_power" ? [r[0], r[1], "0", r[3]] : r));
  rows[0] = ["binary_sensor.trydan_connected", "connected", "off", { device_class: "plug" }];
  const h = v2cHass("v2c", rows);
  const asked = [];
  h.callWS = (msg) => {
    asked.push(msg);
    return Promise.resolve({ [msg.entity_ids[0]]: [{ s: "0" }, { s: "5.2" }, { s: "9.7" }, { s: "0" }] });
  };
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.equal(card._items.state, "idle");
  assert.equal(card._items.last, null, "nothing shown while looking it up, no 0.0 kWh");
  assert.ok(!card._tileList(card._items).some((t) => t[1] === "t_last"));
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(card._items.last, 9.7);
  assert.deepEqual(json(card._tileList(card._items)[0]), ["energy", "t_last", ["9.7", "kWh"]]);
  card.hass = { ...h };
  assert.equal(asked.length, 1, "looked up once per reset");
  assert.equal(asked[0].type, "history/history_during_period");
  // A session still held by the sensor is the last one.
  const held = make("ev-charger-card", { device: "charger" }, makeHass({ status: "disconnected", power: "0" }));
  assert.equal(held._items.last, 12.4);
});

test("current presets: the value opens them, a preset sets the limit, within the range; current_presets: false removes them", () => {
  const h = v2cHass("v2c", trydan(true));
  h.states["number.trydan_intensity"].attributes.max = 16;
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.match(card.shadowRoot.innerHTML, /class="val sv" data-k="presets" aria-expanded="false"/);
  click(card, ".sv");
  const html = card.shadowRoot.innerHTML;
  assert.deepEqual([...html.matchAll(/data-v="(\d+)"/g)].map((x) => x[1]), ["6", "10", "13", "16"]);
  assert.match(html, /class="ps on" data-k="ps-16"/);
  tap(card, ".presets", { dataset: { v: "10" } });
  assert.deepEqual(json(h.calls.at(-1)), ["number", "set_value", { entity_id: "number.trydan_intensity", value: 10 }]);
  assert.equal(card._presetsOpen, false);
  // A click elsewhere folds them back.
  click(card, ".sv");
  card._foldWatch.tap({ composedPath: () => [] });
  assert.equal(card._presetsOpen, false);
  const none = make("ev-charger-card", { device: "trydan", current_presets: false }, h);
  assert.doesNotMatch(none.shadowRoot.innerHTML, /data-k="presets"/);
  assert.match(none.shadowRoot.innerHTML, /<b class="val"/);
});

test("settings: the charger's switches, selects and numbers no role uses, folded; each control calls its service", () => {
  const h = v2cHass("v2c", trydan(false));
  const card = make("ev-charger-card", { device: "trydan" }, h);
  assert.deepEqual(json(card._items.settings.map((s) => [s.id, s.name])), [
    ["number.trydan_max_intensity", "Max intensity"],
    ["switch.trydan_pause_dynamic_control_modulation", "Pause dynamic control modulation"],
    ["select.trydan_charge_mode", "Charge mode"],
  ]);
  assert.match(card.shadowRoot.innerHTML, /<div class="set"><button class="sh" data-k="settings" aria-expanded="false">/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="sr"/, "folded");
  tap(card, ".set", { cls: ".sh" });
  assert.equal(card._settingsOpen, true);
  assert.match(card.shadowRoot.innerHTML, /<div class="set open">[\s\S]*class="tg" role="switch" aria-checked="false"/);
  tap(card, ".set", { dataset: { id: "switch.trydan_pause_dynamic_control_modulation" } });
  assert.deepEqual(json(h.calls.at(-1)), ["switch", "turn_on", { entity_id: "switch.trydan_pause_dynamic_control_modulation" }]);
  tap(card, ".set", { dataset: { id: "number.trydan_max_intensity", d: "-1" } });
  assert.deepEqual(json(h.calls.at(-1)), ["number", "set_value", { entity_id: "number.trydan_max_intensity", value: 31 }]);
  tap(card, ".set", { localName: "select", value: "grid", dataset: { id: "select.trydan_charge_mode" } }, "change");
  assert.deepEqual(json(h.calls.at(-1)), ["select", "select_option", { entity_id: "select.trydan_charge_mode", option: "grid" }]);
  card._foldWatch.tap({ composedPath: () => [] });
  assert.equal(card._settingsOpen, false);
  assert.deepEqual(json(make("ev-charger-card", { device: "trydan", show_settings: false }, h)._items.settings), []);
  assert.deepEqual(json(make("ev-charger-card", { device: "trydan", settings: ["switch.trydan_pause_dynamic_control_modulation"] }, h)._items.settings.map((s) => s.id)), ["switch.trydan_pause_dynamic_control_modulation"]);
  // The mock Easee charger has nothing more: no settings section.
  assert.doesNotMatch(make("ev-charger-card", { device: "charger" }).shadowRoot.innerHTML, /class="set/);
});
