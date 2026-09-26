// Procedural Pin (tower) art, after the level mock: a two-tier felt cushion with a stitched rim and yellow
// cross-stitches, sewing pins with coloured heads stuck around it, a post holding the Pin's charm (Ice: a blue
// crystal, Fire: an ember crystal, Magnet: a horseshoe magnet) and, for Ice and Fire, a little felt flag.
// One sprite per type, built on resize at the spot's size; the charm's glow is drawn live on top. Called only by render.js.
import { CONFIG as C } from './config.js';
import { view, TAU } from './core.js';

const sprites = {};
const K = 0.64;                                           // ellipse squash: the pads are seen from above at an angle
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function mix(a, b, t) { const A = rgb(a), B = rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }
const shade = (c, t) => mix(c, '#1a0c04', t), tint = (c, t) => mix(c, '#fffaf0', t);

// Size unit (px) of the art on a spot: about the pad's radius.
export const towerUnit = () => C.level.spotR * view.L * 0.9;

// A felt cylinder: side band from y0 down to y0 + h, lit top ellipse, dashed stitched ring.
function drum(g, rx, y0, h, felt) {
  const ry = rx * K;
  g.beginPath(); g.ellipse(0, y0 + h, rx, ry, 0, 0, Math.PI); g.lineTo(-rx, y0); g.ellipse(0, y0, rx, ry, 0, Math.PI, 0, true); g.closePath();
  g.fillStyle = shade(felt, 0.38); g.fill();
  g.strokeStyle = shade(felt, 0.65); g.lineWidth = Math.max(1, rx * 0.04); g.stroke();
  const gr = g.createLinearGradient(-rx, y0 - ry, rx * 0.6, y0 + ry);
  gr.addColorStop(0, tint(felt, 0.25)); gr.addColorStop(1, shade(felt, 0.1));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, y0, rx, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = shade(felt, 0.5); g.stroke();
  g.setLineDash([rx * 0.1, rx * 0.07]); g.strokeStyle = '#f3e2b3'; g.lineWidth = Math.max(1, rx * 0.035);
  g.beginPath(); g.ellipse(0, y0, rx * 0.84, ry * 0.84, 0, 0, TAU); g.stroke();
  g.setLineDash([]);
}
// Sewing pin: grey needle, glossy head.
function pin(g, x, y, u, head) {
  g.strokeStyle = '#c9d1d8'; g.lineWidth = Math.max(1, u * 0.045); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - u * 0.4); g.stroke();
  const hr = u * 0.1, gr = g.createRadialGradient(x - hr * 0.35, y - u * 0.4 - hr * 0.35, hr * 0.1, x, y - u * 0.4, hr);
  gr.addColorStop(0, tint(head, 0.6)); gr.addColorStop(1, head);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y - u * 0.4, hr, 0, TAU); g.fill();
  g.strokeStyle = shade(head, 0.6); g.lineWidth = Math.max(0.8, u * 0.02); g.stroke();
}
function cross(g, x, y, s, w) {
  g.strokeStyle = '#ffd23f'; g.lineWidth = w; g.lineCap = 'round'; g.beginPath();
  g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
}
// Faceted crystal on the post: light top, deep bottom, white facet lines.
function crystal(g, u, top, mid, deep) {
  const P = [[0, -1.5], [-0.27, -1.16], [-0.21, -0.74], [0, -0.62], [0.21, -0.74], [0.27, -1.16]];
  g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x * u, y * u) : g.moveTo(x * u, y * u))); g.closePath();
  const gr = g.createLinearGradient(-0.2 * u, -1.5 * u, 0.2 * u, -0.62 * u);
  gr.addColorStop(0, top); gr.addColorStop(0.5, mid); gr.addColorStop(1, deep);
  g.fillStyle = gr; g.fill();
  g.strokeStyle = shade(deep, 0.5); g.lineWidth = Math.max(1, u * 0.035); g.lineJoin = 'round'; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = Math.max(0.8, u * 0.022); g.beginPath();
  g.moveTo(0, -1.5 * u); g.lineTo(-0.08 * u, -1.1 * u); g.lineTo(0, -0.62 * u);
  g.moveTo(-0.27 * u, -1.16 * u); g.lineTo(-0.08 * u, -1.1 * u); g.lineTo(0.27 * u, -1.16 * u);
  g.moveTo(-0.08 * u, -1.1 * u); g.lineTo(-0.21 * u, -0.74 * u);
  g.stroke();
}
function magnet(g, u) {
  const R = 0.25 * u, cy = -0.92 * u, top = cy - 0.42 * u;
  const U = () => { g.beginPath(); g.moveTo(-R, top); g.lineTo(-R, cy); g.arc(0, cy, R, Math.PI, 0, true); g.lineTo(R, top); };
  g.lineCap = 'butt'; g.lineJoin = 'round';
  U(); g.strokeStyle = '#2a1040'; g.lineWidth = 0.24 * u; g.stroke();
  U(); g.strokeStyle = '#9a4fe0'; g.lineWidth = 0.17 * u; g.stroke();
  U(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.05 * u; g.stroke();
  g.fillStyle = '#e3e8ec'; g.strokeStyle = '#2a1040'; g.lineWidth = Math.max(1, u * 0.03);
  for (const s of [-1, 1]) { g.beginPath(); g.rect(s * R - 0.1 * u, top - 0.14 * u, 0.2 * u, 0.16 * u); g.fill(); g.stroke(); }
}
// Felt flag on a pole at the back right, with a snowflake or a flame on it.
function flag(g, u, felt, icon) {
  const px = 0.66 * u;
  g.strokeStyle = '#6b4a2e'; g.lineWidth = Math.max(1.5, u * 0.06); g.lineCap = 'round';
  g.beginPath(); g.moveTo(px, -0.22 * u); g.lineTo(px, -1.42 * u); g.stroke();
  g.fillStyle = '#c9d1d8'; g.beginPath(); g.arc(px, -1.44 * u, u * 0.06, 0, TAU); g.fill();
  const f = new Path2D(), x0 = px, x1 = px + 0.62 * u, y0 = -1.38 * u, y1 = -0.96 * u;
  f.moveTo(x0, y0); f.quadraticCurveTo((x0 + x1) / 2, y0 - 0.06 * u, x1, y0 + 0.02 * u);
  f.lineTo(x1, y1 + 0.02 * u); f.quadraticCurveTo((x0 + x1) / 2, y1 - 0.06 * u, x0, y1); f.closePath();
  g.fillStyle = felt; g.fill(f);
  g.strokeStyle = shade(felt, 0.55); g.lineWidth = Math.max(1, u * 0.03); g.stroke(f);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - 0.02 * u, s = 0.15 * u;
  if (icon === 'snow') {
    g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, u * 0.035); g.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI / 3, dx = Math.cos(a) * s, dy = Math.sin(a) * s;
      g.moveTo(cx - dx, cy - dy); g.lineTo(cx + dx, cy + dy);
      for (const e of [-1, 1]) {                                 // a little V of barbs near each tip, pointing out
        const bx = cx + e * dx * 0.6, by = cy + e * dy * 0.6, out = a + (e < 0 ? Math.PI : 0), b = s * 0.3;
        for (const t of [-0.8, 0.8]) { g.moveTo(bx, by); g.lineTo(bx + Math.cos(out + t) * b, by + Math.sin(out + t) * b); }
      }
    }
    g.stroke();
  } else {
    const fl = new Path2D();
    fl.moveTo(cx, cy - s * 1.2); fl.quadraticCurveTo(cx + s * 1.1, cy, cx + s * 0.4, cy + s);
    fl.quadraticCurveTo(cx, cy + s * 1.15, cx - s * 0.5, cy + s); fl.quadraticCurveTo(cx - s * 1.0, cy + s * 0.1, cx - s * 0.2, cy - s * 0.4);
    fl.quadraticCurveTo(cx, cy - s * 0.2, cx, cy - s * 1.2); fl.closePath();
    g.fillStyle = '#ffd23f'; g.fill(fl);
    g.fillStyle = '#ff7a1f'; g.save(); g.translate(cx, cy + s * 0.45); g.scale(0.5, 0.5); g.translate(-cx, -cy); g.fill(fl); g.restore();
  }
  g.setLineDash([u * 0.05, u * 0.04]); g.strokeStyle = 'rgba(255,241,194,0.8)'; g.lineWidth = Math.max(0.8, u * 0.018);
  g.strokeRect(x0 + 0.05 * u, y0 + 0.04 * u, x1 - x0 - 0.1 * u, y1 - y0 - 0.06 * u); g.setLineDash([]);
}

