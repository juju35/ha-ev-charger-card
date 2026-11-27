# ha-ev-charger-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-ev-charger-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-ev-charger-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-ev-charger-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-ev-charger-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-ev-charger-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-ev-charger-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-ev-charger-card)](https://github.com/juju35/ha-ev-charger-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-ev-charger-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/icon.svg" alt="EV Charger Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/wallbox.svg" alt="Wallbox" height="20">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/easee.svg" alt="Easee" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/zaptec.svg" alt="Zaptec" height="28">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/ohme.svg" alt="Ohme" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/myenergi.svg" alt="myenergi" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/tesla.svg" alt="Tesla" height="28">&nbsp;&nbsp;
  <a href="https://v2charge.com/"><img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/v2c.png" alt="V2C" height="24"></a>
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/go-e.svg" alt="go-e" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/alfen.svg" alt="Alfen" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/peblar.svg" alt="Peblar" height="24">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/abb.svg" alt="ABB" height="20">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/schneider-electric.svg" alt="Schneider Electric" height="28">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/ocpp.svg" alt="Open Charge Alliance (OCPP)" height="28">
</p>

An illustrated Lovelace card for Home Assistant's **EV chargers**: the wallbox, its cable and the car, with energy flowing along the cable while it charges; the session in three tiles; pause / start, the current limit and the cable lock. Pick the charger, the card finds its entities by itself, whatever the integration.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-ev-charger-card&category=plugin)

