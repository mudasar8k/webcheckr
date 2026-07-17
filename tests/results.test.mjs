import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSiteQA, makeData } from './harness.mjs';

const SiteQA = loadSiteQA();

describe('affected element truncation', () => {
  test('long text and html are truncated safely', () => {
    const a = SiteQA.affected({
      selector: 'div',
      text: 'x'.repeat(500),
      html: '<div>' + 'y'.repeat(500) + '</div>'
    });
    assert.ok(a.text.length <= SiteQA.LIMITS.MAX_TEXT + 1, 'text should be truncated');
    assert.ok(a.html.length <= SiteQA.LIMITS.MAX_HTML + 1, 'html should be truncated');
    assert.ok(a.text.endsWith('…'));
    assert.ok(a.html.endsWith('…'));
  });

  test('short values are preserved verbatim', () => {
    const a = SiteQA.affected({ text: 'Short', selector: '#a' });
    assert.equal(a.text, 'Short');
    assert.equal(a.selector, '#a');
  });

  test('whitespace is collapsed', () => {
    assert.equal(SiteQA.truncate('  a \n\n b  ', 50), 'a b');
  });

  test('truncate handles null/undefined without throwing', () => {
    assert.equal(SiteQA.truncate(null, 10), '');
    assert.equal(SiteQA.truncate(undefined, 10), '');
  });

  test('affected() drops empty fields rather than storing blanks', () => {
    const a = SiteQA.affected({ selector: 'a', text: '', url: '' });
    assert.equal(a.selector, 'a');
    assert.ok(!('text' in a));
    assert.ok(!('url' in a));
  });

  test('affected list is capped at MAX_AFFECTED', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ selector: '#i' + i }));
    const list = SiteQA.affectedList(many);
    assert.equal(list.length, SiteQA.LIMITS.MAX_AFFECTED);
    assert.equal(list.length, 50);
  });

  test('results cap their stored affected elements', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ selector: '#i' + i }));
    const r = SiteQA.warn('Accessibility', 'x', 'X', 'm', { elements: many });
    assert.equal(r.affectedElements.length, 50);
  });

  test('tagName is normalized to lowercase', () => {
    assert.equal(SiteQA.affected({ tagName: 'IMG' }).tagName, 'img');
  });

  test('a check attaches affected elements with selectors', () => {
    const results = SiteQA.checks.accessibility(makeData({
      images: [
        { src: '/a.png', hasAltAttr: false, role: '', selector: 'main > img', html: '<img src="/a.png">' },
        { src: '/b.png', hasAltAttr: true, alt: 'ok', role: '', selector: 'main > img:nth-of-type(2)' }
      ]
    }));
    const alt = results.find(r => r.id === 'a11y.img.alt');
    assert.equal(alt.status, 'warning');
    assert.equal(alt.severity, 'high');
    assert.equal(alt.affectedElements.length, 1);
    assert.equal(alt.affectedElements[0].selector, 'main > img');
    assert.equal(alt.affectedElements[0].tagName, 'img');
  });

  test('duplicate IDs are reported with affected elements', () => {
    const results = SiteQA.checks.accessibility(makeData({
      duplicateIds: [{ id: 'main', count: 3, tagName: 'div', selector: 'body > div:nth-of-type(2)' }]
    }));
    const dupe = results.find(r => r.id === 'a11y.id.duplicate');
    assert.equal(dupe.status, 'warning');
    assert.equal(dupe.affectedElements[0].value, 'main');
    assert.match(dupe.affectedElements[0].location, /3 times/);
  });

  test('broken in-page anchors are reported', () => {
    const results = SiteQA.checks.links(makeData({
      links: [{
        href: '#nope', resolvedHref: 'https://example.com/#nope', text: 'Jump',
        accName: 'Jump', selector: 'a', anchorName: 'nope', anchorTargetExists: false
      }]
    }));
    const broken = results.find(r => r.id === 'links.anchor.broken');
    assert.equal(broken.status, 'warning');
    assert.equal(broken.affectedElements.length, 1);
  });
});

describe('highlight selectors', () => {
  test('affected elements from DOM checks carry usable selectors', () => {
    const { results } = SiteQA.run(makeData({
      images: [{ src: '/a.png', hasAltAttr: false, role: '', selector: 'main article img:nth-of-type(2)' }],
      links: [{ href: '', resolvedHref: '', text: '', accName: '', selector: 'nav > a:nth-of-type(3)' }],
      buttons: [{ tag: 'button', accName: '', text: '', disabled: false, hasIconOnly: true, selector: '#buy' }]
    }));

    const withSelectors = results
      .flatMap(r => r.affectedElements || [])
      .filter(a => a.selector);

    assert.ok(withSelectors.length > 0);
    // Selectors must be non-empty strings that never contain raw newlines/quotes
    // that would break querySelector when injected.
    for (const a of withSelectors) {
      assert.equal(typeof a.selector, 'string');
      assert.ok(a.selector.length > 0);
      assert.doesNotMatch(a.selector, /[\n\r]/);
    }
  });

  test('highlightInPage is serializable for executeScript injection', () => {
    // It must be self-contained: no closure over SiteQA/popup scope.
    const src = SiteQA.highlightInPage.toString();
    assert.doesNotMatch(src, /SiteQA\./);
    assert.match(src, /querySelector/);
  });
});

