# Chrome Web Store Listing — WebCheckr

Copy-paste source for the Chrome Web Store Developer Dashboard submission.

---

## Name

```
WebCheckr — Website QA Inspector
```

> Limit: 75 characters. Current: 32. ✅
> If the em dash causes any issue in the dashboard, fall back to `WebCheckr - Website QA Inspector`.

## Summary (short description)

```
Inspect webpages for common SEO, accessibility, links, performance, usability, and website quality issues.
```

> Limit: 132 characters. Current: 105. ✅

## Category

**Primary:** `Developer Tools`

> Alternative if Developer Tools is rejected: `Workflow & Planning`. Developer Tools is the right fit — the audience is developers, QA engineers, and site owners.

## Language

English (United States)

---

## Detailed description

> Paste into the "Description" field. Plain text — the Web Store does not render Markdown.

```
WebCheckr checks any webpage for the problems that quietly break websites: missing page titles, images without alt text, links that go nowhere, buttons a screen reader cannot announce, and "undefined" leaking into your live content.

Open a page, click WebCheckr, and press Run QA. You get a score out of 100, a short plain-English summary of the page's health, and a grouped list of exactly what to fix — with the specific elements at fault.

Everything runs locally in your browser. WebCheckr makes no network requests at all.


WHY WEBCHECKR

• Fast — one click, results in a moment. No account, no sign-up, no setup.
• Actionable — every issue comes with a severity, a plain-English explanation, and a suggested fix.
• Specific — see the exact elements at fault, highlight them on the page, or copy their CSS selector.
• Private — nothing leaves your browser. No analytics, no tracking, no servers.
• Free and open source — MIT licensed. Read every line on GitHub.


FEATURES

• Overall score out of 100, plus separate scores for Basic, SEO, Accessibility, Links, Performance, and Best Practices.
• Six severity levels: Critical, High, Medium, Low, Informational, and Passed. Informational findings never affect your score.
• Page health summary in plain English.
• Issues-only view by default, so you see what needs work first. Passed checks are always one click away.
• Affected elements: view the exact elements that failed, highlight them on the page, or copy a CSS selector to paste into DevTools.
• Filter by status or category, with live counts.
• Collapsible result sections.
• Copy Report — a clean plain-text report for your tickets, pull requests, or email.
• Light and dark themes.


WHAT IT CHECKS

Basic — page title and length, meta description and length, canonical URL, viewport, HTTPS, html lang attribute, favicon.

SEO — robots meta, H1 presence and uniqueness, heading order, canonical domain, duplicated brand names in titles.

Social — Open Graph and Twitter Card tags, and whether your og:image is an absolute HTTPS URL.

Links — empty links, "#" placeholders, javascript:void(0), links with no accessible name, target="_blank" without rel="noopener", broken in-page anchors, and localhost or staging links left on a production page.

Buttons — buttons with no accessible name, unlabeled icon-only buttons, and elements that look clickable but are not.

Accessibility — images without alt text, controls without accessible names, form inputs without labels, duplicate IDs, missing lang and viewport.

Content — "undefined", "null", "NaN", and "[object Object]" leaking into visible text, plus leftover placeholder copy.

Downloads — broken download URLs, "undefined" in file links, and "NaN MB" file sizes.

Performance — load timing, transfer size, and image, script, and stylesheet counts.


WORKS ON ANY WEBSITE

WebCheckr is a generic tool. It reads standard HTML, so it works on:

WordPress • WooCommerce • Shopify • Laravel • Next.js and React • Angular and Vue • Static HTML/CSS • SaaS applications • E-commerce stores • Blogs • Business websites • Landing pages • Educational websites • Nonprofit and government websites

It also works on staging sites, client sites, and local development.


GENERIC CHECKS AND PLATFORM PRESETS

Generic checks always run, on every website. They are the core of the tool.

Platform presets are optional and only ever add extra checks on top — they never replace or change the generic ones. The badge in the header shows what is active, such as "Generic" or "Generic + WebToolkit".

WebToolkit checks run only on webtoolkit.cloud, matched by exact hostname. Presets for WordPress, WooCommerce, Shopify, and Next.js are planned; today WebCheckr can detect these platforms and will tell you the likely platform, but it does not yet add platform-specific rules.


PRIVACY

WebCheckr analyzes the active webpage only after you click Run QA, and processes everything locally in your browser.

• No page content is sent to any server. WebCheckr makes zero network requests.
• No analytics, telemetry, or tracking.
• No account or login required.
• Browsing history is never collected, stored, or sold.
• Password fields and form input values are never read.
• Nothing is saved between sessions.
• Reports you copy stay on your clipboard, under your control.

Full privacy policy: https://github.com/mudasar8k/webcheckr/blob/main/PRIVACY.md


SAFETY

WebCheckr is a read-only, informational QA tool. It is not a vulnerability scanner.

It does not perform exploitation, brute-force testing, login testing, or destructive security scans. It does not crawl your site or fetch your links. It reads the DOM of the single page you are already viewing, and it never permanently modifies that page.


OPEN SOURCE

WebCheckr is free and open source under the MIT License. Contributions, bug reports, and new check ideas are welcome.

GitHub: https://github.com/mudasar8k/webcheckr

Created by Mudassar Ahmad.
```

