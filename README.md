# Battle Scissors

A 2D mobile canvas game prototype built around one mechanic: your fingers work a pair of scissors that snip whatever sits between the blades. Plush ragdoll enemies walk a road toward your workshop; you snip them, build Pins on the pads beside the road, and bank kills for SHRED, a spinning special. The map is five worlds of ten levels, each a drawer or box in the house with its own look (the sewing tray, the mending pile, the kitchen drawer in autumn, the bedside drawer at night, the holiday box), its own enemy, Pin and Skill, a mini boss on level 5 and the drawer's tool gone bad as the boss on level 10, which opens the next world. The tools arrive one at a time: the Needle Pin on 1-1, SHRED on 1-3, the Ice Pin on 1-6, then Fire (2-2), Magnet (2-6), Cork (3-2), Lamp (4-2) and Candle (5-2).

Plain ES modules, no build step, no dependencies. Made for phones; a mouse and keyboard fallback exists for desktop.

## Play

- **On a phone:** open the GitHub Pages URL, then use *Add to Home Screen* (Android: Chrome menu > Install app / Add to Home screen; iOS: Safari > Share > Add to Home Screen). It launches fullscreen with no browser chrome. Android locks it to portrait; iOS web apps can't lock orientation, so hold the phone upright.
- **Controls (Hold, the default):** hold a finger on the screen and the blades open above it (each weapon opens at its own speed); lift to snip. Lifting early cuts weaker. When the SHRED meter (top left, under the wave badge) is full, tap it, then touch where you want the spin. A **+** appears beside the road on each free pad once you can afford a Pin; tap it to build one.
- **Controls (Pinch, in Settings on the title):** two fingers on the screen are the scissor handles. Spread them to open the blades and pinch fast to snip; rotate your hand to aim. Slow closes do nothing. SHRED works the same way: tap the full meter, then put your fingers down where it should spin.
- **Desktop:** move the mouse, hold the left button to open, release to snip. Wheel = spread, A/D = rotate, Space = instant snip, E = SHRED, P/Esc = pause, R = back to title. The full list is at the top of `index.html`.

## Run locally

ES modules don't load from `file://`, so serve the folder over http:

```bash
node tools/serve.js --open
```

Or double-click `Play.bat` on Windows. It serves on port 8000 (or the next free port) on all interfaces and prints a LAN address, so a phone on the same Wi-Fi can play it. `python3 -m http.server` works too.

## Replay a run with `?seed=`

Every run is seeded, and all gameplay randomness (spawns, which side of a fork each enemy takes, shove chances, fragment bursts) comes from that seed. Add `?seed=1234` to the URL to pin it, and every run uses that seed:

```
https://<user>.github.io/<repo>/?seed=1234
```