| Card | Type | What it shows |
|---|---|---|
| [EV charger](#ev-charger) | `custom:ev-charger-card` | The charger illustrated, its state and power, three tiles for the session, and its controls. |
| [EV charger mini](#ev-charger-mini) | `custom:ev-charger-mini-card` | The same charger as an illustrated banner: a battery ring, the level and state, the key readings, a zoom to the full card. |

| Charging | Plugged in | Charged | Mini |
|---|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging.gif" alt="Charging" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-waiting.png" alt="Plugged in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-done-dark.png" alt="Charged" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-charging.png" alt="Mini" width="400"> |

The cards share the look of the other ha-* cards (header with a status pill, tinted tiles), a visual editor covering every option (`entities` as YAML in its folded **Advanced** section), labels in 22 languages following the Home Assistant language, light and dark themes, and come in a single Marketplace install with no dependency.

## Features

### EV charger

`custom:ev-charger-card` — The charger of a `device` (the first charger of the home when none is set).

- **Illustrated header** (90 px), as on the flight and train boards: the scene at the right — the wallbox with its LED ring mounted on the house wall (rendered façade, plinth and wall lamp, its left edge fading into the sky), the cable and the car with its charging port — over a concrete strip edge to edge at the bottom; on the sky at the left a car icon in the state's colour (blue charging, amber plugged in, green charged, grey no car, red error), the charger's name, room and model, a chip with the state and the power (*Charging · 7.2 kW*), and the car's battery level (`battery`) as a bar — with several cars on one charger (`cars`), the car plugged in last with its name, its body and its paint, or each car's level when none says it is plugged in
- **Five states**, from the charger's own status in the integration's words (*charging*, *awaiting_start*, *Paused by user*, *connected_finished*, *disconnected*…): **charging** (blue, energy flowing along the cable, the LED ring breathing), **plugged in** (amber), **charged** (green), **no car** (grey, the cable hanging from the wallbox), **error** (red, the charger's error under the illustration); *offline* when the charger cannot report. Without a status sensor, the power and the plug sensor tell
- **Three tiles**, the ones that matter in each state among what the charger reports: the session's energy, time and cost while charging or charged; the current limit, the last session and the lifetime total when a car waits or none is plugged in
- **Controls**: **Pause** while charging and **Start** when a car waits (the charger's start / stop buttons, or its charging switch), **Unlock cable** once charged, the **current limit** in steps of the number entity (− 32 A +, within its range), and the **lock**: the cable's when the lock is named after the cable (Easee), else the whole charger's (Wallbox), which is never unlocked on its own once charged; the **charge mode** (Wattpilot's *Default / Eco / Next Trip*, zappi's *Fast / Eco / Eco+*…) as a row of pills
- A tap on the illustration opens the charger's status dialog
- `show_scene: false` gives a classic header (name and state pill) over the tiles and controls; `animations: false` stops the flow and the breathing (also when the system asks for reduced motion); `show_controls: false` leaves the card read-only

### EV charger mini

`custom:ev-charger-mini-card` — The same illustrated header, 90 px high too: a ring as the badge (the car's battery level, or the charging power against `max_power`), the level in large with the state as a chip, then the name and the key readings (*68 % Charging — Wallbox · 7.2 kW · 1 h 42*, *31 % Plugged in — Wallbox · 16 A*), the scene at the right. With `show_scene: false`, two lines with the readings as pills. The **zoom** button (top right) opens the full card in place, a click anywhere else folds it back (`zoom: false` removes the button).

## Supported integrations

The card reads what the charger's device exposes, by device class, unit and domain (and the entity's name when that is not enough), so most charger integrations work out of the box:

| | Integration | Chargers |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/wallbox.svg" alt="Wallbox" height="14"> | [Wallbox](https://www.home-assistant.io/integrations/wallbox/) (built in) | Wallbox Pulsar, Commander, Copper |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/tesla.svg" alt="Tesla" height="20"> | [Tesla Wall Connector](https://www.home-assistant.io/integrations/tesla_wall_connector/) (built in) | Tesla Wall Connector |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/ohme.svg" alt="Ohme" height="17"> | [Ohme](https://www.home-assistant.io/integrations/ohme/) (built in) | Ohme Home Pro, ePod |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/peblar.svg" alt="Peblar" height="17"> | [Peblar](https://www.home-assistant.io/integrations/peblar/) (built in) | Peblar Home, Business |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/v2c.png" alt="V2C" height="17"> | [V2C](https://www.home-assistant.io/integrations/v2c/) (built in), [V2C Trydan](https://github.com/Rain1971/V2C_trydant) and [V2C Cloud](https://github.com/samuelebistoletti/HomeAssistant-V2C-Cloud) (Marketplace) | V2C Trydan |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/easee.svg" alt="Easee" height="17"> | [Easee](https://github.com/nordicopen/easee_hass) (Marketplace) | Easee Home, Charge, One |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/zaptec.svg" alt="Zaptec" height="20"> | [Zaptec](https://github.com/custom-components/zaptec) (Marketplace) | Zaptec Go, Pro |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/myenergi.svg" alt="myenergi" height="17"> | [myenergi](https://github.com/CJNE/ha-myenergi) (Marketplace) | myenergi zappi |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/ocpp.svg" alt="Open Charge Alliance (OCPP)" height="20"> | [OCPP](https://github.com/lbbrhzn/ocpp) (Marketplace) | Any OCPP charger: Alfen, ABB, Schneider Electric… |
| | [Fronius Wattpilot](https://github.com/mk-maddin/wattpilot-HA) (Marketplace) | Fronius Wattpilot Home, Flex |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/go-e.svg" alt="go-e" height="17">&nbsp;<img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/images/alfen.svg" alt="Alfen" height="17"> | go-e, Alfen and other charger integrations | Their chargers |

When the card picks the wrong entity for a role, or misses one, set it in `entities` (see [Configuration](#configuration)) and open an issue with the charger's entities so that the discovery learns it.

## Prerequisites

Home Assistant 2024.8 or later, with an integration for your charger configured (see [Supported integrations](#supported-integrations)), or entities of your own giving its status and power.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-ev-charger-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-ev-charger-card` — Type: **Dashboard**
3. Open **EV Charger Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you: `/local/community/ha-ev-charger-card/ha-ev-charger-card.js`.

### Manual

1. Download `ha-ev-charger-card.js` and the `ha-ev-charger-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-ev-charger-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-ev-charger-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

Every option is in the visual editor. In YAML:

```yaml
type: custom:ev-charger-card
device: 3f2a…            # the charger's device ID (the visual editor offers a device picker)
battery: sensor.car_battery_level
vehicle: suv             # sedan (default), hatch, estate, crossover, coupe_suv, small_suv, suv, city, van
color: blue              # the paint; none: the theme's
illustration_theme: auto # auto (follows the theme), day or night
show_background: true    # false: the wallbox and the car without the backdrop

# Two lines on a phone dashboard
type: custom:ev-charger-mini-card
device: 3f2a…
max_power: 11

# The current presets and the settings section
type: custom:ev-charger-card
device: 3f2a…
current_presets: [6, 10, 16, 32]
settings:
  - switch.trydan_dynamic
  - select.trydan_dynamic_power_mode

# Two cars on one charger: the one plugged in last is shown
type: custom:ev-charger-card
device: 3f2a…
cars:
  - entity: sensor.i4_battery
    plug: binary_sensor.i4_charging_port   # optional: on while this car is plugged in
    name: i4
    vehicle: sedan
  - entity: sensor.model_y_battery
    plug: binary_sensor.model_y_charge_cable
    vehicle: crossover
    color: white

# A role the discovery missed
type: custom:ev-charger-card
device: 3f2a…
entities:
  energy: sensor.wallbox_added_energy
  lock: switch.wallbox_cable_lock
```

| Option | Card | Default | Description |
|---|---|---|---|
| `device` | both | the first charger found | The charger's device ID |
| `entity` | both | — | **YAML only.** Any entity of the charger, instead of `device` |
| `title` | both | the charger's name | Card title |
| `show_title` | both | `true` | Show the title |
| `navigation_path` | both | — | A tap on the header opens this dashboard path |
| `battery` | both | the charger's own battery sensor, if any | The car's battery level, for the illustration and the mini card's ring |
| `cars` | both | — | **YAML only.** Several cars on one charger, over `battery`: each `entity` (its battery level) with, optional, `plug` (a binary sensor on while that car is plugged in), `name` (default: its device's name), `vehicle` and `color`. The car plugged in last is shown, with its name, body and paint; when none says it is plugged in, the level of each car not known unplugged, each with its name |
| `vehicle` | both | `sedan` | The car of the illustration: `sedan` (saloon), `hatch` (five-door hatchback), `estate`, `crossover` (fastback crossover), `coupe_suv`, `small_suv`, `suv`, `city` (city car) or `van` (MPV / van) |
| `color` | both | the theme's | The car's paint: `white`, `silver`, `grey`, `black`, `blue`, `red` or `green`; none: white in a light theme, graphite in a dark one |
| `illustration_theme` | both | `auto` | The illustration's sky: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `show_scene` | both | `true` | The illustrated header (`false`: a classic header, and the mini card on two lines) |
| `show_background` | both | `true` | The illustration's backdrop (sky, house wall, concrete drive); `false` keeps the wallbox, the cable and the car on the card itself, the header in the theme's colours |
| `animations` | both | `true` | Energy flowing along the cable, the LED ring breathing |
| `show_controls` | both | `true` | Pause / start (*Resume* when paused), current limit and cable lock |
| `show_mode` | both | `true` | **YAML only.** The charge mode row under the controls (hidden with `show_controls: false` too) |
| `current_presets` | both | `[6, 10, 13, 16, 20, 25, 32]` | **YAML only.** The currents (A) offered by a tap on the limit between − and +, those within the limit's range; `false`: none |
| `show_settings` | both | `true` | The charger's own settings (dynamic control, schedule, charge mode…), folded under the controls |
| `settings` | both | the device's switches, selects and numbers no role uses | **YAML only.** The entities of the settings section, in this order |
| `max_power` | mini | `7.4` | The power (kW) of a full ring when the car's battery level is unknown |
| `zoom` | mini | `true` | The zoom button |
| `entities` | both | — | In the editor's *Advanced* section (as YAML): the entity of a role, over the discovery — `status`, `plug`, `charging`, `power`, `energy`, `total`, `limit`, `current`, `phases`, `switch`, `start`, `stop`, `lock`, `cost`, `duration`, `error`, `battery`, `mode` |
| `language` | both | Home Assistant's | In the editor's *Advanced* section. One of the [languages](#translations) |

## Screenshots

| Charging | Plugged in | Charged |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging.png" alt="Charging" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-waiting.png" alt="Plugged in" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-done.png" alt="Charged" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging-dark.png" alt="Charging, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-waiting-dark.png" alt="Plugged in, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-done-dark.png" alt="Charged, dark" width="400"> |

| No car | Error | Without the illustration (`show_scene: false`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-idle.png" alt="No car" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-error.png" alt="Error" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-compact.png" alt="Without the illustration" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-idle-dark.png" alt="No car, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-error-dark.png" alt="Error, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-compact-dark.png" alt="Without the illustration, dark" width="400"> |

**Pause and the current presets**: a charger held back (a *pause* switch on, a status saying so) reads *Paused*, and its start button *Resume*. A tap on the limit between − and + opens the current presets (`current_presets`); a preset sets the limit, a click elsewhere folds them back.

**Settings**: the charger's switches, selects and numbers that no role uses (V2C's dynamic control and its modes, a schedule, a minimum current…), diagnostic ones aside, folded under the controls; a click elsewhere folds them back. `settings` picks them, `show_settings: false` hides them.

| Paused, the presets open | Settings unfolded |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-paused-presets.png" alt="Paused, the presets open" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-settings.png" alt="Settings unfolded" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-paused-presets-dark.png" alt="Paused, the presets open, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-settings-dark.png" alt="Settings unfolded, dark" width="400"> |

**Charge mode and several cars**: the charger's charge mode select is a row of pills under the controls, the current mode lit (`show_mode: false` hides it). With `cars`, the car plugged in last is shown with its name, body and paint; when none says it is plugged in, each car's level.

| Charge mode, two cars |
|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mode-cars.png" alt="Charge mode, two cars" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mode-cars-dark.png" alt="Charge mode, two cars, dark" width="400"> |

**Day and night**: the illustration has the backdrop of the flight and train boards — a sky with the sun by day, the stars and the moon by night (the wall lamp lit), a low hill, the house wall and the concrete drive. `illustration_theme: auto` follows the Home Assistant theme (night with a dark theme, day with a light theme), or force `day` / `night`.

| Day (`illustration_theme: day`) | Night (`illustration_theme: night`) |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-day.png" alt="Day" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-night.png" alt="Night" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-day-dark.png" alt="Day, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-night-dark.png" alt="Night, dark" width="400"> |

**Without the backdrop** (`show_background: false`): the wallbox, the cable and the car stay, on the card itself; the header takes the theme's colours.

| Full card | Mini card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-no-background.png" alt="Without the backdrop" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-no-background.png" alt="Mini card without the backdrop" width="320"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-no-background-dark.png" alt="Without the backdrop, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-no-background-dark.png" alt="Mini card without the backdrop, dark" width="320"> |

| Saloon (`vehicle: sedan`, default) | Hatchback (`hatch`) | Estate (`estate`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging.png" alt="Saloon" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-hatch.png" alt="Hatchback" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-estate.png" alt="Estate" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging-dark.png" alt="Saloon, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-hatch-dark.png" alt="Hatchback, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-estate-dark.png" alt="Estate, dark" width="400"> |

| Fastback crossover (`crossover`) | Coupé SUV (`coupe_suv`) | Small SUV (`small_suv`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-crossover.png" alt="Fastback crossover" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-coupe-suv.png" alt="Coupé SUV" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-small-suv.png" alt="Small SUV" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-crossover-dark.png" alt="Fastback crossover, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-coupe-suv-dark.png" alt="Coupé SUV, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-small-suv-dark.png" alt="Small SUV, dark" width="400"> |

| SUV (`suv`) | City car (`city`) | MPV / van (`van`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-suv.png" alt="SUV" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-city.png" alt="City car" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-van.png" alt="MPV / van" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-suv-dark.png" alt="SUV, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-city-dark.png" alt="City car, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-vehicle-van-dark.png" alt="MPV / van, dark" width="400"> |

| Blue (`color: blue`) | Red (`color: red`) | Black (`color: black`) |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-blue.png" alt="Blue" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-red.png" alt="Red" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-black.png" alt="Black" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-blue-dark.png" alt="Blue, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-red-dark.png" alt="Red, dark" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-color-black-dark.png" alt="Black, dark" width="400"> |

**Charging animation**: energy flows from the wallbox to the car along the cable and the LED ring breathes (steady with `animations: false`, or when the system asks for reduced motion).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging.gif" alt="Charging animation" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-charging-dark.gif" alt="Charging animation, dark" width="400"> |

### EV charger mini

| Charging | Plugged in | Zoomed in |
|---|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-charging.png" alt="Mini, charging" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-waiting.png" alt="Mini, plugged in" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-zoom.png" alt="Mini, zoomed in" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-charging-dark.png" alt="Mini, charging, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-waiting-dark.png" alt="Mini, plugged in, dark" width="320"> | <img src="https://raw.githubusercontent.com/juju35/ha-ev-charger-card/main/screenshots/ev-mini-zoom-dark.png" alt="Mini, zoomed in, dark" width="400"> |

## How it works

- **Charger**: the `device` set in the card, or the device of `entity`; without either, the first device of a known charger integration (Easee, Wallbox, Zaptec, Ohme, myenergi, Tesla Wall Connector, go-e, Alfen, Peblar, Fronius Wattpilot, OCPP…), else the first device named like a charger that has a power sensor or a current limit
- **Roles**, on the charger's device: `status` (a sensor whose state is a charger status), `plug` (a `plug` binary sensor), `charging` (a `battery_charging` binary sensor, when there is no status), `power` (the charging `power` sensor, W or kW, not the house's or the solar panels'), `energy` (an `energy` sensor named *session*, *added*, *charged*…, never one named *total*), `total` (the lifetime `energy` sensor, named *total* first; the energies per ID chip are neither), `limit` (a `number` in A), `current`, `phases`, `switch` (a switch named *enable*, *charging*, *pause*…, not a mode switch such as *smart* or *eco*; a *pause* switch is turned on to pause), `start` / `stop` (buttons), `lock` (a `lock`, or a switch named *lock*; a cable lock when named after the cable), `cost` (`monetary` sensor), `duration` (in h / min / s, or a *HH:MM:SS* text), `error` (a sensor named *error*, or a `problem` binary sensor), `battery`, `mode` (a select named a *mode*, not the phases' or the LED's; its options are the pills); `entities` sets any of them
- **Known integrations**: for the V2C integrations (built-in V2C, V2C Trydan, V2C Cloud) the roles are read from the entities' translation keys first: the `Intensity` setpoint as the limit (not `Max intensity`), the session's charge energy (no lifetime total), the pause switch, the charger lock, and no error role (their error sensor reports the house meter's link, not the charger)
- **State**: the status in the integration's words, brought down to five states; an active error sensor wins; a car plugged in and held back (a *pause* switch on, a status saying *paused*) is shown *Paused*
- **Tiles**: while charging, the session energy, the time, then the cost or the charging power; out of a charge, the last session — once the session sensor is back to 0 (V2C resets it), its last value above 0 in the past week's history
- **Actions**: Pause / Start press the charger's buttons or turn its switch off / on, the limit goes through `number.set_value` within the entity's range and step, the lock through `lock.lock` / `lock.unlock` (or the switch), the settings through `switch.turn_on` / `turn_off`, `select.select_option` and `number.set_value`; nothing else

## Development

```bash
npm install
npm run build        # stamps the version of package.json into dist/ha-ev-charger-card.js
npm run check        # builds and checks the bundle (run in CI)
npm test             # unit tests
npm run screenshots  # renders the cards with a mock charger into screenshots/ (and the charging GIFs, needs ffmpeg)
```

The source is split into ES modules under `src/ev-charger-card/` (entry `src/ev-charger-card/index.js`), `src/shared/` (entry `src/shared/index.js`); `npm run build` assembles them (`scripts/bundle.mjs`) into the single file the Marketplace serves.

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs them from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-ev-charger-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `ha-ev-charger-card.js` and its translation files

## Translations

The card auto-detects the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (Portugal) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-ev-charger-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
