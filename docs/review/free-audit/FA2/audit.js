// FA2 prototype behaviour. Vanilla, no dependencies, NO network: there is no fetch/XHR/beacon/WebSocket anywhere in this file,
// no analytics, and nothing the visitor types is written to storage. The submit path only renders a local simulated result.
(() => {
  const doc = document;
  const root = doc.documentElement;
  root.classList.add('js');
  const T = JSON.parse(doc.getElementById('i18n').textContent);
  const q = new URLSearchParams(location.search);
  if (q.get('theme') === 'alt') root.dataset.theme = 'alt';

  const board = doc.querySelector('[data-board]');
  const pieces = doc.querySelector('[data-pieces]');
  const tiles = [...doc.querySelectorAll('[data-piece]')];
  const form = doc.querySelector('[data-form]');
  const svc = form.elements.namedItem('service');
  const plan = form.elements.namedItem('plan');
  const live = doc.querySelector('[data-live]');
  const clearBtn = doc.querySelector('[data-clear]');
  const sumFocus = doc.querySelector('[data-sum-focus]');
  const sumPlan = doc.querySelector('[data-sum-plan]');

  // ---- state: open = index of the single open tile (-1 none); focus lives in the form <select> (single source of truth) ----------------
  let open = -1;
  const announce = (m) => { live.textContent = ''; live.textContent = m; };

  // Upgrade each tile: heading text becomes a real button (progressive enhancement), reveal JS-only actions.
  tiles.forEach((tile, i) => {
    const h = tile.querySelector('.tile__title');
    const btn = doc.createElement('button');
    btn.type = 'button'; btn.className = 'tile__trigger';
    btn.id = `b-${tile.dataset.piece}`;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `p-${tile.dataset.piece}`);
    btn.textContent = h.textContent;
    h.replaceChildren(btn);
    const cue = doc.createElement('span');
    cue.className = 'tile__cue'; cue.setAttribute('aria-hidden', 'true'); cue.textContent = T.explore;
    tile.querySelector('.tile__short').after(cue);
    tile.querySelector('[data-js-only]').hidden = false;
    tile.dataset.open = 'false';
    btn.addEventListener('click', () => setOpen(open === i ? -1 : i));
    tile.querySelector('[data-include]').addEventListener('click', () => {
      svc.value = svc.value === tile.dataset.piece ? '' : tile.dataset.piece;
      sync(true);
    });
    tile.querySelector('[data-close]').addEventListener('click', () => { setOpen(-1); btn.focus(); });
    // Escape closes while focus is inside this tile; if focus would be lost (it was in the panel), return it to the trigger.
    tile.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || open !== i) return;
      const inPanel = tile.querySelector('.tile__panel').contains(doc.activeElement);
      setOpen(-1);
      if (inPanel) btn.focus();
    });
  });

  function setOpen(i) {
    open = i;
    if (i < 0) pieces.removeAttribute('data-open'); else pieces.dataset.open = String(i);
    tiles.forEach((tile, k) => {
      const on = k === i;
      tile.dataset.open = String(on);
      tile.querySelector('.tile__trigger').setAttribute('aria-expanded', String(on));
    });
    if (i >= 0) announce(T.announceOpen + T.names[tiles[i].dataset.piece]);
  }

  // Selection/summary rendering from the form (the form is the single source; the mosaic mirrors it).
  function sync(fromMosaic) {
    const id = svc.value;
    tiles.forEach((tile) => {
      const on = tile.dataset.piece === id;
      tile.dataset.selected = String(on);
      tile.querySelector('[data-badge]').hidden = !on;
      tile.querySelector('[data-include]').textContent = on ? T.remove : T.include;
    });
    sumFocus.textContent = id ? T.names[id] : T.none;
    sumPlan.textContent = plan.value ? T.plans[plan.value] : T.planNone;
    clearBtn.setAttribute('aria-pressed', String(!id));
    if (fromMosaic) announce(id ? T.announceIn + T.names[id] : T.announceOut);
  }
  clearBtn.hidden = false;
  clearBtn.addEventListener('click', () => { if (svc.value) { svc.value = ''; sync(true); } });
  svc.addEventListener('change', () => sync(false));
  plan.addEventListener('change', () => sync(false));

  // Query preselection with the production IDs. Unknown values are ignored. Plan context is never touched by tile interaction.
  for (const [key, el] of [['service', svc], ['plan', plan]]) {
    const v = q.get(key);
    if (v && [...el.options].some((o) => o.value === v)) el.value = v;
  }
  sync(false);

  // ---- entrance assembly: once, brief, skipped under reduced motion ----------------------------------------------------------------------
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !q.has('still')) {
    board.classList.add('assemble');
    setTimeout(() => board.classList.remove('assemble'), 900);
  }

  // ---- LOCAL SIMULATION of the form. Re-implemented here (not imported) from AuditForm.astro's validation; it never calls submit.ts. ----
  const summary = form.querySelector('[data-summary]');
  const list = summary.querySelector('[data-summary-list]');
  const result = doc.querySelector('[data-result]');
  const btn = form.querySelector('[data-submit]');
  btn.disabled = false;
  const E = T.errors;
  const val = (n) => form.elements.namedItem(n).value.trim();
  const el = (n) => form.elements.namedItem(n);

  function validate() {
    const out = [];
    const email = val('email');
    if (!email) out.push({ id: 'email', msg: E.email });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) out.push({ id: 'email', msg: E.emailInvalid });
    if (!val('name')) out.push({ id: 'name', msg: E.name });
    if (!val('business')) out.push({ id: 'business', msg: E.business });
    if (!val('need')) out.push({ id: 'need', msg: E.need });
    const site = val('website');
    if (site) {
      try { const u = new URL(/^[a-z]+:\/\//i.test(site) ? site : `https://${site}`); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw 0; }
      catch { out.push({ id: 'website', msg: E.websiteInvalid }); }
    }
    if (!el('privacy').checked) out.push({ id: 'privacy', msg: E.privacy });
    return out.sort((a, b) => (el(a.id).compareDocumentPosition(el(b.id)) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }
  function render(errors) {
    for (const n of ['name', 'email', 'business', 'need', 'website', 'privacy']) {
      el(n).removeAttribute('aria-invalid'); doc.getElementById(`e-${n}`).hidden = true;
    }
    list.replaceChildren();
    for (const e of errors) {
      const p = doc.getElementById(`e-${e.id}`); p.textContent = e.msg; p.hidden = false; el(e.id).setAttribute('aria-invalid', 'true');
      const li = doc.createElement('li'); const a = doc.createElement('a');
      a.href = `#f-${e.id}`; a.textContent = e.msg;
      a.addEventListener('click', (ev) => { ev.preventDefault(); el(e.id).focus(); });
      li.append(a); list.append(li);
    }
    summary.hidden = errors.length === 0;
  }
  // Re-validate on input/change only while a field is already flagged; never on blur (no layout shift under a pointer-down).
  const again = (e) => { if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') render(validate()); };
  form.addEventListener('input', again);
  form.addEventListener('change', again);
  form.addEventListener('focusin', (e) => { if (e.target.matches('input, textarea, select')) requestAnimationFrame(() => e.target.scrollIntoView({ block: 'nearest' })); });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // always: this prototype can never submit
    result.hidden = true;
    const errors = validate();
    render(errors);
    if (errors.length) { el(errors[0].id).focus(); return; }
    result.querySelector('[data-result-title]').textContent = T.simH;
    result.querySelector('[data-result-text]').textContent = T.simT;
    result.hidden = false;
    result.focus();
  });
})();
