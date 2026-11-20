/**
 * Shared by the EV charger cards (its names are used by the other src/ files): the charger's entities and states, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-ev-charger-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// `fn(hass)` computed once per entity registry: HA replaces hass.entities only when the registry changes,
// whereas a new hass (and hass.states) comes with every state change of the whole instance.
const rcPerRegistry = (fn) => {
  const cache = new WeakMap();
  const none = {};
  return (hass) => {
    const reg = hass.entities || none;
    if (!cache.has(reg)) cache.set(reg, fn(hass));
    return cache.get(reg);
  };
};

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    unavailable: "Unavailable",
    on: "On",
    off: "Off",
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    unavailable: "Indisponible",
    on: "Allumée",
    off: "Éteinte",
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    unavailable: "Nicht verfügbar",
    on: "An",
    off: "Aus",
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    unavailable: "No disponible",
    on: "Encendido",
    off: "Apagado",
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    unavailable: "Недоступно",
    on: "Укључено",
    off: "Искључено",
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    unavailable: "Nedostupno",
    on: "Uključeno",
    off: "Isključeno",
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    unavailable: "Non disponibile",
    on: "Accesa",
    off: "Spenta",
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    unavailable: "Niet beschikbaar",
    on: "Aan",
    off: "Uit",
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    unavailable: "Indisponível",
    on: "Ligada",
    off: "Desligada",
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    unavailable: "Niedostępne",
    on: "Włączone",
    off: "Wyłączone",
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    unavailable: "Indisponibil",
    on: "Pornită",
    off: "Oprită",
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    unavailable: "Utilgængelig",
    on: "Tændt",
    off: "Slukket",
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    unavailable: "Ej tillgänglig",
    on: "På",
    off: "Av",
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    unavailable: "Недостъпно",
    on: "Включен",
    off: "Изключен",
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    unavailable: "Недоступно",
    on: "Включено",
    off: "Выключено",
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    unavailable: "Недоступно",
    on: "Увімкнено",
    off: "Вимкнено",
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    unavailable: "Nem elérhető",
    on: "Be",
    off: "Ki",
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    unavailable: "Nedostupné",
    on: "Zapnuté",
    off: "Vypnuté",
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    unavailable: "Nedostupné",
    on: "Zapnuto",
    off: "Vypnuto",
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    unavailable: "Ni na voljo",
    on: "Vklopljeno",
    off: "Izklopljeno",
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    unavailable: "Nav pieejams",
    on: "Ieslēgts",
    off: "Izslēgts",
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    unavailable: "Μη διαθέσιμο",
    on: "Ενεργή",
    off: "Ανενεργή",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── EV charger ───────────────────────────────────────────────────────────────
// A charger is a device: its entities are found by what they are (device class, unit, domain) and, when that is not
// enough, by their name. `entities` in the config overrides any role.
// The state comes from the charger's status sensor, in the integration's own words, brought down to five: charging,
// waiting (a car is plugged in, not charging), done (charged), idle (no car), error; `offline` when the charger cannot report.
const EV_STATE_RULES = [
  ["error", /(error|fault|failure|failed|defect)/],
  ["done", /(complete|finish|full|charged|done|termin)/],
  // Before charging: "not_charging", "charging_stopped" are no charge.
  ["waiting", /(^|_)not_charging|charging_(stopped|paused|suspended)/],
  ["charging", /(^|_)(charging|in_progress|laden|ladend|charge_en_cours|en_charge)($|_)/],
  ["idle", /(disconnected|not_connected|unplugged|no_car|no_ev|no_vehicle|awaiting_car(?!_demand)|waiting_for_car(?!_demand)|ready_for_car|^ready$|available|idle|standby|^off$)/],
  ["waiting", /(connected|plugged|ready|wait|paus|suspend|schedul|preparing|delay|eco|smart|occupied|authori|pending|requesting|reserv)/],
];
const evNorm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_");
// Normalised state of a raw status, undefined when it is no charger status.
const evStateOf = (raw) => {
  const n = evNorm(raw);
  if (!n || n === "unknown" || n === "unavailable") return undefined;
  return EV_STATE_RULES.find(([, re]) => re.test(n))?.[0];
};

// Integrations known to be EV chargers: their devices are offered first.
const EV_PLATFORMS = [
  "easee", "wallbox", "zaptec", "ohme", "myenergi", "tesla_wall_connector", "go_echarger", "goecharger", "alfen_wallbox",
  "peblar", "ocpp", "keba", "openwb", "evcc_intg", "wallbox_pulsar", "nrgkick", "smartevse", "v2c", "elli", "hypervolt",
];
const EV_NAME = /charger|wallbox|borne|ladestation|evse|easee|zaptec|zappi|ohme|pulsar|go-?e|wall.?connector|alfen|peblar/i;

const evLabel = (hass, id) => `${id} ${hass.states[id]?.attributes.friendly_name || ""}`;
const evNum = (st) => {
  const v = Number.parseFloat(st?.state);
  return Number.isFinite(v) ? v : null;
};
// A power in W, an energy in kWh, whatever the sensor's unit.
const evWatts = (st) => {
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  return u === "kW" ? v * 1000 : u === "MW" ? v * 1e6 : v;
};
const evKwh = (st) => {
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  return u === "Wh" ? v / 1000 : u === "MWh" ? v * 1000 : v;
};

// The device of an entity, from the registry.
const evDeviceOf = (hass, id) => hass.entities?.[id]?.device_id;

// Every entity of each device, in registry order.
const evDeviceEntities = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, r] of Object.entries(hass.entities || {})) if (r.device_id && !r.hidden) (out[r.device_id] ||= []).push(id);
  return out;
});

// The chargers of the home, most likely first: devices of a known charger integration, then devices named like a charger
// that have a power sensor or a current limit.
const evChargers = (hass) => {
  const out = [];
  for (const [device, ids] of Object.entries(evDeviceEntities(hass))) {
    const known = ids.some((id) => EV_PLATFORMS.includes(hass.entities[id]?.platform));
    const named = EV_NAME.test(`${hass.devices?.[device]?.name || ""} ${ids.join(" ")}`);
    const fits = ids.some((id) => id.startsWith("number.") && hass.states[id]?.attributes.unit_of_measurement === "A") ||
      ids.some((id) => id.startsWith("sensor.") && hass.states[id]?.attributes.device_class === "power");
    if (known || (named && fits)) out.push({ device, score: known ? 2 : 1 });
  }
  return out.sort((a, b) => b.score - a.score).map((x) => x.device);
};

// The entity of each role on the charger's device: status, plug (a car is plugged in), power, energy (this session), total, limit (a number in A),
// current, phases, switch (charging allowed), start, stop, lock (cable), cost, duration, error, battery (the car's level).
const EV_ROLES = ["status", "plug", "power", "energy", "total", "limit", "current", "phases", "switch", "start", "stop", "lock", "cost", "duration", "error", "battery"];
const evFind = (hass, device, overrides = {}) => {
  const ids = device ? evDeviceEntities(hass)[device] || [] : [];
  const st = (id) => hass.states[id];
  const dom = (id) => id.split(".")[0];
  const dc = (id) => st(id)?.attributes.device_class;
  const unit = (id) => st(id)?.attributes.unit_of_measurement;
  const named = (id, re) => re.test(evLabel(hass, id));
  const pick = (test, prefer) => {
    const all = ids.filter((id) => st(id) && test(id));
    return (prefer && all.find(prefer)) || all[0];
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
  r.power = pick((id) => dom(id) === "sensor" && dc(id) === "power", (id) => !named(id, /max|limit|offered|avail/i));
  const energy = ids.filter((id) => dom(id) === "sensor" && dc(id) === "energy" && st(id));
  r.energy = energy.find((id) => named(id, /session|added|charged|last|current|ladung|recharg/i)) || energy.find((id) => st(id).attributes.state_class !== "total_increasing");
  r.total = energy.find((id) => id !== r.energy && (named(id, /total|lifetime|meter|cumul|gesamt/i) || st(id).attributes.state_class === "total_increasing"));
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
  r.duration = pick((id) => dom(id) === "sensor" && (dc(id) === "duration" || named(id, /charging.?time|duration|duree|ladedauer/i)) && evNum(st(id)) != null);
  r.error = pick((id) => (dom(id) === "sensor" && named(id, /error|fault|erreur|fehler/i)) || (dom(id) === "binary_sensor" && dc(id) === "problem"));
  r.battery = pick((id) => dom(id) === "sensor" && dc(id) === "battery");
  for (const role of EV_ROLES) if (overrides[role]) r[role] = overrides[role];
  return r;
};

// An error sensor that says "no error".
const EV_NO_ERROR = /^(no_?error|none|ok|0|false|off|no_?fault|aucun|normal|keine?)$/;

// A duration in h / min / s → a compact text, *1 h 42*.
const evDuration = (st) => {
  const v = evNum(st);
  if (v == null) return null;
  const u = st.attributes.unit_of_measurement;
  const min = Math.round(u === "h" ? v * 60 : u === "s" ? v / 60 : u === "d" ? v * 1440 : v);
  return min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
};

// Strings of the EV charger cards; the shared ones above (unavailable, editor basics) complete them.
const EV_I18N = {
  en: {
    title: "EV charger",
    st_charging: "Charging",
    st_waiting: "Plugged in",
    st_done: "Charged",
    st_idle: "No car",
    st_error: "Error",
    st_offline: "Offline",
    t_session: "Session",
    t_time: "Time",
    t_cost: "Cost",
    t_current: "Current",
    t_total: "Total",
    t_limit: "Limit",
    t_last: "Last session",
    phases_one: "{n} phase",
    phases_many: "{n} phases",
    pause: "Pause",
    start: "Start",
    unlock: "Unlock cable",
    lock: "Lock cable",
    lock_box: "Lock the charger",
    unlock_box: "Unlock the charger",
    locked: "Locked",
    unlocked: "Unlocked",
    lower: "Lower the current",
    raise: "Raise the current",
    no_charger: "No charger found",
    ed_device: "Charger",
    ed_battery: "Vehicle battery",
    ed_battery_helper: "The car's battery level, shown on the illustration and in the mini card's ring",
    ed_show_scene: "Illustration",
    ed_animations: "Animations",
    ed_show_controls: "Controls",
    ed_max_power: "Maximum power (kW)",
    ed_max_power_helper: "For the mini card's ring when the car's battery level is unknown",
    ed_vehicle: "Vehicle",
    ed_vehicle_sedan: "Saloon",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Estate",
    ed_vehicle_crossover: "Fastback crossover",
    ed_vehicle_coupe_suv: "Coupé SUV",
    ed_vehicle_small_suv: "Small SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "City car",
    ed_vehicle_van: "MPV / van",
    ed_color: "Paint",
    ed_color_auto: "Automatic (theme)",
    ed_color_white: "White",
    ed_color_silver: "Silver",
    ed_color_grey: "Grey",
    ed_color_black: "Black",
    ed_color_blue: "Blue",
    ed_color_red: "Red",
    ed_color_green: "Green",
    ed_illustration_theme: "Illustration theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_show_background: "Background",
    ed_show_background_helper: "The sky, the house wall and the drive behind the wallbox and the car",
    ed_entities: "Entities (YAML)",
    ed_entities_helper: "Overrides of the found entities, by role: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Empty: the charger's name",
    confirm: "Press again to unlock",
  },
  fr: {
    title: "Borne de recharge",
    st_charging: "En charge",
    st_waiting: "Branchée",
    st_done: "Chargée",
    st_idle: "Pas de voiture",
    st_error: "Erreur",
    st_offline: "Hors ligne",
    t_session: "Session",
    t_time: "Durée",
    t_cost: "Coût",
    t_current: "Courant",
    t_total: "Total",
    t_limit: "Limite",
    t_last: "Dernière session",
    phases_one: "{n} phase",
    phases_many: "{n} phases",
    pause: "Pause",
    start: "Démarrer",
    unlock: "Déverrouiller le câble",
    lock: "Verrouiller le câble",
    lock_box: "Verrouiller la borne",
    unlock_box: "Déverrouiller la borne",
    locked: "Verrouillé",
    unlocked: "Déverrouillé",
    lower: "Baisser le courant",
    raise: "Augmenter le courant",
    no_charger: "Aucune borne trouvée",
    ed_device: "Borne",
    ed_battery: "Batterie du véhicule",
    ed_battery_helper: "Niveau de batterie de la voiture, affiché sur l'illustration et dans l'anneau de la mini-carte",
    ed_show_scene: "Illustration",
    ed_animations: "Animations",
    ed_show_controls: "Commandes",
    ed_max_power: "Puissance maximale (kW)",
    ed_max_power_helper: "Pour l'anneau de la mini-carte quand le niveau de batterie de la voiture est inconnu",
    ed_vehicle: "Véhicule",
    ed_vehicle_sedan: "Berline",
    ed_vehicle_hatch: "Compacte",
    ed_vehicle_estate: "Break",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "Petit SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Citadine",
    ed_vehicle_van: "Monospace / ludospace",
    ed_color: "Peinture",
    ed_color_auto: "Automatique (thème)",
    ed_color_white: "Blanc",
    ed_color_silver: "Argent",
    ed_color_grey: "Gris",
    ed_color_black: "Noir",
    ed_color_blue: "Bleu",
    ed_color_red: "Rouge",
    ed_color_green: "Vert",
    ed_illustration_theme: "Thème de l’illustration",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_show_background: "Décor",
    ed_show_background_helper: "Le ciel, le mur de la maison et l'allée derrière la borne et la voiture",
    ed_entities: "Entités (YAML)",
    ed_entities_helper: "Remplace les entités trouvées, par rôle : status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Vide : le nom de la borne",
    confirm: "Appuyez encore pour déverrouiller",
  },
  de: {
    title: "Wallbox",
    st_charging: "Lädt",
    st_waiting: "Angeschlossen",
    st_done: "Geladen",
    st_idle: "Kein Auto",
    st_error: "Fehler",
    st_offline: "Offline",
    t_session: "Sitzung",
    t_time: "Dauer",
    t_cost: "Kosten",
    t_current: "Strom",
    t_total: "Gesamt",
    t_limit: "Grenze",
    t_last: "Letzte Sitzung",
    phases_one: "{n} Phase",
    phases_many: "{n} Phasen",
    pause: "Pause",
    start: "Starten",
    unlock: "Kabel entriegeln",
    lock: "Kabel verriegeln",
    lock_box: "Wallbox sperren",
    unlock_box: "Wallbox entsperren",
    locked: "Verriegelt",
    unlocked: "Entriegelt",
    lower: "Strom senken",
    raise: "Strom erhöhen",
    no_charger: "Keine Wallbox gefunden",
    ed_device: "Wallbox",
    ed_battery: "Fahrzeugbatterie",
    ed_battery_helper: "Ladestand des Autos, auf der Illustration und im Ring der Mini-Karte",
    ed_show_scene: "Illustration",
    ed_animations: "Animationen",
    ed_show_controls: "Steuerung",
    ed_max_power: "Maximale Leistung (kW)",
    ed_max_power_helper: "Für den Ring der Mini-Karte, wenn der Ladestand des Autos unbekannt ist",
    ed_vehicle: "Fahrzeug",
    ed_vehicle_sedan: "Limousine",
    ed_vehicle_hatch: "Kompaktwagen",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Fastback-Crossover",
    ed_vehicle_coupe_suv: "SUV-Coupé",
    ed_vehicle_small_suv: "Kleiner SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Kleinwagen",
    ed_vehicle_van: "Van / Hochdachkombi",
    ed_color: "Lackierung",
    ed_color_auto: "Automatisch (Design)",
    ed_color_white: "Weiß",
    ed_color_silver: "Silber",
    ed_color_grey: "Grau",
    ed_color_black: "Schwarz",
    ed_color_blue: "Blau",
    ed_color_red: "Rot",
    ed_color_green: "Grün",
    ed_illustration_theme: "Thema der Illustration",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_show_background: "Hintergrund",
    ed_show_background_helper: "Himmel, Hauswand und Einfahrt hinter der Wallbox und dem Auto",
    ed_entities: "Entitäten (YAML)",
    ed_entities_helper: "Ersetzt gefundene Entitäten nach Rolle: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Leer: der Name der Wallbox",
    confirm: "Zum Entsperren erneut drücken",
  },
  es: {
    title: "Cargador",
    st_charging: "Cargando",
    st_waiting: "Conectado",
    st_done: "Cargado",
    st_idle: "Sin coche",
    st_error: "Error",
    st_offline: "Sin conexión",
    t_session: "Sesión",
    t_time: "Tiempo",
    t_cost: "Coste",
    t_current: "Corriente",
    t_total: "Total",
    t_limit: "Límite",
    t_last: "Última sesión",
    phases_one: "{n} fase",
    phases_many: "{n} fases",
    pause: "Pausa",
    start: "Iniciar",
    unlock: "Desbloquear cable",
    lock: "Bloquear cable",
    lock_box: "Bloquear el cargador",
    unlock_box: "Desbloquear el cargador",
    locked: "Bloqueado",
    unlocked: "Desbloqueado",
    lower: "Bajar la corriente",
    raise: "Subir la corriente",
    no_charger: "No se encontró ningún cargador",
    ed_device: "Cargador",
    ed_battery: "Batería del vehículo",
    ed_battery_helper: "Nivel de batería del coche, en la ilustración y en el anillo de la mini tarjeta",
    ed_show_scene: "Ilustración",
    ed_animations: "Animaciones",
    ed_show_controls: "Controles",
    ed_max_power: "Potencia máxima (kW)",
    ed_max_power_helper: "Para el anillo de la mini tarjeta si se desconoce el nivel de batería del coche",
    ed_vehicle: "Vehículo",
    ed_vehicle_sedan: "Berlina",
    ed_vehicle_hatch: "Compacto",
    ed_vehicle_estate: "Familiar",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "SUV pequeño",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Urbano",
    ed_vehicle_van: "Monovolumen / furgoneta",
    ed_color: "Pintura",
    ed_color_auto: "Automático (tema)",
    ed_color_white: "Blanco",
    ed_color_silver: "Plata",
    ed_color_grey: "Gris",
    ed_color_black: "Negro",
    ed_color_blue: "Azul",
    ed_color_red: "Rojo",
    ed_color_green: "Verde",
    ed_illustration_theme: "Tema de la ilustración",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_show_background: "Fondo",
    ed_show_background_helper: "El cielo, la pared de la casa y la entrada detrás del cargador y el coche",
    ed_entities: "Entidades (YAML)",
    ed_entities_helper: "Sustituye las entidades encontradas, por rol: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Vacío: el nombre del cargador",
    confirm: "Pulse de nuevo para desbloquear",
  },
  sr: {
    title: "Пуњач",
    st_charging: "Пуни се",
    st_waiting: "Прикључен",
    st_done: "Напуњен",
    st_idle: "Нема аутомобила",
    st_error: "Грешка",
    st_offline: "Ван мреже",
    t_session: "Сесија",
    t_time: "Трајање",
    t_cost: "Цена",
    t_current: "Струја",
    t_total: "Укупно",
    t_limit: "Ограничење",
    t_last: "Последња сесија",
    phases_one: "{n} фаза",
    phases_many: "{n} фаза",
    pause: "Пауза",
    start: "Покрени",
    unlock: "Откључај кабл",
    lock: "Закључај кабл",
    lock_box: "Закључај пуњач",
    unlock_box: "Откључај пуњач",
    locked: "Закључано",
    unlocked: "Откључано",
    lower: "Смањи струју",
    raise: "Повећај струју",
    no_charger: "Није пронађен пуњач",
    ed_device: "Пуњач",
    ed_battery: "Батерија возила",
    ed_battery_helper: "Ниво батерије аутомобила, на илустрацији и у прстену мини картице",
    ed_show_scene: "Илустрација",
    ed_animations: "Анимације",
    ed_show_controls: "Команде",
    ed_max_power: "Максимална снага (kW)",
    ed_max_power_helper: "За прстен мини картице када ниво батерије није познат",
    ed_vehicle: "Возило",
    ed_vehicle_sedan: "Лимузина",
    ed_vehicle_hatch: "Хечбек",
    ed_vehicle_estate: "Караван",
    ed_vehicle_crossover: "Фастбек кросовер",
    ed_vehicle_coupe_suv: "SUV купе",
    ed_vehicle_small_suv: "Мали SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Градски аутомобил",
    ed_vehicle_van: "Моноволумен / комби",
    ed_color: "Боја",
    ed_color_auto: "Аутоматски (тема)",
    ed_color_white: "Бела",
    ed_color_silver: "Сребрна",
    ed_color_grey: "Сива",
    ed_color_black: "Црна",
    ed_color_blue: "Плава",
    ed_color_red: "Црвена",
    ed_color_green: "Зелена",
    ed_illustration_theme: "Тема илустрације",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_show_background: "Позадина",
    ed_show_background_helper: "Небо, зид куће и прилаз иза пуњача и аутомобила",
    ed_entities: "Ентитети (YAML)",
    ed_entities_helper: "Замењује пронађене ентитете по улози: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Празно: назив пуњача",
    confirm: "Притисните поново за откључавање",
  },
  "sr-Latn": {
    title: "Punjač",
    st_charging: "Puni se",
    st_waiting: "Priključen",
    st_done: "Napunjen",
    st_idle: "Nema automobila",
    st_error: "Greška",
    st_offline: "Van mreže",
    t_session: "Sesija",
    t_time: "Trajanje",
    t_cost: "Cena",
    t_current: "Struja",
    t_total: "Ukupno",
    t_limit: "Ograničenje",
    t_last: "Poslednja sesija",
    phases_one: "{n} faza",
    phases_many: "{n} faza",
    pause: "Pauza",
    start: "Pokreni",
    unlock: "Otključaj kabl",
    lock: "Zaključaj kabl",
    lock_box: "Zaključaj punjač",
    unlock_box: "Otključaj punjač",
    locked: "Zaključano",
    unlocked: "Otključano",
    lower: "Smanji struju",
    raise: "Povećaj struju",
    no_charger: "Nije pronađen punjač",
    ed_device: "Punjač",
    ed_battery: "Baterija vozila",
    ed_battery_helper: "Nivo baterije automobila, na ilustraciji i u prstenu mini kartice",
    ed_show_scene: "Ilustracija",
    ed_animations: "Animacije",
    ed_show_controls: "Komande",
    ed_max_power: "Maksimalna snaga (kW)",
    ed_max_power_helper: "Za prsten mini kartice kada nivo baterije nije poznat",
    ed_vehicle: "Vozilo",
    ed_vehicle_sedan: "Limuzina",
    ed_vehicle_hatch: "Hečbek",
    ed_vehicle_estate: "Karavan",
    ed_vehicle_crossover: "Fastbek krosover",
    ed_vehicle_coupe_suv: "SUV kupe",
    ed_vehicle_small_suv: "Mali SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Gradski automobil",
    ed_vehicle_van: "Monovolumen / kombi",
    ed_color: "Boja",
    ed_color_auto: "Automatski (tema)",
    ed_color_white: "Bela",
    ed_color_silver: "Srebrna",
    ed_color_grey: "Siva",
    ed_color_black: "Crna",
    ed_color_blue: "Plava",
    ed_color_red: "Crvena",
    ed_color_green: "Zelena",
    ed_illustration_theme: "Tema ilustracije",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_show_background: "Pozadina",
    ed_show_background_helper: "Nebo, zid kuće i prilaz iza punjača i automobila",
    ed_entities: "Entiteti (YAML)",
    ed_entities_helper: "Zamenjuje pronađene entitete po ulozi: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Prazno: naziv punjača",
    confirm: "Pritisnite ponovo za otključavanje",
  },
  it: {
    title: "Wallbox",
    st_charging: "In carica",
    st_waiting: "Collegata",
    st_done: "Carica",
    st_idle: "Nessuna auto",
    st_error: "Errore",
    st_offline: "Offline",
    t_session: "Sessione",
    t_time: "Durata",
    t_cost: "Costo",
    t_current: "Corrente",
    t_total: "Totale",
    t_limit: "Limite",
    t_last: "Ultima sessione",
    phases_one: "{n} fase",
    phases_many: "{n} fasi",
    pause: "Pausa",
    start: "Avvia",
    unlock: "Sblocca il cavo",
    lock: "Blocca il cavo",
    lock_box: "Blocca la wallbox",
    unlock_box: "Sblocca la wallbox",
    locked: "Bloccato",
    unlocked: "Sbloccato",
    lower: "Riduci la corrente",
    raise: "Aumenta la corrente",
    no_charger: "Nessuna wallbox trovata",
    ed_device: "Wallbox",
    ed_battery: "Batteria del veicolo",
    ed_battery_helper: "Livello della batteria dell'auto, nell'illustrazione e nell'anello della mini scheda",
    ed_show_scene: "Illustrazione",
    ed_animations: "Animazioni",
    ed_show_controls: "Comandi",
    ed_max_power: "Potenza massima (kW)",
    ed_max_power_helper: "Per l'anello della mini scheda quando il livello della batteria è sconosciuto",
    ed_vehicle: "Veicolo",
    ed_vehicle_sedan: "Berlina",
    ed_vehicle_hatch: "Compatta",
    ed_vehicle_estate: "Station wagon",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "SUV compatto",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Citycar",
    ed_vehicle_van: "Monovolume / furgone",
    ed_color: "Vernice",
    ed_color_auto: "Automatico (tema)",
    ed_color_white: "Bianco",
    ed_color_silver: "Argento",
    ed_color_grey: "Grigio",
    ed_color_black: "Nero",
    ed_color_blue: "Blu",
    ed_color_red: "Rosso",
    ed_color_green: "Verde",
    ed_illustration_theme: "Tema dell’illustrazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_show_background: "Sfondo",
    ed_show_background_helper: "Il cielo, il muro di casa e il vialetto dietro la wallbox e l'auto",
    ed_entities: "Entità (YAML)",
    ed_entities_helper: "Sostituisce le entità trovate, per ruolo: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Vuoto: il nome della wallbox",
    confirm: "Premi di nuovo per sbloccare",
  },
  nl: {
    title: "Laadpaal",
    st_charging: "Laden",
    st_waiting: "Aangesloten",
    st_done: "Opgeladen",
    st_idle: "Geen auto",
    st_error: "Fout",
    st_offline: "Offline",
    t_session: "Sessie",
    t_time: "Duur",
    t_cost: "Kosten",
    t_current: "Stroom",
    t_total: "Totaal",
    t_limit: "Limiet",
    t_last: "Laatste sessie",
    phases_one: "{n} fase",
    phases_many: "{n} fasen",
    pause: "Pauze",
    start: "Starten",
    unlock: "Kabel ontgrendelen",
    lock: "Kabel vergrendelen",
    lock_box: "Laadpaal vergrendelen",
    unlock_box: "Laadpaal ontgrendelen",
    locked: "Vergrendeld",
    unlocked: "Ontgrendeld",
    lower: "Stroom verlagen",
    raise: "Stroom verhogen",
    no_charger: "Geen laadpaal gevonden",
    ed_device: "Laadpaal",
    ed_battery: "Accu van het voertuig",
    ed_battery_helper: "Accuniveau van de auto, op de illustratie en in de ring van de minikaart",
    ed_show_scene: "Illustratie",
    ed_animations: "Animaties",
    ed_show_controls: "Bediening",
    ed_max_power: "Maximaal vermogen (kW)",
    ed_max_power_helper: "Voor de ring van de minikaart als het accuniveau onbekend is",
    ed_vehicle: "Voertuig",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Stationwagen",
    ed_vehicle_crossover: "Fastback-crossover",
    ed_vehicle_coupe_suv: "SUV-coupé",
    ed_vehicle_small_suv: "Kleine SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Stadsauto",
    ed_vehicle_van: "MPV / bestelwagen",
    ed_color: "Lak",
    ed_color_auto: "Automatisch (thema)",
    ed_color_white: "Wit",
    ed_color_silver: "Zilver",
    ed_color_grey: "Grijs",
    ed_color_black: "Zwart",
    ed_color_blue: "Blauw",
    ed_color_red: "Rood",
    ed_color_green: "Groen",
    ed_illustration_theme: "Thema van de illustratie",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_show_background: "Achtergrond",
    ed_show_background_helper: "De lucht, de huismuur en de oprit achter de laadpaal en de auto",
    ed_entities: "Entiteiten (YAML)",
    ed_entities_helper: "Vervangt gevonden entiteiten per rol: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Leeg: de naam van de laadpaal",
    confirm: "Druk nogmaals om te ontgrendelen",
  },
  pt: {
    title: "Carregador",
    st_charging: "A carregar",
    st_waiting: "Ligado",
    st_done: "Carregado",
    st_idle: "Sem carro",
    st_error: "Erro",
    st_offline: "Offline",
    t_session: "Sessão",
    t_time: "Duração",
    t_cost: "Custo",
    t_current: "Corrente",
    t_total: "Total",
    t_limit: "Limite",
    t_last: "Última sessão",
    phases_one: "{n} fase",
    phases_many: "{n} fases",
    pause: "Pausa",
    start: "Iniciar",
    unlock: "Desbloquear cabo",
    lock: "Bloquear cabo",
    lock_box: "Bloquear o carregador",
    unlock_box: "Desbloquear o carregador",
    locked: "Bloqueado",
    unlocked: "Desbloqueado",
    lower: "Baixar a corrente",
    raise: "Subir a corrente",
    no_charger: "Nenhum carregador encontrado",
    ed_device: "Carregador",
    ed_battery: "Bateria do veículo",
    ed_battery_helper: "Nível de bateria do carro, na ilustração e no anel do mini cartão",
    ed_show_scene: "Ilustração",
    ed_animations: "Animações",
    ed_show_controls: "Controlos",
    ed_max_power: "Potência máxima (kW)",
    ed_max_power_helper: "Para o anel do mini cartão quando o nível de bateria é desconhecido",
    ed_vehicle: "Veículo",
    ed_vehicle_sedan: "Berlina",
    ed_vehicle_hatch: "Compacto",
    ed_vehicle_estate: "Carrinha",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "SUV pequeno",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Citadino",
    ed_vehicle_van: "Monovolume / furgão",
    ed_color: "Pintura",
    ed_color_auto: "Automático (tema)",
    ed_color_white: "Branco",
    ed_color_silver: "Prata",
    ed_color_grey: "Cinzento",
    ed_color_black: "Preto",
    ed_color_blue: "Azul",
    ed_color_red: "Vermelho",
    ed_color_green: "Verde",
    ed_illustration_theme: "Tema da ilustração",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_show_background: "Fundo",
    ed_show_background_helper: "O céu, a parede da casa e a entrada atrás do carregador e do carro",
    ed_entities: "Entidades (YAML)",
    ed_entities_helper: "Substitui as entidades encontradas, por função: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Vazio: o nome do carregador",
    confirm: "Prima de novo para desbloquear",
  },
  pl: {
    title: "Ładowarka",
    st_charging: "Ładowanie",
    st_waiting: "Podłączony",
    st_done: "Naładowany",
    st_idle: "Brak auta",
    st_error: "Błąd",
    st_offline: "Offline",
    t_session: "Sesja",
    t_time: "Czas",
    t_cost: "Koszt",
    t_current: "Prąd",
    t_total: "Łącznie",
    t_limit: "Limit",
    t_last: "Ostatnia sesja",
    phases_one: "{n} faza",
    phases_many: "{n} faz",
    pause: "Pauza",
    start: "Start",
    unlock: "Odblokuj kabel",
    lock: "Zablokuj kabel",
    lock_box: "Zablokuj ładowarkę",
    unlock_box: "Odblokuj ładowarkę",
    locked: "Zablokowany",
    unlocked: "Odblokowany",
    lower: "Zmniejsz prąd",
    raise: "Zwiększ prąd",
    no_charger: "Nie znaleziono ładowarki",
    ed_device: "Ładowarka",
    ed_battery: "Bateria pojazdu",
    ed_battery_helper: "Poziom baterii auta, na ilustracji i w pierścieniu mini karty",
    ed_show_scene: "Ilustracja",
    ed_animations: "Animacje",
    ed_show_controls: "Sterowanie",
    ed_max_power: "Moc maksymalna (kW)",
    ed_max_power_helper: "Dla pierścienia mini karty, gdy poziom baterii jest nieznany",
    ed_vehicle: "Pojazd",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "Mały SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Samochód miejski",
    ed_vehicle_van: "Minivan / van",
    ed_color: "Lakier",
    ed_color_auto: "Automatycznie (motyw)",
    ed_color_white: "Biały",
    ed_color_silver: "Srebrny",
    ed_color_grey: "Szary",
    ed_color_black: "Czarny",
    ed_color_blue: "Niebieski",
    ed_color_red: "Czerwony",
    ed_color_green: "Zielony",
    ed_illustration_theme: "Motyw ilustracji",
    ed_theme_auto: "Automatycznie (według motywu)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_show_background: "Tło",
    ed_show_background_helper: "Niebo, ściana domu i podjazd za ładowarką i samochodem",
    ed_entities: "Encje (YAML)",
    ed_entities_helper: "Zastępuje znalezione encje według roli: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Puste: nazwa ładowarki",
    confirm: "Naciśnij ponownie, aby odblokować",
  },
  ro: {
    title: "Stație de încărcare",
    st_charging: "Se încarcă",
    st_waiting: "Conectată",
    st_done: "Încărcată",
    st_idle: "Nicio mașină",
    st_error: "Eroare",
    st_offline: "Offline",
    t_session: "Sesiune",
    t_time: "Durată",
    t_cost: "Cost",
    t_current: "Curent",
    t_total: "Total",
    t_limit: "Limită",
    t_last: "Ultima sesiune",
    phases_one: "{n} fază",
    phases_many: "{n} faze",
    pause: "Pauză",
    start: "Pornește",
    unlock: "Deblochează cablul",
    lock: "Blochează cablul",
    lock_box: "Blochează stația",
    unlock_box: "Deblochează stația",
    locked: "Blocat",
    unlocked: "Deblocat",
    lower: "Scade curentul",
    raise: "Crește curentul",
    no_charger: "Nicio stație găsită",
    ed_device: "Stație",
    ed_battery: "Bateria vehiculului",
    ed_battery_helper: "Nivelul bateriei mașinii, pe ilustrație și în inelul mini cardului",
    ed_show_scene: "Ilustrație",
    ed_animations: "Animații",
    ed_show_controls: "Comenzi",
    ed_max_power: "Putere maximă (kW)",
    ed_max_power_helper: "Pentru inelul mini cardului când nivelul bateriei e necunoscut",
    ed_vehicle: "Vehicul",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Break",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "SUV mic",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Mașină de oraș",
    ed_vehicle_van: "Monovolum / dubiță",
    ed_color: "Vopsea",
    ed_color_auto: "Automat (temă)",
    ed_color_white: "Alb",
    ed_color_silver: "Argintiu",
    ed_color_grey: "Gri",
    ed_color_black: "Negru",
    ed_color_blue: "Albastru",
    ed_color_red: "Roșu",
    ed_color_green: "Verde",
    ed_illustration_theme: "Tema ilustrației",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_show_background: "Fundal",
    ed_show_background_helper: "Cerul, peretele casei și aleea din spatele stației și al mașinii",
    ed_entities: "Entități (YAML)",
    ed_entities_helper: "Înlocuiește entitățile găsite, pe rol: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Gol: numele stației",
    confirm: "Apăsați din nou pentru deblocare",
  },
  da: {
    title: "Ladeboks",
    st_charging: "Lader",
    st_waiting: "Tilsluttet",
    st_done: "Opladet",
    st_idle: "Ingen bil",
    st_error: "Fejl",
    st_offline: "Offline",
    t_session: "Session",
    t_time: "Tid",
    t_cost: "Pris",
    t_current: "Strøm",
    t_total: "I alt",
    t_limit: "Grænse",
    t_last: "Seneste session",
    phases_one: "{n} fase",
    phases_many: "{n} faser",
    pause: "Pause",
    start: "Start",
    unlock: "Lås kabel op",
    lock: "Lås kabel",
    lock_box: "Lås laderen",
    unlock_box: "Lås laderen op",
    locked: "Låst",
    unlocked: "Ulåst",
    lower: "Sænk strømmen",
    raise: "Hæv strømmen",
    no_charger: "Ingen ladeboks fundet",
    ed_device: "Ladeboks",
    ed_battery: "Bilens batteri",
    ed_battery_helper: "Bilens batteriniveau, på illustrationen og i minikortets ring",
    ed_show_scene: "Illustration",
    ed_animations: "Animationer",
    ed_show_controls: "Betjening",
    ed_max_power: "Maksimal effekt (kW)",
    ed_max_power_helper: "Til minikortets ring, når bilens batteriniveau er ukendt",
    ed_vehicle: "Køretøj",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Stationcar",
    ed_vehicle_crossover: "Fastback-crossover",
    ed_vehicle_coupe_suv: "SUV-coupé",
    ed_vehicle_small_suv: "Lille SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Bybil",
    ed_vehicle_van: "MPV / varevogn",
    ed_color: "Lak",
    ed_color_auto: "Automatisk (tema)",
    ed_color_white: "Hvid",
    ed_color_silver: "Sølv",
    ed_color_grey: "Grå",
    ed_color_black: "Sort",
    ed_color_blue: "Blå",
    ed_color_red: "Rød",
    ed_color_green: "Grøn",
    ed_illustration_theme: "Illustrationens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_show_background: "Baggrund",
    ed_show_background_helper: "Himlen, husmuren og indkørslen bag laderen og bilen",
    ed_entities: "Enheder (YAML)",
    ed_entities_helper: "Erstatter fundne enheder efter rolle: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Tom: ladeboksens navn",
    confirm: "Tryk igen for at låse op",
  },
  sv: {
    title: "Laddbox",
    st_charging: "Laddar",
    st_waiting: "Ansluten",
    st_done: "Laddad",
    st_idle: "Ingen bil",
    st_error: "Fel",
    st_offline: "Offline",
    t_session: "Session",
    t_time: "Tid",
    t_cost: "Kostnad",
    t_current: "Ström",
    t_total: "Totalt",
    t_limit: "Gräns",
    t_last: "Senaste session",
    phases_one: "{n} fas",
    phases_many: "{n} faser",
    pause: "Paus",
    start: "Starta",
    unlock: "Lås upp kabeln",
    lock: "Lås kabeln",
    lock_box: "Lås laddboxen",
    unlock_box: "Lås upp laddboxen",
    locked: "Låst",
    unlocked: "Olåst",
    lower: "Sänk strömmen",
    raise: "Höj strömmen",
    no_charger: "Ingen laddbox hittades",
    ed_device: "Laddbox",
    ed_battery: "Fordonets batteri",
    ed_battery_helper: "Bilens batterinivå, på illustrationen och i minikortets ring",
    ed_show_scene: "Illustration",
    ed_animations: "Animationer",
    ed_show_controls: "Reglage",
    ed_max_power: "Maximal effekt (kW)",
    ed_max_power_helper: "För minikortets ring när bilens batterinivå är okänd",
    ed_vehicle: "Fordon",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Halvkombi",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Fastback-crossover",
    ed_vehicle_coupe_suv: "SUV-coupé",
    ed_vehicle_small_suv: "Liten SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Stadsbil",
    ed_vehicle_van: "MPV / skåpbil",
    ed_color: "Lack",
    ed_color_auto: "Automatisk (tema)",
    ed_color_white: "Vit",
    ed_color_silver: "Silver",
    ed_color_grey: "Grå",
    ed_color_black: "Svart",
    ed_color_blue: "Blå",
    ed_color_red: "Röd",
    ed_color_green: "Grön",
    ed_illustration_theme: "Illustrationens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_show_background: "Bakgrund",
    ed_show_background_helper: "Himlen, husväggen och uppfarten bakom laddboxen och bilen",
    ed_entities: "Entiteter (YAML)",
    ed_entities_helper: "Ersätter hittade entiteter per roll: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Tomt: laddboxens namn",
    confirm: "Tryck igen för att låsa upp",
  },
  bg: {
    title: "Зарядна станция",
    st_charging: "Зарежда",
    st_waiting: "Свързан",
    st_done: "Зареден",
    st_idle: "Няма кола",
    st_error: "Грешка",
    st_offline: "Офлайн",
    t_session: "Сесия",
    t_time: "Време",
    t_cost: "Цена",
    t_current: "Ток",
    t_total: "Общо",
    t_limit: "Лимит",
    t_last: "Последна сесия",
    phases_one: "{n} фаза",
    phases_many: "{n} фази",
    pause: "Пауза",
    start: "Старт",
    unlock: "Отключи кабела",
    lock: "Заключи кабела",
    lock_box: "Заключи зарядната станция",
    unlock_box: "Отключи зарядната станция",
    locked: "Заключен",
    unlocked: "Отключен",
    lower: "Намали тока",
    raise: "Увеличи тока",
    no_charger: "Няма намерена станция",
    ed_device: "Станция",
    ed_battery: "Батерия на колата",
    ed_battery_helper: "Нивото на батерията на колата, на илюстрацията и в пръстена на мини картата",
    ed_show_scene: "Илюстрация",
    ed_animations: "Анимации",
    ed_show_controls: "Управление",
    ed_max_power: "Максимална мощност (kW)",
    ed_max_power_helper: "За пръстена на мини картата, когато нивото на батерията е неизвестно",
    ed_vehicle: "Превозно средство",
    ed_vehicle_sedan: "Седан",
    ed_vehicle_hatch: "Хечбек",
    ed_vehicle_estate: "Комби",
    ed_vehicle_crossover: "Фастбек кросоувър",
    ed_vehicle_coupe_suv: "SUV купе",
    ed_vehicle_small_suv: "Малък SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Градски автомобил",
    ed_vehicle_van: "Миниван / ван",
    ed_color: "Боя",
    ed_color_auto: "Автоматично (тема)",
    ed_color_white: "Бял",
    ed_color_silver: "Сребрист",
    ed_color_grey: "Сив",
    ed_color_black: "Черен",
    ed_color_blue: "Син",
    ed_color_red: "Червен",
    ed_color_green: "Зелен",
    ed_illustration_theme: "Тема на илюстрацията",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_show_background: "Фон",
    ed_show_background_helper: "Небето, стената на къщата и алеята зад зарядното и автомобила",
    ed_entities: "Обекти (YAML)",
    ed_entities_helper: "Заменя намерените обекти по роля: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Празно: името на станцията",
    confirm: "Натиснете отново за отключване",
  },
  ru: {
    title: "Зарядная станция",
    st_charging: "Заряжается",
    st_waiting: "Подключено",
    st_done: "Заряжено",
    st_idle: "Нет авто",
    st_error: "Ошибка",
    st_offline: "Не в сети",
    t_session: "Сессия",
    t_time: "Время",
    t_cost: "Стоимость",
    t_current: "Ток",
    t_total: "Всего",
    t_limit: "Лимит",
    t_last: "Последняя сессия",
    phases_one: "{n} фаза",
    phases_many: "{n} фазы",
    pause: "Пауза",
    start: "Старт",
    unlock: "Разблокировать кабель",
    lock: "Заблокировать кабель",
    lock_box: "Заблокировать зарядную станцию",
    unlock_box: "Разблокировать зарядную станцию",
    locked: "Заблокирован",
    unlocked: "Разблокирован",
    lower: "Уменьшить ток",
    raise: "Увеличить ток",
    no_charger: "Зарядная станция не найдена",
    ed_device: "Станция",
    ed_battery: "Батарея автомобиля",
    ed_battery_helper: "Уровень заряда автомобиля, на иллюстрации и в кольце мини-карточки",
    ed_show_scene: "Иллюстрация",
    ed_animations: "Анимации",
    ed_show_controls: "Управление",
    ed_max_power: "Максимальная мощность (kW)",
    ed_max_power_helper: "Для кольца мини-карточки, если уровень заряда неизвестен",
    ed_vehicle: "Автомобиль",
    ed_vehicle_sedan: "Седан",
    ed_vehicle_hatch: "Хэтчбек",
    ed_vehicle_estate: "Универсал",
    ed_vehicle_crossover: "Фастбек-кроссовер",
    ed_vehicle_coupe_suv: "SUV-купе",
    ed_vehicle_small_suv: "Компактный SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Городской автомобиль",
    ed_vehicle_van: "Минивэн / фургон",
    ed_color: "Цвет кузова",
    ed_color_auto: "Автоматически (тема)",
    ed_color_white: "Белый",
    ed_color_silver: "Серебристый",
    ed_color_grey: "Серый",
    ed_color_black: "Чёрный",
    ed_color_blue: "Синий",
    ed_color_red: "Красный",
    ed_color_green: "Зелёный",
    ed_illustration_theme: "Тема иллюстрации",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_show_background: "Фон",
    ed_show_background_helper: "Небо, стена дома и подъезд за зарядной станцией и автомобилем",
    ed_entities: "Объекты (YAML)",
    ed_entities_helper: "Заменяет найденные объекты по ролям: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Пусто: название станции",
    confirm: "Нажмите ещё раз для разблокировки",
  },
  uk: {
    title: "Зарядна станція",
    st_charging: "Заряджається",
    st_waiting: "Підключено",
    st_done: "Заряджено",
    st_idle: "Немає авто",
    st_error: "Помилка",
    st_offline: "Не в мережі",
    t_session: "Сесія",
    t_time: "Час",
    t_cost: "Вартість",
    t_current: "Струм",
    t_total: "Усього",
    t_limit: "Ліміт",
    t_last: "Остання сесія",
    phases_one: "{n} фаза",
    phases_many: "{n} фази",
    pause: "Пауза",
    start: "Старт",
    unlock: "Розблокувати кабель",
    lock: "Заблокувати кабель",
    lock_box: "Заблокувати зарядну станцію",
    unlock_box: "Розблокувати зарядну станцію",
    locked: "Заблоковано",
    unlocked: "Розблоковано",
    lower: "Зменшити струм",
    raise: "Збільшити струм",
    no_charger: "Зарядну станцію не знайдено",
    ed_device: "Станція",
    ed_battery: "Батарея авто",
    ed_battery_helper: "Рівень заряду авто, на ілюстрації та в кільці міні-картки",
    ed_show_scene: "Ілюстрація",
    ed_animations: "Анімації",
    ed_show_controls: "Керування",
    ed_max_power: "Максимальна потужність (kW)",
    ed_max_power_helper: "Для кільця міні-картки, якщо рівень заряду невідомий",
    ed_vehicle: "Автомобіль",
    ed_vehicle_sedan: "Седан",
    ed_vehicle_hatch: "Хетчбек",
    ed_vehicle_estate: "Універсал",
    ed_vehicle_crossover: "Фастбек-кросовер",
    ed_vehicle_coupe_suv: "SUV-купе",
    ed_vehicle_small_suv: "Компактний SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Міський автомобіль",
    ed_vehicle_van: "Мінівен / фургон",
    ed_color: "Колір кузова",
    ed_color_auto: "Автоматично (тема)",
    ed_color_white: "Білий",
    ed_color_silver: "Сріблястий",
    ed_color_grey: "Сірий",
    ed_color_black: "Чорний",
    ed_color_blue: "Синій",
    ed_color_red: "Червоний",
    ed_color_green: "Зелений",
    ed_illustration_theme: "Тема ілюстрації",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_show_background: "Тло",
    ed_show_background_helper: "Небо, стіна будинку і під'їзд за зарядною станцією та автомобілем",
    ed_entities: "Об'єкти (YAML)",
    ed_entities_helper: "Замінює знайдені об'єкти за ролями: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Порожньо: назва станції",
    confirm: "Натисніть ще раз для розблокування",
  },
  hu: {
    title: "Töltő",
    st_charging: "Töltés",
    st_waiting: "Csatlakoztatva",
    st_done: "Feltöltve",
    st_idle: "Nincs autó",
    st_error: "Hiba",
    st_offline: "Offline",
    t_session: "Munkamenet",
    t_time: "Idő",
    t_cost: "Költség",
    t_current: "Áram",
    t_total: "Összesen",
    t_limit: "Korlát",
    t_last: "Utolsó munkamenet",
    phases_one: "{n} fázis",
    phases_many: "{n} fázis",
    pause: "Szünet",
    start: "Indítás",
    unlock: "Kábel feloldása",
    lock: "Kábel zárolása",
    lock_box: "Töltő zárolása",
    unlock_box: "Töltő feloldása",
    locked: "Zárolva",
    unlocked: "Feloldva",
    lower: "Áram csökkentése",
    raise: "Áram növelése",
    no_charger: "Nem található töltő",
    ed_device: "Töltő",
    ed_battery: "Jármű akkumulátora",
    ed_battery_helper: "Az autó töltöttségi szintje, az illusztráción és a mini kártya gyűrűjében",
    ed_show_scene: "Illusztráció",
    ed_animations: "Animációk",
    ed_show_controls: "Vezérlők",
    ed_max_power: "Maximális teljesítmény (kW)",
    ed_max_power_helper: "A mini kártya gyűrűjéhez, ha az autó töltöttsége ismeretlen",
    ed_vehicle: "Jármű",
    ed_vehicle_sedan: "Szedán",
    ed_vehicle_hatch: "Ferdehátú",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Fastback crossover",
    ed_vehicle_coupe_suv: "Kupé SUV",
    ed_vehicle_small_suv: "Kis SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Városi autó",
    ed_vehicle_van: "Egyterű / furgon",
    ed_color: "Fényezés",
    ed_color_auto: "Automatikus (téma)",
    ed_color_white: "Fehér",
    ed_color_silver: "Ezüst",
    ed_color_grey: "Szürke",
    ed_color_black: "Fekete",
    ed_color_blue: "Kék",
    ed_color_red: "Piros",
    ed_color_green: "Zöld",
    ed_illustration_theme: "Az illusztráció témája",
    ed_theme_auto: "Automatikus (a témát követi)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_show_background: "Háttér",
    ed_show_background_helper: "Az ég, a ház fala és a felhajtó a töltő és az autó mögött",
    ed_entities: "Entitások (YAML)",
    ed_entities_helper: "Szerepkör szerint felülírja a talált entitásokat: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Üres: a töltő neve",
    confirm: "Nyomja meg újra a feloldáshoz",
  },
  sk: {
    title: "Nabíjačka",
    st_charging: "Nabíja sa",
    st_waiting: "Pripojené",
    st_done: "Nabité",
    st_idle: "Žiadne auto",
    st_error: "Chyba",
    st_offline: "Offline",
    t_session: "Relácia",
    t_time: "Čas",
    t_cost: "Cena",
    t_current: "Prúd",
    t_total: "Celkom",
    t_limit: "Limit",
    t_last: "Posledná relácia",
    phases_one: "{n} fáza",
    phases_many: "{n} fáz",
    pause: "Pauza",
    start: "Spustiť",
    unlock: "Odomknúť kábel",
    lock: "Zamknúť kábel",
    lock_box: "Zamknúť nabíjačku",
    unlock_box: "Odomknúť nabíjačku",
    locked: "Zamknuté",
    unlocked: "Odomknuté",
    lower: "Znížiť prúd",
    raise: "Zvýšiť prúd",
    no_charger: "Nenašla sa žiadna nabíjačka",
    ed_device: "Nabíjačka",
    ed_battery: "Batéria vozidla",
    ed_battery_helper: "Úroveň batérie auta, na ilustrácii a v krúžku mini karty",
    ed_show_scene: "Ilustrácia",
    ed_animations: "Animácie",
    ed_show_controls: "Ovládanie",
    ed_max_power: "Maximálny výkon (kW)",
    ed_max_power_helper: "Pre krúžok mini karty, keď úroveň batérie nie je známa",
    ed_vehicle: "Vozidlo",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Fastback crossover",
    ed_vehicle_coupe_suv: "SUV kupé",
    ed_vehicle_small_suv: "Malé SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Mestské auto",
    ed_vehicle_van: "MPV / dodávka",
    ed_color: "Lak",
    ed_color_auto: "Automaticky (motív)",
    ed_color_white: "Biela",
    ed_color_silver: "Strieborná",
    ed_color_grey: "Sivá",
    ed_color_black: "Čierna",
    ed_color_blue: "Modrá",
    ed_color_red: "Červená",
    ed_color_green: "Zelená",
    ed_illustration_theme: "Téma ilustrácie",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_show_background: "Pozadie",
    ed_show_background_helper: "Obloha, stena domu a príjazdová cesta za nabíjačkou a autom",
    ed_entities: "Entity (YAML)",
    ed_entities_helper: "Nahrádza nájdené entity podľa úlohy: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Prázdne: názov nabíjačky",
    confirm: "Stlačte znova na odomknutie",
  },
  cs: {
    title: "Nabíječka",
    st_charging: "Nabíjí se",
    st_waiting: "Připojeno",
    st_done: "Nabito",
    st_idle: "Žádné auto",
    st_error: "Chyba",
    st_offline: "Offline",
    t_session: "Relace",
    t_time: "Čas",
    t_cost: "Cena",
    t_current: "Proud",
    t_total: "Celkem",
    t_limit: "Limit",
    t_last: "Poslední relace",
    phases_one: "{n} fáze",
    phases_many: "{n} fází",
    pause: "Pauza",
    start: "Spustit",
    unlock: "Odemknout kabel",
    lock: "Zamknout kabel",
    lock_box: "Zamknout nabíječku",
    unlock_box: "Odemknout nabíječku",
    locked: "Zamčeno",
    unlocked: "Odemčeno",
    lower: "Snížit proud",
    raise: "Zvýšit proud",
    no_charger: "Nebyla nalezena žádná nabíječka",
    ed_device: "Nabíječka",
    ed_battery: "Baterie vozidla",
    ed_battery_helper: "Úroveň baterie auta, na ilustraci a v kroužku mini karty",
    ed_show_scene: "Ilustrace",
    ed_animations: "Animace",
    ed_show_controls: "Ovládání",
    ed_max_power: "Maximální výkon (kW)",
    ed_max_power_helper: "Pro kroužek mini karty, když úroveň baterie není známa",
    ed_vehicle: "Vozidlo",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Kombi",
    ed_vehicle_crossover: "Fastback crossover",
    ed_vehicle_coupe_suv: "SUV kupé",
    ed_vehicle_small_suv: "Malé SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Městské auto",
    ed_vehicle_van: "MPV / dodávka",
    ed_color: "Lak",
    ed_color_auto: "Automaticky (motiv)",
    ed_color_white: "Bílá",
    ed_color_silver: "Stříbrná",
    ed_color_grey: "Šedá",
    ed_color_black: "Černá",
    ed_color_blue: "Modrá",
    ed_color_red: "Červená",
    ed_color_green: "Zelená",
    ed_illustration_theme: "Motiv ilustrace",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_show_background: "Pozadí",
    ed_show_background_helper: "Obloha, zeď domu a příjezdová cesta za nabíječkou a autem",
    ed_entities: "Entity (YAML)",
    ed_entities_helper: "Nahrazuje nalezené entity podle role: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Prázdné: název nabíječky",
    confirm: "Stiskněte znovu pro odemknutí",
  },
  sl: {
    title: "Polnilnica",
    st_charging: "Polni se",
    st_waiting: "Priključeno",
    st_done: "Napolnjeno",
    st_idle: "Ni avtomobila",
    st_error: "Napaka",
    st_offline: "Brez povezave",
    t_session: "Seja",
    t_time: "Čas",
    t_cost: "Cena",
    t_current: "Tok",
    t_total: "Skupaj",
    t_limit: "Omejitev",
    t_last: "Zadnja seja",
    phases_one: "{n} faza",
    phases_many: "{n} faz",
    pause: "Premor",
    start: "Zaženi",
    unlock: "Odkleni kabel",
    lock: "Zakleni kabel",
    lock_box: "Zakleni polnilnico",
    unlock_box: "Odkleni polnilnico",
    locked: "Zaklenjeno",
    unlocked: "Odklenjeno",
    lower: "Zmanjšaj tok",
    raise: "Povečaj tok",
    no_charger: "Ni najdene polnilnice",
    ed_device: "Polnilnica",
    ed_battery: "Baterija vozila",
    ed_battery_helper: "Raven baterije avtomobila, na ilustraciji in v obroču mini kartice",
    ed_show_scene: "Ilustracija",
    ed_animations: "Animacije",
    ed_show_controls: "Upravljanje",
    ed_max_power: "Največja moč (kW)",
    ed_max_power_helper: "Za obroč mini kartice, ko raven baterije ni znana",
    ed_vehicle: "Vozilo",
    ed_vehicle_sedan: "Limuzina",
    ed_vehicle_hatch: "Kombilimuzina",
    ed_vehicle_estate: "Karavan",
    ed_vehicle_crossover: "Fastback crossover",
    ed_vehicle_coupe_suv: "SUV kupe",
    ed_vehicle_small_suv: "Mali SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Mestni avto",
    ed_vehicle_van: "Enoprostorec / kombi",
    ed_color: "Barva",
    ed_color_auto: "Samodejno (tema)",
    ed_color_white: "Bela",
    ed_color_silver: "Srebrna",
    ed_color_grey: "Siva",
    ed_color_black: "Črna",
    ed_color_blue: "Modra",
    ed_color_red: "Rdeča",
    ed_color_green: "Zelena",
    ed_illustration_theme: "Tema ilustracije",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_show_background: "Ozadje",
    ed_show_background_helper: "Nebo, zid hiše in dovoz za polnilnico in avtomobilom",
    ed_entities: "Entitete (YAML)",
    ed_entities_helper: "Nadomesti najdene entitete po vlogi: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Prazno: ime polnilnice",
    confirm: "Pritisnite znova za odklepanje",
  },
  lv: {
    title: "Uzlādes stacija",
    st_charging: "Uzlādē",
    st_waiting: "Pievienots",
    st_done: "Uzlādēts",
    st_idle: "Nav auto",
    st_error: "Kļūda",
    st_offline: "Bezsaistē",
    t_session: "Sesija",
    t_time: "Laiks",
    t_cost: "Izmaksas",
    t_current: "Strāva",
    t_total: "Kopā",
    t_limit: "Limits",
    t_last: "Pēdējā sesija",
    phases_one: "{n} fāze",
    phases_many: "{n} fāzes",
    pause: "Pauze",
    start: "Sākt",
    unlock: "Atbloķēt kabeli",
    lock: "Bloķēt kabeli",
    lock_box: "Bloķēt uzlādes staciju",
    unlock_box: "Atbloķēt uzlādes staciju",
    locked: "Bloķēts",
    unlocked: "Atbloķēts",
    lower: "Samazināt strāvu",
    raise: "Palielināt strāvu",
    no_charger: "Uzlādes stacija nav atrasta",
    ed_device: "Stacija",
    ed_battery: "Auto akumulators",
    ed_battery_helper: "Auto akumulatora līmenis, ilustrācijā un mini kartītes gredzenā",
    ed_show_scene: "Ilustrācija",
    ed_animations: "Animācijas",
    ed_show_controls: "Vadība",
    ed_max_power: "Maksimālā jauda (kW)",
    ed_max_power_helper: "Mini kartītes gredzenam, ja akumulatora līmenis nav zināms",
    ed_vehicle: "Transportlīdzeklis",
    ed_vehicle_sedan: "Sedans",
    ed_vehicle_hatch: "Hečbeks",
    ed_vehicle_estate: "Universālis",
    ed_vehicle_crossover: "Fastback krosovers",
    ed_vehicle_coupe_suv: "SUV kupeja",
    ed_vehicle_small_suv: "Mazs SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Pilsētas auto",
    ed_vehicle_van: "Minivens / furgons",
    ed_color: "Krāsa",
    ed_color_auto: "Automātiski (motīvs)",
    ed_color_white: "Balta",
    ed_color_silver: "Sudraba",
    ed_color_grey: "Pelēka",
    ed_color_black: "Melna",
    ed_color_blue: "Zila",
    ed_color_red: "Sarkana",
    ed_color_green: "Zaļa",
    ed_illustration_theme: "Ilustrācijas motīvs",
    ed_theme_auto: "Automātiski (seko tēmai)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_show_background: "Fons",
    ed_show_background_helper: "Debesis, mājas siena un piebraucamais ceļš aiz uzlādes stacijas un auto",
    ed_entities: "Entītijas (YAML)",
    ed_entities_helper: "Aizstāj atrastās entītijas pēc lomas: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Tukšs: stacijas nosaukums",
    confirm: "Nospiediet vēlreiz, lai atbloķētu",
  },
  el: {
    title: "Φορτιστής",
    st_charging: "Φορτίζει",
    st_waiting: "Συνδεδεμένο",
    st_done: "Φορτισμένο",
    st_idle: "Χωρίς αυτοκίνητο",
    st_error: "Σφάλμα",
    st_offline: "Εκτός σύνδεσης",
    t_session: "Συνεδρία",
    t_time: "Χρόνος",
    t_cost: "Κόστος",
    t_current: "Ρεύμα",
    t_total: "Σύνολο",
    t_limit: "Όριο",
    t_last: "Τελευταία συνεδρία",
    phases_one: "{n} φάση",
    phases_many: "{n} φάσεις",
    pause: "Παύση",
    start: "Έναρξη",
    unlock: "Ξεκλείδωμα καλωδίου",
    lock: "Κλείδωμα καλωδίου",
    lock_box: "Κλείδωμα φορτιστή",
    unlock_box: "Ξεκλείδωμα φορτιστή",
    locked: "Κλειδωμένο",
    unlocked: "Ξεκλείδωτο",
    lower: "Μείωση ρεύματος",
    raise: "Αύξηση ρεύματος",
    no_charger: "Δεν βρέθηκε φορτιστής",
    ed_device: "Φορτιστής",
    ed_battery: "Μπαταρία οχήματος",
    ed_battery_helper: "Η στάθμη μπαταρίας του αυτοκινήτου, στην εικόνα και στον δακτύλιο της μίνι κάρτας",
    ed_show_scene: "Εικόνα",
    ed_animations: "Κινούμενα σχέδια",
    ed_show_controls: "Χειριστήρια",
    ed_max_power: "Μέγιστη ισχύς (kW)",
    ed_max_power_helper: "Για τον δακτύλιο της μίνι κάρτας όταν η στάθμη μπαταρίας είναι άγνωστη",
    ed_vehicle: "Όχημα",
    ed_vehicle_sedan: "Sedan",
    ed_vehicle_hatch: "Hatchback",
    ed_vehicle_estate: "Station wagon",
    ed_vehicle_crossover: "Crossover fastback",
    ed_vehicle_coupe_suv: "SUV coupé",
    ed_vehicle_small_suv: "Μικρό SUV",
    ed_vehicle_suv: "SUV",
    ed_vehicle_city: "Αυτοκίνητο πόλης",
    ed_vehicle_van: "Πολυμορφικό / βαν",
    ed_color: "Χρώμα",
    ed_color_auto: "Αυτόματο (θέμα)",
    ed_color_white: "Λευκό",
    ed_color_silver: "Ασημί",
    ed_color_grey: "Γκρι",
    ed_color_black: "Μαύρο",
    ed_color_blue: "Μπλε",
    ed_color_red: "Κόκκινο",
    ed_color_green: "Πράσινο",
    ed_illustration_theme: "Θέμα εικονογράφησης",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_show_background: "Φόντο",
    ed_show_background_helper: "Ο ουρανός, ο τοίχος του σπιτιού και η είσοδος πίσω από τον φορτιστή και το αυτοκίνητο",
    ed_entities: "Οντότητες (YAML)",
    ed_entities_helper: "Αντικαθιστά τις οντότητες που βρέθηκαν, ανά ρόλο: status, power, energy, total, limit, current, phases, switch, start, stop, lock, cost, duration, error, battery",
    ed_title_helper: "Κενό: το όνομα του φορτιστή",
    confirm: "Πατήστε ξανά για ξεκλείδωμα",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `<base>_few` or `<base>_many` (the "other" form), from the CLDR category of
// `n` in `lang` (Serbian 1 / 2-4 / 5+, 21 / 22…). `_few` is optional: without it, `_many` is used. A `_one` text without
// {n} ("Turn this plug off?") only means exactly one.
const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if (cat === "few" && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

const rcUnavailable = (st) => ["unavailable", "unknown"].includes(st.state);

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  // `<base>_one` / `_few` / `_many` for `n`, with {n} filled in.
  _tn(base, n, vars) {
    return this._t(rcPluralKey(this.constructor.i18n, this._lang(), base, n), { ...vars, n });
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _tile(i, { cls = "", style = "", extra = "", state = i.state, title = `${i.name} — ${i.state}` }) {
    return `
      <button class="tile ${i.unavailable ? "na" : i.on ? "on" : "off"}${cls}" data-id="${rcEsc(i.id)}"
              ${style ? `style="${rcEsc(style)}"` : ""} title="${rcEsc(title)}">
        ${extra}
        <span class="ic"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon></span>
        <span class="txt">
          <span class="name">${rcEsc(i.name)}</span>
          <span class="state">${state}</span>
        </span>
      </button>`;
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
      // The header is complete (detail button included): the card's status pill, if it places one, is fitted now.
      this._fitPill?.();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];

// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-ev-charger-card",
  });
};

if (!customElements.get("ev-charger-card")) {
  console.info(`%c HA-EV-CHARGER-CARD %c v${RC_VERSION} `, "background:#2f80ed;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* A 24 px round button in the card's top right corner, out of the title line. */
  ha-card { position: relative; }
  .head:has(> .zoom) { padding-right: 22px; }
  .zoom { all: unset; position: absolute; z-index: 2; top: 5px; right: 5px; cursor: pointer; width: 24px; height: 24px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  /* The status pill right after the title (the title gives way first, down to a few letters). */
  .mini .head > .title { flex: 0 1 auto; min-width: 4ch; }
  .st { flex: none; max-width: 51%; box-sizing: border-box; overflow: hidden; position: relative; display: inline-flex; align-items: center; gap: 4px;
        padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
        color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
  .st:not(.action)::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; }
  .st:empty, .st:has(.pt:empty) { display: none; }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
