/* Link checks (DOM only - never fetches links). */
SiteQA.register('links', function (data) {
  var out = [];
  var CAT = 'Links';
  var links = data.links || [];

  var isProd = data.protocol === 'https:' &&
    !/^(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(data.hostname || '') &&
    !/\.local$/.test(data.hostname || '');

  // Buckets of affected elements, collected in a single pass.
  var empties = [], hashOnly = [], jsVoid = [], noName = [],
    unsafeTarget = [], localhostRefs = [], stagingRefs = [], brokenAnchors = [];

  function el(a, extra) {
    var base = {
      selector: a.selector,
      tagName: 'a',
      text: a.accName || a.text,
      html: a.html,
      url: a.resolvedHref || a.href || ''
    };
    if (extra) Object.keys(extra).forEach(function (k) { base[k] = extra[k]; });
    return base;
  }

  links.forEach(function (a) {
    var href = a.href == null ? '' : String(a.href).trim();

    if (href === '') empties.push(el(a, { attribute: 'href', value: '(empty)' }));
    else if (href === '#') hashOnly.push(el(a, { attribute: 'href', value: '#' }));
    else if (/^javascript:\s*void\s*\(\s*0\s*\)/i.test(href)) {
      jsVoid.push(el(a, { attribute: 'href', value: href }));
    }

    if (!a.accName) noName.push(el(a, { location: 'No text or aria-label' }));

    if (a.target === '_blank') {
      var rel = (a.rel || '').toLowerCase();
      if (rel.indexOf('noopener') === -1 && rel.indexOf('noreferrer') === -1) {
        unsafeTarget.push(el(a, { attribute: 'rel', value: a.rel || '(none)' }));
      }
    }

    // In-page anchor pointing at a target that does not exist.
    if (a.anchorName && a.anchorTargetExists === false) {
      brokenAnchors.push(el(a, { location: 'No element with id/name "' + a.anchorName + '"' }));
    }

    if (isProd && a.resolvedHref) {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(a.resolvedHref)) localhostRefs.push(el(a));
      else if (/(^|\/\/)(staging|stg|dev|test)[.-]/i.test(a.resolvedHref)) stagingRefs.push(el(a));
    }
  });

  out.push(SiteQA.info(CAT, 'links.scanned', 'Links scanned', links.length + ' visible links.'));

  function report(bucket, id, title, msg, recommendation, severity, status) {
    if (bucket.length > 0) {
      out.push(SiteQA[status || 'warn'](CAT, id, title, bucket.length + ' ' + msg, {
        severity: severity,
        recommendation: recommendation,
        elements: bucket
      }));
    } else {
      out.push(SiteQA.pass(CAT, id, title, 'None found.'));
    }
  }

  report(empties, 'links.href.empty', 'Empty href',
    'link(s) have an empty href.',
    'Give the link a real destination, or use a <button> for actions.', 'medium');

  report(hashOnly, 'links.href.hash', 'Placeholder "#" href',
    'link(s) point to "#".',
    'Replace "#" with a real URL, or use a <button> for actions.', 'low');

  report(jsVoid, 'links.href.jsvoid', 'javascript:void(0)',
    'link(s) use javascript:void(0).',
    'Use a real href or a <button> element for actions.', 'low');

  report(noName, 'links.name.missing', 'Link accessible name',
    'link(s) have no visible text and no aria-label.',
    'Add link text or an aria-label so screen readers can announce the link.', 'high');

  report(unsafeTarget, 'links.target.unsafe', 'target="_blank" safety',
    'link(s) open a new tab without rel="noopener".',
    'Add rel="noopener noreferrer" to target="_blank" links.', 'medium');

  report(brokenAnchors, 'links.anchor.broken', 'Broken anchor target',
    'in-page link(s) point to an id that does not exist.',
    'Add the missing target element id, or fix the anchor href.', 'medium');

  if (isProd) {
    report(localhostRefs, 'links.env.localhost', 'Localhost links',
      'link(s) point to localhost on a production page.',
      'Remove localhost URLs from production.', 'high', 'fail');

    report(stagingRefs, 'links.env.staging', 'Staging links',
      'link(s) point to a staging/dev domain on production.',
      'Point these links at the production domain.', 'medium');
  }

  return out;
});
