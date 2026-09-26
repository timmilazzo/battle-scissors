// Builds the home-screen icons (assets/icons/icon-192.png, icon-512.png) from scissors.svg.
// Dev tooling only, run once when the art changes; the PNGs are committed. The one place npm is used, and only here:
//   npm install --no-save @resvg/resvg-js   (anywhere; point NODE_PATH at its node_modules, never commit it)
//   node tools/make-icons.js
// The scissors are opened a little, tilted and centred on a dark full-bleed square, kept inside the middle 80% circle
// so Android's maskable crop and iOS's rounded corners never clip them.
const fs = require('fs'), path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'scissors.svg'), 'utf8');
const inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  // open the blades about the pivot (200,400): left negative, right positive (see scissors.svg)
  .replace(/(id="blade-left") style="[^"]*"/, '$1 transform="rotate(-16 200 400)"')
  .replace(/(id="blade-right") style="[^"]*"/, '$1 transform="rotate(16 200 400)"');

const OPEN_TILT_DEG = 38, ART_SCALE = 0.74, ART_CX = 200, ART_CY = 335;   // art centre in scissors.svg units
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><radialGradient id="bg" cx="0.5" cy="0.45" r="0.7">
    <stop offset="0" stop-color="#16324a"/><stop offset="0.6" stop-color="#0b1826"/><stop offset="1" stop-color="#070d16"/>
  </radialGradient></defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) rotate(${OPEN_TILT_DEG}) scale(${ART_SCALE}) translate(${-ART_CX} ${-ART_CY})">${inner}</g>
</svg>`;

const outDir = path.join(root, 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const png = new Resvg(icon, { fitTo: { mode: 'width', value: size } }).render().asPng();
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`assets/icons/icon-${size}.png  ${png.length} bytes`);
}
