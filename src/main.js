// Entry point: apply saved debug overrides, pick the remembered weapon, wire input and screens (title, action bar,
// coach, pause, mute, run report) to the game, size the canvas, load weapon art, then run the loop: update then draw every frame.
import { CONFIG as C, FEEDBACK_URL, VERSION } from './config.js';
import { input, initInput, setControls } from './input.js';
import { state, gameHooks, goTitle, goMap, goSelect, goSettings, startGame, selectWeapon, setLevel, setLevelHook, setTutorialDoneHook, setRunEndHook, nextLevelId, layout, update, lastReport,
  tutSkip, setPaused, togglePause, reportNow } from './game.js';
import { weapon, setWeapon } from './scissors.js';
import { view } from './core.js';
import { draw, sizeCanvas, prerender } from './render.js';
import { art, preloadWeapons, rasterizeArt } from './weaponArt.js';
import { applySavedOverrides, initDebug } from './debug.js';
import { savedWeapon, initWeaponSelect, refreshWeaponSelect } from './weaponSelect.js';
import { savedLevel, rememberLevel, levelLabel } from './levelSelect.js';
import { levelIds, levelInfo } from './levels/index.js';
import { Save, persist, wipeSave, unlockAll } from './save.js';
import { initLevelMap, refreshLevelMap } from './levelMap.js';
import { isMuted, setMuted, unlockAudio, sfx } from './audio.js';
import { loadRuns, copyText, downloadJson } from './runlog.js';
import { initActionBar, refreshActionBar, measureActionBar, buildSpotButtons } from './actionBar.js';
import { refreshHud } from './hud.js';
import { showResults } from './results.js';
import { initShop, openShop, openTrophies } from './shop.js';
import { initArmory, openArmory } from './armory.js';
import { buySharpen } from './meta.js';

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
// PLAY: level 0 (the tutorial) until it has been cleared once, then the level map. How to play: level 0 again.
on('play', () => { unlockAudio(); toast.hidden = true; if (Save.tutorialDone) openMap(); else playTutorial(); });
on('how', () => { unlockAudio(); toast.hidden = true; playTutorial(); });
on('again', play);
// Settings (title's gear icon): touch control mode (input.js remembers it) and sound.
on('title-settings', () => { unlockAudio(); toast.hidden = true; goSettings(); });
on('settings-back', goTitle);
document.getElementById('version').textContent = 'v' + VERSION;
const ctlBtns = document.querySelectorAll('[data-controls]');
function showControls() { for (const b of ctlBtns) b.setAttribute('aria-checked', String(b.dataset.controls === input.controls)); }
for (const b of ctlBtns) b.addEventListener('click', () => { setControls(b.dataset.controls); showControls(); });
showControls();
// The quick Sharpen on the weapon screen (a failed one says why).
const sharpenFail = { buttons: 'Not enough Buttons', sharp: 'Already sharp', locked: 'Not yours yet' };
initWeaponSelect({ onPick: id => { selectWeapon(id); rasterizeArt(); }, onStart: play, onBack: () => openMap(),
  onSharpen: id => { unlockAudio(); const why = buySharpen(id); if (why) showToast(sharpenFail[why] || why); else sfx('pinPop', 0); return why; } });
