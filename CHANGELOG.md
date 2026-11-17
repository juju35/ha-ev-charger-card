# Changelog

## 1.2.0 - 2026-11-17

### Features
- **Illustrated header, harmonised with the other cards**: 90 px high on the full card and the mini card, title and readings on the sky at the left, the scene at the right and a **concrete strip** edge to edge at the bottom (day and night variants).
- **House wall instead of the garage**: the wallbox (bigger, as the car) is mounted against a rendered façade with its plinth and wall lamp (lit at night), its left edge fading softly into the sky; the sun, or the moon and stars, over a low hill.
- **The header's icon is a car in the state's colour**: blue charging, amber plugged in, green charged, grey no car or offline, red error — by day and by night.
- **Status pill after the title on every card**: a dot and the state in the icon's colour, right after the title (the mini card's level in large, or the charger's name), the charging power moved to the subtitle; it stays beside the title only when the whole title and its whole label fit there (measured, in every language), else it takes the level's line under the subtitle (the subtitle then on one line); only its dot stays when its label does not fit there or above the drive, and on cards of 200 px or less. The classic header (`show_scene: false`) of both cards follows the same rule.
- **Detail button in the corner**: the mini card's expand / collapse button is the 24 px round glass button at the top right of the header (it was 28 px), and in the top right corner without the illustration.
- Night picture with the dark theme even while the sun is up

## 1.1.0 - 2026-11-16

### Features
- **Nine cars for the illustration** (`vehicle`): a saloon (`sedan`, default), a five-door hatchback (`hatch`), an estate (`estate`), a fastback crossover with a black glass roof and aero wheel covers (`crossover`), a coupé SUV (`coupe_suv`), a small urban SUV (`small_suv`), an SUV with roof rails and black wheel-arch cladding (`suv`), a city car (`city`) and an MPV / van (`van`). In the visual editor.
- **Paint** (`color`): white, silver, grey, black, blue, red or green; none keeps white in a light theme and graphite in a dark one. In the visual editor.
- **Day and night backdrop**, in the colours of the flight and train boards: the sky (sun and clouds, or stars and the moon), hills, the garage the wallbox hangs on (its window lit at night) and a paved drive. `illustration_theme`: `auto` (follows `sun.sun`, else the dark theme), `day` or `night`. In the visual editor.
- **Illustrated header**, as on the flight and train boards: the scene sits at the right of the card's top and fades into the sky, with the icon, name, state chip and battery bar on the sky at its left (the glass pill is gone). The **mini card** becomes the same banner, lower: battery ring, level in large, state chip and key readings. `show_scene: false` keeps a classic header and the two-line mini card.
- **`show_background: false`**: hides the backdrop (sky, hills, garage, drive) and keeps the wallbox, the cable and the car on the card itself, the header in the theme's colours. In the visual editor.
- **A finer car**: real proportions, larger wheels in tight arches (five twin-spoke alloys with the brake disc behind, or flat aero covers), paint with curvature, a shoulder highlight and lit arch lips, tinted glass with a satin trim and sky reflections, lamps in dark housings, flush handles, wheel wells, contact shadows and a faint reflection on the floor. The charging port moves to the rear wing, off the wheel arch.

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
