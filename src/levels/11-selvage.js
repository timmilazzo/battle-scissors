// Level 11 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'selvage', name: 'Selvage', blurb: 'Button Beetles: round, tough, fireproof.',
  recipe: 'size 1.4, zigzag 2, triple, entry right 30', seed: 11,
  world: 'lair',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 6 per kill + 50 to start = 560 for all 85 enemies; its 4 silverfish (30 each) bring it back to
  // the old 680 (8 per kill). tools/wavesheet.js prints the numbers.
  startThread: 50,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // The Button Beetle's level: round, 10 HP, no weak spot and fireproof, so Fire Pins and pivot hits don't help.
  // Magnets clump them for multi-snips, Needles chip them, the Cigar Cutter (unlocked by Level 10) executes them in
  // its ring. Tuned to be playable with un-upgraded scissors and comfortable at tier 2 (more reach, faster snips).
  waves: [
    [['scrap', 6, 2], ['beetle', 1, 8], ['scrap', 6, 16]],
    [['beetle', 2, 2], ['runner', 5, 10], ['bolster', 2, 16]],
    [['scrap', 8, 2], ['beetle', 2, 6], ['runner', 6, 14], ['beetle', 1, 22]],
    [['beetle', 3, 2], ['bolster', 3, 8], ['scrap', 8, 16]],
    [['runner', 6, 2], ['beetle', 3, 6], ['brute', 1, 14], ['beetle', 2, 22]],
    [['beetle', 4, 2], ['scrap', 10, 8], ['bolster', 3, 14], ['beetle', 3, 24]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
