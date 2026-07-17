/*
 * WebCheckr - shared namespace, result model + helpers.
 * Loaded first. All check modules register onto window.SiteQA.
 */
window.SiteQA = window.SiteQA || {};
SiteQA.checks = SiteQA.checks || {};   // { key: fn(data, ctx) -> result[] }
SiteQA.presets = SiteQA.presets || {}; // { id, name, matches(data), run?(data) }

/* ------------------------------------------------------------------ *
 * Status + severity vocabulary
 * ------------------------------------------------------------------ */
SiteQA.STATUS = {
  PASSED: 'passed',
  WARNING: 'warning',
  FAILED: 'failed',
  INFO: 'informational'
};

SiteQA.SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'informational',
  PASSED: 'passed'
};

/* Storage/display limits for affected elements. */
SiteQA.LIMITS = {
  MAX_AFFECTED: 50,   // stored per rule
  PREVIEW_AFFECTED: 5, // shown before "Show all"
  MAX_TEXT: 120,
  MAX_HTML: 200,
  MAX_SELECTOR: 200
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/* Truncate safely; always returns a string. */
SiteQA.truncate = function (value, max) {
  if (value == null) return '';
  var s = String(value).replace(/\s+/g, ' ').trim();
  if (!max || s.length <= max) return s;
  return s.slice(0, max) + '…';
};

/*
 * Normalize one affected element into the shared model, truncating any
 * oversized text/html so results stay small enough to keep the popup fast.
 */
SiteQA.affected = function (raw) {
  if (!raw) return null;
  var L = SiteQA.LIMITS;
  var out = {};
  if (raw.selector) out.selector = SiteQA.truncate(raw.selector, L.MAX_SELECTOR);
  if (raw.tagName) out.tagName = String(raw.tagName).toLowerCase();
  if (raw.text) out.text = SiteQA.truncate(raw.text, L.MAX_TEXT);
  if (raw.html) out.html = SiteQA.truncate(raw.html, L.MAX_HTML);
  if (raw.attribute) out.attribute = String(raw.attribute);
  if (raw.value != null && raw.value !== '') out.value = SiteQA.truncate(raw.value, L.MAX_TEXT);
  if (raw.url) out.url = SiteQA.truncate(raw.url, L.MAX_TEXT);
  if (raw.location) out.location = SiteQA.truncate(raw.location, L.MAX_TEXT);
  return out;
};

/* Normalize + cap a list of affected elements. */
SiteQA.affectedList = function (list) {
  if (!list || !list.length) return [];
  var out = [];
  for (var i = 0; i < list.length && out.length < SiteQA.LIMITS.MAX_AFFECTED; i++) {
    var a = SiteQA.affected(list[i]);
    if (a) out.push(a);
  }
  return out;
};

/*
 * Build a result. Status and severity are stored separately but severity is
 * the only thing scoring reads — status drives display/filtering.
 *
 *   SiteQA.fail('SEO', 'seo.title.missing', 'Page title', 'No <title> found.', {
 *     severity: 'high', recommendation: '...', elements: [...]
 *   })
 */
function buildResult(status, defaultSeverity) {
  return function (category, id, title, message, opts) {
    opts = opts || {};
    var elements = SiteQA.affectedList(opts.elements);
    return {
      id: id,
      title: title,
      category: category,
      status: status,
      severity: opts.severity || defaultSeverity,
      message: message || '',
      recommendation: opts.recommendation || '',
      affectedElements: elements,
      // Stamped by the runner when a preset produces the result.
      source: opts.source || null
    };
  };
}

SiteQA.pass = buildResult(SiteQA.STATUS.PASSED, SiteQA.SEVERITY.PASSED);
SiteQA.warn = buildResult(SiteQA.STATUS.WARNING, SiteQA.SEVERITY.MEDIUM);
SiteQA.fail = buildResult(SiteQA.STATUS.FAILED, SiteQA.SEVERITY.HIGH);
SiteQA.info = buildResult(SiteQA.STATUS.INFO, SiteQA.SEVERITY.INFO);

/* Case-insensitive "text contains needle". */
SiteQA.textHas = function (text, needle) {
  if (!text) return false;
  return text.toLowerCase().indexOf(String(needle).toLowerCase()) !== -1;
};

/* Is a value an absolute http(s) URL? */
SiteQA.isAbsoluteUrl = function (u) {
  return /^https?:\/\//i.test(u || '');
};

/* Register a check group. */
SiteQA.register = function (key, fn) { SiteQA.checks[key] = fn; };
