/*
 * Performance-lite checks. Mostly informational: these are observations from
 * the Performance API, not a Lighthouse replacement, so they carry low weight.
 */
SiteQA.register('performance', function (data) {
  var out = [];
  var CAT = 'Performance';
  var perf = data.perf || {};
  var counts = data.counts || {};

  function fmtMs(ms) { return ms == null || ms < 0 ? 'n/a' : ms + ' ms'; }

  function band(ms) {
    if (ms == null || ms < 0) return null;
    if (ms <= 2000) return 'Good';
    if (ms <= 5000) return 'Needs Review';
    return 'Heavy Page';
  }

  var loadBand = band(perf.load);
  if (loadBand === 'Good') {
    out.push(SiteQA.pass(CAT, 'perf.load', 'Load time', 'load: ' + fmtMs(perf.load) + ' — Good.'));
  } else if (loadBand === 'Needs Review') {
    out.push(SiteQA.warn(CAT, 'perf.load', 'Load time', 'load: ' + fmtMs(perf.load) + ' — Needs Review.', {
      severity: 'low',
      recommendation: 'Look for large scripts, images, or render-blocking resources.'
    }));
  } else if (loadBand === 'Heavy Page') {
    out.push(SiteQA.warn(CAT, 'perf.load', 'Load time', 'load: ' + fmtMs(perf.load) + ' — Heavy Page.', {
      severity: 'medium',
      recommendation: 'Reduce payload size and defer non-critical scripts.'
    }));
  } else {
    out.push(SiteQA.info(CAT, 'perf.load.unavailable', 'Load time',
      'Load event timing is not available for this page.'));
  }

  out.push(SiteQA.info(CAT, 'perf.dcl', 'DOMContentLoaded', fmtMs(perf.dcl)));

  if (perf.transferSize != null) {
    out.push(SiteQA.info(CAT, 'perf.transfer', 'Transfer size',
      Math.round(perf.transferSize / 1024) + ' KB (main document).'));
  }

  // Resource counts are observations; only flag clearly heavy pages.
  if (counts.images > 80) {
    out.push(SiteQA.warn(CAT, 'perf.images', 'Images', counts.images + ' <img> elements.', {
      severity: 'low',
      recommendation: 'Consider lazy-loading offscreen images.'
    }));
  } else {
    out.push(SiteQA.info(CAT, 'perf.images', 'Images', (counts.images || 0) + ' <img> elements.'));
  }

  if (counts.scripts > 40) {
    out.push(SiteQA.warn(CAT, 'perf.scripts', 'Scripts', counts.scripts + ' <script> elements.', {
      severity: 'low',
      recommendation: 'Many script tags are normal for bundlers that code-split (e.g. Next.js chunks); ' +
        'only worth acting on if they are separate network requests.'
    }));
  } else {
    out.push(SiteQA.info(CAT, 'perf.scripts', 'Scripts', (counts.scripts || 0) + ' <script> elements.'));
  }

  out.push(SiteQA.info(CAT, 'perf.stylesheets', 'Stylesheets',
    (counts.stylesheets || 0) + ' stylesheet/style elements.'));

  return out;
});
