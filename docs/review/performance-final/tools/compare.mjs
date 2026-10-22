// Compares baseline/ and after/ raw runs; prints markdown tables. node docs/review/performance-final/tools/compare.mjs
import { readFileSync } from 'node:fs';
const load = (d, p, r, n) => JSON.parse(readFileSync(`docs/review/performance-final/${d}/${p}-${r}-run${n}.json`, 'utf8'));
const kb = (n) => (n / 1024).toFixed(1);
console.log('| Profile | Route | Set | LCP ms (run1 / run2) | LCP element | CLS init/after-interaction | Initial requests | Initial decoded KB | Initial encoded KB (observed) | Initial JS raw KB / calc gzip KB | Fonts KB decoded | Long tasks init (max ms) | Sampled interaction max ms | Interaction-triggered req / decoded KB |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const p of ['desktop1440', 'phone390']) for (const r of ['home', 'plans', 'audit', 'brindle']) for (const d of ['baseline', 'after']) {
  const a = [1, 2].map((n) => load(d, p, r, n));
  const s = a[0].summary, v = (x) => x.summary.vitals;
  console.log(`| ${p} | ${r} | ${d} | ${a.map((x) => v(x).lcpMs).join(' / ')} | ${v(a[0]).lcpElement}${v(a[0]).lcpUrl ? ' ' + v(a[0]).lcpUrl.split('/').pop() : ''} | ${v(a[0]).clsInitial}/${Math.max(...a.map((x) => v(x).clsAfterInteraction))} | ${s.initial.requests} | ${kb(s.initial.decoded)} | ${kb(s.initial.encoded)} | ${kb(s.jsInitial.totalRaw)} / ${kb(s.jsInitial.totalCalcGzip)} | ${kb(s.initial.byType.font.decoded)} | ${a.map((x) => `${v(x).longTasksInitial} (${v(x).longTaskMaxInitialMs})`).join(' / ')} | ${a.map((x) => v(x).sampledInteractionMaxMs).join(' / ')} | ${s.interaction.requests} / ${kb(s.interaction.decoded)} |`);
}
