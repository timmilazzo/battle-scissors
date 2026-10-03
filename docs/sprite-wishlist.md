# Sprite wishlist, rounds 2 to 6

Round 1 (the level-generator kit: fixed pieces, textures, sewing / meadow / lair props, map stars) is delivered and
lives in `assets/kit/`. This round covers what the game still fakes in code or with stand-ins, what the playtests
turned up, and things we'll want later. Round 3 (level dressing: frames, hero props, road and ground dressing) and
round 4 (the story: drawer-scale junk, Tomato the pincushion, the morning note) and round 5 (the five worlds: three new looks, their map plates, chests and portraits) and round 6 (menus that match the title: button and panel blanks, icons, felt numerals, baked words, screen scenes, and the game sprites) are at the end, before the prompts. Level plates are 941 × 1672 px ("plate px") and show at about 1:1 on a phone,
so anything placed on a level is asked for at **2× its plate size**.

**Priority:** **P1** = needed now (a stand-in or a playtest problem). **P2** = soon (replaces code-drawn art, or
polish on screens people already see). **P3** = later (future content; nothing is waiting on it yet).

## Rules for every file

| | |
|---|---|
| **Camera** | Straight top-down (orthographic, 90°), like `assets/level2-bg.webp`, for anything that sits on a level or the map. UI icons and the boss portraits are the exceptions (front view, see their notes). |
| **Style** | Felt, denim and stitched fabric, matching Button Fork. Attach `assets/level2-bg.webp` (levels) or `assets/title-bg.webp` (UI) as the style reference. |
| **Light** | Soft, from the top-left. **No shadows** (cast or drop): I add those in code so everything matches. |
| **File type** | PNG-32 with transparency (preferred), or WebP with alpha. sRGB. |
| **Background** | Transparent. If the generator can't do that: a flat **#FF00FF magenta**, with no magenta or pink in the objects and no glow or haze bleeding into the background. |
| **Spacing** | On a sheet, at least 40 px of empty background between objects, and none touching the edge. |
| **Edges** | Clean cut-outs with no white or coloured halo. A little felt fuzz on the outline is fine. |
| **Naming** | `zone_item_variant.png`, e.g. `denim_rivet_01.png`. Zones: `sewing` (everywhere), `meadow`, `denim`, `lair`, `ui`. |
| **Sheets vs single files** | Either works. With sheets, one sheet per section below. I'll cut them apart and measure them myself. |
| **Animation frames** | Same canvas size for every frame, the object in the same spot, frames left to right in one row. |

## P1: needed now

### 1. Clean level map: delivered

The blank-patch map with patch 0 is in (`assets/level-map.webp`).

### 2. Title buttons, exported on their own

Superseded by section 40 (round 6): the title's slots have changed since.

The title buttons are cropped out of the mock (`assets/title-mock.webp`) as a stand-in.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Big felt buttons: PLAY, HOW TO PLAY, SEWING BOX, SHOP | 4 × 2 states | 730 × 196 | Normal and pressed (pressed = sunk a little, slightly darker). Lettering baked in, Lilita One style. SEWING BOX replaces the old UPGRADES tile: it is the inventory screen (what you hold and its upgrades); the Shop is only for new things. |
| Round icon tiles: gear (settings), sound on, sound off | 3 × 2 states | 200 × 200 | Same felt tile as the mock's. |

### 3. Buttons currency icon

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| A single gold sewing button (4-hole), the currency | 1 | 128 × 128 | Shown beside the balance on the map, shop and results. Needs to read at 20 px. |
| A small heap of those buttons | 1 | 320 × 240 | For the results tally and shop headers. |

### 4. World chests

The map's three chests are CSS boxes. One per zone, three states each.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Chest: closed (locked), closed (ready: brighter, a little sparkle stitched on), open (empty) | 3 zones × 3 states | 240 × 200 | Meadow: a wicker sewing basket. Denim: a denim tote with a brass snap. Lair: a purple velvet box with a tarnished clasp. Seen from above at a slight three-quarter tilt is fine here (it sits on the map, which is painted that way). |

### 5. Denim zone props

The denim zone has a ground texture but scatters only the generic sewing props.

| Item | Count | Plate size | Deliver at |
|---|---|---|---|
| Back pocket patch (stitched outline, top-down) | 2 | 200 × 220 | 400 × 440 |
| Copper rivets | 3 | ⌀ 30 | 60 × 60 |
| Jeans tack button (metal, stamped) | 2 | ⌀ 50 | 100 × 100 |
| Zipper, straight, a short length | 1 | 60 × 260 | 120 × 520 |
| Leather jeans label | 1 | 180 × 110 | 360 × 220 |
| Frayed hole with white threads across it | 2 | ⌀ 140 | 280 × 280 |
| Belt loop | 2 | 50 × 110 | 100 × 220 |
| Folded cuff / hem strip | 1 | 320 × 80 | 640 × 160 |

## P2: soon

### 6. Map and menu markers

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| "You are here" marker: a big sewing pin with a round gold head | 1 | 160 × 240 | Stands on the next level to beat (it pulses in code). |
| Lock badge: a small brass padlock on a felt tag | 1 | 128 × 128 | Locked levels and locked weapon cards. |
| Check badge: a gold felt circle with a stitched tick | 1 | 128 × 128 | Cleared levels. |

### 7. UI icons (front view, flat, 2-tone felt)

Delivered (`assets/kit/07_icons`); only the heart and the spool are wired in so far. More icons are in section 38.

| Item | Count | Deliver at |
|---|---|---|
| Pause, play/resume, home, back arrow, retry, copy, mail (feedback) | 7 | 128 × 128 |
| Thread spool (the in-level currency chip) | 1 | 128 × 128 |
| SHRED: scissors mid-spin with motion stitches | 1 | 160 × 160 |
| Heart (workshop HP), full and cracked | 2 | 128 × 128 |

### 8. Trophies

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Achievement badge: a round embroidered patch, one design each | 16 | 256 × 256 | From `src/achievements.js`: Half Dozen, Tailor's Ten, No Needles Needed, One Trick, Bare Blades, Cigar Cut, Ratchet Bite, Pest Control, Silverfish Squasher, The Quilt Is Safe, Meadow Mended, Denim Darned, Lair Unravelled, Golden Meadow, Golden Denim, Golden Lair. Plus a greyed "locked" blank patch. |
| Cosmetic swatches: handle wraps (brass, rose, clover) and glows (ember, frost, indigo, ripper) | 7 | 160 × 160 | Shown in the Shop. Handles = a wrapped leather grip; glows = a soft coloured spark on a dark felt square. |

### 9. Per-zone fixed pieces

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Pin pad: meadow (fenced grass ring), denim (stitched denim circle), lair (velvet with pins round it) | 3 | 340 × 340 | Keep the middle plain. |
| Heart pad: meadow, denim, lair | 3 | 460 × 460 | Same red heart, zone-coloured ring. |

### 10. Characters now drawn in code

These are procedural today and work, but hand art would match the plates better.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Silverfish, top-down, 4-frame leg cycle | 4 frames | 240 × 120 | Silver, segmented, long feelers and 3 tail bristles. |
| Silverfish squish splat | 2 variants | 200 × 200 | Grey-yellow smear with a few silver scales. Cartoon, not gross. |
| Tutorial ghost hand: a friendly white felt glove, index finger out, seen from above | 2 frames (up, pressing) | 300 × 360 | Drawn translucent in code. Used to teach 5-year-olds, so friendly. |

### 11. Boss intro portraits (front view)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Seam Ripper, Brute King, The Unstitcher | 3 | 600 × 600 | Head-and-shoulders, facing the viewer, for the intro card. Same plush ragdoll look as the enemies (felt egg body, button eyes, cross-stitched seams). |

## P3: later

### 12. Enemy and Pin sprites

Superseded by section 45 (round 6), which covers every enemy, Pin and effect now in the game.

Replacements for the procedural art in `enemyArt.js` / `towerArt.js`. Top-down, each on its own canvas.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Enemies: Scrap, Runner, Bolster, Brute, Button Beetle | 5 × 2 frames (waddle) | 2× their size (Scrap ⌀ 60 → 120, Brute ⌀ 110 → 220) | Plus a white silhouette of each for the hit flash, if easy. |
| Bosses: Seam Ripper (seam closed / open), Brute King (armored / armor down), The Unstitcher (3 phases) | 7 | 320 × 320 | |
| Pins: Needle, Ice, Fire, Magnet | 4 | 300 × 300 | Felt cushion base with the charm on a post, like the current code art. |
| Pin rank looks: rank II and rank III of each Pin | 4 × 2 | 300 × 300 | In-level ranks (bought with Thread during a level). Same Pin, fancier each step, the way the code art does it now: rank II adds two more pins to the cushion and a wider flag; rank III two more pins with gold heads and a gold stripe along the flag's foot. The charm's glow is drawn in code and brightens by rank. |

