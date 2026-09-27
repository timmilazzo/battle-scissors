// Dev tool (not deployed): plays a level headless in the page to check critter spawns and the silverfish skitter.
// Load the game with ?level=<id>&seed=<n>, then in the console:
//   const m = await import('/tools/critter-bot.js'); await m.run({ skitter: true })
// It pauses the real frame loop and steps game.update() itself at 60 fps (as fast as it can), keeps the workshop
// alive (so every wave plays out), and plays a Hold-style player who only goes for silverfish: 0.3s after one
// appears it presses where the silverfish will be when it lets go (leading it by its current velocity), holding
// 0.5..1.4 x openMs (players differ), lets go; if it missed and the silverfish is still on screen, it tries again. Returns a log of
// every spawn (wave, wave clock, enemies on screen) and every attempt (hit / miss, whether it skittered).
import { CONFIG as C } from '../src/config.js';
import { view } from '../src/core.js';
import { input } from '../src/input.js';
import { weapon, bladeReachPx } from '../src/scissors.js';
import { state, update, startGame } from '../src/game.js';
import { plan } from '../src/critters.js';

export async function run({ skitter = true, aimNoisePx = 12, maxSec = 400, botSeed = 12345 } = {}) {
  const F = C.critters.silverfish, keepSkitter = F.skitterPx;
  if (!skitter) F.skitterPx = -1;
  let rs = botSeed >>> 0; const rnd = () => (rs = (rs * 1103515245 + 12345) >>> 0) / 4294967296;
  const noise = () => (rnd() + rnd() + rnd() - 1.5) * aimNoisePx;
  const mouse = input.mouse;
  startGame();
  const log = { level: view.levelId, seed: state.seed, weapon: weapon.id, skitter, spawns: [], attempts: [], stars: 0, kills: 0 };
  const dt = 1 / 60, openT = weapon.def.openMs / 1000;
  let now = performance.now(), t = 0;
  const seen = new Map();                                       // critter object -> tracking record
  let bot = { phase: 'idle', c: null, t: 0, attempt: 0, skBefore: false, killsBefore: 0 };
  const onScreenEnemies = () => state.enemies.filter(e => e.on && e.y > -e.r && e.y < view.H + e.r && e.x > -e.r && e.x < view.W + e.r).length;
  state.paused = true;
  while (state.mode !== 'GAME_OVER' && t < maxSec) {
    for (const c of state.critters) {
      if (c.on && !seen.has(c)) {
        seen.set(c, { px: c.x, py: c.y, vx: 0, vy: 0, id: log.spawns.length, gen: true });
        log.spawns.push({ t: +t.toFixed(2), wave: state.wave, waveT: +state.modeT.toFixed(2), onScreen: onScreenEnemies(), intro: c.intro, onRoad: c.onRoad, mode: state.mode });
      }
      if (!c.on && seen.has(c)) seen.delete(c);
      const r = seen.get(c);
      if (r) { r.vx = (c.x - r.px) / dt; r.vy = (c.y - r.py) / dt; r.px = c.x; r.py = c.y; }
    }
    // the bot
    const inView = c => c.on && c.x > 0 && c.x < view.W && c.y > 0 && c.y < view.H * 0.9;
    if (bot.phase === 'idle') {
      const c = state.critters.find(o => inView(o) && seen.has(o) && (seen.get(o).tries || 0) < 3);
      if (c) bot = { phase: 'react', c, t: 0.3, attempt: (seen.get(c).tries || 0) + 1, skBefore: c.skittered, killsBefore: plan.killed };
      mouse.inside = false;
    } else if (bot.phase === 'react') {
      if ((bot.t -= dt) <= 0) {
        const c = bot.c, r = seen.get(c);
        if (!c.on) bot.phase = 'idle';
        else {
          const holdT = openT * (0.5 + 0.9 * rnd()), lead = holdT + 0.05;   // players hold for different lengths
          bot.hold = holdT;
          const px = c.x + r.vx * lead + noise(), py = c.y + r.vy * lead + noise();
          mouse.x = px; mouse.y = py + C.pivotOffsetPx + bladeReachPx() * 0.6; mouse.rot = 0; mouse.dist = C.closedDistPx;
          mouse.inside = true; mouse.held = true; input.mouse.used = true;
          bot.phase = 'hold'; bot.t = bot.hold; r.tries = bot.attempt;
        }
      }
    } else if (bot.phase === 'hold') {
      if ((bot.t -= dt) <= 0) { mouse.held = false; mouse.dist = C.closedDistPx; bot.phase = 'after'; bot.t = 0.1; }
    } else if (bot.phase === 'after') {
      if ((bot.t -= dt) <= 0) {
        const hit = plan.killed > bot.killsBefore;
        log.attempts.push({ fish: seen.get(bot.c) ? seen.get(bot.c).id : log.spawns.length - 1, attempt: bot.attempt, hit,
          skitteredDuring: !bot.skBefore && bot.c.skittered, skitteredBefore: bot.skBefore });
        mouse.inside = false; bot.phase = 'idle';
      }
    }
    state.hp = C.workshopHp;                                    // keep the workshop alive: every wave plays out
    state.paused = false; now += dt * 1000; update(now, dt); state.paused = true; t += dt;
    if (((t * 60) | 0) % 600 === 0) await new Promise(r => setTimeout(r, 0));
  }
  F.skitterPx = keepSkitter;
  state.paused = false;
  log.stars = state.run.stars; log.kills = state.run.critterKills; log.spawned = plan.spawned; log.cap = plan.cap; log.endedAt = +t.toFixed(1); log.mode = state.mode;
  return log;
}
