/*
 * WebCheckr - check runner.
 *
 * Single place that decides what runs for a page:
 *   1. Generic Website checks always run (the base preset).
 *   2. Active platform presets may ADD results afterwards.
 * A preset can never remove or rewrite a generic result.
 *
 * Every check reads the one page snapshot collected by content.js, so no rule
 * re-scans the DOM.
 */
SiteQA.run = function (data, options) {
  options = options || {};
  var presetInfo = SiteQA.resolvePresets(data, options.selectedPreset);
  var results = [];

  function stamp(list, source) {
    (list || []).forEach(function (r) {
      if (!r.source) r.source = source;
      results.push(r);
    });
  }

  // 1. Base preset: generic checks, always.
  SiteQA.presets.generic.checkKeys.forEach(function (key) {
    var fn = SiteQA.checks[key];
    if (!fn) return;
    try {
      stamp(fn(data), 'generic');
    } catch (e) {
      stamp([SiteQA.info('Error', 'error.check.' + key, 'Check failed',
        'The "' + key + '" check could not run: ' + (e && e.message || e))], 'generic');
    }
  });

  // 2. Additive platform presets.
  presetInfo.activePresets.forEach(function (id) {
    if (id === 'generic') return;
    var preset = SiteQA.presets[id];
    if (!preset || typeof preset.run !== 'function') return;
    try {
      stamp(preset.run(data), id);
    } catch (e) {
      stamp([SiteQA.info('Error', 'error.preset.' + id, 'Preset failed',
        'The "' + preset.name + '" preset could not run: ' + (e && e.message || e))], id);
    }
  });

  var summary = SiteQA.summarize(results);

  return {
    results: results,
    summary: summary,
    presetInfo: presetInfo,
    healthSummary: SiteQA.healthSummary(results, summary)
  };
};

/* Results that represent something to act on. */
SiteQA.isIssue = function (r) {
  return r.status === SiteQA.STATUS.FAILED || r.status === SiteQA.STATUS.WARNING;
};

/*
 * Filter results for display.
 *   mode: 'issues' | 'all'
 *   filter: 'all' | 'failed' | 'warning' | a category name
 */
SiteQA.filterResults = function (results, filter, mode) {
  results = results || [];
  var list = results;

  if (mode === 'issues') {
    // Issues-only keeps failures, warnings, and informational results that
    // carry something to look at; plain passed checks are hidden.
    list = list.filter(function (r) {
      if (SiteQA.isIssue(r)) return true;
      return r.status === SiteQA.STATUS.INFO && !!(r.affectedElements && r.affectedElements.length);
    });
  }

  if (!filter || filter === 'all') return list;
  if (filter === 'failed') return list.filter(function (r) { return r.status === SiteQA.STATUS.FAILED; });
  if (filter === 'warning') return list.filter(function (r) { return r.status === SiteQA.STATUS.WARNING; });
  return list.filter(function (r) { return r.category === filter; });
};

/* Counts shown next to each filter chip, respecting the current mode. */
SiteQA.filterCounts = function (results, filters, mode) {
  var counts = {};
  (filters || []).forEach(function (f) {
    counts[f] = SiteQA.filterResults(results, f, mode).length;
  });
  return counts;
};
