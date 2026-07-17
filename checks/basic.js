/* Basic page checks. */
SiteQA.register('basic', function (data) {
  var out = [];
  var CAT = 'Basic';
  var TITLE_MIN = 10, TITLE_MAX = 65;
  var DESC_MIN = 50, DESC_MAX = 160;

  // ---- Title -------------------------------------------------------------
  var title = (data.title || '').trim();
  if (!title) {
    out.push(SiteQA.fail(CAT, 'basic.title.missing', 'Page title', 'Page has no <title>.', {
      severity: 'high',
      recommendation: 'Add a descriptive <title> of 10–65 characters.',
      elements: [{ location: '<head>', tagName: 'title' }]
    }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.title.present', 'Page title', 'Title: "' + title + '"'));
    if (title.length < TITLE_MIN) {
      out.push(SiteQA.warn(CAT, 'basic.title.short', 'Title length',
        'Title is short at ' + title.length + ' characters.', {
          severity: 'low',
          recommendation: 'Aim for approximately 10–65 characters.',
          elements: [{ location: '<head> > title', text: title, value: title.length + ' chars' }]
        }));
    } else if (title.length > TITLE_MAX) {
      out.push(SiteQA.warn(CAT, 'basic.title.long', 'Title length',
        'Title is long at ' + title.length + ' characters.', {
          severity: 'low',
          recommendation: 'Aim for approximately 10–65 characters; long titles get truncated in search results.',
          elements: [{ location: '<head> > title', text: title, value: title.length + ' chars' }]
        }));
    } else {
      out.push(SiteQA.pass(CAT, 'basic.title.length', 'Title length', title.length + ' characters.'));
    }
  }

  // ---- Meta description --------------------------------------------------
  var desc = (data.metaDescription || '').trim();
  if (!desc) {
    out.push(SiteQA.warn(CAT, 'basic.description.missing', 'Meta description',
      'No meta description found.', {
        severity: 'medium',
        recommendation: 'Add a <meta name="description"> of 50–160 characters.',
        elements: [{ location: '<head>', tagName: 'meta', attribute: 'name="description"' }]
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.description.present', 'Meta description',
      'Present (' + desc.length + ' characters).'));
    if (desc.length < DESC_MIN) {
      out.push(SiteQA.warn(CAT, 'basic.description.short', 'Description length',
        'Meta description is short at ' + desc.length + ' characters.', {
          severity: 'low',
          recommendation: 'Aim for approximately 50–160 characters.',
          elements: [{ location: 'meta[name="description"]', text: desc }]
        }));
    } else if (desc.length > DESC_MAX) {
      out.push(SiteQA.warn(CAT, 'basic.description.long', 'Description length',
        'Meta description is long at ' + desc.length + ' characters.', {
          severity: 'low',
          recommendation: 'Aim for approximately 50–160 characters.',
          elements: [{ location: 'meta[name="description"]', text: desc }]
        }));
    } else {
      out.push(SiteQA.pass(CAT, 'basic.description.length', 'Description length',
        desc.length + ' characters.'));
    }
  }

  // ---- Canonical ---------------------------------------------------------
  if (!data.canonical) {
    out.push(SiteQA.warn(CAT, 'basic.canonical.missing', 'Canonical URL',
      'No canonical link found.', {
        severity: 'medium',
        recommendation: 'Add <link rel="canonical" href="…"> to avoid duplicate-content issues.',
        elements: [{ location: '<head>', tagName: 'link', attribute: 'rel="canonical"' }]
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.canonical.present', 'Canonical URL', data.canonical));
  }

  // ---- Viewport ----------------------------------------------------------
  if (!data.viewport) {
    out.push(SiteQA.fail(CAT, 'basic.viewport.missing', 'Viewport meta',
      'No viewport meta tag.', {
        severity: 'high',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
        elements: [{ location: '<head>', tagName: 'meta', attribute: 'name="viewport"' }]
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.viewport.present', 'Viewport meta', data.viewport));
  }

  // ---- HTTPS -------------------------------------------------------------
  if (data.protocol === 'https:') {
    out.push(SiteQA.pass(CAT, 'basic.https', 'HTTPS', 'Page served over HTTPS.'));
  } else if (data.protocol === 'file:' || /^(localhost|127\.0\.0\.1)/.test(data.hostname || '')) {
    out.push(SiteQA.info(CAT, 'basic.https.local', 'HTTPS',
      'Local/file context (' + data.protocol + ') — HTTPS not expected.'));
  } else {
    out.push(SiteQA.fail(CAT, 'basic.https.missing', 'HTTPS',
      'Page is not using HTTPS (' + data.protocol + ').', {
        severity: 'critical',
        recommendation: 'Serve the page over HTTPS.',
        elements: [{ url: data.url, location: 'Document' }]
      }));
  }

  // ---- html lang ---------------------------------------------------------
  if (!data.lang) {
    out.push(SiteQA.warn(CAT, 'basic.lang.missing', 'HTML lang',
      'No lang attribute on <html>.', {
        severity: 'medium',
        recommendation: 'Add a language, e.g. <html lang="en">.',
        elements: [{ tagName: 'html', attribute: 'lang', location: '<html>' }]
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.lang.present', 'HTML lang', 'lang="' + data.lang + '"'));
  }

  // ---- Favicon -----------------------------------------------------------
  if (!data.hasFavicon) {
    out.push(SiteQA.warn(CAT, 'basic.favicon.missing', 'Favicon',
      'No icon/favicon link found.', {
        severity: 'low',
        recommendation: 'Add <link rel="icon" href="…">.',
        elements: [{ location: '<head>', tagName: 'link', attribute: 'rel="icon"' }]
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'basic.favicon.present', 'Favicon', 'Icon link present.'));
  }

  return out;
});
