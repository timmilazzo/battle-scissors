// Entry point: apply saved debug overrides, pick the remembered weapon, wire input and screens (title, action bar,
// coach, pause, mute, run report) to the game, size the canvas, load weapon art, then run the loop: update then draw every frame.
import { CONFIG as C, FEEDBACK_URL, ANALYTICS_KEY, VERSION } from './config.js';
import { track, sendFeedback } from './analytics.js';
import { input, initInput, setControls } from './input.js';
import { state, gameHooks, goTitle, goMap, goSelect, goSettings, startGame, selectWeapon, setLevel, setLevelHook, setTutorialDoneHook, setRunEndHook, nextLevelId, layout, update, lastReport,
  tutSkip, setPaused, togglePause } from './game.js';
import { weapon, setWeapon } from './scissors.js';
import { view } from './core.js';
import { draw, sizeCanvas, prerender } from './render.js';
import { art, preloadWeapons, rasterizeArt } from './weaponArt.js';
import { applySavedOverrides, initDebug } from './debug.js';
import { savedWeapon, initWeaponSelect, refreshWeaponSelect } from './weaponSelect.js';
import { savedLevel, rememberLevel, levelLabel, onMap } from './levelSelect.js';
import { levelIds, levelInfo, hasLevel } from './levels/index.js';
import { Save, persist, wipeSave, unlockAll } from './save.js';
import { initLevelMap, refreshLevelMap } from './levelMap.js';
import { isMuted, setMuted, unlockAudio, sfx } from './audio.js';
import { loadRuns, downloadJson } from './runlog.js';
import { initActionBar, refreshActionBar, measureActionBar, buildSpotButtons } from './actionBar.js';
import { refreshHud } from './hud.js';
import { showResults, refreshResultsShop } from './results.js';
import { initShop, openShop, openTrophies, refreshShop } from './shop.js';
import { initBox, openBox, refreshBox } from './sewingBox.js';
import { initArmory } from './armory.js';
import { buySharpen, newDeals } from './meta.js';

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
// Random Quilt (title, once the tutorial is done): a new generated road each run, off the map, so its weapon screen and
// results lead back to the title. Custom Road (?recipe=, the level lab's Play it) sits top left of the title.
const quiltBtn = document.getElementById('title-quilt'), customBtn = document.getElementById('title-custom');
const showQuilt = () => quiltBtn.classList.toggle('locked', !Save.tutorialDone);
on('title-quilt', () => { unlockAudio(); toast.hidden = true; if (Save.tutorialDone) chooseLevel('random'); else showToast('Play the tutorial first: tap PLAY'); });
customBtn.hidden = !hasLevel('custom');
on('title-custom', () => { unlockAudio(); toast.hidden = true; chooseLevel('custom'); });
showQuilt();
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
initWeaponSelect({ onPick: id => { selectWeapon(id); rasterizeArt(); }, onStart: play, onBack: () => backOut(),
  onSharpen: id => { unlockAudio(); const why = buySharpen(id); if (why) showToast(sharpenFail[why] || why); else sfx('pinPop', 0); return why; } });
