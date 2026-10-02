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
import { live, visOpen, bladeTheta, levelWaves, bossMode } from './game.js';
import { towerReachOf } from './pins.js';
import { buildEnemySprites, drawEnemySprite, drawEnemyGround, drawBruteArmor, drawLooseHelmet, drawSeam, drawArmorSeams, drawChargeWarn } from './enemyArt.js';
import { buildTowerSprites, drawTower, drawNeedle, towerUnit } from './towerArt.js';
import { drawWeapon, rasterizeArt, setHandleTint } from './weaponArt.js';
import { cosmeticColor } from './meta.js';
import { plateFor, ensureSprites, kitSprite } from './levelArt.js';
import { makeTweens, easing } from './tween.js';
import { UI_ART, uiImage, ZONES, SPRITES, heartPadKey, HIT_BITS } from './kit.js';

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
const HEART_FONT = '400 40px ' + UI_FONT;                       // the HP on the heart pad (scaled to the pad)

const PART_COLORS = ['#ffffff', '#8ff7ff', '', '#ffd23f', '#ff8a3d'];   // particle c: 0 white, 1 cyan, 3 gold, 4 ember (2 = alternating 0/1)
// big floating words, indexed by label kind (LABEL_SNIP / LABEL_NICK / LABEL_CLANG / LABEL_SHIELD in game.js)
const LABEL_TEXT = ['SNIP!', 'nick', 'CLANG!', 'SHIELDED!'], LABEL_SCALE = [1, 0.6, 0.8, 0.75];
const LABEL_FILL = ['#ffffff', '#ffffff', '#e3e9ee', '#bff4ff'], LABEL_STROKE = ['rgba(0,70,100,0.8)', 'rgba(0,70,100,0.8)', '#39424a', '#1d2a4a'];
// damage number colour by strike grade: gold = strong (near pivot / seam), white = mid, grey-blue = graze (near tips),
// orange = a Fire Pin burn tick (g = -1), silver = a Needle Pin hit (g = -2)
const numColor = g => g <= -2 ? '#dfe9f2' : g < 0 ? '#ff9a4a' : g < 0.35 ? '#ffe27a' : g < 0.7 ? '#ffffff' : '#9fc7d6';

