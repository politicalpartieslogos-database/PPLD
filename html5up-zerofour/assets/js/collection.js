/*
  PPLD Collection Browser -- collection.js
  Internet Archive-style filtering: sidebar checkboxes with live counts,
  dual year-range slider, text search, sort, grid/list toggle, lightbox.
  Depends on data.js being loaded first (provides LOGO_DATA, ALL_COUNTRIES,
  ALL_PARTIES, ALL_YEARS, MIN_YEAR, MAX_YEAR).
*/

(function () {
  'use strict';

  /* Country flag emojis */
  const FLAG = {
    'Austria':        '\uD83C\uDDE6\uD83C\uDDF9',
    'Belgium':        '\uD83C\uDDE7\uD83C\uDDEA',
    'Denmark':        '\uD83C\uDDE9\uD83C\uDDF0',
    'Finland':        '\uD83C\uDDEB\uD83C\uDDEE',
    'France':         '\uD83C\uDDEB\uD83C\uDDF7',
    'Germany':        '\uD83C\uDDE9\uD83C\uDDEA',
    'Greece':         '\uD83C\uDDEC\uD83C\uDDF7',
    'Iceland':        '\uD83C\uDDEE\uD83C\uDDF8',
    'Ireland':        '\uD83C\uDDEE\uD83C\uDDEA',
    'Italy':          '\uD83C\uDDEE\uD83C\uDDF9',
    'Luxembourg':     '\uD83C\uDDF1\uD83C\uDDFA',
    'Netherlands':    '\uD83C\uDDF3\uD83C\uDDF1',
    'Norway':         '\uD83C\uDDF3\uD83C\uDDF4',
    'Portugal':       '\uD83C\uDDF5\uD83C\uDDF9',
    'Spain':          '\uD83C\uDDEA\uD83C\uDDF8',
    'Sweden':         '\uD83C\uDDF8\uD83C\uDDEA',
    'Switzerland':    '\uD83C\uDDE8\uD83C\uDDED',
    'United Kingdom': '\uD83C\uDDEC\uD83C\uDDE7',
  };

  function flag(country) {
    return FLAG[country] ? FLAG[country] + '\u00A0' : '';
  }

  /* State --
     On load, countries is EMPTY (no filter applied = show all).
     Reset also goes to empty (show all). */
  const state = {
    query:     '',
    countries: new Set(),   /* empty = show all */
    parties:   new Set(),   /* empty = show all */
    types:     new Set(['png','jpg','svg','gif','jpeg','webp']),
    yearFrom:  MIN_YEAR,
    yearTo:    MAX_YEAR,
    sort:      'year-asc',
    view:      'grid',
  };

  /* Helpers */
  function matchesEntry(d) {
    if (state.query) {
      const q = state.query.toLowerCase();
      const hay = (d.country + ' ' + d.party + ' ' + d.years.join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.countries.size && !state.countries.has(d.country)) return false;
    if (state.parties.size  && !state.parties.has(d.party))   return false;
    if (!state.types.has(d.ext.toLowerCase())) return false;
    const years = d.years.length ? d.years : (d.year ? [d.year] : []);
    if (years.length) {
      const inRange = years.some(y => y >= state.yearFrom && y <= state.yearTo);
      if (!inRange) return false;
    }
    return true;
  }

  function sortedData(arr) {
    const s = state.sort;
    return [...arr].sort((a, b) => {
      if (s === 'year-asc')    return (a.year||9999) - (b.year||9999);
      if (s === 'year-desc')   return (b.year||0)    - (a.year||0);
      if (s === 'country-asc') return a.country.localeCompare(b.country);
      if (s === 'party-asc')   return a.party.localeCompare(b.party);
      return 0;
    });
  }

  function yearLabel(d) {
    if (!d.years || !d.years.length) return d.year ? String(d.year) : '-';
    if (d.years.length === 1) return String(d.years[0]);
    return d.years[0] + '-' + d.years[d.years.length - 1];
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* Sidebar: Country checkboxes
     Default state: ALL unchecked (meaning "no filter" = show all).
     When a user checks some boxes, only those countries show. */
  function buildCountryList() {
    const el = document.getElementById('fl-country');
    el.innerHTML = '';
    const counts = {};
    LOGO_DATA.forEach(d => { counts[d.country] = (counts[d.country]||0) + 1; });
    ALL_COUNTRIES.forEach(c => {
      const lbl = document.createElement('label');
      lbl.className = 'filter-check';
      lbl.innerHTML =
        '<input type="checkbox" class="country-check" value="' + escHtml(c) + '" /> ' +
        flag(c) + escHtml(c) +
        ' <span class="count">' + (counts[c]||0) + '</span>';
      el.appendChild(lbl);
    });
    el.addEventListener('change', () => {
      const checked = [...el.querySelectorAll('.country-check:checked')].map(cb => cb.value);
      state.countries = new Set(checked); /* empty = show all */
      render();
    });
  }

  /* Sidebar: Party checkboxes (same logic -- unchecked = no filter) */
  function buildPartyList() {
    const el = document.getElementById('fl-party');
    el.innerHTML = '';
    const counts = {};
    LOGO_DATA.forEach(d => { counts[d.party] = (counts[d.party]||0) + 1; });
    ALL_PARTIES.forEach(p => {
      const lbl = document.createElement('label');
      lbl.className = 'filter-check';
      lbl.innerHTML =
        '<input type="checkbox" class="party-check" value="' + escHtml(p) + '" /> ' +
        escHtml(p) +
        ' <span class="count">' + (counts[p]||0) + '</span>';
      el.appendChild(lbl);
    });
    el.addEventListener('change', () => {
      const checked = [...el.querySelectorAll('.party-check:checked')].map(cb => cb.value);
      state.parties = new Set(checked);
      render();
    });
  }

  /* Sidebar: File type */
  function initTypeFilters() {
    document.querySelectorAll('.type-check').forEach(cb => {
      cb.addEventListener('change', () => {
        state.types.clear();
        document.querySelectorAll('.type-check:checked').forEach(c => state.types.add(c.value));
        render();
      });
    });
  }

  /* Year range slider */
  function initYearSlider() {
    const fromEl  = document.getElementById('year-from');
    const toEl    = document.getElementById('year-to');
    const fromLbl = document.getElementById('year-from-label');
    const toLbl   = document.getElementById('year-to-label');
    fromEl.min = toEl.min = MIN_YEAR;
    fromEl.max = toEl.max = MAX_YEAR;
    fromEl.value = MIN_YEAR;
    toEl.value   = MAX_YEAR;
    fromLbl.textContent = MIN_YEAR;
    toLbl.textContent   = MAX_YEAR;

    const wrap      = document.querySelector('.dual-range-wrap');
    const track     = document.createElement('div'); track.id = 'range-track';
    const trackFill = document.createElement('div'); trackFill.id = 'range-track-fill';
    wrap.insertBefore(track, wrap.firstChild);
    wrap.insertBefore(trackFill, wrap.firstChild);

    function updateTrack() {
      const pct = v => (v - MIN_YEAR) / (MAX_YEAR - MIN_YEAR) * 100;
      const l = pct(state.yearFrom), r = pct(state.yearTo);
      trackFill.style.left  = l + '%';
      trackFill.style.width = (r - l) + '%';
    }

    function onSlide() {
      let from = parseInt(fromEl.value), to = parseInt(toEl.value);
      if (from > to) { const t = from; from = to; to = t; }
      state.yearFrom = from; state.yearTo = to;
      fromLbl.textContent = from; toLbl.textContent = to;
      updateTrack();
      render();
    }
    fromEl.addEventListener('input', onSlide);
    toEl.addEventListener('input', onSlide);
    updateTrack();
  }

  /* Collapsible groups */
  function initToggles() {
    document.querySelectorAll('.filter-group-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        const isOpen = !target.classList.contains('collapsed');
        target.classList.toggle('collapsed', isOpen);
        btn.classList.toggle('collapsed', isOpen);
      });
    });
  }

  /* Search */
  function initSearch() {
    const input    = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.query = input.value.trim();
        clearBtn.classList.toggle('visible', state.query.length > 0);
        render();
      }, 180);
    });
    clearBtn.addEventListener('click', () => {
      input.value = ''; state.query = '';
      clearBtn.classList.remove('visible');
      render();
    });
  }

  /* Sort and View */
  function initSortView() {
    document.getElementById('sort-select').addEventListener('change', e => {
      state.sort = e.target.value; render();
    });
    document.getElementById('view-grid').addEventListener('click', () => {
      state.view = 'grid';
      document.getElementById('view-grid').classList.add('active');
      document.getElementById('view-list').classList.remove('active');
      document.getElementById('logo-grid').classList.remove('list-view');
    });
    document.getElementById('view-list').addEventListener('click', () => {
      state.view = 'list';
      document.getElementById('view-list').classList.add('active');
      document.getElementById('view-grid').classList.remove('active');
      document.getElementById('logo-grid').classList.add('list-view');
    });
  }

  /* Reset: clear all checkboxes (= show all), reset year range */
  function resetAll() {
    state.query = '';
    state.countries.clear();
    state.parties.clear();
    state.types = new Set(['png','jpg','svg','gif','jpeg','webp']);
    state.yearFrom = MIN_YEAR;
    state.yearTo   = MAX_YEAR;

    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').classList.remove('visible');

    /* Uncheck everything -- unchecked means "no filter = show all" */
    document.querySelectorAll('.country-check, .party-check').forEach(cb => cb.checked = false);
    document.querySelectorAll('.type-check').forEach(cb => cb.checked = true);

    document.getElementById('year-from').value = MIN_YEAR;
    document.getElementById('year-to').value   = MAX_YEAR;
    document.getElementById('year-from-label').textContent = MIN_YEAR;
    document.getElementById('year-to-label').textContent   = MAX_YEAR;
    const fill = document.getElementById('range-track-fill');
    if (fill) { fill.style.left = '0%'; fill.style.width = '100%'; }
    render();
  }

  document.getElementById('clear-all-btn').addEventListener('click', resetAll);

  /* Active filter tags */
  function renderTags() {
    const wrap = document.getElementById('active-tags');
    wrap.innerHTML = '';
    function tag(label, onRemove) {
      const span = document.createElement('span');
      span.className = 'active-tag';
      const btn = document.createElement('button');
      btn.innerHTML = '&times;';
      btn.title = 'Remove filter';
      btn.addEventListener('click', onRemove);
      span.textContent = label + ' ';
      span.appendChild(btn);
      wrap.appendChild(span);
    }
    if (state.query) {
      tag('Search: ' + state.query, () => {
        state.query = '';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear').classList.remove('visible');
        render();
      });
    }
    if (state.countries.size) {
      state.countries.forEach(c => {
        tag(flag(c) + c, () => {
          state.countries.delete(c);
          const cb = document.querySelector('.country-check[value="' + CSS.escape(c) + '"]');
          if (cb) cb.checked = false;
          render();
        });
      });
    }
    if (state.parties.size) {
      state.parties.forEach(p => {
        tag(p, () => {
          state.parties.delete(p);
          const cb = document.querySelector('.party-check[value="' + CSS.escape(p) + '"]');
          if (cb) cb.checked = false;
          render();
        });
      });
    }
    if (state.yearFrom !== MIN_YEAR || state.yearTo !== MAX_YEAR) {
      tag(state.yearFrom + '-' + state.yearTo, () => {
        state.yearFrom = MIN_YEAR; state.yearTo = MAX_YEAR;
        document.getElementById('year-from').value = MIN_YEAR;
        document.getElementById('year-to').value   = MAX_YEAR;
        document.getElementById('year-from-label').textContent = MIN_YEAR;
        document.getElementById('year-to-label').textContent   = MAX_YEAR;
        const fill = document.getElementById('range-track-fill');
        if (fill) { fill.style.left='0%'; fill.style.width='100%'; }
        render();
      });
    }
    ['png','jpg','svg'].filter(t => !state.types.has(t)).forEach(t => {
      tag('No ' + t.toUpperCase(), () => {
        state.types.add(t);
        document.querySelector('.type-check[value="' + t + '"]').checked = true;
        render();
      });
    });
  }

  /* Grid render */
  function renderGrid(filtered) {
    const grid  = document.getElementById('logo-grid');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';
    if (!filtered.length) { empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    filtered.forEach(d => {
      const card = document.createElement('div');
      card.className = 'logo-card';
      card.tabIndex  = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', d.party + ', ' + d.country + ', ' + yearLabel(d));
      card.innerHTML =
        '<div class="card-img-wrap"><img src="' + escHtml(d.file) + '" alt="' + escHtml(d.party + ' ' + yearLabel(d)) + '" loading="lazy" /></div>' +
        '<div class="card-meta">' +
          '<div class="card-party">' + escHtml(d.party) + '</div>' +
          '<div class="card-country">' + flag(d.country) + escHtml(d.country) + '</div>' +
          '<div class="card-year">' + escHtml(yearLabel(d)) + '</div>' +
          '<span class="card-ext">' + escHtml(d.ext.toUpperCase()) + '</span>' +
        '</div>';
      card.addEventListener('click',   () => openLightbox(d));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(d); });
      grid.appendChild(card);
    });
  }

  /* Count and sidebar counts */
  function renderCount(filtered) {
    document.getElementById('results-count').textContent =
      filtered.length + ' of ' + LOGO_DATA.length + ' logos';
  }

  function updateSidebarCounts(filtered) {
    const cc = {}, pc = {};
    filtered.forEach(d => { cc[d.country]=(cc[d.country]||0)+1; pc[d.party]=(pc[d.party]||0)+1; });
    document.querySelectorAll('.country-check').forEach(cb => {
      const cnt = cb.closest('.filter-check').querySelector('.count');
      if (cnt) cnt.textContent = cc[cb.value] || 0;
    });
    document.querySelectorAll('.party-check').forEach(cb => {
      const cnt = cb.closest('.filter-check').querySelector('.count');
      if (cnt) cnt.textContent = pc[cb.value] || 0;
    });
  }

  /* Main render */
  function render() {
    const filtered = sortedData(LOGO_DATA.filter(matchesEntry));
    renderCount(filtered);
    renderTags();
    renderGrid(filtered);
    updateSidebarCounts(filtered);
  }

  /* Lightbox */
  function openLightbox(d) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lb-img').src = d.file;
    document.getElementById('lb-img').alt = d.party + ' ' + yearLabel(d);
    document.getElementById('lb-party').textContent = d.party;
    document.getElementById('lb-country').innerHTML =
      flag(d.country) + escHtml(d.country);
    document.getElementById('lb-year').innerHTML =
      '<span class="icon solid fa-calendar-alt"></span> ' + escHtml(yearLabel(d));
    document.getElementById('lb-ext').innerHTML =
      '<span class="icon solid fa-file-image"></span> ' + escHtml(d.ext.toUpperCase());
    const dl = document.getElementById('lb-download');
    dl.href     = d.file;
    dl.download = d.party.replace(/[^a-z0-9]/gi,'_') + '_' + (d.year||'') + '.' + d.ext;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  }

  function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = '';
  }

  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  /* Footer country links with flags */
  function buildFooterCountries() {
    const ul = document.getElementById('footer-countries');
    if (!ul) return;
    ALL_COUNTRIES.forEach(c => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = '#';
      a.textContent = flag(c) + c;
      a.dataset.country = c;
      a.addEventListener('click', e => {
        e.preventDefault();
        /* Check only this country, uncheck the rest */
        document.querySelectorAll('.country-check').forEach(cb => {
          cb.checked = cb.value === c;
        });
        state.countries = new Set([c]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        render();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  /* Empty state reset */
  const emptyReset = document.getElementById('empty-reset');
  if (emptyReset) emptyReset.addEventListener('click', resetAll);

  /* Init */
  function init() {
    buildCountryList();
    buildPartyList();
    initTypeFilters();
    initYearSlider();
    initToggles();
    initSearch();
    initSortView();
    buildFooterCountries();
    render();
    setTimeout(() => document.body.classList.remove('is-preload'), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
