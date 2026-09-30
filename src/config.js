// ======================= CONFIG — all tunables live here =======================
// Every tunable number in the game belongs in this object, each with a one-line comment.
// Modules read these at runtime (C.x), so the debug panel can change them live.
// (Sound parameter arrays are the one exception: they live in src/sfx.js for pasting to/from the ZzFX designer.)

// Where "Send feedback" (pause and game-over cards) goes. A mailto: address opens an email with the run report in the
// body; any other link just opens in a new tab. Empty = the button only shows a toast.
export const FEEDBACK_URL = 'mailto:tim@saltandwisdom.com';

// Shown small at the bottom of Settings and recorded in every run report. Bump it with each published change.
export const VERSION = '0.3.15';

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
  // How each is won: defaultWeapon is held from the start; one that is some map level's unlockOnClear is won there;
  // shop = its price in Buttons, buyable in the Shop once level shopAfter has been cleared (never for anything else).
  weapons: {
    safety:  { name: 'Safety Firsts', blurb: 'Round tips, crayon-box grip. Every hero starts somewhere.',
               svg: 'assets/weapons/safety-firsts.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 274, maxOpenDeg: 28, reachFrac: 0.105, damageMult: 0.85, openMs: 560, signature: 'all' },
    dagger:  { name: 'Dagger Shears', blurb: 'Long engraved blades that reach deep into the road.',
               svg: 'assets/weapons/dagger-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 370, maxOpenDeg: 32, reachFrac: 0.132, damageMult: 1, openMs: 500, signature: 'all' },
    nippers: { name: 'War Nippers', blurb: 'Short crescent jaws that bite hard. Get close.',
               svg: 'assets/weapons/battle-cuticle-nippers.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 242, maxOpenDeg: 28, reachFrac: 0.088, damageMult: 1.3, openMs: 380, signature: 'damage' },
    barber:  { name: 'Split Enders', blurb: 'Opens wide enough to take a whole crowd, but cuts light.',
               svg: 'assets/weapons/barber-scissors.svg', viewX: -80, viewW: 960, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 404, maxOpenDeg: 60, reachFrac: 0.12, damageMult: 0.85, openMs: 650, signature: 'angle',
               shop: 200, shopAfter: 'fork' },
    scrap:   { name: 'Scrap Snippers', blurb: 'Long heavy blades with a narrow bite. Aim true.',
               svg: 'assets/weapons/scrap-shears.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 440,
               bladeLen: 408, maxOpenDeg: 24, reachFrac: 0.144, damageMult: 1.25, openMs: 580,
               signature: 'crit', critZone: 0.25, critMult: 1.5, shop: 300, shopAfter: 'blanket' },
    // hooked jaw -12deg, blade +76deg, handle +12deg (per-layer data-open-angle). Closed, the blade tip points 41deg
    // left of the art's axis; fully open, the gap spans -40..+22deg (centre -9deg, 62deg wide). The aim offset turns
    // the art 41deg -> 9deg as it opens so the tip, then the gap's centre, lines up with the aim.
    pruners: { name: 'Ratchet Pruners', blurb: 'A hooked jaw holds, one heavy blade bites down. Big hits up close.',
               svg: 'assets/weapons/ratchet-pruners.svg', viewW: 800, viewH: 1000, pivotX: 400, pivotY: 320,
               bladeLen: 240, maxOpenDeg: 31, aimOffsetDeg: 41, aimOffsetOpenDeg: -32, reachFrac: 0.1, damageMult: 1.4, openMs: 620,
               signature: 'hold', holdSec: 0.5, shop: 400, shopAfter: 'selvage' },
    // blades slide 155 units each way inside a 131-unit round window; the finger rings sit about 426 units out
    cigar:   { name: 'Cigar Cutter', blurb: 'No blades to swing: fit them in the hole and slam it shut.',
               svg: 'assets/weapons/cigar-cutter.svg', viewW: 1300, viewH: 640, pivotX: 650, pivotY: 320, kind: 'slide',
               bladeLen: 131, maxOpenDeg: 0, spinLen: 426, reachFrac: 0.036, damageMult: 2.2, openMs: 440,
               signature: 'ring', ringScale: 1, shop: 500, shopAfter: 'bias' },
  },
  defaultWeapon: 'safety',   // the one weapon held from the start (level 0 reveals it); the rest are won or bought
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
  enemyTypes: {
    scrap:      { r: 13, hp: 1,  levelHp: 0.5, tier: 1,  score: 10,  traverseSec: 12, gapMs: 300,  pushScale: 1.2,  color: '#eadcc3', patch: '#3f73d8', patch2: '#d8423a' },
    bolster:    { r: 24, hp: 3,  levelHp: 1, tier: 2,  score: 25,  traverseSec: 26, gapMs: 1400, pushScale: 0.8,  color: '#e6b85c', patch: '#7a4fc9', patch2: '#3f73d8' },
    brute:      { r: 38, hp: 6,  levelHp: 1, tier: 3,  score: 60,  traverseSec: 32, gapMs: 2500, pushScale: 0.35, armor: true, color: '#b8946a', patch: '#3f6fc4', patch2: '#c0392b' },
    runner:     { r: 11, hp: 1,  levelHp: 0, tier: 1,  score: 15,  traverseSec: 6.5, gapMs: 450, pushScale: 1.4, color: '#7fc46a', patch: '#f2c230', patch2: '#d8423a' },
    beetle:     { r: 34, hp: 10, levelHp: 0.5, tier: 3,  score: 80,  traverseSec: 36, gapMs: 3200, pushScale: 0.25, fireImmune: true, flat: true, ringExecute: true, color: '#c8433a', patch: '#f4e3c1', patch2: '#2b1a10' },
    // bosses (boss: true): their rules are in CONFIG.bosses, and their hp is not scaled by hpPerWave or hpPerLevel
    seamRipper: { r: 56, hp: 30, tier: 10, score: 500, traverseSec: 30, gapMs: 0,    pushScale: 0,    boss: true,  color: '#6a3596', patch: '#e84a5f', patch2: '#ffd23f' },
    bruteKing:  { r: 62, hp: 50, tier: 10, score: 800, traverseSec: 70, gapMs: 0,    pushScale: 0,    boss: true,  armor: true, color: '#9c7650', patch: '#3f6fc4', patch2: '#c0392b' },
    unstitcher: { r: 64, hp: 90, tier: 10, score: 1500, traverseSec: 40, gapMs: 0,   pushScale: 0,    boss: true,  color: '#2e2a4a', patch: '#8fe8ff', patch2: '#e84a5f' },
  },
  hpPerWave: 0.1,            // each wave after the first adds this fraction of base hp (wave 6 = 1.5x); fractional hp means a tip hit no longer kills
  hpPerLevel: 0.1,           // each map level from hpLevelFrom on adds this fraction of base hp x the type's levelHp (added to the wave's)
  hpLevelFrom: 3,            // the first map level that gets a hpPerLevel step (L3 = 1 step, L12 = 10)
  hpOffMapLevel: 6,          // Random Quilt / Custom Road scale as this map level (fixed, so ?seed= replays match)
  waddleDeg: 6,              // side-to-side rock while walking
  pathReturnRate: 1.6,       // how fast a shoved enemy drifts back onto the road (per second)

  // --- bosses: only on boss levels (the level's last wave is the boss alone). Each tests one skill. ---
  // name + taunt = the intro card (two short lines, auto-dismissed after bossIntroMs); roar = its sfx.js entry.
  bossIntroMs: 3000,         // the intro card shows this long; the boss walks on as it closes
  bossTurns: [0.8, 0.2],     // seam bosses walk forward to 80% of the road, back to 20%, then on to the workshop
  bossTremblePx: 3,          // how far an armored boss shakes side to side while winding up for a charge
  seamPeriodSec: 2,         // the seam's spot goes once around the body in this long (where Expert blades must cross it)
  seamArcDeg: 22,            // half-width of the seam arc
  seamHitTolPx: 12,          // Expert: the closed-blade line must pass this close to the seam to count as over it
  bosses: {
    // timing: every seamEverySec its seam splits open for seamOpenSec (a dim shimmer seamWarnSec before). A snip while
    // it's open does openDmg, otherwise closedDmg (flat). Expert (Pinch) controls: an open-seam snip whose blades don't
    // cross the seam does expertOffSeamDmg instead.
    seamRipper: { name: 'The Seam Ripper', taunt: 'I pull every stitch apart!', roar: 'roarRipper',
                  seamEverySec: 3, seamOpenSec: 1, seamWarnSec: 0.4, openDmg: 5, closedDmg: 1, expertOffSeamDmg: 2 },
    // timing + patience: armored; every chargeEverySec it charges chargePx along the road over chargeSec (a burst of
    // speed that swells and fades; the next chargeEverySec starts after it), trembling for
    // windupSec before, so the player can get ready), then its armor is down for armorDownSec (its seams glow): snips
    // then do armorDownMult x normal damage. Ice and SHRED don't slow it. The taunt tells the player the rule.
    bruteKing:  { name: 'The Brute King', taunt: 'My armor only drops after I charge!', roar: 'roarKing',
                  chargeEverySec: 7, chargePx: 200, chargeSec: 1.4, windupSec: 1.2, armorDownSec: 2.6, armorDownMult: 3 },
    // three phases, switching at phaseAt (hp fractions). 1: its escort Scraps (swarmSize of them, swarmGapPx apart along
    // the road, half ahead and half behind) hold up a shield that blocks every hit. Cutting the last one drops it for
    // shieldDownSec (snips do shieldDownMult x graded damage); it comes back with a fresh swarm. While the shield is up,
    // every swarmEverySec it refills any empty escort places. 2: armored and charging like the Brute King.
    // 3: an opening seam like the Seam Ripper, faster.
    unstitcher: { name: 'The Unstitcher', taunt: 'Your whole quilt comes undone!', roar: 'roarUnstitcher',
                  phaseAt: [0.66, 0.33], swarmEverySec: 5, swarmSize: 4, swarmGapPx: 42, shieldDownSec: 3, shieldDownMult: 2,
                  chargeEverySec: 5, chargePx: 180, chargeSec: 1.2, windupSec: 1, armorDownSec: 1.8, armorDownMult: 3,
                  seamEverySec: 2, seamOpenSec: 0.8, seamWarnSec: 0.3, openDmg: 5, closedDmg: 1, expertOffSeamDmg: 2 },
  },
  // The rule line under the boss bar (render.js), by what the boss is doing right now. Gold = snip now.
  bossHints: {
    swarm: 'Cut its Scraps to break the shield',     // swarm, shield up
    shieldDown: 'Shield down: SNIP NOW!',
    armor: 'Armored: wait for its charge',
    windup: 'It’s about to charge!',
    armorDown: 'Armor down: SNIP NOW!',
    seam: 'Snip when its seam opens',
    seamOpen: 'Seam open: SNIP NOW!',
  },
  bossHintPulseSec: 0.7,     // the rule line swells and glows this long when it changes

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
  // The level map (between the title and the shears): its art and a numbered patch per level, in play order.
  // nodes = [level id (a src/levels/ file), patch centre x, y] in the art's pixels; hitW/hitH = each patch's tap area. locks: true = a level
  // opens only once the one before it is cleared (false keeps every level open for playtesting).
  map: {
    img: 'assets/level-map.webp', w: 936, h: 1681,
    // patch 0 is smaller than the rest (its tap area is the same)
    nodes: [['first', 650, 1442], ['meadow', 468, 1330], ['fork', 486, 1196], ['hem', 579, 1076], ['running', 410, 978], ['double', 466, 858],
      ['blanket', 597, 770], ['loop', 494, 666], ['hemline', 354, 574], ['cross', 488, 478], ['bias', 586, 390],
      ['selvage', 422, 300], ['whip', 527, 212], ['lair', 540, 96]],
    hitW: 170, hitH: 110,    // tap area per patch (art px)
    locks: false,            // lock levels until the one before is cleared
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
    entryClear: 230,         // "entry": how far a side road runs beside the road it joins before it merges in (plate units)
    entryTries: 40,          // "entry": merge points tried before the entrance is dropped
    heartShift: 130,         // "heart left/right": how far the heart pad moves off the middle
    spiralRx: 330, spiralRy: 520, // "spiral": the outer ring's half-width and half-height (the heart pad sits in the middle of the plate)
    spiralTurns: 1.25,       // "spiral": turns round the heart (fewer if the road would touch itself)
    props: 34,               // kit props tried per plate (src/kit.js: each zone's mix); fewer land if there's no room
    patches: 7,              // fabric patches sewn under the road
  },
  traverseRefLen: 2000,      // enemies walk at a steady speed: a road this long (plate units) takes an enemy its type's traverseSec, a longer one proportionally longer
  entryWarnSec: 1.4,         // an entrance's arrow flashes this long before something comes in (levels with more than one entrance)
  entryMarkInsetPx: 26,      // an entrance's arrow sits where its road first comes this far inside the screen edge
  pathSmoothSteps: 16,     // Catmull-Rom samples per path segment (road smoothness)
  workshopHp: 10,            // workshop hit points; an enemy that arrives deals its size tier
  workshopHitMs: 400,        // red flash on the workshop when it takes damage
  hudLowHp: 3,               // the HUD's heart counter turns red at or below this many hearts

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
  emptyWaveWaitSec: 1,       // if every enemy is dead mid-wave, the next spawn comes within this long (the wave clock skips ahead)
  waveClearMs: 2000,        // WAVE_CLEAR pause between waves
  waveBannerMs: 1600,        // "WAVE N" banner at the start of each wave
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
      skitterSec: 0.3,       // skitter: turns 90 degrees away from the blades and bursts for this long...
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
  // Built only on the level's spots (tap the + on one). radius is in level units. ice: enemies inside it are slowed
  // (slowSpeedMult) and flagged slowed (lets a snip through Brute armor). fire: enemies inside it catch fire and keep
  // burning burnSec after leaving it, taking burnDps HP per second in burnTickMs ticks (armor doesn't stop it; burn
  // kills don't charge SHRED). magnet: every periodSec, pulls every enemy within radius along the road toward the
  // nearest road point to the Pin over pullMs (the ones ahead back, the ones behind forward): a clump that keeps
  // walking together, set up for a multi-snip. The pull fades out toward the ring's edge: on the stretch of road
  // nearest the Pin an enemy keeps pullKeep of its gap (0 = all onto one spot), at the edge it isn't moved;
  // pullFalloff shapes the fade (1 = even, 2 = strong only close in, 0.5 = strong most of the way out). needle (the archer): when an enemy is inside radius, fires one
  // sewing needle at the one furthest along the road (damage, flying needleSpeed level units per second and homing on
  // it), then reloads for cooldownSec. Armor stops a needle like a snip (the Brute's first hit clangs unless slowed, and
  // the armor is spent); needle kills don't charge SHRED.
  // color = glow / aura, felt = cushion colour, head = pin-head colour.
  towers: {
    needle: { name: 'Needle Pin', blurb: 'shoots one enemy, reloads', cost: 90, radius: 380, damage: 1, cooldownSec: 1.4, needleSpeed: 1400, color: '#e6eef5', felt: '#3e8f5a', head: '#f2c230' },
    ice:    { name: 'Ice Pin',    blurb: 'slows, beats armor', cost: 100, radius: 290, color: '#8fe8ff', felt: '#2f63c9', head: '#3d7dff' },
    fire:   { name: 'Fire Pin',   blurb: 'burns what walks by', cost: 110, radius: 290, burnDps: 0.25, burnSec: 1.5, burnTickMs: 500, color: '#ffa04a', felt: '#c8352b', head: '#e0312b' },
    magnet: { name: 'Magnet Pin', blurb: 'pulls into a clump', cost: 120, radius: 330, periodSec: 3, pullMs: 500, pullKeep: 0.25, pullFalloff: 1, color: '#c79bff', felt: '#7b3fc4', head: '#9a4fe0' },
  },
  slowSpeedMult: 0.4,        // slowed enemies move at this fraction of their speed
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

  // --- progression: the map level (id) where each Pin and SHRED first appear; they stay on every map level after it.
  // Off the map (Random Quilt, Custom Road) they're there once that level has been cleared. One new tool at a time,
  // each beside the problem it answers: Needle with the first road, SHRED with the fast Runners, Ice with the armored
  // Brute, Fire with the new world's crowds, Magnet with four roads to herd (and the Unstitcher's multi-snip test).
  pinFrom: { needle: 'meadow', ice: 'double', fire: 'loop', magnet: 'cross' },   // L1, L5, L7, L9
  shredFrom: 'hem',          // L3: the first four-wave level (L1-L2 are too short to charge it)

  // --- special: Helicopter ---
  // SHRED is a skill bought up with Buttons in Your Scissors (CONFIG.meta.shredCosts): each tier is the whole move at
  // that level (turns = full spins before the final snip, charge = snip kills to fill the meter); tier 0 is where
  // everyone starts: one modest spin and a snip.
  shredTiers: [
    { name: 'Single Spin',  turns: 1, charge: 25 },
    { name: 'Double Spin',  turns: 2, charge: 25 },
    { name: 'Quick Charge', turns: 2, charge: 18 },
    { name: 'Whirlwind',    turns: 3, charge: 18 },
  ],
  heliOpenMs: 120,           // snap fully open
  // Skills to come (placeholders, not in play yet): the plan is two move slots, SHRED plus one of these picked on the
  // weapon screen before a level, each on its own charge and bought up in tiers like SHRED. Your Scissors lists them
  // as "coming soon" (the level each would arrive on, what it would do) so playtesters can say which they'd want.
  // enabled: false keeps a skill out of the game entirely; nothing reads these but armory.js yet.
  skillIdeas: [
    { id: 'focus',   name: "Tailor's Focus", icon: '⏳', from: 'blanket', enabled: false, blurb: 'The board slows to a crawl for a few seconds; your blades stay full speed.',
      charge: 'clean full-open snips', tiers: ['Lasts longer', 'Charges faster', 'Kills during it refund charge'] },
    { id: 'thimble', name: 'Thimble Guard',  icon: '🛡', from: 'loop',    enabled: false, blurb: 'A brass thimble caps the heart pad and stops the next two enemies that reach it.',
      charge: 'squished silverfish and kills near the heart', tiers: ['Stops three', 'Bumps them back up the road', 'Recharges faster'] },
    { id: 'pinking', name: 'Pinking Cut',    icon: '〰', from: 'cross',   enabled: false, blurb: 'Your next snip cuts a long zigzag lane out past the tips, hitting everything along it.',
      charge: 'multi-snips', tiers: ['A longer lane', 'Cuts through armor', 'Leaves a slowing trail'] },
    { id: 'mark',    name: 'Seam Mark',      icon: '✚', from: 'bias',    enabled: false, blurb: 'Chalk-mark one enemy: your next snip on it does triple damage and ignores armor.',
      charge: 'nicks and near-misses', tiers: ['The mark spreads to neighbours', 'Marked kills refund charge', 'Two marks at once'] },
    { id: 'basting', name: 'Basting Stitch', icon: '⋯', from: 'whip',    enabled: false, blurb: 'Drag across the road to sew a stitch line that holds the first few enemies to reach it.',
      charge: 'thread, paid each time', tiers: ['Holds more', 'Holds longer', 'Held enemies take extra snip damage'] },
  ],
  heliTurnMs: 800,          // how long one full turn of the spin takes (the spin lasts turns x this)
  heliTickMs: 100,           // during the spin, everything within blade reach is hit this often
  heliTickDamage: 1,         // damage per tick (ignores armor)
  heliSlowSec: 2,            // enemies hit by the spin stay slowed this long
  heliCloseMs: 90,           // final snap-close (then a normal full-open snip fires)
  heliFinalShakePx: 14,      // screen shake on the final close
  heliBannerMs: 1100,        // "SHRED" banner time

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

  // --- meta economy: Buttons (src/meta.js). Earned only from performance and achievements; nothing waits on a clock and
  // no reward is random. Thread (in-level) and Buttons (meta) are never converted. Scissors, Pins and stars are never sold.
  meta: {
    starButtons: [10, 15, 25], // Buttons for star 1 / 2 / 3 of a level, the first time each is earned (re-earning pays 0)
    scorePerButton: 100,     // score bonus: floor(score / this) Buttons...
    scoreBonusCap: 10,       // ...capped at this per level: a run pays only what beats the level's best bonus so far
    upgradeCosts: [150, 300, 600], // scissors upgrade tiers 1 / 2 / 3 (per weapon, bought in order)
    shredCosts: [120, 240, 400],   // SHRED tiers 1 / 2 / 3 (CONFIG.shredTiers), bought in order once SHRED's level is cleared
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
    // world id (a level file's `world`) -> its name, its chest's cosmetic, and where the chest sits on the map art (px)
    worlds: {
      meadow: { name: 'The Meadow', chest: 'cloverHandles', x: 770, y: 800 },
      denim:  { name: 'The Denim',  chest: 'indigoGlow',    x: 750, y: 420 },
      lair:   { name: 'The Lair',   chest: 'ripperGlow',    x: 290, y: 190 },
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
      ripperGlow:    { name: 'Ripper Glow',    slot: 'glow',   color: '#c15cff', chest: 'lair' },
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