### 13. Effects

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Stuffing puff (a kill burst), 5 frames | 1 sheet | 200 × 200 per frame | White cotton fluff bursting outward. |
| Thread snippets (fragments), 6 small bits | 1 sheet | 60 × 60 each | |
| Fire on felt, 4-frame loop | 1 sheet | 120 × 160 per frame | For burning enemies. |
| Frost ring, magnet pull ring | 2 | 512 × 512 | Pin auras, top-down, mostly transparent in the middle. |

### 14. New critters

The rules stay: fixed Thread reward, never Pin targets, capped per level, spawned by the wave clock.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Moth (lair): wings open / closed, 2 frames | 2 | 200 × 160 | Would flutter across above the road. |
| Ladybug (meadow): crawl, 2 frames | 2 | 100 × 100 | |
| Button mouse (denim): run, 4 frames | 4 | 200 × 120 | A felt mouse with a button nose. |

### 15. A fourth world

If the map grows past level 13 (say "the Attic" or "the Sewing Box"):

| Item | Count | Deliver at |
|---|---|---|
| Ground texture | 1 | 1024 × 1024 tiling |
| Props (lamp, trunk corner, dust bunnies, cobweb thread, old photos) | ~10 | 2× plate size |
| Pin pad and heart pad | 2 | 340 / 460 |
| Map art continuing the road, levels 14–19 | 1 | 1872 × 3362 |
| World chest (3 states) | 3 | 240 × 200 |

### 16. Painted boss-level plates

Like Button Fork (`assets/level2-bg.webp`, 941 × 1672, full plate, road painted in): one each for the Seam Ripper
(L4), Brute King (L8) and Unstitcher (L12) levels, so the bosses get a hand-painted arena instead of a generated one.
Deliver at 941 × 1672 (the plate size itself; these are drawn as the whole backdrop).

### 17. Future weapons (SVG, not PNG)

Weapons are layered SVGs (`assets/weapons/*.svg`): each moving part in its own group with a `data-role`, drawn closed,
tips up, 800 × 1000 view box, pivot at about (400, 440). Ideas: pinking shears (zigzag blades), stork embroidery
scissors (tiny, fast), a rotary cutter (a rolling wheel, a new kind of cut), the Seam Ripper itself as a post-credits
reward.

## Round 3: level dressing

Rounds 1 and 2 are in (`assets/kit/`), except the denim props (section 5, still wanted). The generated levels (every
map level from 3 on) now use the kit, but they still look flat next to the two painted plates, `assets/level-bg.webp`
(Meadow Road) and `assets/level2-bg.webp` (Button Fork). Attach both. What the painted ones have that the kit doesn't:

- **A frame.** A wooden sewing tray runs round Meadow Road: rim walls, compartments, big spools, a jar of buttons, a
  pincushion, all cropped by the plate edge. Button Fork has the same idea with trays, shears and a tape measure.
- **Hero props.** Things 3–4× bigger than anything in the kit, half off the plate.
- **Road dressing.** Fence posts and rails along the road and round the pads (Meadow Road); a frayed, layered edge
  (Button Fork).
- **Ground variety.** The painted ground changes from place to place; ours is one tile repeated.

Sizes are plate px as before (941 × 1672 for a normal level), delivered at 2× unless a row says otherwise. Some levels
are bigger (`size 1.1` to `1.5`: the plate is that many times wider and taller) and are shown zoomed out, so I may
draw frame pieces and heroes up to 1.5× their plate size there; the 2× delivery covers that.