// Level picker (same screen): switch the plate, road(s) and Pin spots, then re-run the resize chain for the new plate.
// The pause card's Back to map only shows for a map level (Random Quilt / Custom Road have Title screen beside it).
const pauseMap = document.getElementById('pause-map');
function switchLevel(id) { setLevel(id); buildSpotButtons(); resize(); pauseMap.hidden = !onMap(id); }
pauseMap.hidden = !onMap(view.levelId);
setLevelHook(() => { buildSpotButtons(); resize(); });            // a random level's new road at the start of a run
// A level with its own weapon (level 0: Dagger Shears) plays with it; any other level goes back to the equipped one.
function useWeapon(id) { if (weapon.id !== id) { selectWeapon(id); rasterizeArt(); } }
// Level 0, the no-text tutorial: straight in (no weapon screen); clearing it opens the map, which shows its reward.
function playTutorial() {
  if (view.levelId !== C.tutLevel) switchLevel(C.tutLevel);
  useWeapon(levelInfo(C.tutLevel).weapon || savedWeapon());
  play();
}
setTutorialDoneHook(() => { useWeapon(savedWeapon()); showQuilt(); openMap(); });
// Level map (PLAY on the title): a level opens the shears screen (named there); BACK returns to the title.
const selectLevel = document.getElementById('select-level'), selectNew = document.getElementById('select-new');
// What level id brings for the first time: its new Pins and SHRED (CONFIG.pinFrom / shredFrom), on the weapon screen.
function showLevelName(id) {
  selectLevel.textContent = levelLabel(id);
  const news = Object.keys(C.pinFrom).filter(t => C.pinFrom[t] === id && C.towers[t]).map(t => C.towers[t].name);
  if (C.shredFrom === id) news.push('SHRED');
  selectNew.hidden = !news.length; selectNew.textContent = 'NEW HERE: ' + news.join(', ');
  return news.length > 0;
}
function chooseLevel(id) {
  if (id === C.tutLevel) { playTutorial(); return; }
  rememberLevel(id); if (id !== view.levelId || levelInfo(id).random) switchLevel(id);
  useWeapon(savedWeapon()); refreshWeaponSelect();
  showLevelName(id); goSelect();
}
function openMap() { refreshNews(); refreshLevelMap(); goMap(); }
// The gold dot on the Shop's entrances (title tile, map button) and the Sewing Box's (map button, weapon screen link):
// something on that screen the balance covers that the player hasn't seen on its tab yet. Re-checked whenever Buttons
// or the seen list can have changed: a run settled, a chest opened, a screen closed, the map opened.
const newsBtns = { shop: ['title-shop', 'map-shop'], box: ['map-box', 'sel-box'] };
function refreshNews() {
  for (const screen in newsBtns) { const has = newDeals(screen).length > 0; for (const id of newsBtns[screen]) document.getElementById(id).classList.toggle('news', has); }
}
// Leaving a level's screens (weapon screen BACK, the results' Map, the pause card's Back to map): the map for a map
// level, the title for Random Quilt / Custom Road.
function backOut() { if (onMap(view.levelId)) openMap(); else goTitle(); }
const openMeta = (screen, tab) => { unlockAudio(); if (screen === 'box') openBox(tab); else openShop(tab); };
initLevelMap({ toast: showToast, onPick: chooseLevel, onBack: goTitle, onOpen: openMeta, onChange: refreshNews });
// The Sewing Box (map, top left, and the weapon screen; tabs: Scissors, Pins, Moves: what you hold and its upgrades),
// the Shop (map, and the title's Shop tile; tabs: Pairs, Style: new things) and Trophies (map). A purchase re-applies
// the weapon's upgrades and the cosmetics (a resize re-rasterizes). Closing returns to whichever screen opened it (the
// map refreshes, since a purchase can change it).
const openScreen = fn => () => { unlockAudio(); toast.hidden = true; fn(); };
on('map-box', openScreen(() => openBox()));
on('sel-box', openScreen(() => openBox()));
on('map-shop', openScreen(() => openShop()));
on('title-shop', openScreen(() => openShop()));
on('map-trophies', openScreen(() => openTrophies()));
const metaChanged = () => { selectWeapon(weapon.id); resize(); refreshWeaponSelect(); };
const metaClosed = () => { refreshNews(); if (state.mode === 'MAP') refreshLevelMap(); if (state.mode === 'GAME_OVER') refreshResultsShop(); if (state.mode === 'SELECT') refreshWeaponSelect(); };
initShop({ onChange: metaChanged, onClose: metaClosed });
initBox({ onClose: metaClosed });
initArmory({ toast: showToast, onChange: metaChanged, refresh: () => { refreshShop(); refreshBox(); },
  onEquip: id => { Save.equippedScissors = id; persist(); useWeapon(id); refreshWeaponSelect(); }, onFeedback: skillFeedback });
