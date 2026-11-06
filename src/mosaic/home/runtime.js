// Compact homepage mosaic runtime. One irregular, fitted polygon mosaic (power diagram, geom.js) behind and around the text pieces.
//  - Rest: deterministic seeds (layout.js) -> static polygons. Nothing moves on its own.
//  - Decorative hover: INSTANT. The piece under a fine pointer gets ~1.1x linear size (weight bump 0.8*rho^2); neighbours yield. Hit-testing uses the
//    REST polygons, so the target never moves under the pointer.
//  - Content: click / Enter / Space on a closed piece opens it in place (its cell grows, what is below shifts down). Close or Escape collapses it and
//    returns focus to its button. Clicks and selection inside revealed text never close it. Native links stay native. Link pieces follow their link.
//  - Without JavaScript the CSS shows a plain stack with every detail visible (this file is then never loaded).
import { layout, stateSeeds, stateH, power, colorize, outerDecor } from './layout.js';
import { regionPolys } from '../field.js';
import { resample, lerpPoly, inside, pts, inscribed, area, crop } from './geom.js';

const NS = 'http://www.w3.org/2000/svg', MARGIN = 14, MORPH_MS = 360, EXTRA = 800;

export function mountMosaic(canvas) {
  const $ = (s, r = canvas) => r.querySelector(s);
  const stage = canvas.parentElement, root = canvas.closest('[data-hm-root]'), svg = root.querySelector('.pg-field'), regEls = [...root.querySelectorAll('[data-fr]')];
  const hdrMq = matchMedia('(max-width: 69.99em)'); // below this the header menu is a panel of its own (opaque), not part of the field
  const allBoxes = [...canvas.querySelectorAll('.hm-box')];
  let boxes = allBoxes; // the phone layout has no link pieces (they become a row of native links), so only the first nContent boxes take part
  const wideMq = matchMedia('(min-width: 64em)'), reducedMq = matchMedia('(prefers-reduced-motion: reduce)'), fineMq = matchMedia('(hover: hover) and (pointer: fine)');
  let L, V, k = 1, lastPgH = 0, lastSig = '', nS = 0, cur = -1, dH = 0, cells = [], rest = null, shown = null, hov = -1, busy = false, raf = 0, live = false, builtW = 0, lastRefit = 0;
  const isLink = (i) => boxes[i].dataset.kind === 'link', isOpenable = (i) => !!$('.hm-toggle', boxes[i]);

  const inside4 = (r, p) => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]].every(([x, y]) => inside(p, x, y));
  const frameBox = () => { const c = canvas.getBoundingClientRect(), p = root.getBoundingClientRect(); return [(p.left - c.left) / k, (p.top - c.top) / k, (p.right - c.left) / k, (p.bottom - c.top) / k]; };
  const regionPolysNow = () => regionPolys(regEls, canvas.getBoundingClientRect(), k, hdrMq.matches);
  let bump = []; // per-piece weight scale for the current open state (a piece whose text overflowed its new cell)
  const data = (o) => { // everything that describes the mosaic while piece o is open (-1: at rest)
    const H = stateH(L, o, dH); canvas.style.height = H * k + 'px'; // the flow below the canvas (fold, footer) moves with it: measure after this
    const seeds = stateSeeds(L, o, dH, bump), box = frameBox();
    const polys = power(seeds, 0, 0, box), within = (b) => crop(polys[b], 0, 0, L.W, H); // text stays inside the canvas column, not in the side margins
    const rects = boxes.map((_, b) => {
      if (o < 0 || b === o) return inscribed(within(b), MARGIN);
      const f = { ...rest.rects[b], x: rest.rects[b].x + (seeds[b].x - L.seeds[b].x), y: rest.rects[b].y + (seeds[b].y - L.seeds[b].y) }; // same piece, moved with its seed
      return L.seeds[b].service && L.grid || !inside4(f, polys[b]) ? inscribed(within(b), MARGIN) : f;
    });
    return { seeds, H, polys: polys.concat(regionPolysNow()), rects, box };
  };
  function place(rects, H) {
    boxes.forEach((b, i) => { const r = rects[i]; Object.assign(b.style, { left: r.x * k + 'px', top: r.y * k + 'px', width: r.w * k + 'px', height: r.h * k + 'px' }); });
    canvas.style.height = H * k + 'px'; const [x0, y0, x1, y1] = frameBox(); svg.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
  }
  const paint = (polys) => polys.forEach((p, i) => cells[i].setAttribute('points', p.length > 2 ? pts(p) : ''));
  const setLabel = (b, on) => { const t = $('.hm-toggle', b); if (!t) return; t.setAttribute('aria-expanded', String(on)); $('.hm-tl', t).textContent = on ? t.dataset.close : t.dataset.open; };
  const over = (b) => b.scrollHeight - b.clientHeight > 1 || b.scrollWidth - b.clientWidth > 1;

  // Decorative cells first, then the information pieces, then the header/fold/footer tiles: the thin decorative seams never overdraw the stronger outline of a content piece.
  const paintOrder = () => [...cells.filter((_, i) => i < nS && !L.seeds[i].content), ...cells.filter((_, i) => i < nS && L.seeds[i].content), ...cells.slice(nS)];
  function build() {
    root.classList.add('hm-live'); live = true; canvas.classList.remove('hm-compact'); canvas.classList.remove('hm-morphing');
    V = wideMq.matches ? 'wide' : 'narrow'; stage.dataset.v = V; L = layout(V); boxes = allBoxes.slice(0, L.nContent); allBoxes.forEach((b) => { b.style.display = boxes.includes(b) ? '' : 'none'; }); cur = -1; dH = L.dH; hov = -1;
    k = canvas.clientWidth / L.W; L.k = k; canvas.style.setProperty('--k', k); canvas.style.height = L.H * k + 'px';
    // the page round the canvas: small decorative seeds everywhere the canvas does not reach, plus one seed per marked header/fold/footer element
    const [fx0, fy0, fx1, fy1] = frameBox();
    L.seeds = L.seeds.concat(outerDecor(L, [fx0, fy0, fx1, fy1 + EXTRA / k], L.H)); nS = L.seeds.length;
    const mk = (cls) => { const p = document.createElementNS(NS, 'polygon'); p.setAttribute('class', cls); return p; };
    cells = [...L.seeds.map((s) => mk(`hm-cell hm-f-${s.color}${s.content ? ' hm-cell--c' : ''}`)), ...regEls.map((el) => mk(`hm-cell hm-cell--r hm-f-${el.dataset.fr}`))]; // the tiles of header/fold/footer elements sit on top
    svg.replaceChildren(...paintOrder());
    boxes.forEach((b) => { b.classList.remove('is-open', 'is-hot'); b.style.height = ''; const t = $('.hm-toggle', b); if (t) { t.hidden = false; setLabel(b, false); } });
    for (let n = 0; n < 8; n++) {
      rest = null; rest = { rects: boxes.map(() => null) }; rest = data(-1);
      place(rest.rects, L.H);
      const bad = boxes.map((b, i) => (over(b) ? i : -1)).filter((i) => i >= 0);
      if (!bad.length) break;
      bad.forEach((i) => { L.seeds[i].w *= 1.14; });
    }
    if (boxes.some(over)) { window.__hmOver = boxes.map((b, i) => [i, b.scrollHeight - b.clientHeight, b.scrollWidth - b.clientWidth]).filter((x) => x[1] > 1 || x[2] > 1); return false; } // honest fallback: the text cannot fit this geometry at readable sizes
    L.seeds.forEach((x) => { if (!x.content) delete x.color; });
    colorize(L.seeds, rest.polys.slice(0, nS)); // decorative colours are chosen once, for the whole page
    L.seeds.forEach((x, i) => cells[i].setAttribute('class', `hm-cell hm-f-${x.color}${x.content ? ' hm-cell--c' : ` hm-t${Math.floor(x.pick * 3) % 3}`}`)); // decorative cells: one of three flat tonal steps, fixed by the seed
    shown = { polys: rest.polys, rects: rest.rects, H: L.H, seeds: rest.seeds, box: rest.box }; builtW = canvas.clientWidth; lastPgH = root.offsetHeight; lastSig = regSig();
    paint(rest.polys); place(rest.rects, L.H); report(); return true;
  }

  /** The stable flowing fallback: every piece is a plain card in the page flow with its details visible (the same layout as before the script runs). Never clips. */
  function fallback(why = '') {
    window.__hmWhy = why + ' @' + canvas.clientWidth + ' cur=' + cur;
    cancelAnimationFrame(raf); busy = false; canvas.classList.remove('hm-morphing'); live = false; cur = -1;
    root.classList.remove('hm-live'); canvas.classList.remove('hm-compact'); canvas.style.height = ''; svg.replaceChildren();
    allBoxes.forEach((b) => { b.removeAttribute('style'); b.classList.remove('is-open', 'is-hot'); const t = $('.hm-toggle', b); if (t) t.hidden = true; });
    window.__hm = { live: false, cur: -1, V, H: 0, over: [] };
  }

  /** Open piece o: grow dH until its whole text fits the inscribed rectangle of its cell and every other piece still fits its own cell
   *  (a piece that overflows gets a bigger weight; only ever growing, so this settles). Returns the state, or null when it cannot fit. */
  function fitOpen(o) {
    canvas.classList.remove('hm-compact');
    // Narrow canvases keep the readable 17px text, so the other pieces may not have room for their sentence while one is open: they then show name + button only (the sentence is back when it closes).
    return fitOpenTry(o) ?? (canvas.classList.add('hm-compact'), fitOpenTry(o));
  }
  function fitOpenTry(o) {
    const b = boxes[o]; b.classList.add('is-open'); dH = L.dH; bump = [];
    let prev = null;
    for (let n = 0; n < 14; n++) {
      const d = data(o), r = d.rects[o];
      place(d.rects, d.H);
      b.style.height = 'auto'; const need = b.offsetHeight / k; b.style.height = r.h * k + 'px';
      if (need > r.h + 0.5) {
        const slope = prev && Math.abs(dH - prev.dH) > 1 ? Math.max(0.2, (r.h - prev.h) / (dH - prev.dH)) : 0.7; // inscribed height gained per unit of dH
        prev = { dH, h: r.h }; dH += (need - r.h) / slope + 8; continue;
      }
      const bad = boxes.map((x, i) => (i !== o && over(x) ? i : -1)).filter((i) => i >= 0);
      if (!bad.length) return d;
      bad.forEach((i) => { bump[i] = (bump[i] || 1) * 1.15; });
    }
    return null;
  }

  let autoScroll = null; // { y0, y1 }: the page scroll that goes with the current morph (a click opened a piece that is not fully in view)
  function go(o, instant = false, reveal = false) { // o: piece to show open (-1 = none); reveal: a click opened it, scroll the page along with the morph
    if (!live || busy || o === cur) return;
    autoScroll = null; // any new state change replaces an earlier auto scroll
    const prev = cur, from = { polys: shown.polys.map((p) => resample(p)), rects: shown.rects.map((r) => ({ ...r })), H: shown.H };
    if (prev >= 0) { boxes[prev].classList.remove('is-open'); setLabel(boxes[prev], false); }
    let to;
    if (o >= 0) { to = fitOpen(o); if (!to) { fallback('open-fit'); return; } setLabel(boxes[o], true); } else to = rest;
    // fitOpen has just laid the page out in its FINAL state, so the destination is measured once, here, from real geometry (nothing is measured per frame)
    if (reveal && o >= 0) {
      const r = boxes[o].getBoundingClientRect(), t = $('.hm-toggle', boxes[o]).getBoundingClientRect();
      if (!(r.top >= 0 && t.bottom <= innerHeight)) autoScroll = { y0: scrollY, y1: Math.min(Math.max(0, scrollY + r.top - 24), document.documentElement.scrollHeight - innerHeight) };
    }
    cur = o; hov = -1; hotOff(); if (o < 0) canvas.classList.remove('hm-compact');
    const toR = to.polys.map((p) => resample(p));
    const finish = () => { shown = { polys: to.polys, rects: to.rects, H: to.H, seeds: to.seeds, box: to.box }; lastPgH = root.offsetHeight; lastSig = regSig(); paint(to.polys); place(to.rects, to.H); busy = false; canvas.classList.remove('hm-morphing'); report(); if (autoScroll) { scrollTo({ top: autoScroll.y1, behavior: 'instant' }); autoScroll = null; }
      // the scale may have moved while this state was away (scrollbar, resize): if the text no longer fits, re-fit once
      if (live && boxes.some(over) && performance.now() - lastRefit > 300) requestAnimationFrame(refit);
    };
    if (instant || reducedMq.matches) { finish(); return; }
    busy = true; canvas.classList.add('hm-morphing'); const t0 = performance.now(); // while the pieces morph, a piece's already laid-out text is clipped to its (still growing) box instead of spilling over its neighbours
    const step = (now) => {
      const t = Math.min(1, (now - t0) / MORPH_MS), e = 1 - Math.pow(1 - t, 3);
      paint(from.polys.map((p, i) => lerpPoly(p, toR[i], e)));
      place(from.rects.map((r, i) => ({ x: r.x + (to.rects[i].x - r.x) * e, y: r.y + (to.rects[i].y - r.y) * e, w: r.w + (to.rects[i].w - r.w) * e, h: r.h + (to.rects[i].h - r.h) * e })), from.H + (to.H - from.H) * e);
      if (autoScroll) scrollTo({ top: autoScroll.y0 + (autoScroll.y1 - autoScroll.y0) * e, behavior: 'instant' }); // same progress and easing as the pieces
      if (t < 1) raf = requestAnimationFrame(step); else finish();
    };
    raf = requestAnimationFrame(step);
  }

  // ---- pointer: instant decorative hover on the REST polygons ----
  const hit = (e) => { const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, at = (i) => shown.polys[i].length > 2 && inside(shown.polys[i], x, y); for (let i = shown.polys.length - 1; i >= nS; i--) if (at(i)) return i; return shown.polys.findIndex((p, i) => i < nS && at(i)); };
  function hotOff() { svg.querySelector('.is-hot')?.classList.remove('is-hot'); boxes.forEach((b) => b.classList.remove('is-hot')); }
  function hover(i) {
    if (i === hov) return; hov = i;
    if (i < 0) { paint(shown.polys); return; }
    const rho = Math.sqrt(Math.abs(area(shown.polys[i])) / Math.PI);
    const seeds = shown.seeds.map((s, j) => (j === i ? { ...s, w: s.w + 0.8 * rho * rho } : s));
    paint(power(seeds, 0, 0, shown.box).concat(shown.polys.slice(nS)));
  }
  root.addEventListener('pointermove', (e) => {
    if (!live || e.pointerType !== 'mouse' || !fineMq.matches || busy) return;
    const i = hit(e), n = L.nContent;
    hotOff();
    if (i >= nS) { canvas.style.cursor = ''; hover(-1); return; } // a header/fold/footer tile: nothing grows
    const hot = i >= 0 && i < n && i !== cur && (isLink(i) || isOpenable(i));
    if (hot) { cells[i].classList.add('is-hot'); boxes[i].classList.add('is-hot'); canvas.style.cursor = 'pointer'; } else canvas.style.cursor = '';
    if (cur >= 0) { hover(-1); return; } // calm while a piece is open
    hover(i >= n ? i : -1);
  });
  root.addEventListener('pointerleave', () => { hotOff(); hover(-1); canvas.style.cursor = ''; });

  canvas.addEventListener('click', (e) => {
    if (!live || e.target.closest('a')) return; // native links
    const tg = e.target.closest('.hm-toggle');
    if (tg) { const o = boxes.indexOf(tg.closest('.hm-box')); go(cur === o ? -1 : o, false, cur !== o); tg.focus({ preventScroll: true }); return; }
    if (busy || e.target.closest('.hm-box.is-open')) return; // an open piece ignores clicks on its text
    const i = hit(e);
    if (i < 0 || i >= L.nContent || i === cur) return;
    if (isLink(i)) { $('a', boxes[i]).click(); return; }
    if (isOpenable(i)) { go(i, false, true); $('.hm-toggle', boxes[i]).focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', (e) => { if (live && e.key === 'Escape' && cur >= 0 && !busy) { const b = boxes[cur]; go(-1); $('.hm-toggle', b).focus({ preventScroll: true }); } });
  // the user takes over the scroll: only the automatic scroll stops, the morph carries on
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { autoScroll = null; }, { passive: true }));
  addEventListener('keydown', (e) => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) autoScroll = null; });

  // ---- sizing ----
  /** Rebuild at the current width and put the open piece back (instantly) when one was open. */
  function refit() {
    const o = cur; cancelAnimationFrame(raf); busy = false; lastRefit = performance.now();
    if (!build()) { fallback(); return; }
    if (o >= 0 && isOpenable(o)) go(o, true);
  }
  // Same-breakpoint resize: small changes just scale; a meaningful width change (24px+) or any text that now overflows re-fits the text (min font sizes and wrapping do not scale).
  /** Same state, new page geometry (a disclosure opened, fonts arrived): re-measure the header/fold/footer cells and repaint, instantly. */
  function reflow() {
    const d = data(cur); shown = { polys: d.polys, rects: d.rects, H: d.H, seeds: d.seeds, box: d.box }; if (cur < 0) rest = d;
    paint(d.polys); place(d.rects, d.H); lastPgH = root.offsetHeight; lastSig = regSig(); report();
  }
  // Region elements (header, disclosure summaries and open panels, footer blocks) are observed too: opening a SHORTER disclosure while a taller sibling stays open leaves the page
  // height unchanged (and a closed panel keeps its laid-out size, so even its own box does not change): the root alone would never notice that a new panel needs its tile. The signature is a few rectangles; reflow only runs when it really changed.
  const regSig = () => regEls.map((e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}${e.closest('details')?.open ? 'o' : ''}`; }).join('|'); // open state counts: a closed panel keeps its laid-out size, so opening it changes no rectangle
  const roRef = new ResizeObserver(() => {
    if (!live) return;
    const w = canvas.clientWidth, nk = w / L.W, calm = performance.now() - lastRefit > 300;
    if (Math.abs(w - builtW) >= 24 && calm) { refit(); return; }
    if (busy) return;
    if (Math.abs(nk - k) >= 1e-4) {
      k = nk; L.k = k; canvas.style.setProperty('--k', k);
      place(shown.rects, shown.H);
      if (boxes.some(over) && calm) { refit(); return; }
    } else if (Math.abs(root.offsetHeight - lastPgH) < 1 && regSig() === lastSig) return;
    reflow();
  });
  roRef.observe(root); regEls.forEach((e) => roRef.observe(e));
  root.addEventListener('toggle', () => { if (live && !busy && regSig() !== lastSig) reflow(); }, true); // native disclosure events do not bubble: capture
  wideMq.addEventListener('change', () => { cancelAnimationFrame(raf); busy = false; try { if (!build()) fallback(); } catch (e) { fallback(); } });

  /** Which text boxes overflow their rectangle (window.__hm after each state); also used by the focused checks. */
  function report() { window.__hm = { live, cur, dH, V, H: shown.H, pgH: root.offsetHeight, over: boxes.map((b, i) => ({ i, h: Math.round(b.scrollHeight - b.clientHeight), w: Math.round(b.scrollWidth - b.clientWidth) })) }; }
  // Web fonts arrived after the first fit (text metrics changed): re-fit when something no longer fits, otherwise only re-measure the header/fold/footer cells.
  window.__hmFonts = () => { if (!live || busy) return; if (boxes.some(over)) refit(); else reflow(); };
  window.__hmGo = go; window.__hmShown = () => shown;
  try { if (!build()) fallback('rest-fit'); } catch (e) { fallback('error ' + e); }
}
