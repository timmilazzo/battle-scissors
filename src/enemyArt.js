// Procedural plush ragdoll enemies, after the level mock: a felt egg of a body with stubby arms and mitten hands,
// short legs, sewn-on patches with stitched borders, cross-stitched seams, glowing red button eyes and a stitched
// mouth. Soft volume shading and a felt speckle; a soft brown rim keeps them readable on the tan road.
// Each type is drawn once per resize into a small offscreen canvas, plus a ground shadow and a dust-puff sprite
// drawn under it while it walks. Live overlays on top: the Brute's thimble armor and the Seam Ripper's glowing seam.
import { CONFIG as C } from './config.js';
import { view, TAU, DEG } from './core.js';

const THREAD = '#3a2414', LIGHT_THREAD = '#fff3d6', OUTLINE = '#2b1a10';
const sprites = {}, grounds = {}, dusts = {};

// ---------- colour + shape helpers (only used while building sprites) ----------
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function mix(a, b, t) { const A = rgb(a), B = rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }
const shade = (c, t) => mix(c, '#2b1608', t), tint = (c, t) => mix(c, '#fffaf0', t);

// Smooth closed blob through points at radius r * f[i] (patches, the boss's quilting clip).
function blob(r, f, rot) {
  const n = f.length, xs = [], ys = [], p = new Path2D();
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; xs.push(Math.cos(a) * r * f[i]); ys.push(Math.sin(a) * r * f[i]); }
  const mx = i => (xs[i] + xs[(i + 1) % n]) / 2, my = i => (ys[i] + ys[(i + 1) % n]) / 2;
  p.moveTo(mx(n - 1), my(n - 1));
  for (let i = 0; i < n; i++) p.quadraticCurveTo(xs[i], ys[i], mx(i), my(i));
  p.closePath();
  return p;
}
// The body: an egg, top at -1.05r, bottom at 0.92r, widest (0.9r x wide) a little below the middle.
function egg(r, wide) {
  const p = new Path2D(), w = r * 0.9 * wide, top = -r * 1.05, bot = r * 0.92, my = r * 0.12;
  p.moveTo(0, top);
  p.bezierCurveTo(w * 0.62, top, w, my - r * 0.62, w, my);
  p.bezierCurveTo(w, bot - r * 0.2, w * 0.55, bot, 0, bot);
  p.bezierCurveTo(-w * 0.55, bot, -w, bot - r * 0.2, -w, my);
  p.bezierCurveTo(-w, my - r * 0.62, -w * 0.62, top, 0, top);
  p.closePath();
  return p;
}
// Deterministic pseudo-random (sprites must look the same every rebuild).
function lcg(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// Volume: a light from the upper left, shade toward the lower right, then a fine felt speckle. Clipped to `path`.
function plush(g, path, r, color, seed) {
  g.save(); g.clip(path);
  let gr = g.createRadialGradient(-r * 0.4, -r * 0.55, 0, -r * 0.4, -r * 0.55, r * 1.1);
  gr.addColorStop(0, 'rgba(255,250,235,0.45)'); gr.addColorStop(1, 'rgba(255,250,235,0)');
  g.fillStyle = gr; g.fillRect(-2 * r, -2 * r, 4 * r, 4 * r);
  gr = g.createRadialGradient(-r * 0.2, -r * 0.3, r * 0.5, -r * 0.2, -r * 0.3, r * 1.6);
  gr.addColorStop(0, 'rgba(60,30,10,0)'); gr.addColorStop(1, 'rgba(60,30,10,0.42)');
  g.fillStyle = gr; g.fillRect(-2 * r, -2 * r, 4 * r, 4 * r);
  const rand = lcg(seed), dot = Math.max(0.5, r * 0.025);
  for (let i = 0; i < r * 9; i++) {
    g.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.16)' : shade(color, 0.35).replace('rgb', 'rgba').replace(')', ',0.18)');
    g.fillRect((rand() * 2 - 1) * r * 1.3, (rand() * 2 - 1) * r * 1.3, dot, dot);
  }
  g.restore();
}
// A seam: a thread line with short crossing ticks (a stitched scar) through the points [x, y] (in units of r).
function seam(g, r, pts, color = THREAD) {
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = Math.max(0.8, r * 0.045);
  g.beginPath(); g.moveTo(pts[0][0] * r, pts[0][1] * r);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * r, pts[i][1] * r);
  const step = r * 0.14, tick = r * 0.09;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0] * r, ay = pts[i - 1][1] * r, bx = pts[i][0] * r, by = pts[i][1] * r;
    const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let d = step / 2; d < len; d += step) {
      const x = ax + (bx - ax) * d / len, y = ay + (by - ay) * d / len;
      g.moveTo(x - nx * tick, y - ny * tick); g.lineTo(x + nx * tick, y + ny * tick);
    }
  }
  g.stroke();
}
// Sewn-on patch: a lumpy square in `color`, shaded, with a dark stitched border.
function patch(g, r, x, y, w, rot, color, seed) {
  g.save(); g.translate(x * r, y * r); g.rotate(rot);
  const rand = lcg(seed), p = blob(w * r, [1.1, 0.85 + rand() * 0.2, 1.15, 0.8 + rand() * 0.2, 1.1, 0.9, 1.12, 0.85], 0.4);
  g.fillStyle = color; g.fill(p);
  const gr = g.createLinearGradient(0, -w * r, 0, w * r);
  gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = gr; g.fill(p);
  g.setLineDash([Math.max(1, r * 0.07), Math.max(1, r * 0.05)]); g.lineCap = 'butt';
  g.strokeStyle = THREAD; g.lineWidth = Math.max(0.9, r * 0.05); g.stroke(p);
  g.setLineDash([]);
  g.restore();
}
// Glowing button eye: dark rim, lit iris in `color`, dark centre, a glint.
function buttonEye(g, x, y, er, color, glow) {
  if (glow) {
    const gr = g.createRadialGradient(x, y, er * 0.5, x, y, er * 2);
    gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(255,40,30,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, er * 2, 0, TAU); g.fill();
  }
  g.fillStyle = '#2a0e0a'; g.beginPath(); g.arc(x, y, er * 1.14, 0, TAU); g.fill();
  const gr = g.createRadialGradient(x - er * 0.3, y - er * 0.35, er * 0.1, x, y, er);
  gr.addColorStop(0, tint(color, 0.35)); gr.addColorStop(1, color);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, er, 0, TAU); g.fill();
  g.fillStyle = '#2a0e0a'; g.beginPath(); g.arc(x, y, er * 0.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x - er * 0.38, y - er * 0.42, er * 0.2, 0, TAU); g.fill();
}
// Stubby arm hanging at one side (side = -1 left, 1 right): felt sleeve, mitten hand, a stitched cuff.
function arm(g, r, side, color, thick) {
  const sx = side * 0.7 * r, sy = -0.06 * r, hx = side * 0.95 * r, hy = 0.5 * r, w = thick * r;
  const sleeve = new Path2D();
  sleeve.moveTo(sx, sy); sleeve.lineTo(hx, hy);
  g.lineCap = 'round';
  g.strokeStyle = shade(color, 0.55); g.lineWidth = w + Math.max(1.5, r * 0.07); g.stroke(sleeve);
  g.strokeStyle = color; g.lineWidth = w; g.stroke(sleeve);
  g.strokeStyle = 'rgba(255,250,235,0.25)'; g.lineWidth = w * 0.35;
  g.beginPath(); g.moveTo(sx - side * w * 0.15, sy - w * 0.1); g.lineTo(hx - side * w * 0.2, hy - w * 0.2); g.stroke();
  const hand = shade(color, 0.5), hr = w * 0.62;
  g.fillStyle = shade(color, 0.7); g.beginPath(); g.arc(hx + side * r * 0.02, hy + r * 0.1, hr + Math.max(0.8, r * 0.035), 0, TAU); g.fill();
  g.fillStyle = hand; g.beginPath(); g.arc(hx + side * r * 0.02, hy + r * 0.1, hr, 0, TAU); g.fill();
  // cuff: a row of ticks across the wrist
  const dx = hx - sx, dy = hy - sy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, cx = hx - ux * w * 0.55, cy = hy - uy * w * 0.55;
  g.strokeStyle = THREAD; g.lineWidth = Math.max(0.8, r * 0.04); g.beginPath();
  g.moveTo(cx - uy * w * 0.5, cy + ux * w * 0.5); g.lineTo(cx + uy * w * 0.5, cy - ux * w * 0.5);
  for (let k = -1; k <= 1; k++) { const px = cx - uy * w * 0.3 * k, py = cy + ux * w * 0.3 * k; g.moveTo(px - ux * r * 0.06, py - uy * r * 0.06); g.lineTo(px + ux * r * 0.06, py + uy * r * 0.06); }
  g.stroke();
}
function legs(g, r, color) {
  for (const s of [-1, 1]) {
    const x = s * 0.34 * r, w = 0.34 * r;
    g.fillStyle = shade(color, 0.6); g.beginPath(); g.ellipse(x, r * 0.98, w * 0.62, r * 0.2, 0, 0, TAU); g.fill();
    g.fillStyle = shade(color, 0.28); g.beginPath(); g.ellipse(x, r * 0.94, w * 0.52, r * 0.16, 0, 0, TAU); g.fill();
  }
}
// Stitched mouth: a thread line (optionally a zigzag grin) with little ticks.
function mouth(g, r, y, w, zig, color = THREAD) {
  g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(0.9, r * 0.045);
  g.beginPath();
  if (zig) { g.moveTo(-w * r, y * r); for (let i = 1; i <= 6; i++) g.lineTo((-w + i * w / 3) * r, (y + (i & 1 ? -0.06 : 0.06)) * r); }
  else {
    g.moveTo(-w * r, (y - 0.02) * r); g.quadraticCurveTo(0, (y + 0.05) * r, w * r, (y - 0.02) * r);
    for (let k = -1; k <= 1; k++) { g.moveTo(k * w * 0.6 * r, (y - 0.05) * r); g.lineTo(k * w * 0.6 * r, (y + 0.07) * r); }
  }
  g.stroke();
}
function brows(g, r, y, color = OUTLINE) {
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = r * 0.085; g.beginPath();
  g.moveTo(-r * 0.52, (y - 0.12) * r); g.lineTo(-r * 0.1, y * r); g.moveTo(r * 0.52, (y - 0.12) * r); g.lineTo(r * 0.1, y * r);
  g.stroke();
}
// Soft outline so the cream bodies read on the tan road.
function rim(g, path, r, color) { g.lineJoin = 'round'; g.strokeStyle = shade(color, 0.62); g.lineWidth = Math.max(1.2, r * 0.07); g.stroke(path); }

