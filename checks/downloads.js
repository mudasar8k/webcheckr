/* Download / file-action checks. */
SiteQA.register('downloads', function (data) {
  var out = [];
  var CAT = 'Downloads';
  var ACTION_WORDS = ['download', 'export', 'save', 'copy', 'generate', 'upload'];

  function looksLikeAction(text) {
    text = (text || '').toLowerCase();
    return ACTION_WORDS.some(function (w) { return text.indexOf(w) !== -1; });
  }

  var actionLinks = (data.links || []).filter(function (a) {
    return looksLikeAction(a.text) || looksLikeAction(a.accName) ||
      /download/i.test(a.href || '') || (a.rel || '').indexOf('download') !== -1;
  });
  var actionButtons = (data.buttons || []).filter(function (b) {
    return looksLikeAction(b.text) || looksLikeAction(b.accName);
  });

  out.push(SiteQA.info(CAT, 'downloads.scanned', 'Action controls',
    actionLinks.length + ' link(s) and ' + actionButtons.length + ' button(s) look like file/actions.'));

  // Bucket by problem so each rule reports its own affected elements.
  var brokenUrl = [], emptyHref = [], placeholderHref = [], invalidHref = [];

  actionLinks.forEach(function (a) {
    var href = a.href == null ? '' : String(a.href).trim();
    var resolved = a.resolvedHref || href;
    var base = {
      selector: a.selector,
      tagName: 'a',
      text: a.accName || a.text || '(unnamed)',
      url: resolved,
      html: a.html
    };

    if (/\/api\/download\/undefined/i.test(resolved) || /\/api\/download\/undefined/i.test(href)) {
      brokenUrl.push(base);
    } else if (href === '') {
      emptyHref.push(base);
    } else if (href === '#') {
      placeholderHref.push(base);
    } else if (/undefined/i.test(href) || /\bnull\b/i.test(href)) {
      invalidHref.push(base);
    }
  });

  var problems = 0;

  if (brokenUrl.length) {
    problems += brokenUrl.length;
    out.push(SiteQA.fail(CAT, 'downloads.url.undefined', 'Broken download URL',
      brokenUrl.length + ' download link(s) point to /api/download/undefined.', {
        severity: 'critical',
        recommendation: 'Ensure the backend returns a valid download id, or disable the control until it has one.',
        elements: brokenUrl
      }));
  }
  if (invalidHref.length) {
    problems += invalidHref.length;
    out.push(SiteQA.fail(CAT, 'downloads.href.invalid', 'Invalid download href',
      invalidHref.length + ' action link(s) have an href containing "undefined" or "null".', {
        severity: 'critical',
        recommendation: 'Fix the URL template so it never interpolates undefined/null.',
        elements: invalidHref
      }));
  }
  if (emptyHref.length) {
    problems += emptyHref.length;
    out.push(SiteQA.warn(CAT, 'downloads.href.empty', 'Empty download href',
      emptyHref.length + ' action link(s) have an empty href.', {
        severity: 'medium',
        recommendation: 'Provide a valid download URL, or use a button with a click handler.',
        elements: emptyHref
      }));
  }
  if (placeholderHref.length) {
    problems += placeholderHref.length;
    out.push(SiteQA.warn(CAT, 'downloads.href.placeholder', 'Placeholder download href',
      placeholderHref.length + ' action link(s) use "#".', {
        severity: 'low',
        recommendation: 'Wire the control up to a real URL or handler.',
        elements: placeholderHref
      }));
  }

  // Hard-fail patterns anywhere in visible text.
  var text = data.bodyText || '';
  [
    { re: /\/api\/download\/undefined/i, label: '/api/download/undefined', severity: 'critical' },
    { re: /\bNaN\s*MB\b/i, label: 'NaN MB', severity: 'high' },
    { re: /\bundefined\s*MB\b/i, label: 'undefined MB', severity: 'high' },
    { re: /\bnull\s*MB\b/i, label: 'null MB', severity: 'high' }
  ].forEach(function (p) {
    if (p.re.test(text)) {
      problems++;
      out.push(SiteQA.fail(CAT, 'downloads.text.' + p.label.replace(/\W+/g, '-'), 'Broken file text',
        'Visible text contains "' + p.label + '".', {
          severity: p.severity,
          recommendation: 'Fix the value that renders "' + p.label + '" (usually an undefined file size or id).',
          elements: [{ location: 'Visible page text', text: p.label }]
        }));
    }
  });

  if (problems === 0) {
    out.push(SiteQA.pass(CAT, 'downloads.integrity', 'Download integrity',
      'No broken download URLs or invalid size text found.'));
  }

  return out;
});