**Where the frame lives.** The road's centreline stays within plate x 175..766, so frame pieces live in the outer
~150 px of each side and in the top and bottom margins. The road's edge can still swing out to ~110 px from a side and
a Pin pad to ~95 px, so where one comes close I stop the strip with an end cap or step it outward. Roads also run
through the frame (the top entrance, and side entrances on most levels), which is why every rim needs an end cap.
A narrow phone crops about 80 px off each side, so the rim wall itself should sit roughly 60–140 px in from the edge
and still read as a tray lip from a 30–50 px sliver: a lit top edge and a dark inner line. Anything outboard of the
wall (compartments and what's in them) may be cut off.

Extra rules for this round, on top of the ones above:

| | |
|---|---|
| **Tiling strips** | Drawn horizontal. The left and right ends must join seamlessly end to end (put two side by side to check), with no knot, bracket or pin cut in half at an end. I rotate them for the sides and bend the thin ones along curves by slicing them. |
| **Which side is which** | On every strip, the bottom long edge faces the play area (the ground or the road), the top faces out. |
| **Tiles** | New ground and road tiles match the colour, brightness and fibre scale of the `_01` tile they sit beside, so I can mix cells of them with soft masks and no seam shows. Attach the `_01` tile as the reference. |
| **Heroes** | Paint the whole object, uncropped. I crop it at the plate edge. |

### 18. Frame pieces (P1)

One set per zone, 8 files each. Top-down: the top of the wall, with a sliver of its inner face showing on the play
side (soft top-left light as usual, still no cast shadows; I shade the ground beside it).

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Rim wall, straight strip | 2 variants | 512 × 56 | 1024 × 112 | Tiles end to end. |
| Rim outer corner | 1 | 140 × 140 | 280 × 280 | Where two rim walls meet at a plate corner. Separate piece, not tiling. |
| Rim inner corner | 1 | 140 × 140 | 280 × 280 | Where the rim steps inward round a compartment. |
| Rim end cap | 1 | 56 × 80 | 112 × 160 | The wall stops cleanly (a road passes through the gap). I mirror it for the other end. |
| Compartment divider, straight strip | 1 | 256 × 32 | 512 × 64 | Tiles end to end. A thinner wall splitting the outer band into cells. |
| Divider T-joint | 1 | 100 × 100 | 200 × 200 | A divider meeting the rim. |
| Compartment floor | 1 | tile | 1024 × 1024 seamless | The inside of a cell, under the heroes. |

- **Meadow** (`meadow_frame_*`): a wooden sewing tray like Meadow Road's: warm honey wood with visible grain along
  the strip, rounded top edge, small dark nail heads now and then (not at the strip ends). Floor: plain lighter wood.
- **Denim** (`denim_frame_*`): a workbox: dark stained wood with brass corner brackets (on the corners only), and a
  quilted denim lining folded over the top of the wall. Floor: quilted denim, a darker wash than the ground.
- **Lair** (`lair_frame_*`): a velvet-lined case: black lacquered wall, deep purple velvet rolled over its top edge,
  a thin line of tarnished brass beading along the play side. Floor: crushed purple velvet, dark.

### 19. Edge hero props (P1)

The big things that sit in the frame's compartments and hang half off the plate. Our current props are drawn at about
their plate size (a spool ~120 px, a big tree ~220 px); these are drawn 3–4× that, so they're asked for large. Keep
the silhouettes simple and bold, the detail on the side that faces the play area, and no lettering.

**Meadow** (`meadow_hero_*`)

| Item | Count | Plate size (up to) | Deliver at |
|---|---|---|---|
| Thread spool lying on its side, wooden ends (red, blue) | 2 | 480 × 300 | 960 × 600 |
| Thread spool standing, seen end-on (round) (green, yellow) | 2 | 450 × 450 | 900 × 900 |
| Glass jar of buttons, seen from above, no lid (round mouth full of coloured buttons) | 1 | 360 × 360 | 720 × 720 |
| Tomato pincushion with round-headed pins | 1 | 450 × 450 | 900 × 900 |
| Folded fabric stack (blue with white cross-stitch flowers; red gingham) | 2 | 520 × 340 | 1040 × 680 |
| Ball of yarn with two knitting needles through it | 1 | 420 × 420 | 840 × 840 |

**Denim** (`denim_hero_*`)

| Item | Count | Plate size (up to) | Deliver at | Notes |
|---|---|---|---|---|
| Tailor's shears, closed, brass handles | 1 | 700 × 300 | 1400 × 600 | Closed and clearly scenery: much bigger than any player pair, no glow. |
| Tape measure, coiled, tail trailing off | 1 | 460 × 460 | 920 × 920 | Tick marks only, no readable numbers. |
| Round button tin, lid off, full of buttons | 1 | 440 × 440 | 880 × 880 | |
| Rolled bolt of denim with a paper band | 1 | 640 × 300 | 1280 × 600 | Blank band, no text. |
| Wooden spool box with four spools in it | 1 | 500 × 360 | 1000 × 720 | Like Button Fork's top-left tray. |
| Brass thimble, large | 1 | 300 × 300 | 600 × 600 | |

**Lair** (`lair_hero_*`)

| Item | Count | Plate size (up to) | Deliver at | Notes |
|---|---|---|---|---|
| Giant seam ripper (the tool), lying diagonally | 1 | 700 × 160 | 1400 × 320 | Tarnished, red ball on the short prong. |
| Rusty pinking shears, closed | 1 | 640 × 280 | 1280 × 560 | Scenery, like the denim shears. |
| Black velvet pincushion bristling with bent pins | 1 | 440 × 440 | 880 × 880 | |
| Tarnished brass darning mushroom, from above | 1 | 360 × 360 | 720 × 720 | |
| Heap of tangled bobbins and unravelled thread | 1 | 480 × 480 | 960 × 960 | |
| Torn lace doily, flat | 1 | 500 × 500 | 1000 × 1000 | Lies flat under other things, so keep it low. |

### 20. Road kit (P1; the decals and road felts can follow as P2)

Pieces I place along the road by code. The road is ~132 plate px wide (112 of beige felt, a 10 px brown edge each
side).

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Meadow fence post, top-down (round cut top, wood rings, a glimpse of its side) | 3 variants | ⌀ 28 | 56 × 56 | Stands every ~60 px along the road and round the heart pad. |
| Meadow rope link | 2 variants | 64 × 14 | 128 × 28 | A short twisted rope piece, post to post. Its ends overlap the next link by ~8 plate px, so a chain of them follows a curve with no gaps. One slightly sagging. |
| Meadow fence rail (like Meadow Road's) | 2 variants | 64 × 12 | 128 × 24 | Alternative to the rope; same overlap. |
| Denim selvage edge strip | 1 | 256 × 28 | 512 × 56 | Tiles. A clean selvedge band (white with the thin red line) along the road side. |
| Denim frayed edge strip | 1 | 256 × 28 | 512 × 56 | Tiles. Raw denim edge, loose blue and white threads hanging outward. |
| Lair pinned edge strip | 2 variants | 256 × 32 | 512 × 64 | Tiles. A dark velvet ribbon with tarnished pins pushed through every 64 px (4 per strip, none cut by an end), heads outward. |
| Darned patch across the road | 2 variants | 130 × 90 | 260 × 180 | A mended hole, criss-cross darning in a slightly different beige. |
| Boot print pressed into the felt (left, right) | 2 | 34 × 60 | 68 × 120 | |
| Pin dropped on the road | 2 variants | 90 × 14 | 180 × 28 | |
| Chalk arrow pointing along the road | 1 | 70 × 100 | 140 × 200 | Like the one at Button Fork's entrance. |
| Road felt tile | 2 more | tile | 1024 × 1024 seamless | Same beige and weave as `sewing_road_felt_01`: one a little worn and pilled, one with faint quilting lines. |

All the decals sit on the road, so keep them flat and low in contrast (road colours, soft edges). Nothing on the road
may look like an enemy, a critter or a pickup.

### 21. Ground variety (P2)

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Meadow ground tiles | 2 | tile | 1024 × 1024 seamless | `meadow_ground_02` / `_03`: one with more clover and short grass, one with tiny flowers dotted in. |
| Denim ground tiles | 2 | tile | 1024 × 1024 seamless | One a faded lighter wash, one darker and worn. |
| Lair ground tiles | 2 | tile | 1024 × 1024 seamless | One crushed velvet, one with loose frayed threads. |
| Flower bed (meadow) | 3 variants | 220 × 160 | 440 × 320 | A loose cluster of small felt flowers and leaves. |
| Grass tuft (meadow) | 3 variants | 60 × 50 | 120 × 100 | |
| Moss patch (meadow green; lair purple-grey) | 2 | 200 × 150 | 400 × 300 | |
| Button spill (sewing) | 1 | 200 × 150 | 400 × 300 | A small heap of mixed buttons spreading out. |
| Pin scatter (sewing) | 1 | 160 × 120 | 320 × 240 | A few pins lying every which way. |

The clusters lie on the ground rather than stand on it: low and flat, with outer edges that thin out so they melt
into the ground tile. They get scattered many times per level, so avoid one standout detail that repeats visibly.

### 22. Denim zone props: still outstanding (P1)

No new items: section 5 above is still wanted, and there is no `assets/kit/denim/` yet. Levels 7–10 and Endless
are denim and still scatter only the generic sewing props.

### 23. Per-level dressing overlays (P2: hold until I say a level's layout is final)

By default each level is dressed with the sprites above: a list of placements per level (which frame pieces, heroes
and clusters go where), made with tooling I'm building now. That covers every level. The overlay is the premium
option, for a level whose layout is final: one hand-composed painting of that level's frame and heroes, so it looks
as good as Meadow Road.

- **What:** a transparent PNG exactly the size of the level's plate (941 × 1672 times its size; table below), at
  **1× plate size** (like section 16: it's a whole backdrop, and a zoomed-out level shows it smaller than that anyway).
- **How:** I send a reference export of the level from the level lab (road, Pin pads, heart pad, entrances and the
  narrow-phone crop lines drawn in). Paint the frame and heroes over it in that zone's look (sections 18–19), then
  hand back only the paint, on a transparent background.
- **Keep clear:** the road plus ~30 px each side, every Pin pad, the heart pad and every place a road enters. Nothing
  opaque over any of them. Keep the top-left corner calm (the HUD sits there).
- **Hold:** any change to a level's recipe or seed moves its road and the overlay would have to be redone, so wait
  until I mark a level final.

| Level | Id | Name | Zone | Size | Deliver at |
|---|---|---|---|---|---|
| 3 | `hem` | Zigzag Hem | meadow | 1.1 | 1035 × 1839 |
| 4 | `running` | Running Stitch (Seam Ripper boss) | meadow | 1.2 | 1129 × 2006 |
| 5 | `double` | Double Seam | meadow | 1.2 | 1129 × 2006 |
| 6 | `blanket` | Blanket Stitch | meadow | 1.2 | 1129 × 2006 |
| 7 | `loop` | Button Loop | denim | 1.3 | 1223 × 2174 |
| 8 | `hemline` | Hemline (Brute King boss) | denim | 1.3 | 1223 × 2174 |
| 9 | `cross` | Crossroads | denim | 1.3 | 1223 × 2174 |
| 10 | `bias` | Bias Tape | denim | 1.4 | 1317 × 2341 |
| 11 | `selvage` | Selvage | lair | 1.4 | 1317 × 2341 |
| 12 | `whip` | Whipstitch (Unstitcher boss) | lair | 1.5 | 1412 × 2508 |
| 13 | `lair` | Ripper's Lair | lair | 1.5 | 1412 × 2508 |

That's 11 levels. Level 0 (First Snip, the tutorial, 941 × 1672, meadow) could have one too if it's easy; Random
Quilt can't (a new road every run). The three boss levels overlap with section 16 (painted boss plates): whichever
comes first, the other isn't needed for that level.

## Round 3.1: the workshop heart shows the HP

The top-left heart counter goes away; the heart pad at the end of the road shows the damage instead. The game
draws the HP number on it in code, so no digits are needed.

### 24. Heart pad damage stages (P1): delivered

Per zone (`meadow`, `denim`, `lair`), the zone's own heart pad (`assets/kit/09_zone_pads/<zone>_heart_pad_01.png`,
attach it) redrawn in four damage stages. **Same canvas (460 × 460), same heart, same size, same position, same
colours and light** as the attached pad, so the game can swap between them: only the damage changes. Nothing may
stick out further than the undamaged pad's outline. Keep the centre of the heart fairly plain (a number goes there).

- `<zone>_heart_pad_dmg1`: a few loose and missing stitches along the edge, one thread end hanging.
- `<zone>_heart_pad_dmg2`: a torn corner flap, more stitches gone, a small tuft of white stuffing showing.
- `<zone>_heart_pad_dmg3`: a long split along one side with stuffing bulging out, a frayed edge.
- `<zone>_heart_pad_dmg4`: nearly torn in two, held together by one big safety pin, stuffing spilling, threads
  dangling. Still clearly the same heart.

Plus one sheet with no zone (`sewing`), small loose pieces for the hit burst, about 40–80 px each:

- `sewing_stuffing_puff_01..03`: white cotton stuffing tufts, soft and lumpy.
- `sewing_thread_end_01..03`: short curly loose thread ends (one red, one cream, one dark).
- `sewing_stitch_bit_01..02`: a single popped stitch / snipped thread fragment.

## Round 4: the story in the drawer

The game now has a light story (`src/story.js`): every junk drawer that gets junky enough wears thin at the back,
things come through at night made of the drawer's own leftovers, and the household scissors hold the line while the
house sleeps. Nobody ever finds out. Tomato, the tomato pincushion, briefs the player at the start of each level,
and after each boss a note turns up that the humans wrote the next morning. Everything in this round is set
dressing for that: things from a real kitchen junk drawer, at the scissors' scale, so a level reads as "inside the
drawer" without a word. Same rules as round 3 (top-down, felt and fabric, no shadows, magenta background), with
two more:

| | |
|---|---|
| **Scale** | The scissors the player holds are about as long as the plate is wide, so the drawer's junk is big. A real tomato pincushion is 450 plate px across (section 19), so 1 cm ≈ 65 plate px. Sizes below follow that; everything is delivered at 2× as usual. |
| **Material** | The junk is still made of fabric: a battery is a felt tube with a stitched copper cap, a key is cut from grey felt with a running stitch round its edge, paper is cream felt with a pencil line sewn in. No photoreal plastic or metal. |

### 25. Drawer junk, hero size (P2): delivered

Big things that sit in the frame's compartments and hang half off the plate, like section 19's heroes (one object
per image, uncropped, bold silhouette, no lettering). Zone `sewing`: they belong to every drawer. Levels place them
by hand in the level lab's Dress mode (`dressing` in the level file), so no count is wrong.

| Item | Count | Plate size (up to) | Deliver at | Notes |
|---|---|---|---|---|
| AA battery, lying flat | 1 | 330 × 110 | 660 × 220 | Felt tube, stitched copper cap, a stitched + at the other end. No brand. |
| Dead ballpoint pen, cap missing | 1 | 900 × 80 | 1800 × 160 | Long and thin; a plain colour, a tiny bite mark on the end. |
| Rubber band, a loose loop | 2 | 500 × 420 | 1000 × 840 | A thin felt loop that has settled into a wobbly oval; one tan, one red. Mostly empty inside: it will be laid over the ground. |
| Takeout menu, folded, one corner showing | 1 | 1300 × 900 | 2600 × 1800 | A cream felt rectangle with a fold line and a few blank coloured blocks where the dishes would be. No readable text. Hangs well off the plate. |
| House key on a split ring | 1 | 420 × 180 | 840 × 360 | Grey felt, running stitch round the edge, a felt tag on the ring. |
| Chip-bag clip, open | 1 | 520 × 180 | 1040 × 360 | A bright colour; a stitched spring. |
| Birthday candle, used, a bit of wax | 2 | 380 × 60 | 760 × 120 | Striped; a black wick tip. One bent. |
| Loyalty / gift card, face down | 1 | 540 × 340 | 1080 × 680 | Plain colour, a stitched dark stripe along one long edge. No lettering. |

### 26. Drawer junk, small (P2): delivered

Scatter-sized pieces for the ground tiers (`singles` and a `cluster` or two), one sheet, zone `sewing`.

| Item | Count | Plate size | Deliver at |
|---|---|---|---|
| Paperclip (one plain, one bent open) | 2 | 200 × 80 | 400 × 160 |
| Bread clip, the little square tag | 2 | 130 × 110 | 260 × 220 |
| Bottle cap, upside down | 2 | 190 × 190 | 380 × 380 |
| Twist tie, curled | 2 | 300 × 120 | 600 × 240 |
| Loose screw | 3 | 160 × 60 | 320 × 120 |
| Coin | 2 | ⌀ 150 | 300 × 300 |
| Elastic hair tie | 2 | ⌀ 240 | 480 × 480 |
| Cluster: a tangle of rubber bands and twist ties | 1 | 420 × 360 | 840 × 720 |
| Cluster: a spill of coins and screws | 1 | 400 × 300 | 800 × 600 |

### 27. Tomato and the morning note (P2): delivered

The two story pieces the UI draws in CSS and type today.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Tomato, the pincushion: a portrait | 1 × 2 | 240 × 240 | Front view, like the boss portraits (section 11): a round red tomato pincushion with the green felt strawberry on its stalk, a few round-headed pins stuck in at jaunty angles, kind eyes and a small knowing smile stitched on. Two expressions: calm (the level briefing) and amused (the morning note's reply). Shown at about 60 px on the star goals card and the reward card. |
| A note's paper scrap | 3 | 640 × 400 | The paper the humans' morning notes are shown on, blank, for the game to letter in a handwriting face: a yellow sticky note with one curled corner; a torn-off strip of lined paper; the bottom corner of a shopping list with a few blank ticked lines above the empty space. Front view, flat, a soft felt-paper texture. |
| A fridge magnet | 1 | 200 × 200 | Front view: a plain round felt magnet (the sticky note is pinned under it on the card). |

## Round 5: the five worlds (delivered 2 October 2026; cut with tools/sheet-cut.js, imported with tools/kit-import.html)

The map becomes **five worlds of ten levels** (`docs/worlds.md`), each a drawer or box in the house with its own look.
Three of the five are new. Attach the style references in `docs/world-refs/`:

| World | id | Look | Reference |
|---|---|---|---|
| 1 The Sewing Tray | `meadow` | wooden tray, green felt meadow, fenced road | `docs/world-refs/meadow-tray.webp` (and `assets/level-bg.webp`) |
| 2 The Mending Pile | `denim` | quilted denim plate, no tray | `assets/level2-bg.webp` (delivered; nothing new below) |
| 3 The Kitchen Drawer | `autumn` | wooden tray, leaf litter in red, orange and gold, pine cones, pumpkins, toadstools, a satin river with a ruler bridge, a copper mug spilling warm light | `docs/world-refs/autumn.webp` |
| 4 The Bedside Drawer | `night` | wooden tray, deep blue and purple knit ground, lavender, keys, a pencil, lit lanterns, a marble, a crescent moon | `docs/world-refs/night.webp` |
| 5 The Holiday Box | `snow` | wooden tray, white fleece snow, frozen denim ponds, cottages with lit windows, snow-capped fences and trees | `docs/world-refs/snow.webp` |

**What's shared.** Worlds 1, 3, 4 and 5 use the same wooden tray (the meadow frame pieces, delivered), the same fence
posts and rails (delivered) and the same beige road felt (delivered). So a new world needs its ground, its props, its
pads and its light, not a whole kit. World 5 adds snow caps on top of the shared pieces. Sizes are plate px as before
(941 × 1672 for a normal level), delivered at 2×; tiles 1024 × 1024 seamless. The round 3 rules for tiles, strips and
heroes apply.

### 28. Shared pieces (P1): delivered

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Flag post for the heart pad: a fence post with a small red felt pennant | 2 (pennant left, pennant right) | 40 × 70 | 80 × 140 | Stands at the heart pad's two front corners in every tray world (see all three refs). |
| Pad fence ring: a round fence of posts and rails round a Pin pad, open toward the road | 1 | ⌀ 240 | 480 × 480 | One piece; I turn it so the gap faces the road. Matches the fence posts delivered. |
| Pond: a flat irregular puddle of blue quilted denim with a stitched edge | 3 variants | 300 × 220 | 600 × 440 | Lies flat under props (meadow-tray and snow refs). Soft, thinning edges. |
| River strip: a satin ribbon of water, straight | 2 variants | 512 × 120 | 1024 × 240 | Tiles end to end. Brown satin for autumn, blue for snow and night; one of each colour. |
| River bend: a 90° elbow of the same ribbon | 2 (brown, blue) | 300 × 300 | 600 × 600 | |
| Ruler bridge: a wooden school ruler laid across a gap, two posts at each end | 1 | 200 × 130 | 400 × 260 | Crosses the river where the road does (autumn ref). Tick marks only, no numbers. |
| Lantern, lit: a small brass lantern seen from above, warm glow | 2 variants | ⌀ 56 | 112 × 112 | The night ref's lanterns, also used in snow. |
| Lantern glow: a soft round warm light with no lantern in it | 1 | ⌀ 300 | 600 × 600 | A separate additive glow sprite I lay under lit things. Transparent PNG, the glow fading to nothing at the edge. |
| Fence post, snow-capped | 3 variants | ⌀ 28 | 56 × 56 | The delivered posts with a snow cap. |
| Fence rail, snow-capped | 2 variants | 64 × 12 | 128 × 24 | |
| Tray rim, snow-capped | 2 variants | 512 × 56 | 1024 × 112 | The meadow rim strip with snow lying along its top. Tiles end to end. |
| Tray rim end cap, snow-capped | 1 | 56 × 80 | 112 × 160 | |

### 29. World 3, The Kitchen Drawer (`autumn_*`, P1): delivered

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Ground tiles: felt leaf litter | 3 | tile | 1024 × 1024 seamless | `_01` the base: a dense carpet of small red, orange and gold felt leaves on rust felt. `_02` more gold, `_03` more red and brown with twigs. Same brightness so cells of them mix. |
| Pin pad and heart pad | 2 | 340 / 460 | 340 × 340 / 460 × 460 | Like the delivered zone pads: beige felt, a stitched ring, a green felt collar round the heart pad (the ref's pads sit in a ring of green). |
| Heart pad damage stages | 4 | 460 | 460 × 460 | As section 24: the same pad, worse each time. |
| Heroes: felt maple tree with stitched leaves (red, gold) | 2 | 360 × 400 | 720 × 800 | Whole object. |
| Heroes: pumpkin (orange, green) | 2 | 320 × 300 | 640 × 600 | |
| Heroes: honey dipper, copper mug on its side, bottle opener, ball of twine | 4 | up to 480 × 480 | 960 × 960 | The autumn ref's drawer junk, felt and stitched fabric. |
| Clusters: berry bunch, pine cone pile, leaf drift, toadstool pair | 4 | 220 × 160 | 440 × 320 | Low and flat, thinning edges. |
| Singles: pine cone, acorn, toadstool, small pumpkin, gold leaf, red leaf, twig, button (rust) | 8 | 40 to 90 | 2× | |
| Fill: tiny leaves (3 colours), a seed, a berry | 5 | 20 to 36 | 2× | Scattered by the hundred into bare ground. |
| World chest: a copper biscuit tin (locked, ready, open) | 3 | 240 × 200 | 480 × 400 | |
| Map plate: the world's road of ten numbered patches | 1 | 936 × 1681 | 1872 × 3362 | Like `assets/level-map.webp`: a winding road from the bottom up with ten blank felt patches (1 to 10), the fifth and tenth bigger (the mini boss and the boss), in this world's look. Nothing else on the patches. |
| Boss portrait: The Twine Ball (a rolling ball of twine with button eyes, loose ends like arms) | 1 | 600 × 600 | 600 × 600 | Front view, as section 11. |
| Mini boss portrait: The Honey Dipper (a wooden honey dipper dripping, sly face) | 1 | 600 × 600 | 600 × 600 | |

### 30. World 4, The Bedside Drawer (`night_*`, P1): delivered

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Ground tiles: knitted dark ground | 3 | tile | 1024 × 1024 seamless | `_01` deep navy knit with purple and teal patches, `_02` more purple, `_03` darker with tiny stitched stars. Dark, but readable: enemies must stand out on it. |
| Pin pad and heart pad, plus 4 damage stages | 2 + 4 | 340 / 460 | as above | Beige felt pads with a lavender felt collar. |
| Heroes: lavender bush (purple felt tufts), two sizes | 2 | 300 × 340 | 600 × 680 | |
| Heroes: brass key, pencil stub, cookie cutter (star), clothespin, measuring spoon, crescent moon ornament | 6 | up to 480 × 480 | 960 × 960 | The night ref's junk, felt and stitched fabric. |
| Clusters: lavender bed, berry sprig, pebble pile, lantern pair | 4 | 220 × 160 | 440 × 320 | |
| Singles: marble (glass, blue), paperclip, bottle cap, pebble, small key, small toadstool (red), button (navy), moth (resting, wings flat) | 8 | 40 to 90 | 2× | |
| Fill: tiny lavender sprigs, pebbles, stitched stars | 5 | 20 to 36 | 2× | |
| World chest: a velvet jewellery box with a tiny clasp (locked, ready, open) | 3 | 240 × 200 | 480 × 400 | |
| Map plate | 1 | 936 × 1681 | 1872 × 3362 | As section 29, in this world's look (lanterns lit along the road). |
| Boss portrait: The Skeleton Key (a tarnished brass key with a grinning bit, a ring of smaller keys) | 1 | 600 × 600 | 600 × 600 | |
| Mini boss portrait: The Bottle Cap (a dented bottle cap, teeth bared) | 1 | 600 × 600 | 600 × 600 | |

### 31. World 5, The Holiday Box (`snow_*`, P1): delivered

| Item | Count | Plate size | Deliver at | Notes |
|---|---|---|---|---|
| Ground tiles: white fleece snow | 3 | tile | 1024 × 1024 seamless | `_01` plain fleece with soft drifts, `_02` with a few stitched snowflakes, `_03` with glimpses of blue denim showing through. |
| Pin pad and heart pad, plus 4 damage stages | 2 + 4 | 340 / 460 | as above | Beige felt pads with a snow collar. |
| Heroes: snowy fir tree (two sizes), snowy bare tree | 3 | 300 × 420 | 600 × 840 | |
| Heroes: felt cottage with lit windows (two), a cork sled, a star ornament, a white thread spool | 5 | up to 480 × 480 | 960 × 960 | |
| Clusters: snow-covered pebbles, red berry sprig, a drift with footprints, a tinsel tangle | 4 | 220 × 160 | 440 × 320 | |
| Singles: snowball, icicle, bauble (red, blue), candy cane, bell, pine sprig, button (white) | 8 | 40 to 90 | 2× | |
| Fill: snow lumps, berries, tiny stars | 5 | 20 to 36 | 2× | |
| Window glow: a soft warm rectangle of light | 1 | 120 × 100 | 240 × 200 | Additive, like the lantern glow. |
| World chest: a cardboard holiday box with a ribbon (locked, ready, open) | 3 | 240 × 200 | 480 × 400 | |
| Map plate | 1 | 936 × 1681 | 1872 × 3362 | As section 29, in this world's look. |
| Mini boss portrait: The Snow Globe (a glass globe with a tiny cottage, shaking) | 1 | 600 × 600 | 600 × 600 | The Unstitcher's portrait is delivered. |

### 32. World 1 and 2 map plates and mini bosses (P2): delivered

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Map plate, world 1: eleven patches (0 to 10) | 1 | 1872 × 3362 | The delivered map has fourteen; I use its first eleven until this one comes. |
| Map plate, world 2: ten patches in the quilt look | 1 | 1872 × 3362 | |
| Mini boss portraits: The Bobbin (a wooden bobbin trailing thread, grumpy), The Zipper (a zipper pull with a toothy grin) | 2 | 600 × 600 | |
| World chest, worlds 1 and 2 | delivered | | |

### 33. New enemies and Pins (P3)

Superseded by section 45 (round 6).

The Leaf, Burr, Moth, Snowball and Icicle and the Cork, Lamp and Candle Pins are drawn in code like the others
(section 12 covers sprites for all of them later). The three new pairs (Kitchen Shears, Stork Snips, Ribbon Shears)
are SVG, as section 17.

## Round 6: menus that match the title, and everything still faked

The title screen is painted art; nearly every other screen is CSS felt standing in for art (panels, buttons, tabs, chips,
headings, the HUD, the boss bar), and some things are worse than stand-ins: the five Skills' badges are **emoji**
(⏳ 🛡 ✚ 〰 ⋯), six trophies have no badge, and every enemy and Pin is drawn in code. This round asks for all of it, so
the menus, worlds and play read as one hand-made object. Two style references are in `docs/ui-refs/`:
`button-style.webp` (the title's painted buttons: what every button and panel should match) and `icon-style.webp` (the
round 2 icons, delivered: what every new icon should match). Attach both to every UI sheet.

**Delivered but not wired in yet** (no need to ask again; I wire these first): the pause, resume, home, back, retry,
copy, mail and SHRED icons (`07_icons`), the "you are here" pin and the star strip (`06_markers`), the currency heap.

### Why no felt alphabet

I thought about it and it's the wrong buy. An image generator won't keep 40-odd letters at one cap height, stroke
weight, stitch spacing and baseline across a sheet, and every miss shows the moment two letters sit side by side. A
bitmap alphabet also can't kern, wrap, be read by a screen reader or carry other languages, and it gives nothing
Lilita One with the CSS felt fill doesn't already give body text. Felt lettering only pays off where the words are
**fixed** (screen titles, banner words: baked as whole words below, so the letters are drawn together and agree) or
where the text is **only digits** (ten glyphs, short, the most-seen text in the game: section 37). Everything else stays
in the font.

### Rules for round 6 (on top of the rules for every file)

| | |
|---|---|
| **View** | Front view, flat felt appliqué with stitched edges, like `icon-style.webp`. Soft light from the top-left, no cast or drop shadows (I add them). The game sprites in section 45 stay top-down. |
| **Size** | UI shows on phones at about 3 device pixels per CSS pixel, so deliver UI pieces at **3× the CSS size** given (round 5 came at a quarter of the asked size; bigger is always fine, I scale down). |
| **9-slice pieces** | Marked 9S. They stretch to any size, so: the same edge all the way round (same rim thickness, same stitch distance from the edge on all four sides, four identical corners), the middle plain and evenly lit with no gradient in one direction, no lettering, no icon. I measure the slice lines myself. |
| **Colours** | The title's felts: green (PLAY), rust (UPGRADES), denim blue (SHOP), purple (HOW TO PLAY), plus gold (buy, reward), grey (locked, disabled) and dark brown (chips, wells). Gold running stitch on the colours, cream stitch on brown and grey. |
| **States** | Normal and pressed for anything you tap: pressed = the same piece sunk a little (the lip under it gone, a touch darker), on the same canvas in the same spot. |
| **Lettering** | Only where an item says "baked". Baked words are puffy stitched felt letters like the logo's (`assets/title-bg.webp`), every word on its own transparent canvas, not cropped. |

### 34. Button blanks, 9S (P1)

The core of the round: replaces `.felt-btn` everywhere (START, RESUME, NEXT LEVEL, BACK, Buy, Upgrade, Sharpen, the
Settings rows, the map's tiles).

| Item | Count | Shown at (CSS) | Deliver at | Notes |
|---|---|---|---|---|
| Wide button | 7 felts × 2 states | 300 × 64 | 900 × 192 | Green, rust, blue, purple, gold, grey, red (the one "are you sure" button: Wipe save). Thin near-black edge, a darker bevel band just inside it, gold stitch about 18 px (at 900 wide) in from the edge, corners about 40 px round, a shallow lip under the bottom edge. Exactly the title buttons without their icon and words. |
| Small button | 7 felts × 2 states | 140 × 40 | 420 × 120 | Same, with a thinner rim and the stitch closer to the edge, so it doesn't crowd the words at small sizes (that crowding is why the current small buttons look cheap). |
| Square icon tile | 5 felts (rust, blue, purple, dark brown, grey) × 2 states | 58 × 58 | 180 × 180 | The pause button and the map's Sewing Box / Shop / Trophies tiles. Rounded square, as the title's gear and sound tiles. |
| Round icon tile | 3 felts (rust, dark brown, grey) × 2 states | 46 × 46 | 140 × 140 | The map's ‹ › arrows, close buttons, the tutorial's skip arrow. |
| Pill chip | dark brown, gold | 90 × 36 | 270 × 108 | The Buttons balance, the thread counter, goal pills, the star count on a chest. Not tappable, one state. |

### 35. Panels and frames, 9S (P1)

Replaces `.card` and the pieces inside it on every overlay (Shop, Sewing Box, Trophies, weapon screen, Settings,
pause, results, Pin explainer, reward cards, feedback, leaderboard).

| Item | Count | Shown at (CSS) | Deliver at | Notes |
|---|---|---|---|---|
| Card panel | 2 (brown felt; cream linen for the notes, the credits and the feedback card) | 360 × 520 | 1080 × 1560 | A thick stitched felt panel like a sewn-on patch: dark edge, cream running stitch about 40 px in. Plain middle. |
| Sunken well | 1 | 300 × 120 | 900 × 360 | A pressed-in slot of darker felt (the stats on pause and results, the tab bar's groove, the sharpness track's bed). |
| List row | 3 (plain, gold-stitched "on sale / equipped / selected", grey "locked") | 320 × 90 | 960 × 270 | Shop, Sewing Box and Trophies rows, the Pin picker's cards, Settings' Hold / Pinch cards. A lighter felt than the panel so rows read on it. |
| Tab | 2 (selected: raised gold; unselected: flat, darker) | 100 × 40 | 300 × 120 | Sits in the sunken well. |
| Text field | 1 | 280 × 48 | 840 × 144 | Cream felt sunk into the panel (the leaderboard name, the feedback box). |
| Tip bubble | 1 body (9S) + 2 tails (pointing down, pointing up) | 220 × 70 | 660 × 210, tail 90 × 60 | Cream felt speech bubble with a dark stitch (the in-game tips; the toast reuses the body). The tail is a separate sprite that tucks under the body. |
| Weapon card frame | 3 (normal, selected with a gold stitch and a soft glow, locked grey) | 100 × 130 | 300 × 390 | The strip of pairs on the weapon screen. |
| Tag | 4 felts (gold, red, green, purple) | 60 × 22 | 180 × 66 | A small stitched label for NEW, NEW HERE, EQUIPPED, EASY, PRO (words in the font over it). A little ribbon tail at the left end. |

### 36. Heading banners and baked words (P1 headings, P2 the in-game words)

| Item | Count | Shown at (CSS) | Deliver at | Notes |
|---|---|---|---|---|
| Ribbon banner, 9S across | 4 (gold, green for a win, red for a loss, blue) | 300 × 72 | 900 × 216 | A felt ribbon with folded tails at both ends that sits over a card's top edge, as the current headings do. Stretches in the middle only; the tails stay whole. |
| Screen titles, baked | 15 words | 40 to 54 tall | 160 px letter height | SHOP, SEWING BOX, TROPHIES, SETTINGS, PAUSED, CHOOSE YOUR SHEARS, LEADERBOARD, FEEDBACK, YOUR NAME, NEW PIN, NEW PINS, BUILDING PINS, DRAWER DEFENDED!, WORKSHOP OVERRUN, SURVIVED. Gold felt (the logo's BATTLE) for the first eleven and SURVIVED; green for DRAWER DEFENDED!, red for WORKSHOP OVERRUN. "SURVIVED 12 WAVES" is SURVIVED + section 37's digits + WAVES from below. |
| In-game words, baked | 19 | 28 to 60 tall | 160 px letter height | SNIP!, nick (small, lower case), CLANG!, SHIELDED!, SPIKES!, LIT!, CRACK!, MULTI, GUST!, SHRED, FOCUS, THIMBLE, MARKED, PINKING, BASTED, WAVE, WAVES, CLEARED, BOSS. These pop over the board many times a minute and are canvas text today. Each in a colour that says what it is: cream (SNIP!), steel grey (CLANG!), gold (LIT!), purple (SHRED), the Skill's felt for its word (Focus blue #3f6fc4, Thimble brass #b8862a, Mark purple #7a4fc9, Pinking pink #c2357a, Basting green #2e8a6a). |

### 37. Felt numerals (P1)

| Item | Count | Shown at (CSS) | Deliver at | Notes |
|---|---|---|---|---|
| Digits 0 to 9, and + / × % ∞ − : | 17 glyphs × 2 colourways | 16 to 48 tall | each on its own 160 × 200 canvas | Cream felt with a dark outline (on any felt) and gold felt (scores, Buttons). **One sheet per colourway, all glyphs the same height, sitting on the same baseline, the same stroke and stitch.** Used for the map's patch numbers, the HP on the heart pad, the wave badge (3 / 6), the results tally and the Buttons balance. Damage numbers stay in the font (too many, too small). |

### 38. Icons (P1)

Front view, felt appliqué, matching `icon-style.webp` exactly (cream stitch, 2 to 3 colours, the same chunky outline).
Each on its own canvas, centred with room round it.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Gear, sound on, sound off, vibration (a buzzing phone) | 4 | 192 × 192 | The title and Settings. |
| Sewing box (a wooden box with a handle), shop cart, trophy cup, map (a folded map with a stitched path), leaderboard (a three-step podium), dice (the random name), close ×, plus +, info i, chevron left, chevron right | 11 | 192 × 192 | The map's top row, the leaderboard, the + on Pin spots, the arrows. The cart should match the one on the title's SHOP button. |
| Endless (a quilt square of four patches) | 1 | 192 × 192 | The title's ENDLESS tile; today a CSS conic gradient. |
| Upgrade (two gold chevrons, like the title's UPGRADES), sharpen (a whetstone with a spark), equip (a tick on a coat hanger) | 3 | 192 × 192 | The Sewing Box's three actions. |
| Rank-up II and III (gold chevron stripes, two and three) | 2 | 128 × 128 | The gold button on a built Pin. |
| Stats: reach (a ruler), spread (an open fan / angle), power (a fist or anvil), speed (a running shoe) | 4 | 128 × 128 | The weapon card's stat rows. |
| Run stats: wave (a pennant), kills (a snipped-in-half scrap doll), accuracy (a target), score (a rosette), clock | 5 | 128 × 128 | Pause and results cards. |
| Controls: one finger holding (Hold), two fingers pinching (Pinch) | 2 | 192 × 192 | Settings' two control cards. Friendly glove hands like the tutorial glove (`10_characters`). |

### 39. Move and Pin badges (P1: the Skills are emoji today)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Skill icons | 5 | 192 × 192 | Tailor's Focus (an hourglass whose bulbs are thread spools), Thimble Guard (a brass thimble with a stitched shine), Seam Mark (a triangle of blue tailor's chalk drawing an X), Pinking Cut (pinking shears with a zigzag cut line), Basting Stitch (a needle trailing a long running stitch). Same family as the delivered SHRED icon. |
| Move badge blank | 1 | 192 × 192 | A round felt badge with a sunken groove round its rim (the charge ring fills the groove in code) and a plain middle for the icon. Neutral grey felt: I tint it to each move's colour. |
| Pin icons, front view | 7 | 192 × 192 | Needle (a darning needle through a spool), Ice (a frost crystal), Fire (a match head with a felt flame), Magnet (a red horseshoe magnet), Cork (a wine cork), Lamp (a warm light bulb), Candle (a striped birthday candle, lit). For the Pin picker, the Sewing Box's Pins tab and the Pin explainer (SVG today). |

### 40. Title, exported (P1; supersedes section 2)

The title still crops its buttons out of `assets/title-mock.webp`, and the slots have moved since: the Shop sits where
Upgrades was and ENDLESS is a CSS stand-in under it.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| PLAY | 2 states | 1580 × 580 | Lettering baked, exactly as the mock. |
| SHOP, ENDLESS, HOW TO PLAY | 3 × 2 states, plus ENDLESS locked (greyed, a small padlock tag hanging off it) | 1100 × 296 | ENDLESS in the rust felt (the old UPGRADES tile's), with the quilt-square icon of section 38. |
| Gear, sound on, sound off tiles | 3 × 2 states | 270 × 240 | As the mock's top-right tiles. |
| DEMO sticker | 1 | 600 × 260 | A red felt sticker slapped on at an angle, "DEMO" baked. Today it's CSS. |
| The logo alone | 1 | 2200 × 1500 | BATTLE SCISSORS with its banner, on transparency, for a loading screen and the landscape layout. |

### 41. Map dressing (P2)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| World name plaques, baked | 5 | 900 × 220 | The world's name in felt letters on a plaque of its own material: The Sewing Tray (a wooden sign with a green felt inlay), The Mending Pile (a leather jeans label), The Kitchen Drawer (a copper biscuit-tin lid), The Bedside Drawer (a navy velvet tag with a brass rim), The Holiday Box (a gift tag on red ribbon). Replaces the brown CSS banner over the map. I grey a locked one in code. |
| Boss medallion rings | 2 (gold for the bosses, silver for the mini bosses) | 300 × 300 | An empty round stitched frame; I clip the boss's portrait into it and stand it on patch 5 / 10, so the map shows who waits there. |
| Locked world cover | 1 | 1872 × 3362 | A loose sheet of pale muslin thrown over a map plate, pinned at the corners, a brass padlock tag in the middle; mostly translucent so the world shows faintly through. |
| Cleared patch stamp | 1 | 240 × 200 | A cross-stitched X or tick sewn over the patch's felt, low contrast, so cleared levels read at a glance without covering the number. |

### 42. Screen scenes (P2)

Every overlay today is a brown card over the blurred game. These give the main screens a place in the house. Portrait
941 × 1672 at 1:1 (they're backdrops, like the title plate), with a plain area in the middle where the card's list sits.

| Item | Count | Notes |
|---|---|---|
| The Sewing Box, open | 1 | Seen from above: a wooden sewing box, lid up at the top, its lift-out tray of compartments filling the frame; the list scrolls over the felt-lined middle. |
| The Shop | 1 | A haberdashery counter: a striped awning across the top, shelves of spools and pairs on hooks down the sides, an empty felt counter top in the middle. |
| Trophies | 1 | A cork board in a felt-wrapped frame; the badges are pinned to it in code. |
| The weapon screen | 1 | A cutting mat (green, with a faint grid) with the pairs' strip along the bottom edge. |

### 43. Results and rewards (P2)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Win rosette | 1 | 600 × 700 | A prize rosette (gold felt petals, two ribbon tails) to sit behind the results' stars. |
| Loss patch | 1 | 600 × 600 | A torn felt heart patch with a safety pin, for WORKSHOP OVERRUN. |
| Reward sunburst | 1 | 1200 × 1200 | Felt rays in alternating cream and gold, from a plain middle; spins slowly behind new scissors' and chest cards (CSS rays today). |
| Confetti | 8 shapes | 80 × 80 each | Felt bits: a button, a star, a heart, a snip of ribbon, a bow, a pom-pom, two thread curls. Thrown on a win. |

### 44. In-game HUD (P2)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Wave badge | 1 (9S) | 300 × 240 | A felt pennant or a stitched shield for "LEVEL 1-4 / WAVE 1/4" at the top left (blue CSS felt today). |
| Boss HP bar | frame (9S across) + fill strip + empty strip | 1200 × 120 | A stitched felt track with a padded end at each side, the fill a strip of red felt that tiles across, the empty part darker. With a small name plate (9S) for the boss's name. |
| Pin spot + button | 2 states | 160 × 160 | A gold felt + on a round tile, for building on an empty pad (CSS today). |
| Entry warning arrow | 1 | 200 × 200 | A chalk arrow with a "!" for where the next enemy comes in (drawn in code today). |
| Thimble on the heart | 1 | 300 × 300 | The brass cap Thimble Guard puts over the heart pad, top-down. |

### 45. Game sprites (P2 for worlds 1 and 2, P3 the rest; supersedes sections 12 and 33)

Top-down, 2× plate size, two waddle frames each, plus a white silhouette for the hit flash if easy. **Deliver each
enemy in two layers on matching canvases: the body, and its patches alone,** so code can recolour the patches for
ranks 2 and 3 (`CONFIG.enemyRanks.colors`) instead of needing three of everything.

| Item | Count | Notes |
|---|---|---|
| Enemies, worlds 1 and 2 (P2) | Scrap, Runner, Bolster, Brute (plus its thimble helmet as its own sprite), Button Beetle | The plush ragdolls of `enemyArt.js`: felt egg body, stubby arms, patches, cross-stitched seams, button eyes. |
| Enemies, worlds 3 to 5 (P3) | Leaf, Burr, Moth (wings up / down, and its shadow), Snowball (one size, scaled in code), Icicle | |
| Mini bosses (P3) | Bobbin, Zipper (and one tooth), Honey Dipper, Bottle Cap, Snow Globe | Top-down versions of the delivered portraits. |
| Bosses (P3) | Seam Ripper (seam closed / open), Brute King (helmet on / off), Twine Ball, Skeleton Key (teeth closed / open), The Unstitcher (its three phases) | |
| Pins (P2: Needle, Ice; P3 the other five) | 7 types × 3 ranks | Top-down felt cushion with the charm on a post, the code art's look: rank II adds two pins and a wider flag, rank III two gold-headed pins and a gold stripe on the flag. Plus the Needle in flight, the Cork trap pressed flat, a snow cap for a snowed-under Pin. |
| Effects (P3) | Fire on felt (4-frame loop), frost ring, magnet ring, lamp light ring, candle melt drips, Basting's stitch line (a strip that tiles), Mark's chalk X, Pinking's zigzag trail, the ribbon curl, the shield bubble, a twine wrap and a honey drip overlay, dazed stars, gust wind streaks | Rings 512 × 512, mostly clear in the middle. |

### 46. Trophies and swatches still missing (P1)

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Achievement badges | 6 | 256 × 256 | Drawer Swept, Lights Out, Box Packed Away (clear worlds 3 to 5), Golden Harvest, Golden Hour, Golden Snow (three-star them). Same round embroidered patch as the delivered sixteen. World 5 borrows the old Lair's badges today. |
| Cosmetic swatches | 3 | 160 × 160 | Copper Glow, Lantern Glow, Frost Handles (the chest rewards of worlds 3 to 5). |

### Still outstanding from round 5

The river and snow rim strips with seamless ends, the three new worlds' heroes at full size, and the night fill
pieces at fill size (see the round 5 notes at the end).

### Order of work

One sheet per row, roughly in this order; the first five fix what players see on every screen.

1. Section 34 (buttons) and 35 (panels): one sheet per felt colour.
2. Section 39 (Skill and Pin icons) and 46 (badges, swatches): the emoji and the blanks.
3. Section 38 (icons), with `icon-style.webp` attached.
4. Section 37 (numerals): one sheet per colourway.
5. Section 36 (banners and words) and 40 (title).
6. Sections 41 to 44.
7. Section 45.

About 330 pieces in all, most of them small. Not in this round, on purpose: a felt alphabet (above), level names and
body text (the font), damage numbers (the font), weapon thumbnails (drawn from the weapon SVGs).

## Prompt to copy (one sheet per section)

> Sprite sheet, straight top-down orthographic view, felt and fabric craft style matching the attached image, soft
> light from the top-left, no shadows, objects spaced well apart on a flat #FF00FF magenta background, no magenta in
> the objects: **[paste one section's list here]**

For UI icons:

> Game UI icon set, front view, flat felt appliqué with stitched edges, 2–3 colours each, matching the attached
> image, each icon centred with space around it on a flat #FF00FF magenta background: **[list]**

For textures:

> Seamless tileable texture, 1024×1024, top-down, flat even lighting, no vignette, no objects: **[texture]**, felt
> craft style matching the attached image.

Round 3 (attach `assets/level-bg.webp` and `assets/level2-bg.webp` to each):

For frame pieces (section 18, one zone per sheet):

> Game art kit for a sewing-tray frame, straight top-down orthographic view, felt and fabric craft style matching the
> attached images, soft light from the top-left, no shadows. Straight pieces are drawn horizontal and tile seamlessly
> end to end, with nothing cut in half at their ends; the bottom long edge faces inward. Pieces spaced well apart on a
> flat #FF00FF magenta background, no magenta in the objects: **[the zone's frame description + section 18's list]**

For hero props (section 19, one object per image):

> One large object, straight top-down orthographic view, felt and fabric craft style matching the attached images,
> soft light from the top-left, no shadows, the whole object uncropped and filling most of the canvas, bold simple
> silhouette with rich detail, no lettering, centred on a flat #FF00FF magenta background, no magenta in the object:
> **[item]**

For the road kit (section 20; the strips as in the frame prompt, the rest as a sheet):

> Sprite sheet of small road dressing pieces, straight top-down orthographic view, felt and fabric craft style
> matching the attached images, soft light from the top-left, no shadows. Decals are flat and low in contrast, in the
> colours of a beige felt road. Objects spaced well apart on a flat #FF00FF magenta background, no magenta in the
> objects: **[section 20's list]**

For the new ground and road tiles (sections 20 and 21):

> Seamless tileable texture, 1024×1024, top-down, flat even lighting, no vignette, no objects: **[texture]**, felt
> craft style, exactly the same colour, brightness and fibre scale as the attached tile, so the two can be blended.

For ground clusters (section 21):

> Sprite sheet, straight top-down orthographic view, felt and fabric craft style matching the attached images, soft
> light from the top-left, no shadows, flat low clusters whose outer edges thin out, objects spaced well apart on a
> flat #FF00FF magenta background, no magenta in the objects: **[section 21's cluster list]**

For a level overlay (section 23, only once I've sent that level's export and marked it final):

> Paint over the attached level image, straight top-down orthographic view, felt and fabric craft style matching the
> attached painted levels: a **[zone]** frame round the edges (**[section 18's description]**) with large hero props
> half off the edges. Leave the road, the round pads, the heart pad and every road entrance completely untouched,
> with a margin. Output only the added painting on a transparent background, exactly **[w × h]** px.

Round 3.1 (section 24):

For the heart pad stages (one zone at a time; attach that zone's heart pad and `assets/level2-bg.webp`):

> Redraw the attached heart pad four times, as four separate 460×460 images, straight top-down orthographic view, felt
> and fabric craft style. Keep the exact same heart, size, position on the canvas, colours and top-left light in
> all four; only add damage, getting worse each time, and nothing may stick out past the original outline. Keep the
> middle of the heart fairly plain. No shadows, flat #FF00FF magenta background, no magenta in the object.
> 1: a few loose and missing stitches, one hanging thread. 2: a torn corner flap, more stitches gone, a small tuft
> of white stuffing. 3: a long split down one side with stuffing bulging out, frayed edge. 4: nearly torn in two,
> held by one big safety pin, stuffing spilling, threads dangling.

For the hit-burst pieces:

> Sprite sheet, straight top-down orthographic view, felt and fabric craft style matching the attached image, soft
> light from the top-left, no shadows, objects spaced well apart on a flat #FF00FF magenta background, no magenta in
> the objects: three white cotton stuffing tufts, three short curly loose thread ends (red, cream, dark brown), two
> single popped stitches / snipped thread fragments. Each about 60 px.

Round 4 (attach `assets/level-bg.webp` and `assets/level2-bg.webp`; for section 27 attach `assets/title-bg.webp`):

For the hero-size junk (section 25, one object per image):

> One large object from a kitchen junk drawer, straight top-down orthographic view, made entirely of felt and
> stitched fabric in the craft style of the attached images (no real plastic, metal or paper textures), soft light
> from the top-left, no shadows, the whole object uncropped and filling most of the canvas, bold simple silhouette,
> no lettering, centred on a flat #FF00FF magenta background, no magenta in the object: **[item]**

For the small junk (section 26):

> Sprite sheet of small kitchen junk drawer things, straight top-down orthographic view, each made of felt and
> stitched fabric in the craft style of the attached images, soft light from the top-left, no shadows, no lettering,
> objects spaced well apart on a flat #FF00FF magenta background, no magenta in the objects: **[section 26's list]**

For Tomato and the note (section 27):

> Game UI art, front view, flat felt appliqué with stitched edges in the style of the attached image, soft light
> from the top-left, no shadows, each piece centred with space around it on a flat #FF00FF magenta background, no
> magenta in the pieces: **[section 27's list]**

Drop the files in `assets/kit/incoming/` and tell me. I'll cut them out, convert them to WebP, measure them and wire
them in.

Round 5 (attach the world's reference from `docs/world-refs/` and `assets/level-bg.webp`; one world per session so the
palette holds):

For a world's ground tiles (section 29 to 31, one tile per image):

> Seamless tiling texture, 1024×1024, straight top-down orthographic view, felt and stitched fabric craft style
> matching the attached image, soft even light with no shadows and no vignette, the pattern repeating cleanly across
> all four edges with no visible seam: **[tile description]**

For a world's pads (attach the delivered `meadow_pin_pad_01.png` as well):

> Redraw the attached round pad in the style of the attached world reference: the same size, position and stitched
> ring, with **[the collar: a ring of green felt leaves / lavender felt tufts / soft white snow]** round its outside
> edge. Straight top-down, no shadows, flat #FF00FF magenta background, no magenta in the object.

For a world's heroes (one object per image):

> One large object, straight top-down orthographic view, made entirely of felt and stitched fabric in the craft style
> of the attached images (no real wood, metal, glass or paper textures), soft light from the top-left, no shadows,
> the whole object uncropped and filling most of the canvas, bold simple silhouette, no lettering, centred on a flat
> #FF00FF magenta background, no magenta in the object: **[item]**

For a world's clusters, singles and fill (one sheet each):

> Sprite sheet, straight top-down orthographic view, felt and stitched fabric craft style matching the attached
> images, soft light from the top-left, no shadows, objects spaced well apart on a flat #FF00FF magenta background,
> no magenta in the objects: **[the section's list]**. The clusters lie low and flat with edges that thin out.

For a map plate (attach `assets/level-map.webp` and the world reference):

> A game level map, portrait 1872×3362, straight top-down view, in the felt and stitched fabric craft style of the
> attached world image: a winding felt road from the bottom of the picture to the top, with ten round blank felt
> patches sitting on it at even spacing, numbered nowhere (I add the numbers), the fifth and tenth patches larger
> than the rest. The ground, props and lighting of the attached world image fill the rest. No lettering, no
> characters, no scissors.

For a boss or mini boss portrait (attach `assets/title-bg.webp` and a delivered portrait):

> Game character portrait, front view, 600×600, a felt and stitched fabric creature in the craft style of the attached
> images, soft light from the top-left, no shadows, centred with space around it on a flat #FF00FF magenta background,
> no magenta in the character: **[description from the section]**

Round 6 (attach `docs/ui-refs/button-style.webp` and `docs/ui-refs/icon-style.webp` to every UI sheet):

For the 9-slice blanks (sections 34, 35, 44; one felt colour per sheet):

> Game UI kit, front view, flat felt appliqué with stitched edges in the style of the attached button image, soft light
> from the top-left, no shadows, no lettering, no icons. Every piece has the same rim all the way round: identical
> corners, the stitch the same distance from the edge on all four sides, and a plain, evenly lit middle with no
> gradient, so it can be stretched as a 9-slice. Pieces spaced well apart on a flat #FF00FF magenta background, no
> magenta in the pieces: **[the list, with each piece's colour and size]**

For the baked words (section 36) and the numerals (37):

> Game title lettering, front view, puffy stitched felt letters exactly in the style of the attached logo, soft light
> from the top-left, no shadows. Each word (or glyph) on its own, uncropped, spaced well apart, all the same letter
> height, sitting on the same baseline, the same stroke width and stitch; a flat #FF00FF magenta background, no
> magenta in the letters: **[the words or glyphs, and the felt colour]**

For the icons (sections 38, 39):

> Game UI icon set, front view, flat felt appliqué with cream stitched edges, 2 to 3 colours each, exactly matching the
> attached icon sheet (the same outline weight, stitch and light), each icon centred with space around it on a flat
> #FF00FF magenta background, no magenta in the icons: **[the list]**

For a screen scene (section 42; attach `assets/title-bg.webp`):

> A game screen backdrop, portrait 941×1672, straight top-down view, in the felt and stitched fabric craft style of the
> attached image: **[the scene]**. Leave a plain, evenly lit area in the middle (about 640×1000) for a menu to sit
> on; the detail lives round the edges. No lettering, no characters.

### Round 5 notes (what came back, 2 October 2026)

Delivered as sheets (one PNG per section) rather than single files, at about a quarter of the asked 2× size (a
pumpkin hero 181 px, a cottage 217 px, the maple crowns 636 px). `tools/sheet-cut.js` cut them (connected blobs,
magenta keying for the snow sheets, fixed canvases for the pads and portraits) into `assets/kit/incoming/` and
`tools/kit-import.html` measured and converted them; the painter's scale ranges make up the size. Still wanted from
this round: the river and snow rim strips with seamless ends (the delivered ones have rounded ends), heroes at full
size for the three new worlds, and the night fill pieces at fill size (the lavender sprigs came at single size).
