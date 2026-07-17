/*
 * Plain-text report builder for "Copy Report".
 * Deliberately compact: severity + message + fix + affected COUNT.
 * Never includes affected-element HTML.
 */
SiteQA.buildReport = function (data, results, summary, presetInfo, healthSummary) {
  var lines = [];
  var now = new Date();

  function sevTag(r) {
    if (r.status === SiteQA.STATUS.PASSED) return '[Passed]';
    return '[' + (r.severity.charAt(0).toUpperCase() + r.severity.slice(1)) + ']';
  }

  lines.push('WebCheckr Report');
  lines.push('');
  lines.push('URL: ' + data.url);
  lines.push('Title: ' + (data.title || '(none)'));
  lines.push('Date: ' + now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8));

  // Active presets + detection.
  if (presetInfo) {
    lines.push('Presets: ' + SiteQA.presetLabel(presetInfo.activePresets));
    if (presetInfo.detectedPreset) {
      var label = presetInfo.detectionExact ? 'Platform' : 'Likely platform';
      var conf = presetInfo.detectionConfidence
        ? ' (confidence: ' + presetInfo.detectionConfidence + ')' : '';
      lines.push(label + ': ' + presetInfo.detectedPreset + conf);
    }
  }
  lines.push('');

  if (healthSummary) {
    lines.push('Summary:');
    lines.push(healthSummary);
    lines.push('');
  }

  lines.push('Score: ' + summary.score + '/100');
  lines.push('Passed: ' + summary.passed +
    ' | Warnings: ' + summary.warnings +
    ' | Failed: ' + summary.failed +
    ' | Informational: ' + summary.informational);
  lines.push('');

  if (summary.categories && summary.categories.length) {
    lines.push('Category scores:');
    summary.categories.forEach(function (c) {
      lines.push('- ' + c.category + ': ' + c.score + '/100 (' +
        c.failed + ' failed, ' + c.warnings + ' warnings, ' + c.passed + ' passed)');
    });
    lines.push('');
  }

  function section(heading, filterFn) {
    var items = results.filter(filterFn);
    if (!items.length) return;

    // Most severe first.
    items = items.slice().sort(function (a, b) {
      return SiteQA.SEVERITY_RANK[a.severity] - SiteQA.SEVERITY_RANK[b.severity];
    });

    lines.push(heading + ' (' + items.length + '):');
    lines.push('');
    items.forEach(function (r) {
      lines.push(sevTag(r) + ' ' + r.title + ' — ' + r.category);
      lines.push(r.message);
      if (r.recommendation) lines.push('Fix: ' + r.recommendation);
      if (r.affectedElements && r.affectedElements.length) {
        lines.push('Affected elements: ' + r.affectedElements.length);
      }
      lines.push('');
    });
  }

  section('Failed', function (r) { return r.status === SiteQA.STATUS.FAILED; });
  section('Warnings', function (r) { return r.status === SiteQA.STATUS.WARNING; });
  section('Informational', function (r) { return r.status === SiteQA.STATUS.INFO; });

  // Passed checks stay in the report, but only as a compact list.
  var passed = results.filter(function (r) { return r.status === SiteQA.STATUS.PASSED; });
  if (passed.length) {
    lines.push('Passed (' + passed.length + '):');
    passed.forEach(function (r, i) {
      lines.push((i + 1) + '. [' + r.category + '] ' + r.title);
    });
    lines.push('');
  }

  lines.push('Generated locally by WebCheckr. No data left the browser.');
  return lines.join('\n');
};
