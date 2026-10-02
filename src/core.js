// Shared canvas/view state and small math helpers used by every module.
// Kept separate so no two feature modules have to import each other.

import { CONFIG as C } from './config.js';

export const TAU = Math.PI * 2, DEG = Math.PI / 180;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerpK = (k, frames) => 1 - Math.pow(1 - k, frames);   // frame-rate independent lerp factor
export function lerpAngle(a, b, t) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return a + d * t; }
export function segDistSq(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, len = vx * vx + vy * vy;
  const t = len > 0 ? clamp(((px - ax) * vx + (py - ay) * vy) / len, 0, 1) : 0;
  const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
  return dx * dx + dy * dy;
}

// World zoom: the game runs in "world px", drawn on screen scaled by Z (screen px per world px). Z = 1 / the level's size,
// so a bigger level zooms the whole world out (road, enemies, scissors, Pins, effects together); the HUD and DOM stay put.
// SW/SH = the screen in CSS px; W/H = the same screen in world px (SW / Z, SH / Z): everything in game.js, input's pose,
// scissors, critters and render.js's world drawing is in world px. Only UI drawn on the canvas (banners, the boss bar) and
// anything placed in the DOM from world positions use screen px (multiply by Z). Set by render.sizeCanvas + game.layout.
// dpr = capped devicePixelRatio, S = current weapon's SVG units -> world px.
// L = level units (the painted plate's pixels) -> world px, LX = world x of the plate's left edge (its top is y = 0).
const cv = document.getElementById('c');
// pickupX/Y: where "+8 thread" pickups fly to (the action bar's thread counter; set by actionBar.js)
// levelId: the CONFIG.levels key being played; levelDef: that level as played (the CONFIG entry itself for a painted
// level, the generated level for a recipe / random one). Both set by game.setLevel.
export const view = { cv, ctx: cv.getContext('2d'), W: 0, H: 0, SW: 0, SH: 0, Z: 1, dpr: 1, S: 1, L: 1, LX: 0, pickupX: 40, pickupY: 40,
  levelId: C.defaultLevel, levelDef: null,
  bgReady: false };   // bgReady: the level's plate is painted and drawn (render.js renderBackground); game.js holds the wave clock until it is
// The current level, as src/levels/index.js loadLevel() returned it.
export const level = () => view.levelDef;
