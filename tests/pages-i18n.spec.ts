import { test, expect, type Page } from '@playwright/test';
import { languages, type Lang } from '../src/i18n';
import { ui } from '../src/i18n/ui';
import { services } from '../src/content/services';
import { plans, features, pendingConditions, quoteLabel } from '../src/content/plans';
import { projects } from '../src/content/projects';
import { faqs } from '../src/content/faqs';
import * as offer from '../src/content/offer';
import { legalCopy } from '../src/content/legal';

/** Routes are derived from the same data the pages' getStaticPaths use (languages, services, projects, legal slugs). */
const legalSlugs = ['privacy', 'cookies', 'legal'];
const rests = [
  '',
  'about/',
  'work/',
  ...projects.map((p) => `work/${p.id}/`),
  ...services.map((s) => `services/${s.id}/`),
  'plans/',
  'audit/',
  ...legalSlugs.map((s) => `${s}/`),
];

const norm = (p: string) => (p.endsWith('/') ? p : p + '/');

/** All dotted key paths (>= 2 segments) of the UI dictionary, used to spot raw i18n keys rendered as text. */
function keyPaths(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).flatMap(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    return [p, ...keyPaths(v, p)];
  });
}
const rawKeys = keyPaths(ui.en).filter((p) => p.includes('.') && /^[A-Za-z0-9_.]+$/.test(p));

async function visibleProblems(page: Page): Promise<string[]> {
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    const attrs: string[] = [document.title, document.querySelector('meta[name=description]')?.getAttribute('content') ?? ''];
    document.querySelectorAll('[alt],[aria-label]').forEach((el) => {
      attrs.push(el.getAttribute('alt') ?? '', el.getAttribute('aria-label') ?? '');
    });
    return { text, attrs };
  });
  const problems: string[] = [];
  const bad = /\bundefined\b|\bnull\b|\[object Object\]/;
  const scan = (label: string, s: string) => {
    const m = bad.exec(s);
    if (m) problems.push(`${label}: "${m[0]}" in "${s.slice(Math.max(0, m.index - 30), m.index + 40)}"`);
    for (const k of rawKeys) if (new RegExp(`(^|[^A-Za-z0-9_.])${k.replace(/\./g, '\\.')}($|[^A-Za-z0-9_])`).test(s)) problems.push(`${label}: raw key "${k}"`);
  };
  scan('text', data.text);
  data.attrs.forEach((a) => scan('attr', a));
  return problems;
}

for (const rest of rests) {
  test(`i18n page /{lang}/${rest}`, async ({ page, request }) => {
    const seen: Record<string, { title: string; description: string }> = {};
    for (const lang of languages) {
      const url = `/${lang}/${rest}`;
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(200);

      await expect(page.locator('html'), url).toHaveAttribute('lang', lang);

      const title = (await page.title()).trim();
      const description = ((await page.locator('meta[name=description]').getAttribute('content')) ?? '').trim();
      expect(title.length, `${url} title`).toBeGreaterThan(0);
      expect(description.length, `${url} description`).toBeGreaterThan(0);
      seen[lang] = { title, description };

      await expect(page.locator('h1'), `${url} h1 count`).toHaveCount(1);

      // language switch: same page in the other two languages, and the targets exist
      for (const other of languages.filter((l) => l !== lang)) {
        const hrefs = await page.locator(`nav.lang a[data-set-lang="${other}"]`).evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).pathname));
        expect(hrefs.length, `${url} switch to ${other}`).toBeGreaterThan(0);
        for (const h of hrefs) {
          expect(norm(h), `${url} switch to ${other}`).toBe(norm(`/${other}/${rest}`));
          expect((await request.get(h)).status(), `${h} exists`).toBe(200);
        }
      }

      // hreflang alternates only on indexable pages
      const noindex = (await page.locator('meta[name=robots][content*=noindex]').count()) > 0;
      const alts = await page.locator('head link[rel=alternate][hreflang]').evaluateAll((ls) => ls.map((l) => [l.getAttribute('hreflang')!, new URL((l as HTMLLinkElement).href).pathname] as const));
      if (noindex) {
        expect(alts, `${url} noindex pages carry no hreflang`).toEqual([]);
      } else {
        const map = Object.fromEntries(alts);
        expect(Object.keys(map).sort(), `${url} hreflang set`).toEqual([...languages, 'x-default'].sort());
        for (const l of languages) expect(norm(map[l]), `${url} hreflang ${l}`).toBe(norm(`/${l}/${rest}`));
        expect(norm(map['x-default']), `${url} x-default`).toBe(norm(`/en/${rest}`));
        for (const p of Object.values(map)) expect((await request.get(p)).status(), `${p} exists`).toBe(200);
      }

      expect(await visibleProblems(page), url).toEqual([]);
    }
    // language-specific: the three languages must not share an identical title+description pair
    for (let i = 0; i < languages.length; i++)
      for (let j = i + 1; j < languages.length; j++) {
        const a = seen[languages[i]], b = seen[languages[j]];
        expect(a.description, `${rest} description ${languages[i]} vs ${languages[j]}`).not.toBe(b.description);
      }
  });
}

