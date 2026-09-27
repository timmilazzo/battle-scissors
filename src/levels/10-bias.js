// Level 10 on the map. Generated level: src/levelGen.js builds the road and pads from the recipe (grammar in its
// header; try it in tools/level-lab.html), src/levelArt.js paints the plate. The seed varies the details.
export default {
  id: 'bias', name: 'Bias Tape', blurb: 'Waves into a Pin fork.',
  recipe: 'start right, wave 2, fork pin', seed: 10,
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  // Bolsters and Runners: slow and tough mixed with small and fast. Six waves; unlocks the Cigar Cutter.
  waves: [
    [['bolster', 2, 2], ['runner', 5, 6]],
    [['runner', 6, 2], ['bolster', 3, 8]],
    [['bolster', 3, 2], ['runner', 4, 6], ['runner', 4, 14]],
    [['runner', 8, 2], ['bolster', 4, 8], ['runner', 5, 20]],
    [['bolster', 5, 2], ['runner', 6, 6], ['runner', 6, 16]],
    [['runner', 8, 2], ['bolster', 4, 6], ['runner', 8, 14], ['bolster', 3, 22]],
  ],
  unlockOnClear: { scissors: 'cigar' },   // added to the save on the first win; the map shows the reveal
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: { noDamage: true, noSpecial: true },   // each rule met on a win adds a star to the one for clearing
};
