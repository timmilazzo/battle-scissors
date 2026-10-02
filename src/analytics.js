// Anonymous play data and the feedback card's messages, posted to PostHog's capture endpoint with plain fetch (no SDK).
// Events carry a random id kept in the save (never a name, email or IP we store) and no person profile is created.
// Settings has a "Share play data" switch (Save.settings.analytics); it stops every event here except a feedback
// message, which the player sends on purpose. Without ANALYTICS_KEY (config.js) nothing is ever sent. Never throws.
import { ANALYTICS_HOST, ANALYTICS_KEY, VERSION } from './config.js';
import { Save, persist } from './save.js';

function anonId() {
  if (!Save.anonId) {
    Save.anonId = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'a' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    persist();
  }
  return Save.anonId;
}

// What every event carries: build, where it's running, and the screen (to tell phones from desktops).
function base() {
  return {
    $process_person_profile: false, version: VERSION, host: location.hostname, controls: Save.settings.grip,
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0, screen: innerWidth + 'x' + innerHeight,
    standalone: !!(navigator.standalone || (matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches)),
    device: navigator.userAgent,
  };
}

function post(event, props) {
  if (!ANALYTICS_KEY) return Promise.resolve(false);
  const body = JSON.stringify({ api_key: ANALYTICS_KEY, event, distinct_id: anonId(), timestamp: new Date().toISOString(), properties: { ...base(), ...props } });
  return fetch(ANALYTICS_HOST + '/i/v0/e/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    .then(r => r.ok, () => false);
}

export const analyticsOn = () => !!ANALYTICS_KEY && Save.settings.analytics !== false;

// Fire and forget. No-op when the player has turned sharing off.
export function track(event, props) {
  if (!analyticsOn()) return;
  try { post(event, props); } catch (e) { /* analytics must never break play */ }
}

// A run started / ended (the report is game.js's buildReport; the long config snapshot and replay link stay out).
// outcome: won / lost / quit (left mid-run: to the map or title, or restarted).
export function trackRunStart(levelId, weapon) { track('run_started', { level: levelId, weapon }); }
export function trackRunEnd(r) {
  track('run_ended', {
    outcome: r.inProgress ? 'quit' : r.won ? 'won' : 'lost', level: r.level, weapon: r.weapon, won: !!r.won && !r.inProgress, waves_reached: r.wavesReached, score: r.score, stars: r.stars, snips: r.snips, kills: r.kills,
    accuracy: r.accuracy, multi_snips: r.multiSnips, shred_uses: r.specialUses, leaks: r.deathsAtWorkshop, boss: r.boss,
    pins_built: Object.values(r.towers || {}).reduce((a, b) => a + (b | 0), 0), rank_ups: r.rankUps, critter_kills: r.critterKills, critter_spawns: r.critterSpawns,
    upgrade_tier: r.upgradeTier, sharpness: r.sharpness, duration_sec: r.durationSec, buttons_earned: r.buttons ? r.buttons.total : 0, seed: r.seed,
  });
}

// The feedback card's Send: resolves true once PostHog accepted it. Ignores the sharing switch (the player chose to send).
export function sendFeedback(props) { return post('feedback_submitted', props).catch(() => false); }
