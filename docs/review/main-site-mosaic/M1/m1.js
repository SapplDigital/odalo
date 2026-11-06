// M1 prototype behaviour. Vanilla, no dependency. Two small jobs:
//  1. one short dock event as the Work field arrives (IntersectionObserver, not scroll-linked, no scroll interception);
//  2. emphasis for the Work cards: fine-pointer hover (resolved against the REST regions, with hysteresis and intent delays) and keyboard focus.
(() => {
  const field = document.querySelector('[data-wf]');
  const board = field && field.querySelector('[data-wf-board]');
  if (!field || !board) return;
  const ledge = field.querySelector('[data-wf-ledge]');
  const cards = [...board.querySelectorAll('[data-wf-card]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const geoLive = () => getComputedStyle(board).getPropertyValue('--geo').trim() === '1'; // CSS decides (width, height, text size) when the shared-edge board exists
  const INTENT_MS = 110;  // deliberate hover before an emphasis starts
  const RESET_MS = 180;   // brief exits do not snap back
  const HYST = 24;        // px: a pointer must be this far past the REST boundary of the current card before another card takes over

  /* ---- 1. dock (ledge and cards separately, so each is seen arriving) ---- */
  const settle = () => { field.dataset.ledge = 'done'; field.dataset.cards = 'done'; };
  const inView = (el, f) => el.getBoundingClientRect().top < innerHeight * f;
  /* A one-shot check on scroll (rAF-throttled, passive): an observer would never fire for an element that was jumped over (End key, link, restored scroll),
     leaving it "pending". Nothing here reads scroll position into geometry; it only flips two flags once. */
  const arm = { ledge: [ledge, 0.9], cards: [board, 0.8] };
  let frame = 0;
  const check = () => {
    frame = 0;
    let waiting = 0;
    for (const [key, [el, f]] of Object.entries(arm)) {
      if (field.dataset[key] === 'done') continue;
      if (inView(el, f)) field.dataset[key] = 'done'; else waiting++;
    }
    if (!waiting) { removeEventListener('scroll', schedule); removeEventListener('resize', schedule); }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
  if (reduce.matches) settle();
  else {
    for (const [key, [el, f]] of Object.entries(arm)) field.dataset[key] = inView(el, f) ? 'done' : 'pending';
    addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule);
  }
  addEventListener('hashchange', settle);
  addEventListener('pageshow', (e) => { if (e.persisted) settle(); });
  reduce.addEventListener('change', () => { if (reduce.matches) settle(); });
  field.addEventListener('focusin', settle);                                   // keyboard arrival never waits for an animation

  /* ---- 2. emphasis ---- */
  let active = '';
  let pending = '';
  let hoverTimer = 0;
  let resetTimer = 0;
  let focusKey = '';
  const set = (key) => {
    active = key;
    if (key) board.dataset.active = key; else delete board.dataset.active;
    cards.forEach((c) => c.classList.toggle('is-active', c.dataset.p === key));
  };
  const rest = () => {
    const cs = getComputedStyle(board);
    return { x: parseFloat(cs.getPropertyValue('--rest-x')) || 0.58333, y: parseFloat(cs.getPropertyValue('--rest-y')) || 0.5 };
  };
  const KEYS = cards.map((c) => c.dataset.p); // [featured, supporting top, supporting bottom]
  /* The pointer is always resolved against the board's RESTING partition (fractions of the stable board box), never against the moving edges. */
  function region(px, py, r) { const b = board.getBoundingClientRect(); const fx = px - b.left, fy = py - b.top; const key = fx < b.width * r.x ? KEYS[0] : fy < b.height * r.y ? KEYS[1] : KEYS[2]; return { key, fx, fy, w: b.width, h: b.height }; }
  function distanceFromRest(key, fx, fy, w, h, r) {
    const box = key === KEYS[0] ? [0, w * r.x, 0, h] : key === KEYS[1] ? [w * r.x, w, 0, h * r.y] : [w * r.x, w, h * r.y, h];
    return Math.max(0, box[0] - fx, fx - box[1], box[2] - fy, fy - box[3]);
  }
  board.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !geoLive() || reduce.matches) return;   // touch and pen never select; short screens and reduced motion keep the plain layout
    if (field.dataset.cards === 'pending') return;                              // geometry is only live once the pieces have docked
    const r = rest();
    const hit = region(e.clientX, e.clientY, r);
    clearTimeout(resetTimer);
    if (hit.key === active) { clearTimeout(hoverTimer); pending = ''; return; }
    if (active && !focusKey && distanceFromRest(active, hit.fx, hit.fy, hit.w, hit.h, r) <= HYST) return; // dead band around the rest edge: keep the current card
    if (pending === hit.key) return;
    pending = hit.key;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { pending = ''; set(hit.key); }, INTENT_MS);
  });
  board.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer); pending = '';
    if (focusKey) return;
    resetTimer = setTimeout(() => set(''), RESET_MS);
  });
  board.addEventListener('focusin', (e) => {
    const card = e.target.closest && e.target.closest('[data-wf-card]');
    if (!card || !e.target.matches(':focus-visible')) return;                   // a mouse press on a link is about to navigate; only keyboard focus emphasises
    clearTimeout(hoverTimer); clearTimeout(resetTimer);
    focusKey = card.dataset.p; set(focusKey);
  });
  board.addEventListener('focusout', (e) => {
    if (e.relatedTarget && board.contains(e.relatedTarget)) return;
    focusKey = '';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => set(''), RESET_MS);
  });
})();
