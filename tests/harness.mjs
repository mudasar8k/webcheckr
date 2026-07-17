/*
 * Test harness: loads the extension's plain browser scripts into a fresh VM
 * context (the same order popup.html uses) and hands back the SiteQA object.
 *
 * The extension ships as unpacked MV3 with no bundler, so the scripts are
 * loaded here exactly as Chrome loads them rather than through an import graph.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Must mirror the <script> order in popup.html.
export const LOAD_ORDER = [
  'utils/dom.js',
  'checks/basic.js',
  'checks/seo.js',
  'checks/social.js',
  'checks/links.js',
  'checks/buttons.js',
  'checks/downloads.js',
  'checks/accessibility.js',
  'checks/content-quality.js',
  'checks/performance.js',
  'utils/scoring.js',
  'utils/detect.js',
  'presets/webtoolkit.js',
  'presets/platforms.js',
  'presets/generic.js',
  'utils/runner.js',
  'utils/highlight.js',
  'utils/report.js'
];

export function loadSiteQA() {
  const ctx = { console, URL, setTimeout, clearTimeout };
  ctx.window = ctx;          // scripts assign to `window.SiteQA`
  ctx.globalThis = ctx;
  vm.createContext(ctx);

  for (const file of LOAD_ORDER) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx.SiteQA;
}

/* Minimal, valid page snapshot. Override fields per test. */
export function makeData(overrides = {}) {
  return {
    url: 'https://example.com/',
    hostname: 'example.com',
    protocol: 'https:',
    title: 'Example Domain Test Page',
    lang: 'en',
    hasFavicon: true,
    viewport: 'width=device-width, initial-scale=1',
    canonical: 'https://example.com/',
    robots: null,
    metaDescription: 'A description that is comfortably within the fifty to one hundred and sixty character range for tests.',
    metaGenerator: '',
    bodyClasses: '',
    og: { title: 'T', description: 'D', image: 'https://example.com/og.png', url: 'https://example.com/', type: 'website' },
    twitter: { card: 'summary_large_image', title: 'T', description: 'D', image: 'https://example.com/og.png' },
    headings: [{ level: 1, text: 'Hello', selector: 'h1', tagName: 'h1' }],
    links: [],
    buttons: [],
    pointerish: [],
    images: [],
    inputs: [],
    duplicateIds: [],
    footerText: '',
    bodyText: 'Welcome to the example page.',
    resourceUrls: { scripts: [], styles: [] },
    globals: {},
    counts: { images: 1, scripts: 2, stylesheets: 1 },
    perf: { dcl: 400, load: 900, transferSize: 10240 },
    ...overrides
  };
}
