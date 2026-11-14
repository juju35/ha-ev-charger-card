// A mock Home Assistant with one charger (Easee-like: status, power in kW, session and lifetime energy, a current limit,
// a charging switch, a cable lock, an error sensor, a charging time, a session cost) in the garage, and a car battery.
export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });

export const makeHass = ({ status = "charging", power = "7.2", error = "no_error", ...overrides } = {}) => {
  const ids = [
    "sensor.garage_status",
    "sensor.garage_power",
    "sensor.garage_session_energy",
    "sensor.garage_lifetime_energy",
    "number.garage_dynamic_charger_limit",
    "switch.garage_charger_enabled",
    "lock.garage_cable_locked",
    "sensor.garage_error",
    "sensor.garage_charging_time",
    "sensor.garage_session_cost",
    "sensor.garage_temperature",
  ];
  return {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    areas: { garage: { area_id: "garage", name: "Garage" } },
    devices: { charger: { area_id: "garage", name: "Wallbox", model: "Pulsar Plus" }, car: { name: "Car" } },
    entities: {
      ...Object.fromEntries(ids.map((id) => [id, { device_id: "charger", platform: "easee" }])),
      "sensor.car_battery": { device_id: "car", platform: "renault" },
      "sensor.car_power": { device_id: "car", platform: "renault" },
    },
    states: {
      "sensor.garage_status": st("sensor.garage_status", status, { friendly_name: "Garage Status" }),
      "sensor.garage_power": st("sensor.garage_power", power, { device_class: "power", unit_of_measurement: "kW" }),
      "sensor.garage_session_energy": st("sensor.garage_session_energy", "12.4", { device_class: "energy", unit_of_measurement: "kWh", friendly_name: "Garage Session energy" }),
      "sensor.garage_lifetime_energy": st("sensor.garage_lifetime_energy", "2840", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing", friendly_name: "Garage Lifetime energy" }),
      "number.garage_dynamic_charger_limit": st("number.garage_dynamic_charger_limit", "32", { unit_of_measurement: "A", min: 6, max: 32, step: 1, friendly_name: "Garage Dynamic charger limit" }),
      "switch.garage_charger_enabled": st("switch.garage_charger_enabled", "on", { friendly_name: "Garage Charger enabled" }),
      "lock.garage_cable_locked": st("lock.garage_cable_locked", "locked", { friendly_name: "Garage Cable locked" }),
      "sensor.garage_error": st("sensor.garage_error", error, { friendly_name: "Garage Error" }),
      "sensor.garage_charging_time": st("sensor.garage_charging_time", "1.7", { device_class: "duration", unit_of_measurement: "h", friendly_name: "Garage Charging time" }),
      "sensor.garage_session_cost": st("sensor.garage_session_cost", "2.30", { device_class: "monetary", unit_of_measurement: "€", friendly_name: "Garage Session cost" }),
      "sensor.garage_temperature": st("sensor.garage_temperature", "21", { device_class: "temperature", unit_of_measurement: "°C" }),
      "sensor.car_battery": st("sensor.car_battery", "68", { device_class: "battery", unit_of_measurement: "%" }),
      "sensor.car_power": st("sensor.car_power", "0", { device_class: "power", unit_of_measurement: "W" }),
    },
    calls: [],
    callService(domain, service, data) {
      this.calls.push([domain, service, data]);
    },
    ...overrides,
  };
};