The seed shows on the game-over card, in the pause menu and in the debug panel. Every run report (kept in the debug panel's Export all runs; feedback sent from Settings carries the last one) includes a `replay` link with its seed and level (`?level=meadow`, `fork`, `hem`, ... or `random` picks the level; the ids are the level files in `src/levels/`, listed in `docs/worlds.md`), so a tester's bad run can be replayed with the same enemy variation.

## Generated levels

Every map level but the first two, and Endless, are built by a level generator from a short road recipe and painted in the world's look from an art kit (a felt meadow in a sewing tray, a denim quilt, autumn leaf litter, a knitted night drawer lit by lanterns, snow). Try your own with `?recipe=` (and `&world=snow` for a look):

```
https://<user>.github.io/<repo>/?recipe=start left, s, fork pin, zigzag 2&seed=3
```

Segments run top to bottom: `straight`, `bend left|right|center`, `s left|right`, `wave n`, `wiggle n`, `zigzag n`, `fork [wide|narrow] [pin]` (the road splits and each enemy picks a side; `pin` puts a Pin pad inside), plus `start left|right`. The seed varies the details. Locally, `tools/level-lab.html` previews recipes before you play them.

## Buttons (the meta currency)

Thread buys Pins inside a level and is gone when it ends. **Buttons** are what you keep. They are never converted into each other.

- **Earned** only from playing, with no randomness: every win pays a score bonus of floor(score / 100) Buttons, capped by level (9 on Level 1-1 up to 58 on Level 5-10; Endless pays like a mid level), replays included, so you can always earn more; 10 / 15 / 25 for the first time you earn each star of a level; one-time achievements (two for squishing silverfish, a pair per world) (listed on the map's Trophies screen, locked ones included); and a chest per world (three-star every level in it: 100 Buttons and a cosmetic, contents shown up front).
- **Spent** in the Sewing Box (on the map and the weapon screen: what you hold): three upgrade tiers per pair (150 / 300 / 600), three permanent tiers per Pin (seven Pins; 120 / 240 / 450: a cheaper build, a wider ring, then the Pin's own trick), SHRED's three tiers (120 / 240 / 400: it starts as one spin and a snip, then Double Spin, Quick Charge, Whirlwind) and Sharpen (40: every snip slowly dulls a pair, from half sharp at the start; a dull pair does 20% less snip damage, a sharp one 20% more, and Sharpen puts it back to full); and in the Shop (on the title and the map: new things): five pairs of scissors that are only sold there (200 to 600, each on sale after a world's second level) and cosmetics (handle colours, blade glows, 100 each). Pins themselves and stars are never for sale.
- **One-time supply: about 4,500 Buttons** (stars 2,500, achievements 1,530, world chests 500), plus the wage on every win. `node tools/buttonsupply.js` prints it, the wage by level and everything there is to buy.
- Inside a level, Thread also ranks a built Pin up (II, then III: a wider ring, more power), tapping the gold button on its pad. Ranks are gone when the level ends.

Nothing waits on a clock: no timers, energy, daily rewards, streaks or limited-time stock.

## Critters

Silverfish scuttle across some levels. They're bonus targets that only your own snips can hit (Pins and SHRED ignore them). Each squish pays a fixed 30 thread, never Buttons. Each level has a fixed cap (2 in world 1, 3 in worlds 2 and 3, 4 in worlds 4 and 5), and a silverfish skitters away from blades that open near it, once per crossing. Every level's thread is trimmed so that squishing every silverfish gives the same total as before critters existed; missing them all leaves you about one Pin short. `node tools/wavesheet.js` prints each level's thread with and without them.

## Playtest questions

<!-- TODO: paste the playtest questions here. -->

_To be added._

## Deploying

`.github/workflows/pages.yml` deploys `main` to GitHub Pages on every push. Set up once under repo **Settings > Pages > Build and deployment > Source: GitHub Actions**. The workflow publishes only the runtime files (`index.html`, `manifest.webmanifest`, `src/`, `vendor/`, `assets/`). Every path in the game is relative, so it runs from the `/<repo>/` subpath.

The home-screen icons (`assets/icons/icon-192.png`, `icon-512.png`) are generated from `scissors.svg` by `tools/make-icons.js` and committed. Regenerating them is the one place npm is used (see the header of that script); `node_modules` is never committed.

## Rules (from CLAUDE.md)

- **Never put a cooldown on the base snip; the player's fingers are the cooldown.**
- **All tunable numbers live in `src/config.js`, each with a one-line comment.** Modules read `CONFIG` at runtime, so the debug panel can change values live. Don't copy config values into module-level constants.
- **No npm, no bundler, no CDN. Third-party code is vendored into `vendor/` with its license, and must be under 5KB each.** Plain ES modules via `<script type="module">`, no build step.
- **The scissors' cutting zone must never be occluded by the player's fingers; blades extend away from the finger midpoint.** The pivot sits `pivotOffsetPx` above the finger midpoint, and the blades point perpendicular to the finger line, away from the hand.
- **`game.js` contains no canvas calls. All drawing lives in `render.js`.** This keeps a future Phaser/Godot port cheap.

See `CLAUDE.md` for the file map, game flow and conventions.
