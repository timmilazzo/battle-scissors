// Entry point: apply saved debug overrides, pick the remembered weapon, wire input and screens (title, action bar,
// coach, pause, mute, run report) to the game, size the canvas, load weapon art, then run the loop: update then draw every frame.
import { CONFIG as C, FEEDBACK_URL, VERSION } from './config.js';
import { input, initInput, setControls } from './input.js';
import { state, gameHooks, goTitle, goSelect, goSettings, startGame, selectWeapon, setLevel, nextLevelId, layout, update, lastReport,
  tutSkip, tutSkipAll, setPaused, togglePause, reportNow } from './game.js';
import { weapon, setWeapon } from './scissors.js';
import { view } from './core.js';
import { draw, sizeCanvas, prerender } from './render.js';
import { art, preloadWeapons, rasterizeArt } from './weaponArt.js';
import { applySavedOverrides, initDebug } from './debug.js';
import { savedWeapon, initWeaponSelect } from './weaponSelect.js';
import { savedLevel, initLevelSelect, select as selectLevelCard } from './levelSelect.js';
import { isMuted, setMuted, unlockAudio, sfx } from './audio.js';
import { loadRuns, copyText, downloadJson } from './runlog.js';
import { initActionBar, refreshActionBar, measureActionBar, buildSpotButtons } from './actionBar.js';
import { refreshHud } from './hud.js';

applySavedOverrides();
// The canvas draws banners and labels in the felt font (Lilita One, index.html); ask for it now so it's ready.
if (document.fonts) document.fonts.load('400 32px "Lilita One"').catch(() => {});
setWeapon(savedWeapon());
setLevel(savedLevel());
initInput(gameHooks);
document.getElementById('reset').addEventListener('click', e => { e.stopPropagation(); goTitle(); });

// Resize: canvas size -> weapon scale + level (plate scale, road path, Pin spots) -> backdrop, enemy + Pin sprites,
// weapon art -> the + buttons and action bar.
function resize() { sizeCanvas(); layout(); prerender(); measureActionBar(); }

// Placeholder title buttons (data-soon="Label") just say "coming soon".
const toast = document.getElementById('toast');
let toastTimer = 0;
function showToast(text) {
  toast.textContent = text; toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, C.toastMs);
}
const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
// Every menu button is a user gesture, so each one also unlocks audio (browsers keep it suspended until then).
const play = () => { unlockAudio(); toast.hidden = true; startGame(); };
on('play', () => { unlockAudio(); toast.hidden = true; goSelect(); });
on('how', () => { unlockAudio(); toast.hidden = true; startGame({ tutorial: true }); });
on('again', play);
// Settings (title's gear icon): touch control mode (input.js remembers it) and sound.
on('title-settings', () => { unlockAudio(); toast.hidden = true; goSettings(); });
on('settings-back', goTitle);
document.getElementById('version').textContent = 'v' + VERSION;
const ctlBtns = document.querySelectorAll('[data-controls]');
function showControls() { for (const b of ctlBtns) b.setAttribute('aria-checked', String(b.dataset.controls === input.controls)); }
for (const b of ctlBtns) b.addEventListener('click', () => { setControls(b.dataset.controls); showControls(); });
showControls();
initWeaponSelect({ onPick: id => { selectWeapon(id); rasterizeArt(); }, onStart: play, onBack: goTitle });
// Level picker (same screen): switch the plate, road(s) and Pin spots, then re-run the resize chain for the new plate.
function switchLevel(id) { setLevel(id); buildSpotButtons(); resize(); }
initLevelSelect({ current: view.levelId, onPick: switchLevel });
// Win card: NEXT LEVEL plays the following level with the same weapon; "Change level or shears" opens the select screen.
on('next', () => { const id = nextLevelId(); if (!id) return; selectLevelCard(id); switchLevel(id); play(); });
on('over-select', () => { unlockAudio(); toast.hidden = true; goSelect(); });
// Pressing anywhere on the title snaps its scissors shut (render.js) with a snip; it's also a gesture that unlocks audio.
document.getElementById('title').addEventListener('pointerdown', () => { unlockAudio(); sfx('snip'); });
for (const b of document.querySelectorAll('[data-soon]')) b.addEventListener('click', () => showToast(b.dataset.soon + ': coming soon'));

// Mute: the top-bar button (game-over only), the pause and settings cards' Sound buttons and the title's Sound icon; persisted by audio.js.
const muteBtn = document.getElementById('mute'), titleSound = document.getElementById('title-sound'), pauseSound = document.getElementById('pause-sound'),
  settingsSound = document.getElementById('settings-sound');