// ======================= resize =======================
// 1) sizeCanvas() sets view.W/H/dpr and the canvas; 2) game.layout() rebuilds weapon scale + path; 3) prerender().
export function sizeCanvas() {
  const cv = view.cv;
  view.dpr = Math.min(window.devicePixelRatio || 1, C.maxDpr);
  view.SW = window.innerWidth; view.SH = window.innerHeight;
  view.W = view.SW / view.Z; view.H = view.SH / view.Z;          // game.layout() sets them again for the level's zoom
  cv.width = Math.round(view.SW * view.dpr); cv.height = Math.round(view.SH * view.dpr);
  cv.style.width = view.SW + 'px'; cv.style.height = view.SH + 'px';
}
export function prerender() {
  renderBackground();
  buildEnemySprites(view.dpr);
  buildTowerSprites(view.dpr);
  setHandleTint(cosmeticColor('handle'));                         // handle cosmetic (Shop): baked into the weapon art
  rasterizeArt();
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
  bgCanvas.width = Math.max(1, Math.round(view.SW * dpr)); bgCanvas.height = Math.max(1, Math.round(view.SH * dpr));
  const g = bgCanvas.getContext('2d');
  g.setTransform(dpr * view.Z, 0, 0, dpr * view.Z, 0, 0);        // world px (W x H) onto the screen-sized backdrop
  g.fillStyle = '#2f5a1c'; g.fillRect(0, 0, W, H);
  view.bgReady = false;
  if (lv.gen ? !gen : !plate.complete || !plate.naturalWidth || plate.getAttribute('src') !== lv.bg) return;
  view.bgReady = true;
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

// The workshop is the heart pad at the end of the road, and it shows the HP (there's no HP counter in the HUD): the
// zone's pad in the damage stage for the HP left (kit.js heartPadKey; stage 0 is a generated plate's own pad, so nothing
// is drawn over it there; a painted plate gets the kit's pad over its painted one from the start), a red flash on a
// hit, and the HP as a number on the heart (not in level 0, where nothing hurts it). Each hit also throws a burst of
// loose bits off the pad (drawHeartBurst).
let heartZone = '', heartHp = -1;
const heartNum = { hp: -1, text: '' };
function drawHeart(state) {
  const lv = level(), zone = ZONES[lv.world] ? lv.world : 'denim';
  if (zone !== heartZone) { heartZone = zone; ensureSprites([0, 1, 2, 3, 4].map(n => heartPadKey(zone, n)).concat(HIT_BITS)).catch(() => {}); }
  const p = state.paths[0], x = p.x[p.n - 1], y = p.y[p.n - 1];              // every route ends on the heart pad
  const R = lv.workshopR * view.L, f = state.hp / C.workshopHp, tut = state.mode === 'TUTORIAL';
  if (state.hp < heartHp && !tut) heartBurst(x, y, R);
  heartHp = state.hp;
  let stage = 0;
  while (stage < C.heartStageAt.length && f <= C.heartStageAt[stage]) stage++;
  if (stage || !lv.gen) kitSprite(ctx, heartPadKey(zone, stage), x, y, R / SPRITES[heartPadKey(zone, 0)][5] * 1.04, 0, 0);
  if (state.workshopHitT > 0) {
    ctx.globalAlpha = state.workshopHitT * 0.55; ctx.fillStyle = '#ff3b3b';
    ctx.beginPath(); ctx.arc(x, y, R * (0.8 + (1 - state.workshopHitT) * 0.3), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (tut) return;
  if (heartNum.hp !== state.hp) { heartNum.hp = state.hp; heartNum.text = String(Math.max(0, state.hp)); }
  const low = state.hp <= C.heartLowHp, px = Math.max(R * C.heartNumFrac, C.heartNumMinPx / view.Z);
  const s = (1 + 0.35 * state.workshopHitT) * (low && state.hp > 0 ? 1 + 0.08 * Math.sin(state.clock * 7) : 1);
  ctx.save();
  ctx.translate(x, y - R * 0.04); ctx.scale(s * px / 40, s * px / 40);       // the font is set at 40px and scaled
  ctx.font = HEART_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 9; ctx.strokeStyle = low ? '#3a0303' : '#5a0d0d'; ctx.strokeText(heartNum.text, 0, 2);
  ctx.fillStyle = low ? '#ffe27a' : '#fff6e6'; ctx.fillText(heartNum.text, 0, 2);
  ctx.restore();
}
// The hit burst: stuffing puffs, thread ends and popped stitches fly off the pad, spin and fade (render-only; the
// randomness is purely visual).
const bits = [];
for (let i = 0; i < 24; i++) bits.push({ on: false, key: '', x0: 0, y0: 0, dx: 0, dy: 0, rot: 0, vr: 0, p: 0 });
function heartBurst(x, y, R) {
  const reach = C.heartBurstPx * view.L;
  for (let i = 0; i < C.heartBurstN; i++) {
    const b = bits.find(o => !o.on) || bits[i % bits.length], a = Math.random() * TAU, d = reach * (0.5 + Math.random() * 0.5);
    b.on = true; b.key = HIT_BITS[(Math.random() * HIT_BITS.length) | 0]; b.p = 0;
    b.x0 = x + Math.cos(a) * R * 0.3; b.y0 = y + Math.sin(a) * R * 0.3;            // from the heart, out past the pad's edge
    b.dx = Math.cos(a) * d; b.dy = Math.sin(a) * d; b.rot = Math.random() * TAU; b.vr = (Math.random() - 0.5) * 6;
    vfx.cancel(b); vfx.add(b, FLY_DONE, C.heartBurstMs, easing.outCubic, off, b);
  }
}
function drawHeartBurst() {
  const sc = C.heartBurstScale * view.L;
  for (const b of bits) {
    if (!b.on) continue;
    ctx.globalAlpha = 1 - b.p * b.p;
    kitSprite(ctx, b.key, b.x0 + b.dx * b.p, b.y0 + b.dy * b.p, sc * (1 - 0.3 * b.p), b.rot + b.vr * b.p, 0);
  }
  ctx.globalAlpha = 1;
}

// Entrance arrows (levels with more than one entrance): a faint pair of chevrons where each road comes on screen, which brighten
// and bounce for entryWarnSec before something comes in there, so the player has to watch every way in, not camp one.
function drawEntryMarks(state) {
  const marks = state.entryMarks;
  if (!marks.length || !live()) return;
  const u = Math.max(14, view.SH * 0.028) / view.Z;              // a hint, so screen-sized on a zoomed-out level
  for (const m of marks) {
    const w = m.next < C.entryWarnSec ? 1 - Math.max(0, m.next) / C.entryWarnSec : 0;
    const bob = w > 0 ? Math.sin(state.clock * 18) * u * 0.25 * w : 0;
    ctx.save();
    ctx.translate(m.x, m.y); ctx.rotate(m.ang);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < 2; k++) {
      const x = (k - 0.5) * u * 0.9 + bob, s = u * (1 + 0.35 * w);
      ctx.beginPath(); ctx.moveTo(x - s * 0.45, -s * 0.7); ctx.lineTo(x + s * 0.45, 0); ctx.lineTo(x - s * 0.45, s * 0.7);
      ctx.lineWidth = s * 0.42; ctx.strokeStyle = 'rgba(60,20,0,' + (0.25 + 0.4 * w) + ')'; ctx.stroke();
      ctx.lineWidth = s * 0.26; ctx.strokeStyle = w > 0 ? 'rgba(255,214,92,' + (0.55 + 0.45 * w) + ')' : 'rgba(255,245,220,0.3)'; ctx.stroke();
    }
    ctx.restore();
  }
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
    drawEnemyGround(ctx, e.name, e.x, e.y, (e.pinned && !e.walking) || e.armorDownT > 0 ? 0 : 0.55 + 0.35 * Math.abs(step));   // no dust standing still (a dazed boss too)
    const shake = e.windup ? C.bossTremblePx * Math.sin(state.clock * 70) : 0;   // winding up for a charge: it trembles
    if (shake) ctx.translate(shake, 0);
    drawEnemySprite(ctx, e.name, e.x, e.y, rot, e.rank);
    if (e.armored) drawBruteArmor(ctx, e, rot);
    else if (t.boss && e.helmPh > 0) drawLooseHelmet(ctx, e, state.clock);   // knocked off by its charge, then picked back up
    if (shake) ctx.translate(-shake, 0);
    if (t.boss) {                                               // its rules, shown: the opening seam, or glowing seams while armor is down
      const m = bossMode(e);
      if (e.windup) { const d = C.bosses[e.name]; drawChargeWarn(ctx, e, (e.chargeT - d.chargeEverySec + d.windupSec) / d.windupSec, state.clock); }
      if (m === 'seam') drawSeam(ctx, e, state.clock);
      else if ((m === 'armor' && !e.armored && !e.charging) || (m === 'swarm' && e.shieldDownT > 0)) drawArmorSeams(ctx, e, state.clock);
      else if (m === 'swarm' && e.shieldDownT <= 0) {          // a shimmering thread shield, held up by its Scraps
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
// Silverfish: the kit's four-frame crawl cycle (faces right, so it is drawn along its heading), cycling faster mid-skitter.
// A squish: one of the kit's two splats, fading over splatSec.
const SF_IMG_W = 170, SF_FPS = 9, SF_FPS_FAST = 18;                // visible body width in the 240x120 frames; frames per second
const SPLAT_PX = 62;                                              // on-screen width of a splat's 200px art
function drawCritters(state) {
  for (const c of state.critters) if (c.on) drawSilverfish(c.x, c.y, c.ang, c.age, c.skT > 0);
}
function drawSilverfish(x, y, ang, t, fast) {
  const img = uiImage(UI_ART.silverfish[Math.floor(t * (fast ? SF_FPS_FAST : SF_FPS)) % UI_ART.silverfish.length]);
  if (!img.complete || !img.naturalWidth) return;
  const L = C.critters.silverfish.len, k = L / SF_IMG_W;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(-L * 0.05, 3, L * 0.5, L * 0.16, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1; ctx.drawImage(img, -120 * k, -60 * k, 240 * k, 120 * k);
  ctx.restore();
}
function drawSplats(state) {
  for (const s of state.splats) {
    if (!s.on) continue;
    const img = uiImage(UI_ART.splat[s.k0 < 0.5 ? 0 : 1]);
    if (!img.complete || !img.naturalWidth) continue;
    const w = SPLAT_PX * (0.9 + 0.2 * s.k1);
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.globalAlpha = 0.95 * (1 - s.t) * (1 - s.t * 0.3);
    ctx.drawImage(img, -w / 2, -w / 2, w, w);
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
  // the words and numbers keep their screen size on a zoomed-out level (tz undoes the zoom around each one)
  const tz = 1 / view.Z;
  ctx.font = LABEL_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i]; if (!l.on) continue;
    const pop = l.t < 0.08 ? 0.6 + l.t / 0.08 * 0.6 : 1.2 - Math.min(0.2, (l.t - 0.08) * 1.5);
    ctx.save();
    ctx.translate(l.x, l.y - 34 * tz); ctx.scale(pop * tz, pop * tz);
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
    ctx.save(); ctx.translate(n.x, n.y); ctx.scale(tz, tz);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(n.text, 0, 0);
    ctx.fillStyle = numColor(n.g); ctx.fillText(n.text, 0, 0);
    ctx.restore();
  }
  ctx.font = POP_FONT;
  for (let i = 0; i < pops.length; i++) {
    const p = pops[i]; if (!p.on) continue;
    const sc = (p.t < 0.12 ? 0.7 + p.t / 0.12 * 0.5 : 1.2 - Math.min(0.2, (p.t - 0.12))) * (p.multi ? 1.2 : 1);
    ctx.save();
    ctx.translate(p.x, p.y); ctx.scale(sc * tz, sc * tz);
    ctx.globalAlpha = p.t < 0.7 ? 1 : 1 - (p.t - 0.7) / 0.3;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(60,30,0,0.85)'; ctx.strokeText(p.text, 0, 0);
    ctx.fillStyle = p.multi ? '#ffd23f' : '#fff1c2'; ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawFingers() {
  if (!C.showFingers || input.scAlpha <= 0.001) return;
  const { fAx, fAy, fBx, fBy } = input;                          // screen px (the fingers aren't zoomed)
  ctx.save(); ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.globalAlpha = 0.25 * input.scAlpha;
  ctx.strokeStyle = '#bff9ff'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(fAx + 22, fAy); ctx.arc(fAx, fAy, 22, 0, TAU);
  ctx.moveTo(fBx + 22, fBy); ctx.arc(fBx, fBy, 22, 0, TAU);
  ctx.moveTo(fAx, fAy); ctx.lineTo(fBx, fBy);
  ctx.stroke();
  ctx.restore();
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
    const def = C.towers[t.type], R = towerReachOf(t);               // the ring at its rank and tier (pins.js)
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
  for (const t of state.towers) if (t.on) drawTower(ctx, t, state.clock);
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
for (let i = 0; i < 16; i++) floaters.push({ on: false, x0: 0, y0: 0, p: 0, text: '', big: false, hold: 0 });
for (let i = 0; i < 8; i++) rings.push({ on: false, x: 0, y: 0, p: 0, color: '' });
const FLY_DONE = { p: 1 }, off = o => { o.on = false; };
function takeEvents(state) {
  const ev = state.events;
  if (lastEventSeq === null) { lastEventSeq = ev.seq - 1; return; }   // don't replay history on the first frame
  for (const e of ev.list) {
    if (e.seq <= lastEventSeq || e.seq < 0) continue;
    if (e.kind === 'thread' || e.kind === 'bonus') {                 // bonus = a critter's squish: bigger, gold
      const f = floaters.find(o => !o.on) || floaters[0];
      f.on = true; f.x0 = e.x; f.y0 = e.y; f.p = 0; f.big = e.kind === 'bonus';
      f.text = f.big ? '+' + e.n + ' thread' : '+' + e.n;
      // a squish's pickup hangs where the critter died first (hold = that share of p), then flies like the others
      const hold = f.big ? C.bonusHoldMs : 0;
      f.hold = hold / (hold + C.pickupFlyMs);
      vfx.cancel(f); vfx.add(f, FLY_DONE, hold + C.pickupFlyMs, hold ? easing.linear : easing.inOutSine, off, f);
    } else if (e.kind === 'place') {                              // a Pin built: a soft ring pops out of its spot
      const r = rings.find(o => !o.on) || rings[0];
      r.on = true; r.x = e.x; r.y = e.y; r.p = 0; r.color = '#fff1c2';
      vfx.cancel(r); vfx.add(r, FLY_DONE, 380, easing.outCubic, off, r);
    }
  }
  lastEventSeq = ev.seq - 1;
}
// Drawn in screen px (the pickups fly to a DOM counter); their start points and the rings are world px, so times Z.
function drawEventFx() {
  const Z = view.Z;
  ctx.font = NUM_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaters) {
    if (!f.on) continue;
    const x0 = f.x0 * Z, y0 = f.y0 * Z;
    let p = f.p, rise = 0;
    if (f.hold) {                                   // hold phase: drift up a little in place; then fly on easing
      if (p < f.hold) { rise = easing.outCubic(p / f.hold) * 28; p = 0; }
      else { rise = 28; p = easing.inOutSine((p - f.hold) / (1 - f.hold)); }
    }
    const x = x0 + (view.pickupX - x0) * p, y = y0 + (view.pickupY - y0) * p - Math.sin(p * Math.PI) * 30 - rise * (1 - p);   // to the action bar's thread counter
    ctx.globalAlpha = p < 0.8 ? 1 : (1 - p) / 0.2;
    ctx.font = f.big ? POP_FONT : NUM_FONT;
    ctx.lineWidth = f.big ? 4 : 3; ctx.strokeStyle = 'rgba(60,30,0,0.8)'; ctx.strokeText(f.text, x, y);
    ctx.fillStyle = f.big ? '#ffd23f' : '#9ff3c8'; ctx.fillText(f.text, x, y);
  }
  for (const r of rings) {
    if (!r.on) continue;
    ctx.globalAlpha = 1 - r.p; ctx.strokeStyle = r.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(r.x * Z, r.y * Z, (20 + r.p * 50) * Z, (20 + r.p * 50) * 0.6 * Z, 0, 0, TAU); ctx.stroke();
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
  ctx.translate(view.SW / 2, view.SH * 0.3); ctx.scale(sc, sc);
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
const GLOVE_W = 150, GLOVE_H = 180, GLOVE_TIP_X = 62, GLOVE_UP_TIP_Y = 3, GLOVE_PRESS_TIP_Y = 35;   // kit glove art (300x360) drawn at half size; where the fingertip is in it
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
  const glove = uiImage(g.down > 0.5 ? UI_ART.glovePress : UI_ART.gloveUp);
  if (glove.complete && glove.naturalWidth) ctx.drawImage(glove, -GLOVE_TIP_X, -(g.down > 0.5 ? GLOVE_PRESS_TIP_Y : GLOVE_UP_TIP_Y), GLOVE_W, GLOVE_H);
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
  const x = view.SW / 2, y = view.SH * 0.36;
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
    ctx.fillText(holdTouch() ? 'Hold a finger down to open, lift to snip' : 'Put two fingers down — they are the handles', view.SW / 2, view.SH * 0.5);
  }
}

// Boss HP bar across the top, under the HUD row: its name, a stitched felt bar, and the Unstitcher's phase marks.
function drawBossBar(state) {
  let boss = null;
  for (let i = 0; i < state.enemies.length; i++) if (state.enemies[i].on && state.enemies[i].type.boss) { boss = state.enemies[i]; break; }
  if (!boss) return;
  const def = C.bosses[boss.name] || {}, name = (def.name || boss.name).toUpperCase();
  const x = 12, w = view.SW - 24, y = 84, h = 14, f = Math.max(0, boss.hp / boss.maxHp);
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
  drawBossHint(state, boss, x + w - 4, y + h + 20);
}

// The boss's rule right now, right-aligned under its bar (clear of the HUD column on the left): pale while it's
// something to wait for, gold when a snip will land. It swells and glows for bossHintPulseSec when it changes.
// Under that, once its HP drops to bossTauntAt, its taunt2 (config bosses) for bossTauntSec, fading out: a smaller
// pale purple line, split in two near its middle when it's too wide to clear the HUD column (worked out once, as it
// turns on).
let hintKey = '', hintT0 = -1, tauntOn = false, tauntT0 = 0, tauntLines = [];
const TAUNT_FONT = '400 14px ' + UI_FONT;
function wrapTaunt(text, maxW) {
  ctx.font = TAUNT_FONT;
  if (ctx.measureText(text).width <= maxW) return [text];
  const words = text.split(' ');
  let best = 1, bestD = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(ctx.measureText(words.slice(0, i).join(' ')).width - ctx.measureText(words.slice(i).join(' ')).width);
    if (d < bestD) { bestD = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
function drawBossHint(state, boss, rx, y) {
  const def = C.bosses[boss.name], f = boss.hp / boss.maxHp;
  if (f > C.bossTauntAt) tauntOn = false;                            // a fresh boss (a retry) re-arms it
  else if (!tauntOn) { tauntOn = true; tauntT0 = state.clock; tauntLines = def && def.taunt2 ? wrapTaunt('“' + def.taunt2 + '”', view.SW - 110) : []; }
  const tt = state.clock - tauntT0;
  if (tauntOn && tauntLines.length && tt < C.bossTauntSec) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (C.bossTauntSec - tt) / 0.6);     // fades over the last 0.6s
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = TAUNT_FONT; ctx.lineJoin = 'round';
    for (let i = 0; i < tauntLines.length; i++) {
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(tauntLines[i], rx, y + 22 + i * 17);
      ctx.fillStyle = '#f3c8ff'; ctx.fillText(tauntLines[i], rx, y + 22 + i * 17);
    }
    ctx.restore();
  }
  const m = bossMode(boss), H = C.bossHints;
  let key;
  if (m === 'swarm') key = boss.shieldDownT > 0 ? 'shieldDown' : 'swarm';
  else if (m === 'armor') key = !boss.armored && !boss.charging ? 'armorDown' : boss.windup || boss.charging ? 'windup' : 'armor';
  else key = boss.seamOpen ? 'seamOpen' : 'seam';
  if (key !== hintKey) { hintKey = key; hintT0 = state.clock; }
  const go = key === 'shieldDown' || key === 'armorDown' || key === 'seamOpen';
  const p = Math.max(0, 1 - (state.clock - hintT0) / C.bossHintPulseSec), s = 1 + 0.15 * p;   // small: it grows leftward toward the HUD
  ctx.save();
  ctx.translate(rx, y); ctx.scale(s, s);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = HUD_FONT; ctx.lineJoin = 'round';
  if (go || p > 0) { ctx.shadowColor = go ? '#ffd23f' : '#ffffff'; ctx.shadowBlur = 6 + 10 * p; }
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(H[key], 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = go ? '#ffd23f' : '#e8f4ff'; ctx.fillText(H[key], 0, 0);
  ctx.restore();
}

// ======================= frame =======================
export function draw(state) {
  const dpr = view.dpr, fx = state.fx;
  const dt = lastClock < 0 ? 0 : Math.max(0, Math.min(0.1, state.clock - lastClock)); lastClock = state.clock;
  vfx.update(dt);
  if (state.mode === 'TITLE') { prevA = -1; return; }                       // the title is all DOM
  takeEvents(state);
  ctx.setTransform(dpr * view.Z, 0, 0, dpr * view.Z, 0, 0);       // the world, zoomed (core.js view.Z)
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (fx.camShake > 0) ctx.translate(Math.sin(state.clock * 83) * fx.camShake, Math.cos(state.clock * 71) * fx.camShake);   // kill shake moves the whole world
  ctx.drawImage(bgCanvas, 0, 0, view.W, view.H);
  drawHeart(state);
  drawEntryMarks(state);
  drawTowers(state);
  if (fx.kick > 0) ctx.translate(-input.aimX * C.snipKickPx * fx.kick, -input.aimY * C.snipKickPx * fx.kick);
  drawSplats(state);
  drawCutZone(fx.cut);
  drawEnemies(state);
  drawCritters(state);
  drawNeedles(state);
  drawFragments(state);
  drawHeartBurst();
  if (live()) {
    drawFingers();
    drawWeaponWithTrails(state, dt);
  } else prevA = -1;                                             // no trail from wherever the blades were last shown
  drawEffects(state);
  if (state.mode === 'TUTORIAL') drawGhost(state);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);                         // UI from here on: screen px
  refreshHudText(state);
  drawBanner(state);
  if (state.mode === 'PLAYING' || state.mode === 'WAVE_CLEAR' || state.mode === 'GAME_OVER') { drawPrompt(state); drawBossBar(state); }
  drawEventFx();
  drawShredBanner(state);
}
