// World 4 (The Bedside Drawer), level 8 on its map (4-8). Two side entrances.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'cookiecutter', name: 'Cookie Cutter', blurb: 'Three ways in, three ways round.',
  recipe: 'size 1.4, triple, wave 2, entry left 35, entry right 35', seed: 48,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 533 for all 75 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 653. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Everything, from three entrances. Five waves.
  waves: [
    [['moth', 5, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['runner', 5, 2], ['beetle', 1, 8], ['moth', 5, 14]],
    [['bolster', 2, 2], ['moth', 6, 8], ['beetle', 2, 14], ['scrap', 5, 20]],
    [['moth', 6, 2], ['runner', 5, 8], ['brute', 1, 14], ['bolster', 2, 20]],
    [['beetle', 2, 2], ['moth', 6, 8], ['scrap', 6, 14], ['runner', 5, 20], ['beetle', 1, 28], ['bolster', 2, 30]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
