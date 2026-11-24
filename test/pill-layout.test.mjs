// Browser test (Chromium through Playwright) of the status pill of the illustrated and the classic header, on the full card and the mini
// card (compact and zoomed), light and dark, in en, fr, de, hu, el and ru, from 245 to 500 px: the pill sits on the
// title's row only beside the whole title (no ellipsis); otherwise on a line of its own under the subtitle. Its label
// is whole, or its dot alone (always at 190 px). Nothing runs into the ground strip or out of the banner.
// Skipped when Playwright or Chromium is not installed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { setup } from "../scripts/screenshots/mock.mjs";
import { sources } from "./source.mjs";

const src = ["shared", "ev-charger-card"].map((n) => (sources[`${n}.js`] ?? readFileSync(new URL(`../src/${n}.js`, import.meta.url), "utf8"))).join("\n{\n") + "\n}\n";
const ICONS = `customElements.define("ha-icon", class extends HTMLElement {});`;
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`;
let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

test("the banner's status pill: beside the whole title or under the subtitle, whole label or dot, inside the banner", { timeout: 600000 }, async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD + ICONS });
  await page.addScriptTag({ content: src });
  const cases = [];
  for (const [type, zoom] of [["ev-charger-card", false], ["ev-charger-mini-card", false], ["ev-charger-mini-card", true]])
    for (const language of ["en", "fr", "de", "hu", "el", "ru"])
      for (const dark of [false, true])
        for (const variant of ["charging", "waiting", "error", "bare", "classic"]) for (const width of [190, 245, 300, 400, 460, 500]) cases.push({ type, zoom, language, dark, variant, width });
  const results = await page.evaluate(
    async ({ cases, data }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await document.fonts.ready;
      const out = [];
      for (const c of cases) {
        const box = document.body.appendChild(document.createElement("div"));
        box.style.width = `${c.width}px`;
        const el = document.createElement(c.type);
        const s = data[c.variant];
        el.setConfig({ type: `custom:${c.type}`, ...s.config, language: c.language });
        el.hass = { ...s.hass, language: c.language, locale: { language: c.language }, themes: { darkMode: c.dark }, callService: async () => {} };
        box.appendChild(el);
        await frame();
        if (c.zoom) {
          el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          await frame();
        }
        // The banner's text, or the classic header's (show_scene: false): the full card's and the mini card's.
        for (const t of el.shadowRoot.querySelectorAll(".tt, .mini .body")) {
          const inBanner = t.closest(".banner");
          const banner = (inBanner || t.closest("ha-card")).getBoundingClientRect();
          const ground = inBanner?.querySelector(".ground");
          const floor = inBanner ? (ground ? ground.getBoundingClientRect().top : banner.bottom - 10) : Infinity;
          const pill = [...t.querySelectorAll(".chip, .head > .st")].find((p) => p.getClientRects().length);
          const tx = pill?.querySelector(".ct, .pt");
          const nameEl = t.querySelector(".trow > :first-child, .head > .title");
          const name = nameEl.getBoundingClientRect();
          const p = pill?.getBoundingClientRect();
          const parts = [...t.querySelectorAll(":scope > *, .trow > *, .head > .title, .head > .st")].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
          const tb = t.getBoundingClientRect();
          out.push({
            ...c,
            label: pill?.getAttribute("title") || pill?.textContent,
            // Its dot alone: the label hidden, or kept for screen readers only (clipped to 1 px).
            dot: tx ? getComputedStyle(tx).display === "none" || tx.getBoundingClientRect().width <= 1 : null,
            cut: tx ? tx.scrollWidth - tx.clientWidth : null,
            beside: p ? p.top < name.bottom - 2 : false,
            titleCut: nameEl.scrollWidth - nameEl.clientWidth,
            nameW: name.width,
            past: p ? p.right - tb.right : 0,
            low: Math.max(...parts.map((r) => r.bottom)) - floor,
            out: Math.max(banner.top - Math.min(...parts.map((r) => r.top)), Math.max(...parts.map((r) => r.right)) - banner.right,
                          banner.left - Math.min(...parts.map((r) => r.left))),
          });
        }
        box.remove();
      }
      return out;
    },
    { cases, data: Object.fromEntries(["charging", "waiting", "error", "bare", "classic"].map((v) => {
      const extra = { bare: { show_background: false }, classic: { show_scene: false } }[v] || {};
      const s = setup({ scene: ["bare", "classic"].includes(v) ? "charging" : v, theme: "light", config: { animations: false, ...extra } });
      return [v, { hass: s.hass, config: s.config }];
    })) },
  );
  await page.close();
  assert.ok(results.length >= cases.length, "a case without a banner");
  for (const r of results) {
    const at = `${r.type}${r.zoom ? " zoomed" : ""} ${r.variant} ${r.language} ${r.dark ? "dark" : "light"} ${r.width}px`;
    assert.ok(r.cut !== null, `no pill: ${at}`);
    if (r.width <= 200) assert.ok(r.dot, `pill label shown at ${at}`);
    if (!r.dot) assert.ok(r.cut <= 0.5, `pill "${r.label}" cut by ${r.cut}px: ${at}`);
    if (r.beside) assert.ok(r.titleCut <= 0, `title cut beside the pill: ${at}`);
    assert.ok(r.nameW >= 24, `title ${r.nameW}px wide: ${at}`);
    assert.ok(r.past <= 0.5, `pill ${r.past}px past the title block: ${at}`);
    assert.ok(r.low <= 0.5, `header text ${r.low}px into the ground strip: ${at}`);
    assert.ok(r.out <= 0.5, `header text ${r.out}px out of the banner: ${at}`);
  }
});
