import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Home first paint (language switch): the homepage mosaic script is moved into <head> and marked blocking="render", so the browser keeps showing the PREVIOUS page
// until the mosaic itself can be painted, instead of painting the plain no-JS stack first. Ends when the script has run or failed to load (no timer, same class of
// blocking as the stylesheet). No JS / script failure: nothing blocks and the stack is readable at once. If the tag is not found (renamed asset), nothing changes.
const homeMosaicFirstPaint = () => ({
  name: 'home-mosaic-first-paint',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const walk = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? walk(f) : f.endsWith('.html') ? [f] : []; });
      const tag = /<script type="module" src="(\/[^"]*HomeMosaic\.astro_astro_type_script[^"]*)"><\/script>/;
      for (const f of walk(fileURLToPath(dir))) {
        const h = readFileSync(f, 'utf8'), m = h.match(tag);
        if (!m || !h.includes('</head>')) continue;
        writeFileSync(f, h.replace(tag, '').replace('</head>', `<script type="module" src="${m[1]}" blocking="render"></script></head>`));
      }
    },
  },
});

// SITE_URL / SITE_BASE let the demo be hosted on any origin or sub-path
// (e.g. GitHub Pages) without touching source. Placeholder origin is not a real domain.
const site = process.env.SITE_URL || 'https://odalo.example';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  integrations: [homeMosaicFirstPaint()],
});
