# Sprite wishlist, round 2

Round 1 (the level-generator kit: fixed pieces, textures, sewing / meadow / lair props, map stars) is delivered and
lives in `assets/kit/`. This round covers what the game still fakes in code or with stand-ins, what the playtests
turned up, and things we'll want later. Level plates are 941 × 1672 px ("plate px") and show at about 1:1 on a phone,
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

The title buttons are cropped out of the mock (`assets/title-mock.webp`) as a stand-in.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Big felt buttons: PLAY, HOW TO PLAY, UPGRADES, SHOP | 4 × 2 states | 730 × 196 | Normal and pressed (pressed = sunk a little, slightly darker). Lettering baked in, Lilita One style. |
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

Replacements for the procedural art in `enemyArt.js` / `towerArt.js`. Top-down, each on its own canvas.

| Item | Count | Deliver at | Notes |
|---|---|---|---|
| Enemies: Scrap, Runner, Bolster, Brute, Button Beetle | 5 × 2 frames (waddle) | 2× their size (Scrap ⌀ 60 → 120, Brute ⌀ 110 → 220) | Plus a white silhouette of each for the hit flash, if easy. |
| Bosses: Seam Ripper (seam closed / open), Brute King (armored / armor down), The Unstitcher (3 phases) | 7 | 320 × 320 | |
| Pins: Needle, Ice, Fire, Magnet | 4 | 300 × 300 | Felt cushion base with the charm on a post, like the current code art. |
| Pin upgrade looks (future: a second tier per Pin) | 4 | 300 × 300 | Same Pin, fancier: gold trim, a second charm. |

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

Drop the files in `assets/kit/incoming/` and tell me. I'll cut them out, convert them to WebP, measure them and wire
them in.
