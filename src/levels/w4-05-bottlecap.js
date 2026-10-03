// World 4 (The Bedside Drawer), level 5 on its map (4-5). Mini boss The Bottle Cap: rolls in bursts that clang off the blades; snip it as it wobbles to a stop. Clearing it puts the Lamp Pin's tiers on sale.
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bottlecap', name: 'The Bottle Cap', blurb: 'Snip it when it stops rolling.',
  recipe: 'size 1.4, s, s, entry right 30', seed: 46,
  world: 'night',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 10 to start = 500 for all 70 enemies (5 pads); its 4 silverfish (30 each)
  // bring it to 620. tools/wavesheet.js prints the numbers.
  startThread: 10,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 4 },   // bonus critters this level (the cap; src/critters.js)
  // Five waves; the Bottle Cap comes in the third with the wave still coming.
  waves: [
    [['moth', 5, 2], ['scrap', 6, 8], ['bolster', 1, 14]],
    [['beetle', 1, 2], ['runner', 5, 8], ['moth', 4, 14]],
    [['scrap', 5, 2], ['bottlecap', 1, 8], ['moth', 5, 16], ['bolster', 2, 24]],
    [['runner', 5, 2], ['beetle', 2, 8], ['moth', 5, 14], ['bolster', 2, 22]],
    [['moth', 6, 2], ['beetle', 2, 8], ['bolster', 2, 14], ['scrap', 6, 20], ['runner', 5, 28]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
