# Worlds

The map pivots from one 13-level road to **five worlds of ten levels**, each a drawer or box in the house with its own
look, its own enemy, its own Pin, its own Skill, a mini boss on level 5 and the drawer's tool gone bad as the boss on
level 10. Clearing a world's boss opens the next world. This file is the contract: level ids, what each level
introduces, the tools, the enemies, the bosses, the rules per world, the economy and what the save keeps. Code and
story follow it; change it here first.

Level 0 (First Snip, the tutorial) stays as it is, on world 1's map. Random Quilt and Custom Road stay off the map.

## The five worlds

| # | id (`world`) | Name on the map | The drawer | Look (reference) | Boss (the tool gone bad) |
|---|---|---|---|---|---|
| 1 | `meadow` | The Sewing Tray | the sewing tray in the craft room | wooden tray, green felt meadow, fenced road (`assets/level-bg.webp`) | The Seam Ripper |
| 2 | `denim` | The Mending Pile | the mending basket, old jeans | quilted denim plate, patches, no tray (`assets/level2-bg.webp`) | The Brute King |
| 3 | `autumn` | The Kitchen Drawer | the kitchen junk drawer in autumn | wooden tray, leaf litter, pine cones, pumpkins, a satin river with a ruler bridge, a copper mug glow | The Twine Ball |
| 4 | `night` | The Bedside Drawer | the bedside drawer, lights out | wooden tray, deep blue and purple knit ground, lavender, keys, a pencil, lit lanterns, a marble | The Skeleton Key |
| 5 | `snow` | The Holiday Box | the holiday box from the attic, the cold back of the drawer | wooden tray, white fleece snow, frozen ponds, cottages with lit windows, snow-capped fences | The Unstitcher |

The order is a year passing (spring, the summer mending, fall, the long dark, winter) and ends at the back seam.

**Shared art.** Worlds 1, 3, 4 and 5 share the wooden tray frame, the fence posts and rails, the flag posts on the heart
pad and the road felt. Only the ground, props, pads and lighting change (world 5 adds snow caps to the fence and the
tray). World 2 keeps its own quilt look with no tray and the selvage road edge. Until a world's sprites arrive the
painter uses stand-ins: the meadow ground with the world's colour grade, the meadow frame and road kit, no props.
`kit.js` `ZONES` gets an entry per world; a missing texture or sprite is skipped, as now.

## Ten levels, one beat each

Every world follows the same sheet, so every level has one new thing and nothing is filler:

| Slot | Beat | What's new |
|---|---|---|
| 1 | Arrival | the world's look, its world rule, its first new enemy |
| 2 | The new Pin | the world's Pin (`pinFrom`); a pair goes on sale after it |
| 3 | A road twist | a shape this world does (a bridge, a spiral, a long slide) |
| 4 | Pressure | the world's second enemy, or ranks and packs of the first |
| 5 | **Mini boss** | fought mid-wave, not alone; its twist previews the world's boss |
| 6 | The reward in play | the pair that went on sale / the mini boss's reward, a level built for it |
| 7 | The new Skill | the world's Skill (`skillFrom`) |
| 8 | Two entrances | a second entrance (`entry`) |
| 9 | The gauntlet | every enemy of the world, the most waves |
| 10 | **Boss** | the drawer's tool gone bad, alone as the last wave; its reward and the next world |

Mini boss rewards: the world's Pin's tiers go on sale (W1: SHRED's tiers). Boss rewards: new scissors (W5: the
credits and a cosmetic).

## The levels

Ids in **bold** already exist (their saves carry over; only their place and waves change). Everything else is new.
`world-n` is how a level is numbered on the map and in `levelLabel` ("Level 2-3: Rivet Row"). The global number
(1..50, level 0 = 0) sets the wage cap.

### World 1: The Sewing Tray (`meadow`)

