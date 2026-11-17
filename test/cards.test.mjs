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
  };
  for (const [raw, want] of Object.entries(cases)) assert.equal(ev.evStateOf(raw), want, raw);
  assert.equal(ev.evStateOf("unavailable"), undefined);
  assert.equal(ev.evStateOf("42"), undefined);
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
  assert.equal(card._nodes[".seg b"].textContent, "29 A");
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

test("illustration theme: forced, else the sun, else the dark theme", () => {
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
  assert.equal(sky({}, sun("below_horizon")), "night", "the sun has set");
  assert.equal(sky({}, sun("above_horizon", true)), "day", "the sun first, the dark theme after");
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
  assert.match(html, /<b>68 %<\/b><span class="chip"[^>]*>Charging<\/span>/);
  assert.match(html, /7.2 kW · 1 h 42/);
  assert.equal(mini._config.zoom, true);
  assert.equal(mini.getCardSize(), 2);
});

test("mini card without the illustration: the readings as pills, a ring badge", () => {
  const mini = make("ev-charger-mini-card", { device: "charger", battery: "sensor.car_battery", show_scene: false });
  const html = mini.shadowRoot.innerHTML;
  assert.doesNotMatch(html, /<svg class="scene"/);
  assert.match(html, /class="r pill/);
  assert.match(html, /7.2 kW/);
  assert.match(html, /68 %/);
  assert.equal(mini.getCardSize(), 1);
});

test("full card: the illustrated header, or the classic one without the illustration", () => {
  const card = make("ev-charger-card", { device: "charger", battery: "sensor.car_battery" }).shadowRoot.innerHTML;
  assert.match(card, /class="banner/);
  assert.match(card, /class="chip"[^>]*>Charging · 7.2 kW</);
  assert.match(card, /<b>68 %<\/b>/);
  const plain = make("ev-charger-card", { device: "charger", show_scene: false }).shadowRoot.innerHTML;
  assert.doesNotMatch(plain, /class="banner/);
  assert.match(plain, /class="pill"/);
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
