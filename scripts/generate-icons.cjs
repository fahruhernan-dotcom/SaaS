'use strict';
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'icons');

// ── Regular icons (192 & 512) ───────────────────────────────────────────────
// Same rounded-rect design as favicon.svg, rendered at target size.
// Using @resvg (Rust) avoids the black-fringe artefact that appears when
// semi-transparent anti-alias pixels are composited over a black canvas.
const regularSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="60" fill="#123c26"/>
  <rect x="56" y="60" width="50" height="40" fill="#ffffff"/>
  <path d="M 146 60 L 196 60 L 196 100 L 146 100 L 146 196 L 106 196 L 106 100 Z" fill="#ffffff"/>
</svg>`;

// ── Maskable icon (512) ──────────────────────────────────────────────────────
// Rules:
//   • No transparency anywhere — must be fully opaque
//   • Key artwork must stay inside the safe zone (center 80% = px 51-461)
//   • Outer 20% (full-bleed area) is solid brand colour
//
// Design: #16a34a full-bleed background, white T-logo centred in safe zone.
// Coordinates derived by scaling original T (140×136 in 256×256 viewBox)
// to 266×258 (scale 1.9×) and centring at (256, 256):
//   x-offset = (512 - 266) / 2 = 123,  y-offset = (512 - 258) / 2 = 127
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#16a34a"/>
  <rect x="123" y="127" width="95" height="76" fill="#ffffff"/>
  <path d="M 294 127 L 389 127 L 389 203 L 294 203 L 294 385 L 218 385 L 218 203 Z" fill="#ffffff"/>
</svg>`;

function render(svgStr, size, filename) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const dest = path.join(OUT, filename);
  fs.writeFileSync(dest, png);
  console.log(`✓  ${filename}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

render(regularSvg,  192, 'icon-192.png');
render(regularSvg,  512, 'icon-512.png');
render(maskableSvg, 512, 'maskable-icon-512.png');

console.log('\nDone. Check public/icons/');
