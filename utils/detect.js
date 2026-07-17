/*
 * WebCheckr - platform detection service.
 *
 * Conservative by design: it only reads the page snapshot the collector
 * already gathered (meta generator, resource URLs, body classes, safe global
 * flags, hostname). It never issues extra network requests and never probes
 * paths. Anything short of an exact hostname match is reported as a *likely*
 * platform.
 */

/* Exact hostname match — never partial/substring matching. */
SiteQA.hostnameMatches = function (hostname, allowed) {
  allowed = allowed || [];
  if (!hostname) return false;
  var h = String(hostname).toLowerCase().replace(/\.$/, '');
  // Strip a port if one ever appears.
  h = h.split(':')[0];
  for (var i = 0; i < allowed.length; i++) {
    if (h === String(allowed[i]).toLowerCase()) return true;
  }
  return false;
};

function anyUrlMatches(urls, re) {
  if (!urls || !urls.length) return false;
  for (var i = 0; i < urls.length; i++) {
    if (re.test(urls[i])) return true;
  }
  return false;
}

/*
 * Returns:
 * { platform, confidence: 'high'|'medium'|'low'|null, reasons: string[], exact: boolean }
 */
SiteQA.detectPlatform = function (data) {
  data = data || {};
  var urls = []
    .concat(data.resourceUrls && data.resourceUrls.scripts || [])
    .concat(data.resourceUrls && data.resourceUrls.styles || []);
  var generator = (data.metaGenerator || '').toLowerCase();
  var bodyClasses = (data.bodyClasses || '').toLowerCase();
  var globals = data.globals || {};

  // --- WebToolkit: exact hostname only, highest precedence -----------------
  if (SiteQA.hostnameMatches(data.hostname, SiteQA.WEBTOOLKIT_HOSTS)) {
    return {
      platform: 'webtoolkit',
      confidence: 'high',
      exact: true,
      reasons: ['Hostname is an exact match for ' + data.hostname + '.']
    };
  }

  var candidates = [];

  // --- WooCommerce (checked before WordPress: it implies WordPress) --------
  var wooReasons = [];
  if (/(^|\s)woocommerce(-|\s|$)/.test(bodyClasses)) wooReasons.push('WooCommerce body class detected.');
  if (anyUrlMatches(urls, /\/plugins\/woocommerce\//i)) wooReasons.push('WooCommerce plugin assets detected.');
  if (globals.hasWooCommerce) wooReasons.push('WooCommerce global object detected.');
  if (wooReasons.length) {
    candidates.push({
      platform: 'woocommerce',
      reasons: wooReasons,
      confidence: wooReasons.length >= 2 ? 'high' : 'medium'
    });
  }

  // --- WordPress -----------------------------------------------------------
  var wpReasons = [];
  if (generator.indexOf('wordpress') !== -1) wpReasons.push('Meta generator mentions WordPress.');
  if (anyUrlMatches(urls, /\/wp-content\//i)) wpReasons.push('/wp-content/ assets detected.');
  if (anyUrlMatches(urls, /\/wp-includes\//i)) wpReasons.push('/wp-includes/ assets detected.');
  if (/(^|\s)(wp-|home\s|postid-|page-id-)/.test(bodyClasses)) wpReasons.push('WordPress body classes detected.');
  if (wpReasons.length) {
    candidates.push({
      platform: 'wordpress',
      reasons: wpReasons,
      confidence: wpReasons.length >= 2 ? 'high' : 'medium'
    });
  }

  // --- Shopify -------------------------------------------------------------
  var shopReasons = [];
  if (anyUrlMatches(urls, /cdn\.shopify\.com/i)) shopReasons.push('cdn.shopify.com assets detected.');
  if (globals.hasShopify) shopReasons.push('Shopify global object detected.');
  if (generator.indexOf('shopify') !== -1) shopReasons.push('Meta generator mentions Shopify.');
  if (shopReasons.length) {
    candidates.push({
      platform: 'shopify',
      reasons: shopReasons,
      confidence: shopReasons.length >= 2 ? 'high' : 'medium'
    });
  }

  // --- Next.js -------------------------------------------------------------
  var nextReasons = [];
  if (globals.hasNextData) nextReasons.push('__NEXT_DATA__ present.');
  if (anyUrlMatches(urls, /\/_next\//i)) nextReasons.push('/_next/ assets detected.');
  if (nextReasons.length) {
    candidates.push({
      platform: 'nextjs',
      reasons: nextReasons,
      confidence: nextReasons.length >= 2 ? 'high' : 'medium'
    });
  }

  if (!candidates.length) {
    return { platform: null, confidence: null, exact: false, reasons: [] };
  }

  // WooCommerce wins over WordPress when both matched (it is the more specific
  // platform); otherwise prefer the strongest evidence.
  var wooHit = candidates.find(function (c) { return c.platform === 'woocommerce'; });
  var best = wooHit || candidates.sort(function (a, b) {
    return b.reasons.length - a.reasons.length;
  })[0];

  best.exact = false;
  return best;
};
