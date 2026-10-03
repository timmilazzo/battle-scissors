// World 4 (The Bedside Drawer), level 2 on its map (4-2). The Lamp Pin, the world's Pin (pinFrom); Runners again. The Cigar Cutter goes on sale after it.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'keyring', name: 'Key Ring', blurb: 'Round the ring to the heart.',
  recipe: 'size 1.3, spiral left 1', seed: 42,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 76 to start = 500 for all 53 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 620. tools/wavesheet.js prints the numbers.
  startThread: 76,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Moths, Runners, Scraps and Bolsters. Four waves.
  waves: [
    [['moth', 4, 2], ['runner', 4, 10], ['bolster', 1, 16]],
    [['scrap', 6, 2], ['moth', 5, 8], ['bolster', 2, 16]],
    [['runner', 5, 2], ['moth', 5, 8], ['bolster', 2, 16]],
    [['moth', 6, 2], ['bolster', 2, 8], ['runner', 5, 14], ['scrap', 6, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