describe('issues-only filtering', () => {
  const data = makeData({
    title: '',                                   // failed/high
    images: [{ src: '/a.png', hasAltAttr: false, role: '', selector: 'img' }] // warning/high
  });

  test('issues mode hides passed checks but keeps failures and warnings', () => {
    const { results } = SiteQA.run(data);
    const issues = SiteQA.filterResults(results, 'all', 'issues');

    assert.ok(issues.length > 0);
    assert.ok(issues.every(r => r.status !== 'passed'));
    assert.ok(issues.some(r => r.status === 'failed'));
    assert.ok(issues.some(r => r.status === 'warning'));
  });

  test('all mode includes passed checks', () => {
    const { results } = SiteQA.run(data);
    const all = SiteQA.filterResults(results, 'all', 'all');
    assert.ok(all.some(r => r.status === 'passed'));
    assert.equal(all.length, results.length);
  });

  test('passed checks are never removed from the underlying data', () => {
    const { results, summary } = SiteQA.run(data);
    assert.ok(results.some(r => r.status === 'passed'));
    assert.ok(summary.passed > 0);
  });

  test('status filters select the right statuses', () => {
    const { results } = SiteQA.run(data);
    assert.ok(SiteQA.filterResults(results, 'failed', 'all').every(r => r.status === 'failed'));
    assert.ok(SiteQA.filterResults(results, 'warning', 'all').every(r => r.status === 'warning'));
  });

  test('category filter selects only that category', () => {
    const { results } = SiteQA.run(data);
    const seo = SiteQA.filterResults(results, 'SEO', 'all');
    assert.ok(seo.length > 0);
    assert.ok(seo.every(r => r.category === 'SEO'));
  });

  test('issues mode keeps informational results that have affected elements', () => {
    const results = [
      { id: 'i1', status: 'informational', severity: 'informational', category: 'Buttons', affectedElements: [{ selector: 'b' }] },
      { id: 'i2', status: 'informational', severity: 'informational', category: 'Links', affectedElements: [] }
    ];
    const issues = SiteQA.filterResults(results, 'all', 'issues');
    assert.equal(issues.length, 1);
    assert.equal(issues[0].id, 'i1');
  });
});

describe('filter counts', () => {
  test('counts match the filtered result length per filter', () => {
    const { results } = SiteQA.run(makeData({ title: '' }));
    const filters = ['all', 'failed', 'warning', 'SEO', 'Links'];
    const counts = SiteQA.filterCounts(results, filters, 'all');

    for (const f of filters) {
      assert.equal(counts[f], SiteQA.filterResults(results, f, 'all').length, `count mismatch for ${f}`);
    }
    assert.equal(counts.all, results.length);
  });

  test('counts respect the current mode', () => {
    const { results } = SiteQA.run(makeData({ title: '' }));
    const all = SiteQA.filterCounts(results, ['all'], 'all');
    const issues = SiteQA.filterCounts(results, ['all'], 'issues');
    assert.ok(issues.all < all.all, 'issues-only should count fewer than all');
  });

  test('a clean page reports zero failures', () => {
    const { results } = SiteQA.run(makeData());
    assert.equal(SiteQA.filterCounts(results, ['failed'], 'all').failed, 0);
  });

  test('the primary chip reads "Issues" in issues mode and "All" in all mode', () => {
    assert.equal(SiteQA.primaryFilterLabel('issues'), 'Issues');
    assert.equal(SiteQA.primaryFilterLabel('all'), 'All');
  });

  test('"Issues N" counts only issues; "All N" counts every result', () => {
    const { results } = SiteQA.run(makeData({
      title: '',                                                            // failed
      images: [{ src: '/a.png', hasAltAttr: false, role: '', selector: 'img' }] // warning
    }));

    const issuesCount = SiteQA.filterCounts(results, ['all'], 'issues').all;
    const allCount = SiteQA.filterCounts(results, ['all'], 'all').all;

    // "All N" is the true total of every result.
    assert.equal(allCount, results.length);
    // "Issues N" excludes passed checks, so it is strictly smaller here.
    assert.ok(issuesCount < allCount);
    assert.equal(issuesCount, SiteQA.filterResults(results, 'all', 'issues').length);
    // And it never counts a passed check.
    assert.ok(SiteQA.filterResults(results, 'all', 'issues').every(r => r.status !== 'passed'));
  });

  test('status and category counts stay accurate in both modes', () => {
    const { results, summary } = SiteQA.run(makeData({
      title: '',
      og: { title: null, description: null, image: null, url: null, type: null },
      twitter: {},
      counts: { images: 0, scripts: 2, stylesheets: 1 }
    }));

    for (const mode of ['issues', 'all']) {
      const keys = ['failed', 'warning', 'SEO', 'Social', 'Performance', 'Links', 'Accessibility'];
      const counts = SiteQA.filterCounts(results, keys, mode);
      for (const k of keys) {
        assert.equal(counts[k], SiteQA.filterResults(results, k, mode).length, `${k} count wrong in ${mode} mode`);
      }
    }

    // Status chips are mode-independent: failures/warnings are never hidden.
    assert.equal(SiteQA.filterCounts(results, ['failed'], 'issues').failed,
      SiteQA.filterCounts(results, ['failed'], 'all').failed);
    assert.equal(SiteQA.filterCounts(results, ['warning'], 'issues').warning,
      SiteQA.filterCounts(results, ['warning'], 'all').warning);

    // And they agree with the summary.
    assert.equal(SiteQA.filterCounts(results, ['failed'], 'all').failed, summary.failed);
    assert.equal(SiteQA.filterCounts(results, ['warning'], 'all').warning, summary.warnings);
  });
});

