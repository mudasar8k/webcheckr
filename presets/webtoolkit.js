/*
 * WebToolkit preset - additive checks on top of Generic Website.
 *
 * Scoped to an EXACT hostname match. Substring/suffix matching is deliberately
 * not used, so lookalikes such as fakewebtoolkit.cloud, webtoolkit.cloud.evil.com
 * or another-webtoolkit.cloud never activate these rules.
 *
 * Every check here is based on publicly visible page behaviour only.
 */
SiteQA.WEBTOOLKIT_HOSTS = ['webtoolkit.cloud', 'www.webtoolkit.cloud'];

SiteQA.presets.webtoolkit = {
  id: 'webtoolkit',
  name: 'WebToolkit',
  shortName: 'WebToolkit',
  hostScoped: true,
  matches: function (data) {
    return SiteQA.hostnameMatches(data && data.hostname, SiteQA.WEBTOOLKIT_HOSTS);
  },
  run: function (data) {
    var out = [];
    var CAT = 'WebToolkit';
    var text = data.bodyText || '';
    var footer = data.footerText || '';

    /*
     * True only when `value` resolves to https:// on an exact WebToolkit
     * hostname. Parsing the URL and comparing the hostname avoids the
     * substring/prefix matching that a lookalike domain could satisfy.
     */
    function onProductionHost(value) {
      try {
        var u = new URL(value, data.url);
        return u.protocol === 'https:' &&
          SiteQA.hostnameMatches(u.hostname, SiteQA.WEBTOOLKIT_HOSTS);
      } catch (e) {
        return false;
      }
    }

    // Canonical must use the production origin.
    if (data.canonical) {
      if (onProductionHost(data.canonical)) {
        out.push(SiteQA.pass(CAT, 'webtoolkit.canonical.host', 'Canonical host',
          'Canonical uses https://webtoolkit.cloud.'));
      } else {
        out.push(SiteQA.warn(CAT, 'webtoolkit.canonical.host', 'Canonical host',
          'Canonical is not on https://webtoolkit.cloud (' + data.canonical + ').', {
            severity: 'medium',
            recommendation: 'Point the canonical at https://webtoolkit.cloud/…',
            elements: [{ location: 'link[rel="canonical"]', url: data.canonical }]
          }));
      }
    } else {
      out.push(SiteQA.warn(CAT, 'webtoolkit.canonical.missing', 'Canonical host',
        'No canonical set.', {
          severity: 'medium',
          recommendation: 'Add a https://webtoolkit.cloud canonical URL.'
        }));
    }

    // og:url must use the production origin.
    if (data.og && data.og.url) {
      if (onProductionHost(data.og.url)) {
        out.push(SiteQA.pass(CAT, 'webtoolkit.ogurl.host', 'og:url host',
          'og:url uses https://webtoolkit.cloud.'));
      } else {
        out.push(SiteQA.warn(CAT, 'webtoolkit.ogurl.host', 'og:url host',
          'og:url is not on https://webtoolkit.cloud (' + data.og.url + ').', {
            severity: 'medium',
            recommendation: 'Use the production https://webtoolkit.cloud URL for og:url.',
            elements: [{ location: 'meta[property="og:url"]', url: data.og.url }]
          }));
      }
    }

    // Footer branding is present on every production page.
    if (SiteQA.textHas(footer, 'webtoolkit')) {
      out.push(SiteQA.pass(CAT, 'webtoolkit.footer.branding', 'Footer branding',
        'Footer mentions WebToolkit.'));
    } else {
      out.push(SiteQA.warn(CAT, 'webtoolkit.footer.branding', 'Footer branding',
        'Footer does not mention WebToolkit.', {
          severity: 'low',
          recommendation: 'Confirm the footer branding is present.'
        }));
    }

    // Values that should never reach visible content.
    var patterns = [
      { re: /\/api\/download\/undefined/i, label: '/api/download/undefined', severity: 'critical' },
      { re: /\bNaN\s*MB\b/i, label: 'NaN MB', severity: 'high' },
      { re: /\bundefined\b/i, label: 'undefined', severity: 'high' }
    ];
    var clean = true;
    patterns.forEach(function (p) {
      if (p.re.test(text)) {
        clean = false;
        out.push(SiteQA.fail(CAT, 'webtoolkit.brokenvalue.' + p.label.replace(/\W+/g, '-'),
          'Broken value', 'Visible content contains "' + p.label + '".', {
            severity: p.severity,
            recommendation: 'Fix the value that renders "' + p.label + '" in visible content.',
            elements: [{ location: 'Visible page text', text: p.label }]
          }));
      }
    });
    if (clean) {
      out.push(SiteQA.pass(CAT, 'webtoolkit.brokenvalue', 'Broken value',
        'No /api/download/undefined, NaN MB, or undefined in visible content.'));
    }

    return out;
  }
};