// Level picker (same screen): switch the plate, road(s) and Pin spots, then re-run the resize chain for the new plate.
function switchLevel(id) { setLevel(id); buildSpotButtons(); resize(); }
setLevelHook(() => { buildSpotButtons(); resize(); });            // a random level's new road at the start of a run
// A level with its own weapon (level 0: Dagger Shears) plays with it; any other level goes back to the equipped one.
function useWeapon(id) { if (weapon.id !== id) { selectWeapon(id); rasterizeArt(); } }
// Level 0, the no-text tutorial: straight in (no weapon screen); clearing it opens the map, which shows its reward.
function playTutorial() {
  if (view.levelId !== C.tutLevel) switchLevel(C.tutLevel);
  useWeapon(levelInfo(C.tutLevel).weapon || savedWeapon());
  play();
}
setTutorialDoneHook(() => { useWeapon(savedWeapon()); openMap(); });
// Level map (PLAY on the title): a level opens the shears screen (named there); BACK returns to the title.
const selectLevel = document.getElementById('select-level');
function chooseLevel(id) {
  if (id === C.tutLevel) { playTutorial(); return; }
  rememberLevel(id); if (id !== view.levelId || levelInfo(id).random) switchLevel(id);
  useWeapon(savedWeapon()); refreshWeaponSelect();
  selectLevel.textContent = levelLabel(id); goSelect();
}
function openMap() { refreshLevelMap(); goMap(); }
initLevelMap({ toast: showToast, onPick: chooseLevel, onBack: goTitle });
// Your Scissors, Shop and Trophies (map, top left; the title's Upgrades tile opens Your Scissors, its Shop tile the Shop).
// A purchase re-applies the weapon's upgrades and the cosmetics (a resize re-rasterizes). Closing returns to whichever
// screen opened it (the map refreshes, since a purchase can change it).
const openScreen = fn => () => { unlockAudio(); toast.hidden = true; fn(); };
on('map-armory', openScreen(openArmory));
on('title-upgrades', openScreen(openArmory));
on('map-shop', openScreen(openShop));
on('title-shop', openScreen(openShop));
on('map-trophies', () => { unlockAudio(); toast.hidden = true; openTrophies(); });
const metaChanged = () => { selectWeapon(weapon.id); resize(); refreshWeaponSelect(); };
const metaClosed = () => { if (state.mode === 'MAP') refreshLevelMap(); };
initShop({ toast: showToast, onChange: metaChanged, onClose: metaClosed });
initArmory({ toast: showToast, onChange: metaChanged, onClose: metaClosed,
  onEquip: id => { Save.equippedScissors = id; persist(); useWeapon(id); refreshWeaponSelect(); } });
// The run is over: the results card plays its Button tally.
setRunEndHook(() => showResults(state.tally));
selectLevel.textContent = levelLabel(view.levelId);
// Win card: NEXT LEVEL plays the next level on the map with the same weapon; "Level map" opens the map.
on('next', () => { const id = nextLevelId(); if (!id) return; rememberLevel(id); switchLevel(id); selectLevel.textContent = levelLabel(id); play(); });
on('over-select', () => { unlockAudio(); toast.hidden = true; openMap(); });
// Pressing anywhere on the title is a gesture that unlocks audio.
document.getElementById('title').addEventListener('pointerdown', () => unlockAudio());
for (const b of document.querySelectorAll('[data-soon]')) b.addEventListener('click', () => showToast(b.dataset.soon + ': coming soon'));

// Mute: the top-bar button (game-over only), the pause and settings cards' Sound buttons and the title's Sound icon; persisted by audio.js.
// Vibration (Settings): kept in the save; game.js checks it before every buzz.
const hapticsBtn = document.getElementById('settings-haptics');
function showHaptics() { const on = Save.settings.haptics; hapticsBtn.textContent = on ? 'Vibration: on' : 'Vibration: off'; hapticsBtn.setAttribute('aria-pressed', String(!on)); }
hapticsBtn.addEventListener('click', () => { Save.settings.haptics = !Save.settings.haptics; persist(); showHaptics(); });
showHaptics();

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

// Level 0's skip arrow (for adults): on to the next step.
on('tut-skip', e => { e.stopPropagation(); tutSkip(); });

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

initDebug({ resize, loopStats, getInfo: debugInfo, onExportRuns: () => downloadJson('battle-scissors-runs.json', loadRuns()),
  onWipeSave: () => { wipeSave(); location.reload(); },
  onAddButtons: () => { Save.buttons += 500; persist(); if (state.mode === 'MAP') refreshLevelMap(); showToast('+500 Buttons'); },
  onUnlockAll: () => { unlockAll({ levels: levelIds(), scissors: Object.keys(C.weapons), pins: Object.keys(C.towers) }); refreshWeaponSelect(); if (state.mode === 'MAP') refreshLevelMap(); showToast('Everything unlocked'); } });

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();
preloadWeapons();
goTitle();
requestAnimationFrame(frame);