// ---------- the four designs (drawn centred on 0,0; r = hit radius) ----------
const ART = {
  // Scrap: the mock's cream ragdoll. Head seam, a scar across the body, blue and red patches, glowing red eyes.
  scrap: { extent: 1.45, draw(g, r, t) {
    const body = egg(r, 1);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    plush(g, body, r, t.color, 11);
    g.save(); g.clip(body);
    patch(g, r, 0.5, 0.36, 0.2, 0.3, t.patch, 3);
    patch(g, r, -0.46, 0.18, 0.17, -0.2, t.patch2, 7);
    g.restore();
    seam(g, r, [[0.02, -1.02], [0.04, -0.66]]);
    seam(g, r, [[-0.62, -0.02], [-0.1, 0.4], [0.3, 0.84]]);
    rim(g, body, r, t.color);
    buttonEye(g, -0.26 * r, -0.42 * r, 0.19 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    buttonEye(g, 0.27 * r, -0.44 * r, 0.19 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    mouth(g, r, -0.14, 0.16, false);
    arm(g, r, -1, t.color, 0.36); arm(g, r, 1, t.color, 0.36);
    patch(g, r, 0.86, 0.2, 0.11, 0.5, t.patch, 9);
  } },

  // Bolster: a stout mustard cushion-doll with a sewn button belly and a purple shoulder patch.
  bolster: { extent: 1.45, draw(g, r, t) {
    const body = egg(r, 1.14);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    plush(g, body, r, t.color, 23);
    g.save(); g.clip(body);
    patch(g, r, -0.52, -0.1, 0.22, -0.15, t.patch2, 5);
    patch(g, r, 0.55, 0.5, 0.18, 0.4, t.patch, 13);
    g.strokeStyle = 'rgba(74,47,26,0.45)'; g.lineWidth = Math.max(1, r * 0.04); g.beginPath();   // gathered tufts
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.moveTo(0, r * 0.36); g.quadraticCurveTo(dx * r * 0.2, r * 0.36 + dy * r * 0.06, dx * r * 0.36, r * 0.36 + dy * r * 0.22); }
    g.stroke();
    g.restore();
    seam(g, r, [[0.1, -1.02], [0.12, -0.62]]);
    rim(g, body, r, t.color);
    const bx = 0, by = 0.36 * r, br = 0.15 * r;                 // belly button: two holes, cross-stitched on
    g.fillStyle = t.patch; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1, r * 0.04); g.stroke();
    g.fillStyle = OUTLINE; g.beginPath(); g.arc(bx - br * 0.35, by, br * 0.17, 0, TAU); g.arc(bx + br * 0.35, by, br * 0.17, 0, TAU); g.fill();
    buttonEye(g, -0.3 * r, -0.4 * r, 0.17 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    buttonEye(g, 0.3 * r, -0.4 * r, 0.17 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    mouth(g, r, -0.12, 0.2, false);
    arm(g, r, -1, t.color, 0.4); arm(g, r, 1, t.color, 0.4);
  } },

  // Burlap Brute: a lumpy burlap sack golem with a woven texture, patches, a centre seam and a stitched grimace.
  brute: { extent: 1.45, draw(g, r, t) {
    const body = egg(r, 1.1);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    g.save(); g.clip(body);
    g.strokeStyle = 'rgba(80,50,20,0.22)'; g.lineWidth = Math.max(0.8, r * 0.025); g.beginPath();
    for (let v = -1.2 * r; v <= 1.2 * r; v += r * 0.1) { g.moveTo(-1.2 * r, v); g.lineTo(1.2 * r, v); g.moveTo(v, -1.2 * r); g.lineTo(v, 1.2 * r); }
    g.stroke();
    g.restore();
    plush(g, body, r, t.color, 37);
    g.save(); g.clip(body);
    patch(g, r, -0.46, 0.3, 0.24, -0.18, t.patch, 17);
    patch(g, r, 0.5, 0.52, 0.19, 0.3, t.patch2, 19);
    g.restore();
    seam(g, r, [[0.05, -1.0], [0.0, -0.3], [-0.03, 0.9]]);
    rim(g, body, r, t.color);
    brows(g, r, -0.36);
    buttonEye(g, -0.3 * r, -0.24 * r, 0.16 * r, '#e0252b', 'rgba(255,40,30,0.45)');
    buttonEye(g, 0.3 * r, -0.26 * r, 0.16 * r, '#e0252b', 'rgba(255,40,30,0.45)');
    mouth(g, r, 0.06, 0.3, true);
    arm(g, r, -1, t.color, 0.46); arm(g, r, 1, t.color, 0.46);
  } },

  // Runner: a small, lean green ragdoll leaning forward, a yellow sweatband and a streak patch: fast, fragile.
  runner: { extent: 1.5, draw(g, r, t) {
    const body = egg(r, 0.86);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    plush(g, body, r, t.color, 41);
    g.save(); g.clip(body);
    g.fillStyle = t.patch; g.fillRect(-r * 1.2, -r * 0.78, r * 2.4, r * 0.24);        // sweatband
    g.strokeStyle = THREAD; g.lineWidth = Math.max(1, r * 0.05); g.setLineDash([r * 0.12, r * 0.1]);
    g.beginPath(); g.moveTo(-r * 1.2, -r * 0.66); g.lineTo(r * 1.2, -r * 0.66); g.stroke(); g.setLineDash([]);
    patch(g, r, -0.4, 0.42, 0.2, -0.5, t.patch2, 43);
    g.restore();
    g.strokeStyle = shade(t.color, 0.55); g.lineWidth = Math.max(1, r * 0.08); g.lineCap = 'round';   // speed streaks
    g.beginPath(); for (const y of [0.1, 0.35]) { g.moveTo(r * 0.25, r * y); g.lineTo(r * 0.75, r * (y - 0.08)); } g.stroke();
    rim(g, body, r, t.color);
    buttonEye(g, -0.26 * r, -0.36 * r, 0.18 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    buttonEye(g, 0.26 * r, -0.38 * r, 0.18 * r, '#e0252b', 'rgba(255,40,30,0.4)');
    mouth(g, r, -0.06, 0.14, false);
    arm(g, r, -1, t.color, 0.3); arm(g, r, 1, t.color, 0.3);
  } },

  // Button Beetle: a big round red button shell (four thread holes, a stitched split down the back) on six stubby
  // legs, with a felt head and glowing eyes peeking out in front. Round and heavy: it doesn't burn and has no weak spot.
  beetle: { extent: 1.4, draw(g, r, t) {
    g.strokeStyle = shade(t.color, 0.7); g.lineCap = 'round'; g.lineWidth = Math.max(1.5, r * 0.11);
    g.beginPath();
    for (const s of [-1, 1]) for (const y of [-0.35, 0.1, 0.55]) { g.moveTo(s * r * 0.7, y * r); g.lineTo(s * r * 1.08, (y + 0.22) * r); }
    g.stroke();
    const head = new Path2D(); head.ellipse(0, -r * 0.86, r * 0.42, r * 0.3, 0, 0, TAU);
    g.fillStyle = t.patch2; g.fill(head); plush(g, head, r * 0.4, t.patch2, 71);
    buttonEye(g, -0.17 * r, -0.92 * r, 0.12 * r, '#ffd23f', 'rgba(255,200,40,0.45)');
    buttonEye(g, 0.17 * r, -0.92 * r, 0.12 * r, '#ffd23f', 'rgba(255,200,40,0.45)');
    const shell = new Path2D(); shell.arc(0, r * 0.05, r * 0.86, 0, TAU);
    g.fillStyle = t.color; g.fill(shell);
    plush(g, shell, r, t.color, 73);
    g.strokeStyle = 'rgba(255,240,220,0.35)'; g.lineWidth = Math.max(1, r * 0.06);   // the button's raised rim
    g.beginPath(); g.arc(0, r * 0.05, r * 0.68, 0, TAU); g.stroke();
    g.strokeStyle = shade(t.color, 0.45); g.lineWidth = Math.max(1, r * 0.04);
    g.beginPath(); g.arc(0, r * 0.05, r * 0.64, 0, TAU); g.stroke();
    seam(g, r, [[0, -0.8], [0, -0.3]], shade(t.color, 0.7));                          // the split down its back
    seam(g, r, [[0, 0.4], [0, 0.9]], shade(t.color, 0.7));
    for (const [x, y] of [[-0.24, -0.14], [0.24, -0.14], [-0.24, 0.3], [0.24, 0.3]]) {   // four thread holes, cross-stitched
      g.fillStyle = shade(t.color, 0.75); g.beginPath(); g.arc(x * r, y * r, r * 0.1, 0, TAU); g.fill();
    }
    g.strokeStyle = t.patch; g.lineWidth = Math.max(1, r * 0.06);
    g.beginPath(); g.moveTo(-0.24 * r, -0.14 * r); g.lineTo(0.24 * r, 0.3 * r); g.moveTo(0.24 * r, -0.14 * r); g.lineTo(-0.24 * r, 0.3 * r); g.stroke();
    rim(g, shell, r, t.color);
  } },

  // The Brute King: the Burlap Brute, bigger, with a gold felt crown stitched on above its (drawn live) thimble armor.
  bruteKing: { extent: 1.75, draw(g, r, t) {
    ART.brute.draw(g, r, t);
    const crown = new Path2D(), y0 = -r * 1.12, y1 = -r * 1.62;
    crown.moveTo(-r * 0.55, y0); crown.lineTo(-r * 0.62, y1 + r * 0.1); crown.lineTo(-r * 0.3, y0 - r * 0.22);
    crown.lineTo(0, y1); crown.lineTo(r * 0.3, y0 - r * 0.22); crown.lineTo(r * 0.62, y1 + r * 0.1); crown.lineTo(r * 0.55, y0); crown.closePath();
    g.fillStyle = '#f2c230'; g.fill(crown);
    g.lineJoin = 'round'; g.strokeStyle = OUTLINE; g.lineWidth = Math.max(2, r * 0.05); g.stroke(crown);
    g.setLineDash([r * 0.06, r * 0.05]); g.strokeStyle = '#fff1b8'; g.lineWidth = Math.max(1, r * 0.025);
    g.beginPath(); g.moveTo(-r * 0.5, y0 - r * 0.07); g.lineTo(r * 0.5, y0 - r * 0.07); g.stroke(); g.setLineDash([]);
    for (const [x, y, c] of [[-0.62, 0.1, '#e0312b'], [0, 0, '#3d7dff'], [0.62, 0.1, '#e0312b']]) {
      g.fillStyle = c; g.beginPath(); g.arc(x * r, y1 + y * r, r * 0.08, 0, TAU); g.fill();
      g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1, r * 0.025); g.stroke();
    }
  } },

  // The Unstitcher: a midnight patchwork doll coming apart: loose threads trailing off it, X-stitched eyes, ice-blue patches.
  unstitcher: { extent: 1.7, draw(g, r, t) {
    g.lineCap = 'round'; g.strokeStyle = t.patch; g.lineWidth = Math.max(1.5, r * 0.035);   // loose threads
    g.beginPath();
    for (const [a, l] of [[-2.4, 1.55], [-1.9, 1.6], [-0.9, 1.5], [-0.3, 1.6], [0.6, 1.5], [2.6, 1.45]]) {
      const c = Math.cos(a), s = Math.sin(a);
      g.moveTo(c * r * 0.9, s * r * 0.9); g.quadraticCurveTo(c * r * 1.3 - s * r * 0.2, s * r * 1.3 + c * r * 0.2, c * r * l, s * r * l);
    }
    g.stroke();
    const body = egg(r, 1.06);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    plush(g, body, r, t.color, 61);
    g.save(); g.clip(body);
    patch(g, r, -0.5, 0.4, 0.24, 0.3, t.patch, 63);
    patch(g, r, 0.5, 0.1, 0.2, -0.4, t.patch2, 67);
    patch(g, r, 0.1, 0.72, 0.18, 0.1, '#6a3596', 71);
    g.restore();
    seam(g, r, [[-0.9, -0.2], [-0.2, 0.05], [0.3, 0.5], [0.8, 0.6]], LIGHT_THREAD);
    seam(g, r, [[0.0, -1.02], [0.1, -0.6]], LIGHT_THREAD);
    rim(g, body, r, t.color);
    brows(g, r, -0.42, '#8fe8ff');
    for (const sx of [-1, 1]) {                                        // X-stitched eyes, glowing
      const x = sx * 0.32 * r, y = -0.24 * r, h = 0.14 * r;
      g.strokeStyle = 'rgba(143,232,255,0.45)'; g.lineWidth = r * 0.16;
      g.beginPath(); g.moveTo(x - h, y - h); g.lineTo(x + h, y + h); g.moveTo(x + h, y - h); g.lineTo(x - h, y + h); g.stroke();
      g.strokeStyle = '#e6fbff'; g.lineWidth = r * 0.06; g.stroke();
    }
    mouth(g, r, 0.2, 0.34, true, LIGHT_THREAD);
    arm(g, r, -1, t.color, 0.42); arm(g, r, 1, t.color, 0.42);
  } },

  // The Seam Ripper: a plum quilted ragdoll with a seam-ripper horn, angry yellow button eyes and a cream-stitched grin.
  seamRipper: { extent: 1.7, draw(g, r, t) {
    // horn: metal shaft, long hooked prong, short prong with the red safety ball
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = OUTLINE; g.lineWidth = r * 0.2;
    g.beginPath(); g.moveTo(r * 0.02, -r * 0.8); g.lineTo(r * 0.1, -r * 1.3); g.stroke();
    g.strokeStyle = '#c9d1d8'; g.lineWidth = r * 0.11; g.stroke();
    const prong = new Path2D();
    prong.moveTo(r * 0.04, -r * 1.25); prong.quadraticCurveTo(r * 0.12, -r * 1.55, r * 0.34, -r * 1.63);
    prong.quadraticCurveTo(r * 0.2, -r * 1.41, r * 0.18, -r * 1.25); prong.closePath();
    g.fillStyle = '#e3e8ec'; g.fill(prong); g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.5, r * 0.04); g.stroke(prong);
    g.strokeStyle = OUTLINE; g.lineWidth = r * 0.09; g.beginPath(); g.moveTo(r * 0.08, -r * 1.29); g.lineTo(-r * 0.1, -r * 1.47); g.stroke();
    g.strokeStyle = '#c9d1d8'; g.lineWidth = r * 0.05; g.stroke();
    g.fillStyle = '#e0312b'; g.beginPath(); g.arc(-r * 0.12, -r * 1.5, r * 0.11, 0, TAU); g.fill();
    g.strokeStyle = OUTLINE; g.lineWidth = Math.max(1.5, r * 0.035); g.stroke();
    // quilted body
    const body = egg(r, 1.08);
    legs(g, r, t.color);
    g.fillStyle = t.color; g.fill(body);
    g.save(); g.clip(body);
    g.setLineDash([r * 0.07, r * 0.06]); g.strokeStyle = 'rgba(255,230,255,0.3)'; g.lineWidth = Math.max(1, r * 0.03); g.beginPath();
    for (let v = -2 * r; v <= 2 * r; v += r * 0.34) { g.moveTo(v - r, -r); g.lineTo(v + r, r); g.moveTo(v + r, -r); g.lineTo(v - r, r); }
    g.stroke(); g.setLineDash([]);
    g.restore();
    plush(g, body, r, t.color, 53);
    g.save(); g.clip(body);
    patch(g, r, -0.5, 0.48, 0.2, 0.2, t.patch, 29);
    patch(g, r, 0.56, 0.2, 0.14, -0.3, t.patch2, 31);
    g.restore();
    seam(g, r, [[-0.05, -1.02], [0.0, -0.64]], LIGHT_THREAD);
    rim(g, body, r, t.color);
    brows(g, r, -0.3);
    buttonEye(g, -0.32 * r, -0.12 * r, 0.16 * r, '#ffd23f', 'rgba(255,210,63,0.35)');
    buttonEye(g, 0.32 * r, -0.12 * r, 0.16 * r, '#ffd23f', 'rgba(255,210,63,0.35)');
    mouth(g, r, 0.26, 0.36, true, LIGHT_THREAD);
    arm(g, r, -1, t.color, 0.42); arm(g, r, 1, t.color, 0.42);
  } },
};

function canvasFor(store, name, half, dpr) {
  const c = (store[name] && store[name].canvas) || document.createElement('canvas');
  c.width = c.height = Math.ceil(half * 2 * dpr);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
  g.clearRect(-half, -half, half * 2, half * 2);
  store[name] = { canvas: c, half };
  return g;
}

// Rebuild every type's sprites at the current devicePixelRatio (called from resize).
export function buildEnemySprites(dpr) {
  for (const name in C.enemyTypes) {
    const t = C.enemyTypes[name], art = ART[name];
    if (!art) { console.warn('no art for enemy type', name); continue; }
    const r = t.r * view.Z;                                    // enemies shrink on a bigger map (e.r matches)
    art.draw(canvasFor(sprites, name, Math.ceil(r * art.extent) + 4, dpr), r, t);
    // contact shadow under the feet
    let g = canvasFor(grounds, name, Math.ceil(r * 1.3) + 2, dpr);
    let gr = g.createRadialGradient(0, r * 0.98, 0, 0, r * 0.98, r);
    gr.addColorStop(0, 'rgba(50,28,10,0.42)'); gr.addColorStop(1, 'rgba(50,28,10,0)');
    g.fillStyle = gr; g.save(); g.translate(0, r * 0.98); g.scale(1, 0.3); g.translate(0, -r * 0.98);
    g.beginPath(); g.arc(0, r * 0.98, r, 0, TAU); g.fill(); g.restore();
    // dust puffs kicked up behind the feet
    g = canvasFor(dusts, name, Math.ceil(r * 1.4) + 2, dpr);
    for (const [x, y, s] of [[-0.62, 0.98, 0.3], [-0.26, 1.1, 0.34], [0.2, 1.08, 0.32], [0.6, 0.98, 0.26], [0.0, 0.9, 0.24]]) {
      gr = g.createRadialGradient(x * r, y * r, 0, x * r, y * r, s * r);
      gr.addColorStop(0, 'rgba(252,246,236,0.85)'); gr.addColorStop(0.6, 'rgba(240,228,212,0.5)'); gr.addColorStop(1, 'rgba(240,228,212,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x * r, y * r, s * r, 0, TAU); g.fill();
    }
  }
}

function blit(ctx, s, x, y, rot) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot);
  ctx.drawImage(s.canvas, -s.half, -s.half, s.half * 2, s.half * 2);
  ctx.restore();
}
export function drawEnemySprite(ctx, name, x, y, rot) { const s = sprites[name]; if (s) blit(ctx, s, x, y, rot); }
// Shadow, plus dust puffs (dust = 0..1 opacity, 0 for enemies standing still).
export function drawEnemyGround(ctx, name, x, y, dust) {
  const s = grounds[name]; if (s) ctx.drawImage(s.canvas, x - s.half, y - s.half, s.half * 2, s.half * 2);
  const d = dusts[name];
  if (d && dust > 0.01) { ctx.globalAlpha = dust; ctx.drawImage(d.canvas, x - d.half, y - d.half, d.half * 2, d.half * 2); ctx.globalAlpha = 1; }
}

