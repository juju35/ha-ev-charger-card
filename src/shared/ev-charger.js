// ── EV charger ───────────────────────────────────────────────────────────────
// A charger is a device: its entities are found by what they are (device class, unit, domain) and, when that is not
// enough, by their name. `entities` in the config overrides any role.
// The state comes from the charger's status sensor, in the integration's own words, brought down to five: charging,
// waiting (a car is plugged in, not charging), done (charged), idle (no car), error; `offline` when the charger cannot report.
// V2C Trydan words its states in Spanish or Italian too (Manguera conectada (CARGANDO), Vehículo conectado (inactivo),
// In attesa del veicolo); its "Vehicle connected (idle)" is a car plugged in, waiting.
import { rcPerRegistry } from "./core.js";

export const EV_STATE_RULES = [
  ["error", /(error|fault|failure|failed|defect|fallo|guasto|ventilat|ventilac)/],
  ["done", /(complete|finish|full|charged|done|termin)/],
  // Before charging: "not_charging", "charging_stopped" are no charge.
  ["waiting", /(^|_)not_charging|charging_(stopped|paused|suspended)|vehicle_connected|vehiculo_conectado|veicolo_collegato|conectada_no_carga/],
  ["charging", /(^|_)(charging|in_progress|laden|ladend|charge_en_cours|en_charge|cargando|in_carica)($|_)/],
  ["idle", /(disconnected|not_connected|no_conectad|unplugged|no_car|no_ev|no_vehicle|awaiting_car(?!_demand)|waiting_for_(car|vehicle)(?!_demand)|esperando_vehiculo|attesa_del_veicolo|ready_for_car|^ready$|available|idle|standby|^off$)/],
  ["waiting", /(connected|plugged|ready|wait|paus|suspend|schedul|preparing|delay|eco|smart|occupied|authori|pending|requesting|reserv)/],
];
export const evNorm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
// Normalised state of a raw status, undefined when it is no charger status.
export const evStateOf = (raw) => {
  const n = evNorm(raw);
  if (!n || n === "unknown" || n === "unavailable") return undefined;
  return EV_STATE_RULES.find(([, re]) => re.test(n))?.[0];
};

// Integrations known to be EV chargers: their devices are offered first.
export const EV_PLATFORMS = [
  "easee", "wallbox", "zaptec", "ohme", "myenergi", "tesla_wall_connector", "go_echarger", "goecharger", "alfen_wallbox",
  "peblar", "ocpp", "keba", "openwb", "evcc_intg", "wallbox_pulsar", "nrgkick", "smartevse", "v2c", "v2c_trydan", "v2c_cloud", "elli", "hypervolt",
  "wattpilot",
];
export const EV_NAME = /charger|wallbox|borne|ladestation|evse|easee|zaptec|zappi|ohme|pulsar|go-?e|wall.?connector|alfen|peblar|trydan|v2c|wattpilot|fronius/i;

// Integrations whose entities are known by their translation key (`domain.key`): read before the discovery by name.
// null: the integration has no such role (V2C's "error" sensors report the house meter's link, not the charger).
export const EV_KEYS = {
  // Built in (V2C); its charging binary sensor has no key: the `charging` role finds it by device class.
  v2c: {
    plug: "binary_sensor.connected", power: "sensor.charge_power", energy: "sensor.charge_energy", total: null,
    duration: "sensor.charge_time", limit: "number.intensity", switch: "switch.paused", lock: "switch.locked", error: null,
  },
  // V2C Trydan (Rain1971).
  v2c_trydan: {
    status: "sensor.chargestate", power: "sensor.chargepower", energy: "sensor.chargeenergy", total: null,
    duration: "sensor.chargetime", limit: "number.intensity", current: null, switch: "switch.paused", lock: "switch.locked", error: null,
  },
  // V2C Cloud (samuelebistoletti).
  v2c_cloud: {
    status: "sensor.charge_state", power: "sensor.charge_power", energy: "sensor.charge_energy", total: null,
    duration: "sensor.charge_time", limit: "number.current_intensity", current: "sensor.intensity_l1",
    switch: "switch.charging_pause", lock: "switch.locked", error: null,
  },
};
// A smart plug feeding a phone, laptop or tool charger is named like a charger too: never one of ours by name alone.
export const EV_NOT_EV = /phone|t[ée]l[ée]phone|handy|usb|laptop|tablet|ipad|watch|montre|toothbrush|brosse|battery.?pack|power.?bank|drill|perceuse/i;

