/* Content quality checks over visible text. */
SiteQA.register('content', function (data) {
  var out = [];
  var CAT = 'Content';
  var text = data.bodyText || '';

  var isProd = data.protocol === 'https:' &&
    !/^(localhost|127\.0\.0\.1)/.test(data.hostname || '') &&
    !/(staging|stg|dev|test)[.-]/i.test(data.hostname || '');

  // ---- Leaked values (hard failures) -------------------------------------
  var hard = [
    { id: 'undefined', re: /\bundefined\b/, label: 'undefined' },
    {
      id: 'null', label: 'null',
      // Only flag "null" when it reads like a leaked value (e.g. "null MB"),
      // not ordinary prose that happens to contain the word.
      check: function () { return /\bnull\s*(mb|kb|gb|%|px|,|\.|\))/i.test(text); }
    },
    { id: 'nan', re: /\bNaN\b/, label: 'NaN' },
    { id: 'object', re: /\[object Object\]/, label: '[object Object]' }
  ];

  var anyHard = false;
  hard.forEach(function (p) {
    var hit = p.check ? p.check() : p.re.test(text);
    if (hit) {
      anyHard = true;
      out.push(SiteQA.fail(CAT, 'content.leaked.' + p.id, 'Leaked value',
        'Visible text contains "' + p.label + '".', {
          severity: 'high',
          recommendation: 'Find where "' + p.label + '" is rendered and supply a real value or fallback.',
          elements: [{ location: 'Visible page text', text: p.label }]
        }));
    }
  });
  if (!anyHard) {
    out.push(SiteQA.pass(CAT, 'content.leaked', 'Leaked values',
      'No undefined / null / NaN / [object Object] in visible text.'));
  }

  // ---- Placeholder copy ---------------------------------------------------
  var soft = [
    // Match the canonical filler ("lorem ipsum dolor sit amet …") rather than the
    // bare phrase, so a legitimate tool named "Lorem Ipsum Generator" is not flagged.
    { id: 'lorem', re: /lorem ipsum dolor/i, label: 'Lorem ipsum filler text' },
    { id: 'dummy', re: /\bdummy text\b/i, label: 'dummy text' },
    { id: 'test', re: /\btest text\b/i, label: 'test text' },
    { id: 'comingsoon', re: /\bcoming soon\b/i, label: 'coming soon' }
  ];
  soft.forEach(function (p) {
    if (!p.re.test(text)) return;
    if (isProd) {
      out.push(SiteQA.warn(CAT, 'content.placeholder.' + p.id, 'Placeholder content',
        'Visible text contains "' + p.label + '".', {
          severity: 'low',
          recommendation: 'Replace placeholder copy with real content before shipping.',
          elements: [{ location: 'Visible page text', text: p.label }]
        }));
    } else {
      out.push(SiteQA.info(CAT, 'content.placeholder.' + p.id, 'Placeholder content',
        'Visible text contains "' + p.label + '" (non-production context).'));
    }
  });

  return out;
});