| n | id | Name | Recipe idea | New | Enemies |
|---|---|---|---|---|---|
| 0 | **first** | First Snip | straight, no pads | the tutorial | scrap |
| 1 | **meadow** | Meadow Road | painted plate | Needle Pin | scrap, bolster |
| 2 | clover | Clover Fork | `s left, fork pin` | the Silverfish (critter intro, moved from Button Fork); Split Enders on sale after | scrap, bolster |
| 3 | **hem** | Zigzag Hem | existing | Runners; SHRED | + runner |
| 4 | tack | Tacking Stitch | `wave 3, bend right` | ranks (rank 2 phases in from here) | scrap, bolster, runner |
| 5 | bobbin | The Bobbin | `s, s, entry right 30` | mini boss The Bobbin | all + bobbin |
| 6 | **double** | Double Seam | existing | the Brute; Ice Pin | + brute |
| 7 | **blanket** | Blanket Stitch | existing | Tailor's Focus (Skill) | all |
| 8 | gather | Gathering | `fork long, s, entry left 25, entry right 60` | two side entrances | all |
| 9 | backstitch | Backstitch | `size 1.2, zigzag 3, fork pin, entry right 20` | the gauntlet, five waves | all |
| 10 | **running** | Running Stitch | existing | boss The Seam Ripper; reward Dagger Shears | boss |

### World 2: The Mending Pile (`denim`)

| n | id | Name | Recipe idea | New | Enemies |
|---|---|---|---|---|---|
| 1 | **fork** | Button Fork | painted plate | the quilt look; Brutes in ranks | scrap, bolster, brute |
| 2 | **loop** | Button Loop | existing | Fire Pin; Scrap Snippers on sale after | all |
| 3 | rivet | Rivet Row | `size 1.2, wiggle 4, bend center, heart left` | switchbacks | all |
| 4 | pocket | Back Pocket | `size 1.2, fork wide, s, entry left 20` | Runner packs, rank 2 everywhere | all |
| 5 | zipper | The Zipper | `size 1.3, s right, s left, entry right 25` | mini boss The Zipper | all + zipper |
| 6 | **cross** | Crossroads | existing | Magnet Pin | all |
| 7 | patchwork | Patchwork | `size 1.3, triple, fork pin, entry left 30` | Thimble Guard (Skill) | all |
| 8 | **bias** | Bias Tape | existing | two entrances | all |
| 9 | seam | Flat Seam | `size 1.4, zigzag 2, triple, entry right 30, entry left 70` | the gauntlet | all |
| 10 | **hemline** | Hemline | existing | boss The Brute King; reward War Nippers | boss |

### World 3: The Kitchen Drawer (`autumn`)

| n | id | Name | Recipe idea | New | Enemies |
|---|---|---|---|---|---|
| 1 | leafpile | Leaf Pile | `size 1.2, s left, s right, entry right 20` | the gusts (world rule); Leaves | leaf, scrap, bolster |
| 2 | corkscrew | Corkscrew | `size 1.2, spiral right 1` | Cork Pin; Ratchet Pruners on sale after | + runner |
| 3 | ruler | Ruler Bridge | `size 1.3, wave 2, s, entry left 25` | the river and the bridge (dressing) | all |
| 4 | pinecone | Pine Cone Path | `size 1.3, zigzag 3, bend right` | Burrs | + burr |
| 5 | honeydipper | The Honey Dipper | `size 1.3, s, fork long, entry right 30` | mini boss The Honey Dipper | all + honeydipper |
| 6 | toadstool | Toadstool Ring | `size 1.3, fork pin, wave 3, entry left 20` | the Pruners in play (their hold vs Burrs) | all |
| 7 | harvest | Harvest Row | `size 1.4, wiggle 4, triple, entry right 25` | Seam Mark (Skill) | all |
| 8 | pumpkin | Pumpkin Patch | `size 1.4, fork wide, zigzag 2, entry left 30, entry right 65` | two entrances | all |
| 9 | bonfire | Bonfire | `size 1.4, triple, s, fork pin, entry right 20, entry left 70` | the gauntlet | all |
| 10 | twine | The Twine Ball | `size 1.4, wave 3, s, entry left 25` | boss The Twine Ball; reward Kitchen Shears | boss |