function showMute() {
  const m = isMuted();
  muteBtn.setAttribute('aria-pressed', String(m));                    // the icon swaps on aria-pressed (CSS)
  muteBtn.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
  titleSound.classList.toggle('muted', m); titleSound.setAttribute('aria-pressed', String(m));
  for (const b of [pauseSound, settingsSound]) { b.textContent = m ? 'Sound: off' : 'Sound: on'; b.setAttribute('aria-pressed', String(m)); }
}
const toggleMute = e => { e.stopPropagation(); unlockAudio(); setMuted(!isMuted()); showMute(); };
muteBtn.addEventListener('click', toggleMute);
titleSound.addEventListener('click', e => { toggleMute(e); showToast(isMuted() ? 'Sound off' : 'Sound on'); });
pauseSound.addEventListener('click', toggleMute);
settingsSound.addEventListener('click', toggleMute);
showMute();

// Onboarding coach skip links.
on('coach-skip', e => { e.stopPropagation(); tutSkip(); });
on('coach-skip-all', e => { e.stopPropagation(); tutSkipAll(); });

// Action bar (thread + SHRED), the Pin spots' + buttons and picker, and their tips.
initActionBar({ toast: showToast });

// Pause: the ⏸ button, P / Esc, or leaving the tab/app mid-run. RESUME (or ⏸ again) continues.
const pauseBtn = document.getElementById('pause');
pauseBtn.addEventListener('click', e => { e.stopPropagation(); togglePause(); });
on('resume', () => setPaused(false));
on('pause-home', e => { e.stopPropagation(); goTitle(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

// Run report (pause card mid-run, GAME_OVER / win card at the end) and the debug panel's export.
// The only outbound action is opening FEEDBACK_URL.
for (const b of document.querySelectorAll('[data-copy-report]')) b.addEventListener('click', () => {
  const report = state.paused ? reportNow() : lastReport;
  if (!report) return;
  copyText(JSON.stringify(report)).then(ok => showToast(ok ? 'Run report copied' : 'Copy failed: clipboard blocked'));
});
// A mailto: FEEDBACK_URL opens a draft email: subject with the outcome, room for comments, then the run report (the
// same JSON as Copy run report). Some mail apps cut very long links, so the report is compact JSON.
function feedbackMail(report) {
  const what = report ? (report.won ? 'won' : report.inProgress ? 'wave ' + report.wavesReached + ', mid-run' : 'lost on wave ' + report.wavesReached) + ', ' + report.weapon : 'no run yet';
  const body = 'What happened, what felt good or off:\n\n\n\n---\nRun report (please leave this in):\n' + (report ? JSON.stringify(report) : '(none)');
  return FEEDBACK_URL + '?subject=' + encodeURIComponent('Battle Scissors feedback (' + what + ')') + '&body=' + encodeURIComponent(body);
}
for (const b of document.querySelectorAll('[data-send-feedback]')) b.addEventListener('click', () => {
  if (!FEEDBACK_URL) { showToast('No feedback link set (FEEDBACK_URL in config.js)'); return; }
  if (FEEDBACK_URL.startsWith('mailto:')) { location.href = feedbackMail(state.paused ? reportNow() : lastReport); showToast('Opening your email app…'); }
  else window.open(FEEDBACK_URL, '_blank', 'noopener');
});

// Readout for the debug panel (snip-feel numbers and the run seed).
function debugInfo() {
  const last = input.last;
  return 'state ' + state.mode + '  ' + view.levelId + '  ' + weapon.id + ' art ' + art.state + '\nseed ' + state.seed + '  spread ' + Math.round(input.rawSpread * 100) + '%' +
    (last.ms < 0 ? '' : '\nlast ' + last.kind + ' ' + last.speed.toFixed(1) + '/s ' + Math.round(last.ms) + 'ms' +
      (last.kind === 'too slow' ? '' : ' pow ' + Math.round(last.power * 100) + '%'));
}

// ======================= loop =======================
const loopStats = { fps: 0 };
let pauseShown = false;
let lastT = 0, fpsFrames = 0, fpsT0 = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = lastT ? (now - lastT) / 1000 : 1 / 60;
  lastT = now;
  if (dt > 0.05) dt = 0.05;
  update(now, dt);
  draw(state);
  refreshActionBar();
  refreshHud();
  if (pauseShown !== state.paused) { pauseShown = state.paused; pauseBtn.setAttribute('aria-pressed', String(state.paused)); pauseBtn.setAttribute('aria-label', state.paused ? 'Resume' : 'Pause'); }
  fpsFrames++;                                                  // FPS for the debug panel (measured, not smoothed by dt clamp)
  if (now - fpsT0 >= 500) { loopStats.fps = fpsFrames * 1000 / (now - fpsT0); fpsFrames = 0; fpsT0 = now; }
}

initDebug({ resize, loopStats, getInfo: debugInfo, onExportRuns: () => downloadJson('battle-scissors-runs.json', loadRuns()) });

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();
preloadWeapons();
goTitle();
requestAnimationFrame(frame);
