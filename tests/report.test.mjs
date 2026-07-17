import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSiteQA, makeData } from './harness.mjs';

const SiteQA = loadSiteQA();

function buildFor(data) {
  const { results, summary, presetInfo, healthSummary } = SiteQA.run(data);
  return SiteQA.buildReport(data, results, summary, presetInfo, healthSummary);
}

describe('copied report', () => {
  test('includes the documented header fields', () => {
    const data = makeData();
    const report = buildFor(data);

    assert.match(report, /WebCheckr Report/);
    assert.match(report, /URL: https:\/\/example\.com\//);
    assert.match(report, /Title: Example Domain Test Page/);
    assert.match(report, /Date: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    assert.match(report, /Score: \d+\/100/);
    assert.match(report, /Presets: Generic/);
  });

  test('includes all four counts', () => {
    const report = buildFor(makeData());
    assert.match(report, /Passed: \d+ \| Warnings: \d+ \| Failed: \d+ \| Informational: \d+/);
  });

  test('includes category scores', () => {
    const report = buildFor(makeData());
    assert.match(report, /Category scores:/);
    assert.match(report, /- Basic: \d+\/100/);
    assert.match(report, /- SEO: \d+\/100/);
  });

  test('includes the health summary', () => {
    const report = buildFor(makeData());
    assert.match(report, /Summary:/);
  });

  test('prints a severity tag for each issue', () => {
    const report = buildFor(makeData({ title: 'x'.repeat(80) }));
    // e.g. "[Low] Title length"
    assert.match(report, /\[Low\] Title length/);
    assert.match(report, /Title is long at 80 characters\./);
    assert.match(report, /Fix: Aim for approximately 10–65 characters/);
  });

  test('prints affected element counts but never raw HTML', () => {
    const report = buildFor(makeData({
      images: [{
        src: '/product.jpg', hasAltAttr: false, role: '',
        selector: 'main article img:nth-of-type(2)',
        html: '<img src="/product.jpg" class="a-very-long-class-name-here">'
      }]
    }));

    assert.match(report, /Affected elements: 1/);
    // The report must stay compact: no serialized element HTML.
    assert.doesNotMatch(report, /<img src=/);
    assert.doesNotMatch(report, /a-very-long-class-name-here/);
    assert.doesNotMatch(report, /Selector:/);
  });

  test('groups issues under Failed / Warnings headings', () => {
    const report = buildFor(makeData({ title: '', viewport: null }));
    assert.match(report, /Failed \(\d+\):/);
    assert.match(report, /\[High\] Page title/);
  });

  test('keeps passed checks in the report as a compact list', () => {
    const report = buildFor(makeData());
    assert.match(report, /Passed \(\d+\):/);
    assert.match(report, /1\. \[Basic\]/);
  });

  test('reports active presets and exact detection on webtoolkit.cloud', () => {
    const report = buildFor(makeData({ hostname: 'webtoolkit.cloud', url: 'https://webtoolkit.cloud/' }));
    assert.match(report, /Presets: Generic \+ WebToolkit/);
    assert.match(report, /Platform: webtoolkit \(confidence: high\)/);
  });

  test('reports a likely platform with confidence when detection is inexact', () => {
    const report = buildFor(makeData({ metaGenerator: 'WordPress 6.5' }));
    assert.match(report, /Likely platform: wordpress \(confidence: medium\)/);
  });

  test('states that nothing left the browser', () => {
    assert.match(buildFor(makeData()), /No data left the browser/);
  });

  test('critical download failure is reported as [Critical]', () => {
    const report = buildFor(makeData({
      links: [{
        href: '/api/download/undefined',
        resolvedHref: 'https://example.com/api/download/undefined',
        text: 'Download', accName: 'Download', selector: 'a#dl'
      }]
    }));
    assert.match(report, /\[Critical\] Broken download URL/);
  });
});
