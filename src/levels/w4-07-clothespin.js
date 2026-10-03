// World 4 (The Bedside Drawer), level 7 on its map (4-7). Pinking Cut, the world's Skill (skillFrom): crowds to cut through.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'clothespin', name: 'Clothespin', blurb: 'An S into a three-way split.',
  recipe: 'size 1.4, s, triple, entry right 25', seed: 47,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 8 to start = 554 for all 78 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 674. tools/wavesheet.js prints the numbers.
  startThread: 8,           // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Big crowds of everything. Five waves.
  waves: [
    [['scrap', 7, 2], ['moth', 5, 8], ['bolster', 2, 14]],
    [['runner', 6, 2], ['beetle', 1, 10], ['moth', 5, 14]],
    [['scrap', 7, 2], ['bolster', 2, 8], ['moth', 5, 14], ['beetle', 1, 22]],
    [['moth', 6, 2], ['brute', 1, 8], ['runner', 5, 14], ['bolster', 2, 20]],
    [['scrap', 8, 2], ['moth', 6, 8], ['beetle', 2, 14], ['bolster', 2, 20], ['runner', 5, 26]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
