// World 4 (The Bedside Drawer), level 10 on its map (4-10). Boss The Skeleton Key: every turn it clicks open a side entrance and lets a burst of Moths in; its teeth are open while it turns. Reward: Stork Snips.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'skeletonkey', name: 'The Skeleton Key', blurb: 'Every turn of it lets more in.',
  recipe: 'size 1.5, wave 3, fork long, entry left 25, entry right 60', seed: 50,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 8 per kill + 64 to start = 600 for all 67 enemies (6 pads); its 4 silverfish (30 each)
  // bring it to 720. tools/wavesheet.js prints the numbers.
  startThread: 64,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 8,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Boss level: five waves, then the Skeleton Key alone (it calls its own Moths).
  waves: [
    [['moth', 5, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['beetle', 1, 2], ['runner', 5, 8], ['moth', 5, 14]],
    [['bolster', 2, 2], ['moth', 6, 8], ['beetle', 2, 16]],
    [['runner', 5, 2], ['scrap', 6, 8], ['moth', 5, 14], ['brute', 1, 22]],
    [['moth', 6, 2], ['beetle', 2, 8], ['bolster', 2, 14], ['runner', 5, 22]],
    [['skeletonkey', 1, 0]],
  ],
  unlockOnClear: { scissors: 'stork' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
