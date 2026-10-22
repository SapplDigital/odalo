// Builds the two service-tile crops that did not exist yet, from existing concept outputs only (no new concept):
//  - local-info: the "Find us" section of the Tidewell destination page (docs/review/concept-clinic/index.html) at 1440 px, trimmed of empty padding
//  - video-filmstrip: five real frames of the Brindle Pantry MP4 (public/work/concepts/shop) on a film strip
// Usage (repo root): node docs/review/services-mosaic/tools/build-service-images.mjs   (needs Edge via Playwright and ffmpeg on PATH)
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const out = path.resolve('docs/review/services-mosaic/assets');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });

// 1. Tidewell local-information section
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pathToFileURL(path.resolve('docs/review/concept-clinic/index.html')).href);
  await page.waitForTimeout(500);
  // the section minus its empty top and bottom padding: 1440x590, from 70 px below the section top
  const box = await page.locator('#find-us').boundingBox();
  await page.screenshot({ path: path.join(out, 'tidewell-local-info-1440.png'), fullPage: true, clip: { x: 0, y: box.y + 70, width: 1440, height: 590 } });
  await page.close();
}

// 2. Filmstrip from the encoded video (frames at these times, seconds)
const times = [0.8, 3.2, 5.6, 7.6, 9.4];
const frames = times.map((t, i) => {
  const f = path.join(out, `frame-${i}.png`);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', 'public/work/concepts/shop/brindle-pantry-concept-1080x1920.mp4', '-frames:v', '1', f]);
  if (r.status !== 0) throw new Error(String(r.stderr));
  return f;
});
const imgs = frames.map((f) => `<img src="${pathToFileURL(f).href}">`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:2000px;height:800px;background:#1b2220}
.strip{position:relative;width:2000px;height:800px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;box-sizing:border-box}
.strip img{width:380px;height:676px;object-fit:cover;border-radius:6px;display:block}
.holes{position:absolute;left:0;right:0;height:28px;background:repeating-linear-gradient(90deg,#fafaf6 0 26px,transparent 26px 56px);opacity:.9;-webkit-mask:linear-gradient(#000,#000);}
.holes::after{content:'';position:absolute;inset:0}
.top{top:16px}.bot{bottom:16px}
.holes{background:repeating-linear-gradient(90deg,transparent 0 14px,#fafaf6 14px 38px,transparent 38px 56px);border-radius:6px;height:20px}
</style><div class="strip"><div class="holes top"></div>${imgs}<div class="holes bot"></div></div>`;
const hp = path.join(out, 'filmstrip.html');
fs.writeFileSync(hp, html);
const page = await browser.newPage({ viewport: { width: 2000, height: 800 } });
await page.goto(pathToFileURL(hp).href);
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'brindle-filmstrip-2000x800.png') });
await browser.close();
