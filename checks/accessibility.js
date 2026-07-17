/* Basic accessibility checks. */
SiteQA.register('accessibility', function (data) {
  var out = [];
  var CAT = 'Accessibility';
  var imgs = data.images || [];

  // ---- Image alt text (alt="" is a valid decorative image) ---------------
  var missingAlt = imgs.filter(function (i) {
    if (i.role === 'presentation' || i.role === 'none') return false;
    return !i.hasAltAttr;
  });
  if (missingAlt.length) {
    out.push(SiteQA.warn(CAT, 'a11y.img.alt', 'Image alt text',
      missingAlt.length + ' of ' + imgs.length + ' visible image(s) have no alt attribute.', {
        severity: 'high',
        recommendation: 'Add descriptive alt text, or alt="" for purely decorative images.',
        elements: missingAlt.map(function (i) {
          return {
            selector: i.selector,
            tagName: 'img',
            url: i.src,
            attribute: 'alt',
            location: 'Missing alt attribute',
            html: i.html
          };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'a11y.img.alt', 'Image alt text',
      'All ' + imgs.length + ' visible images have an alt attribute.'));
  }

  // ---- Buttons without an accessible name --------------------------------
  var btnNoName = (data.buttons || []).filter(function (b) { return !b.accName; });
  if (btnNoName.length) {
    out.push(SiteQA.warn(CAT, 'a11y.button.name', 'Buttons without name',
      btnNoName.length + ' button(s) have no accessible name.', {
        severity: 'high',
        recommendation: 'Add text or an aria-label to each button.',
        elements: btnNoName.map(function (b) {
          return { selector: b.selector, tagName: b.tag, html: b.html };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'a11y.button.name', 'Buttons without name',
      'All buttons have an accessible name.'));
  }

  // ---- Links without an accessible name ----------------------------------
  var linkNoName = (data.links || []).filter(function (a) { return !a.accName; });
  if (linkNoName.length) {
    out.push(SiteQA.warn(CAT, 'a11y.link.name', 'Links without name',
      linkNoName.length + ' link(s) have no accessible name.', {
        severity: 'high',
        recommendation: 'Add link text or an aria-label.',
        elements: linkNoName.map(function (a) {
          return { selector: a.selector, tagName: 'a', url: a.resolvedHref, html: a.html };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'a11y.link.name', 'Links without name',
      'All links have an accessible name.'));
  }

  // ---- Form inputs without a label ---------------------------------------
  var inputs = data.inputs || [];
  var unlabeled = inputs.filter(function (i) {
    return !i.hasLabel && !i.ariaLabel && !i.ariaLabelledby && !i.placeholder;
  });
  if (!inputs.length) {
    out.push(SiteQA.info(CAT, 'a11y.input.none', 'Form inputs', 'No visible form inputs found.'));
  } else if (unlabeled.length) {
    out.push(SiteQA.warn(CAT, 'a11y.input.label', 'Input labels',
      unlabeled.length + ' of ' + inputs.length + ' input(s) have no label, aria-label, or placeholder.', {
        severity: 'high',
        recommendation: 'Associate a <label for="…"> or add an aria-label.',
        elements: unlabeled.map(function (i) {
          return {
            selector: i.selector,
            tagName: i.tagName,
            attribute: 'type=' + i.type,
            value: i.name || undefined,
            html: i.html
          };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'a11y.input.label', 'Input labels',
      'All ' + inputs.length + ' inputs have a label, aria-label, or placeholder.'));
  }

  // ---- Duplicate IDs ------------------------------------------------------
  var dupes = data.duplicateIds || [];
  if (dupes.length) {
    out.push(SiteQA.warn(CAT, 'a11y.id.duplicate', 'Duplicate IDs',
      dupes.length + ' id value(s) are used more than once.', {
        severity: 'medium',
        recommendation: 'IDs must be unique — duplicates break label/aria references and anchor links.',
        elements: dupes.map(function (d) {
          return {
            selector: d.selector,
            tagName: d.tagName,
            attribute: 'id',
            value: d.id,
            location: 'Used ' + d.count + ' times'
          };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'a11y.id.duplicate', 'Duplicate IDs', 'No duplicate IDs found.'));
  }

  // ---- Document-level basics ---------------------------------------------
  if (!data.lang) {
    out.push(SiteQA.warn(CAT, 'a11y.lang', 'Document language', 'Missing <html lang>.', {
      severity: 'medium',
      recommendation: 'Add a lang attribute so screen readers use the right pronunciation.',
      elements: [{ tagName: 'html', attribute: 'lang', location: '<html>' }]
    }));
  }
  if (!data.viewport) {
    out.push(SiteQA.warn(CAT, 'a11y.viewport', 'Viewport', 'Missing viewport meta.', {
      severity: 'medium',
      recommendation: 'Add a responsive viewport meta tag so the page can zoom/reflow.',
      elements: [{ location: '<head>', tagName: 'meta', attribute: 'name="viewport"' }]
    }));
  }

  return out;
});