export const evLabel = (hass, id) => `${id} ${hass.states[id]?.attributes.friendly_name || ""}`;
export const evNum = (st) => {
  const v = Number.parseFloat(st?.state);
  return Number.isFinite(v) ? v : null;
};
// A power in W, an energy in kWh, whatever the sensor's unit.
export const evWatts = (st) => {
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  return u === "kW" ? v * 1000 : u === "MW" ? v * 1e6 : v;
};
export const evKwh = (st) => {
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  return u === "Wh" ? v / 1000 : u === "MWh" ? v * 1000 : v;
};

// The device of an entity, from the registry.
export const evDeviceOf = (hass, id) => hass.entities?.[id]?.device_id;

// Every entity of each device, in registry order.
export const evDeviceEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, r] of Object.entries(hass.entities || {})) if (r.device_id && !r.hidden) (out[r.device_id] ||= []).push(id);
  return out;
});

// The chargers of the home, most likely first: devices of a known charger integration, then devices named like a charger
// that have a power sensor or a current limit.
export const evChargers = (hass) => {
  const out = [];
  for (const [device, ids] of Object.entries(evDeviceEntities(hass))) {
    const known = ids.some((id) => EV_PLATFORMS.includes(hass.entities[id]?.platform));
    const label = `${hass.devices?.[device]?.name || ""} ${ids.join(" ")}`;
    const named = EV_NAME.test(label) && !EV_NOT_EV.test(label);
    const fits = ids.some((id) => id.startsWith("number.") && hass.states[id]?.attributes.unit_of_measurement === "A") ||
      ids.some((id) => id.startsWith("sensor.") && hass.states[id]?.attributes.device_class === "power");
    if (known || (named && fits)) out.push({ device, score: known ? 2 : 1 });
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.device);
};

