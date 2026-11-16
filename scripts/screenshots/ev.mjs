// Renders the EV charger cards with a mock charger and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/ev.mjs
import { pair, shoot } from "./harness.mjs";
import { setup } from "./mock.mjs";

// Stills with animations: false. The LED ring is a CSS animation the screenshot stops, but the particles along the cable
// are SVG animations it does not: they would land elsewhere at each run, and every capture would count as changed.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const scenes = ["charging", "waiting", "done", "idle", "error"].flatMap((scene) => still(scene, { scene }));
// The other cars of the illustration (`vehicle`), the saloon being the default, and a few paints (`color`).
const vehicles = ["hatch", "estate", "crossover", "coupe_suv", "small_suv", "suv", "city", "van"].flatMap((vehicle) =>
  still(`vehicle-${vehicle.replace("_", "-")}`, { scene: "charging", config: { vehicle } }),
);
const colors = ["blue", "red", "black"].flatMap((color) => still(`color-${color}`, { scene: "charging", config: { color } }));
await shoot({ prefix: "ev", tag: "ev-charger-card", shots: [...scenes, ...vehicles, ...colors, ...still("compact", { scene: "charging", config: { show_scene: false } })], setup });
await shoot({
  prefix: "ev-mini",
  tag: "ev-charger-mini-card",
  shots: [...still("charging", { scene: "charging" }), ...still("waiting", { scene: "waiting" }), ...still("zoom", { scene: "charging", open: ".zoom" })],
  setup,
});
