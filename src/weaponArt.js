// Weapon art: loads each weapon's layered SVG, rasterizes the current one per layer, and draws it (or a line-drawn
// fallback while it loads). Layers are drawn in file order; every one turns with the aim. How a layer opens (open = 0
// shut .. 1 fully open):
//   data-role="rotating": turns about the pivot by data-open-angle degrees (ratchet pruners: each part its own angle),
//     or by data-open-sign x the weapon's maxOpenDeg (older art: plain two-blade scissors)
//   data-role="sliding":  moves by data-open-x / data-open-y SVG units (cigar cutter)
//   anything else stays fixed.
// A group without a data-role that wraps moving parts is split into its children (its attributes still apply). If it
// has a circular clip-path, that clip is re-applied to each child while drawing, so the hole stays put while the parts
// inside it slide. The whole weapon can also turn with the opening (aimOffsetDeg + aimOffsetOpenDeg x open), which
// lines up art whose gap isn't symmetric about its own axis with the aim.
// Called only from render.js / main.js.
import { CONFIG as C } from './config.js';
import { view, TAU, DEG } from './core.js';
import { weapon, scaleFor } from './scissors.js';

// id -> { state: 'loading' | 'svg' | 'fallback', layers: [{ openDeg, sign, slideX, slideY, clip, moves, markup, canvas }], ready, gen }
const arts = {};
export const art = { get state() { const a = arts[weapon.id]; return a ? a.state : 'loading'; } };

function fetchText(url) {
  return fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
}

// Fetch and split every weapon's SVG once; the current one is rasterized as soon as it arrives.
export function preloadWeapons() {
  for (const id in C.weapons) {
    if (arts[id]) continue;
    const a = arts[id] = { state: 'loading', layers: null, ready: false, gen: 0 };
    fetchText(C.weapons[id].svg).then(text => {
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (doc.getElementsByTagName('parsererror').length) throw new Error('SVG parse error');
      a.layers = splitLayers(doc);
      if (!a.layers.length) throw new Error('no layers');
      if (id === weapon.id) rasterizeArt(id);
    }).catch(err => {
      console.warn(C.weapons[id].svg + ' unavailable, using line-drawn fallback:', err.message);
      a.state = 'fallback';
    });
  }
}

const NOT_DRAWN = new Set(['defs', 'title', 'desc', 'metadata', 'clipPath', 'style', 'script']);
function splitLayers(doc) {
  const ser = new XMLSerializer(), defs = doc.querySelector('defs'), defsStr = defs ? ser.serializeToString(defs) : '';
  const layers = [];
  const legacySign = el => el.id === 'blade-left' ? -1 : el.id === 'blade-right' ? 1 : 0;   // older art without data-role
  function visit(el, shells, clip) {
    if (NOT_DRAWN.has(el.tagName)) return;
    const role = el.getAttribute('data-role');
    if (el.tagName === 'g' && !role && !legacySign(el) && el.querySelector('[data-role]')) {
      let c = clip;
      const circle = circleClip(doc, el.getAttribute('clip-path'));
      if (circle) { c = circle; el.removeAttribute('clip-path'); }
      const shell = el.cloneNode(false); shell.removeAttribute('id');
      const open = ser.serializeToString(shell).replace(/\/>$/, '>').replace(/><\/g>$/, '>');
      for (const child of el.children) visit(child, [...shells, open], c);
      return;
    }
    const layer = { openDeg: null, sign: 0, slideX: 0, slideY: 0, clip, moves: false, markup: '', canvas: null };
    if (role === 'rotating') {
      if (el.hasAttribute('data-open-angle')) layer.openDeg = Number(el.getAttribute('data-open-angle')) || 0;
      else layer.sign = Number(el.getAttribute('data-open-sign')) || 0;
    } else if (role === 'sliding') {
      layer.slideX = Number(el.getAttribute('data-open-x')) || 0; layer.slideY = Number(el.getAttribute('data-open-y')) || 0;
    } else if (!role) layer.sign = legacySign(el);
    layer.moves = !!(layer.openDeg || layer.sign || layer.slideX || layer.slideY);
    if (layer.moves) el.removeAttribute('transform');                // we set the opening ourselves
    let markup = ser.serializeToString(el);
    for (let i = shells.length - 1; i >= 0; i--) markup = shells[i] + markup + '</g>';
    layer.markup = defsStr + markup;
    layers.push(layer);
  }
  for (const el of doc.documentElement.children) if (el.tagName === 'g') visit(el, [], null);
  return layers;
}
// clip-path="url(#id)" pointing at a clipPath that is a single circle -> { cx, cy, r } in SVG units, else null
function circleClip(doc, ref) {
  const m = ref && /url\(#([^)]+)\)/.exec(ref), cp = m && doc.getElementById(m[1]);
  if (!cp || cp.children.length !== 1 || cp.children[0].tagName !== 'circle') return null;
  const c = cp.children[0];
  return { cx: Number(c.getAttribute('cx')) || 0, cy: Number(c.getAttribute('cy')) || 0, r: Number(c.getAttribute('r')) || 0 };
}

// Handle cosmetic (render.js sets it from the save): every weapon's handles are tinted this colour when rasterized
// ('' = none). The handles are the part of the art below the pivot (tips point up), or for a slide weapon the parts
// out beyond its hole.
let handleTint = '';
export function setHandleTint(color) {
  if (color === handleTint) return false;
  handleTint = color;
  return true;
}
function tintHandles(g, def, pw, ph) {
  const k = pw / def.viewW, vx = def.viewX || 0, vy = def.viewY || 0;
  g.save();
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = C.meta.handleTint; g.fillStyle = handleTint;
  if (def.kind === 'slide') {
    const edge = def.bladeLen * 1.3;
    g.fillRect(0, 0, (def.pivotX - vx - edge) * k, ph);
    g.fillRect((def.pivotX - vx + edge) * k, 0, pw, ph);
  } else g.fillRect(0, (def.pivotY - vy + def.bladeLen * 0.12) * k, pw, ph);
  g.restore();
}

// Rasterize a weapon's layers (default: the current one) into offscreen canvases at its exact on-screen size (called
// on resize and weapon change). The previous canvases stay in use until the new set is complete.
export function rasterizeArt(id = weapon.id) {
  const def = id === weapon.id ? weapon.def : C.weapons[id], a = arts[id];
  if (!def || !a || !a.layers) return;
  const gen = ++a.gen, S = id === weapon.id ? view.S : scaleFor(def);   // the current one at its in-game size (view.Z)
  const pw = Math.max(1, Math.round(def.viewW * S * view.dpr)), ph = Math.max(1, Math.round(def.viewH * S * view.dpr));
  const out = [];
  let pending = a.layers.length;
  a.layers.forEach((layer, i) => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (def.viewX || 0) + ' ' + (def.viewY || 0) + ' ' + def.viewW + ' ' + def.viewH +
      '" width="' + pw + '" height="' + ph + '">' + layer.markup + '</svg>';
    const img = new Image();
    img.onload = () => {
      if (gen !== a.gen) return;
      const c = document.createElement('canvas');
      c.width = pw; c.height = ph;
      c.getContext('2d').drawImage(img, 0, 0, pw, ph);
      if (handleTint) tintHandles(c.getContext('2d'), def, pw, ph);
      out[i] = c;
      if (--pending === 0) { a.layers.forEach((l, j) => { l.canvas = out[j]; }); a.ready = true; a.state = 'svg'; }
    };
    img.onerror = () => { if (gen === a.gen && !a.ready) { a.state = 'fallback'; console.warn('weapon layer failed to rasterize'); } };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  });
}

