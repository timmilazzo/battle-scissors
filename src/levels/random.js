// Endless (a tile on the title, not a numbered patch): endless. A new generated road every run, drawn from the
// run's seed (so ?seed= replays it; see src/levelGen.js randomRecipe()), bigger than any map level, and waves without
// end (CONFIG.endless, game.js endlessWave): survive as long as you can; the run's waves, kills and score are kept as
// personal records (Save.levels.random).
export default {
  id: 'random', name: 'Endless', blurb: 'Endless: survive as long as you can.',
  random: true,
  endless: true,             // waves are generated without end (CONFIG.endless); the run ends only when the heart falls
  size: 1.8,                 // plate size for every draw (the biggest map level is 1.5); the world zooms out to fit
  world: 'denim',
  allowedPins: null,         // Pin types that can be built here (null = all)
  startThread: null,         // thread at the start (null = CONFIG.startThread)
  waves: null,               // unused: endless waves are generated
  critters: { silverfish: 8 },   // silverfish over the run's first CONFIG.endless.planWaves waves
  unlockOnClear: null,
  signText: '',              // a line for this level's sign (not shown yet)
  starRules: {},             // no stars: it's never won
};
