// All canvas drawing. draw(state) paints one frame from game state (plus the input pose and the current weapon) and
// never changes it. sizeCanvas() / prerender() handle resize: canvas size, the static backdrop (the painted level
// plate), enemy and Pin sprites and weapon art. Art modules it calls: enemyArt.js (enemies), towerArt.js (Pins) and
// weaponArt.js (weapon layers).
// Purely visual animation (blade trails, thread pickups, placement rings) runs on this module's
// own tween group, advanced by the render clock; it never feeds back into the game.
import { CONFIG as C } from './config.js';
import { view, level, TAU, DEG } from './core.js';
import { input, holdTouch } from './input.js';
import { cut, weapon } from './scissors.js';
import { live, visOpen, bladeTheta, towerReach, levelWaves, bossMode } from './game.js';
import { buildEnemySprites, drawEnemySprite, drawEnemyGround, drawBruteArmor, drawSeam, drawArmorSeams, drawChargeWarn } from './enemyArt.js';
import { buildTowerSprites, drawTower, drawNeedle, towerUnit } from './towerArt.js';
import { drawWeapon, rasterizeArt, setHandleTint } from './weaponArt.js';
import { cosmeticColor } from './meta.js';
import { plateFor } from './levelArt.js';
import { makeTweens, easing } from './tween.js';

const ctx = view.ctx;
const vfx = makeTweens();                                        // render-only tweens
let lastClock = -1;

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const UI_FONT = '"Lilita One", "Arial Rounded MT Bold", "Trebuchet MS", ' + FONT;   // the felt lettering (index.html --ui-font)
const LABEL_FONT = '400 32px ' + UI_FONT;
const NUM_FONT = '700 14px ' + FONT;
const POP_FONT = '400 20px ' + UI_FONT;
const PROMPT_FONT = '500 15px ' + FONT;
const HUD_FONT = '400 17px ' + UI_FONT;
const BANNER_FONT = '400 48px ' + UI_FONT;
const BANNER_SUB_FONT = '400 19px ' + UI_FONT;

const PART_COLORS = ['#ffffff', '#8ff7ff', '', '#ffd23f', '#ff8a3d'];   // particle c: 0 white, 1 cyan, 3 gold, 4 ember (2 = alternating 0/1)
// big floating words, indexed by label kind (LABEL_SNIP / LABEL_NICK / LABEL_CLANG in game.js)
const LABEL_TEXT = ['SNIP!', 'nick', 'CLANG!'], LABEL_SCALE = [1, 0.6, 0.8];
const LABEL_FILL = ['#ffffff', '#ffffff', '#e3e9ee'], LABEL_STROKE = ['rgba(0,70,100,0.8)', 'rgba(0,70,100,0.8)', '#39424a'];
// damage number colour by strike grade: gold = strong (near pivot / seam), white = mid, grey-blue = graze (near tips),
// orange = a Fire Pin burn tick (g = -1), silver = a Needle Pin hit (g = -2)
const numColor = g => g <= -2 ? '#dfe9f2' : g < 0 ? '#ff9a4a' : g < 0.35 ? '#ffe27a' : g < 0.7 ? '#ffffff' : '#9fc7d6';

// ======================= resize =======================
// 1) sizeCanvas() sets view.W/H/dpr and the canvas; 2) game.layout() rebuilds weapon scale + path; 3) prerender().
export function sizeCanvas() {
  const cv = view.cv;
  view.dpr = Math.min(window.devicePixelRatio || 1, C.maxDpr);
  view.W = window.innerWidth; view.H = window.innerHeight;
  cv.width = Math.round(view.W * view.dpr); cv.height = Math.round(view.H * view.dpr);
  cv.style.width = view.W + 'px'; cv.style.height = view.H + 'px';
}
export function prerender() {
  renderBackground();
  buildEnemySprites(view.dpr);
  buildTowerSprites(view.dpr);
  setHandleTint(cosmeticColor('handle'));                         // handle cosmetic (Shop): baked into the weapon art
  rasterizeArt();
  buildHand(view.dpr);
}

// Static backdrop, pre-rendered on resize: the level plate (road, Pin spots and the heart-pad workshop are part of the
// art: a painted image, or for a generated level the plate levelArt.js paints), full height and centred. Wider screens get the plate blurred and darkened as side bars; narrower
// ones crop its sides. Until the plate loads, a plain felt green.
const bgCanvas = document.createElement('canvas');
const plate = new Image();
plate.onload = () => { if (view.W > 0) renderBackground(); };
function renderBackground() {
  const lv = level(), gen = lv.gen ? plateFor(lv, () => { if (view.W > 0) renderBackground(); }) : null;
  if (!lv.gen && plate.getAttribute('src') !== lv.bg) plate.src = lv.bg;   // a level switch: onload redraws once it arrives
  const img = lv.gen ? gen : plate;
  const W = view.W, H = view.H, dpr = view.dpr, L = view.L, LX = view.LX, pw = lv.w * L, ph = lv.h * L;
  bgCanvas.width = Math.max(1, Math.round(W * dpr)); bgCanvas.height = Math.max(1, Math.round(H * dpr));
  const g = bgCanvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#2f5a1c'; g.fillRect(0, 0, W, H);
  if (lv.gen ? !gen : !plate.complete || !plate.naturalWidth || plate.getAttribute('src') !== lv.bg) return;
  if (LX > 0) {                                                  // side bars: the plate stretched to cover, blurred
    const cover = Math.max(W / lv.w, H / lv.h), cw = lv.w * cover, ch = lv.h * cover;
    g.save();
    if ('filter' in g) g.filter = 'blur(16px) brightness(0.55)';
    g.drawImage(img, (W - cw) / 2, (H - ch) / 2, cw, ch);
    g.restore();
    if (!('filter' in g)) { g.fillStyle = 'rgba(10,6,2,0.5)'; g.fillRect(0, 0, W, H); }
    const sh = g.createLinearGradient(LX - 24, 0, LX, 0);       // a soft shadow where the plate meets the bars
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = sh; g.fillRect(LX - 24, 0, 24, H);
    g.save(); g.translate(W, 0); g.scale(-1, 1); g.fillRect(LX - 24, 0, 24, H); g.restore();
  }
  g.drawImage(img, LX, 0, pw, ph);
}