// Plain steel scissors in the weapon's proportions (a ring for a slide weapon), shown until (or instead of) the SVG art.
function drawFallback(ctx, def, theta, open, alpha, S) {
  const L = def.bladeLen, H = (def.viewH - def.pivotY) * 0.8, a = open * def.maxOpenDeg * DEG;
  if (def.kind === 'slide') {
    ctx.globalAlpha = alpha; ctx.strokeStyle = '#c9d4db'; ctx.lineWidth = L * 0.35 * S;
    ctx.beginPath(); ctx.arc(0, 0, L * 1.15 * S, 0, TAU); ctx.stroke();
    return;
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const sgn of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = alpha; ctx.rotate(theta + sgn * a); ctx.scale(S, S);
    ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(sgn * L * 0.08, -L * 0.25); ctx.lineTo(0, 0); ctx.closePath();
    ctx.fillStyle = '#c9d4db'; ctx.fill(); ctx.strokeStyle = '#2b3a45'; ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-sgn * L * 0.16, H * 0.8); ctx.lineWidth = 16; ctx.stroke();
    ctx.beginPath(); ctx.arc(-sgn * L * 0.18, H * 0.8 + L * 0.1, L * 0.1, 0, TAU); ctx.lineWidth = 10; ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = alpha; ctx.fillStyle = '#d2a350';
  ctx.beginPath(); ctx.arc(0, 0, L * 0.06 * S, 0, TAU); ctx.fill();
}

// pose = {x, y, theta}, open = opening 0 (shut) .. 1 (fully open), alpha = fade, flashT = snip flash 0..1,
// shakeT = "too slow" wobble 0..1, S = SVG units -> px (defaults to the game scale view.S), id = which weapon
// (default: the current one; it must have been rasterized with rasterizeArt(id))
export function drawWeapon(ctx, pose, open, alpha, flashT, shakeT, S = view.S, id = weapon.id) {
  const def = id === weapon.id ? weapon.def : C.weapons[id], art = arts[id];
  if (alpha <= 0.001 || !def) return;
  const vx = def.viewX || 0, vy = def.viewY || 0, ox = def.pivotX - vx, oy = def.pivotY - vy;   // pivot within the rasterized box
  const turn = pose.theta + ((def.aimOffsetDeg || 0) + (def.aimOffsetOpenDeg || 0) * open) * DEG;
  let px = pose.x, py = pose.y;
  if (shakeT > 0) {                                             // "too slow": wobble across the aim
    const o = Math.sin(shakeT * Math.PI * 7) * C.shakePx * shakeT;
    px += Math.cos(pose.theta) * o; py += Math.sin(pose.theta) * o;
  }
  ctx.save();
  ctx.translate(px, py);
  if (art && art.ready) {
    for (const layer of art.layers) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.rotate(turn + (layer.openDeg !== null ? layer.openDeg : layer.sign * def.maxOpenDeg) * open * DEG);
      ctx.scale(S, S);
      ctx.translate(-ox, -oy);
      if (layer.clip) { ctx.beginPath(); ctx.arc(layer.clip.cx - vx, layer.clip.cy - vy, layer.clip.r, 0, TAU); ctx.clip(); }   // fixed window
      if (layer.slideX || layer.slideY) ctx.translate(layer.slideX * open, layer.slideY * open);
      ctx.drawImage(layer.canvas, 0, 0, def.viewW, def.viewH);
      if (flashT > 0 && layer.moves) {                          // snip flash: the moving parts glow white-hot
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * flashT * 0.7;
        ctx.drawImage(layer.canvas, 0, 0, def.viewW, def.viewH);
      }
      ctx.restore();
    }
  } else drawFallback(ctx, def, turn, open, alpha, S);
  ctx.restore();
}