// Steel thimble cap over the Brute's head while its armor is intact.
export function drawBruteArmor(ctx, e, rot) {
  const r = e.r;
  ctx.save(); ctx.translate(e.x, e.y); if (rot) ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-r * 0.84, -r * 0.42); ctx.quadraticCurveTo(-r * 0.88, -r * 1.16, 0, -r * 1.18);
  ctx.quadraticCurveTo(r * 0.88, -r * 1.16, r * 0.84, -r * 0.42); ctx.closePath();
  ctx.fillStyle = '#a9b3bc'; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = Math.max(2, r * 0.08); ctx.stroke();
  ctx.fillStyle = '#6f7a84'; ctx.beginPath();
  for (let row = 0; row < 2; row++) {
    const y = -r * (0.62 + row * 0.2), span = row ? 0.44 : 0.6;
    for (let x = -span; x <= span + 0.001; x += 0.2) { ctx.moveTo(x * r + r * 0.04, y); ctx.arc(x * r, y, r * 0.04, 0, TAU); }
  }
  ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.52, -r * 0.92); ctx.quadraticCurveTo(0, -r * 1.08, r * 0.46, -r * 0.94);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}

// A seam boss's weak spot on its rim, centred on e.seamA: split open and blazing while e.seamOpen (snip now), a dim
// shimmer just before (e.seamWarn), otherwise a faint closed stitch line so the player knows where it will open.
export function drawSeam(ctx, e, clock) {
  const half = C.seamArcDeg * DEG, a = e.seamA, r = e.r;
  const k = e.seamOpen ? 1.25 : e.seamWarn ? 0.45 : 0.14, pulse = k * (0.75 + 0.25 * Math.sin(clock * (e.seamOpen ? 18 : 9)));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  if (e.seamOpen) {                                               // a flash ring the moment it's open
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffe27a';
    ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, r * 0.55, 0, TAU); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.98, a - half, a + half);
  ctx.globalAlpha = Math.min(1, 0.4 * pulse); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = r * (e.seamOpen ? 0.5 : 0.34); ctx.stroke();
  ctx.globalAlpha = Math.min(1, pulse); ctx.strokeStyle = '#fff1b8'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.stroke();
  ctx.beginPath();
  for (let k = -2; k <= 2; k++) {
    const b = a + k / 2.5 * half, c = Math.cos(b), s = Math.sin(b);
    ctx.moveTo(e.x + c * r * 0.84, e.y + s * r * 0.84); ctx.lineTo(e.x + c * r * 1.13, e.y + s * r * 1.13);
  }
  ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = Math.max(1.5, r * 0.035); ctx.stroke();
  ctx.restore();
}

