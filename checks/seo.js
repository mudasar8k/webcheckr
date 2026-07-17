/* SEO / metadata checks. */
SiteQA.register('seo', function (data) {
  var out = [];
  var CAT = 'SEO';
  var headings = data.headings || [];

  // ---- Robots ------------------------------------------------------------
  if (data.robots) {
    if (/noindex/i.test(data.robots)) {
      out.push(SiteQA.warn(CAT, 'seo.robots.noindex', 'Robots meta',
        'robots="' + data.robots + '" — this page is set to noindex.', {
          severity: 'high',
          recommendation: 'Remove noindex if this page should be indexed by search engines.',
          elements: [{ location: 'meta[name="robots"]', value: data.robots }]
        }));
    } else {
      out.push(SiteQA.info(CAT, 'seo.robots.present', 'Robots meta', 'robots="' + data.robots + '"'));
    }
  }

  // ---- H1 ----------------------------------------------------------------
  var h1s = headings.filter(function (h) { return h.level === 1; });
  if (h1s.length === 0) {
    out.push(SiteQA.warn(CAT, 'seo.h1.missing', 'H1 heading', 'No <h1> found on the page.', {
      severity: 'high',
      recommendation: 'Add a single, descriptive <h1>.'
    }));
  } else if (h1s.length > 1) {
    out.push(SiteQA.warn(CAT, 'seo.h1.multiple', 'H1 heading',
      'Multiple <h1> tags found (' + h1s.length + ').', {
        severity: 'medium',
        recommendation: 'Prefer a single <h1> per page.',
        elements: h1s.map(function (h) {
          return { selector: h.selector, tagName: 'h1', text: h.text };
        })
      }));
  } else if (!h1s[0].text) {
    out.push(SiteQA.warn(CAT, 'seo.h1.empty', 'H1 heading', '<h1> is present but empty.', {
      severity: 'medium',
      recommendation: 'Add meaningful text to the <h1>.',
      elements: [{ selector: h1s[0].selector, tagName: 'h1' }]
    }));
  } else {
    out.push(SiteQA.pass(CAT, 'seo.h1.single', 'H1 heading', 'Single H1: "' + h1s[0].text + '"'));
  }

  // ---- Heading order -----------------------------------------------------
  if (headings.length) {
    var first = headings[0];
    if (first.level > 1) {
      out.push(SiteQA.warn(CAT, 'seo.headings.firstnoth1', 'Heading order',
        'First heading is an H' + first.level + ', not an H1.', {
          severity: 'low',
          recommendation: 'Start the document outline with an H1.',
          elements: [{ selector: first.selector, tagName: first.tagName, text: first.text }]
        }));
    }
    var skips = [];
    for (var i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i - 1].level > 1) {
        skips.push({
          selector: headings[i].selector,
          tagName: headings[i].tagName,
          text: headings[i].text,
          location: 'Jumps from H' + headings[i - 1].level + ' to H' + headings[i].level
        });
      }
    }
    if (skips.length) {
      out.push(SiteQA.warn(CAT, 'seo.headings.skip', 'Heading order',
        'Heading levels skip a level in ' + skips.length + ' place(s).', {
          severity: 'low',
          recommendation: 'Avoid skipping heading levels (e.g. H2 followed by H4).',
          elements: skips
        }));
    } else {
      out.push(SiteQA.pass(CAT, 'seo.headings.order', 'Heading order', 'No skipped heading levels.'));
    }
  }

  // ---- Canonical domain --------------------------------------------------
  if (data.canonical) {
    try {
      var cu = new URL(data.canonical, data.url);
      if (cu.hostname !== data.hostname) {
        out.push(SiteQA.warn(CAT, 'seo.canonical.crossdomain', 'Canonical domain',
          'Canonical host (' + cu.hostname + ') differs from the current host (' + data.hostname + ').', {
            severity: 'medium',
            recommendation: 'Confirm this cross-domain canonical is intentional.',
            elements: [{ location: 'link[rel="canonical"]', url: data.canonical }]
          }));
      }
    } catch (e) { /* ignore unparseable canonical */ }
  }

  // ---- Duplicate brand in title -----------------------------------------
  var t = (data.title || '').trim();
  var parts = t.split(/\s*[|\-–—:]\s*/)
    .map(function (s) { return s.trim().toLowerCase(); })
    .filter(Boolean);
  for (var j = 1; j < parts.length; j++) {
    if (parts[j] && parts[j] === parts[j - 1]) {
      out.push(SiteQA.warn(CAT, 'seo.title.duplicatebrand', 'Title branding',
        'Title repeats the same segment ("' + parts[j] + '").', {
          severity: 'low',
          recommendation: 'Remove the duplicated brand/segment from the title.',
          elements: [{ location: '<head> > title', text: t }]
        }));
      break;
    }
  }

  return out;
});
