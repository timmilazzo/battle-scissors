// World 1 (The Sewing Tray), level 4 on its map (1-4). Pressure: enemy ranks (rank 2s phase in from here: new colours, more hp).
// Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its header; try it in
// tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'tack', name: 'Tacking Stitch', blurb: 'Gentle waves. Some come back tougher.',
  recipe: 'wave 3, bend right', seed: 4,
  world: 'meadow',
  allowedPins: null,         // Pin types that can be built here (null = all)
  // Thread: 7 per kill + 50 to start = 400 for all 50 enemies (4 pads); its 2 silverfish (30 each)
  // bring it to 460. tools/wavesheet.js prints the numbers.
  startThread: 50,          // thread at the start (null = CONFIG.startThread)
  threadPerKill: 7,          // thread per kill (null = CONFIG.threadPerKill)
  critters: { silverfish: 2 },   // bonus critters this level (the cap; src/critters.js)
  // Scraps, Bolsters and Runners, some of them rank 2. Four waves.
  waves: [
    [['scrap', 6, 2], ['runner', 3, 10], ['bolster', 1, 16]],
    [['bolster', 2, 2], ['scrap', 6, 8], ['runner', 4, 16]],
    [['runner', 4, 2], ['scrap', 6, 8], ['bolster', 2, 14]],
    [['scrap', 7, 2], ['bolster', 2, 8], ['runner', 5, 14], ['bolster', 2, 22]],
  ],
  unlockOnClear: null,       // e.g. { scissors: 'cigar' }: added to the save's unlocks on a first win
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