// Armor down (Brute King after a charge, the Unstitcher's phase 2): its seams glow hot: hit it now.
// Wind-up before a charge (f = 0..1 through it): a red ring on the ground tightening onto the boss; the charge comes as
// it closes.
export function drawChargeWarn(ctx, e, f, clock) {
  const pulse = 0.6 + 0.4 * Math.sin(clock * 18);
  ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1.9 - 0.75 * f), 0, TAU);
  ctx.globalAlpha = (0.35 + 0.55 * f) * pulse; ctx.strokeStyle = '#ff4a3d'; ctx.lineWidth = Math.max(3, e.r * 0.1); ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawArmorSeams(ctx, e, clock) {
  const r = e.r, pulse = 0.7 + 0.3 * Math.sin(clock * 20);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.05, -r * 1.0); ctx.lineTo(0, -r * 0.3); ctx.lineTo(-r * 0.03, r * 0.9);
  ctx.moveTo(-r * 0.85, -r * 0.1); ctx.quadraticCurveTo(-r * 0.3, r * 0.2, r * 0.1, r * 0.1);
  ctx.moveTo(r * 0.85, r * 0.2); ctx.quadraticCurveTo(r * 0.4, r * 0.45, r * 0.05, r * 0.5);
  ctx.globalAlpha = 0.45 * pulse; ctx.strokeStyle = '#ff9a3d'; ctx.lineWidth = r * 0.22; ctx.stroke();
  ctx.globalAlpha = pulse; ctx.strokeStyle = '#fff1b8'; ctx.lineWidth = Math.max(2, r * 0.06); ctx.stroke();
  ctx.restore();
}
