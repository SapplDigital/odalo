// Before/after at 1440: the current production composition (local dist/, not rebuilt) vs the prototype, from the Services heading to the next section.
import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'msedge' });
async function region(url, fromSel, toSel, file) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto('http://127.0.0.1:4331' + url, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')); for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } scrollTo(0, 0); await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p.waitForTimeout(900);
  const r = await p.evaluate(([a, z]) => { const A = document.querySelector(a).getBoundingClientRect(), Z = document.querySelector(z).getBoundingClientRect(); return { y: A.top + scrollY, h: Z.top + scrollY - (A.top + scrollY) }; }, [fromSel, toSel]);
  await p.screenshot({ path: `evidence/${file}`, fullPage: true, clip: { x: 0, y: r.y - 20, width: 1440, height: r.h + 20 } }); console.log(file, JSON.stringify(r)); await ctx.close();
}
await region('/en/', '#services', '#process', 'compare-before-1440.png');
await region('/en.html', '#services', '[data-next-section]', 'compare-after-1440.png');
await b.close();
