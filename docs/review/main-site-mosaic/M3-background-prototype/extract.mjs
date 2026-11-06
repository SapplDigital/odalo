// Prototype data extractor: loads the app's real content (services + UI strings) through Vite's SSR loader (already installed) and writes data.json
// + copies the three service pictures into ./assets. Reads app source only; writes inside this folder only. Usage: node extract.mjs
import { createServer } from 'vite';
import { writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)); const app = path.resolve(here, '../../../..');
const vite = await createServer({ root: app, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' });
const { services } = await vite.ssrLoadModule('/src/content/services.ts');
const { tr } = await vite.ssrLoadModule('/src/i18n/ui.ts');
const { projectById } = await vite.ssrLoadModule('/src/content/projects.ts');
const out = {};
for (const l of ['en', 'es', 'de']) {
  const t = tr(l);
  out[l] = { hero: t.hero, services: t.services, common: t.common, pieces: ['web', 'local', 'ads'].map((id) => {
    const s = services.find((x) => x.id === id); const v = s.visual;
    const img = v.crop ?? projectById(v.projectId).images.find((i) => i.id === v.imageId);
    return { id, number: s.number, name: s.name[l], outcome: s.outcome[l], detail: s.detail[l], deliverables: s.deliverables[l], img: { folder: img.folder, file: img.file, w: img.width, h: img.height, alt: img.alt[l], position: v.position, widths: img.widths } };
  }) };
}
writeFileSync(path.join(here, 'data.json'), JSON.stringify(out));
for (const p of out.en.pieces) { const w = p.img.widths.includes(1024) ? 1024 : p.img.widths[Math.floor(p.img.widths.length / 2)]; copyFileSync(path.join(app, 'public/work/concepts', p.img.folder, `${p.img.file}-${w}.webp`), path.join(here, 'assets', `${p.img.file}.webp`)); }
console.log('ok', out.en.pieces.map((p) => p.id + ':' + p.img.file));
await vite.close();
