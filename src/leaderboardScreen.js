// The Random Quilt leaderboard's screens (DOM; the network side is leaderboard.js). Three places:
// - the results card of an endless run (#res-lb): posts the run when the player has a name and shows the rank;
//   the first time, "Put this run on the leaderboard?" opens the name card and posts once a name is taken
// - the name card (#lb-name): picked once; starts on a made-up name (names.js), 🎲 rolls another, a typed one is
//   checked on the server (its reason shows under the field when it's turned down)
// - the list (#lb): the top 50 best runs, the player's row marked, their rank under it when they're further down
// Opened from the results line and the weapon screen's Leaderboard button (#select-lb, endless levels only).
import { leaderboardOn, playerName, claimName, submitRun, topScores } from './leaderboard.js';
import { randomName } from './names.js';
import { unlockAudio, sfx } from './audio.js';

const $ = id => document.getElementById(id);
const res = $('res-lb'), resTxt = res.querySelector('span'), resBtn = $('res-lb-btn');
const nameCard = $('lb-name'), nameIn = $('lb-name-input'), nameErr = $('lb-name-err'), nameOk = $('lb-name-ok');
const board = $('lb'), list = $('lb-list'), status = $('lb-status'), meLine = $('lb-me'), selectBtn = $('select-lb');
let pending = null;            // the endless run waiting for a name, posted once one is taken
let resAct = 'board';          // what the results line's button does: 'name' (pick a name and post) or 'board'

export function initLeaderboardScreens() {
  resBtn.addEventListener('click', e => { e.stopPropagation(); unlockAudio(); if (resAct === 'name') openNameCard(); else openBoard(); });
  selectBtn.addEventListener('click', () => { unlockAudio(); openBoard(); });
  $('lb-back').addEventListener('click', () => { board.hidden = true; });
  $('lb-name-dice').addEventListener('click', () => { nameIn.value = randomName(nameIn.value); nameErr.hidden = true; sfx('pinPop', 0); });
  $('lb-name-cancel').addEventListener('click', () => { nameCard.hidden = true; });
  nameIn.addEventListener('input', () => { nameErr.hidden = true; });
  nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') takeName(); else if (e.key === 'Escape') nameCard.hidden = true; });
  nameOk.addEventListener('click', takeName);
}

// The weapon screen: the Leaderboard button only on an endless level, and only with a leaderboard configured.
export function showSelectLeaderboard(endless) { selectBtn.hidden = !(endless && leaderboardOn()); }

// An endless run just ended (main.js run-end hook, report = game.js lastReport).
export function endlessRunEnded(report) {
  res.hidden = !leaderboardOn();
  if (res.hidden) return;
  if (playerName()) { pending = null; post(report); }
  else { pending = report; line('Put this run on the leaderboard?', 'Post it', 'name'); }
}
// Any other run: no leaderboard line.
export function hideRunLine() { res.hidden = true; pending = null; }

function line(text, btn, act) { resTxt.textContent = text; resBtn.textContent = btn; resAct = act; resBtn.disabled = false; }

async function post(report) {
  line('Posting your run…', 'Leaderboard', 'board');
  const j = await submitRun(report);
  if (j.ok && j.rank) line('#' + j.rank + ' of ' + j.total + ' on the leaderboard as ' + playerName() + '.', 'Leaderboard', 'board');
  else line(j.reason || 'Couldn\'t post this run.', 'Leaderboard', 'board');
}

function openNameCard() {
  nameIn.value = playerName() || randomName();
  nameErr.hidden = true; nameOk.disabled = false; nameOk.textContent = "THAT'S ME";
  nameCard.hidden = false;
}

async function takeName() {
  const name = nameIn.value.replace(/\s+/g, ' ').trim();
  if (name.length < 2) { nameErr.textContent = 'Names are 2 to 20 letters long.'; nameErr.hidden = false; return; }
  nameOk.disabled = true; nameOk.textContent = 'CHECKING…';
  const j = await claimName(name);
  nameOk.disabled = false; nameOk.textContent = "THAT'S ME";
  if (!j.ok) { nameErr.textContent = j.reason || 'That name can\'t be used.'; nameErr.hidden = false; return; }
  nameCard.hidden = true; sfx('pinPop', 0);
  if (pending) { const r = pending; pending = null; post(r); }
}

async function openBoard() {
  board.hidden = false; list.textContent = ''; meLine.hidden = true; status.textContent = 'Loading…';
  const j = await topScores();
  if (!j.ok) { status.textContent = j.reason || 'Couldn\'t load the leaderboard.'; return; }
  status.textContent = j.top.length ? '' : 'No runs yet. Be the first!';
  let meShown = false;
  for (const r of j.top) {
    const li = document.createElement('li');
    li.className = r.me ? 'me' : '';
    li.innerHTML = '<span class="rk"></span><span class="nm"></span><span class="st"><b></b> · <span></span></span>';
    li.children[0].textContent = '#' + r.rank; li.children[1].textContent = r.name;
    li.querySelector('.st b').textContent = String(r.score);
    li.querySelector('.st span').textContent = r.waves + ' waves · ' + r.kills + ' kills';
    list.appendChild(li);
    if (r.me) meShown = true;
  }
  if (j.me && !meShown) { meLine.hidden = false; meLine.textContent = 'You: #' + j.me.rank + ' of ' + j.me.total + ' · ' + j.me.score + ' (' + j.me.waves + ' waves)'; }
}