describe('category auto-expansion', () => {
  const r = (status, severity) => ({ id: 'x' + Math.random(), status, severity, category: 'SEO' });

  test('a category with a failure expands', () => {
    assert.equal(SiteQA.shouldExpandCategory([r('failed', 'high'), r('passed', 'passed')]), true);
  });

  test('a category with a warning expands', () => {
    assert.equal(SiteQA.shouldExpandCategory([r('warning', 'low'), r('passed', 'passed')]), true);
  });

  test('a passed-only category stays collapsed', () => {
    assert.equal(SiteQA.shouldExpandCategory([r('passed', 'passed'), r('passed', 'passed')]), false);
  });

  test('an informational-only category stays collapsed', () => {
    assert.equal(SiteQA.shouldExpandCategory([r('informational', 'informational')]), false);
  });

  test('a mixed passed/informational category stays collapsed', () => {
    assert.equal(SiteQA.shouldExpandCategory([r('passed', 'passed'), r('informational', 'informational')]), false);
  });

  test('an empty category does not throw', () => {
    assert.equal(SiteQA.shouldExpandCategory([]), false);
    assert.equal(SiteQA.shouldExpandCategory(undefined), false);
  });

  test('on a real scan, every category holding an issue expands', () => {
    const { results } = SiteQA.run(makeData({ title: '', viewport: null }));
    const byCat = {};
    for (const x of results) (byCat[x.category] ||= []).push(x);

    for (const [cat, items] of Object.entries(byCat)) {
      const hasIssue = items.some(i => i.status === 'failed' || i.status === 'warning');
      assert.equal(SiteQA.shouldExpandCategory(items), hasIssue, `${cat} expansion default wrong`);
    }
    // Basic has the missing title + viewport, so it must open.
    assert.equal(SiteQA.shouldExpandCategory(byCat.Basic), true);
  });
});

describe('page health summary', () => {
  test('mentions a healthy page when nothing is wrong', () => {
    const results = [{ id: 'a', status: 'passed', severity: 'passed', category: 'Basic' }];
    const s = SiteQA.healthSummary(results, SiteQA.summarize(results));
    assert.match(s, /healthy/i);
  });

  test('calls out critical issues first', () => {
    const results = [{ id: 'a', status: 'failed', severity: 'critical', category: 'Basic' }];
    const s = SiteQA.healthSummary(results, SiteQA.summarize(results));
    assert.match(s, /1 critical issue/i);
  });

  test('states when no critical or high issues were found', () => {
    const results = [{ id: 'a', status: 'warning', severity: 'low', category: 'Basic' }];
    const s = SiteQA.healthSummary(results, SiteQA.summarize(results));
    assert.match(s, /No critical or high-priority issues/i);
    assert.match(s, /1 lower-priority issue/i);
  });

  test('names the most affected categories', () => {
    const results = [
      { id: 'a', status: 'failed', severity: 'high', category: 'Accessibility' },
      { id: 'b', status: 'failed', severity: 'high', category: 'Accessibility' },
      { id: 'c', status: 'warning', severity: 'low', category: 'SEO' }
    ];
    const s = SiteQA.healthSummary(results, SiteQA.summarize(results));
    assert.match(s, /Accessibility/);
  });

  test('is deterministic for identical input', () => {
    const results = [{ id: 'a', status: 'warning', severity: 'medium', category: 'SEO' }];
    const sum = SiteQA.summarize(results);
    assert.equal(SiteQA.healthSummary(results, sum), SiteQA.healthSummary(results, sum));
  });
});
