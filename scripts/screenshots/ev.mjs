// Renders the EV charger cards with a mock charger and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/ev.mjs
import { pair, shoot } from "./harness.mjs";
import { setup } from "./mock.mjs";

// Stills: the particles and the LED ring are animated, the screenshot stops them (animations: "disabled").
const scenes = ["charging", "waiting", "done", "idle", "error"].flatMap((scene) => pair(scene, { scene }));
await shoot({ prefix: "ev", tag: "ev-charger-card", shots: [...scenes, ...pair("compact", { scene: "charging", config: { show_scene: false } })], setup });
await shoot({
  prefix: "ev-mini",
  tag: "ev-charger-mini-card",
  shots: [...pair("charging", { scene: "charging" }), ...pair("waiting", { scene: "waiting" }), ...pair("zoom", { scene: "charging", open: ".zoom" })],
  setup,
});
