// Progressive enhancement only: every page works without this file.
// Search, column sorting, filters kept in the address, pick-to-compare, and print expansion.
// First-party, no network requests, no storage.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  $$('[data-js][hidden]').forEach((el) => el.removeAttribute('hidden'));

  // State lives in the hash as key=value pairs (only when the hash looks like that, so #anchors keep working).
  const read = () => (location.hash.includes('=') ? new URLSearchParams(location.hash.slice(1)) : new URLSearchParams());
  const write = (k, v) => {
    const p = read();
    if (v) p.set(k, v); else p.delete(k);
    const h = p.toString();
    history.replaceState(null, '', h ? `#${h}` : location.pathname + location.search);
  };

  // Hide a group whose rows are all hidden, and show how many rows are visible in it.
  const refreshGroups = () => {
    for (const tb of $$('.overview tbody[data-type]')) {
      const rows = $$('tr[data-slug]', tb);
      const shown = rows.filter((r) => !r.hidden).length;
      tb.classList.toggle('empty', shown === 0);
      const c = tb.querySelector('.group-row .count');
      if (c) c.textContent = shown === rows.length ? String(rows.length) : `${shown} of ${rows.length}`;
    }
  };
  const visible = (tr) => !tr.dataset.hideQ && !tr.dataset.hidePick;
  const apply = () => { for (const tr of $$('.overview tr[data-slug]')) tr.hidden = !visible(tr); refreshGroups(); };

  // Category filter (CSS does the hiding; this keeps it in the address).
  const radios = $$('input[name="t"]');
  const t0 = read().get('type');
  if (t0) { const r = document.getElementById(`t-${t0}`); if (r) r.checked = true; }
  radios.forEach((r) => r.addEventListener('change', () => write('type', r.id === 't-all' ? '' : r.id.slice(2))));

  // Search.
  const q = document.getElementById('q');
  if (q) {
    const count = document.querySelector('.q-count');
    const run = () => {
      const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      const rows = $$('.overview tr[data-slug]');
      for (const tr of rows) {
        const hit = terms.every((t) => tr.dataset.search.includes(t));
        if (hit) { delete tr.dataset.hideQ; n++; } else tr.dataset.hideQ = '1';
      }
      if (count) count.textContent = terms.length ? `${n} of ${rows.length} shown` : '';
      apply();
      write('q', q.value.trim());
    };
    q.value = read().get('q') ?? '';
    q.addEventListener('input', run);
    if (q.value) run();
  }

  // Sortable columns: sort rows within each group; third click restores the default order (chain, then name).
  for (const table of $$('table.sortable')) {
    $$('tr[data-slug]', table).forEach((tr, i) => { tr.dataset.i = i; });
    const ths = $$('thead th[data-sort]', table);
    for (const th of ths) {
      // A separate button, so a heading that is also a link keeps working as a link.
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sort';
      b.setAttribute('aria-label', `Sort by ${th.textContent.trim()}`);
      b.textContent = '↕';
      th.appendChild(b);
      b.addEventListener('click', () => {
        const next = { none: th.dataset.sort === 'text' ? 'ascending' : 'descending', descending: 'ascending', ascending: th.dataset.sort === 'text' ? 'descending' : 'none' }[th.getAttribute('aria-sort') ?? 'none'] ?? 'none';
        ths.forEach((h) => { h.removeAttribute('aria-sort'); h.querySelector('.sort').textContent = '↕'; });
        if (next !== 'none') { th.setAttribute('aria-sort', next); b.textContent = next === 'ascending' ? '↑' : '↓'; }
        const idx = th.cellIndex;
        const key = (tr) => (th.dataset.sort === 'text' ? tr.cells[idx].textContent.trim().toLowerCase() : Number(tr.cells[idx].dataset.v ?? -2));
        for (const tb of $$('tbody', table)) {
          const rows = $$('tr[data-slug]', tb);
          rows.sort((a, b2) => {
            if (next === 'none') return a.dataset.i - b2.dataset.i;
            const [x, y] = [key(a), key(b2)];
            const c = x < y ? -1 : x > y ? 1 : a.dataset.i - b2.dataset.i;
            return next === 'ascending' ? c : -c;
          });
          rows.forEach((r) => tb.appendChild(r));
        }
      });
    }
  }

  // Pick-to-compare.
  const picks = $$('input[name="pick"]');
  if (picks.length) {
    const label = document.querySelector('.pick-n');
    const run = () => {
      const sel = new Set(picks.filter((c) => c.checked).map((c) => c.value));
      for (const tr of $$('.overview tr[data-slug]')) { if (sel.size && !sel.has(tr.dataset.slug)) tr.dataset.hidePick = '1'; else delete tr.dataset.hidePick; }
      if (label) label.textContent = sel.size ? `(${sel.size} chosen)` : '';
      apply();
      write('p', [...sel].join(','));
    };
    const want = new Set((read().get('p') ?? '').split(',').filter(Boolean));
    picks.forEach((c) => { c.checked = want.has(c.value); c.addEventListener('change', run); });
    if (want.size) { run(); const d = document.querySelector('details.picker'); if (d) d.open = true; }
    document.querySelector('.pick-clear')?.addEventListener('click', () => { picks.forEach((c) => { c.checked = false; }); run(); });
  }

  // Print: open every collapsed section, then restore.
  addEventListener('beforeprint', () => $$('details:not([open])').forEach((d) => { d.dataset.printOpened = '1'; d.open = true; }));
  addEventListener('afterprint', () => $$('details[data-print-opened]').forEach((d) => { d.open = false; delete d.dataset.printOpened; }));
})();
