// ======================= CONFIG — all tunables live here =======================
// Every tunable number in the game belongs in this object, each with a one-line comment.
// Modules read these at runtime (C.x), so the debug panel can change them live.
// (Sound parameter arrays are the one exception: they live in src/sfx.js for pasting to/from the ZzFX designer.)

// The "Email instead" fallback on the feedback card (used when sending fails or ANALYTICS_KEY is empty). A mailto:
// address opens an email with the run report in the body; any other link opens in a new tab. Empty = no fallback button.
export const FEEDBACK_URL = 'mailto:tim@saltandwisdom.com';

// PostHog (src/analytics.js): anonymous play events and the in-game feedback card both post here. The key is a public
// project token (safe in client code). Empty ANALYTICS_KEY = nothing is ever sent.
export const ANALYTICS_HOST = 'https://us.i.posthog.com';
export const ANALYTICS_KEY = 'phc_z4235bmczBCg65dxaMJcEEsqTKypip6ut2fv5ghLx76T';

// Supabase (src/leaderboard.js): the Random Quilt leaderboard. The project URL and its publishable (anon) key, both
// safe in client code (the tables are only reachable through the leaderboard Edge Function). Empty = no leaderboard.
export const SUPABASE_URL = 'https://fkhuzanqyfainkieruxs.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_rA8Yt-7J1dULTlc-ip4dZw_OkPuahEr';

