import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSiteQA, makeData } from './harness.mjs';

const SiteQA = loadSiteQA();

const hasWebToolkitResults = (results) => results.some(r => r.category === 'WebToolkit');

describe('generic preset', () => {
  test('generic checks always run on an arbitrary site', () => {
    const { results, presetInfo } = SiteQA.run(makeData());
    assert.equal(presetInfo.basePreset, 'generic');
    assert.ok(presetInfo.activePresets.includes('generic'));
    // Every generic check group contributed something.
    for (const cat of ['Basic', 'SEO', 'Social', 'Links', 'Accessibility', 'Performance']) {
      assert.ok(results.some(r => r.category === cat), `expected results for ${cat}`);
    }
  });

  test('generic checks still run on webtoolkit.cloud', () => {
    const { results } = SiteQA.run(makeData({ hostname: 'webtoolkit.cloud', url: 'https://webtoolkit.cloud/' }));
    assert.ok(results.some(r => r.category === 'Basic'));
    assert.ok(hasWebToolkitResults(results));
  });

  test('every result is stamped with its source preset', () => {
    const { results } = SiteQA.run(makeData({ hostname: 'webtoolkit.cloud', url: 'https://webtoolkit.cloud/' }));
    assert.ok(results.every(r => r.source));
    assert.ok(results.filter(r => r.category === 'WebToolkit').every(r => r.source === 'webtoolkit'));
    assert.ok(results.filter(r => r.category === 'Basic').every(r => r.source === 'generic'));
  });
});

describe('WebToolkit preset hostname scoping', () => {
  const runs = (hostname) =>
    hasWebToolkitResults(SiteQA.run(makeData({ hostname, url: `https://${hostname}/` })).results);

  test('runs on webtoolkit.cloud', () => {
    assert.equal(runs('webtoolkit.cloud'), true);
  });

  test('runs on www.webtoolkit.cloud', () => {
    assert.equal(runs('www.webtoolkit.cloud'), true);
  });

  test('does not run on lookalike or nested fake domains', () => {
    for (const host of [
      'fakewebtoolkit.cloud',
      'webtoolkit.cloud.example.com',
      'another-webtoolkit.cloud',
      'webtoolkit.cloud.evil.com',
      'notwebtoolkit.cloud',
      'webtoolkit.cloudy.com',
      'sub.webtoolkit.cloud',
      'example.com'
    ]) {
      assert.equal(runs(host), false, `${host} must not activate WebToolkit checks`);
    }
  });

  test('hostnameMatches is exact, not substring', () => {
    const hosts = SiteQA.WEBTOOLKIT_HOSTS;
    assert.equal(SiteQA.hostnameMatches('webtoolkit.cloud', hosts), true);
    assert.equal(SiteQA.hostnameMatches('WEBTOOLKIT.CLOUD', hosts), true);
    assert.equal(SiteQA.hostnameMatches('webtoolkit.cloud.', hosts), true); // trailing dot
    assert.equal(SiteQA.hostnameMatches('fakewebtoolkit.cloud', hosts), false);
    assert.equal(SiteQA.hostnameMatches('', hosts), false);
    assert.equal(SiteQA.hostnameMatches(null, hosts), false);
    assert.equal(SiteQA.hostnameMatches('webtoolkit.cloud', undefined), false);
  });

  test('canonical/og:url checks match the host exactly, not by prefix', () => {
    const wt = (over) => SiteQA.run(makeData({
      hostname: 'webtoolkit.cloud',
      url: 'https://webtoolkit.cloud/',
      ...over
    })).results;

    const canonicalOf = (r) => r.find(x => x.id === 'webtoolkit.canonical.host');
    const ogUrlOf = (r) => r.find(x => x.id === 'webtoolkit.ogurl.host');

    // Genuine production URLs pass.
    assert.equal(canonicalOf(wt({ canonical: 'https://webtoolkit.cloud/tools/x' })).status, 'passed');
    assert.equal(canonicalOf(wt({ canonical: 'https://www.webtoolkit.cloud/' })).status, 'passed');

    // Lookalikes that a substring/prefix check could wrongly accept must warn.
    for (const bad of [
      'https://webtoolkit.cloud.evil.com/',
      'https://fakewebtoolkit.cloud/',
      'https://another-webtoolkit.cloud/',
      'https://webtoolkit.cloudy.com/',
      'http://webtoolkit.cloud/'   // right host, but not HTTPS
    ]) {
      assert.equal(canonicalOf(wt({ canonical: bad })).status, 'warning', `canonical must reject ${bad}`);
      assert.equal(ogUrlOf(wt({ og: { url: bad } })).status, 'warning', `og:url must reject ${bad}`);
    }
  });

  test('preset emits only public-behaviour checks', () => {
    // Allowlist, rather than naming removed checks: this fails if any rule based
    // on non-public information is ever reintroduced.
    const ALLOWED = [
      'webtoolkit.canonical',
      'webtoolkit.ogurl',
      'webtoolkit.footer.branding',
      'webtoolkit.brokenvalue'
    ];

    const { results } = SiteQA.run(makeData({
      hostname: 'webtoolkit.cloud',
      url: 'https://webtoolkit.cloud/',
      footerText: 'WebToolkit'
    }));

    const wt = results.filter(r => r.category === 'WebToolkit');
    assert.ok(wt.length > 0);
    for (const r of wt) {
      assert.ok(ALLOWED.some(prefix => r.id.startsWith(prefix)),
        `unexpected WebToolkit check id: ${r.id}`);
    }
    assert.ok(wt.some(r => r.id.startsWith('webtoolkit.canonical')));
  });

  test('badge label reads "Generic + WebToolkit" when active', () => {
    const { presetInfo } = SiteQA.run(makeData({ hostname: 'webtoolkit.cloud' }));
    // Spread: arrays built inside the VM context have a different Array.prototype.
    assert.deepEqual([...presetInfo.activePresets], ['generic', 'webtoolkit']);
    assert.equal(SiteQA.presetLabel(presetInfo.activePresets), 'Generic + WebToolkit');
  });
});

