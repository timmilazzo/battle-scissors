// The Endless leaderboard's client (no DOM): plain fetch to Supabase, no client library. The player is a Supabase
// anonymous user, signed in the first time they post (a later Apple / Google sign-in can link to it); its refresh
// token and id live in the save (Save.account), the short-lived access token only in memory. Everything else goes
// through the `leaderboard` Edge Function (supabase/functions/leaderboard): name (checked there), score, top.
// Every call resolves to the function's { ok, ... } reply, or { ok: false, reason } on a network failure; never throws.
import { SUPABASE_URL, SUPABASE_KEY, VERSION } from './config.js';
import { Save, persist } from './save.js';

export const leaderboardOn = () => !!(SUPABASE_URL && SUPABASE_KEY);
export const playerName = () => Save.account.name;

let access = '', accessUntil = 0;

async function authPost(path, body) {
  const r = await fetch(SUPABASE_URL + '/auth/v1/' + path, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('auth ' + r.status); e.status = r.status; throw e; }
  return j;
}

// A valid access token: the cached one, else refreshed, else a new anonymous user (only when the stored refresh token
// is rejected or there is none; a network failure is thrown, so a flaky connection never starts a fresh account).
async function token() {
  if (access && Date.now() < accessUntil - 60000) return access;
  const A = Save.account;
  let s = null;
  if (A.refresh) {
    try { s = await authPost('token?grant_type=refresh_token', { refresh_token: A.refresh }); }
    catch (e) { if (e.status !== 400 && e.status !== 401) throw e; A.name = ''; }   // the old account is gone: pick a name again
  }
  if (!s) s = await authPost('signup', {});                       // anonymous sign-in
  access = s.access_token; accessUntil = Date.now() + (s.expires_in || 3600) * 1000;
  A.refresh = s.refresh_token; A.userId = s.user ? s.user.id : A.userId;
  persist();
  return access;
}

async function call(route, body, signedIn = true) {
  try {
    const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (signedIn) headers.Authorization = 'Bearer ' + await token();
    const r = await fetch(SUPABASE_URL + '/functions/v1/leaderboard/' + route, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
    return await r.json().catch(() => ({ ok: false, reason: 'The leaderboard sent a bad reply.' }));
  } catch (e) {
    return { ok: false, reason: 'No connection to the leaderboard.' };
  }
}

// Pick the player's name (once). Resolves { ok, name } or { ok: false, reason } (reason is for the player).
export async function claimName(name) {
  const j = await call('name', { name });
  if (j.ok) { Save.account.name = j.name; persist(); }
  return j;
}

// Post an endless run (game.js buildReport). Resolves { ok, rank, total, best } or { ok: false, reason }.
export function submitRun(report) {
  return call('score', { waves: report.wavesSurvived | 0, kills: report.kills | 0, score: report.score | 0, seed: report.seed,
    durationSec: report.durationSec | 0, version: VERSION });
}

// The top 50 (and the player's own rank, once they have an account). Viewing never creates an account.
export const topScores = () => call('top', null, !!Save.account.refresh);
