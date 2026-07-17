/*
 * Platform preset placeholders.
 *
 * These are registered so detection, the preset picker and the report can
 * already reference them by a stable id, but they contribute NO checks yet.
 * `placeholder: true` keeps SiteQA.resolvePresets from activating them, so a
 * detected platform never changes scoring until its rules actually land.
 *
 * To implement one: drop `placeholder`, add `run(data)` returning results, and
 * add the file to popup.html. Generic checks keep running underneath either way.
 */
[
  { id: 'wordpress', name: 'WordPress' },
  { id: 'woocommerce', name: 'WooCommerce' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'nextjs', name: 'Next.js' }
].forEach(function (p) {
  SiteQA.presets[p.id] = {
    id: p.id,
    name: p.name,
    shortName: p.name,
    placeholder: true,
    matches: function () { return false; }
  };
});