const BACK = [200, 245, 295, 340], FRONT = [25, 155];     // pin angles (deg) on the base rim: behind / in front of the drum
function drawArt(g, u, type) {
  const def = C.towers[type], felt = def.felt;
  // contact shadow
  g.fillStyle = 'rgba(20,40,8,0.35)'; g.beginPath(); g.ellipse(u * 0.06, u * 0.2, u * 1.08, u * 1.08 * K, 0, 0, TAU); g.fill();
  drum(g, u, 0, u * 0.16, felt);                               // base cushion
  const pinAt = a => [Math.cos(a * Math.PI / 180) * u * 0.8, Math.sin(a * Math.PI / 180) * u * 0.8 * K];
  for (const a of BACK) { const [x, y] = pinAt(a); pin(g, x, y, u, def.head); }
  if (type !== 'magnet') flag(g, u, felt, type === 'ice' ? 'snow' : 'flame');
  drum(g, u * 0.56, -u * 0.3, u * 0.3, felt);                 // upper drum
  for (const a of [35, 70, 110, 145]) {                        // yellow cross-stitches on its front
    const r = a * Math.PI / 180;
    cross(g, Math.cos(r) * u * 0.56, -u * 0.15 + Math.sin(r) * u * 0.56 * K, u * 0.06, Math.max(1, u * 0.035));
  }
  // post
  g.fillStyle = shade(felt, 0.25); g.strokeStyle = shade(felt, 0.65); g.lineWidth = Math.max(1, u * 0.03);
  g.beginPath(); g.rect(-u * 0.09, -u * 0.72, u * 0.18, u * 0.44); g.fill(); g.stroke();
  g.fillStyle = tint(felt, 0.2); g.beginPath(); g.ellipse(0, -u * 0.72, u * 0.13, u * 0.13 * K, 0, 0, TAU); g.fill(); g.stroke();
  if (type === 'ice') crystal(g, u, '#f2feff', '#7fdcff', '#2f63c9');
  else if (type === 'fire') crystal(g, u, '#fff6b0', '#ffa04a', '#c8352b');
  else magnet(g, u);
  for (const a of FRONT) { const [x, y] = pinAt(a); pin(g, x, y, u, def.head); }
}