// The run is over: the results card plays its Button tally.
setRunEndHook(() => { showResults(state.tally); refreshNews(); });
// The results card's Shop line: its button opens the Shop on the deal's tab (the card's tap-to-skip must not fire).
on('res-shop-btn', e => { e.stopPropagation(); openMeta(e.currentTarget.dataset.screen, e.currentTarget.dataset.tab); });
showLevelName(view.levelId);
// Run-end card: one big button (endGame sets its act): TO THE MAP after a win (the map plays the reward cards and
// shows what's next: the next patch pulses, the Sewing Box / Shop buttons carry a dot when something new is
// affordable), TRY AGAIN after a loss. The small Map / Title and Play again buttons cover the rest.
const toMap = () => { unlockAudio(); toast.hidden = true; backOut(); };
on('over-select', () => { const act = document.getElementById('over-select').dataset.act; if (act === 'again') play(); else toMap(); });
on('over-map', toMap);
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
on('pause-map', e => { e.stopPropagation(); openMap(); });           // hidden off the map (switchLevel)
on('pause-home',e => { e.stopPropagation(); goTitle(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

// (Outbound: the feedback card and play events go to PostHog, analytics.js; Email instead opens FEEDBACK_URL.)
// Send feedback: a card with a note (and an optional contact) that posts to PostHog (analytics.js) along with the last
// run's stats, if any. It opens from Settings, the credits card (`ask` = the button's data-send-feedback value: 'demo'
// = that card's question) and a skill idea (the Shop's Moves tab, about that skill). Email instead (FEEDBACK_URL, a mailto:) is the fallback when
// sending fails or there's no analytics key; the card keeps the note if sending fails.
const fb = { screen: document.getElementById('feedback'), prompt: document.getElementById('fb-prompt'), text: document.getElementById('fb-text'),
  contact: document.getElementById('fb-contact'), send: document.getElementById('fb-send'), email: document.getElementById('fb-email') };
let fbCtx = null;
function openFeedback(ctx) {
  fbCtx = ctx;
  fb.prompt.textContent = ctx.prompt;
  fb.send.disabled = false; fb.email.hidden = !FEEDBACK_URL;
  fb.screen.hidden = false;
  setTimeout(() => fb.text.focus(), 50);
}
const closeFeedback = () => { fb.screen.hidden = true; fbCtx = null; fb.text.blur(); fb.contact.blur(); };
function emailFeedback(ctx, text) {
  if (!FEEDBACK_URL) { showToast('No feedback link set (FEEDBACK_URL in config.js)'); return; }
  const url = FEEDBACK_URL + '?subject=' + encodeURIComponent('Battle Scissors feedback (' + ctx.what + ')') +
    '&body=' + encodeURIComponent(ctx.prompt + '\n\n' + text + '\n\n---\n' + (ctx.report ? 'Run report (please leave this in):\n' + JSON.stringify(ctx.report) : 'v' + VERSION));
  if (FEEDBACK_URL.startsWith('mailto:')) { location.href = url; showToast('Opening your email app…'); } else window.open(FEEDBACK_URL, '_blank', 'noopener');
}
function openRunFeedback(ask) {
  const report = lastReport;
  const what = ask === 'demo' ? 'finished the demo' : report ? (report.won ? 'won' : 'lost on wave ' + report.wavesReached) + ', ' + report.weapon : 'no run yet';
  openFeedback({ kind: ask === 'demo' ? 'demo' : 'general', what, report,
    prompt: ask === 'demo' ? 'The least fun thing, and what should change? Anything that felt good?' : "What's fun, what isn't, and what should change?" });
}
// The Shop's Moves tab: Want this on a skill to come.
function skillFeedback(k) {
  openFeedback({ kind: 'skill', skill: k.id || k.name, what: 'skill idea: ' + k.name, report: null, prompt: "You'd want " + k.name + ' (' + k.blurb + "). Why, or how would you change it?" });
}
fb.send.addEventListener('click', () => {
  const text = fb.text.value.trim(), ctx = fbCtx;
  if (!ctx) return;
  if (!text) { showToast('Write a note first'); return; }
  if (!ANALYTICS_KEY) { emailFeedback(ctx, text); return; }
  fb.send.disabled = true;
  const { config, device, ...slim } = ctx.report || {};         // the report's tuning snapshot and user agent aren't needed here
  sendFeedback({ kind: ctx.kind, skill: ctx.skill, message: text, contact: fb.contact.value.trim(), prompt: ctx.prompt, report: ctx.report ? slim : undefined,
    level: view.levelId }).then(ok => {
    if (ok) { fb.text.value = ''; closeFeedback(); showToast('Thanks! Sent.'); }
    else { fb.send.disabled = false; showToast('Could not send. Check your connection.'); }
  });
});
on('fb-cancel', closeFeedback);
fb.email.addEventListener('click', () => { if (fbCtx) emailFeedback(fbCtx, fb.text.value.trim()); });
fb.screen.addEventListener('keydown', e => { if (e.key === 'Escape') closeFeedback(); });
// Delegated, so buttons built later (the credits card in levelMap.js) work too.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-send-feedback]'); if (b) openRunFeedback(b.dataset.sendFeedback);
});

// Share play data (Settings): anonymous run events to PostHog (analytics.js); feedback is separate and always the player's choice.
const analyticsBtn = document.getElementById('settings-analytics');
function showAnalytics() { const on = Save.settings.analytics !== false; analyticsBtn.textContent = on ? 'Share play data: on' : 'Share play data: off'; analyticsBtn.setAttribute('aria-pressed', String(!on)); }
analyticsBtn.addEventListener('click', () => { Save.settings.analytics = Save.settings.analytics === false; persist(); showAnalytics(); });
showAnalytics();
track('session_start');

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
refreshNews();
goTitle();
requestAnimationFrame(frame);