### World 4: The Bedside Drawer (`night`)

| n | id | Name | Recipe idea | New | Enemies |
|---|---|---|---|---|---|
| 1 | lanternlane | Lantern Lane | `size 1.3, s right, bend left, entry left 20` | the dark (world rule); Moths | moth, scrap, bolster |
| 2 | keyring | Key Ring | `size 1.3, spiral left 1` | Lamp Pin; Cigar Cutter on sale after | all + runner |
| 3 | marble | Marble Run | `size 1.3, zigzag 4, bend center, heart right` | a long switchback slide | all |
| 4 | **selvage** | Beetle Hour | existing | Button Beetles | + beetle |
| 5 | bottlecap | The Bottle Cap | `size 1.4, s, s, entry right 30` | mini boss The Bottle Cap | all + bottlecap |
| 6 | pencil | Pencil Stub | `size 1.4, fork pin, wiggle 3, entry left 25` | the Cigar Cutter in play (Beetles everywhere) | all |
| 7 | clothespin | Clothespin | `size 1.4, triple, s, entry right 25` | Pinking Cut (Skill) | all |
| 8 | cookiecutter | Cookie Cutter | `size 1.4, triple, fork wide, entry left 30, entry right 70` | two entrances | all |
| 9 | moonlight | Moonlight | `size 1.5, zigzag 3, triple, fork pin, entry right 20, entry left 65` | the gauntlet | all |
| 10 | skeletonkey | The Skeleton Key | `size 1.5, wave 3, fork long, entry left 25, entry right 60` | boss The Skeleton Key; reward Stork Snips | boss |

### World 5: The Holiday Box (`snow`)

| n | id | Name | Recipe idea | New | Enemies |
|---|---|---|---|---|---|
| 1 | firstsnow | First Snow | `size 1.3, s left, s right, entry right 20` | the cold (world rule); Snowballs | snowball, scrap, bolster, brute |
| 2 | candlelight | Candlelight | `size 1.3, wave 3, fork pin, entry left 25` | Candle Pin; Ribbon Shears on sale after | all |
| 3 | sledrun | The Sled Run | `size 1.4, straight long, s, entry right 20` | a long straight slide (enemies run it fast) | all + runner |
| 4 | icicle | Icicle Row | `size 1.4, zigzag 3, bend right, entry left 25` | Icicles | + icicle |
| 5 | snowglobe | The Snow Globe | `size 1.4, s, fork long, entry right 30` | mini boss The Snow Globe | all + snowglobe |
| 6 | **lair** | Frost Spiral | existing (spiral) | the Ribbon Shears in play | all |
| 7 | tinsel | Tinsel | `size 1.5, wiggle 5, triple, entry left 25` | Basting Stitch (Skill) | all |
| 8 | cabin | Cabin Lights | `size 1.5, fork wide, s, entry left 30, entry right 65` | two entrances | all |
| 9 | blizzard | Blizzard | `size 1.5, triple, zigzag 3, fork pin, entry right 20, entry left 70` | the gauntlet, six waves | all |
| 10 | **whip** | The Back Seam | existing | boss The Unstitcher; the credits and the Unstitcher Glow cosmetic | boss |

## Tools

One Pin and one Skill per world, a reward pair from every boss but the last, a pair on sale after every level 2.

### Pins (`CONFIG.towers`, `CONFIG.pinFrom`)

| Pin | World, level | What it does | Tier 3 signature |
|---|---|---|---|
| Needle | 1-1 | shoots the enemy furthest along, reloads | volley of two |
| Ice | 1-6 | slows its ring; a slowed Brute's armor doesn't stop a snip | freezes on entry |
| Fire | 2-2 | sets its ring on fire, burns on after | longer burn |
| Magnet | 2-6 | drags its ring back into a clump that stands still | shorter period |
| **Cork** | 3-2 | a trap on its road point: when an enemy steps on it, it pops: everything within `popPx` is shoved back `popBackU` along the road and stunned `stunSec`, then it re-arms over `rearmSec` | pops twice |
| **Lamp** | 4-2 | lights its ring: a lit enemy takes a weak-spot hit from any snip (`weakDamageMult`), and in the dark it's fully visible | lit enemies also crit (`critMult`) |
| **Candle** | 5-2 | softens its ring: armor is off, Snowballs stop growing and shrink, and everything takes `meltMult` x damage | the softening lingers `meltLingerSec` after leaving |

