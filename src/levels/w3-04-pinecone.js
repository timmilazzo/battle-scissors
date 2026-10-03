// World 3 (The Kitchen Drawer), level 4 on its map (3-4). Burrs: spiky, a hit in the tip half of the blades does nothing.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'pinecone', name: 'Pine Cone Path', blurb: 'Burrs: snip them near the pivot.',
  recipe: 'size 1.3, zigzag 3, bend right', seed: 34,
  world: 'autumn',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 100 to start = 548 for all 56 enemies (6 pads); its 3 silverfish (30 each)
  // bring it to 638. tools/wavesheet.js prints the numbers.
  startThread: 100,         // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 3 },   // bonus critters this level (the cap; src/critters.js)
  // Burrs among the Leaves. Four waves.
  waves: [
    [['leaf', 6, 2], ['burr', 1, 10], ['scrap', 5, 16]],
    [['burr', 2, 2], ['leaf', 6, 8], ['bolster', 1, 16]],
    [['runner', 5, 2], ['burr', 2, 8], ['leaf', 6, 14], ['bolster', 2, 22]],
    [['burr', 3, 2], ['scrap', 6, 8], ['leaf', 7, 14], ['bolster', 2, 20], ['burr', 2, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
