// World 4 (The Bedside Drawer), level 4 on its map (4-4). Pressure: the Button Beetles. (Id kept from the old
// "Selvage": saves key on it.)
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'selvage', name: 'Beetle Hour', blurb: 'Button Beetles: round, tough, fireproof.',
  recipe: 'size 1.4, zigzag 2, triple, entry right 30', seed: 11,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 80 to start = 600 for all 65 enemies (6 pads); its 4 silverfish (30 each)
  // bring it to 720. tools/wavesheet.js prints the numbers.
  startThread: 80,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // The Button Beetle's level: round, 10 HP, no weak spot and fireproof. Magnets clump them, Needles chip them, the
  // Cigar Cutter (on sale after 4-2) executes them in its ring. Moths hop between. Five waves.
  waves: [
    [['scrap', 6, 2], ['beetle', 1, 8], ['moth', 4, 16]],
    [['beetle', 2, 2], ['runner', 5, 10], ['bolster', 2, 16]],
    [['moth', 5, 2], ['beetle', 2, 8], ['scrap', 6, 14], ['beetle', 1, 22]],
    [['beetle', 2, 2], ['bolster', 2, 8], ['moth', 5, 14], ['runner', 5, 20]],
    [['runner', 5, 2], ['beetle', 3, 6], ['moth', 5, 14], ['bolster', 2, 20], ['beetle', 2, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' } or { pin: 'magnet' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