// The entity of each role on the charger's device: status, plug (a car is plugged in), charging (a binary sensor), power, energy (this session), total, limit (a number in A),
// current, phases, switch (charging allowed), start, stop, lock (cable), cost, duration, error, battery (the car's level),
// mode (the charge mode select: Wattpilot's Default / Eco / Next Trip, zappi's Fast / Eco / Eco+).
export const EV_ROLES = ["status", "plug", "charging", "power", "energy", "total", "limit", "current", "phases", "switch", "start", "stop", "lock", "cost", "duration", "error", "battery", "mode"];
export const evFind = (hass, device, overrides = {}) => {
  const ids = device ? evDeviceEntities(hass)[device] || [] : [];
  const st = (id) => hass.states[id];
  const dom = (id) => id.split(".")[0];
  const dc = (id) => st(id)?.attributes.device_class;
  const unit = (id) => st(id)?.attributes.unit_of_measurement;
  const named = (id, re) => re.test(evLabel(hass, id));
  // The first entity passing the test, the first matching the earliest preference that any matches.
  const pick = (test, ...prefer) => {
    const all = ids.filter((id) => st(id) && test(id));
    for (const p of prefer) {
      const hit = all.find(p);
      if (hit) return hit;
    }
    return all[0];
  };
  const r = {};
  // A sensor first; a select only when named a status (a "Charge mode" select set to *eco* is no status).
  const STATUS = /status|state|etat|zustand/i;
  const statusLike = (id) => !dc(id) && evNum(st(id)) == null && !named(id, /error|fault|erreur|fehler/i) && !!evStateOf(st(id).state);
  r.status =
    pick((id) => dom(id) === "sensor" && statusLike(id), (id) => named(id, STATUS)) ||
    pick((id) => dom(id) === "select" && statusLike(id) && named(id, STATUS)) ||
    pick((id) => dom(id) === "sensor" && named(id, STATUS) && evNum(st(id)) == null && !named(id, /error|fault/i));
  r.plug = pick((id) => dom(id) === "binary_sensor" && dc(id) === "plug");
  r.charging = pick((id) => dom(id) === "binary_sensor" && dc(id) === "battery_charging");
  // The charging power, not the house's, the solar panels' or the home battery's that some chargers report too; that
  // second wish gives way when it rules out every sensor (a charger named "… Home" or "Borne maison"), the first never.
  const notMax = (id) => !named(id, /max|limit|offered|avail/i);
  r.power = pick(
    (id) => dom(id) === "sensor" && dc(id) === "power",
    (id) => notMax(id) && !named(id, /house|fv|photovolt|solar|grid|battery|contract/i),
    notMax,
  );
  // The session and the lifetime energy; a sensor named *total* is never the session, even named *charged* too
  // (Wattpilot's "Totally Charged" beside its session "Connection Charged", whose state class is total_increasing).
  // The energy charged per ID chip (Wattpilot, go-e) is neither.
  const energy = ids.filter((id) => dom(id) === "sensor" && dc(id) === "energy" && st(id) && !named(id, /id.?chip|rfid|badge/i));
  const TOTAL = /total|lifetime|meter|cumul|gesamt/i;
  const SESSION = /session|added|charged|last|current|connection|ladung|recharg/i;
  r.energy =
    energy.find((id) => named(id, SESSION) && !named(id, TOTAL)) ||
    energy.find((id) => st(id).attributes.state_class !== "total_increasing" && !named(id, TOTAL)) ||
    energy.find((id) => named(id, SESSION));
  r.total =
    energy.find((id) => id !== r.energy && named(id, TOTAL)) || energy.find((id) => id !== r.energy && st(id).attributes.state_class === "total_increasing");
  r.limit = pick((id) => dom(id) === "number" && (unit(id) === "A" || dc(id) === "current"), (id) => named(id, /limit|max|current|courant|strom/i));
  r.current = pick((id) => dom(id) === "sensor" && dc(id) === "current", (id) => !named(id, /max|limit/i));
  r.phases = pick((id) => dom(id) === "sensor" && named(id, /phase/i) && evNum(st(id)) != null);
  // The switch that allows charging; a "pause" switch works the other way round (see `switchPause`). A mode switch
  // (smart, eco, schedule) is not it.
  r.switch = pick(
    (id) => dom(id) === "switch" && named(id, /charg|enable|pause|start|allow|ladung|recharge/i) && !named(id, /lock|verrou|sperr|smart|eco|mode|schedul|solar|boost/i),
    (id) => named(id, /enable|allow|pause.?resume|start.?stop|activ/i),
  );
  r.start = pick((id) => dom(id) === "button" && named(id, /start|resume|reprendre|demarr/i));
  r.stop = pick((id) => dom(id) === "button" && named(id, /stop|pause/i));
  r.lock = pick((id) => dom(id) === "lock") || pick((id) => dom(id) === "switch" && named(id, /lock|verrou|sperr/i));
  r.cost = pick((id) => dom(id) === "sensor" && dc(id) === "monetary", (id) => named(id, /session|cost|cout|kosten/i));
  r.duration = pick((id) => dom(id) === "sensor" && (dc(id) === "duration" || named(id, /charging.?time|duration|duree|ladedauer/i)) && evMinutes(st(id)) != null);
  r.error = pick((id) => (dom(id) === "sensor" && named(id, /error|fault|erreur|fehler/i)) || (dom(id) === "binary_sensor" && dc(id) === "problem"));
  r.battery = pick((id) => dom(id) === "sensor" && dc(id) === "battery");
  // The charge mode: a select named a mode, not the phases', the LED's or a status.
  r.mode = pick(
    (id) => dom(id) === "select" && named(id, /mode|modus|modo|tryb/i) && !named(id, /phase|led|light|display|lumi|status|state|etat|log/i) && (st(id).attributes.options || []).length > 1,
    (id) => named(id, /charg|lade|recharg|carga|ricarica/i),
  );
  // The roles an integration is known to name.
  const keyed = ids.find((id) => EV_KEYS[hass.entities?.[id]?.platform]);
  const keys = keyed && EV_KEYS[hass.entities[keyed].platform];
  if (keys) {
    const byKey = Object.fromEntries(ids.filter((id) => st(id)).map((id) => [`${dom(id)}.${hass.entities[id]?.translation_key}`, id]));
    for (const [role, key] of Object.entries(keys)) r[role] = key === null ? undefined : byKey[key] || r[role];
  }
  for (const role of EV_ROLES) if (overrides[role]) r[role] = overrides[role];
  return r;
};

// An error sensor that says "no error".
export const EV_NO_ERROR = /^(no_?error|none|ok|0|false|off|no_?fault|aucun|normal|keine?)$/;

// A duration in minutes: a number in h / min / s / d, or a text *HH:MM:SS* (V2C Trydan).
export const evMinutes = (st) => {
  const hms = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(String(st?.state ?? "").trim());
  if (hms) return Number(hms[1]) * 60 + Number(hms[2]) + Number(hms[3] || 0) / 60;
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  return u === "h" ? v * 60 : u === "s" ? v / 60 : u === "d" ? v * 1440 : v;
};
// A duration → a compact text, *1 h 42*.
export const evDuration = (st) => {
  const m = evMinutes(st);
  if (m == null) return null;
  const min = Math.round(m);
  return min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
};
