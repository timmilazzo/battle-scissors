// The story's words, in one place, so the voice can be read and edited top to bottom.
//
// The premise: every junk drawer that gets junky enough wears thin at the back, and things come through the worn spot
// at night, made of the drawer's own leftovers. The household scissors hold the line while the house sleeps, and the
// humans never find out. Tomato, the pincushion, has seen it all and briefs the player.
//
// Five worlds, one drawer or box each, a year passing (docs/worlds.md): the sewing tray in spring, the mending pile
// over the summer, the kitchen drawer in autumn, the bedside drawer through the long dark, and the holiday box down
// from the attic in winter, the cold back of the drawer, where the back seam is and the Unstitcher waits behind it.
// Each world's tool has gone bad (its boss); each drawer belongs to a human who writes a note the morning after.
//
// What lives here: Tomato's dispatch line per level (the star goals card, game.js showGoals), the world arrival lines
// (`worlds`: what Tomato says the first time the map opens on a world), the morning-after notes (a reward card after
// each world's boss: what that drawer's human wrote the next day, and what Tomato makes of it; levelMap.js showReveal,
// queued by levelSelect.js recordLevelResult) and the Sharpen flavour per sharpness band (sharpMeter.js). Everything
// else with a voice sits beside what it describes: the weapons' `story` (their origin in the house) and the bosses'
// and mini bosses' `taunt` / `taunt2` in config.js, the Pins' `intro` there too, achievements.js.
// Keep every line short: it shares a card with things the player needs to read. No imports.
export const STORY = {
  narrator: 'Tomato',          // the pincushion; the goals card's kicker says who's talking

  // One line as a level starts, under the wave 1 banner, by level id, only where there's something new to say: a boss,
  // a mini boss, a new Pin, Skill, enemy or mechanic (a level without a line starts with no card; its star goals are on
  // the weapon screen). Each world's first level says what this drawer is and what comes out of it. None for level 0
  // (it's wordless on purpose), Random Quilt or Custom Road.
  dispatch: {
    // World 1: The Sewing Tray
    meadow:     'The sewing tray, lights out. Every scrap that missed the bin. Here they come.',
    clover:     'A silverfish lives here. The one thing in this drawer that’s real. Squish it.',
    hem:        'Runners tonight. Quick little things. When they bunch up, let SHRED loose.',
    tack:       'Some came back in darker thread. Tougher stitching. Same scissors.',
    bobbin:     'A bobbin’s come off its spindle. It sheds scraps as it rolls. Cut the bobbin, not the mess.',
    double:     'Brutes, with thimbles on. Chill one and the thimble’s just a hat.',
    blanket:    'Breathe. Tailor’s Focus slows the whole tray down. Your blades don’t.',
    gather:     'They’ve found the gaps at the sides. Watch both edges.',
    backstitch: 'Everything this tray has, all at once. Five waves. Stay sharp.',
    running:    'The seam ripper’s gone bad. It was always going to.',
    // World 2: The Mending Pile
    fork:       'The mending pile. Jeans that waited all summer for a patch. What crawls out is heavier.',
    loop:       'Denim doesn’t snip easy. A stray match head isn’t fussy. Fire helps.',
    rivet:      'Rivet Row. The road doubles back on itself. So can you.',
    pocket:     'Runners in packs, out of the back pocket. None of them in plain thread.',
    zipper:     'The zipper’s come undone. Teeth first, then the pull.',
    cross:      'Four roads, two hands. The Magnet Pin has the rest.',
    patchwork:  'A spare thimble for the heart. Thimble Guard stops what slips past.',
    bias:       'Two ways in tonight. Bias tape runs crooked on purpose.',
    seam:       'The whole pile at once. Every patch, every rivet. Hold the seam.',
    hemline:    'The Brute King. Even his helmet has a helmet. Wait for the charge.',
    // World 3: The Kitchen Drawer
    leafpile:   'The kitchen drawer. Leaves blow in every time the back door opens. So does the wind.',
    corkscrew:  'A wine cork, still smelling of Sunday. Set it on the road and let them step on it.',
    ruler:      'Spilt ribbon for a river, a ruler for a bridge. Everyone crosses single file.',
    pinecone:   'Burrs. All spikes at the tips. Bite near the pivot or don’t bother.',
    honeydipper:'The honey dipper. Everything sticks to it. Snip it before it’s wearing the whole wave.',
    toadstool:  'Burrs hate a jaw that holds on. The pruners know.',
    harvest:    'Tailor’s chalk. Seam Mark one, and the next snip goes straight through.',
    pumpkin:    'Two doors this time. The pumpkins aren’t helping.',
    bonfire:    'Every leaf, burr and scrap in the drawer, with the wind behind them.',
    twine:      'The ball of twine. It rolls over whatever it meets and keeps it. Wait for the charge.',
    // World 4: The Bedside Drawer
    lanternlane:'The bedside drawer, lights out for real. Moths go for the lanterns. So should you.',
    keyring:    'The reading lamp’s bulb, still warm. Whatever it lights, you hit where it hurts.',
    marble:     'A lost marble wore this track. Long way round. Lots of road to work with.',
    selvage:    'Button Beetles. Hard as, well, buttons. A hole does what a blade can’t.',
    bottlecap:  'A bottle cap, rolling. It clangs while it spins. Snip it when it wobbles.',
    pencil:     'Beetles everywhere. Grandpa’s cutter has a hole for every one of them.',
    clothespin: 'Pinking Cut. A zigzag through the crowd, well past the tips.',
    cookiecutter:'Two ways in. In the dark. Naturally.',
    moonlight:  'The whole drawer’s awake. Moths, beetles, all of it. Keep the lamps lit.',
    skeletonkey:'The skeleton key. It opens anything, mostly the side door. Snip it while it turns.',
    // World 5: The Holiday Box
    firstsnow:  'The holiday box, down from the attic. The cold back of the drawer. Snowballs grow if you let them.',
    candlelight:'A birthday candle, saved for later. It melts armor. It melts most things.',
    sledrun:    'A long straight run. They come down it fast.',
    icicle:     'Icicles. Frozen already, so ice won’t help. Fire will.',
    snowglobe:  'The snow globe. One shake and the Pins go under. Snip it while it shakes.',
    lair:       'Ribbon off last year’s presents. Leave a curl on the road and watch them wade through it.',
    tinsel:     'Basting Stitch. Sew a line across the road. It costs Thread. It holds.',
    cabin:      'Two ways in, and every window lit. Nobody inside is awake.',
    blizzard:   'Six waves, in the cold. The last stretch before the seam.',
    whip:       'The back seam. The Unstitcher’s behind it. Finish this and the house never knows.',
  },

  // The first time the map opens on a world (once per world; the map's world arrows): Tomato's one line about where
  // the scissors are now. By world id (a level file's `world`): `name` = the world's name on the map (as worlds.md),
  // `arrival` = the line.
  worlds: {
    meadow: { name: 'The Sewing Tray',    arrival: 'The sewing tray. Pins, spools and every scrap that missed the bin. It starts here.' },
    denim:  { name: 'The Mending Pile',   arrival: 'The mending basket. Everything torn since spring ends up here, and something heavier with it.' },
    autumn: { name: 'The Kitchen Drawer', arrival: 'The kitchen drawer. String, corks, and a leaf off every boot since September.' },
    night:  { name: 'The Bedside Drawer', arrival: 'The bedside drawer. Keys, a pencil stub, a marble. Darker in here than you’d think.' },
    snow:   { name: 'The Holiday Box',    arrival: 'The holiday box, down from the attic. Cold back here. The seam is close.' },
  },

  // The morning after a boss, by the boss level's id, from the human whose drawer it was: `from` = where the note was
  // found, `note` = what they wrote, `reply` = Tomato, `paper` = what it's written on (index.html .rv-note: sticky
  // (under a fridge magnet; short), lined (a torn strip, stretches to fit) or shopping (a shopping list's bottom corner;
  // short)). Plays as a reward card (before the new scissors' card) the first time the level is won.
  morning: {
    // the sewing tray's owner
    running:     { from: 'A note on the fridge', paper: 'sticky',
                   note: 'The seam ripper is MISSING. Fine. We’ll use the scissors.',
                   reply: 'Missing. That’s one word for it.' },
    // whoever does the mending
    hemline:     { from: 'A text, 7:40 am', paper: 'lined',
                   note: 'found a thimble in the cutlery tray?? and why are the scissors warm',
                   reply: 'Warm. You should have felt them at three in the morning.' },
    // the cook
    twine:       { from: 'The shopping list, bottom corner', paper: 'shopping',
                   note: 'Eggs. Flour. MORE TWINE (where??). Find the good shears.',
                   reply: 'The good shears are with us now. Don’t tell the cook.' },
    // the sleeper
    skeletonkey: { from: 'The notebook by the bed', paper: 'lined',
                   note: 'Dreamt the drawer was rattling all night. Also, the spare key’s gone.',
                   reply: 'Not a dream. And that key won’t be opening anything again.' },
    // whoever packed the holiday box
    whip:        { from: 'A note on the fridge, January', paper: 'sticky',
                   note: 'Holiday box is back up in the attic. Threw out some weird purple fluff.',
                   reply: 'Packed away, fluff and all. They never noticed. Sleep well, snippers.' },
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
