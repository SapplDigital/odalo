/* Odalo signature motion prototype: one scroll-driven assembly.
 * Normal page scrolling is the only trigger. The script never captures wheel/touch input and never moves the scroll position
 * (except the optional Replay button, which scrolls back with the browser's own scrolling). Every frame is a pure function of
 * the scroll position, so reverse scrolling, resizing and jumping all land in the right state.
 *
 *   Approach   0.00 - 0.30  four tile bodies and four pictures drift in, still apart
 *   Assembly   0.30 - 0.76  bodies dock edge to edge (contact: neighbour recoils, seam sparks), pictures lift and land in them
 *   Resolution 0.76 - 1.00  the four-quarter joint closes where all four meet, labels appear on the finished surfaces
 *
 * Without JavaScript, or with reduced motion, or in a viewport too short for the stage, nothing here runs: the page shows
 * the finished composition (the CSS puts every piece in its final slot).
 */
(() => {
  'use strict';
  const doc = document.documentElement;
  const sec = document.querySelector('[data-proto]');
  if (!sec) return;
  const run = sec.querySelector('.proto__run');
  const stage = sec.querySelector('.proto__stage');
  const board = sec.querySelector('[data-board]');
  const replay = sec.querySelector('[data-replay]');
  const steps = [...sec.querySelectorAll('[data-step]')];
  const ids = ['web', 'local', 'video', 'ads'];
  const q = (kind, id) => board.querySelector(`[data-piece="${kind}"][data-id="${id}"]`);
  const plates = Object.fromEntries(ids.map((i) => [i, q('plate', i)]));
  const cards = Object.fromEntries(ids.map((i) => [i, q('card', i)]));
  const labels = Object.fromEntries(ids.map((i) => [i, q('label', i)]));
  const emblem = board.querySelector('[data-piece="emblem"]');
  const ring = board.querySelector('[data-piece="ring"]');
  const seams = Object.fromEntries(['a', 'b', 'c', 'd'].map((s) => [s, board.querySelector(`[data-seam="${s}"]`)]));
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqWide = matchMedia('(min-width: 64em)');
  /* the same conditions as the live block in proto.css */
  const mqLive = matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 64em) and (min-height: 520px), (prefers-reduced-motion: no-preference) and (max-width: 63.99em) and (min-height: 600px)');

  /* ---------- choreography ---------- */
  const T = {
    pre: 0.3, hold: 0.92, // scroll fraction at which p reaches 1 (the rest is a short dwell on the finished mosaic)
    plate: { web: [0.30, 0.46], local: [0.38, 0.54], video: [0.46, 0.62], ads: [0.54, 0.70] },
    card: { web: [0.52, 0.64], local: [0.56, 0.68], video: [0.60, 0.72], ads: [0.64, 0.76] },
    emblem: [0.76, 0.82], ring: [0.78, 0.86],
    label: { web: [0.86, 0.92], local: [0.88, 0.94], video: [0.90, 0.96], ads: [0.92, 0.98] },
    seam: { a: 0.54, b: 0.62, c: 0.70, d: 0.70 }, // when the piece that closes each shared edge docks
  };
  /* start poses: centre as a fraction of the board, rotation (deg, never more than 8) and scale */
  const START = {
    wide: {
      plate: { web: { c: [0.22, 0.20], r: -5, s: 0.8 }, local: { c: [0.86, 0.19], r: 4, s: 0.8 }, video: { c: [0.22, 0.83], r: 5, s: 0.8 }, ads: { c: [0.84, 0.85], r: -4, s: 0.8 } },
      card: { web: { c: [0.41, 0.41], r: -8, s: 1.0 }, local: { c: [0.60, 0.37], r: 6, s: 1.0 }, video: { c: [0.43, 0.63], r: 5, s: 1.0 }, ads: { c: [0.60, 0.62], r: -7, s: 1.0 } },
      nudge: 0.006,
    },
    tall: {
      plate: { web: { c: [0.22, 0.19], r: -5, s: 0.8 }, local: { c: [0.80, 0.18], r: 4, s: 0.8 }, video: { c: [0.20, 0.82], r: 5, s: 0.8 }, ads: { c: [0.80, 0.83], r: -4, s: 0.8 } },
      card: { web: { c: [0.40, 0.36], r: -8, s: 1.45 }, local: { c: [0.62, 0.43], r: 6, s: 1.45 }, video: { c: [0.38, 0.62], r: 5, s: 1.45 }, ads: { c: [0.62, 0.66], r: -7, s: 1.45 } },
      nudge: 0.02,
    },
  };
  /* who recoils when a plate docks: [neighbour, direction away from the arriving plate] */
  const CONTACT = { local: [['web', -1, 0]], video: [['web', 0, -1]], ads: [['local', 0, -1], ['video', -1, 0]] };
  const INNER = 26; // px: inner corner radius while a body is still apart; 0 once it has docked

  /* ---------- easing ---------- */
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeIO = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOutBack = (t) => { t = clamp(t); const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const seg = (p, w) => clamp((p - w[0]) / (w[1] - w[0]));

  /* ---------- state ---------- */
  let live = false, W = 0, H = 0, wide = true, scrub = 1, stageH = 1, lastP = -1, queued = false, nudgeA = 0;
  const geo = { plate: {}, card: {} };
  const cache = new WeakMap();
  const set = (el, key, val) => { let c = cache.get(el); if (!c) cache.set(el, (c = {})); if (c[key] !== val) { c[key] = val; return true; } return false; };
  const sty = (el, prop, val) => { if (set(el, prop, val)) el.style.setProperty(prop, val); };
  const tf = (el, val) => { if (set(el, 'tf', val)) el.style.transform = val; };
  const zi = (el, val) => { if (set(el, 'z', val)) el.style.zIndex = val; };
  const op = (el, val) => { if (set(el, 'op', val)) el.style.opacity = val; };

  function measure() {
    W = board.offsetWidth; H = board.offsetHeight;
    wide = mqWide.matches;
    const S = START[wide ? 'wide' : 'tall'];
    nudgeA = S.nudge;
    for (const kind of ['plate', 'card']) for (const id of ids) {
      const el = (kind === 'plate' ? plates : cards)[id];
      const st = S[kind][id];
      const cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
      geo[kind][id] = { dx: st.c[0] * W - cx, dy: st.c[1] * H - cy, r: st.r, s: st.s };
    }
    stageH = stage.offsetHeight;
    scrub = Math.max(1, run.offsetHeight - stageH);
  }

  const progress = () => {
    const top = run.getBoundingClientRect().top;
    return clamp((-top / scrub) / T.hold);
  };

  /* fraction of the way from the start pose to the slot: a gentle drift during the approach, then the docking move */
  const PRE = { plate: 0.22, card: 0.12 };
  const travel = (kind, p, win) => PRE[kind] * easeIO(p / T.pre) + (1 - PRE[kind]) * easeIO(seg(p, win));
  const nudgeAt = (p, t1) => { const u = (p - t1) / 0.06; return u <= 0 || u >= 1 ? 0 : 6.75 * u * Math.pow(1 - u, 2); };

  function render(p) {
    lastP = p;
    const t0 = window.__protoMeasure ? performance.now() : 0;
    const stageIdx = p < T.pre ? 0 : p < 0.76 ? 1 : 2;
    sty(stage, '--p', p.toFixed(4));
    sty(stage, '--em', (0.6 + 0.4 * smooth((p - 0.76) / 0.14)).toFixed(3));
    steps.forEach((s, i) => { const on = i === stageIdx; if (set(s, 'cur', on)) { if (on) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); } });
    tf(board, `scale(${(0.94 + 0.06 * smooth(p / 0.7)).toFixed(4)})`);

    const recoil = {}; // plate id -> [dx, dy] added while a neighbour docks
    for (const id of ids) for (const [n, dx, dy] of CONTACT[id] || []) {
      const a = nudgeAt(p, T.plate[id][1]);
      if (a) { const r = (recoil[n] ||= [0, 0]); r[0] += dx * a * nudgeA * W; r[1] += dy * a * nudgeA * W; }
    }

    ids.forEach((id, order) => {
      const pl = plates[id], g = geo.plate[id];
      const f = travel('plate', p, T.plate[id]);
      const moving = p > T.plate[id][0] && p < T.plate[id][1];
      const rc = recoil[id] || [0, 0];
      tf(pl, `translate3d(${(g.dx * (1 - f) + rc[0]).toFixed(1)}px,${(g.dy * (1 - f) + rc[1]).toFixed(1)}px,0) rotate(${(g.r * (1 - f)).toFixed(2)}deg) scale(${(g.s + (1 - g.s) * f).toFixed(4)})`);
      sty(pl, '--sh', (1 - smooth((f - 0.72) / 0.28)).toFixed(3));
      sty(pl, '--in', (INNER * (1 - smooth((f - 0.8) / 0.2))).toFixed(1) + 'px');
      zi(pl, moving ? 20 + order : 10 + order);

      const cd = cards[id], c = geo.card[id];
      const fc = travel('card', p, T.card[id]);
      const u = seg(p, T.card[id]);
      const lift = Math.sin(Math.PI * u) * (wide ? 0.05 : 0.04) * H; // lifts, then lands: the layering reads as depth
      const cm = p > T.card[id][0] && p < T.card[id][1];
      tf(cd, `translate3d(${(c.dx * (1 - fc) + rc[0] * fc).toFixed(1)}px,${(c.dy * (1 - fc) - lift + rc[1] * fc).toFixed(1)}px,0) rotate(${(c.r * (1 - fc)).toFixed(2)}deg) scale(${(c.s + (1 - c.s) * fc).toFixed(4)})`);
      sty(cd, '--sh', (1 - smooth((fc - 0.8) / 0.2)).toFixed(3));
      zi(cd, cm ? 60 + order : 40 + order);

      op(labels[id], smooth(seg(p, T.label[id])).toFixed(3));
    });

    for (const [k, t1] of Object.entries(T.seam)) {
      const u = clamp((p - (t1 - 0.012)) / 0.072);
      const vertical = k === 'a' || k === 'c';
      op(seams[k], (u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 1.5) : 0).toFixed(3));
      tf(seams[k], vertical ? `scaleY(${smooth(u * 2).toFixed(3)})` : `scaleX(${smooth(u * 2).toFixed(3)})`);
    }
    const ue = seg(p, T.emblem);
    op(emblem, ue > 0 ? '1' : '0');
    tf(emblem, `scale(${ue > 0 ? easeOutBack(ue).toFixed(4) : 0})`);
    const ur = seg(p, T.ring);
    op(ring, ur > 0 && ur < 1 ? (0.55 * (1 - ur)).toFixed(3) : '0');
    tf(ring, `scale(${(1 + 1.4 * easeIO(ur)).toFixed(3)})`);
    if (t0) (window.__protoStats ||= []).push(performance.now() - t0);
  }

  function clearInline() {
    stage.style.removeProperty('--p'); stage.style.removeProperty('--em'); board.style.transform = '';
    for (const el of [...Object.values(plates), ...Object.values(cards), ...Object.values(labels), ...Object.values(seams), emblem, ring]) { el.removeAttribute('style'); cache.delete(el); }
    steps.forEach((s) => s.removeAttribute('aria-current'));
    cache.delete(stage); cache.delete(board);
  }

  function tick() {
    queued = false;
    if (!live) return;
    const p = progress();
    if (Math.abs(p - lastP) > 1e-5) render(p);
  }
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(tick); } };

  function setMode() {
    doc.classList.remove('proto-off'); // let the CSS decide first, then check the result
    const ok = mqLive.matches;
    if (!ok && live) clearInline();
    live = ok;
    if (live) {
      measure();
      /* a stage that would squeeze the board below a readable size is not worth animating: show the finished composition instead */
      if (!wide && W < 270) { live = false; doc.classList.add('proto-off'); clearInline(); }
      else { lastP = -1; render(progress()); }
    }
    doc.dataset.proto = live ? 'live' : 'static';
    doc.classList.add('proto-ready');
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', setMode);
  mqReduce.addEventListener('change', setMode);
  mqWide.addEventListener('change', setMode);
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (live) { measure(); lastP = -1; request(); } }).observe(board);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) { measure(); lastP = -1; request(); } });

  if (replay) replay.addEventListener('click', () => {
    const top = run.getBoundingClientRect().top + scrollY;
    scrollTo({ top, behavior: mqReduce.matches ? 'auto' : 'smooth' });
  });

  setMode();
  /* review hooks (used by the recording and measurement scripts; harmless otherwise) */
  window.__odaloProto = { get p() { return lastP; }, get live() { return live; }, scrollFor: (p) => run.getBoundingClientRect().top + scrollY + p * T.hold * scrub, T };
})();
