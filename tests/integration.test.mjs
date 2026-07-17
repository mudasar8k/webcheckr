import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteQA, makeData, LOAD_ORDER } from './harness.mjs';

const SiteQA = loadSiteQA();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('script load order', () => {
  test('popup.html loads the same files in the same order as the harness', () => {
    const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
    const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
    // popup.js is the controller and is not part of the testable core.
    const core = srcs.filter(s => s !== 'popup.js');
    assert.deepEqual(core, [...LOAD_ORDER],
      'popup.html and tests/harness.mjs load order have drifted apart');
  });

  test('every file referenced by popup.html exists', () => {
    const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
    for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
      assert.ok(fs.existsSync(path.join(root, m[1])), `${m[1]} is missing`);
    }
  });
});

describe('end-to-end on a messy page', () => {
  // A page with one of almost everything wrong.
  const messy = makeData({
    url: 'https://webtoolkit.cloud/tools/broken',
    hostname: 'webtoolkit.cloud',
    title: 'WebToolkit | WebToolkit',
    canonical: null,
    viewport: null,
    lang: '',
    metaDescription: 'too short',
    og: { title: null, description: null, image: '/relative.png', url: 'http://webtoolkit.cloud/x', type: null },
    twitter: {},
    headings: [{ level: 2, text: 'Sub', selector: 'h2', tagName: 'h2' }],
    links: [
      { href: '#', resolvedHref: '', text: '', accName: '', selector: 'nav > a', target: '_blank', rel: '' },
      { href: '/api/download/undefined', resolvedHref: 'https://webtoolkit.cloud/api/download/undefined', text: 'Download', accName: 'Download', selector: 'a#dl' }
    ],
    buttons: [{ tag: 'button', accName: '', text: '', disabled: false, hasIconOnly: true, selector: '#icon' }],
    images: [{ src: '/p.jpg', hasAltAttr: false, role: '', selector: 'main img' }],
    inputs: [{ type: 'text', hasLabel: false, ariaLabel: '', placeholder: '', name: 'q', selector: '#q', tagName: 'input' }],
    duplicateIds: [{ id: 'main', count: 2, tagName: 'div', selector: 'div:nth-of-type(2)' }],
    bodyText: 'Size: NaN MB and undefined value',
    footerText: 'Site footer'
  });

  const outcome = SiteQA.run(messy);

  test('produces failures, warnings and a low score', () => {
    assert.ok(outcome.summary.failed > 0);
    assert.ok(outcome.summary.warnings > 0);
    assert.ok(outcome.summary.score < 60);
    assert.ok(outcome.summary.score >= 0);
  });

  test('runs both generic and WebToolkit checks', () => {
    assert.deepEqual([...outcome.presetInfo.activePresets], ['generic', 'webtoolkit']);
    assert.ok(outcome.results.some(r => r.source === 'generic'));
    assert.ok(outcome.results.some(r => r.source === 'webtoolkit'));
  });

  test('catches the critical download URL', () => {
    const critical = outcome.results.filter(r => r.severity === 'critical');
    assert.ok(critical.some(r => r.id === 'downloads.url.undefined'));
  });

  test('every result conforms to the shared model', () => {
    const STATUSES = ['passed', 'warning', 'failed', 'informational'];
    const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational', 'passed'];
    for (const r of outcome.results) {
      assert.equal(typeof r.id, 'string', 'id must be a string');
      assert.ok(r.id.length > 0, 'id must not be empty');
      assert.equal(typeof r.title, 'string');
      assert.equal(typeof r.category, 'string');
      assert.ok(STATUSES.includes(r.status), `bad status: ${r.status}`);
      assert.ok(SEVERITIES.includes(r.severity), `bad severity on ${r.id}: ${r.severity}`);
      assert.ok(Array.isArray(r.affectedElements));
      assert.ok(r.source, `${r.id} is missing a source`);
      // A passed check must never carry a scoring penalty.
      if (r.status === 'passed') assert.equal(r.severity, 'passed');
    }
  });

  test('result ids are unique', () => {
    const ids = outcome.results.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate result ids: ' +
      ids.filter((id, i) => ids.indexOf(id) !== i).join(', '));
  });

  test('health summary reflects the critical findings', () => {
    assert.match(outcome.healthSummary, /critical/i);
  });

  test('a clean generic page scores 100 with no issues', () => {
    const clean = SiteQA.run(makeData({ counts: { images: 0, scripts: 2, stylesheets: 1 } }));
    assert.equal(clean.summary.failed, 0);
    assert.equal(clean.summary.warnings, 0);
    assert.equal(clean.summary.score, 100);
    assert.match(clean.healthSummary, /healthy/i);
  });
});