> Limit: 16,000 characters. Current: well under. ✅

---

## Keywords / search terms

The Web Store has no keyword field — discoverability comes from the name, summary, and description. These terms are woven into the copy above:

`website QA` · `SEO checker` · `accessibility checker` · `page audit` · `broken links` · `alt text` · `meta tags` · `Open Graph` · `web developer tools` · `QA testing` · `site quality` · `WCAG` · `page inspector` · `pre-launch checklist`

## Permission justifications

The dashboard requires a justification per permission. Full text: [`PERMISSIONS.md`](PERMISSIONS.md).

**`activeTab`**
```
WebCheckr inspects the page the user is currently viewing. activeTab grants temporary access to that single tab, only when the user explicitly clicks the WebCheckr toolbar icon, which is exactly when an inspection runs. It is the narrowest possible permission for this purpose and produces no install warning.
```

**`scripting`**
```
WebCheckr has no automatic content script. When the user clicks "Run QA", it uses chrome.scripting.executeScript to inject its own bundled collector into the active tab, read a snapshot of the DOM, and return it for local analysis. The same API injects a temporary highlight overlay when the user clicks "Highlight" on a result. All injected code ships inside the extension; no remote code is used.
```

**Host permissions:** none requested. `activeTab` covers every flow.

## Single purpose

```
WebCheckr has a single purpose: to inspect the webpage the user is currently viewing and report website quality issues — SEO, accessibility, links, performance, usability, and content problems — to that user.
```

## Data usage disclosure

Answer in the dashboard's Privacy tab:

| Question | Answer |
| --- | --- |
| Does this item collect user data? | **No** |
| Personally identifiable information | No |
| Health / financial / authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | **No** — page content is read into memory and analyzed locally; it is never collected or transmitted |

Required certifications (all true for WebCheckr):

- [x] I do not sell or transfer user data to third parties, apart from the approved use cases
- [x] I do not use or transfer user data for purposes unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

## URLs

| Field | Value |
| --- | --- |
| Homepage URL | `https://github.com/mudasar8k/webcheckr` |
| Support URL | `https://github.com/mudasar8k/webcheckr/issues` |
| Privacy policy URL | `https://github.com/mudasar8k/webcheckr/blob/main/PRIVACY.md` |

> All three must be publicly reachable **before** submitting — the repository must be public first.

## Test account

**Not required.** WebCheckr has no login, no account, and no gated functionality. Reviewers can install it and click **Run QA** on any page.

Suggested note for the reviewer:

```
No account or test credentials are needed. Install the extension, open any website (for example https://example.com), click the WebCheckr toolbar icon, and click "Run QA". Results appear immediately. The extension makes no network requests and requires no host permissions.
```

## Distribution

- **Visibility:** Public
- **Regions:** All
- **Pricing:** Free
