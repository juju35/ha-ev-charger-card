/**
 * ev-charger-card / ev-charger-mini-card: an EV charger, illustrated. The wallbox, its cable and the car, with energy flowing
 * while it charges; the session in three tiles; pause / start, the current limit and the cable lock.
 * https://github.com/juju35/ha-ev-charger-card
 */

// Colour of each state: on the badge, the pill, the LED ring, the cable and the battery bar.
const EV_ACCENTS = { charging: "#2f80ed", waiting: "#e8a33d", done: "#2e9d5a", idle: "#9aa3ae", error: "#e5484d", offline: "#9aa3ae" };
const EV_ICONS = {
  charging: "mdi:ev-station",
  waiting: "mdi:ev-plug-type2",
  done: "mdi:battery-charging-100",
  idle: "mdi:ev-station",
  error: "mdi:alert-circle-outline",
  offline: "mdi:lan-disconnect",
};

// The cars, seen from the side, rear to the wallbox: each one is its wheels (rear and front axle, radius, wheel arch,
// sill), its body and window outlines, its lights, door lines, handles and mirror, drawn by `evCar` with the same
// paint, glass, aero wheels and shadows. The charging port sits on the rear wing, at the same place on every car,
// where the cable ends.
const EV_VEHICLES = {
  // A fastback saloon: long bonnet, sloping roof, body-coloured roof above the windows.
  sedan: {
    R: 242, F: 378, r: 19, sill: 146, top: 87, shadow: [310, 124],
    body: "M204 146 C199 146 197 143 197 139 L197 126 C197 120 198 115 201 112 L214 108.5 C238 99 262 90 292 88 C306 87.2 318 87.6 328 89.5 C340 92 352 99 362 105.5 C384 107.5 404 110 413 114 C419 117 421 122 421 128 L421 138 C421 143 418 146 413 146",
    glass: "M219 108.2 C240 99.6 263 90.9 292 89 C306 88.2 318 88.6 327.6 90.4 C339 93 350 99.4 357.6 105.2 L356.6 107.8 Z",
    refl: "M232 102.6 C252 95.6 272 92 292 90.8",
    pillars: "M313 89.6 L316 107.6",
    shoulder: "M214 109.5 C262 110 340 109 362 107.5 C388 109.5 405 112 413 115",
    crease: "M206 122 C260 121 330 121.5 400 123",
    doors: "M316 108.5 C315.5 120 316 132 317.5 140 M268 108.5 C266 116 265.5 120 266 124",
    handles: [292, 333, 112.4],
    mirror: "M350 104.5 C352 101 357 100.5 360 102 L360 106.5 L351 106.5 Z",
    head: "M403 115.4 C409 116.2 415 117.6 419.5 120",
    tail: "M197.6 116 C202 112.5 207 110.6 214 109.2",
    sideskirt: "M262 141.5 L356 141.5",
  },
  // A five-door hatchback: short bonnet, long roof, an upright tailgate, a body-coloured rear pillar.
  hatch: {
    R: 240, F: 368, r: 18.5, sill: 146, top: 88, shadow: [302, 108],
    body: "M207 146 C202 146 200 143 200 139 L200 116 C200 108 202 101.5 206 97 L211 92.6 C218 89.6 232 88.4 252 88.2 L300 88 C312 88.2 320 90.4 328 94.6 C336 99 344 104 350 107.4 C370 109.2 388 111.8 396 115 C401 117.6 403.6 122 403.6 128 L403.6 138 C403.6 143 401 146 397 146",
    glass: "M214 103 L216 96.6 C221 93 234 92.2 254 92 L298 91.9 C308 92.1 314 93.8 320 97 C327 101 334 104.6 339 107.6 L214 107.6 Z",
    refl: "M220 100 C238 94 262 93 288 92.6",
    pillars: "M268 92 L269.5 107.6",
    cpillar: "M232 92.4 C228.6 98 227.6 103 227.6 107.6",
    shoulder: "M204 109 L340 109 C364 110.6 384 113 396 116",
    crease: "M204 124 C250 123 320 123.4 394 125",
    doors: "M270 108.4 C269.6 120 270 131 271 140 M236 108.4 C235 114 235 118 236 123",
    handles: [248, 302, 112],
    mirror: "M334 104 C336 100.6 341 100 344 101.6 L344 106.4 L335 106.4 Z",
    head: "M384 114 C390 115 396 116.8 400.6 119.6",
    tail: "M200.6 113 L200.6 103.6 C201.4 100.6 203.4 98.4 206 97.2",
  },
  // An estate: a long flat roof down to an upright tailgate, a rear quarter window behind the rear doors.
  estate: {
    R: 242, F: 380, r: 19, sill: 146, top: 88, shadow: [310, 124],
    body: "M204 146 C199.5 146 197.5 143 197.5 139 L197.5 116 C197.5 108 199 102 202 97.6 L207 92 C214 89.6 226 89 244 88.8 L310 88.4 C324 88.6 334 91 344 96 C352 100 360 104.6 367 107.6 C388 109.4 404 112 412.6 115.6 C418.6 118.6 421 123 421 129 L421 138.6 C420.6 143.4 418 146 413 146",
    glass: "M209 104 L211 96.4 C216 93.4 228 92.8 246 92.6 L308 92.3 C320 92.5 330 94.6 338 98.6 C346 102.6 352 105.6 356.6 108.4 L209 108.4 Z",
    refl: "M216 100 C240 94.4 270 93.2 300 93",
    pillars: "M304 92.4 L305.4 108.4",
    cpillar: "M250 92.6 L250.4 108.4",
    shoulder: "M202 110 L356 110 C384 111.6 404 114 412.6 117",
    crease: "M202 124 C260 123 330 123.4 404 125",
    doors: "M305.4 109.4 C305 120 305.4 131 306.4 140 M251 109.4 C250 115 249.8 119 250.4 123.6",
    handles: [280, 330, 113.2],
    mirror: "M352 104.6 C354 101.2 359 100.6 362 102.2 L362 107.2 L353 107.2 Z",
    head: "M402 115.6 C409 116.4 415.4 118 419.6 121",
    tail: "M198.2 114 L198.2 104 C199 100.4 201 98 204 96.6",
    sideskirt: "M264 141.5 L358 141.5",
  },
  // A fastback crossover: tall, one rounded roofline in black glass from the windscreen down to a small lip on the
  // hatch, a short sloping bonnet, grey aero wheel covers.
  crossover: {
    R: 243, F: 378, r: 20, sill: 144, top: 82, shadow: [310, 124], aero: true,
    body: "M205 146 C200 146 198 143 198 139 L198 120 C198 113 200 108.5 204 105.6 L210.4 103 C222 98.4 236 89.4 252 85.6 C268 82.6 284 82 300 81.8 C326 81.6 346 88 374 101 C392 103.4 406 106.5 413.6 110.4 C419 113.4 421.4 118.4 421.4 125 L421 138.6 C420.6 143.4 418 146 413 146",
    glass: "M212.6 103.4 C225 97 238 89.6 253 86.4 C268 83.4 284 82.8 300 82.6 C326 82.4 345 88.8 371.6 101.4 L370 102.6 C320 102 268 101.8 214 103.6 Z",
    panes: "M318 102 L318 87 C334 87.2 349 92.8 362 100.6 L361 102 Z M311.6 102 L311.6 86.2 C292 86 270 89 254 95.2 L252 102 Z M247.6 98.4 C238 100.4 230 101.8 223 102.4 L247 102.4 Z",
    refl: "M236 94 C258 87 282 84.2 306 83.8",
    pillars: "M314.8 85.4 L314.8 102.4",
    shoulder: "M210 104.8 C260 105.2 330 104.4 374 102.4 C392 104.8 405 107.4 413 111",
    crease: "M204 122 C260 121 330 121.4 402 123",
    doors: "M316 103.6 C315.6 116 316 128 317.4 137 M250 103.6 C249 110 248.6 115 249.2 120",
    handles: [290, 336, 107.6],
    mirror: "M362 99.8 C364 96.8 368.6 96.4 371.4 97.8 L371.4 102.4 L363 102.4 Z",
    head: "M402 108.4 C409 109 415.4 110.8 419.2 114.4",
    tail: "M198.8 113.6 C200.4 109.6 203.6 106.4 208.4 104.6 L215 103.4",
    sideskirt: "M267 140.6 L354 140.6",
  },
  // A coupé SUV: an SUV's height and cladding under a roof sloping down to the tailgate.
  coupe_suv: {
    R: 244, F: 376, r: 20.5, sill: 143, top: 80, shadow: [310, 124], cladding: true,
    body: "M205 146 C200 146 198 143 198 139 L198 114 C198 108 199.6 104 202.6 101.6 L209 99.4 C222 94.4 238 86 262 82.6 C278 80.8 300 80.6 318 81.2 C330 81.6 338 83 346 87 C354 91 362 96.6 368 101 C388 103 404 106 412 110 C418 113 421 118 421 124 L421 139 C421 143 418 146 414 146",
    glass: "M212 101.4 C224 96 240 88.6 262 85.8 C278 84 300 84 318 84.6 C328 85 335 86.6 342 90 C350 94 356 98.5 361 102.6 L213 102.6 Z",
    refl: "M226 97 C246 89.4 272 86 300 85.6",
    pillars: "M252 87.4 L252.4 102.6 M305 84.6 L307 102.6",
    shoulder: "M206 104.2 L362 104.2 C386 106 404 108.5 413 112",
    crease: "M203 121 C260 120 330 120.5 404 122",
    doors: "M306 104 C305.6 116 305.8 126 306.6 136 M254 104 C253 112 253 116 254 120",
    handles: [282, 333, 108.6],
    mirror: "M356 99.5 C358 96 363 95.5 366 97 L366 102 L357 102 Z",
    head: "M402 110.5 C409 111.6 415 113.4 419.8 116.6",
    tail: "M198.6 112 L198.6 105 C199.6 102.6 202 101 205 100.2",
  },
  // A small urban SUV: short and tall, roof rails, black wheel-arch cladding.
  small_suv: {
    R: 240, F: 356, r: 19.5, sill: 143, top: 82, shadow: [296, 104], cladding: true,
    body: "M207 146 C202 146 200 143 200 139 L200 110 C200 102 202 96 206 92 L211 87.4 C218 84 230 82.6 248 82.4 L290 82.2 C300 82.4 307 84 314 88.4 C322 93.4 330 99 336 102.6 C356 104.4 372 107.6 380 111.6 C386 114.6 389 119 389 125 L389 139 C389 143 386 146 382 146",
    glass: "M213 98 L215 91.4 C220 87.6 232 86.6 250 86.4 L288 86.3 C297 86.5 303 88 309 91.6 C316 96 322 99.6 327 102.4 L213 102.4 Z",
    refl: "M220 95 C236 89.6 258 87.6 284 87.2",
    pillars: "M272 86.4 L273.4 102.4",
    cpillar: "M232 86.6 C229 92 228 97 228 102.4",
    rails: "M222 84.6 C230 82.4 240 81.6 252 81.4 L292 81.2",
    shoulder: "M204 104.4 L330 104.4 C352 106 372 108.6 381 112.6",
    crease: "M204 121 C250 120 310 120.4 382 122",
    doors: "M274 103.6 C273.6 116 274 126 274.8 136 M232 103.6 C231 110 231 114 232 119",
    handles: [250, 300, 108.2],
    mirror: "M322 98.4 C324 95 329 94.4 332 96 L332 101 L323 101 Z",
    head: "M370 110.4 C376 111.4 381 113.2 385.6 116.4",
    tail: "M200.6 110 L200.6 99",
  },
  // A crossover SUV: taller, roof rails, black wheel-arch and sill cladding.
  suv: {
    R: 244, F: 376, r: 20.5, sill: 143, top: 80, shadow: [310, 124], cladding: true,
    body: "M205 146 C200 146 198 143 198 139 L198 112 C198 104 201 98 206 95 L214 89 C222 84.5 236 82 260 81 L318 80.5 C330 80.5 338 82 346 86 C354 90 362 96 368 101 C388 103 404 106 412 110 C418 113 421 118 421 124 L421 139 C421 143 418 146 414 146",
    glass: "M214 99 L217 92 C224 88 238 86 262 85.4 L318 85 C328 85 335 86.5 342 90 C350 94 356 98.5 361 102.6 L215 102.6 Z",
    refl: "M222 96 C240 90 268 88 300 87.6",
    pillars: "M248 85.6 L250 102.6 M305 85.2 L307 102.6",
    rails: "M228 83.2 C238 81.4 250 80.4 262 80 L326 79.8",
    shoulder: "M202 104.5 L362 104.5 C386 106 404 108.5 413 112",
    crease: "M203 121 C260 120 330 120.5 404 122",
    doors: "M306 104 C305.6 116 305.8 126 306.6 136 M252 104 C251 112 251 116 252 120",
    handles: [282, 333, 108.6],
    mirror: "M356 99.5 C358 96 363 95.5 366 97 L366 102 L357 102 Z",
    head: "M402 110.5 C409 111.6 415 113.4 419.8 116.6",
    tail: "M198.6 110 L198.6 99.5 C199.5 97 201.5 95.5 204 94.6",
  },
  // A city car: short, upright, two short overhangs.
  city: {
    R: 238, F: 350, r: 17.5, sill: 146, top: 83, shadow: [293, 100],
    body: "M207 146 C202 146 200 143 200 139 L200 112 C200 104 202 98 206 94 L211 89 C217 85 228 83.5 246 83.2 L292 83 C302 83.2 309 85 316 89.5 C323 94 330 99.5 336 104 C356 106 372 109 380 113 C384 116 386 120 386 126 L386 138 C386 143 383 146 379 146",
    glass: "M214 100 L216 93 C221 89 232 87.5 248 87.4 L290 87.3 C299 87.5 305 89 310.5 92.5 C317 97 322.5 100.5 327 104 L214 104 Z",
    refl: "M220 97 C236 91 258 89.4 284 88.6",
    pillars: "M270 87.4 L271.5 104",
    shoulder: "M204 106 L330 106 C352 107.5 370 110 380 114",
    crease: "M205 121 C250 120 310 120.5 380 122",
    doors: "M272 105 C271.6 118 272 130 273 140 M232 105 C231 112 231 116 232 121",
    handles: [250, 300, 109.6],
    mirror: "M322 100.5 C324 97 329 96.5 332 98 L332 103 L323 103 Z",
    head: "M372 111.8 C378 112.8 382 114.4 385.4 117",
    tail: "M200.6 110 L200.6 101",
  },
  // An MPV / van: a tall box, a short bonnet, a sliding rear door and an upright tailgate.
  van: {
    R: 240, F: 374, r: 19, sill: 145, top: 72, shadow: [309, 122],
    body: "M205 146 C200.5 146 198.5 143 198.5 139 L198.5 86 C198.5 79 202 74.4 210 73.6 L330 72.4 C340 72.6 346 74.4 350 78 C356 84 364 93 370 100.6 C388 102.8 404 106 411.6 110 C417.6 113 420 118 420 124 L420 138.6 C420 143.4 417.4 146 412.6 146",
    glass: "M206 98 L206 82 C206 79 208 77.6 212 77.4 L330 76.4 C337 76.4 341 77.8 344 80.6 C350 86.6 356 93.6 362 100.8 L206 100.8 Z",
    refl: "M214 92 C240 82 280 79 320 78.4",
    pillars: "M262 77 L262.6 100.8 M318 76.6 L320 100.8",
    shoulder: "M202 103.4 L362 103.4 C388 105 404 108 412 111.6",
    crease: "M202 122 C260 121 330 121.4 404 123",
    doors: "M321 101.8 C320.6 116 321 128 322 138 M262.6 101.8 L262.6 138",
    handles: [296, 334, 107.4],
    mirror: "M358 96 C360 92.6 365 92 368 93.6 L368 99 L359 99 Z",
    head: "M400 109.6 C407 110.6 413.6 112.6 418 116",
    tail: "M199.2 112 L199.2 92",
    sideskirt: "M262 141 L352 141",
  },
};
// A number per card on the page: the ids of its illustration's gradients, masks and paths stay its own.
let evCards = 0;
const EV_CABLE = "M78 133 C78 180, 150 186, 184 162 S 207 128 213 121";
const EV_CABLE_HANGING = "M78 133 C78 172, 118 174, 120 150 C121 138, 112 132, 104 132";