describe('platform detection', () => {
  test('returns nothing for a plain site', () => {
    const d = SiteQA.detectPlatform(makeData());
    assert.equal(d.platform, null);
    assert.equal(d.confidence, null);
  });

  test('WebToolkit detection is exact and high confidence', () => {
    const d = SiteQA.detectPlatform(makeData({ hostname: 'webtoolkit.cloud' }));
    assert.equal(d.platform, 'webtoolkit');
    assert.equal(d.confidence, 'high');
    assert.equal(d.exact, true);
  });

  test('one WordPress signal is medium confidence, two is high', () => {
    const one = SiteQA.detectPlatform(makeData({ metaGenerator: 'WordPress 6.5' }));
    assert.equal(one.platform, 'wordpress');
    assert.equal(one.confidence, 'medium');
    assert.equal(one.exact, false);
    assert.ok(one.reasons.length === 1);

    const two = SiteQA.detectPlatform(makeData({
      metaGenerator: 'WordPress 6.5',
      resourceUrls: { scripts: ['/wp-includes/js/a.js'], styles: ['/wp-content/themes/x/s.css'] }
    }));
    assert.equal(two.platform, 'wordpress');
    assert.equal(two.confidence, 'high');
    assert.ok(two.reasons.length >= 2);
  });

  test('detects Next.js from __NEXT_DATA__ and /_next/ assets', () => {
    const d = SiteQA.detectPlatform(makeData({
      globals: { hasNextData: true },
      resourceUrls: { scripts: ['/_next/static/chunk.js'], styles: [] }
    }));
    assert.equal(d.platform, 'nextjs');
    assert.equal(d.confidence, 'high');
  });

  test('detects Shopify from cdn.shopify.com', () => {
    const d = SiteQA.detectPlatform(makeData({
      resourceUrls: { scripts: ['https://cdn.shopify.com/s/files/x.js'], styles: [] }
    }));
    assert.equal(d.platform, 'shopify');
    assert.equal(d.confidence, 'medium');
  });

  test('WooCommerce wins over WordPress when both match', () => {
    const d = SiteQA.detectPlatform(makeData({
      metaGenerator: 'WordPress 6.5',
      bodyClasses: 'home woocommerce woocommerce-page',
      resourceUrls: { scripts: ['/wp-content/plugins/woocommerce/assets/js/a.js'], styles: [] }
    }));
    assert.equal(d.platform, 'woocommerce');
    assert.equal(d.confidence, 'high');
  });

  test('detection reasons are reported', () => {
    const d = SiteQA.detectPlatform(makeData({ metaGenerator: 'WordPress 6.5' }));
    assert.ok(Array.isArray(d.reasons));
    assert.match(d.reasons[0], /WordPress/i);
  });
});

describe('preset placeholders', () => {
  test('placeholder platforms are registered but never activate', () => {
    for (const id of ['wordpress', 'woocommerce', 'shopify', 'nextjs']) {
      assert.ok(SiteQA.presets[id], `${id} should be registered`);
      assert.equal(SiteQA.presets[id].placeholder, true);
      assert.equal(typeof SiteQA.presets[id].run, 'undefined');
    }
  });

  test('a detected placeholder platform does not change scoring or presets', () => {
    const wp = makeData({ metaGenerator: 'WordPress 6.5' });
    const plain = makeData();

    const wpRun = SiteQA.run(wp);
    const plainRun = SiteQA.run(plain);

    assert.equal(wpRun.presetInfo.detectedPreset, 'wordpress');
    // Detected, but not active: no WordPress rules exist yet.
    assert.deepEqual([...wpRun.presetInfo.activePresets], ['generic']);
    assert.equal(wpRun.summary.score, plainRun.summary.score);
  });

  test('resolvePresets exposes the documented shape', () => {
    const info = SiteQA.resolvePresets(makeData({ metaGenerator: 'WordPress 6.5' }));
    assert.equal(info.basePreset, 'generic');
    assert.equal(info.detectedPreset, 'wordpress');
    assert.equal(info.detectionConfidence, 'medium');
    assert.ok(Array.isArray(info.detectionReasons));
    assert.ok(Array.isArray(info.activePresets));
  });
});
