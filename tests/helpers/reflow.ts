/**
 * Page-level reflow audit, run inside the page (page.evaluate(auditInPage)). Returns a list of problems; [] means clean.
 * It does not trust scrollWidth alone (overflow:hidden containers hide defects):
 *  - the document must not scroll sideways;
 *  - every visible element box and control must lie inside the viewport;
 *  - every visible text fragment (Range rects) must lie inside the viewport AND inside every ancestor that clips it
 *    (horizontally: overflow hidden/clip/auto/scroll; vertically: hidden/clip).
 * Skipped: SVG artwork, .sr-only / .skip helpers.
 * Keep this function self-contained: it is serialised into the page.
 */
export function auditInPage(): string[] {
  const bad: string[] = [];
  const W = innerWidth;
  const name = (e: Element) => e.tagName.toLowerCase() + (typeof (e as HTMLElement).className === 'string' && (e as HTMLElement).className ? '.' + (e as HTMLElement).className.split(' ')[0] : '');
  const shown = (e: Element) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const skipped = (e: Element) => !!e.closest('svg, .sr-only, .skip');
  const sw = document.documentElement.scrollWidth;
  if (sw > W) bad.push(`document scrollWidth ${sw} > viewport ${W}`);

  for (const e of document.querySelectorAll('body *')) {
    if (skipped(e) || !shown(e)) continue;
    const r = e.getBoundingClientRect();
    if (!r.width || getComputedStyle(e).position === 'fixed') continue;
    if (r.right > W + 0.5 || r.left < -0.5) bad.push(`box ${name(e)} spans ${Math.round(r.left)}..${Math.round(r.right)} of ${W}`);
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    const p = n.parentElement;
    if (!n.textContent!.trim() || !p || skipped(p) || !shown(p)) continue;
    const closed = p.closest('details');
    if (closed && !closed.open && !p.closest('summary')) continue; // content of a collapsed disclosure is not rendered
    const range = document.createRange();
    range.selectNodeContents(n);
    const label = `"${n.textContent!.trim().slice(0, 24)}"`;
    for (const r of range.getClientRects()) {
      if (!r.width) continue;
      if (r.right > W + 0.5 || r.left < -0.5) { bad.push(`text ${label} outside viewport (${Math.round(r.left)}..${Math.round(r.right)})`); break; }
      let clipped = '';
      for (let a: Element | null = p; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        const ar = a.getBoundingClientRect();
        const hx = cs.overflowX !== 'visible', vy = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
        if (hx && (r.right > ar.right + 0.5 || r.left < ar.left - 0.5)) { clipped = `${name(a)} horizontally`; break; }
        if (vy && (r.bottom > ar.bottom + 0.5 || r.top < ar.top - 0.5)) { clipped = `${name(a)} vertically`; break; }
      }
      if (clipped) { bad.push(`text ${label} clipped by ${clipped}`); break; }
    }
  }

  for (const c of document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea')) {
    if (skipped(c) || !shown(c)) continue;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.right > W + 0.5 || r.left < -0.5) bad.push(`control ${name(c)} outside viewport (${Math.round(r.left)}..${Math.round(r.right)})`);
  }
  return [...new Set(bad)];
}
