// The story's words, in one place, so the voice can be read and edited top to bottom.
//
// The premise: every junk drawer that gets junky enough wears thin at the back, and things come through the worn spot
// at night, made of the drawer's own leftovers. The household scissors hold the line while the house sleeps, and the
// humans never find out. Tomato, the pincushion, has seen it all and briefs the player.
//
// What lives here: Tomato's dispatch line per level (the star goals card, game.js showGoals), the morning-after notes
// (a reward card after each world's boss: what a human in the house wrote the next day, and what Tomato makes of it;
// levelMap.js showReveal, queued by levelSelect.js recordLevelResult) and the Sharpen flavour per sharpness band
// (sharpMeter.js). Everything else with a voice sits beside what it describes: the weapons' `story` (their origin in
// the house) and the bosses' `taunt` / `taunt2` in config.js, the Pins' `intro` there too, achievements.js.
// Keep every line short: it shares a card with things the player needs to read. No imports.
export const STORY = {
  narrator: 'Tomato',          // the pincushion; the goals card's kicker says who's talking

  // One line as a level starts, under the wave 1 banner, by level id, only where there's something new to say: a boss,
  // a new Pin, enemy or mechanic (a level without a line starts with no card; its star goals are on the weapon
  // screen). None for level 0 (it's wordless on purpose), Random Quilt or Custom Road.
  dispatch: {
    meadow:  'Front of the drawer, lights out. Here they come.',
    fork:    'A silverfish lives here. The one thing in this drawer that’s real. Squish it.',
    hem:     'Runners tonight. Quick little things. When they bunch up, let SHRED loose.',
    running: 'The seam ripper’s gone bad. It was always going to.',
    double:  'Brutes, with thimbles on. Chill one and the thimble’s just a hat.',
    loop:    'Old jeans, back of the drawer. Nobody’s folding those. Fire helps.',
    hemline: 'The Brute King. Even his helmet has a helmet. Wait for the charge.',
    cross:   'Four roads, two hands. The Magnet Pin has the rest.',
    selvage: 'Button Beetles. Hard as, well, buttons. A hole does what a blade can’t.',
    whip:    'The back seam. The Unstitcher’s behind it. Finish this and the house never knows.',  },

  // The morning after a boss, by the boss level's id: `from` = where the note was found, `note` = what the human
  // wrote, `reply` = Tomato, `paper` = what it's written on (index.html .rv-note: sticky (under a fridge magnet), lined
  // (a torn strip) or shopping (a shopping list's bottom corner)). Plays as a reward card (before the new scissors' card)
  // the first time the level is won.
  morning: {
    running: { from: 'A note on the fridge', paper: 'sticky',
               note: 'The seam ripper is MISSING. Fine. We’ll use the scissors.',
               reply: 'Missing. That’s one word for it.' },
    hemline: { from: 'A text, 7:40 am', paper: 'lined',
               note: 'found a thimble in the cutlery tray?? and why are the scissors warm',
               reply: 'Warm. You should have felt them at three in the morning.' },
    whip:    { from: 'The shopping list, bottom corner', paper: 'shopping',
               note: 'Cleaned out the junk drawer. FINALLY. Threw away a load of weird purple fluff.',
               reply: 'They cleaned it out. They still didn’t notice. Sleep well, snippers.' },
  },

  // Why the edge is the way it is: the humans had the scissors all day. One line per sharpness band
  // (CONFIG.meta.sharpBands: Dull, Worn, Fair, Keen, Sharp), under the meter.
  sharpen: [
    'Someone opened a parcel with you. Twice.',
    'Wrapping paper. All of it. You remember.',
    'A bit of cardboard, a bit of tape. Fine.',
    'One coupon. Barely counts.',
    'Untouched all day. Bless them.',
  ],
};
