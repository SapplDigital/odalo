// Builds docs/review/performance-final/ASSET-REGISTER.md from the files in public/ and the content records.
// Run: node docs/review/performance-final/tools/build-register.mjs   (Node 24: imports the .ts content directly)
import { readFileSync, statSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { register } from 'node:module';

// The content files import each other without a .ts extension (fine for Astro/Vite, not for plain Node): resolve them here.
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) { try { return await next(s, c); } catch (e) { if (s.startsWith('.')) return next(s + '.ts', c); throw e; } }`));
const { projects } = await import('../../../../src/content/projects.ts');
const { services } = await import('../../../../src/content/services.ts');

const kb = (n) => (n / 1024).toFixed(1);
function webpSize(file) {
  const b = readFileSync(file);
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  return [0, 0];
}
const pub = (...p) => ['public', 'work', 'concepts', ...p].join('/');
const svcUse = new Map();
for (const s of services) {
  const v = s.visual;
  if (!v) continue;
  const k = v.crop ? v.crop.id : `${v.projectId}/${v.imageId}`;
  if (!svcUse.has(k)) svcUse.set(k, []);
  svcUse.get(k).push(s.id);
}

const rows = [];
for (const p of projects) {
  for (const img of p.images ?? []) {
    const files = img.widths.map((w) => { const f = pub(img.folder, `${img.file}-${w}.webp`); return existsSync(f) ? { w, bytes: statSync(f).size, dims: webpSize(f) } : { w, bytes: 0, dims: [0, 0] }; });
    const svc = svcUse.get(`${p.id}/${img.id}`) ?? svcUse.get(img.id) ?? [];
    const place = [];
    if (img.role.startsWith('card')) place.push(`work card${img.media ? ` (only ${img.media})` : ''}`, 'home work mosaic');
    if (img.role === 'screen' || img.role === 'creative') place.push('case study gallery');
    if (img.role === 'card' && !img.media) place.push('case study lead');
    if (svc.length) place.push(`service tile: ${svc.join(', ')}`);
    rows.push({ project: p.id, id: img.id, role: img.role, place: place.join('; '), files, intrinsic: `${img.width}x${img.height}`, media: img.media ?? '', lang: img.screenshotLang, provenance: img.provenance.en });
  }
}
const vids = projects.flatMap((p) => (p.videos ?? []).map((v) => ({ p: p.id, v })));
const today = new Date().toISOString().slice(0, 10);

let md = `# Consolidated asset register (site images and video)

Generated ${today} by \`docs/review/performance-final/tools/build-register.mjs\` from \`public/work/concepts/**\` and the records in \`src/content/projects.ts\` / \`services.ts\`.
It consolidates, and does not replace, the per-concept registers: \`docs/review/concept-hotel/ASSET-REGISTER.md\`, \`concept-clinic/ASSET-REGISTER.md\`, \`concept-shop/ASSET-REGISTER.md\`, \`services-mosaic/\`.

**Provenance is not a licence.** "Recorded provenance" below is what the project records say about how each file was made. It is **not** an approved usage right, a licence grant or a legal clearance. Nothing here approves any right, font licence or image use.

## Raster images (WebP, responsive variants)
Delivery: \`<img srcset>\` with \`sizes\`, intrinsic width/height set (no layout shift); \`loading="lazy"\` + \`decoding="async"\` except the case-study lead image and the service-page figure (eager). Alt text is localized (en/es/de) in the record: \`src/content/projects.ts\`, \`alt.{en,es,de}\`.

| Project | Record | Role | Placements | Intrinsic (largest) | Variants: width (actual size, KB) | Media-query crop | Language in picture |
|---|---|---|---|---|---|---|---|
`;
for (const r of rows) md += `| ${r.project} | \`${r.id}\` | ${r.role} | ${r.place} | ${r.intrinsic} | ${r.files.map((f) => `${f.w} (${f.dims.join('x')}, ${kb(f.bytes)})`).join('; ')} | ${r.media || '-'} | ${r.lang} |\n`;
md += `\n### Recorded provenance per image (as written in the records, English)\n| Record | Recorded provenance |\n|---|---|\n`;
for (const r of rows) md += `| \`${r.id}\` | ${r.provenance} |\n`;
md += `\nService-tile crops (\`services-local-info\`, \`services-video-strip\`) are exported from the concept outputs; sources in \`docs/review/services-mosaic/\`.\n\n## Video\n| Project | File | Formats (bytes) | Size | Duration/fps | Poster | Loading | Alt/label source |\n|---|---|---|---|---|---|---|---|\n`;
for (const { p, v } of vids) md += `| ${p} | \`public/work/concepts/${v.folder}/${v.file}.*\` | ${v.formats.map((f) => `${f.ext} (${f.bytes.toLocaleString('en')})`).join('; ')} | ${v.width}x${v.height} | ${v.seconds} s, ${v.fps} fps, silent | \`${v.poster.file}-*.webp\` ${v.poster.width}x${v.poster.height} | \`preload="none"\`, no autoplay: bytes are requested only after a user starts playback | \`label\`/\`caption\` in the record (silent, so the label is the text equivalent) |\n`;
md += `\nRecorded provenance (video): ${vids.map(({ v }) => v.provenance.en).join(' ')}\n`;

