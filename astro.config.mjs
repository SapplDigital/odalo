import { defineConfig } from 'astro/config';

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
});
