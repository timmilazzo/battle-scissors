# Battle Scissors

A 2D mobile canvas game prototype built around one mechanic: your two fingers are the handles of a pair of scissors, and a fast pinch snips whatever sits between the blades. Plush ragdoll enemies walk a road through a kitchen drawer toward your workshop; you snip them, build Pins (Ice, Fire, Magnet) on the pads beside the road, and bank kills for SHRED, a spinning special.

Plain ES modules, no build step, no dependencies. Made for phones; a mouse and keyboard fallback exists for desktop.

## Play

- **On a phone:** open the GitHub Pages URL, then use *Add to Home Screen* (Android: Chrome menu > Install app / Add to Home screen; iOS: Safari > Share > Add to Home Screen). It launches fullscreen with no browser chrome. Android locks it to portrait; iOS web apps can't lock orientation, so hold the phone upright.
- **Controls:** two fingers on the screen are the scissor handles. Spread them to open the blades and pinch fast to snip; rotate your hand to aim. Slow closes do nothing. Tap a third finger while gripping to SHRED once it's charged. Tap a **+** beside the road to build a Pin.
- **Desktop:** move the mouse, hold the left button to open, release to snip. Wheel = spread, A/D = rotate, Space = instant snip, E = SHRED, P/Esc = pause, R = back to title. The full list is at the top of `index.html`.

## Run locally

ES modules don't load from `file://`, so serve the folder over http:

```bash
node tools/serve.js --open
```

Or double-click `Play.bat` on Windows. It serves on port 8000 (or the next free port) on all interfaces and prints a LAN address, so a phone on the same Wi-Fi can play it. `python3 -m http.server` works too.

## Replay a run with `?seed=`

Every run is seeded, and all gameplay randomness (spawns, shove chances, fragment bursts) comes from that seed. Add `?seed=1234` to the URL to pin it, and every run uses that seed:

```
https://<user>.github.io/<repo>/?seed=1234
```

The seed shows on the game-over card, in the pause menu and in the debug panel. Every run report (*Copy run report* / *Send feedback*) includes a `replay` link with its seed, so a tester's bad run can be replayed with the same enemy variation.

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
