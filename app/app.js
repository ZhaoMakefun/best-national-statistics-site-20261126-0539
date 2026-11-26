// AtlasStat — National Statistics Explorer. Hash-routed, no network, all data local.
(function () {
  'use strict';
  var app = document.getElementById('app');
  var state = { sortKey: 'pop', sortDir: -1, region: 'All', query: '' };
  var compareSel = ['USA', 'CHN', 'DEU'];

  // ---------- helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(n, dec) {
    if (n === undefined || n === null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function byCode(code) { for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].code === code) return COUNTRIES[i]; return null; }
  function median(vals) { var a = vals.slice().sort(function (x, y) { return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  function rankOf(c, key) {
    var sorted = COUNTRIES.slice().sort(function (a, b) { return b[key] - a[key]; });
    for (var i = 0; i < sorted.length; i++) if (sorted[i].code === c.code) return i + 1;
    return null;
  }
  // Linear 2015-2025 series from the 2015 anchor to the current value.
  function trend(c, field, baseField) {
    var out = [], start = c[baseField], end = c[field];
    for (var i = 0; i < YEARS.length; i++) out.push(start + (end - start) * (i / (YEARS.length - 1)));
    return out;
  }
  function sum(key) { return COUNTRIES.reduce(function (t, c) { return t + c[key]; }, 0); }

  // ---------- SVG charts ----------
  function hbars(rows, opts) {
    // rows: [{label, value, display, cls}]
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }));
    var html = rows.map(function (r) {
      var pct = max ? (r.value / max * 100) : 0;
      return '<div class="bar-row"><span class="lbl">' + esc(r.label) + '</span>' +
        '<span class="bar-track"><span class="bar-fill ' + (r.cls || '') + '" style="display:block;width:' + pct.toFixed(1) + '%"></span></span>' +
        '<span class="val">' + esc(r.display) + '</span></div>';
    }).join('');
    return html;
  }
  function lineChart(values, opts) {
    var W = 520, H = 240, PL = 46, PR = 12, PT = 14, PB = 28;
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var pad = (max - min) * 0.15 || 1; min -= pad; max += pad;
    function X(i) { return PL + i * (W - PL - PR) / (values.length - 1); }
    function Y(v) { return PT + (1 - (v - min) / (max - min)) * (H - PT - PB); }
    var pts = values.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var gv = min + (max - min) * g / 3, gy = Y(gv);
      grid += '<line class="grid" x1="' + PL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text x="' + (PL - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="11">' + fmt(gv, opts.dec || 0) + '</text>';
    }
    var labels = '';
    for (var i = 0; i < values.length; i += 2) {
      labels += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11">' + YEARS[i] + '</text>';
    }
    var dots = values.map(function (v, i) {
      return (i % 2 === 0 || i === values.length - 1) ? '<circle class="dot" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3"/>' : '';
    }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'Trend chart') + '">' +
      grid + '<polygon class="area" points="' + PL + ',' + Y(values[0]).toFixed(1) + ' ' + pts + ' ' + X(values.length - 1).toFixed(1) + ',' + Y(values[values.length - 1]).toFixed(1) + '"/>' +
      '<polyline class="line" points="' + pts + '"/>' + dots + labels + '</svg>';
  }
  function colChart(values, opts) {
    var W = 520, H = 240, PL = 46, PR = 12, PT = 14, PB = 28;
    var max = Math.max.apply(null, values) * 1.08, min = Math.min(0, Math.min.apply(null, values));
    function Y(v) { return PT + (1 - (v - min) / (max - min)) * (H - PT - PB); }
    var bw = (W - PL - PR) / values.length;
    var bars = values.map(function (v, i) {
      var x = PL + i * bw + 4, w = bw - 8;
      return '<rect x="' + x.toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(1, (H - PB - Y(v))).toFixed(1) + '" rx="2" fill="' + (i === values.length - 1 ? '#0e7c6b' : '#143a63') + '"/>';
    }).join('');
    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var gv = min + (max - min) * g / 3, gy = Y(gv);
      grid += '<line class="grid" x1="' + PL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PR) + '" y2="' + gy.toFixed(1) + '"/>' +
        '<text x="' + (PL - 6) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end" font-size="11">' + fmt(gv, 0) + '</text>';
    }
    var labels = '';
    for (var i = 0; i < values.length; i += 2) {
      labels += '<text x="' + (PL + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11">' + YEARS[i] + '</text>';
    }
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || 'Bar chart') + '">' + grid + bars + labels + '</svg>';
  }

  // ---------- views ----------
  function renderHome() {
    var topPop = COUNTRIES.slice().sort(function (a, b) { return b.pop - a.pop; }).slice(0, 8);
    var topGdp = COUNTRIES.slice().sort(function (a, b) { return b.gdp - a.gdp; }).slice(0, 8);
    var growers = COUNTRIES.slice().sort(function (a, b) { return b.popGrowth - a.popGrowth; }).slice(0, 5);
    var longest = COUNTRIES.slice().sort(function (a, b) { return b.life - a.life; }).slice(0, 5);
    var regionsHtml = REGIONS.map(function (r) {
      var list = COUNTRIES.filter(function (c) { return c.region === r; });
      var p = list.reduce(function (t, c) { return t + c.pop; }, 0);
      var top = list.slice().sort(function (a, b) { return b.pop - a.pop; })[0];
      return '<div class="region"><h3><a href="#/rankings">' + r + '</a></h3>' +
        '<p class="big">' + list.length + ' countries</p>' +
        '<p>' + fmt(p) + ' million people</p><p>Largest: <a href="#/country/' + top.code + '">' + esc(top.name) + '</a></p></div>';
    }).join('');
    app.innerHTML =
      '<h1>National statistics, explored</h1>' +
      '<p class="lede">Population, economy, health, education and environment for 24 countries — ranked, charted and comparable. Pick a country to see its full profile, or compare up to three side by side.</p>' +
      '<div class="statgrid">' +
      '<div class="stat accent"><div class="k">People covered</div><div class="v">' + fmt(sum('pop') / 1000, 2) + ' bn</div><div class="s">24 countries · ~72% of the world</div></div>' +
      '<div class="stat"><div class="k">Combined GDP</div><div class="v">$' + fmt(sum('gdp') / 1000, 1) + ' tn</div><div class="s">Nominal, 2024 · US$</div></div>' +
      '<div class="stat"><div class="k">Median life expectancy</div><div class="v">' + fmt(median(COUNTRIES.map(function (c) { return c.life; })), 1) + ' yrs</div><div class="s">Across the 24 countries</div></div>' +
      '<div class="stat"><div class="k">Median GDP per capita</div><div class="v">$' + fmt(median(COUNTRIES.map(function (c) { return c.gdppc; }))) + '</div><div class="s">Nominal, 2024 · US$</div></div>' +
      '</div>' +
      '<div class="section cards">' +
      '<section class="card"><h2>Largest populations, 2025</h2>' +
      hbars(topPop.map(function (c) { return { label: c.name, value: c.pop, display: fmt(c.pop) + 'm' }; })) +
      '<p class="chart-note">India passed China as the world’s most populous country in 2023. <a href="#/rankings">See the full ranking →</a></p></section>' +
      '<section class="card"><h2>Largest economies, 2024</h2>' +
      hbars(topGdp.map(function (c) { return { label: c.name, value: c.gdp, display: '$' + fmt(c.gdp) + 'bn', cls: 'navy' }; })) +
      '<p class="chart-note">Nominal GDP in US dollars. The United States is about 1.6× the next largest economy. <a href="#/rankings">See the full ranking →</a></p></section>' +
      '</div>' +
      '<div class="section"><h2>Browse by region</h2><div class="regions">' + regionsHtml + '</div></div>' +
      '<div class="section cards">' +
      '<section class="card"><h2>Fastest-growing populations</h2><ul class="peer-list">' +
      growers.map(function (c) { return '<li><a href="#/country/' + c.code + '">' + esc(c.name) + '</a><span>+' + c.popGrowth.toFixed(2) + '% / year</span></li>'; }).join('') +
      '</ul><p class="chart-note">Average annual growth, 2015–2025. All five are in Africa.</p></section>' +
      '<section class="card"><h2>Longest lives</h2><ul class="peer-list">' +
      longest.map(function (c) { return '<li><a href="#/country/' + c.code + '">' + esc(c.name) + '</a><span>' + c.life.toFixed(1) + ' years</span></li>'; }).join('') +
      '</ul><p class="chart-note">Life expectancy at birth, 2024. Japan leads the dataset by 1.5 years.</p></section>' +
      '</div>' +
      '<p class="note"><b>About these figures:</b> ' + esc(DATA_NOTE) + ' <a href="#/about">Methodology &amp; sources →</a></p>';
    setNav('home');
  }

  function filteredCountries() {
    var q = state.query.trim().toLowerCase();
    return COUNTRIES.filter(function (c) {
      if (state.region !== 'All' && c.region !== state.region) return false;
      if (q && c.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function renderRankings() {
    var list = filteredCountries().slice().sort(function (a, b) {
      var k = state.sortKey, d = state.sortDir;
      if (k === 'name') return d * a.name.localeCompare(b.name);
      return d * (a[k] - b[k]);
    });
    function th(key, label) {
      var cls = 'sortable' + (state.sortKey === key ? ' sorted' + (state.sortDir === -1 ? ' desc' : '') : '');
      return '<th class="' + cls + '" data-sort="' + key + '">' + label + '</th>';
    }
    var rows = list.map(function (c, i) {
      var rank = rankOf(c, state.sortKey === 'name' ? 'pop' : state.sortKey);
      return '<tr><td><span class="rank-badge' + (rank <= 3 ? ' top3' : '') + '">' + rank + '</span></td>' +
        '<td class="country"><a href="#/country/' + c.code + '">' + esc(c.name) + '</a></td>' +
        '<td>' + fmt(c.pop) + '</td><td>$' + fmt(c.gdp) + '</td><td>$' + fmt(c.gdppc) + '</td>' +
        '<td>' + c.life.toFixed(1) + '</td><td>' + c.age.toFixed(1) + '</td><td>' + c.urban + '%</td>' +
        '<td>' + c.unemp.toFixed(1) + '%</td><td>' + c.infl.toFixed(1) + '%</td><td>' + c.co2.toFixed(1) + '</td>' +
        '<td>' + c.net + '%</td><td>' + c.lit + '%</td><td>' + c.fert.toFixed(1) + '</td></tr>';
    }).join('');
    app.innerHTML =
      '<h1>Country rankings</h1>' +
      '<p class="lede">All 24 countries, every indicator. Click a column heading to sort; filter by region or search by name.</p>' +
      '<div class="controls"><input type="search" id="rq" placeholder="Search countries…" value="' + esc(state.query) + '">' +
      '<span class="chips" id="rregions">' +
      ['All'].concat(REGIONS).map(function (r) { return '<button class="chip' + (state.region === r ? ' on' : '') + '" data-region="' + r + '">' + r + '</button>'; }).join('') +
      '</span><span class="count-line">' + list.length + ' of 24 countries</span></div>' +
      '<div class="tablewrap"><table class="data"><thead><tr><th>#</th>' + th('name', 'Country') +
      th('pop', 'Pop. (m)') + th('gdp', 'GDP ($bn)') + th('gdppc', 'GDP/cap') + th('life', 'Life exp.') +
      th('age', 'Med. age') + th('urban', 'Urban %') + th('unemp', 'Unempl. %') + th('infl', 'Inflation %') +
      th('co2', 'CO₂/cap') + th('net', 'Internet %') + th('lit', 'Literacy %') + th('fert', 'Fertility') +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="14">No countries match that search.</td></tr>') + '</tbody></table></div>' +
      '<p class="note" style="margin-top:14px"><b>About these figures:</b> ' + esc(DATA_NOTE) + '</p>';
    setNav('rankings');
    var rq = $('#rq');
    rq.addEventListener('input', function () { state.query = rq.value; renderRankings(); var nq = $('#rq'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-region]'), function (b) {
      b.addEventListener('click', function () { state.region = b.getAttribute('data-region'); renderRankings(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-sort]'), function (thEl) {
      thEl.addEventListener('click', function () {
        var k = thEl.getAttribute('data-sort');
        if (state.sortKey === k) state.sortDir = -state.sortDir;
        else { state.sortKey = k; state.sortDir = (k === 'name') ? 1 : -1; }
        renderRankings();
      });
    });
  }

  function renderCountry(code) {
    var c = byCode(code);
    if (!c) { app.innerHTML = '<h1>Country not found</h1><p class="lede">No country with code “' + esc(code) + '” is in this dataset. <a href="#/rankings">Browse all 24 countries →</a></p>'; setNav(''); return; }
    var peers = COUNTRIES.filter(function (x) { return x.region === c.region && x.code !== c.code; })
      .sort(function (a, b) { return b.pop - a.pop; }).slice(0, 5);
    var popSeries = trend(c, 'pop', 'pop2015'), gdpSeries = trend(c, 'gdp', 'gdp2015');
    var popChange = ((c.pop - c.pop2015) / c.pop2015 * 100), gdpChange = ((c.gdp - c.gdp2015) / c.gdp2015 * 100);
    var indRows = INDICATORS.map(function (ind) {
      var med = median(COUNTRIES.map(function (x) { return x[ind.key]; }));
      var r = rankOf(c, ind.key);
      var vs = c[ind.key] >= med ? 'above' : 'below';
      return '<tr><td>' + ind.label + '</td><td>' + fmt(c[ind.key], ind.dec) + ' ' + ind.unit + '</td><td>' + fmt(med, ind.dec) + ' ' + ind.unit + '</td><td>' + vs + ' median</td><td>#' + r + ' of 24</td></tr>';
    }).join('');
    var growthText = c.popGrowth >= 0
      ? esc(c.name) + ' grew about ' + c.popGrowth.toFixed(2) + '% a year on average.'
      : esc(c.name) + ' shrank about ' + Math.abs(c.popGrowth).toFixed(2) + '% a year on average.';
    app.innerHTML =
      '<p class="crumb"><a href="#/">Overview</a> › <a href="#/rankings">Rankings</a> › ' + esc(c.name) + '</p>' +
      '<h1>' + esc(c.name) + ' <span style="font-size:16px;color:var(--muted);font-weight:400">· ' + c.region + ' · ' + c.code + '</span></h1>' +
      '<p class="lede">National profile, 2024–2025. Population rank #' + rankOf(c, 'pop') + ' of 24 · GDP rank #' + rankOf(c, 'gdp') + ' of 24 · GDP per capita rank #' + rankOf(c, 'gdppc') + ' of 24.</p>' +
      '<div class="statgrid">' +
      '<div class="stat"><div class="k">Population</div><div class="v">' + fmt(c.pop) + 'm</div><div class="s">' + (popChange >= 0 ? '+' : '') + popChange.toFixed(1) + '% since 2015</div></div>' +
      '<div class="stat"><div class="k">GDP (nominal)</div><div class="v">$' + fmt(c.gdp) + 'bn</div><div class="s">' + (gdpChange >= 0 ? '+' : '') + gdpChange.toFixed(1) + '% since 2015</div></div>' +
      '<div class="stat"><div class="k">GDP per capita</div><div class="v">$' + fmt(c.gdppc) + '</div><div class="s">Rank #' + rankOf(c, 'gdppc') + ' of 24</div></div>' +
      '<div class="stat"><div class="k">Life expectancy</div><div class="v">' + c.life.toFixed(1) + ' yrs</div><div class="s">Rank #' + rankOf(c, 'life') + ' of 24</div></div>' +
      '</div>' +
      '<div class="section cards">' +
      '<section class="card"><h2>Population, 2015–2025 (millions)</h2>' + lineChart(popSeries, { label: 'Population trend', dec: 0 }) +
      '<p class="chart-note">' + growthText + ' Trend interpolated from 2015 and 2025 anchor values.</p></section>' +
      '<section class="card"><h2>GDP, 2015–2025 (US$ bn)</h2>' + colChart(gdpSeries, { label: 'GDP trend' }) +
      '<p class="chart-note">Nominal GDP in current US dollars. Trend interpolated from 2015 and 2025 anchor values.</p></section>' +
      '</div>' +
      '<div class="section cards">' +
      '<section class="card"><h2>All indicators vs the dataset median</h2>' +
      '<div class="tablewrap" style="box-shadow:none;border:0"><table class="data"><thead><tr><th>Indicator</th><th>' + esc(c.name) + '</th><th>Median (24)</th><th>vs median</th><th>Rank</th></tr></thead><tbody>' + indRows + '</tbody></table></div></section>' +
      '<section class="card"><h2>Other countries in ' + c.region + '</h2><ul class="peer-list">' +
      peers.map(function (p) { return '<li><a href="#/country/' + p.code + '">' + esc(p.name) + '</a><span>' + fmt(p.pop) + 'm people · $' + fmt(p.gdppc) + ' / cap</span></li>'; }).join('') +
      '</ul><p class="chart-note"><a href="#/compare/' + c.code + '">Compare ' + esc(c.name) + ' with others →</a></p></section>' +
      '</div>' +
      '<p class="note"><b>About these figures:</b> ' + esc(DATA_NOTE) + '</p>';
    setNav('');
  }

  function renderCompare(codes) {
    if (codes && codes.length) compareSel = codes.filter(function (code) { return byCode(code); }).slice(0, 3);
    if (!compareSel.length) compareSel = ['USA', 'CHN', 'DEU'];
    var sel = compareSel.map(byCode);
    var keys = ['pop', 'gdp', 'gdppc', 'life', 'age', 'urban', 'unemp', 'infl', 'co2', 'net', 'lit', 'fert'];
    var tableRows = keys.map(function (k) {
      var ind = INDICATORS.filter(function (x) { return x.key === k; })[0];
      var best = ind.lowerBetter ? Math.min.apply(null, sel.map(function (c) { return c[k]; })) : Math.max.apply(null, sel.map(function (c) { return c[k]; }));
      var cells = sel.map(function (c) {
        return '<td class="' + (c[k] === best ? 'hl' : '') + '">' + fmt(c[k], ind.dec) + ' ' + ind.unit + '</td>';
      }).join('');
      return '<tr><td>' + ind.label + '</td>' + cells + '</tr>';
    }).join('');
    var headCells = sel.map(function (c) { return '<th><a href="#/country/' + c.code + '" style="color:#fff">' + esc(c.name) + '</a></th>'; }).join('');
    var chartKeys = ['gdppc', 'life', 'urban', 'net'];
    var chartHtml = chartKeys.map(function (k) {
      var ind = INDICATORS.filter(function (x) { return x.key === k; })[0];
      return '<h3>' + ind.label + ' (' + ind.unit + ')</h3>' +
        hbars(sel.map(function (c) { return { label: c.name, value: c[k], display: fmt(c[k], ind.dec), cls: c.code === sel[0].code ? '' : 'navy' }; }));
    }).join('');
    var picks = COUNTRIES.map(function (c) {
      var on = compareSel.indexOf(c.code) !== -1;
      return '<label class="pick' + (on ? ' sel' : '') + '"><input type="checkbox" data-code="' + c.code + '"' + (on ? ' checked' : '') + '> ' + esc(c.name) + '</label>';
    }).join('');
    app.innerHTML =
      '<h1>Compare countries</h1>' +
      '<p class="lede">Pick up to three countries. The best value in each row is highlighted.</p>' +
      '<div class="pickgrid">' + picks + '</div>' +
      (sel.length < 2
        ? '<p class="note">Select at least two countries to compare.</p>'
        : '<div class="section cards"><section class="card"><h2>Head-to-head charts</h2>' + chartHtml + '</section>' +
          '<section class="card"><h2>All indicators</h2><div class="tablewrap cmp-table" style="box-shadow:none;border:0"><table class="data"><thead><tr><th>Indicator</th>' + headCells + '</tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
          '<p class="chart-note">Highlighted cells are the best of the selected countries (lowest wins for unemployment, inflation and CO₂).</p></section></div>') +
      '<p class="note"><b>About these figures:</b> ' + esc(DATA_NOTE) + '</p>';
    setNav('compare');
    Array.prototype.forEach.call(document.querySelectorAll('.pick input'), function (cb) {
      cb.addEventListener('change', function () {
        var code = cb.getAttribute('data-code');
        var i = compareSel.indexOf(code);
        if (cb.checked && i === -1) {
          if (compareSel.length >= 3) { cb.checked = false; return; }
          compareSel.push(code);
        } else if (!cb.checked && i !== -1) compareSel.splice(i, 1);
        location.hash = '#/compare/' + compareSel.join(',');
      });
    });
  }

  function renderAbout() {
    app.innerHTML =
      '<h1>About the data</h1><div class="prose">' +
      '<p class="lede">How AtlasStat is built, where its numbers come from, and what they are — and are not.</p>' +
      '<h2>What this site is</h2>' +
      '<p>AtlasStat is an independent statistics explorer. It covers 24 countries across Africa, the Americas, Asia and Europe with 12 indicators each: population, GDP, GDP per capita, life expectancy, median age, urban share, unemployment, inflation, CO₂ per capita, internet use, adult literacy and fertility. Every figure is shown with its rank and the dataset median, so a single number is always in context.</p>' +
      '<h2>Sources</h2>' +
      '<p>Figures are compiled from the public releases of the United Nations (World Population Prospects), the World Bank (World Development Indicators) and the International Monetary Fund (World Economic Outlook), reference years 2024–2025.</p>' +
      '<h2>Important: these are approximate figures</h2>' +
      '<p>All values are <b>rounded estimates compiled for illustration</b>. They are not official releases of any national statistics office, and they are not a substitute for the source publications. Trend lines for 2015–2025 are interpolated from the 2015 and 2025 anchor values. Figures are rounded to the precision shown; small differences between countries may be within the rounding.</p>' +
      '<h2>How to use the site</h2>' +
      '<ul><li><b>Overview</b> — the big picture: totals, the largest populations and economies, and the fastest movers.</li>' +
      '<li><b>Rankings</b> — every country and every indicator in one sortable, filterable table.</li>' +
      '<li><b>Country profiles</b> — click any country for its trends, its full indicator table and its regional peers.</li>' +
      '<li><b>Compare</b> — pick up to three countries for a head-to-head chart and table.</li></ul>' +
      '<h2>Coverage</h2>' +
      '<p>The 24 countries hold about 5.92 billion people, roughly 72% of the world’s population, and about $79.6 trillion of nominal GDP. The dataset is a sample chosen for regional breadth, not a complete world census.</p>' +
      '<p><a href="#/rankings">Browse the rankings →</a></p></div>';
    setNav('about');
  }

  // ---------- router ----------
  function setNav(name) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === name);
    });
  }
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === '' || parts[0] === undefined) { renderHome(); return; }
    if (parts[0] === 'rankings') renderRankings();
    else if (parts[0] === 'country') renderCountry(parts[1] || '');
    else if (parts[0] === 'compare') renderCompare(parts[1] ? parts[1].split(',') : null);
    else if (parts[0] === 'about') renderAbout();
    else renderHome();
    window.scrollTo(0, 0);
  }
  document.getElementById('topsearch').addEventListener('submit', function (e) {
    e.preventDefault();
    state.query = document.getElementById('q').value;
    state.region = 'All';
    if (location.hash === '#/rankings') renderRankings(); else location.hash = '#/rankings';
  });
  window.addEventListener('hashchange', route);
  route();
})();
