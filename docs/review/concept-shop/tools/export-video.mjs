// Renders docs/review/concept-shop/motion.html frame by frame (deterministic: no real-time capture) and encodes a silent WebM (VP9) and MP4 (H.264).
// Usage (repo root):  node docs/review/concept-shop/tools/export-video.mjs [frameDir]
// Needs Edge (Playwright channel "msedge") and an ffmpeg on PATH (the winget "Gyan.FFmpeg" build was used). No dependency is added.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(path.resolve('package.json')));
const { chromium } = require('@playwright/test');
const root = path.resolve('docs/review/concept-shop');
const out = path.join(root, 'video');
const frames = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'brindle-frames-'));
fs.mkdirSync(frames, { recursive: true }); fs.mkdirSync(out, { recursive: true });
const FPS = 30;

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.join(root, 'motion.html')).href + '?export=1');
await page.waitForTimeout(500);
const duration = await page.evaluate(() => window.__duration);
const n = Math.round(duration * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.__seek(t), i / FPS);
  await page.screenshot({ path: path.join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
await page.evaluate((t) => window.__seek(t), 5.6);
await page.screenshot({ path: path.join(out, 'poster-1080x1920.png') });
await browser.close();

const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg failed'); };
const input = ['-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png')];
ff([...input, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', path.join(out, 'brindle-pantry-concept-1080x1920.webm')]);
ff([...input, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(out, 'brindle-pantry-concept-1080x1920.mp4')]);
console.log('frames', n, 'dir', frames);
