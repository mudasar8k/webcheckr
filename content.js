/*
 * WebCheckr - content collector
 *
 * Injected into the active tab via chrome.scripting.executeScript. It reads
 * the DOM/metadata once and returns a plain, serializable snapshot that every
 * check then reuses (no rule re-scans the DOM itself).
 *
 * It NEVER modifies the page and NEVER reads password/input values.
 * The final expression (the returned object) is what executeScript resolves to.
 */
(function collectPageData() {
  var MAX_LINKS = 1500;
  var MAX_BUTTONS = 1500;
  var MAX_IMAGES = 1500;
  var MAX_TEXT = 200000;
  var MAX_HTML = 200;
  var MAX_LABEL = 120;

  function trunc(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  /* Compact, reasonably-unique CSS selector for an element. */
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    var safeId = /^[A-Za-z][\w-]*$/;
    if (el.id && safeId.test(el.id)) return '#' + el.id;

    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      if (node.id && safeId.test(node.id)) { parts.unshift('#' + node.id); break; }
      var part = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (parent) {
        var same = [];
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === node.tagName) same.push(parent.children[i]);
        }
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      if (!parent || parent === document.documentElement) break;
      node = parent;
      depth++;
    }
    return parts.join(' > ');
  }

  /* Small truncated HTML preview - never the full outerHTML. */
  function htmlPreview(el) {
    try { return trunc(el.outerHTML, MAX_HTML); } catch (e) { return ''; }
  }

  function meta(nameOrProp, attr) {
    var el = document.querySelector('meta[' + attr + '="' + nameOrProp + '"]');
    return el ? (el.getAttribute('content') || '').trim() : null;
  }
  function metaName(n) { return meta(n, 'name'); }
  function metaProp(n) { return meta(n, 'property'); }

  function isVisible(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    var rect = el.getBoundingClientRect();
    return !(rect.width === 0 && rect.height === 0);
  }

  function accName(el) {
    var name = (el.getAttribute('aria-label') || '').trim();
    if (name) return name;
    var labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      var ref = document.getElementById(labelledby);
      if (ref && ref.textContent.trim()) return ref.textContent.trim();
    }
    var title = (el.getAttribute('title') || '').trim();
    if (title) return title;
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text;
    var img = el.querySelector && el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim();
    return '';
  }

  var canonicalEl = document.querySelector('link[rel="canonical"]');
  var canonical = canonicalEl ? (canonicalEl.getAttribute('href') || '').trim() : null;

  var favicon = document.querySelector(
    'link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );

  // Headings (with selectors, for heading-structure issues)
  var headings = [];
  var hNodes = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
  for (var i = 0; i < hNodes.length; i++) {
    headings.push({
      level: parseInt(hNodes[i].tagName.substring(1), 10),
      text: trunc(hNodes[i].textContent, MAX_LABEL),
      selector: cssPath(hNodes[i]),
      tagName: hNodes[i].tagName.toLowerCase()
    });
  }

  // Links
  var links = [];
  var linkNodes = document.querySelectorAll('a');
  for (var l = 0; l < linkNodes.length && links.length < MAX_LINKS; l++) {
    var a = linkNodes[l];
    if (!isVisible(a)) continue;
    var rawHref = a.getAttribute('href');
    var inPage = null;
    var targetExists = null;
    if (rawHref && rawHref.charAt(0) === '#' && rawHref.length > 1) {
      inPage = rawHref.slice(1);
      try {
        targetExists = !!(document.getElementById(inPage) ||
          document.querySelector('[name="' + CSS.escape(inPage) + '"]'));
      } catch (e) { targetExists = !!document.getElementById(inPage); }
    }
    links.push({
      href: rawHref,
      resolvedHref: a.href || '',
      text: trunc(a.textContent, MAX_LABEL),
      ariaLabel: a.getAttribute('aria-label') || '',
      title: a.getAttribute('title') || '',
      target: a.getAttribute('target') || '',
      rel: a.getAttribute('rel') || '',
      hasImg: !!a.querySelector('img'),
      accName: trunc(accName(a), MAX_LABEL),
      selector: cssPath(a),
      html: htmlPreview(a),
      anchorName: inPage,
      anchorTargetExists: targetExists
    });
  }

  // Buttons + clickable elements
  var buttons = [];
  var btnNodes = document.querySelectorAll(
    'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]'
  );
  for (var b = 0; b < btnNodes.length && buttons.length < MAX_BUTTONS; b++) {
    var btn = btnNodes[b];
    if (!isVisible(btn)) continue;
    var val = btn.tagName === 'INPUT' ? (btn.getAttribute('value') || '') : '';
    buttons.push({
      tag: btn.tagName.toLowerCase(),
      role: btn.getAttribute('role') || '',
      text: trunc((btn.textContent || '') + ' ' + val, MAX_LABEL),
      accName: trunc(accName(btn) || val, MAX_LABEL),
      disabled: btn.disabled === true || btn.getAttribute('aria-disabled') === 'true',
      hasIconOnly: !((btn.textContent || '').trim()) && !!btn.querySelector('svg,img,i'),
      selector: cssPath(btn),
      html: htmlPreview(btn)
    });
  }

  // cursor:pointer elements that are not really interactive
  var pointerish = [];
  var candidates = document.querySelectorAll('div,span,li');
  var scanned = 0;
  for (var p = 0; p < candidates.length && pointerish.length < 60 && scanned < 4000; p++) {
    var c = candidates[p];
    scanned++;
    if (!isVisible(c)) continue;
    if (window.getComputedStyle(c).cursor !== 'pointer') continue;
    var role = c.getAttribute('role') || '';
    var interactive = role === 'button' || role === 'link' || role === 'menuitem' ||
      role === 'tab' || role === 'option' || c.hasAttribute('onclick') || c.closest('a,button');
    if (interactive) continue;
    pointerish.push({
      text: trunc(c.textContent, 80),
      role: role,
      hasAria: !!(c.getAttribute('aria-label') || c.getAttribute('title')),
      selector: cssPath(c),
      tagName: c.tagName.toLowerCase(),
      html: htmlPreview(c)
    });
  }

  // Images
  var images = [];
  var imgNodes = document.querySelectorAll('img');
  for (var im = 0; im < imgNodes.length && images.length < MAX_IMAGES; im++) {
    var img2 = imgNodes[im];
    if (!isVisible(img2)) continue;
    images.push({
      src: img2.getAttribute('src') || img2.currentSrc || '',
      alt: img2.getAttribute('alt'),
      hasAltAttr: img2.hasAttribute('alt'),
      width: img2.naturalWidth || img2.width || 0,
      height: img2.naturalHeight || img2.height || 0,
      role: img2.getAttribute('role') || '',
      selector: cssPath(img2),
      html: htmlPreview(img2)
    });
  }

  // Inputs (never read values; skip passwords entirely)
  var inputs = [];
  var inputNodes = document.querySelectorAll('input, textarea, select');
  for (var f = 0; f < inputNodes.length; f++) {
    var inp = inputNodes[f];
    var type = (inp.getAttribute('type') || inp.tagName.toLowerCase()).toLowerCase();
    if (type === 'hidden' || type === 'password') continue;
    if (!isVisible(inp)) continue;
    var id = inp.getAttribute('id');
    var hasLabel = false;
    if (id) {
      try { hasLabel = !!document.querySelector('label[for="' + CSS.escape(id) + '"]'); }
      catch (e) { hasLabel = false; }
    }
    if (!hasLabel && inp.closest('label')) hasLabel = true;
    inputs.push({
      type: type,
      hasLabel: hasLabel,
      ariaLabel: inp.getAttribute('aria-label') || '',
      ariaLabelledby: inp.getAttribute('aria-labelledby') || '',
      placeholder: inp.getAttribute('placeholder') || '',
      name: inp.getAttribute('name') || '',
      selector: cssPath(inp),
      tagName: inp.tagName.toLowerCase(),
      html: htmlPreview(inp)
    });
  }

  // Duplicate IDs (single pass over all [id] elements)
  var idMap = {};
  var idNodes = document.querySelectorAll('[id]');
  for (var d = 0; d < idNodes.length; d++) {
    var theId = idNodes[d].id;
    if (!theId) continue;
    if (!idMap[theId]) idMap[theId] = [];
    idMap[theId].push(idNodes[d]);
  }
  var duplicateIds = [];
  Object.keys(idMap).forEach(function (key) {
    if (idMap[key].length > 1 && duplicateIds.length < 50) {
      duplicateIds.push({
        id: key,
        count: idMap[key].length,
        tagName: idMap[key][0].tagName.toLowerCase(),
        selector: cssPath(idMap[key][1]) // second occurrence = the duplicate
      });
    }
  });

  // Footer
  var footerEl = document.querySelector('footer');
  var footerText = footerEl
    ? trunc(footerEl.innerText || footerEl.textContent, 5000)
    : '';

  // Visible text summary
  var bodyText = document.body ? (document.body.innerText || document.body.textContent || '') : '';
  bodyText = bodyText.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);

  // ---- Platform detection signals (DOM only, no extra requests) ----
  var scriptUrls = [];
  var scriptNodes = document.querySelectorAll('script[src]');
  for (var s = 0; s < scriptNodes.length && scriptUrls.length < 60; s++) {
    scriptUrls.push(scriptNodes[s].getAttribute('src') || '');
  }
  var styleUrls = [];
  var styleNodes = document.querySelectorAll('link[rel="stylesheet"][href]');
  for (var st = 0; st < styleNodes.length && styleUrls.length < 60; st++) {
    styleUrls.push(styleNodes[st].getAttribute('href') || '');
  }

  var globals = {};
  try { globals.hasNextData = !!document.getElementById('__NEXT_DATA__') || typeof window.__NEXT_DATA__ !== 'undefined'; } catch (e) {}
  try { globals.hasShopify = typeof window.Shopify !== 'undefined'; } catch (e) {}
  try { globals.hasWooCommerce = typeof window.woocommerce_params !== 'undefined' || typeof window.wc_add_to_cart_params !== 'undefined'; } catch (e) {}
  try { globals.hasWp = typeof window.wp !== 'undefined'; } catch (e) {}

  // Performance timing
  var perf = { dcl: null, load: null, transferSize: null };
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      perf.dcl = Math.round(nav.domContentLoadedEventEnd);
      perf.load = Math.round(nav.loadEventEnd);
      perf.transferSize = nav.transferSize || null;
    } else if (performance.timing) {
      var t = performance.timing;
      perf.dcl = t.domContentLoadedEventEnd - t.navigationStart;
      perf.load = t.loadEventEnd - t.navigationStart;
    }
  } catch (e) {}

  return {
    url: location.href,
    hostname: location.hostname,
    protocol: location.protocol,
    title: document.title || '',
    lang: document.documentElement.getAttribute('lang') || '',
    hasFavicon: !!favicon,
    faviconHref: favicon ? (favicon.getAttribute('href') || '') : '',
    viewport: metaName('viewport'),
    canonical: canonical,
    robots: metaName('robots'),
    metaDescription: metaName('description'),
    metaGenerator: metaName('generator') || '',
    bodyClasses: document.body ? (document.body.className || '') : '',
    og: {
      title: metaProp('og:title'),
      description: metaProp('og:description'),
      image: metaProp('og:image'),
      url: metaProp('og:url'),
      type: metaProp('og:type')
    },
    twitter: {
      card: metaName('twitter:card'),
      title: metaName('twitter:title'),
      description: metaName('twitter:description'),
      image: metaName('twitter:image')
    },
    headings: headings,
    links: links,
    buttons: buttons,
    pointerish: pointerish,
    images: images,
    inputs: inputs,
    duplicateIds: duplicateIds,
    footerText: footerText,
    bodyText: bodyText,
    resourceUrls: { scripts: scriptUrls, styles: styleUrls },
    globals: globals,
    counts: {
      images: document.querySelectorAll('img').length,
      scripts: document.querySelectorAll('script').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"], style').length
    },
    perf: perf
  };
})();
