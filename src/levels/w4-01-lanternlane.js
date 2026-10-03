// World 4 (The Bedside Drawer), level 1 on its map (4-1). Arrival in the Bedside Drawer: the dark (world rule) and the Moths, which hop along the road.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'lanternlane', name: 'Lantern Lane', blurb: 'Lights out. Keep to the lanterns.',
  recipe: 'size 1.3, s right, bend left, entry left 20', seed: 41,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 43 to start = 400 for all 51 enemies (4 pads); its 4 silverfish (30 each)
  // bring it to 520. tools/wavesheet.js prints the numbers.
  startThread: 43,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Moths with Scraps and a few Bolsters. Four waves.
  waves: [
    [['moth', 4, 2], ['scrap', 5, 10], ['bolster', 1, 16]],
    [['scrap', 6, 2], ['moth', 4, 8], ['bolster', 2, 16]],
    [['moth', 5, 2], ['bolster', 2, 10], ['scrap', 5, 16]],
    [['moth', 5, 2], ['scrap', 6, 8], ['bolster', 2, 14], ['moth', 4, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
