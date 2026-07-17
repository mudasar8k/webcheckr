/* WebCheckr - popup controller. */
(function () {
  var FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'failed', label: 'Failed' },
    { key: 'warning', label: 'Warnings' },
    { key: 'Basic', label: 'Basic' },
    { key: 'SEO', label: 'SEO' },
    { key: 'Social', label: 'Social' },
    { key: 'Links', label: 'Links' },
    { key: 'Buttons', label: 'Buttons' },
    { key: 'Downloads', label: 'Downloads' },
    { key: 'Accessibility', label: 'A11y' },
    { key: 'Content', label: 'Content' },
    { key: 'Performance', label: 'Perf' },
    { key: 'WebToolkit', label: 'WebToolkit' }
  ];

  var state = {
    data: null,
    results: [],
    summary: null,
    presetInfo: null,
    health: '',
    filter: 'all',
    mode: 'issues',        // default to actionable results after a scan
    collapsed: {},         // category -> true
    expandedAffected: {},  // result id -> true
    showAllAffected: {}    // result id -> true
  };

  var el = {};
  ['pageTitle', 'pageUrl', 'detectNote', 'presetBadge', 'summary', 'scoreRing', 'scoreValue',
    'countPass', 'countWarn', 'countFail', 'health', 'runBtn', 'copyBtn', 'clearBtn',
    'modeRow', 'modeIssues', 'modeAll', 'modeHint', 'tabs', 'results', 'toast'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.toast.hidden = true; }, 2200);
  }

  function getActiveTab() {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        resolve(tabs && tabs[0]);
      });
    });
  }

  getActiveTab().then(function (tab) {
    if (!tab) return;
    el.pageUrl.textContent = tab.url || '';
    el.pageTitle.textContent = tab.title || '—';
  });

  /* ---------------------------------------------------------------- *
   * Rendering
   * ---------------------------------------------------------------- */

  function renderTabs() {
    var counts = SiteQA.filterCounts(state.results, FILTERS.map(function (f) { return f.key; }), state.mode);
    var html = '';
    FILTERS.forEach(function (f) {
      var n = counts[f.key];
      // Hide category chips that have nothing in the current mode.
      if (n === 0 && f.key !== 'all' && f.key !== 'failed' && f.key !== 'warning') return;
      html += '<button class="tab' + (state.filter === f.key ? ' active' : '') + '" data-filter="' +
        esc(f.key) + '">' + esc(f.label) + '<span class="n">' + n + '</span></button>';
    });
    el.tabs.innerHTML = html;
  }

  function affectedHtml(r) {
    var list = r.affectedElements || [];
    if (!list.length) return '';

    var expanded = !!state.expandedAffected[r.id];
    var showAll = !!state.showAllAffected[r.id];
    var out = '';

    out += '<button class="affected-toggle" data-affected="' + esc(r.id) + '">' +
      (expanded ? 'Hide' : 'View') + ' ' + list.length + ' affected element' +
      (list.length === 1 ? '' : 's') + '</button>';

    if (!expanded) return out;

    var shown = showAll ? list : list.slice(0, SiteQA.LIMITS.PREVIEW_AFFECTED);
    out += '<div class="affected">';
    shown.forEach(function (a, i) {
      out += '<div class="el">';
      out += '<div class="el-tag">' + esc(a.tagName || 'Element') + '</div>';
      if (a.text) out += '<div class="el-line"><b>Text:</b> ' + esc(a.text) + '</div>';
      if (a.location) out += '<div class="el-line"><b>Issue:</b> ' + esc(a.location) + '</div>';
      if (a.attribute) {
        out += '<div class="el-line"><b>Attribute:</b> ' + esc(a.attribute) +
          (a.value ? ' = ' + esc(a.value) : '') + '</div>';
      } else if (a.value) {
        out += '<div class="el-line"><b>Value:</b> ' + esc(a.value) + '</div>';
      }
      if (a.url) out += '<div class="el-line"><b>Source:</b> ' + esc(a.url) + '</div>';
      if (a.selector) out += '<div class="el-line"><b>Selector:</b> ' + esc(a.selector) + '</div>';
      if (a.html) out += '<code class="el-code">' + esc(a.html) + '</code>';

      if (a.selector) {
        var idx = list.indexOf(a);
        out += '<div class="el-actions">' +
          '<button class="el-btn" data-highlight="' + esc(r.id) + '" data-index="' + idx + '">Highlight</button>' +
          '<button class="el-btn" data-copysel="' + esc(r.id) + '" data-index="' + idx + '">Copy selector</button>' +
          '</div>';
      }
      out += '</div>';
    });

    if (!showAll && list.length > SiteQA.LIMITS.PREVIEW_AFFECTED) {
      out += '<button class="show-all" data-showall="' + esc(r.id) + '">Show all ' + list.length + '</button>';
    }
    out += '</div>';
    return out;
  }

  function render() {
    if (!state.results.length) {
      el.results.innerHTML = '<div class="empty">Click <strong>Run QA</strong> to inspect this page.</div>';
      return;
    }

    var filtered = SiteQA.filterResults(state.results, state.filter, state.mode);

    if (!filtered.length) {
      el.results.innerHTML = '<div class="empty">' +
        (state.mode === 'issues'
          ? 'No issues for this filter. Switch to <strong>All results</strong> to see passed checks.'
          : 'No results for this filter.') +
        '</div>';
      return;
    }

    // Group by display category, most severe first within each group.
    var groups = {}, order = [];
    filtered.forEach(function (r) {
      if (!groups[r.category]) { groups[r.category] = []; order.push(r.category); }
      groups[r.category].push(r);
    });

    var html = '';
    order.forEach(function (cat) {
      var items = groups[cat].slice().sort(function (a, b) {
        return SiteQA.SEVERITY_RANK[a.severity] - SiteQA.SEVERITY_RANK[b.severity];
      });

      var failed = items.filter(function (r) { return r.status === 'failed'; }).length;
      var warned = items.filter(function (r) { return r.status === 'warning'; }).length;

      // Default: expand anything with a failure/warning; collapse pass-only
      // groups while in Issues-only mode.
      var hasIssues = failed + warned > 0;
      var collapsed = state.collapsed[cat] != null
        ? state.collapsed[cat]
        : (!hasIssues && state.mode === 'issues');

      var meta = items.length + ' check' + (items.length === 1 ? '' : 's');
      if (failed) meta += ' · ' + failed + ' failed';
      if (warned) meta += ' · ' + warned + ' warning' + (warned === 1 ? '' : 's');

      html += '<section class="group' + (collapsed ? ' collapsed' : '') + '" data-group="' + esc(cat) + '">';
      html += '<button class="group-header" data-toggle="' + esc(cat) + '">' +
        '<span class="group-caret">▼</span>' +
        '<span class="group-title">' + esc(cat) + '</span>' +
        '<span class="group-meta">' + esc(meta) + '</span>' +
        '</button>';
      html += '<div class="group-body">';

      items.forEach(function (r) {
        html += '<div class="item ' + esc(r.status) + '">' +
          '<span class="dot"></span>' +
          '<div class="body">' +
          '<div class="name">' +
          (r.status === 'passed' ? '' : '<span class="sev sev-' + esc(r.severity) + '">' + esc(r.severity) + '</span>') +
          esc(r.title) + ' <span class="cat">· ' + esc(r.category) + '</span></div>' +
          (r.message ? '<div class="msg">' + esc(r.message) + '</div>' : '') +
          (r.recommendation ? '<div class="fix">' + esc(r.recommendation) + '</div>' : '') +
          affectedHtml(r) +
          '</div></div>';
      });

      html += '</div></section>';
    });

    el.results.innerHTML = html;
  }

  function updateSummary() {
    var s = state.summary;
    el.summary.hidden = false;
    el.modeRow.hidden = false;
    el.tabs.hidden = false;
    el.health.hidden = false;

    el.scoreValue.textContent = s.score;
    var color = s.score >= 85 ? 'var(--pass)' : (s.score >= 60 ? 'var(--warn)' : 'var(--fail)');
    el.scoreRing.style.background = 'conic-gradient(' + color + ' ' + s.score + '%, var(--border) 0)';
    el.countPass.textContent = s.passed;
    el.countWarn.textContent = s.warnings;
    el.countFail.textContent = s.failed;
    el.health.textContent = state.health;

    var cats = (s.categories || []).map(function (c) { return c.category + ' ' + c.score; }).join(' · ');
    el.modeHint.textContent = cats;
    el.modeHint.title = 'Category scores: ' + cats;
  }

  function updatePresetBadge() {
    var info = state.presetInfo;
    if (!info) { el.presetBadge.hidden = true; return; }

    el.presetBadge.textContent = SiteQA.presetLabel(info.activePresets);
    el.presetBadge.hidden = false;

    // Anything not based on an exact hostname is only a *likely* platform.
    if (info.detectedPreset && !info.detectionExact) {
      var p = SiteQA.presets[info.detectedPreset];
      var name = p ? p.name : info.detectedPreset;
      el.detectNote.textContent = 'Likely platform: ' + name +
        (info.detectionConfidence ? ' (' + info.detectionConfidence + ' confidence)' : '') +
        ' — checks not yet available.';
      el.detectNote.title = (info.detectionReasons || []).join(' ');
      el.detectNote.hidden = false;
    } else {
      el.detectNote.hidden = true;
    }
  }

  /* ---------------------------------------------------------------- *
   * Actions
   * ---------------------------------------------------------------- */

  function collect(tabId) {
    return chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).then(function (res) { return res && res[0] && res[0].result; });
  }

  async function run() {
    var tab = await getActiveTab();
    if (!tab || !tab.id) { toast('No active tab.'); return; }
    if (/^(chrome|edge|about|chrome-extension|devtools):/i.test(tab.url || '')) {
      toast('Cannot inspect this browser page.');
      return;
    }

    el.runBtn.disabled = true;
    el.runBtn.textContent = 'Running…';
    try {
      var data = await collect(tab.id);
      if (!data) throw new Error('No data returned from page.');

      state.data = data;
      el.pageTitle.textContent = data.title || '—';
      el.pageUrl.textContent = data.url;

      var outcome = SiteQA.run(data);
      state.results = outcome.results;
      state.summary = outcome.summary;
      state.presetInfo = outcome.presetInfo;
      state.health = outcome.healthSummary;
      state.filter = 'all';
      state.mode = 'issues';
      state.collapsed = {};
      state.expandedAffected = {};
      state.showAllAffected = {};

      setModeButtons();
      updatePresetBadge();
      updateSummary();
      renderTabs();
      render();

      el.copyBtn.disabled = false;
      el.clearBtn.disabled = false;
    } catch (e) {
      toast('Error: ' + (e && e.message || e));
      console.error(e);
    } finally {
      el.runBtn.disabled = false;
      el.runBtn.textContent = 'Run QA';
    }
  }

  function findElement(resultId, index) {
    var r = state.results.find(function (x) { return x.id === resultId; });
    if (!r) return null;
    return (r.affectedElements || [])[index] || null;
  }

  async function highlight(resultId, index) {
    var a = findElement(resultId, index);
    if (!a || !a.selector) { toast('No selector available for this element.'); return; }

    var tab = await getActiveTab();
    if (!tab || !tab.id) { toast('No active tab.'); return; }

    try {
      var res = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: SiteQA.highlightInPage,
        args: [a.selector, 2500]
      });
      var r = res && res[0] && res[0].result;
      if (!r || !r.ok) {
        toast('Element is no longer available. The page may have changed since the inspection.');
      }
    } catch (e) {
      toast('Element is no longer available. The page may have changed since the inspection.');
    }
  }

  function copySelector(resultId, index) {
    var a = findElement(resultId, index);
    if (!a || !a.selector) { toast('No selector available.'); return; }
    navigator.clipboard.writeText(a.selector).then(function () {
      toast('Selector copied. Paste it into DevTools to inspect.');
    }, function () { toast('Copy failed.'); });
  }

  function copyReport() {
    if (!state.results.length) return;
    var text = SiteQA.buildReport(state.data, state.results, state.summary, state.presetInfo, state.health);
    navigator.clipboard.writeText(text).then(function () {
      toast('Report copied to clipboard.');
    }, function () { toast('Copy failed.'); });
  }

  function setModeButtons() {
    el.modeIssues.classList.toggle('active', state.mode === 'issues');
    el.modeAll.classList.toggle('active', state.mode === 'all');
  }

  function clearAll() {
    state.results = []; state.summary = null; state.data = null; state.presetInfo = null;
    state.health = ''; state.filter = 'all'; state.mode = 'issues';
    state.collapsed = {}; state.expandedAffected = {}; state.showAllAffected = {};
    el.summary.hidden = true;
    el.modeRow.hidden = true;
    el.tabs.hidden = true;
    el.health.hidden = true;
    el.presetBadge.hidden = true;
    el.detectNote.hidden = true;
    el.copyBtn.disabled = true;
    el.clearBtn.disabled = true;
    setModeButtons();
    render();
  }

  /* ---------------------------------------------------------------- *
   * Events
   * ---------------------------------------------------------------- */

  el.runBtn.addEventListener('click', run);
  el.copyBtn.addEventListener('click', copyReport);
  el.clearBtn.addEventListener('click', clearAll);

  el.modeRow.addEventListener('click', function (e) {
    var b = e.target.closest('.mode');
    if (!b) return;
    state.mode = b.dataset.mode;
    state.collapsed = {}; // let defaults re-apply for the new mode
    setModeButtons();
    renderTabs();
    render();
  });

  el.tabs.addEventListener('click', function (e) {
    var t = e.target.closest('.tab');
    if (!t) return;
    state.filter = t.dataset.filter;
    renderTabs();
    render();
  });

  // Delegated: collapse, affected toggle, show all, highlight, copy selector.
  el.results.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      var cat = toggle.dataset.toggle;
      var section = el.results.querySelector('.group[data-group="' + CSS.escape(cat) + '"]');
      var isCollapsed = section.classList.toggle('collapsed');
      state.collapsed[cat] = isCollapsed;
      return;
    }

    var aff = e.target.closest('[data-affected]');
    if (aff) {
      var id = aff.dataset.affected;
      state.expandedAffected[id] = !state.expandedAffected[id];
      render();
      return;
    }

    var showAll = e.target.closest('[data-showall]');
    if (showAll) {
      state.showAllAffected[showAll.dataset.showall] = true;
      render();
      return;
    }

    var hl = e.target.closest('[data-highlight]');
    if (hl) {
      highlight(hl.dataset.highlight, parseInt(hl.dataset.index, 10));
      return;
    }

    var cs = e.target.closest('[data-copysel]');
    if (cs) {
      copySelector(cs.dataset.copysel, parseInt(cs.dataset.index, 10));
    }
  });
})();
