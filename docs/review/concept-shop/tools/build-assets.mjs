// Renders the static Brindle Pantry artifacts and writes the product SVG files.
// Usage (repo root): node docs/review/concept-shop/tools/build-assets.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const root = path.resolve('docs/review/concept-shop');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'shop-art.js'), 'utf8'), ctx);
const A = ctx.window.ShopArt;
fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
for (const n of Object.keys(A.products)) fs.writeFileSync(path.join(root, 'assets', `product-${n}.svg`), A.productSvg(n));
const br = await chromium.launch({ channel: 'msedge' });
for (const [name, w, h] of [['square', 1080, 1080], ['card-wide', 1600, 1000], ['sheet', 1600, 1000]]) {
  const p = await br.newPage({ viewport: { width: w, height: h } });
  await p.goto(pathToFileURL(path.join(root, 'creatives', `${name}.html`)).href);
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(root, 'creatives', `brindle-${name}-${w}x${h}.png`), clip: { x: 0, y: 0, width: w, height: h } });
  await p.close();
}
await br.close();
console.log('done');
