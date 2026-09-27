# Battle Scissors

A 2D mobile canvas game prototype built around one mechanic: your fingers work a pair of scissors that snip whatever sits between the blades. Plush ragdoll enemies walk a road (on the second level, a road that forks) toward your workshop; you snip them, build Pins (Needle, Ice, Fire, Magnet) on the pads beside the road, and bank kills for SHRED, a spinning special.

Plain ES modules, no build step, no dependencies. Made for phones; a mouse and keyboard fallback exists for desktop.

## Play

- **On a phone:** open the GitHub Pages URL, then use *Add to Home Screen* (Android: Chrome menu > Install app / Add to Home screen; iOS: Safari > Share > Add to Home Screen). It launches fullscreen with no browser chrome. Android locks it to portrait; iOS web apps can't lock orientation, so hold the phone upright.
- **Controls (Hold, the default):** hold a finger on the screen and the blades open above it (each weapon opens at its own speed); lift to snip. Lifting early cuts weaker. When the SHRED meter (top left, under the hearts) is full, tap it, then touch where you want the spin. A **+** appears beside the road on each free pad once you can afford a Pin; tap it to build one.
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

The seed shows on the game-over card, in the pause menu and in the debug panel. Every run report (*Copy run report* / *Send feedback*) includes a `replay` link with its seed and level (`?level=meadow`, `fork`, `hem`, ... or `random` picks the level; the ids are in `CONFIG.levels`), so a tester's bad run can be replayed with the same enemy variation.

## Generated levels

Levels 3 to 13 on the level map, and Random Quilt, are built by a level generator from a short road recipe, and painted in Button Fork's quilt style. Try your own with `?recipe=`:

```
https://<user>.github.io/<repo>/?recipe=start left, s, fork pin, zigzag 2&seed=3
```

Segments run top to bottom: `straight`, `bend left|right|center`, `s left|right`, `wave n`, `wiggle n`, `zigzag n`, `fork [wide|narrow] [pin]` (the road splits and each enemy picks a side; `pin` puts a Pin pad inside), plus `start left|right`. The seed varies the details. Locally, `tools/level-lab.html` previews recipes before you play them.

## Buttons (the meta currency)

Thread buys Pins inside a level and is gone when it ends. **Buttons** are what you keep. They are never converted into each other.

- **Earned** only from performance and achievements, with no randomness: 10 / 15 / 25 for the first time you earn each star of a level; a score bonus of floor(score / 100) Buttons, capped at 10 per level (a replay pays only what beats your best bonus there); 16 one-time achievements (two for squishing silverfish) (listed on the map's Trophies screen, locked ones included); and a chest per world (three-star every level in it: 100 Buttons and a cosmetic, contents shown up front).
- **Spent** in the Shop (on the map): four pairs of scissors that are only sold there (200 to 500, each on sale after a set level), three upgrade tiers per pair (150 / 300 / 600), Sharpening (40, +50% snip damage for your next level, hold up to 3) and cosmetics (handle colours, blade glows, 100 each). Pins and stars are never for sale.
- **Total supply: 2,135 Buttons** (stars 650, achievements 1,055, score bonus 130, world chests 300). `node tools/buttonsupply.js` recomputes it from the game data.

Nothing waits on a clock: no timers, energy, daily rewards or streaks.

## Critters

Silverfish scuttle across some levels. They're bonus targets that only your own snips can hit (Pins and SHRED ignore them). Each squish pays a fixed 30 thread, never Buttons. Each level has a fixed cap (2 in World 1, 3 in World 2, 4 in World 3), and a silverfish skitters away from blades that open near it, once per crossing. Every level's thread is trimmed so that squishing every silverfish gives the same total as before critters existed; missing them all leaves you about one Pin short. `node tools/wavesheet.js` prints each level's thread with and without them.

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