A Pin's permanent tiers go on sale once its world's mini boss is cleared (world 1's mini boss opens SHRED's tiers).
Build costs stay equal; ranks in play stay as they are.

### Skills (`CONFIG.skills`, `CONFIG.skillFrom`; the planned `skillIdeas`, now real)

The player carries two moves in two free slots (`Save.moves`), picked on the weapon screen before a level: each slot
holds SHRED or any Skill the level allows, or nothing, and the same move is never in both. SHRED is just the first
move the player gets (1-3, worlds 1-3 lean on it); each world then adds a Skill on its level 7, and a move's first level
puts it in an empty slot (else the second) and says NEW HERE. Each slot has its own charge meter under the HUD wave
badge, fired the same way (tap the full meter to arm or fire, the next press fires an armed one; E for slot 1, F for
slot 2 on desktop; only one slot armed at a time). Two Skills at once each run on their own meter and effects. Bought
up in tiers in the Sewing Box's Moves tab (`Save.skills[id]`, `CONFIG.skillCosts` 120/240/400).

| Skill | World, level | Charged by | Effect | Tiers |
|---|---|---|---|---|
| Tailor's Focus | 1-7 | clean full-open snips | the board slows to `focusSlow` for `focusSec`; the blades stay full speed | lasts longer; charges faster; kills during it refund charge |
| Thimble Guard | 2-7 | kills near the heart and squished silverfish | a brass thimble caps the heart pad and stops the next `thimbleStops` enemies that reach it | stops three; bumps them back up the road; recharges faster |
| Seam Mark | 3-7 | nicks and near-misses | chalk-mark one enemy (tap it): the next snip on it does `markMult` x damage and ignores armor | the mark spreads to neighbours; marked kills refund charge; two marks |
| Pinking Cut | 4-7 | multi-snips | the next snip cuts a zigzag lane `pinkingLen` past the tips, hitting everything along it | a longer lane; cuts through armor; leaves a slowing trail |
| Basting Stitch | 5-7 | Thread, paid each time (`bastingCost`) | drag across the road to sew a stitch line that holds the first `bastingHolds` enemies to reach it | holds more; holds longer; held enemies take extra snip damage |

### Scissors (`CONFIG.weapons`)

| Pair | How it's won | Signature (T3) |
|---|---|---|
| Safety Firsts | level 0 | all stats +10% |
| Split Enders | on sale after 1-2 (200) | angle |
| Dagger Shears | 1-10 reward | all stats +10% |
| Scrap Snippers | on sale after 2-2 (300) | crit |
| War Nippers | 2-10 reward | damage |
| Ratchet Pruners | on sale after 3-2 (400) | jaw hold |
| **Kitchen Shears** | 3-10 reward | heavy serrated blades, a bottle-opener notch in the handle: slow to open, the hardest graded hit in the game; `notch`: a snip with a Burr or Beetle at the pivot kills it outright (`pivotExecute`) |
| Cigar Cutter | on sale after 4-2 (500) | ring |
| **Stork Snips** | 4-10 reward | the embroidery stork: tiny, opens almost instantly (`openMs` lowest), short reach, every hit a nick: `weakAlways` (every snip counts as a weak-spot hit); T3 widens the crit zone |
| **Ribbon Shears** | on sale after 5-2 (600) | gift-wrap shears: the longest, thinnest blades; a snip leaves a curl of ribbon on the road for `curlSec` that slows what crosses it (`curlSlow`); T3 longer curls |

The three new pairs need SVG art in `assets/weapons/` in the existing layered format (see weaponArt.js); until then
a line-drawn fallback shows.

## Enemies (`CONFIG.enemyTypes`)

