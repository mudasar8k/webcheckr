<p align="center">
  <img src="icons/source/webcheckr-logo.png" alt="WebCheckr logo" width="120">
</p>

<h1 align="center">WebCheckr</h1>

<p align="center"><strong>WebCheckr — Website QA Inspector</strong></p>

WebCheckr is a free and open-source Chrome extension for inspecting webpages for common SEO, accessibility, link, performance, usability, and website-quality issues.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](manifest.json)
[![Tests](https://img.shields.io/badge/tests-84%20passing-brightgreen.svg)](tests)

---

## Overview

Open any webpage, click the WebCheckr icon, and press **Run QA**. WebCheckr reads the page once and reports what a careful QA reviewer would look for before a launch: missing metadata, broken-looking links, unlabeled buttons, images without alt text, leaked `undefined` values, and more.

Every result carries a **severity**, a plain-English explanation, a suggested fix, and — where it applies to a real element — the ability to **highlight it on the page** or **copy its CSS selector**.

Inspection is **local and informational**. WebCheckr reads the page you are already looking at, in your own browser. It does not crawl your site, log in, attack anything, or send your data anywhere.

## Features

- **Weighted scoring** — an overall 0–100 score plus independent scores for Basic, SEO, Accessibility, Links, Performance, and Best Practices.
- **Six severity levels** — Critical, High, Medium, Low, Informational, Passed. Informational never affects your score.
- **Actionable by default** — results open in *Issues only* mode; passed checks stay one click away and are never dropped from the report.
- **Affected elements** — see exactly which elements failed, with **Highlight on page** and **Copy selector**.
- **Page health summary** — a short, deterministic plain-English verdict (no AI, no network).
- **Collapsible categories** and filter chips with live counts.
- **Copy Report** — a compact plain-text report for tickets, PRs, or email.
- **Light and dark themes**, following your system preference.
- **Platform presets** that add checks on top of the generic ones.

## Supported websites

WebCheckr is a **generic** website QA tool. The generic checks read standard HTML, so they work on essentially any site, including:

- WordPress
- WooCommerce
- Shopify
- Laravel
- Next.js and React
- Angular and Vue
- Static HTML/CSS
- SaaS applications
- E-commerce stores
- Blogs
- Business websites
- Landing pages
- Educational websites
- Nonprofit and government websites

It also works on staging sites, client sites, and local development (`localhost`), where it adapts a few checks — for example, it will not demand HTTPS on a local page.

## Generic checks

**Generic checks always run, on every website.** They are the base of the tool and are never replaced or altered by a preset.

| Category | What it checks |
| --- | --- |
| **Basic** | Title presence/length, meta description presence/length, canonical, viewport, HTTPS, `<html lang>`, favicon |
| **SEO** | Robots meta, H1 presence/uniqueness/emptiness, heading order, canonical domain, duplicated brand in title |
| **Social** | `og:title`, `og:description`, `og:image` (absolute + HTTPS), `og:url`, `og:type`, `twitter:card`, `twitter:image` |
| **Links** | Empty `href`, `#`, `javascript:void(0)`, missing accessible name, `target="_blank"` without `rel="noopener"`, broken in-page anchors, localhost/staging links on production |
| **Buttons** | Buttons with no accessible name, unlabeled icon-only buttons, disabled buttons, "fake clickable" elements (`cursor:pointer` with no role) |
| **Downloads** | `/api/download/undefined`, `undefined`/`null` in hrefs, `NaN MB` / `undefined MB` text |
| **Accessibility** | Images without alt, controls without accessible names, inputs without labels, duplicate IDs, missing lang/viewport |
| **Content** | Leaked `undefined` / `null` / `NaN` / `[object Object]`, placeholder copy (Lorem ipsum filler, "coming soon") |
| **Performance** | Load timing, DOMContentLoaded, transfer size, image/script/stylesheet counts |

### Severity and scoring

The score starts at 100 and subtracts a weight per issue, then clamps to 0–100:

| Severity | Deduction | Typical use |
| --- | --- | --- |
| Critical | 15 | Major functionality or security (page not on HTTPS, broken download URL) |
| High | 8 | Important SEO/accessibility issue (missing title, images with no alt) |
| Medium | 4 | Meaningful quality issue (missing canonical, unsafe `_blank`) |
| Low | 1 | Minor improvement (title slightly too long) |
| Informational | 0 | Observation only — **never** affects the score |
| Passed | 0 | Successful check |

The same formula produces each category score. All of it lives in one place: [`utils/scoring.js`](utils/scoring.js).

## Platform presets

**Platform presets are optional and additive.** A preset can only *add* checks on top of the generic ones — it can never remove, replace, or change the behaviour of a generic rule. The badge in the header shows what is active, for example `Generic` or `Generic + WebToolkit`.

| Preset | Status | Activates when |
| --- | --- | --- |
| `generic` | **Active** | Always — on every website |
| `webtoolkit` | **Active** | Hostname is exactly `webtoolkit.cloud` or `www.webtoolkit.cloud` |
| `wordpress` | Placeholder | — detection only, no checks yet |
| `woocommerce` | Placeholder | — detection only, no checks yet |
| `shopify` | Placeholder | — detection only, no checks yet |
| `nextjs` | Placeholder | — detection only, no checks yet |

**WebToolkit checks run only on `webtoolkit.cloud`.** They are scoped by *exact* hostname match, so lookalike domains such as `fakewebtoolkit.cloud`, `webtoolkit.cloud.example.com`, or `another-webtoolkit.cloud` never trigger them. This is enforced by tests.

### Platform detection

WebCheckr includes a deliberately conservative detection service. It only reads the page snapshot it has already collected — meta generator, resource URLs, body classes, safe global variables, and the hostname. **It never makes extra network requests and never probes paths.**

Anything not based on an exact hostname is reported as a **"Likely platform"** with a confidence level and the reasons behind it. A detected platform with no rules yet does **not** change your score.

## Screenshots

> Screenshots are not included in this repository yet. They will be added before the Chrome Web Store submission — see [`docs/STORE_ASSETS_CHECKLIST.md`](docs/STORE_ASSETS_CHECKLIST.md).

## Installation from source

WebCheckr is plain JavaScript with **no build step and no runtime dependencies**. You do not need to compile anything — clone the repository and load the folder directly.

1. **Clone the repository.**
   ```bash
   git clone https://github.com/mudasar8k/webcheckr.git
   cd webcheckr
   ```
2. **Install dependencies — not required.** WebCheckr has zero runtime and zero build dependencies. (`npm install` is only needed if you want to run the test suite, and even then it installs nothing — the tests use Node's built-in runner.)
3. **Build — not required.** There is no build step and no generated output directory; the repository root *is* the extension.
4. Open `chrome://extensions`.
5. Enable **Developer mode** (top-right).
6. Click **Load unpacked**.
7. Select the cloned **`webcheckr`** folder (the one containing `manifest.json`).

> After pulling new changes, click **Reload** on the WebCheckr card in `chrome://extensions`.

## How to use

1. Open any webpage.
2. Click the **WebCheckr** icon in the toolbar.
3. Click **Run QA**.
4. Review the score, the health summary, and the grouped results.
5. Use the filter chips (All / Failed / Warnings / SEO / Links / A11y / Perf …) to focus.
6. Toggle **Issues only** ↔ **All results** to show or hide passed checks.
7. On a result with affected elements, click **View N affected elements**, then:
   - **Highlight** — scrolls to the element and outlines it temporarily.
   - **Copy selector** — copies its CSS selector to paste into DevTools.
8. Click **Copy Report** for a plain-text summary, or **Clear** to reset.

## Privacy

WebCheckr analyzes the active webpage **only after you start an inspection**, and everything is processed **locally in your browser**.

- No page content is transmitted to external servers.
- No account, sign-up, or login is required.
- No analytics, telemetry, or tracking of any kind.
- No browsing history is collected, stored, or sold.
- Password fields and form input values are never read.
- Copied reports stay on your clipboard, under your control.

WebCheckr makes **zero network requests**. See [`PRIVACY.md`](PRIVACY.md) for the full policy and [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) for why each permission exists.

## Safety

WebCheckr is a **read-only, informational** QA tool. It is **not** a vulnerability scanner and deliberately does not:

- perform exploitation of any kind,
- run brute-force or password attacks,
- perform login or authentication testing,
- run destructive or intrusive security scans,
- crawl your site or fetch every link,
- modify the page it inspects (highlights are temporary and self-cleaning).

It inspects the DOM of the single page you are already viewing. Nothing more.

## Development setup

**Requirements:** Node.js 18+ (for the tests only) and Chrome.

```bash
git clone https://github.com/mudasar8k/webcheckr.git
cd webcheckr
npm test
```

Load the folder as an unpacked extension (see above) to try changes live. Reload the extension card after each edit.

## Build commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs the full test suite (`node --test "tests/*.test.mjs"`) |
| *(none)* | **There is no build command.** The extension ships as-is; the repo root is what Chrome loads. |

To produce a Chrome Web Store upload, zip the repository contents excluding development files (`tests/`, `docs/`, `node_modules/`, `.git*`). The extension itself needs only `manifest.json`, `popup.*`, `content.js`, `checks/`, `presets/`, `utils/`, and `icons/`.

## Project structure

```
webcheckr/
  manifest.json           # MV3 manifest (activeTab + scripting only)
  popup.html / .css / .js # Popup UI and controller
  content.js              # One-pass page collector (injected on Run QA)
  checks/                 # basic, seo, social, links, buttons,
                          # downloads, accessibility, content-quality, performance
  presets/
    generic.js            # Base preset (always runs) + preset resolution
    webtoolkit.js         # Exact-hostname preset
    platforms.js          # wordpress/woocommerce/shopify/nextjs placeholders
  utils/
    dom.js                # Namespace, result model, affected-element truncation
    scoring.js            # Severity weights, category scores, health summary
    detect.js             # Conservative platform detection
    runner.js             # Generic-then-presets runner, filtering, counts
    highlight.js          # Injected highlight function
    report.js             # Copy Report builder
  tests/                  # node --test (zero dependencies)
  docs/                   # Store listing, permissions, setup notes
  icons/                  # 16 / 48 / 128 px
```

> **Note on naming:** the internal JavaScript namespace is still `SiteQA` (the project's original name). It is internal-only and never shown to users; it was intentionally left alone during the rebrand to avoid introducing bugs for no user-visible benefit.

## Roadmap

- [ ] WordPress QA checks (preset placeholder already in place)
- [ ] WooCommerce QA checks
- [ ] Shopify QA checks
- [ ] Next.js / React QA checks
- [ ] Category score panel in the popup
- [ ] Export report as Markdown / JSON
- [ ] Chrome Web Store release
- [ ] Optional user-configurable rule severities

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) first — it covers branching, running tests, coding style, how to add a QA rule, and the safety rules every check must follow.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs

Open an issue using the templates:

- [Bug report](.github/ISSUE_TEMPLATE/bug_report.yml)
- [Feature request](.github/ISSUE_TEMPLATE/feature_request.yml)
- [New QA check](.github/ISSUE_TEMPLATE/new_qa_check.yml)

**Do not report security issues in public issues** — see [`SECURITY.md`](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Mudassar Ahmad

## Author

**Mudassar Ahmad** — [@mudasar8k](https://github.com/mudasar8k)
