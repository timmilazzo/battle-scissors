// World 4 (The Bedside Drawer), level 3 on its map (4-3). A road twist: a long switchback slide, plenty of pads.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'marble', name: 'Marble Run', blurb: 'A long switchback slide.',
  recipe: 'size 1.3, zigzag 4, bend center, heart right', seed: 43,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 100 to start = 564 for all 58 enemies (7 pads); its 4 silverfish (30 each)
  // bring it to 684. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Every enemy so far. Four waves.
  waves: [
    [['moth', 5, 2], ['scrap', 6, 8], ['bolster', 1, 14]],
    [['runner', 5, 2], ['moth', 5, 8], ['bolster', 2, 14]],
    [['scrap', 6, 2], ['bolster', 2, 8], ['moth', 6, 14]],
    [['moth', 6, 2], ['runner', 5, 8], ['bolster', 3, 14], ['scrap', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