// Shown small at the bottom of Settings and recorded in every run report. Bump it with each published change.
export const VERSION = '0.5.2';

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
  // snip's damage, openMs = how long a held mouse button or held finger ('hold' touch controls) takes to
  // open it closed -> full (lifting snaps it shut). Optional: aimOffsetDeg + aimOffsetOpenDeg x open = extra turn of the whole art, for art whose gap
  // isn't centred on its own axis; kind: 'slide' = no pivot, parts slide apart and the cut zone is a round hole of
  // radius bladeLen at the pivot point (the hole's centre); spinLen = how far the Helicopter spin reaches (SVG units).
  // signature = the stat its tier-3 upgrade raises (CONFIG.meta): 'angle' maxOpenDeg, 'damage' damageMult, 'crit'
  // critMult, 'hold' holdSec, 'ring' ringScale, 'all' every stat a little. critZone + critMult (Scrap Snippers): a hit
  // this close to the pivot (0 pivot .. 1 tips) does critMult x damage. holdSec (Ratchet Pruners): the hooked jaw holds
  // every regular enemy it hits in place this long. ringScale (Cigar Cutter): the hole's cut radius x this.
  // 'notch' pivotZone, 'nick' critZone, 'curl' curlSec. pivotExecute + pivotZone (Kitchen Shears): a snip with a Burr or
  // Button Beetle within pivotZone of the pivot (0 pivot .. 1 tips) kills it outright. weakAlways (Stork Snips): every
  // snip counts as a weak-spot hit, wherever it lands (critZone + critMult as the Scrap Snippers'). curlSec + curlSlow
  // (Ribbon Shears): each snip leaves a ribbon curl on the road for curlSec; whatever crosses it moves at curlSlow of its speed.
  // How each is won: defaultWeapon is held from the start; one that is some map level's unlockOnClear is won there;
  // shop = its price in Buttons, buyable in the Shop once level shopAfter has been cleared (never for anything else).
  // story = the line on its "new scissors" card when it is won or bought (why it turns up now).
  weapons: {
    safety:  { name: 'Safety Firsts', blurb: 'Round tips, crayon-box grip. Every hero starts somewhere.',
               story: "From the kids' craft box, round tips and all. Every drawer's defence starts somewhere: go snip some scraps!",
               svg: 'assets/weapons/safety-firsts.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 274, maxOpenDeg: 28, reachFrac: 0.105, damageMult: 0.85, openMs: 560, signature: 'all' },
    dagger:  { name: 'Dagger Shears', blurb: 'Long engraved blades that reach deep into the road.',
               story: "The good scissors. The ones nobody is allowed to use on paper. Long blades that reach deep into the road.",
               svg: 'assets/weapons/dagger-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 370, maxOpenDeg: 32, reachFrac: 0.132, damageMult: 1, openMs: 500, signature: 'all' },
    nippers: { name: 'War Nippers', blurb: 'Short crescent jaws that bite hard. Get close.',
               story: "Pried out of the Brute King's own stuffing. Short crescent jaws that bite back just as hard as he did.",
               svg: 'assets/weapons/battle-cuticle-nippers.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 242, maxOpenDeg: 28, reachFrac: 0.088, damageMult: 1.3, openMs: 380, signature: 'damage' },
    barber:  { name: 'Split Enders', blurb: 'Opens wide enough to take a whole crowd, but cuts light.',
               story: "Bathroom drawer, next to the tweezers. They open wide enough to catch a whole crowd in one cut.",
               svg: 'assets/weapons/barber-scissors.svg', viewX: -80, viewW: 960, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 404, maxOpenDeg: 60, reachFrac: 0.12, damageMult: 0.85, openMs: 650, signature: 'angle',
               shop: 200, shopAfter: 'clover' },
    scrap:   { name: 'Scrap Snippers', blurb: 'Long heavy blades with a narrow bite. Aim true.',
               story: "Off the garage bench. Someone cut wire with these. Land a snip right by the pivot for a critical hit.",
               svg: 'assets/weapons/scrap-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 408, maxOpenDeg: 24, reachFrac: 0.144, damageMult: 1.25, openMs: 580,
               signature: 'crit', critZone: 0.25, critMult: 1.5, shop: 300, shopAfter: 'loop' },
    // hooked jaw -12deg, blade +76deg, handle +12deg (per-layer data-open-angle). Closed, the blade tip points 41deg
    // left of the art's axis; fully open, the gap spans -40..+22deg (centre -9deg, 62deg wide). The aim offset turns
    // the art 41deg -> 9deg as it opens so the tip, then the gap's centre, lines up with the aim.
    pruners: { name: 'Ratchet Pruners', blurb: 'A hooked jaw holds, one heavy blade bites down. Big hits up close.',
               story: "In from the shed with the mud still on. A hooked jaw that grabs hold and doesn't let go.",
               svg: 'assets/weapons/ratchet-pruners.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 320,
               bladeLen: 240, maxOpenDeg: 31, aimOffsetDeg: 41, aimOffsetOpenDeg: -32, reachFrac: 0.1, damageMult: 1.4, openMs: 620,
               signature: 'hold', holdSec: 0.5, shop: 400, shopAfter: 'corkscrew' },
    // blades slide 155 units each way inside a 131-unit round window; the finger rings sit about 426 units out
    cigar:   { name: 'Cigar Cutter', blurb: 'No blades to swing: fit them in the hole and slam it shut.',
               story: "Grandpa's. Nobody asks. No blades to swing: fit a Button Beetle in the hole and slam it shut!",
               svg: 'assets/weapons/cigar-cutter.svg', viewW: 1300, viewH: 640, pivotX: 650, pivotY: 320, kind: 'slide',
               bladeLen: 131, maxOpenDeg: 0, spinLen: 426, reachFrac: 0.036, damageMult: 2.2, openMs: 440,
               signature: 'ring', ringScale: 1, shop: 500, shopAfter: 'keyring' },
    // heavy serrated blades, a bottle-opener notch in the handle: slow to open, the hardest graded hit of the bladed pairs;
    // pivotExecute: a Burr or Beetle within pivotZone of the pivot dies outright (tier 3 widens pivotZone). World 3's boss reward
    kitchen: { name: 'Kitchen Shears', blurb: 'Heavy serrated blades. Slow to open, and nothing bites harder.',
               story: "The good shears, wound up in the middle of the Twine Ball. Slow and heavy: catch a Burr right by the pivot and it's done.",
               svg: 'assets/weapons/kitchen.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 336, maxOpenDeg: 26, reachFrac: 0.118, damageMult: 1.9, openMs: 760,
               signature: 'notch', pivotExecute: true, pivotZone: 0.18, pivotTypes: ['burr', 'beetle'], shop: null },   // pivotTypes = the enemy types its pivot executes
    // the embroidery stork (the beak is the blades, the screw its eye): tiny, the quickest to open, short reach;
    // weakAlways: every snip counts as a weak-spot hit (tier 3 widens critZone). World 4's boss reward
    stork:   { name: 'Stork Snips', blurb: 'Tiny gold embroidery snips. Open in a blink, and every snip finds the soft spot.',
               story: "The Skeleton Key kept them locked in the bedside drawer for years. Tiny, quick, and every snip finds the soft spot.",
               svg: 'assets/weapons/stork.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 480,
               bladeLen: 284, maxOpenDeg: 24, reachFrac: 0.078, damageMult: 0.9, openMs: 260,
               signature: 'nick', weakAlways: true, critZone: 0.3, critMult: 1.5, shop: null },
    // gift-wrap shears: the longest, thinnest blades, light damage; every snip leaves a ribbon curl on the road for
    // curlSec that slows whatever crosses it to curlSlow (tier 3: longer curls). On sale after world 5's level 2
    ribbon:  { name: 'Ribbon Shears', blurb: 'The longest, thinnest blades. Cuts light, and leaves a curl that slows them down.',
               story: "Out of the gift-wrap box, last year's bows still on. The longest blades in the house, and every snip leaves a curl.",
               svg: 'assets/weapons/ribbon.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 540,
               bladeLen: 456, maxOpenDeg: 22, reachFrac: 0.165, damageMult: 0.7, openMs: 520,
               signature: 'curl', curlSec: 3, curlSlow: 0.5, shop: 600, shopAfter: 'candlelight' },
  },
  defaultWeapon: 'safety',   // the one weapon held from the start (level 0 reveals it); the rest are won or bought
  // the Ribbon Shears' curls (game.js state.curls; their curlSec / curlSlow are the weapon's): each snip drops one on the
  // road point nearest the cut's centre (if the road is within a blade length of it)
  curlPx: 30,                // a curl slows an enemy whose centre comes within this many world px of it (plus the enemy's radius)
  curlMax: 12,               // curls on the road at once (a pooled list; the oldest is replaced when it's full)
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
  lampMult: 1.3,             // weak-spot hit (an enemy in a Lamp Pin's ring, and every Stork Snips hit; the two stack): graded snip damage x this

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
  fadeInMs: 80,              // scissors fade-in when the finger(s) land
  spacePulseMs: 220,         // Space-key snip: visual snap-shut-and-reopen duration
  snipParticles: 26,         // spark count in the pivot burst
  showFingers: true,         // draw faint markers at the finger/handle points (debug)

  // --- enemies ---
  maxEnemies: 40,            // pool size = on-screen cap; a scheduled spawn waits if the pool is full
  // r = radius px, hp, tier = workshop damage (and 2+ = "medium+" for hit-stop), score = kill points,
  // traverseSec = seconds to walk the whole path, gapMs = spacing between members of one spawn group,
  // pushScale = how far shoves move it (0 = immovable), armor = first snip clangs unless slowed, boss = Seam Ripper rules.
  // color = felt body, patch / patch2 = sewn-on patches (also the kill fragments' colours).
  // fireImmune = Fire Pins don't burn it; flat = no weak spot (every snip does tip damage, wherever it lands);
  // ringExecute = a Cigar Cutter snip with its centre inside the hole kills it outright.
  // The five worlds' enemies (docs/worlds.md; game.js checks each flag where noted):
  // light = a gust (worldRules.autumn) carries it gustLeafMult x as far; driftPx / driftSec = it drifts side to side
  // across the road this far (world px, capped at the road's edge), once round every driftSec.
  // tipImmune = a graded snip landing at grade g >= this (0 = pivot, 1 = tips; 0.5 = the tip half) does nothing ("SPIKES!").
  // hopEverySec / hopU / hopSec / hopPx = every hopEverySec on the ground it takes off and lands hopU of a
  // traverseRefLen-long road further on over hopSec, hopPx high at the top (drawn); in the air snips, Pins, SHRED and
  // blade contact miss it.
  // growHpPerSec / growRPerSec / growMax = on the road it gains this much base hp (times its level / rank scaling) and
  // radius (px) a second, up to growMax x its starting hp and radius.
  // iceImmune = Ice Pins neither slow nor freeze it; iceFireMult = fire burn ticks do this x damage to it.
  // mini = a mini boss (boss: true too): fought mid-wave as a wave entry (a short banner, no intro card), rules in CONFIG.bosses.
  enemyTypes: {
    scrap:      { r: 13, hp: 1,  levelHp: 0.5, tier: 1,  score: 10,  traverseSec: 12, gapMs: 300,  pushScale: 1.2,  color: '#eadcc3', patch: '#3f73d8', patch2: '#d8423a' },
    bolster:    { r: 24, hp: 3,  levelHp: 1, tier: 2,  score: 25,  traverseSec: 26, gapMs: 1400, pushScale: 0.8,  color: '#e6b85c', patch: '#7a4fc9', patch2: '#3f73d8' },
    brute:      { r: 38, hp: 6,  levelHp: 1, tier: 3,  score: 60,  traverseSec: 32, gapMs: 2500, pushScale: 0.35, armor: true, color: '#b8946a', patch: '#3f6fc4', patch2: '#c0392b' },
    runner:     { r: 11, hp: 1,  levelHp: 0, tier: 1,  score: 15,  traverseSec: 6.5, gapMs: 450, pushScale: 1.4, color: '#7fc46a', patch: '#f2c230', patch2: '#d8423a' },
    beetle:     { r: 34, hp: 10, levelHp: 0.5, tier: 3,  score: 80,  traverseSec: 36, gapMs: 3200, pushScale: 0.25, fireImmune: true, flat: true, ringExecute: true, color: '#c8433a', patch: '#f4e3c1', patch2: '#2b1a10' },
    leaf:       { r: 14, hp: 1,  levelHp: 0.5, tier: 1,  score: 12,  traverseSec: 14, gapMs: 450,  pushScale: 1.5,  light: true, driftPx: 16, driftSec: 2.2, color: '#e0842f', patch: '#a8432a', patch2: '#f2c230' },
    burr:       { r: 22, hp: 4,  levelHp: 1, tier: 2,  score: 35,  traverseSec: 24, gapMs: 1600, pushScale: 0.6,  tipImmune: 0.5, color: '#8a7a3a', patch: '#5c6b2a', patch2: '#d8a33d' },
    moth:       { r: 15, hp: 2,  levelHp: 0.5, tier: 1,  score: 20,  traverseSec: 18, gapMs: 700,  pushScale: 1.2,  hopEverySec: 3.2, hopU: 0.1, hopSec: 0.9, hopPx: 46, color: '#d9cfb8', patch: '#9a7bc0', patch2: '#f2e3a8' },
    snowball:   { r: 14, hp: 2,  levelHp: 0.5, tier: 1,  score: 25,  traverseSec: 22, gapMs: 1200, pushScale: 1,    growHpPerSec: 0.2, growRPerSec: 1.2, growMax: 2.2, color: '#f4f7fb', patch: '#d8423a', patch2: '#3f73d8' },
    icicle:     { r: 11, hp: 1,  levelHp: 0, tier: 1,  score: 18,  traverseSec: 6.5, gapMs: 450, pushScale: 1.4, iceImmune: true, iceFireMult: 2, color: '#bfe9ff', patch: '#5aa8e0', patch2: '#ffffff' },
    // mini bosses (boss + mini: 2.5 x an enemy, fought mid-wave; hp not scaled per wave or level; rules in CONFIG.bosses)
    bobbin:     { r: 34, hp: 12, tier: 4,  score: 200, traverseSec: 34, gapMs: 0,    pushScale: 0,    boss: true, mini: true, color: '#d9a35c', patch: '#e0312b', patch2: '#7a4a24' },
    zipper:     { r: 32, hp: 10, tier: 4,  score: 220, traverseSec: 30, gapMs: 0,    pushScale: 0,    boss: true, mini: true, color: '#b9c2cc', patch: '#3f73d8', patch2: '#e6b85c' },
    honeydipper:{ r: 33, hp: 14, tier: 4,  score: 250, traverseSec: 36, gapMs: 0,    pushScale: 0,    boss: true, mini: true, color: '#c98a3d', patch: '#f2b632', patch2: '#7a4a1f' },
    bottlecap:  { r: 34, hp: 14, tier: 4,  score: 260, traverseSec: 40, gapMs: 0,    pushScale: 0,    boss: true, mini: true, armor: true, color: '#d8423a', patch: '#f4e3c1', patch2: '#c9d1d8' },
    snowglobe:  { r: 36, hp: 16, tier: 4,  score: 280, traverseSec: 36, gapMs: 0,    pushScale: 0,    boss: true, mini: true, color: '#bfe6ff', patch: '#7a4a24', patch2: '#2e8a6a' },
    // bosses (boss: true): their rules are in CONFIG.bosses, and their hp is not scaled by hpPerWave or hpPerLevel
    seamRipper: { r: 56, hp: 30, tier: 10, score: 500, traverseSec: 30, gapMs: 0,    pushScale: 0,    boss: true,  color: '#6a3596', patch: '#e84a5f', patch2: '#ffd23f' },
    bruteKing:  { r: 62, hp: 50, tier: 10, score: 800, traverseSec: 70, gapMs: 0,    pushScale: 0,    boss: true,  armor: true, color: '#9c7650', patch: '#3f6fc4', patch2: '#c0392b' },
    unstitcher: { r: 64, hp: 90, tier: 10, score: 1500, traverseSec: 40, gapMs: 0,   pushScale: 0,    boss: true,  color: '#2e2a4a', patch: '#8fe8ff', patch2: '#e84a5f' },
    twine:      { r: 62, hp: 60, tier: 10, score: 1100, traverseSec: 60, gapMs: 0,   pushScale: 0,    boss: true,  armor: true, color: '#d9b47a', patch: '#a8743a', patch2: '#e0312b' },
    skeletonkey:{ r: 60, hp: 70, tier: 10, score: 1300, traverseSec: 70, gapMs: 0,   pushScale: 0,    boss: true,  color: '#c9a347', patch: '#3a2a4a', patch2: '#8fe8ff' },
  },
  // Enemy ranks: from map level fromLevel on, wave spawns (not bosses, their escorts or level 0) can come as a tougher,
  // recoloured rank 2 or 3 of their type. The rank mix m = start + perLevel x (map level - fromLevel) + perWave x (wave - 1)
  // (Random Quilt / Custom Road count as map level hpOffMapLevel): up to 1 it is the share of rank 2 (the rest rank 1);
  // past 1 there are no rank 1s left and m - 1 is the share of rank 3 (the rest rank 2).
  enemyRanks: {
    fromLevel: 4,            // the first map level (global number, 1-4) with ranked enemies: a few rank 2s
    start: 0.1,              // the mix at that level's first wave...
    perLevel: 0.045,         // ...plus this per global level after it (rank 2s phase in through worlds 1-2, rank 1s gone near 3-4, rank 3s fill worlds 3-5, all rank 3 near 5-6)...
    perWave: 0.03,           // ...plus this per wave within a level
    hpMult: [1, 1.4, 1.8],   // hp x by rank (on top of the wave and level scaling)
    speedMult: [1, 1.06, 1.12], // walking speed x by rank (a touch quicker, not a sprint)
    scoreMult: [1, 1.5, 2],  // kill score x by rank (thread per kill is the same)
    // each type's colours at ranks 2 and 3 (body, patch, patch2; the rank 1 colours are the type's own)
    colors: {
      scrap:   [{ color: '#9fb8d8', patch: '#e8a33d', patch2: '#6b3fa0' }, { color: '#4f4468', patch: '#ff5a6e', patch2: '#ffd23f' }],
      bolster: [{ color: '#d9854a', patch: '#3f73d8', patch2: '#2e8a6a' }, { color: '#8c3b3b', patch: '#ffd23f', patch2: '#8fe8ff' }],
      brute:   [{ color: '#7f8fa3', patch: '#d8423a', patch2: '#e6b85c' }, { color: '#45404f', patch: '#ff5a6e', patch2: '#9fe36a' }],
      runner:  [{ color: '#3fae9e', patch: '#ff8a3d', patch2: '#f2c230' }, { color: '#2f5a3a', patch: '#ffd23f', patch2: '#ff4a3d' }],
      beetle:  [{ color: '#3d7dc8', patch: '#f4e3c1', patch2: '#2b1a10' }, { color: '#6a2f8a', patch: '#ffd23f', patch2: '#2b1a10' }],
      leaf:    [{ color: '#c9502c', patch: '#f2c230', patch2: '#6b3a1f' }, { color: '#7a3b22', patch: '#ffd23f', patch2: '#e0842f' }],
      burr:    [{ color: '#6f5a2e', patch: '#9fb84a', patch2: '#e8c25a' }, { color: '#4a3b2a', patch: '#ff7a3d', patch2: '#ffd23f' }],
      moth:    [{ color: '#b7a6d6', patch: '#5a8fd8', patch2: '#fff1b8' }, { color: '#4f4468', patch: '#ff8adf', patch2: '#8fe8ff' }],
      snowball:[{ color: '#dcecf7', patch: '#2e8a6a', patch2: '#ffd23f' }, { color: '#b9d2e8', patch: '#7b3fc4', patch2: '#ff5a6e' }],
      icicle:  [{ color: '#8fd0f2', patch: '#2f63c9', patch2: '#e8fbff' }, { color: '#5a7fd8', patch: '#1d2a6a', patch2: '#bff4ff' }],
    },
  },
  hpPerWave: 0.1,            // each wave after the first adds this fraction of base hp (wave 6 = 1.5x); fractional hp means a tip hit no longer kills
  // A map level's hp: 1 + hpPerWave x (wave - 1) + levelHp x (hpPerWorld x (world - 1) + hpPerLevel x (n - 1)),
  // world 1..5 and n 1..10 its place on the map (meta.js levelPlace; docs/worlds.md "Difficulty").
  hpPerWorld: 0.3,           // each world after the first adds this fraction of base hp x the type's levelHp (0.3, not 0.5: ranks' hpMult stack on top)
  hpPerLevel: 0.06,          // each level inside a world after its first adds this fraction of base hp x the type's levelHp
  hpOffMapWorld: 3,          // Random Quilt / Custom Road scale as this world... (fixed, so ?seed= replays match)
  hpOffMapLevel: 5,          // ...and this level in it (3-5; global level 25 for the wage cap and the rank mix)
  waddleDeg: 6,              // side-to-side rock while walking
  pathReturnRate: 1.6,       // how fast a shoved enemy drifts back onto the road (per second)

  // --- bosses: only on boss levels (the level's last wave is the boss alone). Each tests one skill. ---
  // name + taunt = the intro card (two short lines, auto-dismissed after bossIntroMs); roar = its sfx.js entry.
  // taunt2 = one more line under its HP bar once its HP drops to bossTauntAt (render.js drawBossHint). The taunts
  // carry the story (src/story.js); the rule the player needs is the bossHints line under the bar.
  bossIntroMs: 3000,         // the intro card shows this long; the boss walks on as it closes
  bossTauntAt: 0.5,          // the boss's taunt2 shows once its HP fraction drops to this...
  bossTauntSec: 4,           // ...for this long, under the rule line
  bossTurns: [0.8, 0.2],     // seam bosses walk forward to 80% of the road, back to 20%, then on to the workshop
  bossTremblePx: 3,          // how far an armored boss shakes side to side while winding up for a charge
  helmFlySec: 0.55,          // an armored boss's charge knocks its thimble helmet off: it tumbles to the ground beside it this long...
  helmPickupSec: 0.6,        // ...and the last this-long of armorDownSec it picks it back up (the armor is on again as it lands on its head)
  helmLand: [1.45, 0.75],    // where the helmet lands, in the boss's radii from its centre: sideways (alternating sides), down
  seamPeriodSec: 2,         // the seam's spot goes once around the body in this long (where Expert blades must cross it)
  seamArcDeg: 22,            // half-width of the seam arc
  seamHitTolPx: 12,          // Expert: the closed-blade line must pass this close to the seam to count as over it
  bosses: {
    // timing: every seamEverySec its seam splits open for seamOpenSec (a dim shimmer seamWarnSec before). A snip while
    // it's open does openDmg, otherwise closedDmg (flat). Expert (Pinch) controls: an open-seam snip whose blades don't
    // cross the seam does expertOffSeamDmg instead.
    seamRipper: { name: 'The Seam Ripper', mode: 'seam', taunt: 'They never once used me. Now I undo everything!', taunt2: 'Nobody even noticed I was gone!', roar: 'roarRipper',
                  seamEverySec: 3, seamOpenSec: 1, seamWarnSec: 0.4, openDmg: 5, closedDmg: 1, expertOffSeamDmg: 2 },
    // timing + patience: armored (a thimble helmet); every chargeEverySec it charges chargePx along the road over chargeSec (a burst of
    // speed that swells and fades; the next chargeEverySec starts after it), trembling for
    // windupSec before, so the player can get ready), then the helmet flies off and it stands dazed for armorDownSec
    // (its seams glow; it picks the helmet back up at the end, helmPickupSec, and walks on): snips
    // then do armorDownMult x normal damage. Ice and SHRED don't slow it. The bossHints line tells the player the rule.
    bruteKing:  { name: 'The Brute King', mode: 'armor', taunt: 'Every scrap you ever cut, stuffed into me!', taunt2: 'Mind the helmet! Thimbles don’t grow on trees!', roar: 'roarKing',
                  chargeEverySec: 7, chargePx: 200, chargeSec: 1.4, windupSec: 1.2, armorDownSec: 2.6, armorDownMult: 3 },
    // three phases, switching at phaseAt (hp fractions). 1: its escort Scraps (swarmSize of them, swarmGapPx apart along
    // the road, half ahead and half behind) hold up a shield that blocks every hit. Cutting the last one drops it for
    // shieldDownSec (snips do shieldDownMult x graded damage); it comes back with a fresh swarm. While the shield is up,
    // every swarmEverySec it refills any empty escort places. 2: armored and charging like the Brute King.
    // 3: an opening seam like the Seam Ripper, faster.
    unstitcher: { name: 'The Unstitcher', phases: ['swarm', 'armor', 'seam'], taunt: 'Past the back seam, nothing stays sewn!', taunt2: 'I was the loose thread you never pulled!', roar: 'roarUnstitcher',
                  phaseAt: [0.66, 0.33], swarmEverySec: 5, swarmSize: 4, swarmGapPx: 42, shieldDownSec: 3, shieldDownMult: 2,
                  chargeEverySec: 5, chargePx: 180, chargeSec: 1.2, windupSec: 1, armorDownSec: 1.8, armorDownMult: 3,
                  seamEverySec: 2, seamOpenSec: 0.8, seamWarnSec: 0.3, openDmg: 5, closedDmg: 1, expertOffSeamDmg: 2 },
    // World 3 boss: armor mode (charges like the Brute King, no helmet: it stands dazed between charges) + captures:
    // regular enemies it rolls over during a charge are wrapped (maxCaptures at most, swarmGapPx apart around it) and
    // shield it (unstickSec: a freed one can't be wrapped again for this long); cutting a wrapped one frees everything
    // wrapped on that same charge. Graded hits (x armorDownMult) land
    // only while it's dazed and nothing is wrapped.
    twine:      { name: 'The Twine Ball', mode: 'armor', captures: true, helmet: false, taunt: 'Everything in this drawer ends up wound into me!', taunt2: 'Stop pulling my loose end!', roar: 'roarTwine',
                  chargeEverySec: 6, chargePx: 230, chargeSec: 1.4, windupSec: 1.1, armorDownSec: 2.6, armorDownMult: 3, maxCaptures: 6, swarmGapPx: 40, unstickSec: 3,
                  // as each wind-up starts, feedCount feedType enemies tumble onto the road feedAheadPx ahead of it (its charge rolls over them)
                  feedType: 'scrap', feedCount: 3, feedAheadPx: [70, 190] },
    // World 4 boss: seam mode + unlocks, walking forward only (forward: no bossTurns). Every unlockEverySec it turns
    // with a click for unlockSec (its teeth open: openDmg, else closedDmg) and unlockMoths Moths come in by the level's
    // second entrance (its only one if it has one).
    skeletonkey:{ name: 'The Skeleton Key', mode: 'seam', unlocks: true, forward: true, taunt: 'Every lock in this house opens for me. Out you come, moths!', taunt2: 'You can’t lock me out. I AM the key!', roar: 'roarKey',
                  unlockEverySec: 6, unlockSec: 1.5, seamWarnSec: 0.5, unlockMoths: 3, openDmg: 6, closedDmg: 1, expertOffSeamDmg: 2, openSfx: 'keyClick' },
    // --- mini bosses (mini: true; their enemyTypes entry has boss + mini): one per world on level 5, fought mid-wave
    // (a wave entry like any type) while spawns go on: a miniBannerMs banner with the name and the roar, no intro card,
    // the HP bar and rule line while one lives. They walk forward only (no bossTurns), can't be shoved or slowed, and
    // Pins hit them where the mode lets a snip through.
    // trail: walks; every spoolEverySec it drops a Scrap spoolBackPx behind it on its road (a dim gold ring spoolWarnSec
    // before: a hit then cancels that one). Graded snips x hitMult. Kill it and the Scraps stop.
    bobbin:     { name: 'The Bobbin', mini: true, mode: 'trail', taunt: 'Round and round, and every turn a new one!', roar: 'roarBobbin',
                  spoolEverySec: 3, spoolWarnSec: 0.8, spoolBackPx: 34, hitMult: 1 },
    // swarm, escortLine + noRefill: its teeth are swarmSize Scraps in a line behind it, swarmGapPx apart, spawned once;
    // the head is shielded while a tooth lives, then open for good (graded x shieldDownMult).
    zipper:     { name: 'The Zipper', mini: true, mode: 'swarm', escortLine: true, noRefill: true, taunt: 'Bite down, boys! Nobody gets through!', roar: 'roarZipper',
                  swarmSize: 5, swarmGapPx: 30, shieldDownMult: 1.5 },
    // swarm, captures: spawns no escorts; a regular enemy within stickPx of its edge sticks (up to maxCaptures, swarmGapPx
    // apart round it), rides along and shields it; a snip on it shakes one loose (it drops back on the road). With nothing
    // stuck, graded x shieldDownMult.
    honeydipper:{ name: 'The Honey Dipper', mini: true, mode: 'swarm', captures: true, taunt: 'Come closer, sweetie. Everyone sticks to me.', roar: 'roarDipper',
                  stickPx: 18, maxCaptures: 6, swarmGapPx: 30, shieldDownMult: 1.5, unstickSec: 2.5 },   // unstickSec: one shaken loose can't stick again for this long
    // armor, rolling (no helmet): rolls chargePx along the road over chargeSec in a burst, bouncing between the road's
    // edges at bouncePx/s (hits clang), then wobbles to a stop for armorDownSec (graded x armorDownMult), then rolls on.
    bottlecap:  { name: 'The Bottle Cap', mini: true, mode: 'armor', rolling: true, helmet: false, taunt: 'Popped off and rolled under. Catch me if you can!', roar: 'roarCap',
                  chargePx: 240, chargeSec: 1.6, armorDownSec: 2.2, armorDownMult: 2, bouncePx: 140 },
    // seam, shake: every shakeEverySec it shakes for shakeSec (a shimmer seamWarnSec before): the screen shakes shakePx,
    // every built Pin is snowed under (off) for snowSec, and only then do snips do openDmg (closedDmg otherwise; no seam line to cross).
    snowglobe:  { name: 'The Snow Globe', mini: true, mode: 'seam', shake: true, taunt: 'Shake me and the whole world goes white!', roar: 'roarGlobe',
                  shakeEverySec: 6, shakeSec: 1.6, seamWarnSec: 0.6, snowSec: 4, shakePx: 9, openDmg: 4, closedDmg: 0.5, expertOffSeamDmg: 4, openSfx: 'globeShake' },
  },
  miniBannerMs: 1800,        // a mini boss's name banner shows this long as it walks on (no intro card)
  // The rule line under the boss bar (render.js), by what the boss is doing right now. Gold = snip now.
  bossHints: {
    swarm: 'Cut its Scraps to break the shield',     // swarm, shield up
    shieldDown: 'Shield down: SNIP NOW!',
    armor: 'Armored: wait for its charge',
    windup: 'It’s about to charge!',
    armorDown: 'Helmet off: SNIP NOW!',
    seam: 'Snip when its seam opens',
    seamOpen: 'Seam open: SNIP NOW!',
    trail: 'Snip it before it spools another Scrap',   // trail (Bobbin), and gold just before it spools
    trailNow: 'Spooling: SNIP to stop it!',
    wrapped: 'Cut a wrapped one to free its catch',     // armor + captures, dazed but shielded by what it wrapped
    // per boss: its own words for the keys above (any key it lacks uses the line above)
    bobbin: { trail: 'Snip it before it spools another Scrap', trailNow: 'Spooling: SNIP to stop it!' },
    zipper: { swarm: 'Cut its teeth to open it up', shieldDown: 'Unzipped: SNIP NOW!' },
    honeydipper: { swarm: 'Snip it to shake the stuck ones loose', shieldDown: 'Nothing stuck: SNIP NOW!' },
    bottlecap: { armor: 'Rolling: wait for it to stop', windup: 'Rolling: wait for it to stop', armorDown: 'Stopped: SNIP NOW!' },
    snowglobe: { seam: 'Snip it while it shakes', seamOpen: 'Shaking: SNIP NOW!' },
    twine: { armor: 'Wound tight: wait for its roll', windup: 'It’s about to roll!', armorDown: 'Unwound: SNIP NOW!', wrapped: 'Cut a wrapped one to free its catch' },
    skeletonkey: { seam: 'Snip its teeth when it turns', seamOpen: 'Turning: SNIP NOW!' },
  },
  bossHintPulseSec: 0.7,     // the rule line swells and glows this long when it changes

  // --- world rules (docs/worlds.md), by the level's `world` (game.js worldRule(); meadow and denim have none) ---
  worldRules: {
    // gusts: every gustEverySec of the wave clock a GUST banner (gustBannerMs) blows across and every enemy on the road
    // (not a boss, an escort, or one held, pulled, frozen or in the air) is carried gustU of a traverseRefLen-long road
    // forward over gustSec (light ones, the Leaves, gustLeafMult x as far)
    autumn: { gustEverySec: 14, gustU: 0.12, gustSec: 0.9, gustLeafMult: 2, gustBannerMs: 1400 },
    // the dark: the plate is dimmed (dim = the overlay's opacity) outside pools of light, in plate units: the level's
    // `lights` ({x, y, r}; r defaults to lightR), each Lamp Pin's ring, the heart pad (heartLightR) and every built Pin
    // (pinLightR); enemies whose centre is in the dark (outside litCore of every light's radius: its soft rim counts as
    // dark) are drawn at darkAlpha with no weak spot shown
    night: { lightR: 260, darkAlpha: 0.35, heartLightR: 300, pinLightR: 110, dim: 0.62, litCore: 0.8 },
    // the cold: an Ice Pin's slow keeps coldIceMult of its strength (slowMult 0.4 -> 1 - 0.6 x 0.6 = 0.64), burns last
    // coldBurnMult x as long, and armored enemies (Brutes) take coldArmor clangs to strip
    snow: { coldIceMult: 0.6, coldBurnMult: 1.6, coldArmor: 2 },
  },

  // --- kill impact ---
  hitStopMs: 60,             // whole-game freeze on a medium+ (tier >= 2) kill
  bossHitStopMs: 180,        // freeze on the boss kill
  killShakePerR: 0.18,       // screen-shake px added per px of the killed enemy's radius
  killShakeMaxPx: 12,        // screen-shake cap
  killShakeMs: 260,          // screen shake decays over roughly this long
  fragmentsPerKill: 6,       // shards per kill
  fragmentSpeed: 260,        // px/s shard launch speed
  fragmentLifeMs: 650,       // shard fade time

  // --- levels: the level data lives in src/levels/ (one file per level; src/levels/index.js loads them) ---
  // The level map (between the title and the shears): one plate per world (docs/worlds.md), shown one at a time with
  // arrows (levelMap.js), in play order. Per world: id (the level files' `world`), name (over the plate), img (its map
  // art; '' = a felt stand-in drawn with CSS in the world's `look` colours, the patches as round felt buttons), w / h
  // (the plate in px), nodes = [level id (a src/levels/ file), patch centre x, y] in the plate's px (level 0, the
  // tutorial, is world 1's patch 0; the rest are numbered 1..10 in order), chest = where the world's chest sits, hitW /
  // hitH = each patch's tap area. Global level numbers (wage cap, rank mix) count the worlds' patches in order.
  map: {
    worlds: [
      // Round 5 map plates (assets/kit/maps, 936 x 1681 each; the patch centres were measured off the art and must be
      // re-measured if a plate changes). `look` is only for the felt stand-in a world without a plate would get.
      { id: 'meadow', name: 'The Sewing Tray', img: 'assets/kit/maps/meadow_map_01.webp', w: 936, h: 1681,
        nodes: [['first', 507, 1527], ['meadow', 287, 1379], ['clover', 376, 1204], ['hem', 692, 1103], ['tack', 610, 935], ['bobbin', 282, 832],
          ['double', 379, 658], ['blanket', 677, 541], ['gather', 595, 391], ['backstitch', 282, 289], ['running', 489, 148]],
        chest: { x: 790, y: 1300 }, hitW: 160, hitH: 140 },
      { id: 'denim', name: 'The Mending Pile', img: 'assets/kit/maps/denim_map_01.webp', w: 936, h: 1681,
        nodes: [['fork', 630, 1540], ['loop', 375, 1370], ['rivet', 278, 1205], ['pocket', 542, 1068], ['zipper', 655, 905],
          ['cross', 405, 757], ['patchwork', 283, 587], ['bias', 525, 460], ['seam', 624, 274], ['hemline', 290, 155]],
        chest: { x: 150, y: 1000 }, hitW: 160, hitH: 140,
        look: { ground: '#2f4f7f', edge: '#1b2f4f', road: '#d9c7a0', felt: '#b85a2e', rim: '#4a2010' } },
      { id: 'autumn', name: 'The Kitchen Drawer', img: 'assets/kit/maps/autumn_map_01.webp', w: 936, h: 1681,
        nodes: [['leafpile', 572, 1398], ['corkscrew', 388, 1249], ['ruler', 275, 1109], ['pinecone', 578, 949], ['honeydipper', 700, 794],
          ['toadstool', 412, 664], ['harvest', 324, 485], ['pumpkin', 549, 377], ['bonfire', 625, 230], ['twine', 343, 115]],
        chest: { x: 150, y: 620 }, hitW: 160, hitH: 140,
        look: { ground: '#8a5426', edge: '#5a3414', road: '#e8cf9a', felt: '#d9962e', rim: '#5a3510' } },
      { id: 'night', name: 'The Bedside Drawer', img: 'assets/kit/maps/night_map_01.webp', w: 936, h: 1681,
        nodes: [['lanternlane', 580, 1485], ['keyring', 397, 1333], ['marble', 302, 1180], ['selvage', 565, 1045], ['bottlecap', 675, 885],
          ['pencil', 425, 750], ['clothespin', 305, 587], ['cookiecutter', 530, 457], ['moonlight', 615, 288], ['skeletonkey', 360, 152]],
        chest: { x: 790, y: 1310 }, hitW: 160, hitH: 140,
        look: { ground: '#24264f', edge: '#5a3a22', road: '#b9b0d8', felt: '#7a5ab8', rim: '#2a1850' } },
      { id: 'snow', name: 'The Holiday Box', img: 'assets/kit/maps/snow_map_01.webp', w: 936, h: 1681,
        nodes: [['firstsnow', 600, 1512], ['candlelight', 377, 1345], ['sledrun', 253, 1171], ['icicle', 557, 1020], ['snowglobe', 677, 850],
          ['lair', 447, 722], ['tinsel', 281, 560], ['cabin', 550, 451], ['blizzard', 593, 279], ['whip', 303, 145]],
        chest: { x: 140, y: 1330 }, hitW: 160, hitH: 140,
        look: { ground: '#dfe8ef', edge: '#6b4423', road: '#b9cbd8', felt: '#b83a3a', rim: '#4d140c' } },
    ],
    bigNode: 1.3,            // felt stand-in plates: the 5th (mini boss) and 10th (boss) patches are this much bigger
    locks: false,            // lock levels until the one before is cleared (false keeps every level open for playtesting)
    lockWorlds: true,        // a world opens once the previous world's level 10 (its boss) is cleared
    // compat, read-only: every world's nodes in one list (index = the global level number); new code uses meta.js
    // mapIds() / levelPlace(). Remove once nothing reads CONFIG.map.nodes.
    get nodes() { return this.worlds.flatMap(w => w.nodes); },
  },
  defaultLevel: 'meadow',    // level picked on first launch (afterwards the last choice is remembered)
  tutLevel: 'first',         // level 0, the no-text tutorial: PLAY opens it until it has been cleared once

  // --- level generator (src/levelGen.js): recipe -> road, Pin pads, workshop; all in plate units (941 x 1672) ---
  // Segments stack top to bottom between startY and endY; each gets its minimum height plus a share of what's left
  // (by weight). The road enters at the top (startX) and ends on the heart pad (heartX, heartY).
  levelGen: {
    w: 941, h: 1672,         // plate size (same as the painted plates)
    startX: 470,             // where the road enters at the top (a recipe's "start left/right" moves it)
    startY: 50,              // segments start this far down
    endY: 1280,              // ...and end here; the road then turns into the heart pad
    heartX: 470, heartY: 1470, // the workshop (kept above the bottom action bar)
    workshopR: 112,          // heart pad radius
    xMin: 175, xMax: 766,    // road centreline stays in this band so narrow phones (which crop the sides) still show it
    roadHalf: 56,            // painted road half-width (beige part)
    roadBorder: 10,          // painted brown edge outside that
    roadHalfWidth: 45,       // gameplay: how far a shove can move an enemy off the centreline
    roadGap: 30,             // at least this much denim between two stretches of road that aren't joined
    sAmp: 200,               // "s": how far each swing goes from the middle
    waveAmp: 160,            // "wave": swing size
    wiggleAmp: 80,           // "wiggle": swing size
    zigInset: 70,            // "zigzag": rows stop this far short of the band's edge (the U-turns use the rest)
    zigRowMin: 205,          // "zigzag": minimum height per row (road width + gap)
    forkHalfW: 280,          // "fork": arm distance from the middle ("wide" 305, "narrow" 220)
    forkLead: 110,           // "fork": straight bit before it splits
    spotR: 84,               // Pin pad radius
    spotGap: 22,             // denim between a pad and the road edge
    spotSpacing: 60,         // extra space between two pads
    spotsMin: 3, spotsMax: 5, // how many pads...
    spotEveryLen: 650,       // ...about one per this much road
    spotXMin: 180, spotXMax: 761, // pad centres stay in this band (narrow phones crop the sides)
    spotYMin: 250, spotYMax: 1330, // pad centres stay out of the HUD row and off the action bar
    maxRoutes: 6,            // at most this many routes from forks (a fork doubles them, a "triple" triples them)
    maxPaths: 9,             // at most this many paths in all, counting the copies each side entrance adds
    entryStraight: 50,       // every road comes on square to the screen edge for at least this far before it turns
    cropX: 80,               // how much of each side a narrow phone crops off the plate (a side road's straight bit starts past it)
    entryClear: 230,         // "entry": how far a side road runs beside the road it joins before it merges in (plate units)
    entryTries: 40,          // "entry": merge points tried before the entrance is dropped
    heartShift: 130,         // "heart left/right": how far the heart pad moves off the middle
    spiralRx: 330, spiralRy: 520, // "spiral": the outer ring's half-width and half-height (the heart pad sits in the middle of the plate)
    spiralTurns: 1.25,       // "spiral": turns round the heart (fewer if the road would touch itself)
    // plate painting (src/levelArt.js; which props each zone uses is in src/kit.js). Counts are for a size 1 plate; a
    // bigger level (shown zoomed out) gets more of them, each drawn bigger (propSizeGain), so fewer than its area alone would give
    propScale: 1.2,          // every prop inside the tray (heroes, clusters, singles, fill, carpet, ponds) is drawn this many times its kit scale
    propSizeGain: 0.6,       // ...and on a plate of size n, n ^ this times more (1.5: x1.28, 1.8: x1.42), so props lose less when the world zooms out; spreads, spacing and fill / carpet cells grow with it
    midHeroFrom: 1.2,        // a plate at least this size also gets heroes between the roads, at the centres of its biggest pockets of open ground
    midHeroes: [2, 3],       // ...this many (a range; fewer where the pockets are too small)
    midHeroClear: 36,        // ...each keeps this far (plate units) past the road's outer edge on top of its radius (clear of the fence)
    midHeroSpace: 260,       // ...and this far from another one (so each takes its own pocket)
    midHeroMin: 0.6,         // ...in a tight pocket it may shrink to this share of its hero-tier scale, no smaller
    midHeroCell: 16,         // ...the open ground is measured on a grid of cells this big (plate units)
    heroes: [1, 3],          // big focal props per plate (a zone's kit heroes), out in the margins beside the road
    heroFramedShare: 0.6,    // ...times this on a plate with a frame (its tray heroes sit in the compartments; these stay inside the walls)
    heroesTray: [3, 4],      // ...but a sewing-tray world (kit.js `tray`) gets this many big trees, along the walls
    heroWall: 0.4,           // ...a tray world's hero keeps only this share of its radius inside the wall's inner face (the rest leans over it)
    heroTries: 70,           // positions tried per hero (the clearest wins; one that fits nowhere shrinks, then is dropped)
    heroVisible: 0.5,        // a hero may hang off the plate's edge, but at least this share of it (its bounding square) shows
    heroInset: 0.3,          // it sits best with its centre this share of its radius in from the side edge
    heroOpenCost: 160,       // a hero may also stand in a big open stretch away from the margins, scored as if this far (plate units) from its best spot
    heroShrink: 0.85,        // a hero that fits nowhere tries again this much smaller (three times at most)
    clusters: 13,            // prop beds and heaps per plate (flower beds, bush groups, button spills, pin nests...)
    clusterTries: 30,        // clear centres drawn per cluster; the one farthest from the other clusters and heroes wins
    clusterAttempts: 12,     // ...and if that one can't hold enough of its pieces, the next farthest, this many in all
    clusterFill: 0.6,        // a cluster needs at least this share of its pieces (and two) to land, or it moves on
    clusterPack: 0.6,        // members of one cluster may overlap: they keep only this share of their radii apart
    clusterShade: 0.26,      // darkness of the soft shadow pooled under a cluster
    singles: 5,              // lone mid-size props per plate
    fillTries: 1100,         // fill pass: jittered spots tried across the plate (times size squared over the size gain squared) for small props on ground still bare
    fillNearRoad: 0.45,      // ...a fill prop's centre keeps only this share of its radius (plus propGap) off the road's edge
    fillWall: 0.4,           // ...and this share of its radius inside the tray wall (it may lean over the rest)
    fillPack: 0.75,          // ...fill props may overlap each other: they keep only this share of their radii apart
    contactAO: 0.32,         // darkness of the tight shadow pooled right under each prop (grounds it, under the soft drop shadow)
    propGap: 8,              // clear ground (plate units) between a prop and the road, a pad, or another cluster's props
    patches: { meadow: 3, denim: 8, lair: 5, autumn: 2, night: 2, snow: 2 }, // fabric patches on the ground per zone: at the plate's corners and edges, some overlapping, never centred on the road
    patchW: [200, 330],      // a patch's width range (plate units)...
    patchH: [160, 270],      // ...and height range
    patchOverlap: 0.4,       // share of the patches laid half over an earlier one instead of on a corner or edge of their own
    groundLayers: 1,         // the ground texture is laid again this many times, shifted and mirrored or turned, through soft blotchy masks, to hide the tile's repeat
    groundCell: 230,         // size of those blotches (plate units)
    toneCell: 330,           // size of the low-frequency light and dark washes over the ground (the zone's tint and shade)
    toneAlpha: 0.3,          // their strength
    quiltCol: [170, 330],    // denim quilt: column widths (plate units)...
    quiltRow: [140, 340],    // ...and square heights within a column (rows don't line up across columns)
    quiltJitter: 6,          // how far a quilt seam wanders off straight
    roadAO: 0.5,             // darkness of the wide soft shadow the road casts on the ground around it
    roadAOBlur: 34,          // its blur (plate units)
    grade: 0.45,             // colour grade over the whole plate: a soft-light wash from the zone's tint (top left) to its shade (bottom right)
    vignette: 0.5,           // darkness of the plate's edges
    // carpet (the zone's props.carpet, kit.js): tiny pieces packed into every patch of ground still bare after the fill pass
    carpetCell: 12,          // bare ground is found on a grid of cells this big (plate units, times the prop scale)
    carpetSpace: 1.05,       // a carpet piece keeps the next one this many of its radii away
    carpetCover: 0.75,       // a placed prop, pad or road covers the grid out to this share of its radius (carpet tucks in under the rest)
    carpetRoad: 26,          // carpet keeps this far off the road's outer edge (clear of the fence)
    carpetWall: 4,           // ...and this far inside the tray wall
    // ground features: ponds (props.ponds) and the satin river (zones with `river`), laid flat before the road
    ponds: { meadow: [1, 2], snow: [1, 3] }, // ponds per plate by zone (a range; times the level's size)
    pondTries: 60,           // places tried per pond
    pondClear: 30,           // clear ground between a pond and the road's edge, a pad, the heart or another pond
    riverW: 120,             // the river ribbon's width (plate units; the strip art is 120 wide on the plate)
    riverTries: 200,         // crossing points tried along the road, in a seeded order (each with every way out); the best that fits wins
    riverClear: 14,          // clear ground between the river and a pad (its fence ring), the heart pad, a fork button or the road away from the crossing
    riverStraight: 0.22,     // the road may turn at most this much (radians) across the crossing, so the bridge sits on a straight stretch
    riverSkew: 0.6,          // the river may also run straight across the plate, meeting the road up to this far (radians) off square
    riverBand: [0.24, 0.72], // the crossing stays within this share of the plate's height (clear of the HUD row and the heart)
    riverLeg: [150, 420],    // a bend comes this far (plate units) out from the crossing (or the river runs straight out to the plate's edge)
    riverPond: 1,            // where no way out fits, one half may end in a pond this big (x the pond art), once clear of the road
    riverTrim: 0.03,         // the river strip's rounded ends: this share of its length is cut off each end, and the pieces overlap
    riverBendCorner: [0.57, 0.31], // where the bend art's corner (its two centrelines' meeting point) is, as shares of its width and height
    riverBendScale: 1.4,     // the bend art is drawn this many times the strip's scale (its ribbon is drawn narrower)
    bridgeScale: 0.65,       // the ruler bridge's scale (x its file: 381 px long, so about 250 plate units), laid along the road over the crossing
    // light (the dark world reads `lights` off the painted level; see levelArt.js)
    lanternEvery: 430,       // the dark world (kit.js roadLanterns): a lantern beside the road about this often (plate units along each route)
    lanternOff: 46,          // ...this far out from the road's outer edge (past the fence)
    lanternScale: 0.38,      // ...its sprite's scale (x its file, about 60 plate units wide)
    lanternLight: 170,       // ...its light's radius (plate units)
    lightScale: 1,           // every lit prop's light radius times this (kit.js LIGHTS)
    glowShare: 0.55,         // the glow drawn under a lit thing reaches this share of its light's radius...
    glowAlpha: 0.5,          // ...at this strength (additive)
    // the road felt (refs: pale felt, a darker suede rim, a running stitch inside both edges)
    roadFeltWash: 0.16,      // a cream wash over the felt (lighter than the tile)
    roadRimDark: 0.3,        // the suede rim darkened by this much
    stitchInset: 14,         // the running stitch's centre this far in from the felt's edge
    stitchDash: [15, 11],    // ...dash and gap lengths
    stitchW: 4.5,            // ...line width
  },
  // road dressing on generated plates (src/roadKit.js; which pieces each zone uses is ZONES[zone].roadKit in src/kit.js).
  // Plate units; sprite scales are x the size the piece was drawn for on the plate (the files are 2x that)
  roadKit: {
    sharedTol: 16,           // a route's point this close to an earlier route's is on the same road (dressed once, by that route)
    entryClear: 150,         // nothing lines the road for this far from where a route comes onto the plate (the entrance gap)
    edgeClear: 24,           // ...nor this close to the plate's edge
    foldTol: 4,              // a side-line point closer than its offset (less this) to any road centreline is dropped: the inside of a tight bend, or another road
    // meadow fences
    fenceOffset: 18,         // post centres this far out from the road's outer edge
    postEvery: 52,           // post spacing, measured along the fence line
    postJitter: 0.18,        // each post's spacing varies by up to this share of postEvery (hand-set, not machine-even)
    postMinGap: 0.6,         // a post closer than this share of postEvery to another is skipped (and the chain breaks there)
    postScale: 1,            // post size
    postW: 28,               // a post is this wide (plate units) at postScale 1, whatever its file's size
    linkScale: 1.15,         // rope link / rail thickness (its length is stretched post to post)
    linkOverlap: 6,          // a link runs this far past each post's centre, under the post
    railChance: 0.5,         // share of meadow plates fenced with rails instead of rope
    fenceRun: [4, 9],        // posts in a run of fence...
    fenceGap: [90, 280],     // ...then this much open road side before the next
    fenceMin: 2,             // a run cut shorter than this many posts is dropped
    fenceClear: 16,          // posts keep this far from a pad, the heart pad and a fork button
    fenceShadow: [0.5, 5, 2, 4], // fence shadow: alpha, blur, x, y offset
    // denim / lair edge strips
    stripOffset: -3,         // the strip's road-side edge this far out from the road's outer edge (negative tucks it under the brown edge)
    stripScale: 1,           // strip size
    sliceLen: 8,             // the strip is laid in pieces this long, each turned to the road
    sliceOverlap: 1.5,       // each piece drawn this much longer, so no slits open round bends
    stripFade: 22,           // a strip fades in and out over this length where it starts and stops
    stripClear: 6,           // strips keep this far from a pad, the heart pad and a fork button
    stripAlpha: 0.92,        // strip opacity (a touch see-through so they sit in the ground)
    stripSwitch: 0.2,        // share of routes that take another strip variant than the plate's main one
    stripShadow: [0.35, 3, 1, 2], // strip shadow: alpha, blur, x, y offset
    // decals on the felt
    decals: 4,               // darns, boot-print walks and dropped pins per size-1 plate (times the level's size)
    decalMix: { darn: 1, boots: 1, pin: 1.2 }, // their relative odds
    decalTries: 20,          // spots tried per decal before it's dropped
    decalClear: 10,          // decals keep this far from a pad and a fork button
    heartClear: 60,          // ...and this far from the heart pad
    decalAlpha: { darn: 0.4, boots: 0.35, pin: 0.6, arrow: 0.45 }, // opacity per kind (low contrast on the felt)
    decalBlend: { darn: 'source-over', boots: 'multiply', pin: 'source-over', arrow: 'source-over' }, // blend per kind
    darnScale: [0.95, 1.2],  // darned patch size (turned to the road, so it spans most of the felt)
    bootScale: 0.8,          // boot print size
    bootStride: 40,          // boot prints this far apart along the road
    bootSide: 12,            // ...this far either side of the centreline
    bootToe: 0.08,           // ...toes turned out this much (radians)
    bootSteps: [4, 8],       // prints per walk
    pinScale: 0.75,          // dropped pin size
    pinInset: 22,            // pins stay this far inside the felt's edge
    arrowScale: 0.85,        // chalk arrow size
    arrowAt: 110,            // the arrow sits this far along its route from where it comes onto the plate
    // round 5 tray worlds (meadow, autumn, night, snow)
    fenceContinuous: true,   // fences run unbroken along both road edges, posts evenly spaced, open only at pads, entrances, the heart pad and the river (false: runs and gaps, fenceRun / fenceGap)
    padRingOnStandIn: false, // a fence ring round each Pin pad only once the zone's own pad has arrived (the meadow pad standing in has a fence of its own); true = always
    padRingR: 1.18,          // the ring's post circle radius, x the pad's radius
    padRingGap: 0.75,        // half the opening toward the road (radians), on top of any post the road itself pushes out
    padRingGapAt: 1.5708,    // the delivered ring sprite's opening points this way (radians, 0 = right, pi/2 = down)
    padRingInner: 0.7,       // ...and its rails run round at this share of its visible radius (they land on padRingR)
    flagRing: 0.9,           // the heart pad's flag posts stand on its fence, this share of its radius out...
    flagOut: 6,              // ...either side of the road, this far out from the road's outer edge
    flagScale: 0.5,          // ...each drawn at this scale (x its file)...
    flagFoot: [0.18, 0.95],  // ...with its post's foot (shares of the left flag's canvas; mirrored for the right) on that spot
    riverGap: 12,            // the fence opens this much wider than the ruler bridge where the road crosses the river
  },
  // the sewing-tray frame round a generated level's plate (src/levelFrame.js). Plate units for a size 1 plate; a bigger
  // level's frame is laid out the same on screen (everything times its size; the heroes times its square root)
  levelFrame: {
    inset: 85,               // the side walls' centreline sits this far in from the plate's left and right edges
    top: 70,                 // the top wall's centreline this far down from the top edge
    bottom: 42,              // the bottom wall's centreline this far up from the bottom edge (below the heart pad)
    rimScale: 0.5,           // wall, divider, cap and corner art px -> plate units (the kit delivers them at 2x)
    roadClear: 0.5,          // the wall stops where a road's edge would cover more than this share of its half thickness...
    padClear: 4,             // ...or a pad, the heart or a fork button would come within this of it...
    gapMargin: 14,           // ...with this much more gap either side (then an end cap each side)
    minPiece: 70,            // a stretch of wall shorter than this between two gaps is left out
    cornerKeep: 90,          // a gap this close to a corner runs out to it, and that corner goes
    // the wall steps in round a bigger compartment at a corner or partway down a side, where the space it takes from the
    // play area is clear of the road, pads and heart (the heroes sit best there)
    cornerChance: 0.85,      // chance each corner tries for a stepped-in compartment...
    cornerW: [110, 250],     // ...this wide (in from the side wall)...
    cornerH: [150, 380],     // ...and this deep (down from the top wall)...
    cornerHBottom: [120, 260], // ...or up from the bottom wall; the largest of notchTries sizes that fits wins
    sideNotches: 1,          // stepped-in compartments tried per side, between the corners...
    sideLen: [220, 420],     // ...this long...
    sideDepth: [70, 150],    // ...and this deep
    notchTries: 14,          // sizes / places tried per compartment
    notchClear: 26,          // a compartment keeps this much clear of the road's edge and the pads, past the wall
    shadeW: 22,              // the soft dark line the wall casts on the ground along its inside: its width...
    shadeAlpha: 0.4,         // ...and darkness
    shadow: 1,               // the walls' drop shadow size (1 = a kit prop's)
    floorScale: 0.5,         // the compartment floor texture's scale
    floorTint: 'rgba(40,20,5,0.12)', // a wash over the floor, so it sits a touch below the play area
    floorShadeW: 34,         // the floor darkens toward the wall over this width...
    floorShade: 0.35,        // ...by this much
    cell: [420, 680],        // a compartment's length along its band (dividers between; none in a gap, under a hero or at a corner)
    bottomCells: false,      // dividers in the bottom band too (it's mostly under the action bar)
    tee: false,              // a T-joint where a divider meets the wall, stem outward (off: the divider just runs under the wall)
    cornerArt: true,         // corners get the kit's L piece that suits their turn (by its colours); off, or where none suits: a butt joint...
    jointCap: true,          // ...with an end cap standing on it as a post
    heroes: [2, 4],          // big hero props per plate, in the compartments (the zone's frameHeroes in src/kit.js)
    heroScale: 1,            // times the kit entry's scale (0.5 = the art's intended plate size)
    heroTop: 0.3,            // chance a hero goes in the top band instead of a side (the third always does)
    heroTopBand: 260,        // ...where its centre is above this far below the top wall
    heroOverlap: 0.55,       // a hero may lean in over the wall by this share of its radius, past the wall's outer face
    heroVisible: 0.3,        // at least this share of a hero shows on the plate (else it's shrunk, then dropped)
    heroVisBonus: 300,       // a spot where more of it shows scores as if this much (plate units, per whole hero) farther from the other heroes
    heroLongTurn: 0.5,       // a long hero (a spool on its side, a bolt) lies along the nearest plate edge, turned at most this share of its kit turn
    heroGap: 30,             // clear space between two heroes...
    heroRoadGap: 8,          // ...and between a hero and the road's edge
    heroBottom: 120,         // a hero's centre stays above this far from the plate bottom (the action bar covers it)
    heroTries: 60,           // positions tried per hero (the one farthest from the others, and most on the plate, wins)
    heroShrink: 0.85,        // a hero that fits nowhere tries again this much smaller...
    heroShrinks: 5,          // ...this many times at most, then it's left out
    heroShadow: 2.2,         // a hero's shadow size (as the painter's heroes)
  },
  traverseRefLen: 2000,     // enemies walk at a steady speed: a road this long (plate units) takes an enemy its type's traverseSec, a longer one proportionally longer
  entryWarnSec: 1.4,         // an entrance's arrow flashes this long before something comes in (levels with more than one entrance)
  entryMarkInsetPx: 26,      // an entrance's arrow sits where its road first comes this far inside the screen edge
  pathSmoothSteps: 16,     // Catmull-Rom samples per path segment (road smoothness)
  workshopHp: 10,            // workshop hit points; an enemy that arrives deals its size tier
  workshopHitMs: 400,        // red flash on the workshop when it takes damage
  heartLowHp: 3,             // the HP number on the heart pad turns gold and throbs at or below this
  heartStageAt: [0.9, 0.7, 0.5, 0.3],   // the heart pad shows damage stage n+1 once HP / workshopHp is at or below entry n
  heartNumFrac: 0.5,         // the HP number's height on the heart pad, as a fraction of the pad's radius...
  heartNumMinPx: 20,         // ...but never smaller than this on screen (zoomed-out levels)
  heartBurstN: 9,            // loose bits (stuffing, thread ends, popped stitches) that fly off the heart pad per hit
  heartBurstMs: 900,         // how long they fly and fade
  heartBurstPx: 150,         // how far they fly, in plate units (times a random 0.5..1)
  heartBurstScale: 0.5,      // their size against the sprite file (0.5 = the size they were drawn for)

  // --- waves & scoring ---
  // One array per wave; each entry is [type, count, atSec]: `count` enemies of `type` starting `atSec` seconds into
  // the wave, spaced by that type's gapMs (so a scrap group of 6 arrives 300ms apart). These are the default (Random
  // Quilt, and any level without its own waves); bosses only come on boss levels, never here.
  waves: [
    [['scrap', 5, 2], ['scrap', 6, 12], ['bolster', 1, 20]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['scrap', 7, 16], ['bolster', 1, 24]],
    [['scrap', 6, 2], ['bolster', 2, 6], ['brute', 1, 12], ['scrap', 8, 18], ['bolster', 2, 26]],
    [['scrap', 7, 2], ['bolster', 3, 6], ['scrap', 6, 14], ['brute', 1, 18], ['scrap', 6, 26], ['bolster', 1, 32]],
    [['scrap', 8, 2], ['brute', 1, 6], ['bolster', 3, 10], ['scrap', 7, 18], ['brute', 1, 24], ['scrap', 8, 30]],
    [['scrap', 6, 2], ['runner', 5, 6], ['bolster', 2, 10], ['scrap', 7, 20], ['brute', 1, 28], ['scrap', 8, 36]],
  ],
  // Endless (Random Quilt, its level file's `endless: true`): waves are generated from the run seed, without end. A
  // normal wave is a run of groups, each a type drawn by weight among the types unlocked by that wave; every
  // bossEvery-th wave is a boss alone (the five in turn, more hp each time round), and from miniFromWave some waves bring
  // a mini boss (game.js endlessMini). Enemies get tougher by wave here
  // instead of by map level: hp + hpPerWave a wave, and the rank mix (as enemyRanks: up to 1 = rank 2 share, 1..2 =
  // rank 3 share) climbing rankPerWave a wave from rankFromWave.
  endless: {
    planWaves: 60,           // waves generated at the run start (critters are planned over these); more are added as needed
    bossEvery: 6,            // every this-many-th wave is a boss wave
    bosses: ['seamRipper', 'bruteKing', 'unstitcher', 'twine', 'skeletonkey'],   // in turn
    minis: ['bobbin', 'zipper', 'honeydipper', 'bottlecap', 'snowglobe'],   // mini bosses, in turn, as one entry mid-wave...
    miniFromWave: 8,         // ...from this wave on...
    miniEvery: 3,            // ...in every this-many-th non-boss wave (counting from miniFromWave)
    bossHpPerCycle: 0.5,     // a boss's hp x (1 + this x times round all the bosses before)
    bossEscortPerCycle: 4,   // from the second time round, this many Scraps per time round trail the boss in
    healAfterBoss: 3,        // heart hp back after a boss wave is cleared (up to workshopHp)
    groupsBase: 3,           // groups in wave 1...
    groupsPerWave: 0.35,     // ...plus this per wave...
    groupsMax: 12,           // ...up to this many
    groupGapSec: 6,          // seconds between group starts (x 0.8..1.2, seeded)
    sizePerWave: 0.06,       // each group's size x (1 + this x (wave - 1))
    // [type, first wave, weight, base group size]
    types: [['scrap', 1, 4, 5], ['bolster', 1, 2.5, 2], ['runner', 3, 2.5, 4], ['leaf', 4, 1.5, 4], ['brute', 5, 1.2, 1], ['burr', 6, 1.2, 2],
      ['moth', 7, 1.4, 3], ['snowball', 8, 1.2, 2], ['beetle', 9, 1, 1], ['icicle', 10, 1.5, 4]],
    hpPerWave: 0.08,         // each wave after the first adds this fraction of base hp (replaces hpPerWave + the level steps)
    rankFromWave: 4,         // the first wave with ranked enemies
    rankPerWave: 0.08,       // the rank mix climbs this much a wave (all rank 2 near wave 16, all rank 3 near wave 29)
  },
  emptyWaveWaitSec: 1,       // if every enemy is dead mid-wave, the next spawn comes within this long (the wave clock skips ahead)
  waveClearMs: 2000,        // WAVE_CLEAR pause between waves
  waveBannerMs: 1600,        // "WAVE N" banner at the start of each wave
  starGoalsMs: 4500,         // the star goals card (under the wave 1 banner) shows this long as a level starts
  // each star's goal as the star goals card and the pause card word it (a level's starRules pick which; 'clear' is the first star)
  starGoals: { clear: 'Clear the level', noDamage: 'Nothing reaches the heart', noSpecial: 'Win without using SHRED',
    pin: 'Build a Pin', critters: 'Squish every silverfish' },
  multiSnipMin: 2,           // enemies inside the cut zone for a snip to count as a multi-snip
  multiSnipMult: 1.5,        // score multiplier for kills made by a multi-snip
  scorePopupMs: 900,         // floating "+score" lifetime
  scorePopupRisePx: 50,      // px/s the "+score" popup floats upward
  toastMs: 1400,             // "coming soon" message duration for placeholder title buttons

  // --- economy (thread) ---
  startThread: 0,            // thread at the start of a run (Pins are earned with snip kills)
  threadPerKill: 8,          // thread per enemy killed by a snip (or the Helicopter)
  threadPerLeak: 2,          // thread per enemy that reaches the workshop, so a losing player can still afford something

  // --- critters (src/critters.js): bonus targets only a manual snip can hit. Not enemies: no HP, not in waves, never hurt
  // the workshop, Pins and SHRED ignore them. Their reward is fixed Thread (never Buttons, never random) and each level
  // caps how many come (its `critters`, else perWorld). Spawns are scheduled on the wave clock from the run's seed.
  critters: {
    perWorld: { meadow: 2, denim: 3, lair: 4 },   // cap per level when the level file doesn't set `critters` (Random Quilt, Custom Road)
    minWaveSec: 10,          // never spawns in the first this-many seconds of a wave
    minEnemies: 4,           // never spawns while fewer than this many enemies are on screen
    tailSec: 8,              // a wave's spawn window ends this long after its last scheduled enemy spawn
    retrySec: 0.25,          // a due spawn that can't happen yet (too few enemies, a boss seam open) checks again this often
    silverfish: {
      thread: 30,            // Thread for a squish (fixed)
      crossSec: 2.3,         // seconds to crawl from one screen edge to the opposite one
      r: 13,                 // hit radius (px); the snip's hitPadPx is added like for enemies
      len: 44,               // drawn body length (px), antennae and tail bristles extra
      wobblePx: 9,           // sideways wobble of its line (px)...
      wobbleHz: 1.6,         // ...this many wiggles a second
      laneClearPx: 34,       // its line keeps at least this far outside the road's shove band (roadHalfWidth)
      laneYMin: 0.1, laneYMax: 0.78, // side-to-side lanes cross between these fractions of the screen height (clear of HUD and action bar)
      laneTries: 40,         // random edge-to-edge lines tried per spawn; if none misses the road, the one crossing least wins
      skitterPx: 70,         // blades opening within this many px of it make it skitter (once per crossing)...
      skitterOpen: 0.15,     // ...once they are at least this far open (0..1)...
      skitterOpenRate: 0.5,  // ...and still opening at least this fast (opening per second): blades held open and still don't spook it
      skitterMinDeg: 35, skitterMaxDeg: 145, // skitter: turns a random angle in this range off its line (seeded; past 90 it doubles back)...
      skitterInward: 0.8,    // ...toward the middle of the screen this share of the time (the other way only if the burst stays on screen)...
      skitterSec: 0.3,       // ...and bursts for this long...
      skitterMult: 2.2,      // ...at this multiple of its crawl speed, then crawls on in its old direction
      turnRate: 18,          // how fast the drawn body swings to its heading (per second, exponential)
      maxLifeSec: 6,         // safety: removed after this long even if it never left the screen
      introSpeedMult: 0.75,  // the scripted first crossing (a level's critterIntro) crawls this much slower
      introEarliestSec: 4,   // ...in wave 1's first lull: the board empty after this many seconds...
      introLatestSec: 11,    // ...or at the latest this far into wave 1 if the board never empties
      splatSec: 2,           // the squish splat fades over this long
    },
  },

  // --- towers ("Pins"): Ice and Magnet set up snips; Fire and Needle deal damage on their own. ---
  // Built only on the level's spots (tap the + on one). radius is in level units. ice: enemies inside it move at
  // slowMult of their speed and are flagged slowed (lets a snip through Brute armor). fire: enemies inside it catch fire
  // and keep burning burnSec after leaving it, taking burnDps HP per second in burnTickMs ticks (armor doesn't stop it;
  // burn kills don't charge SHRED). magnet: every periodSec, pulls every enemy within radius (each enemy only once per
  // Magnet Pin, so nothing is dragged round the same stretch forever) back along the road toward
  // the anchor, pullBack ring radii upstream of the road point nearest the Pin, over pullMs: everyone loses ground, the
  // ones ahead most, and lands in a clump that stands still for holdSec, set up for a multi-snip. The pull fades out
  // toward the ring's edge: on the stretch of road nearest the Pin an enemy keeps pullKeep of its gap to the anchor
  // (0 = all onto one spot), at the edge it isn't moved; pullFalloff shapes the fade (1 = even, 2 = strong only close
  // in, 0.5 = strong most of the way out). needle (the archer): when an enemy is inside radius, fires one sewing needle
  // at the one furthest along the road (damage, flying needleSpeed level units per second and homing on it), then
  // reloads for cooldownSec. Armor stops a needle like a snip (the Brute's first hit clangs unless slowed, and the armor
  // is spent); needle kills don't charge SHRED.
  // These are rank 1 at tier 0: pinRanks (in-level ranks, Thread) and meta.pinTierCosts.. (permanent tiers, Buttons)
  // scale them (src/pins.js pinDef). The four cost the same, so the choice is about role, not price.
  // cork (the trap, world 3): sits on its road point (the road point nearest the pad, fx / fy); when an enemy's road
  // point comes within radius of it, it pops: everything within radius of it stands stunned for stunSec (bosses too),
  // then it re-arms over rearmSec (drawn pressed down). A trap catches a given enemy only once (e.corks), so a slow one
  // can't trip it again every re-arm. Its ring is drawn round the road point, not the pad.
  // lamp (world 4): enemies in its ring are lit: every graded snip on one is a weak-spot hit (lampMult), and in the
  // dark (worldRules.night) its whole ring counts as light. candle (world 5): enemies in its ring are softened: armor
  // doesn't stop a snip or needle (as if slowed), a Snowball stops growing and shrinks back meltShrinkPerSec x its growth
  // rate, and graded snips do meltMult x. Bosses are never softened (their armor is their rule).
  // blurb = the picker's short line, intro = its line on the "new Pin" explainer (the first time a level offers it).
  // color = glow / aura, felt = cushion colour, head = pin-head colour.
  towers: {
    needle: { name: 'Needle Pin', blurb: 'shoots one enemy, reloads', intro: 'a darning needle on a spool. Shoots the enemy furthest down the road, then reloads.', cost: 100, radius: 340, damage: 1, cooldownSec: 1.4, needleSpeed: 1400, color: '#e6eef5', felt: '#3e8f5a', head: '#f2c230' },
    ice:    { name: 'Ice Pin',    blurb: 'slows, beats armor', intro: "a frost crystal off the freezer tray. Slows everything in its ring, and a slowed Brute's armor won't stop your snip.", cost: 100, radius: 300, slowMult: 0.4, color: '#8fe8ff', felt: '#2f63c9', head: '#3d7dff' },
    fire:   { name: 'Fire Pin',   blurb: 'burns what walks by', intro: 'a stray match head. Sets enemies in its ring on fire; they keep burning after they leave it, armor or not.', cost: 100, radius: 300, burnDps: 0.6, burnSec: 2.5, burnTickMs: 1000, color: '#ffa04a', felt: '#c8352b', head: '#e0312b' },
    magnet: { name: 'Magnet Pin', blurb: 'drags back into a clump', intro: 'the fridge magnet nobody missed. Every few seconds it drags everything in its ring back up the road into a clump that stands still a moment: one wide snip takes the lot.', cost: 100, radius: 330, periodSec: 2.5, pullMs: 500, pullKeep: 0.25, pullFalloff: 1, pullBack: 0.7, holdSec: 0.5, color: '#c79bff', felt: '#7b3fc4', head: '#9a4fe0' },
    cork:   { name: 'Cork Pin',   blurb: 'a trap: stuns what steps on it', intro: 'a wine cork, still smelling of Sunday. Sits on the road like a trap: step on it and it pops, and everything near it stands there dazed.', cost: 100, radius: 150, stunSec: 1.2, rearmSec: 4, popSecondSec: 0.8, color: '#d98a3a', felt: '#a87a46', head: '#6b3f1e' },
    lamp:   { name: 'Lamp Pin',   blurb: 'lit enemies take harder hits', intro: 'the bulb from the reading lamp, still warm. Everything in its ring is lit: every snip on a lit enemy hits harder, even in the dark.', cost: 100, radius: 300, color: '#ffe27a', felt: '#d9a032', head: '#fff1a8' },
    candle: { name: 'Candle Pin', blurb: 'softens: armor off, hits harder', intro: 'a birthday candle saved for later. Softens everything in its ring: armor off, snowballs shrink, every hit does more.', cost: 100, radius: 280, meltMult: 1.25, meltShrinkPerSec: 1.5, color: '#ffb85c', felt: '#c2577a', head: '#fff3d6' },
  },
  // In-level ranks (Thread; tap a built Pin's arrow): rank 1 is the build; rank n costs costMult[n-1] x the Pin's build
  // cost, widens the ring by radiusMult and multiplies its power (needle damage and fire rate, fire burn, magnet pull-back
  // and hold, cork stun, the candle's melt bonus meltMult - 1) by powerMult; an Ice Pin's slow goes by iceSlow, a
  // Lamp Pin only widens. Gone when the level ends.
  pinRanks: { costMult: [0, 0.75, 1], radiusMult: [1, 1.15, 1.3], powerMult: [1, 1.4, 1.8], iceSlow: [0.4, 0.3, 0.22], names: ['', 'II', 'III'] },
  slowSpeedMult: 0.4,        // enemies slowed by the Helicopter (slowT) move at this fraction of their speed (Ice Pins use their slowMult)
  needleLostSec: 0.4,        // a needle whose target died first flies straight on this long, then vanishes
  needleMuzzle: 1.0,         // needles leave the Needle Pin this many pad radii above the pad's centre (its loaded needle)
  spotBtnPx: 42,             // size of the + button on an empty Pin spot
  // The Pin picker: tapping a + pauses the game and fans the Pins out from the pad on an arc, toward the wider side of
  // the screen, each a round icon with its name, effect and cost beside it (actionBar.js).
  pickerIconPx: 58,          // diameter of each Pin's round icon
  pickerRowPx: 66,           // vertical spacing between the Pins on the arc
  pickerGapPx: 16,           // gap between the pad's edge and the nearest icon
  pickerCurvePx: 14,         // how much further out the middle of the fan sits than its ends (the arc's bow)
  pickerFlyMs: 260,          // how long each Pin takes to fly out from the pad...
  pickerStaggerMs: 45,       // ...each one this much after the one before

  // --- progression: the map level (id) where each Pin, SHRED and Skill first appear; they stay on every map level after
  // it. Off the map (Random Quilt, Custom Road) they're there once that level has been cleared. One new tool at a time,
  // each beside the problem it answers (docs/worlds.md): a world's Pin on its level 2 (world 1: Needle on 1-1 and Ice
  // with the armored Brute on 1-6, world 2: Fire on 2-2 and Magnet on 2-6), SHRED with the fast Runners on 1-3.
  pinFrom: { needle: 'meadow', ice: 'double', fire: 'loop', magnet: 'cross', cork: 'corkscrew', lamp: 'keyring', candle: 'candlelight' },   // 1-1, 1-6, 2-2, 2-6, 3-2, 4-2, 5-2
  shredFrom: 'hem',          // 1-3: the first four-wave level (1-1 and 1-2 are too short to charge it)
  skillFrom: { focus: 'blanket', thimble: 'patchwork', mark: 'harvest', pinking: 'clothespin', basting: 'tinsel' },   // each world's Skill on its level 7: 1-7, 2-7, 3-7, 4-7, 5-7

  // --- special: Helicopter ---
  // SHRED is a skill bought up with Buttons in the Shop's Moves tab (CONFIG.meta.shredCosts): each tier is the whole move at
  // that level (turns = full spins before the final snip, charge = snip kills to fill the meter); tier 0 is where
  // everyone starts: one modest spin and a snip.
  shredTiers: [
    { name: 'Single Spin',  turns: 1, charge: 25 },
    { name: 'Double Spin',  turns: 2, charge: 25 },
    { name: 'Quick Charge', turns: 2, charge: 18 },
    { name: 'Whirlwind',    turns: 3, charge: 18 },
  ],
  heliOpenMs: 120,           // snap fully open
  heliTurnMs: 800,          // how long one full turn of the spin takes (the spin lasts turns x this)
  heliTickMs: 100,           // during the spin, everything within blade reach is hit this often
  heliTickDamage: 1,         // damage per tick (ignores armor)
  heliSlowSec: 2,            // enemies hit by the spin stay slowed this long
  heliCloseMs: 90,           // final snap-close (then a normal full-open snip fires)
  heliFinalShakePx: 14,      // screen shake on the final close
  heliBannerMs: 1100,        // "SHRED" banner time
  shredBadge: { icon: '✂', felt: '#7a3fb8', blurb: 'Spin the open blades through everything in reach, then snip. Charges with snip kills.' },   // SHRED's look in a move slot (its HUD badge, its weapon-screen chip and line); the Skills' are below

  // --- the moves: SHRED (above) and the Skills (docs/worlds.md "Skills"; src/skills.js skillDef, game.js "moves") ---
  // Two free move slots (Save.moves): each holds SHRED or any Skill the level allows, picked on the weapon screen, a Skill
  // on any map level from its own on (CONFIG.skillFrom); off the map once that level is cleared. Each slot's meter is a
  // round badge under the HUD wave badge (actionBar.js), filled by its move's own charge (state.moves[i].charge 0..1: each
  // charge event adds 1 / need). Tap the full meter (E for slot 1, F for slot 2 on desktop)
  // to use it: Focus and Thimble go off at once; Mark arms for the next tap on an enemy, Pinking for the next snip, Basting
  // for a drag across the road. Basting has no meter: it costs bastingCost Thread each time. Tier 0 is the move as it
  // arrives; tiers 1..3 (names in tiers) are bought in order with Buttons (skillCosts) once its level is cleared, each
  // tier's change a number below. Skills never cost the noSpecial star (that star is about SHRED only).
  // word = its banner as it goes off; felt = its badge's felt colour; charge = what fills it, in words.
  skills: {
    focus: { name: "Tailor's Focus", word: 'FOCUS', icon: '⏳', felt: '#3f6fc4', charge: 'clean full-open snips',
      blurb: 'The board slows to a crawl for a few seconds; your blades stay full speed.',
      tiers: ['Long Focus', 'Quick Focus', 'Deep Focus'],
      need: 10,              // clean snips to fill the meter: a full-strength snip (not a nick) that hit something...
      fullOpen: 0.85,        // ...from at least this open (0..1)
      focusSlow: 0.35,       // the world runs at this fraction of its speed (enemies, waves, Pins, tweens); input and the blades don't
      focusSec: 4,           // how long it lasts (real seconds)
      focusSecUp: 2,         // tier 1: it lasts this much longer
      needT2: 7,             // tier 2: clean snips to fill the meter
      refund: 0.08 },        // tier 3: each kill during Focus puts this much of the meter back
    thimble: { name: 'Thimble Guard', word: 'THIMBLE', icon: '🛡', felt: '#b8862a', charge: 'kills near the heart and squished silverfish',
      blurb: 'A brass thimble caps the heart pad and stops the next enemies that reach it: no damage.',
      tiers: ['Deep Thimble', 'Bouncing Thimble', 'Quick Thimble'],
      need: 8,               // charge events to fill the meter: a kill within thimbleNearPx of the heart is one...
      fishCharge: 2,         // ...a squished silverfish this many
      thimbleNearPx: 260,    // world px from the heart pad's centre that count as near the heart
      thimbleStops: 2,       // enemies the thimble stops (big bosses aside): they pop with a clink, no damage, no thread
      thimbleStopsT1: 3,     // tier 1: it stops this many
      thimbleBumpU: 0.15,    // tier 2: instead of popping, a stopped enemy is bumped this share of a traverseRefLen-long road back up its route...
      thimbleBumpMs: 450,    // ...over this long...
      thimbleBumpHold: 0.8,  // ...and stands dazed this long after
      needT3: 5 },           // tier 3: charge events to fill the meter
    mark: { name: 'Seam Mark', word: 'MARKED', icon: '✚', felt: '#7a4fc9', charge: 'nicks and near-misses',
      blurb: 'Chalk-mark an enemy (tap it): your next snip on it does triple damage and ignores armor.',
      tiers: ['Spreading Chalk', "Tailor's Chalk", 'Double Mark'],
      need: 6,               // charge events to fill the meter: a nick that hit, or a snip that hit nothing with an enemy within markNearPx of its cut zone
      markNearPx: 40,        // a near-miss: an enemy this many world px (or less) outside the cut zone
      markTapPx: 26,         // a tap this many world px outside an enemy's edge still marks it
      markMult: 3,           // the next graded snip on a marked enemy does this x damage and ignores armor (then the mark is spent)
      markSpreadPx: 140,     // tier 1: when a marked enemy dies, unmarked ones within this many world px take the mark...
      markSpreadMax: 2,      // ...up to this many
      markRefund: 0.25,      // tier 2: a marked kill puts this much of the meter back
      marksT3: 2 },          // tier 3: marks per use (tap one, then another)
    pinking: { name: 'Pinking Cut', word: 'PINKING', icon: '〰', felt: '#c2357a', charge: 'multi-snips',
      blurb: 'Your next snip also cuts a long zigzag lane out past the tips, hitting everything along it.',
      tiers: ['Long Lane', 'Armor Cutter', 'Pinked Trail'],
      need: 4,               // multi-snips to fill the meter
      pinkingLen: 240,       // the lane runs this many world px on from the blade tips, along the aim...
      pinkingW: 40,          // ...this wide; whatever it touches takes a full-strength snip at the tip grade
      pinkingLenT1: 340,     // tier 1: the lane's length
      pinkingArmorT2: true,  // tier 2: the lane cuts through armor (armored enemies in it don't clang; bosses keep their rules)
      pinkingTrailSec: 3,    // tier 3: the lane leaves a trail on the road for this long...
      pinkingTrailSlow: 0.5, // ...that slows whatever crosses it to this fraction of its speed (bosses ignore it; the curls' reach, curlPx)...
      pinkingTrailGapPx: 45 }, // ...a trail mark every this many world px along the lane, where the road is
    basting: { name: 'Basting Stitch', word: 'BASTED', icon: '⋯', felt: '#2e8a6a', charge: 'thread, paid each time',
      blurb: 'Drag across the road to sew a stitch line that holds the first enemies to reach it.',
      tiers: ['Long Stitch', 'Tight Stitch', 'Pinned Stitch'],
      need: 0,               // no meter: the badge is live while the Thread is there
      bastingCost: 60,       // Thread paid each time a stitch is sewn
      bastingHolds: 3,       // the first this many enemies to reach the stitch are held (big bosses walk through, mini bosses are held)...
      bastingSec: 2.5,       // ...each for this long (as the Pruners' jaw), then the stitch frays away
      bastingHoldsT1: 5,     // tier 1: it holds this many
      bastingSecT2: 4,       // tier 2: each for this long
      bastingDmgMult: 1.5,   // tier 3: a held enemy takes this x snip damage
      bastingMax: 3,         // stitches on the road at once (a pooled list; a new one replaces the oldest)
      bastingMinDragPx: 40,  // a drag shorter than this many screen px sews nothing (it stays armed)
      bastingLifeSec: 30,    // a stitch nothing reaches frays away after this long
      bastingFraySec: 0.6 }, // fraying away takes this long
  },
  skillCosts: [120, 240, 400], // a Skill's tiers 1 / 2 / 3 (CONFIG.skills[id].tiers) in Buttons, bought in order once its level is cleared
  skillBannerMs: 1000,       // a Skill's word banner as it goes off
  skillLaneMs: 380,          // the Pinking Cut's zigzag flash fades over this long
  skillTipMs: 4000,          // the "<Skill> ready" tip (once per Skill, ever) stays up this long (the next snip also dismisses it)

  // --- level 0: the no-text tutorial (Hold controls only; a ghost hand shows each step) ---
  tutGhostCycleMs: 4000,     // the ghost hand's demo repeats this often (each repeat holds longer and shows more)
  tutGhostReturnMs: 900,     // after the player lets go without passing the step, the ghost comes back this soon
  tutGhostHoldSec: 0.9,      // the ghost's first hold...
  tutGhostHoldGrow: 0.35,    // ...grows this much each repeat...
  tutGhostHoldMax: 2.2,      // ...up to this
  tutGhostOpenMs: 900,       // the ghost's scissors open closed -> full this slowly (easier to watch than a real weapon)
  tutFingerY: 0.72,          // where the ghost presses in steps 1-2 (fraction of screen height, on the road)
  tutHoldSec: 0.8,           // step 2 passes after holding this long...
  tutHoldOpen: 0.5,          // ...with the blades at least this open (the next lift then moves on)
  tutScrapHp: 0.2,           // tutorial Scraps: any snip that touches one cuts it
  tutWalkInPxPerSec: 200,    // step 3: Scraps walk into the player's empty blades this fast
  tutFinishCount: 3,         // step 5: this many Scraps walk in; the level ends once each is cut or through
  tutFinishGapMs: 900,       // step 5: spacing between them
  tutWalkMult: 0.7,          // step 5: they walk at this fraction of normal Scrap speed
  tutWinMs: 1800,            // the win celebration before the level map

  // --- feel (visual only) ---
  trailMinSpeed: 2.5,        // blade trails appear when the blades open/close/turn faster than this (rad/s)
  trailFadeMs: 140,          // how long each trail ghost takes to fade
  pickupFlyMs: 650,          // "+8" thread pickup flight time to the HUD counter
  bgWaitMaxSec: 6,           // the wave clock waits this long at most for a level's art to load (then plays on, art or not)
  bonusHoldMs: 900,         // a squish's "+30 thread" floats up where it died this long before flying to the counter

  // --- meta economy: Buttons (src/meta.js). Earned only from playing: never from a clock, a streak, a purchase or a
  // chance roll. Thread (in-level) and Buttons (meta) are never converted. Stars are never sold; Pins are unlocked by
  // progression and never sold (their permanent tiers are bought); scissors are a level's reward or a Shop pair.
  meta: {
    starButtons: [10, 15, 25], // Buttons for star 1 / 2 / 3 of a level, the first time each is earned (re-earning pays 0)
    scorePerButton: 100,     // score bonus (the wage): floor(score / this) Buttons on every win, replays included...
    scoreCapBase: 8,         // ...capped at scoreCapBase + scoreCapPerLevel x the global level number 1..50 (1-1 = 9, 5-10 = 58;
    scoreCapPerLevel: 1,     // Random Quilt counts as 3-5, global 25), so later levels are worth replaying
    upgradeCosts: [150, 300, 600], // scissors upgrade tiers 1 / 2 / 3 (per weapon, bought in order)
    shredCosts: [120, 240, 400],   // SHRED tiers 1 / 2 / 3 (CONFIG.shredTiers), bought in order once SHRED's level is cleared
    pinTierCosts: [120, 240, 450], // a Pin type's permanent tiers 1 / 2 / 3 (Sewing Box, once the Pin is unlocked on the map)
    pinCostDown: 0.15,       // Pin tier 1: its Thread build cost -15%
    pinRadiusUp: 0.15,       // Pin tier 2: ring +15%
    // Pin tier 3, each type's signature: needle shoots `volley` needles a shot (the furthest targets), ice stops an
    // enemy for freezeSec as it first enters the ring, fire burns burnSecUp longer after leaving, magnet pulls periodDown
    // sooner, cork pops a second time popSecondSec after the first (popTwice) before re-arming, lamp: lit enemies also take
    // lampCrit x (a crit, from any pair; not on top of the pair's own crit), candle: the softening lingers meltLingerSec after leaving
    pinSignature: { needle: { volley: 2 }, ice: { freezeSec: 0.6 }, fire: { burnSecUp: 0.6 }, magnet: { periodDown: 0.3 },
      cork: { popTwice: true }, lamp: { lampCrit: 1.5 }, candle: { meltLingerSec: 1.5 } },
    reachUp: 0.15,           // tier 1: reach +15%
    speedUp: 0.2,            // tier 2: close speed +20% (the blades open in openMs / 1.2)
    signatureUp: 0.3,        // tier 3: the weapon's signature stat +30%
    allUp: 0.1,              // tier 3 when the signature is 'all' (Dagger Shears): reach, speed, spread and damage +10%
    // Sharpness: each pair of scissors has its own edge, 0 (dull) .. 1 (sharp), kept in the save (Save.sharpness).
    sharpStart: 0.5,         // a pair's edge when first held (half sharp = snip damage x1, the game's balance point)
    sharpWearPerSnip: 0.0004, // edge lost per snip attempt, hit or miss (~1250 snips from half to dull; not in level 0)
    sharpDullMult: 0.8,      // snip damage multiplier at 0 (dull)...
    sharpSharpMult: 1.2,     // ...and at 1 (sharp), in a straight line between
    sharpenCost: 40,         // Sharpen: price in Buttons; puts the edge back to 1 (sharp)
    sharpenFrom: 0.9,        // Sharpen is offered only below this edge (nothing to buy on a nearly sharp pair)
    sharpBands: ['Dull', 'Worn', 'Fair', 'Keen', 'Sharp'], // the edge's name, in equal fifths from 0 to 1
    chestButtons: 100,       // a world chest (three-star every level of the world) holds this many Buttons plus its cosmetic
    // world id (CONFIG.map.worlds) -> its name (as on its map plate) and its chest's cosmetic; the chest's place on the
    // map is in CONFIG.map.worlds[].chest
    worlds: {
      meadow: { name: 'The Sewing Tray',    chest: 'cloverHandles' },
      denim:  { name: 'The Mending Pile',   chest: 'indigoGlow' },
      autumn: { name: 'The Kitchen Drawer', chest: 'copperGlow' },
      night:  { name: 'The Bedside Drawer', chest: 'lanternGlow' },
      snow:   { name: 'The Holiday Box',    chest: 'frostHandles' },
    },
    // slot 'handle' tints the handles, 'glow' lights the blades (render.js). price = Buttons in the shop; chest = only
    // from that world's chest.
    cosmetics: {
      brassHandles:  { name: 'Brass Handles',  slot: 'handle', color: '#e0b04a', price: 100 },
      roseHandles:   { name: 'Rose Handles',   slot: 'handle', color: '#e8698c', price: 100 },
      emberGlow:     { name: 'Ember Glow',     slot: 'glow',   color: '#ff8a3d', price: 100 },
      frostGlow:     { name: 'Frost Glow',     slot: 'glow',   color: '#8fe8ff', price: 100 },
      cloverHandles: { name: 'Clover Handles', slot: 'handle', color: '#5fbf5a', chest: 'meadow' },
      indigoGlow:    { name: 'Indigo Glow',    slot: 'glow',   color: '#6d7dff', chest: 'denim' },
      ripperGlow:    { name: 'Ripper Glow',    slot: 'glow',   color: '#c15cff', price: 150 },   // was the old Lair chest's
      copperGlow:    { name: 'Copper Glow',    slot: 'glow',   color: '#e0894a', chest: 'autumn' },
      lanternGlow:   { name: 'Lantern Glow',   slot: 'glow',   color: '#ffcf6a', chest: 'night' },
      frostHandles:  { name: 'Frost Handles',  slot: 'handle', color: '#bfe3ff', chest: 'snow' },
    },
    handleTint: 0.55,        // how strongly a handle cosmetic colours the handles (0..1)
    glowAlpha: 0.5,          // blade glow strength
    glowWidth: 0.1,          // blade glow half-width, as a fraction of blade length
    tallyStepMs: 450,        // results card: delay between the steps of stars -> Button tally -> total -> unlock reveal
  },

  // --- playtest data ---
  runsKept: 20,              // run reports kept in localStorage
  saveDebounceMs: 300,       // the save (src/save.js) is written this long after the last change

  // --- action bar (thread + SHRED) and Pin spot tips ---
  tipShowMs: 9000,           // how long a "you can afford a Pin" tip stays up (unless acted on)
  shredTipMs: 3500,          // how long the "SHRED ready" tip stays up (the next snip also dismisses it)
  shredTipRuns: 2,           // the "SHRED ready" tip shows in at most this many runs ever (the meter still pulses after)

  // --- desktop fallback ---
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
