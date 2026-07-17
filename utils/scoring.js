/*
 * WebCheckr - central scoring configuration.
 *
 * Severity is the single input to scoring. Status only drives display, so a
 * rule's weight never has to be repeated in two places.
 */

/* Points deducted from 100 per issue, by severity. */
SiteQA.SEVERITY_WEIGHTS = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
  informational: 0,
  passed: 0
};

/* Display order / rank, most severe first. */
SiteQA.SEVERITY_RANK = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  informational: 4,
  passed: 5
};

/* The six reported score categories. */
SiteQA.SCORE_CATEGORIES = [
  'Basic', 'SEO', 'Accessibility', 'Links', 'Performance', 'Best Practices'
];

/*
 * Map a rule's display category onto one of the six score categories, so new
 * check groups do not silently create new score buckets.
 */
SiteQA.CATEGORY_GROUP = {
  Basic: 'Basic',
  SEO: 'SEO',
  Social: 'SEO',
  Accessibility: 'Accessibility',
  Links: 'Links',
  Performance: 'Performance',
  Buttons: 'Best Practices',
  Downloads: 'Best Practices',
  Content: 'Best Practices',
  WebToolkit: 'Best Practices',
  Error: 'Best Practices'
};

SiteQA.scoreCategoryFor = function (category) {
  return SiteQA.CATEGORY_GROUP[category] || 'Best Practices';
};

SiteQA.deductionFor = function (severity) {
  var w = SiteQA.SEVERITY_WEIGHTS[severity];
  return typeof w === 'number' ? w : 0;
};

function clampScore(n) {
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
SiteQA.clampScore = clampScore;

/*
 * Summarize results: counts, weighted overall score, and per-category scores.
 * Keys `passed`/`warnings`/`failed`/`score` are kept for the existing UI.
 */
SiteQA.summarize = function (results) {
  results = results || [];

  var passed = 0, warnings = 0, failed = 0, informational = 0;
  var totalDeduction = 0;
  var perCategory = {};

  // Seed only the categories actually present, plus keep a stable order later.
  results.forEach(function (r) {
    switch (r.status) {
      case SiteQA.STATUS.PASSED: passed++; break;
      case SiteQA.STATUS.WARNING: warnings++; break;
      case SiteQA.STATUS.FAILED: failed++; break;
      default: informational++; break;
    }

    var deduction = SiteQA.deductionFor(r.severity);
    totalDeduction += deduction;

    var group = SiteQA.scoreCategoryFor(r.category);
    if (!perCategory[group]) {
      perCategory[group] = { category: group, deduction: 0, passed: 0, warnings: 0, failed: 0, informational: 0, total: 0 };
    }
    var c = perCategory[group];
    c.deduction += deduction;
    c.total++;
    if (r.status === SiteQA.STATUS.PASSED) c.passed++;
    else if (r.status === SiteQA.STATUS.WARNING) c.warnings++;
    else if (r.status === SiteQA.STATUS.FAILED) c.failed++;
    else c.informational++;
  });

  var categories = Object.keys(perCategory).map(function (k) {
    var c = perCategory[k];
    c.score = clampScore(100 - c.deduction);
    return c;
  }).sort(function (a, b) {
    return SiteQA.SCORE_CATEGORIES.indexOf(a.category) - SiteQA.SCORE_CATEGORIES.indexOf(b.category);
  });

  return {
    passed: passed,
    warnings: warnings,
    failed: failed,
    informational: informational,
    score: clampScore(100 - totalDeduction),
    deduction: totalDeduction,
    categories: categories
  };
};

/* Count results by severity. */
SiteQA.countBySeverity = function (results) {
  var counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0, passed: 0 };
  (results || []).forEach(function (r) {
    if (counts[r.severity] != null) counts[r.severity]++;
  });
  return counts;
};

/*
 * Deterministic page-health summary (no AI, no network).
 * Mentions overall health, critical/high counts, the worst categories, and
 * explicitly says when nothing major was found.
 */
SiteQA.healthSummary = function (results, summary) {
  results = results || [];
  summary = summary || SiteQA.summarize(results);

  var sev = SiteQA.countBySeverity(results);
  var major = sev.critical + sev.high;
  var issues = results.filter(function (r) {
    return r.status === SiteQA.STATUS.FAILED || r.status === SiteQA.STATUS.WARNING;
  });

  if (!results.length) return 'No checks have been run yet.';

  if (!issues.length) {
    return 'The page looks healthy. All ' + summary.passed +
      ' applicable checks passed and no issues were detected.';
  }

  // Overall health band.
  var health;
  if (summary.score >= 90) health = 'The page is generally healthy.';
  else if (summary.score >= 70) health = 'The page is in reasonable shape but needs some attention.';
  else if (summary.score >= 40) health = 'The page has several issues that should be addressed.';
  else health = 'The page has significant issues that need attention.';

  var parts = [health];

  // Critical / high headline.
  if (sev.critical > 0) {
    parts.push(plural(sev.critical, 'critical issue') + ' ' +
      (sev.critical === 1 ? 'was' : 'were') + ' found and should be fixed first.');
  } else if (sev.high > 0) {
    parts.push('No critical issues were detected, but ' +
      plural(sev.high, 'high-priority issue') + ' ' +
      (sev.high === 1 ? 'was' : 'were') + ' found.');
  } else {
    parts.push('No critical or high-priority issues were detected.');
  }

  // Where the remaining work is: worst categories by deduction.
  var worst = (summary.categories || [])
    .filter(function (c) { return c.failed + c.warnings > 0; })
    .sort(function (a, b) { return b.deduction - a.deduction; })
    .slice(0, 2)
    .map(function (c) { return c.category; });

  if (major === 0) {
    var lowMed = sev.medium + sev.low;
    if (lowMed > 0) {
      parts.push(plural(lowMed, 'lower-priority issue') + ' ' +
        (lowMed === 1 ? 'remains' : 'remain') +
        (worst.length ? ', mostly in ' + list(worst) + '.' : '.'));
    }
  } else if (worst.length) {
    parts.push('The most affected ' + (worst.length === 1 ? 'area is ' : 'areas are ') + list(worst) + '.');
  }

  return parts.join(' ');
};

function plural(n, word) {
  return n + ' ' + word + (n === 1 ? '' : 's');
}

function list(arr) {
  if (arr.length === 1) return arr[0];
  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
}