| Type | World | HP | Twist |
|---|---|---|---|
| scrap, bolster, runner | 1 | as now | |
| brute | 1-6 on | as now | |
| **leaf** | 3-1 | 1 | light: drifts side to side across the road (`driftPx`, `driftSec`), and a gust carries it `gustLeafMult` x further |
| **burr** | 3-4 | 4 | spiky: a hit in the tip half of the blades does nothing (`tipImmune`); pivot-half hits, fire, needles and SHRED work |
| **moth** | 4-1 | 2 | flies: every `hopEverySec` it lifts off and lands `hopU` further along the road over `hopSec`; untouchable in the air (snips, Pins and Magnet pulls miss it; a shadow shows where it is) |
| beetle | 4-4 | as now | |
| **snowball** | 5-1 | 2 | rolls: gains `growHpPerSec` HP and `growRPerSec` radius every second on the road (cap `growMax`); kill it early |
| **icicle** | 5-4 | 1 | fast as a runner; Ice does nothing to it (already frozen); fire and the Candle do `iceFireMult` x |

Ranks keep working as now (the mix grows by global level number).

## World rules (`CONFIG.worldRules[world]`)

| World | Rule |
|---|---|
| meadow, denim | none |
| autumn | **gusts**: every `gustEverySec` a wind banner blows across; every enemy on the road jumps `gustU` forward over `gustSec` (Leaves `gustLeafMult` x); a held, pulled or frozen enemy doesn't move |
| night | **the dark**: the plate is dimmed outside pools of light (the lantern props, the Lamp Pin's ring, the heart pad, `lightR` round each); enemies in the dark are drawn at `darkAlpha` and show no weak spot |
| snow | **the cold**: the Ice Pin's slow is `coldIceMult` weaker, fire burns `coldBurnMult` x longer, Brutes' armor is `coldArmor` (two clangs) |

## Bosses and mini bosses (`CONFIG.bosses`)

Mini bosses are enemy-sized (2.5 x) variants with one twist, fought while the wave keeps coming: a short banner, no
intro card, an HP bar with a rule line, `mini: true`. They reuse the existing modes with their own numbers. Bosses
come alone as the last wave with the intro card, as now. Every boss and mini boss carries a `taunt` (and bosses a
`taunt2`) in config.js.

| | Level | Mode | Twist |
|---|---|---|---|
| The Bobbin (mini) | 1-5 | `trail` (new, small): walks, and every `spoolEverySec` drops a Scrap behind it | kill the Bobbin and its Scraps stop |
| The Seam Ripper | 1-10 | `seam` | as now |
| The Zipper (mini) | 2-5 | `swarm` with `escortLine: true` and no refill: its teeth are five Scraps following in a line behind it; the head is shielded while a tooth lives | cut the teeth, then the head |
| The Brute King | 2-10 | `armor` | as now |
| The Honey Dipper (mini) | 3-5 | `swarm` with `captures: true`: it spawns no escorts; enemies that come within `stickPx` stick to it, ride along and shield it; a snip on it shakes one loose | kill it before it fills up |
| The Twine Ball | 3-10 | `armor` + `captures: true` | charges like the King; enemies it rolls over get wrapped (captured); the wrapped shield it; cutting a wrapped enemy frees the rest of that charge's catch; it comes alone, so each wind-up drops `feedCount` stunned Scraps ahead of it to roll over (`feedType`, `feedAheadPx`) |
| The Bottle Cap (mini) | 4-5 | `armor` without the helmet: `rolling` | rolls in speed bursts bouncing off the road's edges (`ox` flips); hits while rolling clang; between bursts it wobbles to a stop: snip it then |
| The Skeleton Key | 4-10 | `seam` + `unlocks` | walks slowly; every `unlockEverySec` it turns with a click and a burst of Moths comes in by the level's side entrance; its seam (the teeth) is open while it turns |
| The Snow Globe (mini) | 5-5 | `seam` with `shake: true` | every `shakeEverySec` it shakes for `shakeSec`: the screen shakes, every Pin is snowed under (off) for `snowSec`, and snips on it do `openDmg` only while it shakes |
| The Unstitcher | 5-10 | swarm, armor, seam | as now |

## Difficulty

Enemy HP scales by world and by level inside the world, not by one straight line:

    mult = 1 + hpPerWave x (wave - 1) + levelHp x (hpPerWorld x (world - 1) + hpPerLevel x (n - 1))

`hpPerWorld` 0.3 (0.5 stacked too high on top of the rank mix), `hpPerLevel` 0.06 (replacing `hpLevelFrom`); the rank mix (`enemyRanks`: start 0.1, perLevel 0.045, perWave 0.03, fromLevel 4 on the global number) fills in rank 2s through worlds 1-2 and rank 3s through worlds 3-5, each type's `levelHp` as now. Random Quilt and Custom
Road count as world 3, level 5 (`hpOffMapWorld`, `hpOffMapLevel`). The reward pairs' `damageMult` rise to keep pace
(Kitchen Shears the heaviest). `node tools/wavesheet.js` prints every level's waves, Thread and the multiplier.

## Economy

Unchanged in kind (see CLAUDE.md's rules). The wage cap uses the global level number (1..50), so
`scoreCapPerLevel` drops to 1 (W1-1 8, W5-10 58). Stars 10/15/25 the first time. A chest per world (five cosmetics: Clover
Handles, Indigo Glow, Copper Glow, Lantern Glow, Frost Handles; Ripper Glow, the old Lair chest's, is a Shop item now). `node tools/buttonsupply.js` prints the supply and what a
2.2-star playthrough affords; new sinks: three pairs (400 to 600), three Pins' tiers, five Skills' tiers.

## The map

One map plate per world (`CONFIG.map.worlds[]`: `id, name, img, w, h, nodes, chest, hitW, hitH`), the same plate shape
as now, shown one at a time with ‹ › arrows and the world's name over it. World 1's plate is the existing art (patches
11 to 13 unused until the new plate arrives); worlds 2 to 5 use a felt stand-in with ten patches laid out by code until
their art comes. A world is locked until the previous world's boss is cleared (`map.lockWorlds`; `map.locks` keeps
locking levels inside a world for release). The map opens on the world of the next level to beat. The chest sits on its
world's plate. `mapLevelNum(id)` becomes `levelPlace(id)` = `{ world, n, global }`.

## Story (`src/story.js`)

Tomato still briefs. Each world opens with Tomato's line on its first level (what this drawer is and what comes out of
it), every level with something new keeps a dispatch line, every boss gets a morning-after note from the human who
owns that drawer (five notes: the sewing tray's owner, whoever does the mending, the cook, the sleeper, whoever packed
the holiday box), and the credits move to 5-10. Mini bosses get a taunt only. New pairs get their `story` line (where
in the house they came from), new Pins their `intro`.

## Recipes as built

The recipe ideas above were the starting point; the level files hold what actually fits (the generator drops a side
entrance that cannot merge and caps entrance positions at 60). Changed from the ideas: gather, backstitch, pocket, seam,
leafpile, pumpkin, bonfire (no `fork pin`), pencil, clothespin, cookiecutter, moonlight (no `fork pin`), firstsnow,
sledrun (`straight, straight, s`), icicle, cabin, blizzard (no `fork pin`, `zigzag 2`). Brutes also walk worlds 3-4
from level 6 on. `node tools/wavesheet.js` prints every level as built.

## Save

Level ids survive, so `Save.levels` carries over. `migrate` v5: a save that cleared the old L12 (`whip`) or L13
(`lair`) keeps them cleared, which clears nothing else; `Save.equippedSkill` added; the old `unlocks.pins` kept.
`migrate` v6 (two free move slots): `Save.moves = ['shred', equippedSkill || '']` replaces `Save.equippedSkill`.
Achievements keyed by world (`clear-meadow` ...) gain `autumn`, `night`, `snow`.

## Sprites

The round 5 sprite request (docs/sprite-wishlist.md, "Round 5: the five worlds") lists what each new world needs and
what's shared. Everything paints with stand-ins until it arrives.
