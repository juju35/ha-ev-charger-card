/**
 * ev-charger-card / ev-charger-mini-card: an EV charger, illustrated. The wallbox, its cable and the car, with energy flowing
 * while it charges; the session in three tiles; pause / start, the current limit and the cable lock.
 * https://github.com/juju35/ha-ev-charger-card
 */

// Colour of each state: on the badge, the pill, the LED ring, the cable and the battery bar.
export const EV_ACCENTS = { charging: "#2f80ed", waiting: "#e8a33d", done: "#2e9d5a", idle: "#9aa3ae", error: "#e5484d", offline: "#9aa3ae" };
export const EV_ICONS = {
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
export const EV_VEHICLES = {
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
export const EV_CABLE = "M78 133 C78 180, 150 186, 184 162 S 207 128 213 121";
export const EV_CABLE_HANGING = "M78 133 C78 172, 118 174, 120 150 C121 138, 112 132, 104 132";

export const evN = (n) => +n.toFixed(1);
// The paints of `color`; none: white in a light theme, graphite in a dark one.
export const EV_COLORS = { white: "#f3f5f8", silver: "#c9ced5", grey: "#6b727c", black: "#2a2d32", blue: "#2f5d9e", red: "#b3262e", green: "#3f6b55" };
export const evMix = (a, b, t) =>
  `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("")}`;
export const evPaint = (color, dark) => {
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
export const evArch = (cx, cy, r, sill) => {
  const dx = Math.sqrt(r * r - (sill - cy) ** 2);
  return `L${evN(cx + dx)} ${sill} A${r} ${r} 0 1 0 ${evN(cx - dx)} ${sill}`;
};
// A wheel: the tyre and its sidewall, the brake disc behind the spokes, then either five twin spokes and the rim's
// polished lip, or (`aero`) a flat cover with five openings; the centre cap.
export const evWheel = (cx, cy, r, k, dark, aero) => {
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
export const evCar = (v, { uid, dark, acc, color }) => {
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
export const EV_STARS = [[96, 8], [130, 14], [170, 6], [186, 22], [150, 4]];
export const evWall = (uid, night) => {
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
export const evScene = ({ state, dark, night, backdrop = true, uid, label, animate, vehicle, color }) => {
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

export const evIcon = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const EV_SVG = {
  energy: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M21 10v4M9 9l-2 3h4l-2 3"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cost: '<path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  current: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  total: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  start: '<path d="M7 4l12 8-12 8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  power: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
};
