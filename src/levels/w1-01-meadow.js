// World 1 (The Sewing Tray), level 1 on its map (1-1): the Needle Pin. The painted meadow: one winding road through the
// fenced garden.
// Painted level: the plate art is assets/level-bg.webp (941x1672); everything below is in its pixels. If the art changes,
// re-measure the road and pads.
export default {
  id: 'meadow', name: 'Meadow Road', blurb: 'One winding road.',
  bg: 'assets/level-bg.webp', w: 941, h: 1672,
  // road centrelines (Catmull-Rom control points), each walked first -> last point (the heart pad)
  paths: [
    [
      [485, -90], [482, 60], [440, 210], [510, 320], [640, 420], [600, 500], [450, 550], [330, 610],
      [320, 690], [400, 760], [540, 840], [565, 930], [520, 1010], [420, 1090], [420, 1170], [500, 1260],
      [510, 1380], [501, 1470],
    ],
  ],
  spots: [[215, 806], [719, 725], [769, 1101]],   // centres of the fenced round pads where a Pin can be built
  spotR: 92,                 // pad radius: sizes the Pin art standing on it
  roadHalfWidth: 50,         // shoves can move an enemy's centre at most this far from the road centreline (painted road is ~110-150 wide)
  workshopR: 118,            // heart pad radius: the red flash when the workshop takes damage
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 10 to start = 220 for all 35 enemies; its 2 silverfish (30 each) bring it back to
  // the old 280 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 10,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 6,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Smalls and mediums only: Scraps, then a few Bolsters. Three short waves.
  waves: [
    [['scrap', 4, 2], ['scrap', 5, 12]],
    [['scrap', 5, 2], ['bolster', 1, 10], ['scrap', 5, 16]],
    [['scrap', 6, 2], ['bolster', 2, 10], ['scrap', 6, 18], ['bolster', 1, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, pin: true },   // each rule met on a win adds a star: 3rd = build a Pin (no SHRED here yet)
};