// Rebuild every type's sprite for the current spot size and devicePixelRatio (called from resize).
export function buildTowerSprites(dpr) {
  const u = towerUnit(), left = 1.2 * u, top = 1.62 * u, w = 2.6 * u, h = 2.6 * u;   // art spans x -1.02..1.35u, y -1.52..0.9u
  for (const type in C.towers) {
    const c = (sprites[type] && sprites[type].canvas) || document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * dpr)); c.height = Math.max(1, Math.ceil(h * dpr));
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, left * dpr, top * dpr);
    g.clearRect(-left, -top, w, h);
    drawArt(g, u, type);
    // the charm's glow: a soft disc in the Pin's colour, drawn additively each frame
    const glow = (sprites[type] && sprites[type].glow) || document.createElement('canvas'), gr = u * 0.75;
    glow.width = glow.height = Math.max(1, Math.ceil(gr * 2 * dpr));
    const gg = glow.getContext('2d'), rad = gg.createRadialGradient(glow.width / 2, glow.height / 2, 0, glow.width / 2, glow.height / 2, glow.width / 2);
    rad.addColorStop(0, C.towers[type].color); rad.addColorStop(1, 'rgba(0,0,0,0)');
    gg.fillStyle = rad; gg.fillRect(0, 0, glow.width, glow.height);
    sprites[type] = { canvas: c, left, top, w, h, glow, gr };
  }
}

// The Pin standing on its spot (x, y = the spot's centre), with its charm glowing (Fire flickers, the others breathe).
export function drawTower(ctx, type, x, y, clock) {
  const s = sprites[type]; if (!s) return;
  ctx.drawImage(s.canvas, x - s.left, y - s.top, s.w, s.h);
  const cy = y - (type === 'magnet' ? 1.05 : 1.08) * towerUnit();
  const flick = type === 'fire' ? 0.75 + 0.25 * Math.sin(clock * 13 + x) * Math.sin(clock * 7.3) : 0.8 + 0.2 * Math.sin(clock * 3 + x);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * flick;
  ctx.drawImage(s.glow, x - s.gr, cy - s.gr, s.gr * 2, s.gr * 2);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
