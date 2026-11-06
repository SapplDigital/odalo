// D3: build the reviewed production artifact (dist only) and audit it. node docs/review/free-audit/delivery/D3/build-artifact.mjs
// Production values mirror the LIVE site (verified by curl: canonical https://odalo.sappl-digital.de, robots noindex + Disallow, root base):
//   SITE_URL=https://odalo.sappl-digital.de   SITE_BASE unset (root)   PUBLIC_NOINDEX=true (unchanged)   PUBLIC_AUDIT_TRANSPORT=netlify   PUBLIC_AUDIT_ENDPOINT unset
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'artifact', 'dist');
rmSync(join(here, 'artifact'), { recursive: true, force: true }); mkdirSync(join(here, 'artifact'), { recursive: true });
const env = { ...process.env };
for (const k of Object.keys(env)) if (/^(PUBLIC_|SITE_)/.test(k)) delete env[k];
Object.assign(env, { SITE_URL: 'https://odalo.sappl-digital.de', PUBLIC_NOINDEX: 'true', PUBLIC_AUDIT_TRANSPORT: 'netlify' });
const log = execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['astro', 'build', '--outDir', out], { env, shell: true, encoding: 'utf8' });
writeFileSync(join(here, 'evidence', 'build-output.txt'), log.replace(/\x1b\[[0-9;]*m/g, ''));

const files = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p); } }; walk(out);
files.sort();
const manifest = files.map((f) => `${createHash('sha256').update(readFileSync(f)).digest('hex')}  ${relative(out, f).replace(/\\/g, '/')}`);
const artifactId = createHash('sha256').update(manifest.join('\n')).digest('hex');
writeFileSync(join(here, 'evidence', 'artifact-manifest.sha256.txt'), manifest.join('\n') + '\n');

const rep = { env: { SITE_URL: env.SITE_URL, SITE_BASE: '(unset = /)', PUBLIC_NOINDEX: env.PUBLIC_NOINDEX, PUBLIC_AUDIT_TRANSPORT: env.PUBLIC_AUDIT_TRANSPORT, PUBLIC_AUDIT_ENDPOINT: '(unset)' }, files: files.length, artifactId, pages: {} };
const privateRe = /bastiappl12|gmail\.com|Sebastian\.Appl@|sebastian\.appl@/i;
rep.privateAddressHits = files.filter((f) => /\.(html|js|css|txt|xml|json|svg|webmanifest)$/.test(f) && privateRe.test(readFileSync(f, 'utf8'))).map((f) => relative(out, f));
rep.docsOrEvidenceInArtifact = files.filter((f) => /docs|review|evidence|HANDOFF|\.md$|\.map$/i.test(relative(out, f))).map((f) => relative(out, f));
for (const lang of ['en', 'es', 'de']) {
  const h = readFileSync(join(out, lang, 'audit', 'index.html'), 'utf8');
  const form = (h.match(/<form[^>]*data-form[^>]*>/) || [''])[0].replace(/\s+data-astro-cid-\w+/g, '');
  const names = [...new Set([...h.matchAll(/<(?:input|select|textarea)[^>]*\sname="([^"]+)"/g)].map((m) => m[1]))];
  const need = ['form-name', 'bot-field', 'name', 'email', 'business', 'need', 'website', 'country', 'language', 'service', 'plan', 'phone', 'privacy', 'marketing', 'pageLanguage'];
  rep.pages[lang] = {
    formTag: form, formNameInput: /<input[^>]*name="form-name"[^>]*value="audit"/.test(h) || /<input[^>]*value="audit"[^>]*name="form-name"/.test(h),
    transport: (h.match(/data-transport="([^"]*)"/) || [])[1], netlifyPath: (h.match(/data-netlify-path="([^"]*)"/) || [])[1], endpointAttr: (h.match(/data-endpoint="([^"]*)"/) || [])[1],
    missingFields: need.filter((n) => !names.includes(n)), submitDisabledInHtml: /<button[^>]*data-submit[^>]*\sdisabled/.test(h),
    mailto: [...new Set([...h.matchAll(/mailto:([^"]+)"/g)].map((m) => m[1]))], robots: (h.match(/name="robots" content="([^"]*)"/) || [])[1], canonical: (h.match(/rel="canonical" href="([^"]*)"/) || [])[1],
    demoNoticeInForm: /class="af__demo"/.test(h.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')),
  };
}
rep.robotsTxt = readFileSync(join(out, 'robots.txt'), 'utf8').trim();
writeFileSync(join(here, 'evidence', 'artifact-audit.json'), JSON.stringify(rep, null, 2));
console.log(JSON.stringify(rep, null, 1));