const evN = (n) => +n.toFixed(1);
// The paints of `color`; none: white in a light theme, graphite in a dark one.
const EV_COLORS = { white: "#f3f5f8", silver: "#c9ced5", grey: "#6b727c", black: "#2a2d32", blue: "#2f5d9e", red: "#b3262e", green: "#3f6b55" };
const evMix = (a, b, t) =>
  `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("")}`;
const evPaint = (color, dark) => {
  const trim = dark ? "#121417" : "#1d2126";
  if (!EV_COLORS[color]) {
    return dark
      ? { hi: "#7b838e", base: "#4b525c", crease: "#3c424a", low: "#2a2e34", line: "#22262b", trim }
      : { hi: "#ffffff", base: "#f3f5f8", crease: "#dde2e8", low: "#c3cad3", line: "#aab2bc", trim };
  }
  // A dark theme dims the paint a little, as a garage at night.
  const base = dark ? evMix(EV_COLORS[color], "#000000", 0.18) : EV_COLORS[color];
  return { hi: evMix(base, "#ffffff", 0.4), base, crease: evMix(base, "#000000", 0.1), low: evMix(base, "#000000", 0.3), line: evMix(base, "#000000", 0.35), trim };
};
// The cut of a wheel arch in the body's outline, from the front of the arch to its rear, over the top.
const evArch = (cx, cy, r, sill) => {
  const dx = Math.sqrt(r * r - (sill - cy) ** 2);
  return `L${evN(cx + dx)} ${sill} A${r} ${r} 0 1 0 ${evN(cx - dx)} ${sill}`;
};
// A wheel: the tyre and its sidewall, the brake disc behind the spokes, then either five twin spokes and the rim's
// polished lip, or (`aero`) a flat cover with five openings; the centre cap.
const evWheel = (cx, cy, r, k, dark, aero) => {
  const rr = r * 0.7;
  const at = (rad, a) => `${evN(cx + rad * Math.cos(a))} ${evN(cy + rad * Math.sin(a))}`;
  const circle = (rad, attrs) => `<circle cx="${cx}" cy="${cy}" r="${evN(rad)}" ${attrs}/>`;
  const five = (f) => [0, 1, 2, 3, 4].map((i) => f((i * 2 * Math.PI) / 5 - Math.PI / 2 + 0.2)).join(" ");
  const face = aero
    ? `${circle(rr, `fill="url(#aw${k})"`)}<path d="${five((a) => `M${at(rr * 0.9, a - 0.36)} A${evN(rr * 0.9)} ${evN(rr * 0.9)} 0 0 1 ${at(rr * 0.9, a + 0.36)} L${at(rr * 0.52, a + 0.22)} A${evN(rr * 0.52)} ${evN(rr * 0.52)} 0 0 0 ${at(rr * 0.52, a - 0.22)} Z`)}" fill="#0b0c0e" opacity=".85"/>`
    : `<path d="${five((a) => [-0.19, 0.19].map((o) => `M${at(rr * 0.28, a + o - 0.2)} L${at(rr * 0.97, a + o - 0.095)} L${at(rr * 0.97, a + o + 0.095)} L${at(rr * 0.28, a + o + 0.2)} Z`).join(" "))}" fill="url(#rim${k})"/>${circle(rr * 0.97, `fill="none" stroke="url(#rim${k})" stroke-width="${evN(r * 0.09)}"`)}`;
  return `<g>${circle(r, `fill="url(#ty${k})"`)}${circle(r - 1.4, 'fill="none" stroke="#3a3f46" stroke-opacity=".7" stroke-width=".7"')}${circle(rr + 0.9, 'fill="#08090b"')}${circle(rr * 0.78, `fill="${dark ? "#2c3036" : "#3d4248"}"`)}${circle(rr * 0.78, 'fill="none" stroke="#5a6068" stroke-width=".6" stroke-opacity=".7"')}${face}${circle(rr * 0.3, `fill="url(#hub${k})"`)}${circle(rr * 0.12, 'fill="#9aa2ac" opacity=".7"')}${circle(rr + 0.2, 'fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".5"')}</g>`;
};
// A car of EV_VEHICLES: contact shadows, wheel wells, the body (with its curvature, arch lips and lower trim), the
// windows with their trim, the lines and details, the lights, the charging port (in the colour of the state) and the
// wheels; and its faint reflection on the floor.
const evCar = (v, { uid, dark, acc, color }) => {
  const k = `v${uid}`;
  const p = evPaint(color, dark);
  const glass = dark ? ["#2a323c", "#12171d", "#07090c"] : ["#5d6b7c", "#252d38", "#11161c"];
  const cy = 159 - v.r;
  // Tight arches: a premium car shows little gap between its tyres and its wings.
  const ar = v.r + 2.6;
  const body = `${v.body} ${evArch(v.F, cy, ar, v.sill)} ${evArch(v.R, cy, ar, v.sill)} Z`;
  const axles = [v.R, v.F];
  const arc = (cx, rad, y, sweep) => {
    const dx = Math.sqrt(rad ** 2 - (y - cy) ** 2);
    return `M${evN(cx - dx)} ${y} A${evN(rad)} ${evN(rad)} 0 1 ${sweep} ${evN(cx + dx)} ${y}`;
  };
  const well = (cx) => `<path d="${arc(cx, ar, v.sill, 1)} Z" fill="url(#wl${k})"/>`;
  // The lip of each arch: a shadow on its edge, a highlight just above.
  const lip = (cx) =>
    `<path d="${arc(cx, ar + 0.6, v.sill, 1)}" fill="none" stroke="#000" stroke-opacity="${dark ? 0.5 : 0.22}" stroke-width="1.4"/><path d="${arc(cx, ar + 2, v.sill - 1, 1)}" fill="none" stroke="${p.hi}" stroke-opacity="${dark ? 0.25 : 0.6}" stroke-width=".9"/>`;
  // Black plastic around the wheel arches (SUVs).
  const cladding = (cx) => {
    const y = v.sill + 3;
    const ro = ar + 3.2;
    const di = Math.sqrt(ar ** 2 - (y - cy) ** 2);
    return `<path d="M${evN(cx - ro + 0.2)} ${y} A${evN(ro)} ${evN(ro)} 0 0 1 ${evN(cx + ro - 0.2)} ${y} L${evN(cx + di)} ${y} A${evN(ar)} ${evN(ar)} 0 0 0 ${evN(cx - di)} ${y} Z" fill="${p.trim}" opacity=".9"/>`;
  };
  const lowY = v.cladding ? 136 : 140;
  // A lamp: its dark housing, the LED line and its glow.
  const lamp = (d, led, glow) =>
    `<path d="${d}" stroke="#16191d" stroke-width="4.4" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${led}" stroke-width="1.7" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${glow}" stroke-width="5" stroke-linecap="round" fill="none" opacity="${dark ? 0.5 : 0.3}" filter="url(#bl${uid})"/>`;
  const car = `
    ${axles.map(well).join("")}
    <path d="${body}" fill="url(#bd${k})"/>
    <g clip-path="url(#bc${k})">
      <rect x="190" y="70" width="240" height="90" fill="url(#cv${k})"/>
      <rect x="190" y="${lowY}" width="240" height="12" fill="${p.trim}" opacity="${v.cladding ? 0.9 : dark ? 0.6 : 0.16}"/>
      ${axles.map(lip).join("")}
    </g>
    <path d="${body}" fill="none" stroke="${p.line}" stroke-opacity=".7" stroke-width=".6"/>
    ${v.sideskirt ? `<path d="${v.sideskirt}" stroke="${p.trim}" stroke-width="4" stroke-linecap="round" opacity="${dark ? 0.8 : 0.55}"/>` : ""}
    ${v.cladding ? axles.map(cladding).join("") : ""}
    ${v.rails ? `<path d="${v.rails}" stroke="${p.trim}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".9"/><path d="${v.rails}" stroke="#fff" stroke-opacity="${dark ? 0.15 : 0.35}" stroke-width=".6" fill="none" transform="translate(0 -.6)"/>` : ""}
    <path d="${v.glass}" fill="url(#gl${k})" stroke="${dark ? "#6f7781" : "#aeb6bf"}" stroke-width=".9" stroke-linejoin="round"/>
    ${v.panes ? `<path d="${v.panes}" fill="#fff" opacity="${dark ? 0.05 : 0.08}"/>` : ""}
    <g clip-path="url(#gc${k})"><path d="M190 120 L300 70 L330 70 L220 120 Z" fill="#fff" opacity="${dark ? 0.05 : 0.1}"/><path d="M${v.R + 64} 120 l50 -50 h10 l-50 50 z" fill="#fff" opacity="${dark ? 0.04 : 0.07}"/></g>
    <path d="${v.refl}" stroke="url(#rf${k})" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="${v.pillars}" stroke="#0c0e11" stroke-width="3"/>
    ${v.cpillar ? `<path d="${v.cpillar}" stroke="${p.base}" stroke-width="5"/>` : ""}
    <path d="${v.shoulder}" stroke="url(#sl${k})" stroke-width="1.3" fill="none"/>
    <path d="${v.shoulder}" stroke="#000" stroke-opacity="${dark ? 0.25 : 0.08}" stroke-width=".8" fill="none" transform="translate(0 1.6)"/>
    <path d="${v.crease}" stroke="${p.hi}" stroke-opacity="${dark ? 0.2 : 0.6}" stroke-width=".9" fill="none"/>
    <path d="${v.crease}" stroke="${p.line}" stroke-opacity=".5" stroke-width=".6" fill="none" transform="translate(0 1)"/>
    <path d="${v.doors}" stroke="${p.line}" stroke-opacity=".75" stroke-width=".6" fill="none"/>
    ${v.handles.slice(0, 2).map((x) => `<rect x="${x}" y="${v.handles[2]}" width="12" height="2" rx="1" fill="${p.line}" opacity=".75"/><rect x="${x + 1}" y="${v.handles[2] + 2}" width="10" height=".6" rx=".3" fill="#fff" opacity="${dark ? 0.15 : 0.7}"/>`).join("")}
    <path d="${v.mirror}" fill="url(#gl${k})"/>
    ${lamp(v.head, dark ? "#fff6dc" : "#ffffff", "#ffd98a")}${lamp(v.tail, "#ff4d55", "#e5484d")}
    <rect x="207" y="112.5" width="12" height="9.5" rx="3" fill="#15181c" stroke="#000" stroke-opacity=".3" stroke-width=".6"/>
    <circle cx="213" cy="117.2" r="2.3" fill="${acc}"/><circle cx="213" cy="117.2" r="5.5" fill="${acc}" opacity=".4" filter="url(#bl${uid})"/>
    ${axles.map((x) => evWheel(x, cy, v.r, k, dark, v.aero)).join("")}`;
  return `
    <defs>
      <linearGradient id="bd${k}" x1="0" x2="0" y1="${v.top}" y2="147" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.hi}"/><stop offset=".3" stop-color="${p.base}"/><stop offset=".44" stop-color="${p.crease}"/><stop offset=".5" stop-color="${p.base}"/><stop offset=".78" stop-color="${p.base}"/><stop offset=".9" stop-color="${p.low}"/><stop offset="1" stop-color="${p.crease}"/></linearGradient>
      <linearGradient id="cv${k}" x1="${v.body.match(/^M(\d+)/)[1] - 8}" x2="${v.shadow[0] * 2 - v.body.match(/^M(\d+)/)[1] + 16}" y1="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.35 : 0.14}"/><stop offset=".12" stop-color="#000" stop-opacity="0"/><stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.35 : 0.14}"/></linearGradient>
      <linearGradient id="gl${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${glass[0]}"/><stop offset=".55" stop-color="${glass[1]}"/><stop offset="1" stop-color="${glass[2]}"/></linearGradient>
      <linearGradient id="rf${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${dark ? 0.12 : 0.28}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="sl${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="${dark ? 0.25 : 0.95}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="rim${k}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${dark ? "#d5dae0" : "#f4f6f8"}"/><stop offset=".5" stop-color="${dark ? "#8f97a1" : "#b9c0c8"}"/><stop offset="1" stop-color="${dark ? "#5b626b" : "#7d858f"}"/></linearGradient>
      <radialGradient id="aw${k}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${dark ? "#8d949d" : "#a9b0b8"}"/><stop offset=".7" stop-color="${dark ? "#5f666f" : "#7c848e"}"/><stop offset="1" stop-color="${dark ? "#40464d" : "#5c636c"}"/></radialGradient>
      <radialGradient id="ty${k}"><stop offset=".72" stop-color="#1c1f23"/><stop offset=".9" stop-color="#2a2e33"/><stop offset="1" stop-color="#121417"/></radialGradient>
      <radialGradient id="hub${k}" cx=".4" cy=".35"><stop offset="0" stop-color="#7a828c"/><stop offset="1" stop-color="#23272c"/></radialGradient>
      <radialGradient id="wl${k}" cy=".9" r=".9"><stop offset="0" stop-color="#050607" stop-opacity="0"/><stop offset=".5" stop-color="#0a0b0d"/><stop offset="1" stop-color="#16191d"/></radialGradient>
      <linearGradient id="fade${k}" x1="0" x2="0" y1="159" y2="182" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.22 : 0.14}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="mk${k}" maskUnits="userSpaceOnUse" x="180" y="159" width="250" height="31"><rect x="180" y="159" width="250" height="31" fill="url(#fade${k})"/></mask>
      <clipPath id="bc${k}"><path d="${body}"/></clipPath>
      <clipPath id="gc${k}"><path d="${v.glass}"/></clipPath>
    </defs>
    <g mask="url(#mk${k})"><g transform="matrix(1 0 0 -1 0 318)">${car}</g></g>
    <ellipse cx="${v.shadow[0]}" cy="158" rx="${v.shadow[1]}" ry="5.5" fill="url(#sh${uid})"/>
    ${axles.map((x) => `<ellipse cx="${x}" cy="158.6" rx="${evN(ar - 1)}" ry="2.2" fill="#000" opacity="${dark ? 0.65 : 0.4}"/>`).join("")}
    ${car}`;
};
// The backdrop, in the 200 × 80 frame of the header (the flight and train boards' sky behind it): the sun or the moon
// and stars, a low hill, and the rendered façade of the house the wallbox hangs on — its plinth and its wall lamp (lit
// at night), its left edge fading softly into the sky under the text. The concrete strip under it is the banner's.
const EV_STARS = [[96, 8], [130, 14], [170, 6], [186, 22], [150, 4]];
const evWall = (uid, night) => {
  const n = (dayC, nightC) => (night ? nightC : dayC);
  const sky = night
    ? `<g fill="#fff">${EV_STARS.map(([x, y], i) => `<circle class="${i % 2 ? "" : "tw"}" cx="${x}" cy="${y}" r=".6" opacity=".8"/>`).join("")}</g><circle cx="112" cy="12" r="4.5" fill="#f3eed2"/>`
    : '<circle cx="112" cy="12" r="6" fill="#ffd65a"/>';
  const grain = Array.from({ length: 30 }, (_, i) => `<circle cx="${((i * 17) % 78) - 8}" cy="${((i * 29) % 66) + 3}" r=".7"/>`).join("");
  return `
    ${sky}
    <path d="M0 80C40 70 80 66 120 68L200 66V80Z" fill="${n("#a7d39f", "#1d3a4a")}"/>
    <defs>
      <linearGradient id="wf${uid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff"/></linearGradient>
      <mask id="wm${uid}" maskUnits="userSpaceOnUse" x="-10" y="0" width="80" height="80"><rect x="0" y="0" width="70" height="80" fill="url(#wf${uid})"/></mask>
    </defs>
    <g mask="url(#wm${uid})">
      <rect x="-10" y="0" width="80" height="80" fill="${n("#efe3cf", "#3a3530")}"/>
      <g fill="${n("#e3d3b9", "#443e38")}">${grain}</g>
      <rect x="-10" y="70" width="80" height="10" fill="${n("#b9ab96", "#2a2724")}"/>
      <rect x="-10" y="69" width="80" height="1.4" fill="${n("#d4c6ae", "#4a443c")}"/>
    </g>
    <rect x="66" y="0" width="4" height="80" fill="${n("#dccab0", "#2e2a26")}"/>
    <g transform="translate(56 22)"><rect x="-2" y="-3" width="4" height="6" rx="1" fill="${n("#5f6b7a", "#6b6258")}"/><circle r="1.4" fill="${n("#fff", "#ffd27a")}"/>${night ? '<circle r="10" fill="#ffd27a" opacity=".18"/>' : ""}</g>`;
};

