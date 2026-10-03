// World 1 (The Sewing Tray), level 3 on its map (1-3). A road twist: Runners, and SHRED (shredFrom).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'hem', name: 'Zigzag Hem', blurb: 'An S, then a fork.',
  recipe: 'size 1.1, s left, fork pin, entry right 30', seed: 3,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 50 to start = 400 for all 50 enemies (4 pads); its 2 silverfish (30 each)
  // bring it to 460. tools/wavesheet.js prints the numbers.
  startThread: 50,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Introduces the Runner (small and fast). Four waves.
  waves: [
    [['scrap', 5, 2], ['runner', 3, 10]],
    [['scrap', 6, 2], ['bolster', 1, 8], ['runner', 4, 14]],
    [['runner', 4, 2], ['bolster', 2, 8], ['scrap', 6, 14]],
    [['scrap', 6, 2], ['runner', 5, 8], ['bolster', 2, 16], ['scrap', 6, 24]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
