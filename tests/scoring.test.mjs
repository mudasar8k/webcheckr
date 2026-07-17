import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadSiteQA } from './harness.mjs';

const SiteQA = loadSiteQA();

describe('severity mapping', () => {
  test('each severity maps to its configured deduction', () => {
    assert.equal(SiteQA.deductionFor('critical'), 15);
    assert.equal(SiteQA.deductionFor('high'), 8);
    assert.equal(SiteQA.deductionFor('medium'), 4);
    assert.equal(SiteQA.deductionFor('low'), 1);
    assert.equal(SiteQA.deductionFor('informational'), 0);
    assert.equal(SiteQA.deductionFor('passed'), 0);
  });

  test('unknown severity deducts nothing rather than NaN', () => {
    assert.equal(SiteQA.deductionFor('bogus'), 0);
    assert.equal(SiteQA.deductionFor(undefined), 0);
  });

  test('builders apply the documented default severities', () => {
    assert.equal(SiteQA.pass('Basic', 'a', 'A', 'm').severity, 'passed');
    assert.equal(SiteQA.warn('Basic', 'b', 'B', 'm').severity, 'medium');
    assert.equal(SiteQA.fail('Basic', 'c', 'C', 'm').severity, 'high');
    assert.equal(SiteQA.info('Basic', 'd', 'D', 'm').severity, 'informational');
  });

  test('builders set matching statuses', () => {
    assert.equal(SiteQA.pass('Basic', 'a', 'A', 'm').status, 'passed');
    assert.equal(SiteQA.warn('Basic', 'b', 'B', 'm').status, 'warning');
    assert.equal(SiteQA.fail('Basic', 'c', 'C', 'm').status, 'failed');
    assert.equal(SiteQA.info('Basic', 'd', 'D', 'm').status, 'informational');
  });

  test('explicit severity overrides the default', () => {
    const r = SiteQA.warn('Basic', 'x', 'X', 'm', { severity: 'low' });
    assert.equal(r.severity, 'low');
    assert.equal(r.status, 'warning');
  });

  test('missing page title is failed/high and long title is warning/low', () => {
    const missing = SiteQA.checks.basic({ title: '', protocol: 'https:', hostname: 'e.com', viewport: 'x', lang: 'en', hasFavicon: true, canonical: 'x', metaDescription: 'x' })
      .find(r => r.id === 'basic.title.missing');
    assert.equal(missing.status, 'failed');
    assert.equal(missing.severity, 'high');

    const long = SiteQA.checks.basic({ title: 'x'.repeat(80), protocol: 'https:', hostname: 'e.com', viewport: 'x', lang: 'en', hasFavicon: true, canonical: 'x', metaDescription: 'x' })
      .find(r => r.id === 'basic.title.long');
    assert.equal(long.status, 'warning');
    assert.equal(long.severity, 'low');
  });
});

describe('weighted score calculation', () => {
  const r = (severity, status = 'warning', category = 'SEO') =>
    ({ id: 'x' + Math.random(), severity, status, category });

  test('deducts the weighted sum from 100', () => {
    // 15 + 8 + 4 + 1 = 28
    const s = SiteQA.summarize([r('critical'), r('high'), r('medium'), r('low')]);
    assert.equal(s.score, 72);
    assert.equal(s.deduction, 28);
  });

  test('all passed checks score 100', () => {
    const s = SiteQA.summarize([r('passed', 'passed'), r('passed', 'passed')]);
    assert.equal(s.score, 100);
    assert.equal(s.passed, 2);
  });

  test('no results scores 100', () => {
    assert.equal(SiteQA.summarize([]).score, 100);
  });

  test('score cannot go below 0', () => {
    const many = Array.from({ length: 40 }, () => r('critical')); // 600 points
    const s = SiteQA.summarize(many);
    assert.equal(s.score, 0);
    assert.ok(s.deduction > 100);
  });

  test('score cannot exceed 100', () => {
    const s = SiteQA.summarize([r('passed', 'passed'), r('informational', 'informational')]);
    assert.ok(s.score <= 100);
    assert.equal(s.score, 100);
  });

  test('clampScore bounds both ends', () => {
    assert.equal(SiteQA.clampScore(-50), 0);
    assert.equal(SiteQA.clampScore(150), 100);
    assert.equal(SiteQA.clampScore(72.4), 72);
  });

  test('informational checks do not reduce the score', () => {
    const s = SiteQA.summarize([
      r('informational', 'informational'),
      r('informational', 'informational'),
      r('informational', 'informational')
    ]);
    assert.equal(s.score, 100);
    assert.equal(s.informational, 3);
  });

  test('informational results alongside issues only cost the issue weight', () => {
    const s = SiteQA.summarize([r('high'), r('informational', 'informational')]);
    assert.equal(s.score, 92);
  });

  test('counts each status separately', () => {
    const s = SiteQA.summarize([
      r('passed', 'passed'), r('high', 'failed'), r('low', 'warning'), r('informational', 'informational')
    ]);
    assert.deepEqual(
      { p: s.passed, w: s.warnings, f: s.failed, i: s.informational },
      { p: 1, w: 1, f: 1, i: 1 }
    );
  });
});

describe('category scores', () => {
  test('categories are scored independently', () => {
    const s = SiteQA.summarize([
      { id: '1', severity: 'critical', status: 'failed', category: 'SEO' },
      { id: '2', severity: 'passed', status: 'passed', category: 'Links' }
    ]);
    const seo = s.categories.find(c => c.category === 'SEO');
    const links = s.categories.find(c => c.category === 'Links');
    assert.equal(seo.score, 85);
    assert.equal(links.score, 100);
  });

  test('display categories map onto the six score categories', () => {
    assert.equal(SiteQA.scoreCategoryFor('Social'), 'SEO');
    assert.equal(SiteQA.scoreCategoryFor('Basic'), 'Basic');
    assert.equal(SiteQA.scoreCategoryFor('Accessibility'), 'Accessibility');
    assert.equal(SiteQA.scoreCategoryFor('Downloads'), 'Best Practices');
    assert.equal(SiteQA.scoreCategoryFor('WebToolkit'), 'Best Practices');
    // Unknown categories fall back rather than inventing a bucket.
    assert.equal(SiteQA.scoreCategoryFor('Something New'), 'Best Practices');
  });

  test('a category score cannot go below 0', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      ({ id: String(i), severity: 'critical', status: 'failed', category: 'SEO' }));
    const s = SiteQA.summarize(many);
    assert.equal(s.categories.find(c => c.category === 'SEO').score, 0);
  });
});
