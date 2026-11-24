// ── Editor ───────────────────────────────────────────────────────────────────
import { EV_COLORS, EV_VEHICLES } from "./core.js";
import { EvChargerCard } from "./card.js";

export const evSchema = (booleans) => (lang) => [
  { name: "device", selector: { device: {} } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  { name: "battery", selector: { entity: { domain: "sensor", device_class: "battery" } } },
  {
    name: "vehicle",
    selector: { select: { mode: "dropdown", options: Object.keys(EV_VEHICLES).map((value) => ({ value, label: rcT(EV_I18N, lang, `ed_vehicle_${value}`) })) } },
  },
  {
    name: "color",
    selector: {
      select: { mode: "dropdown", options: ["", ...Object.keys(EV_COLORS)].map((value) => ({ value, label: rcT(EV_I18N, lang, `ed_color_${value || "auto"}`) })) },
    },
  },
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(EV_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcBooleans(...booleans),
  ...rcAdvanced(EV_I18N, lang, "entities", "language"),
];

export const EV_HELPERS = ["title", "battery", "show_background", "zoom", "entities", "language"];

export const EvChargerCardEditor = rcEditor({
  card: EvChargerCard,
  helpers: EV_HELPERS,
  schema: evSchema(["show_title", "show_scene", "show_background", "animations", "show_controls", "show_settings"]),
});

rcRegister(
  EvChargerCard,
  EvChargerCardEditor,
  "EV Charger Card",
  "An EV charger, illustrated: wallbox, cable and car, charging power, session, pause / start, current limit and cable lock",
);
