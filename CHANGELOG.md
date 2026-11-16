# Changelog

## 1.1.0 - 2026-11-16

### Features
- **Nine cars for the illustration** (`vehicle`): a saloon (`sedan`, default), a five-door hatchback (`hatch`), an estate (`estate`), a fastback crossover with a black glass roof and aero wheel covers (`crossover`), a coupé SUV (`coupe_suv`), a small urban SUV (`small_suv`), an SUV with roof rails and black wheel-arch cladding (`suv`), a city car (`city`) and an MPV / van (`van`). In the visual editor.
- **Paint** (`color`): white, silver, grey, black, blue, red or green; none keeps white in a light theme and graphite in a dark one. In the visual editor.
- **A finer car**: real proportions, shaded paint with a shoulder highlight, tinted glass with a reflection, aero wheels, flush handles, LED light strips, dark wheel wells and contact shadows. The charging port moves to the rear wing, off the wheel arch.

## 1.0.0 - 2026-11-14

### Features
- **EV charger card** (`custom:ev-charger-card`): the charger illustrated — the wallbox with its LED ring, the cable and the car, on a wall and a floor following the light or dark theme, with a glass pill for the car's battery level (`battery`) or the charging power. Energy flows along the cable while charging and the LED ring breathes (`animations`).
- **Five states** from the charger's status in the integration's own words: charging (blue), plugged in (amber), charged (green), no car (grey, no car drawn), error (red, the charger's error under the illustration); offline when it cannot report. Without a status sensor, the power and the plug sensor tell.
- **Three tiles** chosen by state among what the charger reports (session energy, time and cost; current limit, last session, lifetime total).
- **Controls**: Pause / Start (the charger's buttons or its charging switch), Unlock cable once charged, the current limit in steps within the number's range, and the cable lock (`show_controls`).
- **Discovery** of the charger (known charger integrations first) and of each entity on its device by device class, unit and domain; `entities` overrides any role.
- **EV charger mini card** (`custom:ev-charger-mini-card`): two lines, a battery ring as the badge (or the power against `max_power`), the key readings as pills, a zoom to the full card.
- Options: `device`, `entity`, `title`, `show_title`, `navigation_path`, `battery`, `show_scene`, `animations`, `show_controls`, `max_power`, `zoom`, `entities`, `language`. All in the visual editor.
- Labels in 22 languages (English in the bundle, the others loaded on demand), screenshots in light and dark, charging animations.
