/* Button / clickable element checks. */
SiteQA.register('buttons', function (data) {
  var out = [];
  var CAT = 'Buttons';
  var buttons = data.buttons || [];
  var pointerish = data.pointerish || [];

  var noName = [], disabled = [], iconNoName = [];

  buttons.forEach(function (b) {
    var base = {
      selector: b.selector,
      tagName: b.tag,
      text: b.accName || b.text,
      html: b.html
    };
    if (!b.accName) noName.push(base);
    if (b.disabled) disabled.push(base);
    if (b.hasIconOnly && !b.accName) iconNoName.push(base);
  });

  out.push(SiteQA.info(CAT, 'buttons.scanned', 'Buttons scanned', buttons.length + ' visible buttons.'));

  if (noName.length) {
    out.push(SiteQA.warn(CAT, 'buttons.name.missing', 'Button accessible name',
      noName.length + ' button(s) have no text and no aria-label.', {
        severity: 'high',
        recommendation: 'Add visible text or an aria-label so the control can be announced.',
        elements: noName
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'buttons.name.present', 'Button accessible name',
      'All buttons have an accessible name.'));
  }

  if (iconNoName.length) {
    out.push(SiteQA.warn(CAT, 'buttons.icon.unlabeled', 'Icon-only buttons',
      iconNoName.length + ' icon-only button(s) have no aria-label or title.', {
        severity: 'medium',
        recommendation: 'Add an aria-label or title to icon-only buttons.',
        elements: iconNoName
      }));
  }

  if (disabled.length) {
    out.push(SiteQA.info(CAT, 'buttons.disabled', 'Disabled buttons',
      disabled.length + ' visible button(s) are disabled.', { elements: disabled }));
  }

  if (pointerish.length) {
    var missingAria = pointerish.filter(function (p) { return !p.hasAria; }).length;
    out.push(SiteQA.warn(CAT, 'buttons.fakeclickable', 'Fake clickable elements',
      pointerish.length + ' element(s) look clickable (cursor:pointer) but are not links/buttons and have no role.', {
        severity: 'medium',
        recommendation: 'Use <a>/<button>, or give the element a proper role and keyboard handler.' +
          (missingAria ? ' ' + missingAria + ' also lack an aria-label.' : ''),
        elements: pointerish.map(function (p) {
          return { selector: p.selector, tagName: p.tagName, text: p.text, html: p.html };
        })
      }));
  } else {
    out.push(SiteQA.pass(CAT, 'buttons.fakeclickable.none', 'Fake clickable elements',
      'No obvious fake-clickable elements found.'));
  }

  return out;
});
