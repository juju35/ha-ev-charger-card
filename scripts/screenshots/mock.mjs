// The mock home of the screenshots and animations: one charger in the garage and the car's battery.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: new Date().toISOString() });

// `scene`: charging, waiting (plugged in, off-peak), done, idle (no car), error.
const SCENES = {
  charging: { status: "charging", power: "7.2", soc: "68", time: "1.7", energy: "12.4", cost: "2.30", error: "no_error" },
  waiting: { status: "awaiting_start", power: "0", soc: "31", time: "0", energy: "38.6", cost: "7.10", error: "no_error", limit: "16" },
  done: { status: "completed", power: "0", soc: "100", time: "5.63", energy: "41.2", cost: "7.60", error: "no_error", limit: "16" },
  idle: { status: "disconnected", power: "0", soc: "100", time: "0", energy: "41.2", cost: "7.60", error: "no_error", limit: "16" },
  error: { status: "error", power: "0", soc: "54", time: "0.4", energy: "3.1", cost: "0.60", error: "Earth fault", limit: "16" },
};

export const setup = (s) => {
  const v = SCENES[s.scene];
  const states = {
    "sensor.garage_status": st("sensor.garage_status", v.status, { friendly_name: "Wallbox Status" }),
    "sensor.garage_power": st("sensor.garage_power", v.power, { device_class: "power", unit_of_measurement: "kW" }),
    "sensor.garage_session_energy": st("sensor.garage_session_energy", v.energy, { device_class: "energy", unit_of_measurement: "kWh", friendly_name: "Wallbox Session energy" }),
    "sensor.garage_lifetime_energy": st("sensor.garage_lifetime_energy", "2840", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing", friendly_name: "Wallbox Lifetime energy" }),
    "number.garage_charger_limit": st("number.garage_charger_limit", v.limit || "32", { unit_of_measurement: "A", min: 6, max: 32, step: 1, friendly_name: "Wallbox Charger limit" }),
    "switch.garage_charger_enabled": st("switch.garage_charger_enabled", v.status === "charging" ? "on" : "off", { friendly_name: "Wallbox Charger enabled" }),
    "lock.garage_cable_locked": st("lock.garage_cable_locked", s.scene === "idle" ? "unlocked" : "locked", { friendly_name: "Wallbox Cable locked" }),
    "sensor.garage_error": st("sensor.garage_error", v.error, { friendly_name: "Wallbox Error" }),
    "sensor.garage_charging_time": st("sensor.garage_charging_time", v.time, { device_class: "duration", unit_of_measurement: "h", friendly_name: "Wallbox Charging time" }),
    "sensor.garage_session_cost": st("sensor.garage_session_cost", v.cost, { device_class: "monetary", unit_of_measurement: "€", friendly_name: "Wallbox Session cost" }),
    "sensor.car_battery": st("sensor.car_battery", v.soc, { device_class: "battery", unit_of_measurement: "%" }),
  };
  const entities = Object.fromEntries(Object.keys(states).map((id) => [id, { entity_id: id, device_id: id.startsWith("sensor.car") ? "car" : "charger", platform: "easee" }]));
  return {
    hass: {
      states,
      entities,
      devices: { charger: { area_id: "garage", name: "Wallbox", model: "Pulsar Plus" }, car: { name: "Car" } },
      areas: { garage: { area_id: "garage", name: "Garage" } },
      language: "en",
      locale: { language: "en" },
      themes: { darkMode: s.theme === "dark" },
    },
    config: { device: "charger", battery: "sensor.car_battery", ...s.config },
    open: s.open,
  };
};