test('root redirect page and 404 link to all three languages', async ({ page }) => {
  for (const url of ['/', '/this-page-does-not-exist/']) {
    await page.goto(url);
    const html = await page.content();
    for (const l of languages) expect(html, `${url} links to /${l}/`).toMatch(new RegExp(`href="[^"]*/${l}/?"`));
  }
});

// ---- parity: every localized record has es, en and de, same key sets, no empty values ----

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);

function shape(v: Json, path = ''): string[] {
  if (Array.isArray(v)) return [`${path}[${v.length}]`, ...v.flatMap((x, i) => shape(x, `${path}[${i}]`))];
  if (isObj(v)) return Object.keys(v).flatMap((k) => [`${path}.${k}`, ...shape(v[k], `${path}.${k}`)]);
  return [];
}
function empties(v: Json, path: string): string[] {
  if (typeof v === 'string') return v.trim() === '' ? [path] : [];
  if (Array.isArray(v)) return v.flatMap((x, i) => empties(x, `${path}[${i}]`));
  if (isObj(v)) return Object.entries(v).flatMap(([k, x]) => empties(x, `${path}.${k}`));
  return [];
}

test('ui.ts dictionaries have identical keys and no empty values in es/en/de', () => {
  const base = shape(ui.en).sort();
  for (const l of languages) {
    expect(shape(ui[l]).sort(), `ui.${l} keys`).toEqual(base);
    // A heading may be a single emphasised word: an empty `h2.a` is allowed (WorkMosaic omits the gap) as long as `h2.em` has text.
    const single = Object.entries(ui[l]).filter(([, v]) => isObj(v) && isObj(v.h2) && v.h2.a === '' && typeof v.h2.em === 'string' && v.h2.em.trim() !== '').map(([k]) => `ui.${l}.${k}.h2.a`);
    expect(empties(ui[l], `ui.${l}`).filter((p) => !single.includes(p)), `ui.${l} empty values`).toEqual([]);
  }
});

test('localized content records (L / LList) carry es, en and de with no empty values', () => {
  const problems: string[] = [];
  const walk = (v: Json, path: string) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (!isObj(v)) return;
    const keys = Object.keys(v);
    const present = languages.filter((l) => keys.includes(l));
    if (present.length > 0 && keys.every((k) => (languages as readonly string[]).includes(k))) {
      if (present.length !== languages.length) problems.push(`${path}: missing ${languages.filter((l) => !keys.includes(l)).join(',')}`);
      for (const l of present) problems.push(...empties(v[l], `${path}.${l}`).map((p) => `${p} is empty`));
      const lens = present.filter((l) => Array.isArray(v[l])).map((l) => (v[l] as unknown[]).length);
      if (lens.length && new Set(lens).size > 1) problems.push(`${path}: list lengths differ (${lens.join('/')})`);
      return;
    }
    for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(services, 'services');
  walk(plans, 'plans');
  walk(features, 'features');
  walk(pendingConditions, 'pendingConditions');
  walk(quoteLabel, 'quoteLabel');
  walk(projects, 'projects');
  walk(faqs, 'faqs');
  walk({ ...offer }, 'offer');
  // legal pages are built per language (not L records): same sections / paragraph counts and no empty text
  const sig = (l: Lang) => JSON.stringify(Object.entries(legalCopy[l].pages).map(([k, pg]) => [k, pg.sections.map((s) => s.p.length)]));
  for (const l of languages) {
    problems.push(...empties(legalCopy[l], `legal.${l}`).map((p) => `${p} is empty`));
    if (sig(l) !== sig('en')) problems.push(`legal.${l}: section/paragraph structure differs from en`);
    expect(shape(legalCopy[l]).filter((p) => !/\[\d+\]/.test(p)).sort(), `legal.${l} keys`).toEqual(shape(legalCopy.en).filter((p) => !/\[\d+\]/.test(p)).sort());
  }
  expect(problems).toEqual([]);
});
