/*
 * WebCheckr - page highlighting.
 *
 * `SiteQA.highlightInPage` is not run in the popup: it is serialized and
 * injected into the inspected tab via chrome.scripting.executeScript, so it
 * must be entirely self-contained (no closure variables, no SiteQA access).
 *
 * It is deliberately temporary: it scrolls the element into view, draws an
 * overlay + label, and removes every injected node/style afterwards so the
 * inspected page is never permanently modified.
 */
SiteQA.HIGHLIGHT_PREFIX = 'webcheckr-highlight';

SiteQA.highlightInPage = function (selector, durationMs) {
  var PREFIX = 'webcheckr-highlight';
  var STYLE_ID = PREFIX + '-style';
  var BOX_ID = PREFIX + '-box';

  function cleanup() {
    var old = document.getElementById(BOX_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (window.__webcheckrHighlightTimer) {
      clearTimeout(window.__webcheckrHighlightTimer);
      window.__webcheckrHighlightTimer = null;
    }
  }

  // Clicking another affected item replaces the previous highlight.
  cleanup();

  var el;
  try {
    el = selector ? document.querySelector(selector) : null;
  } catch (e) {
    return { ok: false, reason: 'invalid-selector' };
  }
  if (!el) return { ok: false, reason: 'not-found' };

  // Inject the stylesheet once; it is removed on the last cleanup.
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '#' + BOX_ID + '{position:absolute;z-index:2147483647;pointer-events:none;' +
      'border:2px solid #2563eb;border-radius:3px;' +
      // Double outline (dark ring + light ring) so it stays visible on both
      // light and dark sites.
      'box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 0 4px rgba(37,99,235,.55),0 0 12px rgba(37,99,235,.5);' +
      'background:rgba(37,99,235,.10);transition:opacity .2s ease;}' +
      '#' + BOX_ID + ' .' + PREFIX + '-label{position:absolute;top:-22px;left:-2px;' +
      'background:#2563eb;color:#fff;font:600 11px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'padding:0 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.3);}';
    document.head.appendChild(style);
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

  var rect = el.getBoundingClientRect();
  var box = document.createElement('div');
  box.id = BOX_ID;
  box.style.top = (rect.top + window.scrollY) + 'px';
  box.style.left = (rect.left + window.scrollX) + 'px';
  box.style.width = rect.width + 'px';
  box.style.height = rect.height + 'px';

  var label = document.createElement('div');
  label.className = PREFIX + '-label';
  label.textContent = 'WebCheckr';
  box.appendChild(label);
  document.body.appendChild(box);

  // The box is absolutely positioned in page coordinates, so it stays anchored
  // to the element while the user scrolls — no listeners needed, and none are
  // left behind. The timer below is the only thing to clean up.
  window.__webcheckrHighlightTimer = setTimeout(function () {
    var b = document.getElementById(BOX_ID);
    if (b) b.style.opacity = '0';
    setTimeout(function () {
      cleanup();
      var s = document.getElementById(STYLE_ID);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }, 220);
  }, durationMs || 2500);

  return {
    ok: true,
    tagName: el.tagName.toLowerCase(),
    visible: rect.width > 0 || rect.height > 0
  };
};
