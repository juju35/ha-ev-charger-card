// One file per language; scripts/bundle.mjs inlines them back into a single object literal at build, which
// scripts/i18n-split.mjs then splits per language (English stays in the bundle).
import en from "./en.js";
import fr from "./fr.js";
import de from "./de.js";
import es from "./es.js";
import sr from "./sr.js";
import srLatn from "./sr-Latn.js";
import it from "./it.js";
import nl from "./nl.js";
import pt from "./pt.js";
import pl from "./pl.js";
import ro from "./ro.js";
import da from "./da.js";
import sv from "./sv.js";
import bg from "./bg.js";
import ru from "./ru.js";
import uk from "./uk.js";
import hu from "./hu.js";
import sk from "./sk.js";
import cs from "./cs.js";
import sl from "./sl.js";
import lv from "./lv.js";
import el from "./el.js";

// Strings shared by the cards; a card's own dictionary wins over these.
export const RC_I18N = {
  en: en.RC_I18N,
  fr: fr.RC_I18N,
  de: de.RC_I18N,
  es: es.RC_I18N,
  sr: sr.RC_I18N,
  "sr-Latn": srLatn.RC_I18N,
  it: it.RC_I18N,
  nl: nl.RC_I18N,
  pt: pt.RC_I18N,
  pl: pl.RC_I18N,
  ro: ro.RC_I18N,
  da: da.RC_I18N,
  sv: sv.RC_I18N,
  bg: bg.RC_I18N,
  ru: ru.RC_I18N,
  uk: uk.RC_I18N,
  hu: hu.RC_I18N,
  sk: sk.RC_I18N,
  cs: cs.RC_I18N,
  sl: sl.RC_I18N,
  lv: lv.RC_I18N,
  el: el.RC_I18N,
};

// Strings of the EV charger cards; the shared ones above (unavailable, editor basics) complete them.
export const EV_I18N = {
  en: en.EV_I18N,
  fr: fr.EV_I18N,
  de: de.EV_I18N,
  es: es.EV_I18N,
  sr: sr.EV_I18N,
  "sr-Latn": srLatn.EV_I18N,
  it: it.EV_I18N,
  nl: nl.EV_I18N,
  pt: pt.EV_I18N,
  pl: pl.EV_I18N,
  ro: ro.EV_I18N,
  da: da.EV_I18N,
  sv: sv.EV_I18N,
  bg: bg.EV_I18N,
  ru: ru.EV_I18N,
  uk: uk.EV_I18N,
  hu: hu.EV_I18N,
  sk: sk.EV_I18N,
  cs: cs.EV_I18N,
  sl: sl.EV_I18N,
  lv: lv.EV_I18N,
  el: el.EV_I18N,
};