// The illustration: the wall and the floor, the wallbox and its LED ring, the cable (with energy flowing along it while
// charging) and the car (`vehicle`, painted `color`) with its charging port, on the house wall. Drawn at the right of
// the card's header in a 200 × 80 frame (the card's 430 × 190 drawing cropped into it). No car when none is plugged in: the cable hangs.
const evScene = ({ state, dark, night, backdrop = true, uid, label, animate, vehicle, color }) => {
  const acc = EV_ACCENTS[state];
  const car = state !== "idle" && state !== "offline";

  const paint = dark ? ["#4a515b", "#30353c", "#666e79"] : ["#fbfcfe", "#dfe4ea", "#b9c1cb"];
  const glass = dark ? ["#232a33", "#0d1116"] : ["#6d7a8b", "#28313d"];
  const cable = car ? EV_CABLE : EV_CABLE_HANGING;
  const flowing = animate && state === "charging";
  // Still (no animation): the particles stay along the cable, each frozen at a quarter of the way.
  const particles = state === "charging"
    ? [0, 1, 2, 3]
        .map((i) => {
          const motion = flowing
            ? `<animateMotion dur="1.8s" begin="${i * 0.45}s" repeatCount="indefinite"><mpath href="#c${uid}"/></animateMotion>`
            : `<animateMotion dur="1s" fill="freeze" calcMode="linear" keyPoints="${0.15 + i * 0.25};${0.15 + i * 0.25}" keyTimes="0;1"><mpath href="#c${uid}"/></animateMotion>`;
          return `<circle r="3" fill="#fff">${motion}</circle><circle r="6" fill="${acc}" opacity=".55" filter="url(#bl${uid})">${motion}</circle>`;
        })
        .join("")
    : "";
  const carSvg = car ? evCar(EV_VEHICLES[vehicle] || EV_VEHICLES.sedan, { uid, dark, acc, color }) : "";
  return `
  <svg class="scene" viewBox="0 0 200 80" role="img" aria-label="${rcEsc(label)}" preserveAspectRatio="xMaxYMax meet">
    ${backdrop ? evWall(uid, night) : ""}
    <svg x="0" y="2" width="200" height="78" viewBox="40 26 392 152" preserveAspectRatio="xMidYMax meet" overflow="visible">
    <defs>
      <linearGradient id="p${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paint[0]}"/><stop offset=".55" stop-color="${paint[0]}"/><stop offset="1" stop-color="${paint[1]}"/></linearGradient>
      <radialGradient id="sh${uid}"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.55 : 0.28}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="halo${uid}"><stop offset="0" stop-color="${acc}" stop-opacity=".28"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>
      <filter id="bl${uid}" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5"/></filter>
      <filter id="ds${uid}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="${dark ? 0.4 : 0.12}"/></filter>
    </defs>
    ${state === "idle" || state === "offline" ? "" : `<circle cx="78" cy="74" r="46" fill="url(#halo${uid})"/>`}
    <ellipse cx="78" cy="156" rx="30" ry="4" fill="url(#sh${uid})"/>
    <rect x="56" y="32" width="44" height="6" rx="3" fill="#000" opacity=".12"/>
    <g filter="url(#ds${uid})">
      <rect x="52" y="30" width="52" height="102" rx="18" fill="url(#p${uid})" stroke="${paint[2]}" stroke-width="1"/>
      <rect x="59" y="40" width="38" height="66" rx="13" fill="${glass[1]}"/>
      <path d="M62 46 Q78 40 94 46" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="78" cy="73" r="14" fill="none" stroke="${acc}" stroke-opacity=".25" stroke-width="7"/>
      <circle class="${flowing ? "ring" : state === "error" && animate ? "ring err" : ""}" cx="78" cy="73" r="14" fill="none" stroke="${acc}" stroke-width="2.6"/>
      <path d="M80.5 64.5l-7 10.5h5.2l-2 8 7.3-11.2h-5.3z" fill="${acc}"/>
      <rect x="70" y="114" width="16" height="4" rx="2" fill="${paint[2]}"/>
    </g>
    <path id="c${uid}" d="${cable}" fill="none" stroke="${dark ? "#0f1216" : "#2f3540"}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="${cable}" fill="none" stroke="#fff" stroke-opacity="${dark ? 0.08 : 0.22}" stroke-width="1.6" stroke-linecap="round" transform="translate(-1 -1.5)"/>
    ${backdrop ? "" : `<rect x="150" y="158.5" width="280" height="1" fill="${dark ? "#fff" : "#000"}" opacity="${dark ? 0.1 : 0.08}"/>`}
    ${particles}${carSvg}
    </svg>
  </svg>`;
};

const evIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const EV_SVG = {
  energy: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M21 10v4M9 9l-2 3h4l-2 3"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cost: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  current: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  total: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  start: '<path d="M7 4l12 8-12 8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
};

// ── Card ─────────────────────────────────────────────────────────────────────
// The width of an element's whole text in its own font, in fractional pixels (scrollWidth is rounded).
let evTextCtx;
const evTextWidth = (el) => {
  const cs = getComputedStyle(el);
  evTextCtx ??= document.createElement("canvas").getContext?.("2d");
  if (!evTextCtx) return el.scrollWidth;
  evTextCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(el.scrollWidth, evTextCtx.measureText(el.textContent.trim()).width + pad);
};

class EvChargerCard extends RcCard {
  static tag = "ev-charger-card";
  static i18n = EV_I18N;
  static defaults = { show_scene: true, animations: true, show_controls: true };

  // The most likely charger of the home.
  static getStubConfig(hass) {
    const device = hass ? evChargers(hass)[0] : undefined;
    return device ? { device } : {};
  }

  getCardSize() {
    return this._config?.show_scene === false ? 3 : 6;
  }

  _cols() {
    return 3;
  }

  _deviceId() {
    const c = this._config;
    if (c.device) return c.device;
    if (c.entity) return evDeviceOf(this._hass, c.entity);
    // The chargers of the home only change with the registries: not scanned again at every update.
    const h = this._hass;
    return rcMemo((this._memo ||= {}), "chargers", [h.entities, h.devices], () => evChargers(h))[0];
  }

  _fmt(v, digits) {
    try {
      return new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return v.toFixed(digits);
    }
  }

  // The charger's state and readings.
  _collect() {
    const h = this._hass;
    const c = this._config;
    const device = this._deviceId();
    // The roles depend on the states too (a status sensor reading "unknown" at start is skipped): found again when they change.
    // Only the states of the device's entities and of the overrides count, not every state of the home.
    const watched = [...(device ? evDeviceEntities(h)[device] || [] : []), ...Object.values(c.entities || {})];
    const deps = [device, c.entities, h.entities, h.devices, ...watched.map((id) => (typeof id === "string" ? h.states[id] : id))];
    const e = rcMemo((this._memo ||= {}), "find", deps, () => evFind(h, device, c.entities || {}));
    const st = (role) => (e[role] ? h.states[e[role]] : undefined);
    const on = (role) => st(role)?.state === "on";
    const watts = evWatts(st("power"));
    const raw = st("status");
    const errSt = st("error");
    const errOn = errSt && !rcUnavailable(errSt) && (errSt.entity_id.startsWith("binary_sensor.") ? errSt.state === "on" : !EV_NO_ERROR.test(evNorm(errSt.state)) && !!errSt.state);
    let state = raw && !rcUnavailable(raw) ? evStateOf(raw.state) : undefined;
    // OCPP publishes "Unavailable" with a capital: offline too.
    const rawOff = raw && (rcUnavailable(raw) || evNorm(raw.state) === "unavailable");
    if (!state) state = watts > 50 ? "charging" : st("plug") ? (on("plug") ? "waiting" : "idle") : rawOff ? "offline" : "idle";
    if (errOn) state = "error";
    const limit = st("limit");
    const lock = st("lock");
    const dev = device && h.devices?.[device];
    const battery = c.battery ? h.states[c.battery] : st("battery");
    return {
      device,
      none: !device || !Object.values(e).some(Boolean),
      ids: e,
      state,
      raw: raw ? h.formatEntityState?.(raw) || raw.state : "",
      name: c.title || dev?.name_by_user || dev?.name || this._t("title"),
      sub: [h.areas?.[dev?.area_id]?.name, dev?.model].filter(Boolean).join(" · "),
      watts,
      session: evKwh(st("energy")),
      total: evKwh(st("total")),
      amps: evNum(st("current")),
      phases: evNum(st("phases")),
      duration: evDuration(st("duration")),
      cost: st("cost") && evNum(st("cost")) != null ? h.formatEntityState?.(st("cost")) || `${st("cost").state} ${st("cost").attributes.unit_of_measurement || ""}` : null,
      error: errOn ? (errSt.entity_id.startsWith("binary_sensor.") ? this._t("st_error") : h.formatEntityState?.(errSt) || errSt.state) : null,
      limit: limit && !rcUnavailable(limit)
        ? { id: limit.entity_id, value: evNum(limit), min: limit.attributes.min ?? 6, max: limit.attributes.max ?? 32, step: limit.attributes.step || 1 }
        : null,
      // A lock named after the cable locks the cable (Easee); any other locks the whole charger (Wallbox).
      lock: lock && !rcUnavailable(lock)
        ? {
            id: lock.entity_id,
            locked: lock.state === "locked" || lock.state === "on",
            domain: lock.entity_id.split(".")[0],
            cable: /cable|c[aâ]ble|kabel|cavo|plug|connector|stecker/i.test(`${lock.entity_id} ${lock.attributes.friendly_name || ""}`),
          }
        : null,
      switchId: e.switch && h.states[e.switch] && !rcUnavailable(h.states[e.switch]) ? e.switch : null,
      switchOn: on("switch"),
      // A "Pause charging" switch is on while paused: pause turns it on, start turns it off.
      switchPause: !!e.switch && /pause/i.test(`${e.switch} ${h.states[e.switch]?.attributes.friendly_name || ""}`) && !/resume/i.test(`${e.switch} ${h.states[e.switch]?.attributes.friendly_name || ""}`),
      startId: e.start && h.states[e.start] ? e.start : null,
      stopId: e.stop && h.states[e.stop] ? e.stop : null,
      soc: evNum(battery),
    };
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  // Night backdrop: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the
  // day sky after sunset).
  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night") return true;
    if (theme === "day") return false;
    return this._dark();
  }

  // The pill of the illustration and of the header: the car's level when known, else the charging power.
  _power(m) {
    return m.watts != null ? `${this._fmt(m.watts / 1000, 1)} kW` : "";
  }

  _status(m) {
    const label = this._t(`st_${m.state}`);
    return m.state === "charging" && m.watts != null ? `${label} · ${this._power(m)}` : label;
  }

  // Three tiles, the ones that matter in this state, among what the charger reports.
  _tileList(m) {
    // A lifetime total reads in whole kWh (2,840 kWh), a session with one decimal.
    const kwh = (v) => (v != null ? [this._fmt(v, v >= 100 ? 0 : 1), "kWh"] : null);
    const amps = m.limit?.value != null ? [String(Math.round(m.limit.value)), m.phases > 1 ? `A · ${this._tn("phases", m.phases)}` : "A"] : null;
    const all = {
      session: ["energy", "t_session", kwh(m.session)],
      last: ["energy", "t_last", kwh(m.session)],
      time: ["time", "t_time", m.duration ? [m.duration, ""] : null],
      cost: ["cost", "t_cost", m.cost ? [m.cost, ""] : null],
      current: ["current", "t_current", m.amps != null ? [this._fmt(m.amps, 0), "A"] : null],
      limit: ["current", "t_limit", amps],
      total: ["total", "t_total", kwh(m.total)],
    };
    const order = {
      charging: ["session", "time", "cost", "current", "total"],
      done: ["session", "time", "cost", "total"],
      waiting: ["limit", "last", "total", "time"],
    }[m.state] || ["last", "total", "limit"];
    // The stepper under the tiles shows the limit already.
    const stepper = this._config.show_controls !== false && m.limit;
    return order
      .filter((k) => !(stepper && k === "limit"))
      .map((k) => all[k])
      .filter((t) => t[2])
      .slice(0, 3);
  }

  _tile([icon, label, [value, unit]]) {
    return `<div class="xt"><span class="xh">${evIcon(EV_SVG[icon])}<span class="xl">${rcEsc(this._t(label))}</span></span><span class="xv">${rcEsc(value)}${unit ? `<small>${rcEsc(unit)}</small>` : ""}</span></div>`;
  }

  // The primary action of the state: pause while charging, start when a car waits, unlock the cable when charged.
  _primary(m) {
    if (m.state === "charging" && (m.stopId || m.switchId)) return "pause";
    if (m.state === "waiting" && (m.startId || m.switchId)) return "start";
    if ((m.state === "done" || m.state === "idle") && m.lock?.locked && m.lock.cable) return "unlock";
    return null;
  }

  // The energy flowing along the cable is an SVG animation, which CSS cannot stop: off with `animations: false` and when
  // the system asks for reduced motion.
  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  // The illustrated header, as on the flight and train boards: 90 px high, the scene at the right (the wallbox on the
  // house wall, the cable and the car), a concrete strip edge to edge at the bottom; on the sky at the left the badge
  // and `text`. The badge is a car in the state's colour (full card) or the battery ring (mini).
  // The status pill: the state's colour (the badge's) as a dot and a tint, its label.
  _chip(status, raw) {
    return `<span class="chip" title="${rcEsc(raw || status)}" aria-label="${rcEsc(status)}"><span class="dot"></span><span class="ct">${rcEsc(status)}</span></span>`;
  }

  // The banner's text: the title line (the title, then the status pill), the subtitle, then a line with the car's level.
  // Where the pill goes is measured (_fitPill): beside the whole title, else on that last line (its copy there) under
  // the subtitle, else only its dot (its text stays in its title and aria-label).
  _subLine(parts) {
    const text = parts.filter(Boolean).join(" · ");
    return text ? `<div class="subt" title="${rcEsc(text)}">${rcEsc(text)}</div>` : "";
  }

  // The status pill, measured after each render and on a new width (in every language), on the banner, the classic
  // header and the classic mini card: it sits on the title's row, right after the title, only when the whole title and
  // the pill's whole label fit there; otherwise it takes the line under the subtitle (.below), the title whole on its
  // row (cut only when it does not fit alone). When the lines do not fit in the banner above the drive, or the label
  // does not fit its line, the pill shows its dot alone (.dot-only): beside the title when the whole title leaves it
  // room, else under the subtitle.
  _fitPill() {
    for (const t of this.shadowRoot?.querySelectorAll?.(".tt, .mini .body") || []) {
      const mini = t.matches(".body");
      const row = mini ? t.querySelector(".head") : t.querySelector(".trow");
      const pill = row?.querySelector(":scope > .chip, :scope > .st");
      if (!pill?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".title, .big") || row.firstElementChild;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const outer = (c) => c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginLeft) || 0) + (parseFloat(getComputedStyle(c).marginRight) || 0);
      const others = [...row.children].filter((c) => c !== name && c !== pill && c.getClientRects().length);
      const room = row.getBoundingClientRect().width - others.reduce((w, c) => w + outer(c) + gap, 0);
      const title = evTextWidth(name) + gap;
      if (title + pill.getBoundingClientRect().width <= room) continue;
      t.classList.add("below");
      const line = mini ? pill : t.querySelector(".pl > .chip");
      const banner = t.closest(".banner");
      const ground = banner?.querySelector(".ground");
      const floor = banner ? (ground ? ground.getBoundingClientRect().top : banner.getBoundingClientRect().bottom - 10) : Infinity;
      const box = t.getBoundingClientRect();
      const tx = line?.querySelector(".ct, .pt");
      const whole = !tx || (tx.scrollWidth <= tx.clientWidth + 0.5 && line.getBoundingClientRect().right <= box.right + 0.5);
      if (whole && box.bottom <= floor + 0.5 && (!banner || box.top >= banner.getBoundingClientRect().top - 0.5)) continue;
      t.classList.add("dot-only");
      if (title + (line || pill).getBoundingClientRect().width <= room) t.classList.remove("below");
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
    if (!this._fitObserver && typeof ResizeObserver === "function") this._fitObserver = new ResizeObserver(() => this._fitPill());
    this._fitObserver?.observe(this);
    document.fonts?.ready?.then(() => this._fitPill());
  }

  _titleRow(title, pill, sub, extra = "") {
    return `<div class="trow">${title}${pill}</div>${sub}<div class="bs"><span class="pl">${pill}</span>${extra}</div>`;
  }

  _banner(m, badge, text) {
    const c = this._config;
    const nav = c.navigation_path;
    const status = this._status(m);
    const scene = evScene({
      state: m.state,
      dark: this._dark(),
      night: this._night(),
      uid: (this._uid ||= `evc${(++evCards).toString(36)}`),
      backdrop: c.show_background !== false,
      label: status,
      animate: this._animate(),
      vehicle: c.vehicle,
      color: c.color,
    });
    return `
      <div class="banner${c.show_background === false ? " bare" : this._night() ? " night" : ""}">
        <button class="sc" title="${rcEsc(m.raw || status)}">${scene}</button>
        ${c.show_background === false ? "" : '<div class="ground" aria-hidden="true"></div>'}
        <div class="head bh${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge">${badge}</div>
          <div class="tt">${text}</div>
        </div>
      </div>`;
  }

  // The car's battery level as a bar and a figure, when a car is plugged in and its level known.
  _soc(m) {
    if (m.soc == null || m.state === "idle" || m.state === "offline") return "";
    const pct = Math.max(0, Math.min(100, m.soc));
    return `<div class="soc"><span class="bar"><i style="width:${pct.toFixed(0)}%"></i></span><b>${Math.round(m.soc)} %</b></div>`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._status(m);
    const tiles = this._tileList(m);
    const banner = c.show_scene !== false && !m.none;
    // Redrawn only when something shown changes: a session energy moving by a few Wh, still 12.4 kWh on screen, must
    // not rebuild the card (and restart the energy flowing along the cable).
    const parts = [m.none, m.state, m.raw, m.name, m.sub, status, m.soc != null && Math.round(m.soc), tiles, m.error, m.limit, m.lock, m.switchId, m.startId, m.stopId, this._armLock, this._dark(), this._night()];
    if (!this._changed(parts)) return;
    const icon = `<ha-icon icon="${m.none ? "mdi:ev-station" : EV_ICONS[m.state]}"></ha-icon>`;
    const head = banner
      ? this._banner(
          m,
          '<ha-icon icon="mdi:car"></ha-icon>',
          // The pill says the state, the power leads the subtitle: the pill keeps its whole label on a narrow card.
          this._titleRow(
            `<div class="title">${rcEsc(m.name)}</div>`,
            this._chip(this._t(`st_${m.state}`), m.raw || status),
            this._subLine([m.state === "charging" ? this._power(m) : "", m.sub]),
            this._soc(m),
          ),
        )
      : `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge">${icon}</div>
        <div class="tt">${
          m.none
            ? `<div class="title">${rcEsc(m.name)}</div>`
            : this._titleRow(`<div class="title">${rcEsc(m.name)}</div>`, this._chip(status, m.raw || status), this._subLine([m.sub]))
        }</div>
      </div>`;
    // No charger: say so, rather than draw one with no car.
    if (m.none) {
      this._paint("idle", `${head}<div class="none">${rcEsc(this._t("no_charger"))}</div>`, "");
      return;
    }
    const error = m.error ? `<div class="err" role="alert">${rcEsc(m.error)}</div>` : "";
    this._paint(m.state, head + error, tiles.map((t) => this._tile(t)).join(""));
    this._fitPill();
  }

  _afterGrid() {
    const m = this._items;
    if (!m || m.none || this._config.show_controls === false) return "";
    const primary = this._primary(m);
    const btn = primary
      ? `<button class="pb act-${primary}" data-k="primary">${evIcon(EV_SVG[primary])}<span>${rcEsc(this._t(primary))}</span></button>`
      : "";
    const step = m.limit
      ? `<span class="seg" role="group" aria-label="${rcEsc(this._t("t_limit"))}"><button class="act-lower" data-k="lower" aria-label="${rcEsc(this._t("lower"))}"${m.limit.value <= m.limit.min ? " disabled" : ""}>−</button><b aria-live="polite">${rcEsc(m.limit.value != null ? `${Math.round(m.limit.value)} A` : "—")}</b><button class="act-raise" data-k="raise" aria-label="${rcEsc(this._t("raise"))}"${m.limit.value >= m.limit.max ? " disabled" : ""}>+</button></span>`
      : "";
    // The lock button says what a press does (its state is aria-pressed); unlocking while charging asks for a second press.
    const action = m.lock ? `${m.lock.locked ? "unlock" : "lock"}${m.lock.cable ? "" : "_box"}` : "";
    const lock =
      m.lock && primary !== "unlock"
        ? `<button class="gb act-lock${this._armLock ? " armed" : ""}" data-k="lock" aria-pressed="${m.lock.locked}" title="${rcEsc(this._t(m.lock.locked ? "locked" : "unlocked"))}">${evIcon(EV_SVG[m.lock.locked ? "lock" : "unlock"])}<span>${rcEsc(this._t(this._armLock ? "confirm" : action))}</span></button>`
        : "";
    return btn || step || lock ? `<div class="ctl">${btn}${step}${lock}</div>` : "";
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._fitObserver?.disconnect();
    clearTimeout(this._armTimer);
    this._armLock = false;
  }

  _bindAfter(root) {
    const m = this._items;
    const h = this._hass;
    if (!m || m.none) return;
    const on = (sel, fn) => root.querySelector(sel)?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      fn();
    });
    root.querySelector(".sc")?.addEventListener("click", () => rcMoreInfo(this, m.ids.status || m.ids.power || m.ids.limit));
    const allow = (yes) => rcCall(h, "switch", yes !== m.switchPause ? "turn_on" : "turn_off", { entity_id: m.switchId });
    on(".act-pause", () => (m.stopId ? rcCall(h, "button", "press", { entity_id: m.stopId }) : allow(false)));
    on(".act-start", () => (m.startId ? rcCall(h, "button", "press", { entity_id: m.startId }) : allow(true)));
    const lockTo = (locked) =>
      m.lock.domain === "lock"
        ? rcCall(h, "lock", locked ? "lock" : "unlock", { entity_id: m.lock.id })
        : rcCall(h, "switch", locked ? "turn_on" : "turn_off", { entity_id: m.lock.id });
    on(".act-unlock", () => lockTo(false));
    on(".act-lock", () => {
      clearTimeout(this._armTimer);
      // Unlocking during a charge stops it: a first press arms, a second within 4 s unlocks.
      if (m.lock.locked && m.state === "charging" && !this._armLock) {
        this._armLock = true;
        this._armTimer = setTimeout(() => {
          this._armLock = false;
          this._render();
        }, 4000);
      } else {
        this._armLock = false;
        lockTo(!m.lock.locked);
      }
      this._render();
    });
    // Quick presses add up: each step starts from the value asked last (until the charger reports it), shown at once.
    const setLimit = (delta) => {
      const l = m.limit;
      const pending = this._limitAsked && Date.now() - this._limitAsked.at < 5000 && this._limitAsked.id === l.id ? this._limitAsked.value : null;
      const from = pending ?? l.value ?? l.min;
      const value = Math.min(l.max, Math.max(l.min, from + delta * l.step));
      if (value === from) return;
      this._limitAsked = { id: l.id, value, at: Date.now() };
      const shown = root.querySelector(".seg b");
      if (shown) shown.textContent = `${Math.round(value)} A`;
      rcCall(h, "number", "set_value", { entity_id: l.id, value });
    };
    on(".act-lower", () => setLimit(-1));
    on(".act-raise", () => setLimit(1));
  }

  static styles = `
    :host { --ev-charging: #2f80ed; }
    ha-card.lvl-charging { --c: var(--ev-charging); }
    ha-card.lvl-waiting  { --c: var(--rc-warn); }
    ha-card.lvl-done     { --c: var(--rc-ok); }
    ha-card.lvl-idle, ha-card.lvl-offline { --c: var(--rc-idle); }
    ha-card.lvl-error    { --c: var(--rc-alert); }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    /* The illustrated header: the card's top, edge to edge, in the sky's colours (as the flight and train boards). */
    .banner { --sw: min(200px, 54%); position: relative; isolation: isolate; display: flex; align-items: center; box-sizing: border-box;
              padding: 0 0 10px 12px; overflow: hidden; height: 90px; margin: -12px -12px 0; color: #0d2a45;
              background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }
    .banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }
    /* The house wall fades into the sky by itself: no mask on the scene. */
    .sc { all: unset; position: absolute; z-index: -1; right: 0; bottom: 10px; height: 80px; width: var(--sw); cursor: pointer; }
    .sc:focus-visible { outline: 2px solid var(--primary-color); outline-offset: -2px; }
    .scene { display: block; width: 100%; height: 100%; }
    /* The concrete drive in front of the house, edge to edge. */
    .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; pointer-events: none; background: #9aa1a9; box-shadow: inset 0 2px 0 #b5bbc2; }
    .banner.night .ground { background: #2c323b; box-shadow: inset 0 2px 0 #3a414c; }
    .bh { flex: 0 1 auto; min-width: 0; max-width: calc(100% - var(--sw) + 4px); padding-right: 6px; }
    .banner .badge { color: var(--c); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }
    .banner.night .badge { color: color-mix(in srgb, var(--c) 45%, #fff); background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: inherit; font-weight: 600; }
    .banner .subt { color: #3b5b78; }
    .banner.night .subt { color: rgba(255,255,255,.82); }
    /* The title line: the title, then the status pill when the whole title and the pill's whole label fit there
       (measured, see _fitPill); otherwise the pill goes under the subtitle (its copy on the level's line), the subtitle
       on one line; when that does not fit above the drive, or on a card of 200 px or less, only its dot stays. */
    .bh { flex: 1 1 auto; }
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > :first-child { flex: 0 1 auto; min-width: 0; }
    .trow > .chip { flex: none; }
    .tt.below .trow > .chip { display: none; }
    .tt.below .pl { display: flex; }
    .tt.below .bs { margin-top: 3px; }
    .pl .chip { max-width: 100%; }
    .tt.dot-only .chip { padding: 4px; } .tt.dot-only .chip .ct { display: none; }
    .bs { display: flex; align-items: center; gap: 8px; margin-top: 4px; min-width: 0; }
    .pl { display: none; flex: none; max-width: 100%; }
    /* On that line the pill keeps its label; the car's level goes to the next line when both do not fit. */
    .bs { flex-wrap: wrap; row-gap: 3px; }
    .bs:not(:has(.soc)) { margin-top: 0; }
    .chip { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; padding: 1px 8px; border-radius: 12px; font-size: 11px;
            font-weight: 500; line-height: 16px; white-space: nowrap; overflow: hidden;
            background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .chip .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c); flex: none; }
    .chip .ct { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .soc { flex: 0 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .soc b { white-space: nowrap; }
    .soc .bar { flex: 0 1 56px; min-width: 24px; height: 5px; border-radius: 3px; background: color-mix(in srgb, var(--c) 20%, transparent); overflow: hidden; }
    .soc .bar i { display: block; height: 100%; border-radius: 3px; background: var(--c); }
    .banner .zoom { color: #33506b; background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7);
                    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    /* show_background: false — the wallbox, the cable and the car on the card itself, in the theme's colours. */
    .banner.bare { color: var(--primary-text-color); background: none; }
    .banner.bare .subt { color: var(--secondary-text-color); }
    .banner.bare .badge { background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: none; }
    /* The classic header (show_scene: false): the pill in the theme's colours. */
    .head:not(.bh) .chip { background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    .banner.bare .chip { background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
    .banner.bare .zoom { color: var(--secondary-text-color); background: none; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(127,127,127,.3)); }
    :host([hide-title]) .banner .tt { visibility: visible; }
    :host([hide-title]) .banner .title, :host([hide-title]) .banner .subt { display: none; }
    @container (max-width: 320px) { .banner { --sw: 46%; } }
    /* A card of 200 px or less: only the pill's dot (where it goes is measured all the same). */
    ha-card { container: ev-card / inline-size; }
    @container ev-card (max-width: 200px) {
      .chip { padding: 4px; }
      .chip .ct { display: none; }
    }
    @keyframes ev-ring { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
    .ring { animation: ev-ring 1.8s ease-in-out infinite; }
    @keyframes ev-twinkle { from { opacity: .35 } to { opacity: 1 } }
    .scene .tw { animation: ev-twinkle 3.2s ease-in-out infinite alternate; }
    .ring.err { animation-duration: .9s; }
    .err { margin-top: 8px; padding: 8px 10px; border-radius: 10px; font-size: 13px; color: var(--rc-alert);
           background: color-mix(in srgb, var(--rc-alert) 12%, transparent); }
    .grid { margin-top: 10px; gap: 8px; }
    .xt { min-width: 0; border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 5px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .xh { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--c); }
    .xh svg { flex: none; width: 15px; height: 15px; }
    .xl { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .xv { font-size: 18px; font-weight: 500; line-height: 1.15; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .xv small { font-size: 12px; font-weight: 400; color: var(--secondary-text-color); margin-left: 2px; }
    .ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
    .pb, .gb, .seg button { all: unset; box-sizing: border-box; cursor: pointer; }
    .pb { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 16px; border-radius: 999px; font-size: 14px; font-weight: 500;
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .pb:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
    .gb { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .pb svg, .gb svg { width: 17px; height: 17px; }
    .seg { display: inline-flex; align-items: center; min-height: 44px; padding: 0 2px; border-radius: 999px; background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .seg button { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: var(--primary-text-color); }
    .seg button:hover:not([disabled]) { background: color-mix(in srgb, var(--c) 15%, transparent); }
    .seg button[disabled] { opacity: .35; cursor: default; }
    .seg b { min-width: 48px; text-align: center; font-size: 14px; font-weight: 500; }
    .pb:focus-visible, .gb:focus-visible, .seg button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .gb.armed { color: color-mix(in srgb, var(--rc-warn) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--rc-warn) 18%, transparent); }
    .none { margin-top: 10px; padding: 12px; border-radius: 12px; font-size: 13px; color: var(--secondary-text-color);
            background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    @container (max-width: 300px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      /* Three tiles on two columns: the third spans the row rather than stand alone. */
      .grid > :nth-child(3):last-child { grid-column: 1 / -1; }
    }
    @media (prefers-reduced-motion: reduce) { .ring, .scene .tw { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const evSchema = (booleans) => (lang) => [
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

const EV_HELPERS = ["title", "battery", "show_background", "zoom", "entities", "language"];

const EvChargerCardEditor = rcEditor({
  card: EvChargerCard,
  helpers: EV_HELPERS,
  schema: evSchema(["show_title", "show_scene", "show_background", "animations", "show_controls"]),
});

rcRegister(
  EvChargerCard,
  EvChargerCardEditor,
  "EV Charger Card",
  "An EV charger, illustrated: wallbox, cable and car, charging power, session, pause / start, current limit and cable lock",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The charger on two lines: a ring with the car's battery level (or the charging power) as the badge, the title and the
// state, then the key readings as pills; the zoom button opens the full card in place.
class EvChargerMiniCard extends rcMini(
  EvChargerCard,
  "ev-charger-mini-card",
  `
    .mini > .badge { background: none; }
    /* The classic mini card: the status pill after the whole title (measured, see _fitPill), else under it, else its dot. */
    .mini .body.below .head { flex-wrap: wrap; row-gap: 4px; }
    .mini .body.below .head::after { content: none; }
    .mini .body.below .head > .title { flex: 1 1 calc(100% - 32px); }
    .mini .body.below .head:not(:has(> .zoom)) > .title { flex-basis: 100%; }
    .mini .body.below .head > .st { order: 3; margin-left: 0; }
    .mini .body.dot-only .head > .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .mini .body.dot-only .head > .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .mini .body.dot-only .head > .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .ringb { width: 40px; height: 40px; }
    ha-card.mb { padding: 0; }
    .mb > .banner { height: 90px; margin: 0; }
    .banner .ringb { width: 40px; height: 40px; }
    .banner .badge:has(.ringb) { background: rgba(255,255,255,.62); }
    .banner.night .badge:has(.ringb) { background: rgba(255,255,255,.12); }
    .banner.bare .badge:has(.ringb) { background: none; }
    .big { font-size: 22px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .big.word { font-size: 18px; }
    .r { --t: var(--c); }
    .r.dim { --t: var(--rc-idle); }
  `,
) {
  getCardSize() {
    if (this._zoomed) return super.getCardSize();
    return this._config.show_scene === false ? 1 : 2;
  }

  // The battery ring of the badge: the car's level when known, else the charging power against `max_power` (kW).
  _ring(m) {
    const max = (Number(this._config.max_power) || 7.4) * 1000;
    const pct = m.soc != null ? m.soc : m.watts != null ? Math.min(100, (100 * m.watts) / max) : 0;
    const L = 2 * Math.PI * 17;
    return `<svg class="ringb" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="color-mix(in srgb, var(--c) 18%, transparent)" stroke-width="4"/><circle cx="20" cy="20" r="17" fill="none" stroke="var(--c)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${((L * pct) / 100).toFixed(1)} 999" transform="rotate(-90 20 20)"/><path d="M21 12l-5 9h4l-1 7 6-10h-4z" fill="var(--c)"/></svg>`;
  }

  // The illustrated mini card: the ring, the car's level (or the charging power) in large with the state as a chip,
  // then the name and the key readings; the scene at the right.
  _drawBanner(m) {
    const c = this._config;
    const car = m.state !== "idle" && m.state !== "offline";
    const kwh = m.session != null ? `${this._fmt(m.session, 1)} kWh` : null;
    const big = car && m.soc != null ? `${Math.round(m.soc)} %` : m.state === "charging" ? this._power(m) : "";
    const state = m.state === "error" ? m.error || this._t("st_error") : this._t(`st_${m.state}`);
    const readings = {
      charging: [big === this._power(m) ? kwh : this._power(m), m.duration],
      waiting: [m.limit?.value != null ? `${Math.round(m.limit.value)} A` : null],
      done: [kwh, m.duration],
    }[m.state] || [m.session != null ? `${this._t("t_last")} ${kwh}` : null];
    // The car's level (or the power) in large as the title, else the charger's name; the state as the pill after it.
    const named = !big && c.show_title !== false;
    const line = [c.show_title === false || named ? null : m.name, ...readings].filter(Boolean).join(" · ");
    const lead = this._titleRow(
      big ? `<b class="big">${rcEsc(big)}</b>` : `<b class="big word">${rcEsc(named ? m.name : state)}</b>`,
      this._chip(state, m.raw),
      line ? `<div class="subt" title="${rcEsc(line)}">${rcEsc(line)}</div>` : "",
    );
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.state} mb">${this._banner(m, this._ring(m), lead)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    root.querySelector(".sc")?.addEventListener("click", () => rcMoreInfo(this, m.ids.status || m.ids.power || m.ids.limit));
    this._fitPill();
  }

  _drawMini(m) {
    if (this._config.show_scene !== false) {
      const sig = ["banner", m.state, m.raw, m.watts && Math.round(m.watts / 100), m.session, m.duration, m.soc, m.error, m.limit?.value, m.name, this._dark(), this._night()];
      if (this._changed(sig)) this._drawBanner(m);
      return;
    }
    if (!this._changed(["mini", m.state, m.watts && Math.round(m.watts / 100), m.session, m.duration, m.soc, m.error, m.limit?.value, m.name])) return;
    const id = m.ids.status || m.ids.power || "";
    const chip = (text, dim) => `<button class="r pill${dim ? " dim" : ""}" data-id="${rcEsc(id)}" title="${rcEsc(text)}"><span>${rcEsc(text)}</span></button>`;
    const kwh = m.session != null ? `${this._fmt(m.session, 1)} kWh` : null;
    // The state is the status pill after the title; the chips are the readings.
    const status = m.state === "error" ? m.error || this._t("st_error") : this._t(`st_${m.state}`);
    const chips = {
      charging: [this._power(m), m.soc != null ? `${Math.round(m.soc)} %` : kwh, m.duration],
      waiting: [m.soc != null ? `${Math.round(m.soc)} %` : null, m.limit?.value != null ? `${Math.round(m.limit.value)} A` : null],
      done: [kwh, m.duration],
      error: [],
    }[m.state] || [m.session != null ? `${this._t("t_last")} ${kwh}` : null];
    const html = chips
      .filter(Boolean)
      .map((t, i) => chip(t, i > 0))
      .join("");
    this._paintMini({ level: m.state, icon: EV_ICONS[m.state], status, chips: html });
    // The charger's name (or the title), as on the full card.
    const title = this.shadowRoot.querySelector(".mini .title");
    if (title) title.textContent = m.name;
    // The badge is the battery ring.
    const badge = this.shadowRoot.querySelector(".mini > .badge");
    if (badge) badge.innerHTML = this._ring(m);
  }
}

const EvChargerMiniCardEditor = rcEditor({
  card: EvChargerMiniCard,
  helpers: [...EV_HELPERS, "max_power"],
  schema: (lang) => [
    ...evSchema(["show_title", "show_scene", "show_background", "animations", "show_controls", "zoom"])(lang).slice(0, -1),
    { name: "max_power", selector: { number: { min: 1, max: 50, step: 0.1, mode: "box", unit_of_measurement: "kW" } } },
    ...rcAdvanced(EV_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  EvChargerMiniCard,
  EvChargerMiniCardEditor,
  "EV Charger Mini Card",
  "The charger on two lines: a battery ring, the state and the key readings, with a zoom to the full card",
);