md += `\n## Vector and brand files (public/)\n| Path | Bytes | Use | Recorded provenance |\n|---|---|---|---|\n`;
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
for (const f of [...walk('public/brand'), 'public/favicon.svg', 'public/og.png']) {
  const use = f.includes('legacy') ? 'superseded legacy mark' : f.includes('brand/odalo/') ? 'animation / wordmark pieces (supplied canonical set; do not edit)' : f.includes('logo') || f.includes('symbol') ? 'logo / symbol variants' : f.endsWith('og.png') ? 'Open Graph image (not indexed while noindex is on)' : 'favicon';
  md += `| \`${f}\` | ${statSync(f).size.toLocaleString('en')} | ${use} | Odalo brand assets and the supplied 29-piece animation set; see \`HANDOFF.md\` and \`docs/review/logo-animation/\`. Authorship and rights are not restated here. |\n`;
}
md += `
## Fonts (self-hosted via Fontsource npm packages \`@fontsource-variable/outfit\`, \`@fontsource/instrument-serif\`)
| Font | Files requested | Notes |
|---|---|---|
| Outfit (variable, latin) | \`outfit-latin-wght-normal.*.woff2\` about 32 KB, preloaded | Distributed by Fontsource; licence text not re-verified in this task. |
| Instrument Serif Italic 400, latin | \`instrument-serif-latin-400-italic.*.woff2\` about 22 KB, preloaded | Same. |
| Instrument Serif Italic 400, latin-ext | about 12 KB | After Task 18 it loads only when a page needs a glyph in its unicode-range (none in the current en/es/de copy). |

HANDOFF.md records both fonts as **provisional**; the brand's own final fonts were not supplied. Whether these are approved as the final brand fonts is an **owner decision, not made here**.

## Fonts rasterised inside concept images
The concept screenshots/creatives contain text rendered in Windows system fonts (Bahnschrift, Segoe UI, Rockwell, Constantia, Corbel); the per-concept registers state they are not redistributed as font files and recommend re-rendering with licensed fonts before any use outside this demo.

## Unresolved ownership, rights and approval questions (owner)
1. **Usage rights**: no licence or rights approval is recorded for any image. The registers say the concept art was made with AI assistance (Claude); confirm that commercial use of it is acceptable to you under the applicable terms.
2. **Fictional businesses**: Casa Almina, Tidewell and Brindle Pantry are fictional; confirm none collides with a real business or trademark (not checked here).
3. **Brand/animation files**: the supplied 29-piece animation and \`public/brand/\` marks: confirm authorship and that you hold the rights to publish them.
4. **Final fonts**: approve Outfit and Instrument Serif as final, or supply the brand fonts (HANDOFF "Fonts" row), and verify the licences you rely on.
5. **System fonts in raster images**: see above.
6. **Open Graph image**: the provenance of \`public/og.png\` is not stated in a register.
7. **Alt text**: Spanish and German alt text and captions are drafts needing native review.
`;
writeFileSync('docs/review/performance-final/ASSET-REGISTER.md', md);
console.log('rows', rows.length, 'videos', vids.length);