// ======================= world =======================

function drawWorkshopHit(state) {
  if (state.workshopHitT <= 0) return;
  const p = state.paths[0], x = p.x[p.n - 1], y = p.y[p.n - 1];              // every route ends on the heart pad
  ctx.globalAlpha = state.workshopHitT * 0.55; ctx.fillStyle = '#ff3b3b';
  ctx.beginPath(); ctx.arc(x, y, level().workshopR * view.L * (0.8 + (1 - state.workshopHitT) * 0.3), 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
}

// The snip's pie slice, bright near the pivot where hits are strongest. The gradient is rebuilt only for a new zone.
let cutGrad = null, cutGradVer = -1;
function drawCutZone(cutT) {
  if (cutT <= 0) return;
  if (cutGradVer !== cut.ver) {
    cutGrad = ctx.createRadialGradient(cut.px, cut.py, 0, cut.px, cut.py, cut.L);
    cutGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    cutGrad.addColorStop(1, 'rgba(120,220,255,0.06)');
    cutGradVer = cut.ver;
  }
  ctx.beginPath();
  if (cut.slide) ctx.arc(cut.px, cut.py, cut.L, 0, TAU);          // slide weapon: the hole
  else { ctx.moveTo(cut.px, cut.py); ctx.arc(cut.px, cut.py, cut.L, cut.theta - cut.a - Math.PI / 2, cut.theta + cut.a - Math.PI / 2); ctx.closePath(); }
  ctx.globalAlpha = cutT; ctx.fillStyle = cutGrad; ctx.fill();
  ctx.globalAlpha = cutT * 0.6; ctx.lineWidth = 1.5; ctx.strokeStyle = '#e8feff'; ctx.stroke();
  ctx.globalAlpha = 1;
}

// Hit flash: any enemy whose hp dropped since the last frame shows solid white for 2 frames.
let lastHp = null, wasOn = null, flashFrames = null;
function drawEnemies(state) {
  const wad = C.waddleDeg * DEG, enemies = state.enemies;
  if (!lastHp || lastHp.length !== enemies.length) {
    lastHp = new Float32Array(enemies.length); wasOn = new Uint8Array(enemies.length); flashFrames = new Uint8Array(enemies.length);
  }
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.on && wasOn[i] && e.hp < lastHp[i] - 1e-6) flashFrames[i] = 2;
    lastHp[i] = e.hp; wasOn[i] = e.on ? 1 : 0;
    if (!e.on) { flashFrames[i] = 0; continue; }
    const t = e.type, step = Math.sin(e.age * 7 + e.phase), rot = t.boss ? 0 : step * wad;
    drawEnemyGround(ctx, e.name, e.x, e.y, e.pinned && !e.walking ? 0 : 0.55 + 0.35 * Math.abs(step));
    const shake = e.windup ? C.bossTremblePx * Math.sin(state.clock * 70) : 0;   // winding up for a charge: it trembles
    if (shake) ctx.translate(shake, 0);
    drawEnemySprite(ctx, e.name, e.x, e.y, rot);
    if (e.armored) drawBruteArmor(ctx, e, rot);
    if (shake) ctx.translate(-shake, 0);
    if (t.boss) {                                               // its rules, shown: the opening seam, or glowing seams while armor is down
      const m = bossMode(e);
      if (e.windup) { const d = C.bosses[e.name]; drawChargeWarn(ctx, e, (e.chargeT - d.chargeEverySec + d.windupSec) / d.windupSec, state.clock); }
      if (m === 'seam') drawSeam(ctx, e, state.clock);
      else if (m === 'armor' && !e.armored && !e.charging) drawArmorSeams(ctx, e, state.clock);
      else if (m === 'swarm') {                                // a shimmering thread shield: only a crowded snip gets through
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 1.18, 0, TAU);
        ctx.setLineDash(DASH); ctx.lineDashOffset = -state.clock * 30; ctx.globalAlpha = 0.7; ctx.strokeStyle = '#8fe8ff'; ctx.lineWidth = 3; ctx.stroke();
        ctx.setLineDash(NO_DASH); ctx.lineDashOffset = 0; ctx.globalAlpha = 1;
      }
    }
    if (flashFrames[i] > 0) {
      flashFrames[i]--;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 1.02, 0, TAU);
      ctx.globalAlpha = 0.95; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha = 1;
    } else if (e.hitT > 0) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.95, 0, TAU);
      ctx.globalAlpha = e.hitT * 0.6; ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha = 1;
    }
    if (e.slowed) {                                            // frosted rim while slowed (Ice Pin / Helicopter)
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3, 0, TAU);
      ctx.globalAlpha = 0.7; ctx.strokeStyle = '#bff4ff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (e.burning) drawFlames(e, state.clock);                 // on fire (Fire Pin)
    if (!t.boss && e.maxHp >= 3) {                             // Bolster and Brute; the boss gets the big bar in the HUD
      const bw = e.r * 1.6, bx = e.x - bw / 2, by = e.y - e.r * 1.2 - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
      ctx.fillStyle = '#7dffb0'; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
    }
  }
}

