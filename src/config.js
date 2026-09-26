// ======================= CONFIG — all tunables live here =======================
// Every tunable number in the game belongs in this object, each with a one-line comment.
// Modules read these at runtime (C.x), so the debug panel can change them live.
// (Sound parameter arrays are the one exception: they live in src/sfx.js for pasting to/from the ZzFX designer.)

// Where "Send feedback" (pause and game-over cards) goes. A mailto: address opens an email with the run report in the
// body; any other link just opens in a new tab. Empty = the button only shows a toast.
export const FEEDBACK_URL = 'mailto:tim@saltandwisdom.com';

export const CONFIG = {
  // --- pose / control mapping ---
  pivotOffsetPx: 120,        // pivot sits this many px ABOVE the finger midpoint
  offsetAlongAim: false,     // false = offset straight up in screen space (spec); true = offset along the scissors' aim
  closedDistPx: 40,          // finger distance that reads as fully closed (0%)
  openDistPx: 260,           // finger distance that reads as fully open (100%)
  spreadLerp: 0.55,          // rendered-spread smoothing per 60fps frame (1 = raw, lower = smoother/laggier)
  poseLerp: 0.5,             // pivot position + rotation smoothing per 60fps frame
  weaponScale: 1,            // size multiplier for every weapon on screen (debug "Blade scale")

  // --- weapons (picked on the weapon screen) ---
  // svg: layered art (see weaponArt.js for how data-role="rotating" / "sliding" layers open). viewX/viewY/viewW/viewH/
  // pivotX/pivotY come from the SVG's viewBox and data-* attributes (viewX/viewY default 0). bladeLen = pivot to blade
  // tip in SVG units (measured). maxOpenDeg = half the cut zone's angle at full open (for plain two-blade art, each
  // blade's swing). reachFrac = blade length on screen as a fraction of screen height, damageMult = multiplier on every
  // snip's damage. Optional: aimOffsetDeg + aimOffsetOpenDeg x open = extra turn of the whole art, for art whose gap
  // isn't centred on its own axis; kind: 'slide' = no pivot, parts slide apart and the cut zone is a round hole of
  // radius bladeLen at the pivot point (the hole's centre); spinLen = how far the Helicopter spin reaches (SVG units).
  weapons: {
    dagger:  { name: 'Dagger Shears', blurb: 'Long engraved blades that reach deep into the road.',
               svg: 'assets/weapons/dagger-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 370, maxOpenDeg: 32, reachFrac: 0.132, damageMult: 1 },
    nippers: { name: 'War Nippers', blurb: 'Short crescent jaws that bite hard. Get close.',
               svg: 'assets/weapons/battle-cuticle-nippers.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 242, maxOpenDeg: 28, reachFrac: 0.088, damageMult: 1.3 },
    barber:  { name: 'Split Enders', blurb: 'Opens wide enough to take a whole crowd, but cuts light.',
               svg: 'assets/weapons/barber-scissors.svg', viewX: -80, viewW: 960, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 404, maxOpenDeg: 60, reachFrac: 0.12, damageMult: 0.85 },
    scrap:   { name: 'Scrap Snippers', blurb: 'Long heavy blades with a narrow bite. Aim true.',
               svg: 'assets/weapons/scrap-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 408, maxOpenDeg: 24, reachFrac: 0.144, damageMult: 1.25 },
    // hooked jaw -12deg, blade +76deg, handle +12deg (per-layer data-open-angle). Closed, the blade tip points 41deg
    // left of the art's axis; fully open, the gap spans -40..+22deg (centre -9deg, 62deg wide). The aim offset turns
    // the art 41deg -> 9deg as it opens so the tip, then the gap's centre, lines up with the aim.
    pruners: { name: 'Ratchet Pruners', blurb: 'A hooked jaw holds, one heavy blade bites down. Big hits up close.',
               svg: 'assets/weapons/ratchet-pruners.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 320,
               bladeLen: 240, maxOpenDeg: 31, aimOffsetDeg: 41, aimOffsetOpenDeg: -32, reachFrac: 0.1, damageMult: 1.4 },
    // blades slide 155 units each way inside a 131-unit round window; the finger rings sit about 426 units out
    cigar:   { name: 'Cigar Cutter', blurb: 'No blades to swing: fit them in the hole and slam it shut.',
               svg: 'assets/weapons/cigar-cutter.svg', viewW: 1300, viewH: 640, pivotX: 650, pivotY: 320, kind: 'slide',
               bladeLen: 131, maxOpenDeg: 0, spinLen: 426, reachFrac: 0.036, damageMult: 2.2 },
  },
  defaultWeapon: 'dagger',   // weapon picked on first launch (afterwards the last choice is remembered)
  statDrawerHeightIn: 24,    // the play area's height in "story" inches; converts reach to inches on the weapon screen

  // --- snip detection (uses RAW finger spread, not the smoothed one) ---
  // Speed = average closing speed from where the close began (near its widest) to where it lands,
  // in spread units per second (1.0 = the full closed..open range in one second).
  snipOpenFrom: 0.25,        // the close must start from at least this spread
  snipCloseTo: 0.15,         // the close "lands" when spread drops to this (fingers needn't fully touch)
  snipMinSpeed: 1.2,         // at or above this speed = full SNIP
  weakMinSpeed: 0.6,         // between this and snipMinSpeed = weak "nick"; below = too slow (nothing)
  closeStartTol: 0.05,       // jitter tolerated at the open pose when finding where the close began
  slowLookbackMs: 1500,      // how far back to look for the start of a close
  cutZoneScale: 1.0,         // multiplier on blade length for the cut triangle (1 = exact blade tips)
  hitPadPx: 12,              // extra reach: a target is hit if its circle comes within this of the triangle

  // --- strike grading: g = 0 at the pivot .. 1 at the blade tips' starting points ---
  // Snip damage = lerp(damageAtPivot, damageAtTip, g) x opening power x (weakDamageMult for a nick).
  // A full-open snip does 2 at the pivot, 1 at the tips, so enemy hp = snips needed at worst (tips, full open).
  damageAtPivot: 2,          // full-open damage right at the pivot
  damageAtTip: 1,            // full-open damage out at the tips
  gradeCurve: 1.0,           // exponent on g: >1 keeps hits strong further out, <1 weakens them sooner
  pushChanceAtPivot: 0.0,    // chance a hit at the pivot shoves the target
  pushChanceAtTip: 0.85,     // chance a hit at the tips shoves the target
  pushSpeed: 220,            // px/s shove at the tips (scaled by g), along the closing blade's edge motion
  pushDrag: 4,               // how fast a shove dies out (per second)
  powerAtMinOpen: 0.4,       // damage + shove multiplier for a close that began at snipOpenFrom; ramps to 1.0 at fully open
  weakDamageMult: 0.5,       // weak "nick": damage multiplier
  weakPushMult: 1.5,         // weak "nick": shove multiplier

  // --- blade contact: while the visible blades are CLOSING they shove anything in front of their cutting edge ---
  contactMinCloseSpeed: 0.3, // blades must be closing at least this fast (spread units/s) to push; otherwise they pass through
  bladeHalfWidthBase: 0.06,  // blade half-thickness near the pivot, as a fraction of blade length
  bladeHalfWidthTip: 0.01,   // blade half-thickness at the tip, as a fraction of blade length
  contactPushSpeed: 140,     // px/s a touched ball is shoved away from the blade
  contactSlide: 0.5,         // extra shove outward along the blade (scissors squeeze things toward the tips)

  // --- feedback ---
  hapticMs: 30,              // navigator.vibrate duration on snip
  weakHapticMs: 12,          // vibrate duration on a weak nick
  flashMs: 140,              // white flash along the blades
  cutZoneShowMs: 220,        // how long the graded cut-zone ghost stays visible (0 = never draw it)
  snipKickPx: 4,             // tiny world punch on snip
  shakeMs: 220,              // "too slow" wobble duration
  shakePx: 4,                // "too slow" wobble amplitude
  fadeOutMs: 200,            // scissors fade when a finger lifts
  fadeInMs: 80,              // scissors fade-in when two fingers land
  spacePulseMs: 220,         // Space-key snip: visual snap-shut-and-reopen duration
  snipParticles: 26,         // spark count in the pivot burst
  showFingers: true,         // draw faint markers at the finger/handle points (debug)

  // --- enemies ---
  maxEnemies: 40,            // pool size = on-screen cap; a scheduled spawn waits if the pool is full
  // r = radius px, hp, tier = workshop damage (and 2+ = "medium+" for hit-stop), score = kill points,
  // traverseSec = seconds to walk the whole path, gapMs = spacing between members of one spawn group,
  // pushScale = how far shoves move it (0 = immovable), armor = first snip clangs unless slowed, boss = Seam Ripper rules.
  // color = felt body, patch / patch2 = sewn-on patches (also the kill fragments' colours).
  enemyTypes: {
    scrap:      { r: 13, hp: 1,  tier: 1,  score: 10,  traverseSec: 12, gapMs: 300,  pushScale: 1.2,  color: '#eadcc3', patch: '#3f73d8', patch2: '#d8423a' },
    bolster:    { r: 24, hp: 3,  tier: 2,  score: 25,  traverseSec: 26, gapMs: 1400, pushScale: 0.8,  color: '#e6b85c', patch: '#7a4fc9', patch2: '#3f73d8' },
    brute:      { r: 38, hp: 6,  tier: 3,  score: 60,  traverseSec: 32, gapMs: 2500, pushScale: 0.35, armor: true, color: '#b8946a', patch: '#3f6fc4', patch2: '#c0392b' },
    seamRipper: { r: 56, hp: 30, tier: 10, score: 500, traverseSec: 30, gapMs: 0,    pushScale: 0,    boss: true,  color: '#6a3596', patch: '#e84a5f', patch2: '#ffd23f' },
  },
  hpPerWave: 0.1,            // each wave after the first adds this fraction of base hp (wave 6 = 1.5x); fractional hp means a tip hit no longer kills
  waddleDeg: 6,              // side-to-side rock while walking
  pathReturnRate: 1.6,       // how fast a shoved enemy drifts back onto the road (per second)

  // --- boss: The Seam Ripper ---
  bossTurns: [0.8, 0.2],     // path progress where it reverses (forward to 80%, back to 20%), then it heads for the workshop
  seamPeriodSec: 2,          // the glowing seam goes once around the boss in this long
  seamArcDeg: 22,            // half-width of the glowing seam arc
  seamHitTolPx: 12,          // the closed-blade line must pass this close to the seam to count as on-seam
  seamMult: 5,               // a snip on the seam does this many times its normal (graded, powered) damage
  offSeamMult: 1,            // multiplier for a snip anywhere else on the boss

  // --- kill impact ---
  hitStopMs: 60,             // whole-game freeze on a medium+ (tier >= 2) kill
  bossHitStopMs: 180,        // freeze on the boss kill
  killShakePerR: 0.18,       // screen-shake px added per px of the killed enemy's radius
  killShakeMaxPx: 12,        // screen-shake cap
  killShakeMs: 260,          // screen shake decays over roughly this long
  fragmentsPerKill: 6,       // shards per kill
  fragmentSpeed: 260,        // px/s shard launch speed
  fragmentLifeMs: 650,       // shard fade time

  // --- level: a painted plate with the road, the Pin spots and the workshop (the heart pad) baked in ---
  // Everything in `level` is in the plate's own pixels ("level units"). The plate is drawn full height and centred
  // (narrow screens crop its sides, wide ones get blurred side bars), so level units -> screen px = view.L.
  level: {
    bg: 'assets/level-bg.webp', w: 941, h: 1672,   // the plate and its pixel size
    // road centreline, Catmull-Rom control points. Enemies walk first -> last; the last point is the heart pad.
    path: [
      [485, -90], [482, 60], [440, 210], [510, 320], [640, 420], [600, 500], [450, 550], [330, 610], [320, 690],
      [400, 760], [540, 840], [565, 930], [520, 1010], [420, 1090], [420, 1170], [500, 1260], [510, 1380], [501, 1470],
    ],
    spots: [[215, 806], [719, 725], [769, 1101]],   // centres of the fenced round pads where a Pin can be built
    spotR: 92,               // pad radius: sizes the Pin art standing on it
    roadHalfWidth: 50,       // shoves can move an enemy's centre at most this far from the road centreline (painted road is ~110-150 wide)
    workshopR: 118,          // heart pad radius: the red flash when the workshop takes damage
  },
  pathSmoothSteps: 16,       // Catmull-Rom samples per path segment (road smoothness)
  workshopHp: 10,            // workshop hit points; an enemy that arrives deals its size tier
  workshopHitMs: 400,        // red flash on the workshop when it takes damage
  hudLowHp: 3,               // the HUD's heart counter turns red at or below this many hearts

  // --- waves & scoring ---
  // One array per wave; each entry is [type, count, atSec]: `count` enemies of `type` starting `atSec` seconds into
  // the wave, spaced by that type's gapMs (so a scrap group of 6 arrives 300ms apart).
  waves: [
    [['scrap', 5, 2], ['scrap', 6, 12], ['bolster', 1, 20]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['scrap', 7, 16], ['bolster', 1, 24]],
    [['scrap', 6, 2], ['bolster', 2, 6], ['brute', 1, 12], ['scrap', 8, 18], ['bolster', 2, 26]],
    [['scrap', 7, 2], ['bolster', 3, 6], ['scrap', 6, 14], ['brute', 1, 18], ['scrap', 6, 26], ['bolster', 1, 32]],
    [['scrap', 8, 2], ['brute', 1, 6], ['bolster', 3, 10], ['scrap', 7, 18], ['brute', 1, 24], ['scrap', 8, 30]],
    [['scrap', 6, 2], ['bolster', 2, 6], ['seamRipper', 1, 10], ['scrap', 7, 20], ['brute', 1, 28], ['scrap', 8, 36]],
  ],
  emptyWaveWaitSec: 1,       // if every enemy is dead mid-wave, the next spawn comes within this long (the wave clock skips ahead)
  waveClearMs: 2000,        // WAVE_CLEAR pause between waves
  waveBannerMs: 1600,        // "WAVE N" banner at the start of each wave
  multiSnipMin: 2,           // enemies inside the cut zone for a snip to count as a multi-snip
  multiSnipMult: 1.5,        // score multiplier for kills made by a multi-snip
  scorePopupMs: 900,         // floating "+score" lifetime
  scorePopupRisePx: 50,      // px/s the "+score" popup floats upward
  toastMs: 1400,             // "coming soon" message duration for placeholder title buttons

  // --- economy (thread) ---
  startThread: 150,          // thread at the start of a run
  threadPerKill: 8,          // thread per enemy killed by a snip (or the Helicopter)
  threadPerLeak: 2,          // thread per enemy that reaches the workshop, so a losing player can still afford something

  // --- towers ("Pins"): Ice and Magnet set up snips; Fire is the one Pin that deals damage on its own. ---
  // Built only on the level's spots (tap the + on one). radius is in level units. ice: enemies inside it are slowed
  // (slowSpeedMult) and flagged slowed (lets a snip through Brute armor). fire: enemies inside it catch fire and keep
  // burning burnSec after leaving it, taking burnDps HP per second in burnTickMs ticks (armor doesn't stop it; burn
  // kills don't charge SHRED). magnet: every
  // periodSec, pulls every enemy within radius along the road toward the nearest road point to the Pin over pullMs
  // (the ones ahead back, the ones behind forward), leaving pullKeep of the gap (0 = all onto one spot): a clump
  // that keeps walking together, set up for a multi-snip.
  // color = glow / aura, felt = cushion colour, head = pin-head colour.
  towers: {
    ice:    { name: 'Ice Pin',    blurb: 'slows, beats armor', cost: 100, radius: 290, color: '#8fe8ff', felt: '#2f63c9', head: '#3d7dff' },
    fire:   { name: 'Fire Pin',   blurb: 'burns what walks by', cost: 110, radius: 290, burnDps: 0.25, burnSec: 1.5, burnTickMs: 500, color: '#ffa04a', felt: '#c8352b', head: '#e0312b' },
    magnet: { name: 'Magnet Pin', blurb: 'pulls into a clump', cost: 120, radius: 330, periodSec: 3, pullMs: 500, pullKeep: 0.25, color: '#c79bff', felt: '#7b3fc4', head: '#9a4fe0' },
  },
  slowSpeedMult: 0.4,        // slowed enemies move at this fraction of their speed
  spotBtnPx: 42,             // size of the + button on an empty Pin spot

  // --- special: Helicopter ---
  heliKillsToCharge: 25,     // snip kills to fill the charge bar
  heliOpenMs: 120,           // snap fully open
  heliSpinMs: 1600,          // spin duration
  heliSpinTurns: 2,          // full turns during the spin (2 = 720°)
  heliTickMs: 100,           // during the spin, everything within blade reach is hit this often
  heliTickDamage: 1,         // damage per tick (ignores armor)
  heliSlowSec: 2,            // enemies hit by the spin stay slowed this long
  heliCloseMs: 90,           // final snap-close (then a normal full-open snip fires)
  heliFinalShakePx: 14,      // screen shake on the final close
  heliBannerMs: 1100,        // "SHRED" banner time

  // --- onboarding (first run, or "How to play" on the title) ---
  tutSpreadFrac: 0.6,        // step 2 passes when the fingers spread past this
  tutRotateDeg: 45,          // step 5 passes when the aim turns this far
  tutNagMs: 1800,            // how long "Too fast!" replaces the slow-close prompt before it comes back
  tutGoMs: 900,              // "Go." shows this long before wave 1

  // --- feel (visual only) ---
  trailMinSpeed: 2.5,        // blade trails appear when the blades open/close/turn faster than this (rad/s)
  trailFadeMs: 140,          // how long each trail ghost takes to fade
  pickupFlyMs: 650,          // "+8" thread pickup flight time to the HUD counter
  titleWeapon: 'nippers',    // the real scissors that follow the pointer on the title screen
  titleOpenFrac: 0.6,        // title scissors rest this far open; pressing snaps them shut

  // --- playtest data ---
  runsKept: 20,              // run reports kept in localStorage

  // --- action bar (thread + SHRED) and Pin spot tips ---
  tipShowMs: 9000,           // how long a "you can afford a Pin" / "SHRED ready" tip stays up (unless acted on)

  // --- desktop fallback ---
  mouseOpenMs: 500,          // holding left button opens closed->full over this long; release snaps shut
  wheelDistStep: 0.35,       // px of virtual finger distance per wheel delta unit
  wheelRotStep: 0.004,       // radians per wheel delta unit with Shift held
  keyRotStep: 0.08,          // radians per A/D press
  maxDpr: 2,                 // cap devicePixelRatio (fill-rate on high-dpi phones)

  // --- debug panel (hidden; long-press the top-right corner) ---
  debugCornerPx: 64,         // size of the top-right hot corner that opens the panel
  debugHoldMs: 1500,         // how long to hold in the corner to toggle the panel
  debugMoveTolPx: 24,        // drift allowed during the hold before it's cancelled
  debugMinSpreadGapPx: 20,   // sliders keep openDistPx at least this far above closedDistPx
};