// Flames on a burning enemy: an orange glow over its body plus three flickering flame tongues rising from it.
// One flame sprite (a teardrop, white-yellow core to red tip), built once, stretched and swayed per tongue.
const flameCv = document.createElement('canvas');
(function buildFlame() {
  flameCv.width = 64; flameCv.height = 128;
  const g = flameCv.getContext('2d'), p = new Path2D();
  p.moveTo(32, 2); p.bezierCurveTo(46, 40, 62, 70, 58, 96); p.bezierCurveTo(54, 118, 42, 126, 32, 126);
  p.bezierCurveTo(22, 126, 10, 118, 6, 96); p.bezierCurveTo(2, 70, 18, 40, 32, 2); p.closePath();
  const gr = g.createLinearGradient(0, 126, 0, 2);
  gr.addColorStop(0, '#fff6c8'); gr.addColorStop(0.3, '#ffd23f'); gr.addColorStop(0.65, '#ff7a1f'); gr.addColorStop(1, 'rgba(210,40,20,0.2)');
  g.fillStyle = gr; g.fill(p);
})();
const FLAME_X = [-0.45, 0.05, 0.5], FLAME_H = [0.85, 1.25, 0.95];
function drawFlames(e, clock) {
  const r = Math.max(e.r, 20);                                  // small enemies still get readable flames
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.28 + 0.1 * Math.sin(clock * 17 + e.phase);
  ctx.fillStyle = '#ff6a1f'; ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.05, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  for (let k = 0; k < 3; k++) {
    const f = clock * 13 + e.phase * 3 + k * 2.1, h = r * FLAME_H[k] * (0.8 + 0.25 * Math.sin(f)), w = r * 0.5 * (0.9 + 0.12 * Math.sin(f * 1.7));
    const bx = e.x + r * FLAME_X[k], by = e.y - r * 0.2;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(0.12 * Math.sin(f * 0.8));
    ctx.globalAlpha = 0.9;
    ctx.drawImage(flameCv, -w / 2, -h, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ======================= critters (src/critters.js) =======================
// Silverfish: a flat, tapering, segmented silver-grey body with a glossy spine, twitching antennae, three long tail
// bristles and three pairs of short legs that scurry fast (faster still mid-skitter). Drawn along its heading.
function drawCritters(state) {
  for (const c of state.critters) if (c.on) drawSilverfish(c.x, c.y, c.ang, c.age, c.skT > 0);
}
const SF_SEGS = 9;
const sfWave = (t, i) => Math.sin(t * 20 - i * 0.8) * 1.4;           // the body's crawling wriggle, head (0) to tail
function drawSilverfish(x, y, ang, t, fast) {
  const L = C.critters.silverfish.len, seg = L / SF_SEGS, maxW = L * 0.13, legRate = fast ? 75 : 45;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);                  // local +x = forward
  ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(-L * 0.05, 3, L * 0.5, maxW * 1.3, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineCap = 'round';
  // tail bristles: three long feelers off the tail tip, flicking
  const tx = -L / 2, ty = sfWave(t, SF_SEGS);
  ctx.strokeStyle = '#7b838a'; ctx.lineWidth = 1.1;
  for (let k = -1; k <= 1; k++) {
    const a = Math.PI + k * 0.4 + Math.sin(t * 9 + k * 1.7) * 0.07, bl = L * (k === 0 ? 0.45 : 0.52);
    ctx.beginPath(); ctx.moveTo(tx + 3, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * bl * 0.5, ty + Math.sin(a) * bl * 0.5 - k * 2, tx + Math.cos(a) * bl, ty + Math.sin(a) * bl);
    ctx.stroke();
  }
  // legs: three pairs under the front half, each a knee-bent stroke, alternating sides in a fast scurry
  ctx.strokeStyle = '#646c73'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const bx = L * 0.28 - i * seg * 1.15, by = sfWave(t, i + 1);
    for (let sd = -1; sd <= 1; sd += 2) {
      const sw = Math.sin(t * legRate + i * 2.1 + (sd > 0 ? Math.PI : 0)) * 0.5;
      const a = sd * (Math.PI / 2 + 0.25 + i * 0.3) + sw, kx = bx + Math.cos(a) * maxW * 1.5, ky = by + Math.sin(a) * maxW * 1.5;
      ctx.beginPath(); ctx.moveTo(bx, by + sd * maxW * 0.5); ctx.lineTo(kx, ky);
      ctx.lineTo(kx - maxW * 0.9, ky + sd * maxW * 0.6); ctx.stroke();
    }
  }
  // body: overlapping scaly segments, tail first so the head sits on top
  ctx.lineWidth = 1;
  for (let i = SF_SEGS - 1; i >= 1; i--) {
    const sx = L / 2 - i * seg - seg * 0.2, sy = sfWave(t, i), w = maxW * (i <= 2 ? 1 : 1 - (i - 2) / (SF_SEGS - 1) * 0.85);
    ctx.fillStyle = i & 1 ? '#a3abb2' : '#8f979f'; ctx.strokeStyle = '#555c63';
    ctx.beginPath(); ctx.ellipse(sx, sy, seg * 0.8, w, 0, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // glossy spine and a few dark speckles: wet, a bit gross
  ctx.strokeStyle = 'rgba(236,243,248,0.6)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 1; i < SF_SEGS - 1; i++) { const sx = L / 2 - i * seg, sy = sfWave(t, i) - maxW * 0.3; if (i === 1) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(52,48,40,0.55)';
  for (let i = 2; i < SF_SEGS - 1; i += 2) { ctx.beginPath(); ctx.arc(L / 2 - i * seg, sfWave(t, i) + maxW * 0.35, 1.1, 0, TAU); ctx.fill(); }
  // head, eyes, antennae (twitching)
  const hx = L / 2 - seg * 0.3, hy = sfWave(t, 0);
  ctx.fillStyle = '#868e95'; ctx.strokeStyle = '#555c63';
  ctx.beginPath(); ctx.ellipse(hx, hy, seg * 0.7, maxW * 0.75, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath(); ctx.arc(hx + seg * 0.25, hy - maxW * 0.4, 1.1, 0, TAU); ctx.arc(hx + seg * 0.25, hy + maxW * 0.4, 1.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7b838a'; ctx.lineWidth = 1;
  for (let sd = -1; sd <= 1; sd += 2) {
    const a = sd * (0.32 + 0.1 * Math.sin(t * 31 + sd)), al = L * 0.55;
    ctx.beginPath(); ctx.moveTo(hx + seg * 0.5, hy + sd * 1.5);
    ctx.quadraticCurveTo(hx + al * 0.5, hy + sd * al * 0.1, hx + Math.cos(a) * al, hy + Math.sin(a) * al);
    ctx.stroke();
  }
  ctx.restore();
}
// A squish: a grey-yellow wet smear with droplets, crushed silver scales and a snapped bristle, fading over splatSec.
function drawSplats(state) {
  for (const s of state.splats) {
    if (!s.on) continue;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.globalAlpha = 0.9 * (1 - s.t) * (1 - s.t * 0.3);
    ctx.fillStyle = '#a19f7e';
    ctx.beginPath(); ctx.ellipse(0, 0, 15 + 6 * s.k0, 9 + 4 * s.k1, 0, 0, TAU); ctx.fill();
    for (let j = 0; j < 6; j++) {
      const a = j * 1.05 + s.k2 * 3, d = 15 + ((j * 37 + s.k3 * 50) % 11), r = 1.6 + ((j * 13 + s.k0 * 20) % 3);
      ctx.beginPath(); ctx.arc(Math.cos(a) * d * 1.2, Math.sin(a) * d * 0.8, r, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#6c6a4f';
    ctx.beginPath(); ctx.ellipse(2, 1, 8 + 3 * s.k2, 5, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d3dadf';
    for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(-8 + j * 5 + s.k3 * 3, (j & 1 ? 4 : -3) * (0.5 + s.k1), 2.4, 1.3, j + s.k0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#7b838a'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(-24 - 6 * s.k1, 6 + 4 * s.k2); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawFragments(state) {
  const frags = state.frags;
  for (let i = 0; i < frags.length; i++) {
    const f = frags[i]; if (!f.on) continue;
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.globalAlpha = f.life;
    ctx.beginPath();
    ctx.moveTo(f.sz, 0); ctx.lineTo(-f.sz * 0.6, f.sz * 0.7); ctx.lineTo(-f.sz * 0.5, -f.sz * 0.6); ctx.closePath();
    ctx.fillStyle = f.color; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    ctx.restore();
  }
}

function drawEffects(state) {
  const { parts, labels, nums, pops, fx } = state;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]; if (!p.on) continue;
    ctx.globalAlpha = p.life;
    ctx.strokeStyle = PART_COLORS[p.c]; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
  }
  if (fx.ring > 0) {
    ctx.globalAlpha = fx.ring * 0.8; ctx.strokeStyle = '#bff9ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fx.ringX, fx.ringY, 14 + (1 - fx.ring) * 70, 0, TAU); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = LABEL_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i]; if (!l.on) continue;
    const pop = l.t < 0.08 ? 0.6 + l.t / 0.08 * 0.6 : 1.2 - Math.min(0.2, (l.t - 0.08) * 1.5);
    ctx.save();
    ctx.translate(l.x, l.y - 34); ctx.scale(pop, pop);
    ctx.globalAlpha = 1 - l.t / 0.6;
    const s = LABEL_SCALE[l.kind], txt = LABEL_TEXT[l.kind];
    if (s !== 1) ctx.scale(s, s);
    ctx.lineWidth = 5; ctx.strokeStyle = LABEL_STROKE[l.kind]; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = LABEL_FILL[l.kind]; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  ctx.font = NUM_FONT;
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i]; if (!n.on) continue;
    ctx.globalAlpha = 1 - n.t / 0.7;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(n.text, n.x, n.y);
    ctx.fillStyle = numColor(n.g); ctx.fillText(n.text, n.x, n.y);
  }
  ctx.font = POP_FONT;
  for (let i = 0; i < pops.length; i++) {
    const p = pops[i]; if (!p.on) continue;
    const sc = (p.t < 0.12 ? 0.7 + p.t / 0.12 * 0.5 : 1.2 - Math.min(0.2, (p.t - 0.12))) * (p.multi ? 1.2 : 1);
    ctx.save();
    ctx.translate(p.x, p.y); ctx.scale(sc, sc);
    ctx.globalAlpha = p.t < 0.7 ? 1 : 1 - (p.t - 0.7) / 0.3;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(60,30,0,0.85)'; ctx.strokeText(p.text, 0, 0);
    ctx.fillStyle = p.multi ? '#ffd23f' : '#fff1c2'; ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawFingers() {
  if (!C.showFingers || input.scAlpha <= 0.001) return;
  const { fAx, fAy, fBx, fBy } = input;
  ctx.globalAlpha = 0.25 * input.scAlpha;
  ctx.strokeStyle = '#bff9ff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(fAx + 22, fAy); ctx.arc(fAx, fAy, 22, 0, TAU);
  ctx.moveTo(fBx + 22, fBy); ctx.arc(fBx, fBy, 22, 0, TAU);
  ctx.moveTo(fAx, fAy); ctx.lineTo(fBx, fBy);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ======================= towers (Pins) =======================
// Auras first (under everything), then the Pins themselves (tall art, drawn after the auras so rings never cross them).
// The Magnet's aura is even out to its nearest road point and fades from there to its edge, like its pull (the
// gradient is cached per spot and rebuilt when it moves).
const magnetGrads = [];
function magnetGrad(i, t, R, color) {
  const c = magnetGrads[i];
  if (c && c.x === t.x && c.y === t.y && c.R === R) return c.g;
  const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, R), near = Math.min(Math.hypot(t.fx - t.x, t.fy - t.y) / R, 0.9);
  g.addColorStop(0, color); g.addColorStop(near, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  magnetGrads[i] = { x: t.x, y: t.y, R, g };
  return g;
}
function drawTowers(state) {
  for (let i = 0; i < state.towers.length; i++) {
    const t = state.towers[i];
    if (!t.on) continue;
    const def = C.towers[t.type], R = towerReach(t.type);
    ctx.beginPath(); ctx.arc(t.x, t.y, R, 0, TAU);
    if (t.type === 'magnet') { ctx.globalAlpha = 0.28; ctx.fillStyle = magnetGrad(i, t, R, def.color); }
    else { ctx.globalAlpha = 0.07; ctx.fillStyle = def.color; }
    ctx.fill();
    ctx.setLineDash(DASH); ctx.globalAlpha = 0.65; ctx.lineWidth = 2; ctx.strokeStyle = def.color; ctx.stroke(); ctx.setLineDash(NO_DASH);
    if (t.pulse > 0) {                                           // magnet pull: a ring collapsing onto its road point
      ctx.beginPath(); ctx.arc(t.fx, t.fy, 14 + R * 0.6 * t.pulse, 0, TAU);
      ctx.globalAlpha = 0.7 * t.pulse; ctx.lineWidth = 3; ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const t of state.towers) if (t.on) drawTower(ctx, t.type, t.x, t.y, state.clock, t);
}
const DASH = [6, 6], NO_DASH = [];
// Needles in flight (Needle Pin shots), same art as the one loaded on the Pin, a little smaller.
function drawNeedles(state) {
  const len = towerUnit() * 0.8;
  for (const n of state.needles) if (n.on) drawNeedle(ctx, n.x, n.y, n.ang, len, 1);
}

// ======================= one-off event effects =======================
// Reads new entries of state.events (thread pickups, Pin built) and animates them here.
let lastEventSeq = null;
const floaters = [], rings = [];
for (let i = 0; i < 16; i++) floaters.push({ on: false, x0: 0, y0: 0, p: 0, text: '', big: false });
for (let i = 0; i < 8; i++) rings.push({ on: false, x: 0, y: 0, p: 0, color: '' });
const FLY_DONE = { p: 1 }, off = o => { o.on = false; };
function takeEvents(state) {
  const ev = state.events;
  if (lastEventSeq === null) { lastEventSeq = ev.seq - 1; return; }   // don't replay history on the first frame
  for (const e of ev.list) {
    if (e.seq <= lastEventSeq || e.seq < 0) continue;
    if (e.kind === 'thread' || e.kind === 'bonus') {                 // bonus = a critter's squish: bigger, gold
      const f = floaters.find(o => !o.on) || floaters[0];
      f.on = true; f.x0 = e.x; f.y0 = e.y; f.p = 0; f.text = '+' + e.n; f.big = e.kind === 'bonus';
      vfx.cancel(f); vfx.add(f, FLY_DONE, C.pickupFlyMs, easing.inOutSine, off, f);
    } else if (e.kind === 'place') {                              // a Pin built: a soft ring pops out of its spot
      const r = rings.find(o => !o.on) || rings[0];
      r.on = true; r.x = e.x; r.y = e.y; r.p = 0; r.color = '#fff1c2';
      vfx.cancel(r); vfx.add(r, FLY_DONE, 380, easing.outCubic, off, r);
    }
  }
  lastEventSeq = ev.seq - 1;
}
function drawEventFx() {
  ctx.font = NUM_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaters) {
    if (!f.on) continue;
    const x = f.x0 + (view.pickupX - f.x0) * f.p, y = f.y0 + (view.pickupY - f.y0) * f.p - Math.sin(f.p * Math.PI) * 30;   // to the action bar's thread counter
    ctx.globalAlpha = f.p < 0.8 ? 1 : (1 - f.p) / 0.2;
    ctx.font = f.big ? POP_FONT : NUM_FONT;
    ctx.lineWidth = f.big ? 4 : 3; ctx.strokeStyle = 'rgba(60,30,0,0.8)'; ctx.strokeText(f.text, x, y);
    ctx.fillStyle = f.big ? '#ffd23f' : '#9ff3c8'; ctx.fillText(f.text, x, y);
  }
  for (const r of rings) {
    if (!r.on) continue;
    ctx.globalAlpha = 1 - r.p; ctx.strokeStyle = r.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, 20 + r.p * 50, (20 + r.p * 50) * 0.6, 0, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ======================= weapon: trails, pose =======================
// Blade trails: while the blades open, close or turn fast (always during the Helicopter spin), leave fading ghosts.
const ghosts = [];
for (let i = 0; i < 12; i++) ghosts.push({ on: false, x: 0, y: 0, theta: 0, open: 0, alpha: 0 });
const GHOST_GONE = { alpha: 0 };
const vpose = { x: 0, y: 0, theta: 0 }, gpose = { x: 0, y: 0, theta: 0 };
let prevA = -1, prevOpen = 0, prevTheta = 0, prevX = 0, prevY = 0;
// a = the opening as an angle (only its speed matters), open = 0..1 for drawing
function trackTrails(a, open, theta, dt) {
  if (prevA >= 0 && dt > 0) {
    let dth = (theta - prevTheta) % TAU; if (dth > Math.PI) dth -= TAU; else if (dth < -Math.PI) dth += TAU;
    if (Math.max(Math.abs(a - prevA), Math.abs(dth)) / dt > C.trailMinSpeed) {
      const g = ghosts.find(o => !o.on) || ghosts[0];
      g.on = true; g.x = prevX; g.y = prevY; g.theta = prevTheta; g.open = prevOpen; g.alpha = 0.35;
      vfx.cancel(g); vfx.add(g, GHOST_GONE, C.trailFadeMs, easing.linear, off, g);
    }
  }
  prevA = a; prevOpen = open; prevTheta = theta; prevX = vpose.x; prevY = vpose.y;
}
// Blade glow cosmetic (Shop): a soft light along each blade (a ring round a slide weapon's hole), under the art.
function drawBladeGlow(open, theta, alpha) {
  const color = cosmeticColor('glow'); if (!color || alpha <= 0.01) return;
  const def = weapon.def, L = def.bladeLen * view.S, w = L * C.meta.glowWidth, a = open * def.maxOpenDeg * DEG;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = color; ctx.lineCap = 'round';
  ctx.translate(vpose.x, vpose.y);
  for (const [k, lw] of [[0.45, 2 * w], [0.8, 0.7 * w]]) {
    ctx.globalAlpha = C.meta.glowAlpha * alpha * k; ctx.lineWidth = lw;
    ctx.beginPath();
    if (def.kind === 'slide') ctx.arc(0, 0, L * (def.ringScale || 1), 0, TAU);
    else for (const s of [-1, 1]) { ctx.moveTo(0, 0); ctx.lineTo(Math.sin(theta + s * a) * L, -Math.cos(theta + s * a) * L); }
    ctx.stroke();
  }
  ctx.restore();
}
function drawWeaponWithTrails(state, dt) {
  const open = visOpen();
  vpose.x = input.pose.x; vpose.y = input.pose.y; vpose.theta = bladeTheta();
  trackTrails(open * (weapon.def.maxOpenDeg || 35) * DEG, open, vpose.theta, dt);
  for (const g of ghosts) {
    if (!g.on) continue;
    gpose.x = g.x; gpose.y = g.y; gpose.theta = g.theta;
    drawWeapon(ctx, gpose, g.open, g.alpha * input.scAlpha, 0, 0);
  }
  drawBladeGlow(open, vpose.theta, input.scAlpha);
  drawWeapon(ctx, vpose, open, input.scAlpha, state.fx.flash, state.fx.tooSlow);
}

// ======================= Helicopter banner (its charge meter is the SHRED card in the DOM action bar) =======================
const SHRED_FONT = '900 64px ' + FONT;
function drawShredBanner(state) {
  const t = state.heli.bannerT; if (t <= 0) return;
  const p = 1 - t, sc = p < 0.15 ? 0.6 + p / 0.15 * 0.6 : 1.2 - Math.min(0.2, (p - 0.15) * 0.5);
  ctx.save();
  ctx.translate(view.W / 2, view.H * 0.3); ctx.scale(sc, sc);
  ctx.globalAlpha = Math.min(1, t * 3);
  ctx.font = SHRED_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 9; ctx.strokeStyle = '#3b1060'; ctx.strokeText('SHRED', 0, 0);
  ctx.fillStyle = '#ffd23f'; ctx.fillText('SHRED', 0, 0);
  ctx.restore();
}

// ======================= level 0: the ghost hand =======================
// A translucent one-finger hand, drawn from its fingertip (g.x, g.y) with the hand coming up from below-right. It
// presses (g.down: it drops onto the point and a ripple spreads), a gold ring fills round the fingertip while it holds
// (g.meter), and ghost scissors rise from the press point and open (g.sc, g.open). Bigger and bolder on each repeat
// (g.scale, g.alpha). Also: the fading cut zone of its last snip, and step 2's ring round the player's own finger.
const handCv = document.createElement('canvas');
const HAND_W = 120, HAND_H = 190, HAND_TIP_X = 30, HAND_TIP_Y = 8;    // sprite size (CSS px) and where the fingertip is in it
function buildHand(dpr) {
  handCv.width = Math.ceil(HAND_W * dpr); handCv.height = Math.ceil(HAND_H * dpr);
  const g = handCv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, HAND_TIP_X * dpr, HAND_TIP_Y * dpr);
  const p = new Path2D();
  p.roundRect(-10, -2, 20, 92, 10);                              // pointing finger
  p.roundRect(4, 64, 22, 46, 11); p.roundRect(22, 70, 22, 44, 11); p.roundRect(40, 78, 20, 40, 10);   // curled fingers
  p.moveTo(-8, 96); p.bezierCurveTo(-30, 84, -40, 100, -26, 116); p.lineTo(-4, 138); p.lineTo(-4, 100); p.closePath();   // thumb
  p.roundRect(-12, 84, 76, 88, 26);                              // palm
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(40,24,10,0.9)'; g.lineWidth = 5; g.stroke(p);
  g.fillStyle = '#fff6e8'; g.fill(p);
  g.strokeStyle = 'rgba(160,120,80,0.55)'; g.lineWidth = 1.5;      // knuckle creases and a nail
  g.beginPath(); g.moveTo(-6, 44); g.lineTo(6, 44); g.moveTo(-6, 60); g.lineTo(6, 60); g.stroke();
  g.beginPath(); g.roundRect(-6, 2, 12, 12, 5); g.stroke();
}
const hpose = { x: 0, y: 0, theta: 0 };
function drawGhost(state) {
  const tut = state.tut, g = tut.ghost;
  if (g.cutT > 0 && g.cutOpen > 0) {                             // its snip: the zone it just cut
    const L = weapon.def.bladeLen * view.S, a = g.cutOpen * weapon.def.maxOpenDeg * DEG;
    ctx.beginPath(); ctx.moveTo(g.cx, g.cy); ctx.arc(g.cx, g.cy, L, -Math.PI / 2 - a, -Math.PI / 2 + a); ctx.closePath();
    ctx.globalAlpha = 0.35 * g.cutT; ctx.fillStyle = '#e8feff'; ctx.fill(); ctx.globalAlpha = 1;
  }
  if (tut.step === 2 && tut.meter > 0) {         // the player's own hold: a ring fills round the finger
    drawHoldRing((input.fAx + input.fBx) / 2, (input.fAy + input.fBy) / 2, 34, tut.meter, tut.ok ? 1 : 0.85, state.clock);
  }
  const A = g.a * tut.vis * g.alpha;
  if (A <= 0.01) return;
  if (g.sc > 0.01) {                                              // its scissors rise from the press point and open
    const k = 1 - (1 - g.sc) * (1 - g.sc);
    hpose.x = g.x; hpose.y = g.y - C.pivotOffsetPx * k; hpose.theta = 0;
    drawWeapon(ctx, hpose, g.open, A * 0.7 * g.sc, 0, 0);
  }
  if (g.down > 0.5) {                                             // press ripples
    for (let i = 0; i < 2; i++) {
      const ph = (state.clock * 1.4 + i * 0.5) % 1;
      ctx.beginPath(); ctx.arc(g.x, g.y, (12 + ph * 30) * g.scale, 0, TAU);
      ctx.globalAlpha = A * (1 - ph) * 0.8; ctx.strokeStyle = '#fff1c2'; ctx.lineWidth = 3; ctx.stroke();
    }
  }
  if (g.meter > 0) drawHoldRing(g.x, g.y, 30 * g.scale, g.meter, A, state.clock);
  const lift = 1 - g.down, s = g.scale * (1 + lift * 0.12);
  ctx.save();
  ctx.globalAlpha = A; ctx.translate(g.x, g.y + lift * 12); ctx.scale(s, s);
  ctx.drawImage(handCv, -HAND_TIP_X, -HAND_TIP_Y, HAND_W, HAND_H);
  ctx.restore();
  ctx.globalAlpha = 1;
}
// A ring that fills clockwise from the top as a hold goes on (gold; glowing once full).
function drawHoldRing(x, y, r, f, alpha, clock) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.globalAlpha = alpha * 0.35; ctx.strokeStyle = '#2a170a'; ctx.lineWidth = 7; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, f));
  ctx.globalAlpha = alpha; ctx.strokeStyle = f >= 1 ? '#fff1b8' : '#ffc93d'; ctx.lineWidth = f >= 1 ? 6 + Math.sin(clock * 14) * 1.5 : 5; ctx.stroke();
  ctx.globalAlpha = 1;
}

// ======================= banners & prompts (the HUD itself is DOM: src/hud.js) =======================
// Banner strings are rebuilt only when the wave changes.
const hud = { wave: -1, bannerWave: '', bannerClear: '' };
function refreshHudText(state) {
  if (hud.wave !== state.wave) {
    hud.wave = state.wave;
    hud.bannerWave = 'WAVE ' + state.wave; hud.bannerClear = 'WAVE ' + state.wave + ' CLEARED';
  }
}

function drawBanner(state) {
  let main = '', sub = '', a = 0;
  if (state.mode === 'TUTORIAL' && state.bannerT > 0) {         // level 0: its name is the only words it shows
    main = level().name; a = Math.min(1, state.bannerT * 3);
  } else if (state.mode === 'PLAYING' && state.bannerT > 0) {
    main = hud.bannerWave; a = Math.min(1, state.bannerT * 3);
  } else if (state.mode === 'WAVE_CLEAR') {
    main = hud.bannerClear; sub = state.wave >= levelWaves().length ? 'The drawer is safe!' : 'Next wave incoming…';
    a = Math.min(1, state.modeT * 4, (C.waveClearMs / 1000 - state.modeT) * 4);
  }
  if (!main || a <= 0) return;
  // title-style lettering: cream fill, thick brown outline, a dark drop under it
  const x = view.W / 2, y = view.H * 0.36;
  ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = BANNER_FONT;
  ctx.lineWidth = 10; ctx.strokeStyle = '#2a170a'; ctx.strokeText(main, x, y + 4);
  ctx.strokeStyle = '#5a3418'; ctx.strokeText(main, x, y);
  ctx.fillStyle = '#ffc93d'; ctx.fillText(main, x, y);
  if (sub) {
    ctx.font = BANNER_SUB_FONT; ctx.lineWidth = 6; ctx.strokeStyle = '#2a170a'; ctx.strokeText(sub, x, y + 40);
    ctx.fillStyle = '#fff4dc'; ctx.fillText(sub, x, y + 40);
  }
  ctx.globalAlpha = 1;
}

function drawPrompt(state) {
  if (state.mode === 'PLAYING' && input.touchCapable && !input.mouse.used && !input.gripping && input.scAlpha === 0) {
    ctx.font = PROMPT_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,241,194,0.8)';
    ctx.fillText(holdTouch() ? 'Hold a finger down to open, lift to snip' : 'Put two fingers down — they are the handles', view.W / 2, view.H * 0.5);
  }
}

// Boss HP bar across the top, under the HUD row: its name, a stitched felt bar, and the Unstitcher's phase marks.
function drawBossBar(state) {
  let boss = null;
  for (let i = 0; i < state.enemies.length; i++) if (state.enemies[i].on && state.enemies[i].type.boss) { boss = state.enemies[i]; break; }
  if (!boss) return;
  const def = C.bosses[boss.name] || {}, name = (def.name || boss.name).toUpperCase();
  const x = 12, w = view.W - 24, y = 84, h = 14, f = Math.max(0, boss.hp / boss.maxHp);
  // the name sits at the right end, clear of the HUD's level/wave badge top-left
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.font = HUD_FONT; ctx.lineJoin = 'round';
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.strokeText(name, x + w - 4, y - 3);
  ctx.fillStyle = '#ffe4aa'; ctx.fillText(name, x + w - 4, y - 3);
  ctx.fillStyle = '#2a170a'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = boss.type.patch; ctx.fillRect(x, y, w * f, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * f, h * 0.35);
  ctx.setLineDash(DASH); ctx.strokeStyle = 'rgba(255,236,196,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + 3, y + h / 2); ctx.lineTo(x + w - 3, y + h / 2); ctx.stroke(); ctx.setLineDash(NO_DASH);
  if (def.phaseAt) {
    ctx.fillStyle = '#fff1c2';
    for (const p of def.phaseAt) ctx.fillRect(x + w * p - 1.5, y - 3, 3, h + 6);
  }
}

// ======================= frame =======================
export function draw(state) {
  const dpr = view.dpr, fx = state.fx;
  const dt = lastClock < 0 ? 0 : Math.max(0, Math.min(0.1, state.clock - lastClock)); lastClock = state.clock;
  vfx.update(dt);
  if (state.mode === 'TITLE') { prevA = -1; return; }                       // the title is all DOM
  takeEvents(state);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (fx.camShake > 0) ctx.translate(Math.sin(state.clock * 83) * fx.camShake, Math.cos(state.clock * 71) * fx.camShake);   // kill shake moves the whole world
  ctx.drawImage(bgCanvas, 0, 0, view.W, view.H);
  drawWorkshopHit(state);
  drawTowers(state);
  if (fx.kick > 0) ctx.translate(-input.aimX * C.snipKickPx * fx.kick, -input.aimY * C.snipKickPx * fx.kick);
  drawSplats(state);
  drawCutZone(fx.cut);
  drawEnemies(state);
  drawCritters(state);
  drawNeedles(state);
  drawFragments(state);
  if (live()) {
    drawFingers();
    drawWeaponWithTrails(state, dt);
  } else prevA = -1;                                             // no trail from wherever the blades were last shown
  drawEffects(state);
  if (state.mode === 'TUTORIAL') drawGhost(state);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  refreshHudText(state);
  drawBanner(state);
  if (state.mode === 'PLAYING' || state.mode === 'WAVE_CLEAR' || state.mode === 'GAME_OVER') { drawPrompt(state); drawBossBar(state); }
  drawEventFx();
  drawShredBanner(state);
}
