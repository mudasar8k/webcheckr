# Changelog

All notable changes to WebCheckr are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — Unreleased

First public open-source release (early public beta). Not yet tagged or published.

### Added

- **Open-source project files** — MIT `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `PRIVACY.md`, `CHANGELOG.md`.
- **GitHub templates** — bug report, feature request, and new QA check issue forms, plus a pull request template with a required safety checklist.
- **Documentation** — `docs/PERMISSIONS.md` (per-permission justifications), `docs/CHROME_WEB_STORE_LISTING.md`, `docs/STORE_ASSETS_CHECKLIST.md`, `docs/GITHUB_SETUP.md`.
- **Repository configuration** — `.gitignore`, `.gitattributes`, `.editorconfig`.
- Popup footer: "Free and open source · Created by Mudassar Ahmad".
- Accessible subtitle "Website QA Inspector" beside the header.
- **Real brand logo.** Extension icons regenerated from `icons/source/webcheckr-logo.png`, replacing the placeholder checkmarks. The popup header now shows the logo mark instead of a tinted "✓" glyph, and the README leads with it. Logo masters are committed under `icons/source/`.
- **32px icon** added and declared in the manifest, so the toolbar has a dedicated HiDPI size.
- **Simplified 16px icon** using the same visual identity (scan brackets + check, colours sampled from the logo). The full logo is unreadable at 16px; the main logo is unchanged at every other size.
- **Category scores** now render as a compact 3×2 grid with short labels (A11y, Perf) and full names exposed via `title`/`aria-label`, replacing a compressed inline text line. Popup width is unchanged.

### Changed

- **Version set to `0.1.0`** in `manifest.json` and `package.json`, marking this as an early public beta under Semantic Versioning.
- **Primary filter chip is now mode-aware:** it reads **Issues N** in Issues-only mode (where the count excludes passed checks) and **All N** in All-results mode. Previously "All 2" sat next to a number that was not the total.
- **Category sections auto-expand** whenever they contain a failure or warning, and start collapsed when they hold only passed/informational checks. A section the user collapses by hand now stays collapsed across filter and mode changes for as long as the popup is open.
- **Footer and results spacing** loosened so the last result and the scrollbar no longer crowd the footer.
- **Rebranded from "Site QA Inspector" to "WebCheckr — Website QA Inspector."** Applies to the extension header, manifest, popup title, copied reports, the on-page highlight marker, documentation, and test descriptions.
- **WebToolkit preset hardened for public release.** Canonical and `og:url` checks now parse the URL and compare the hostname exactly, instead of pattern-matching the URL string. Remaining checks are based solely on publicly visible page behaviour.
- `SECURITY.md` now directs reports to GitHub Private Vulnerability Reporting; `CODE_OF_CONDUCT.md` directs reports to the maintainer's GitHub profile. No private email address is published in the repository.
- **Preset badge labels shortened** to `Generic`, `Generic + WebToolkit` — WebToolkit is no longer implied to be the product identity.
- Repository flattened: the extension now lives at the repository root, so `Load unpacked` targets the cloned folder directly.
- `package.json` renamed to `webcheckr`, licensed MIT, with repository/author metadata.
- Highlight CSS prefix and page global renamed to `webcheckr-highlight` / `__webcheckrHighlightTimer`.

### Removed

- **WebToolkit preset: internal-only checks removed** so the preset is safe for a public repository. It now contains only checks based on publicly visible page behaviour. No generic check was affected.
- **`host_permissions: ["<all_urls>"]` removed from the manifest.** It was unnecessary: `activeTab` + `scripting` already covers every flow, since all injection is user-initiated on the active tab. This removes the *"Read and change all your data on all websites"* install warning entirely.
  **⚠️ Verify Run QA and Highlight in a real browser after this change.**

### Notes

- The internal JavaScript namespace remains `SiteQA`. It is never shown to users and was intentionally left unchanged during the rebrand to avoid introducing bugs for no user-visible benefit.
- No QA rules, scoring behaviour, or check logic changed in this release.

---

## Prior development (pre-release, not yet published)

These changes were made before the project had a public changelog. They are recorded here for context; no version was ever published.

### Actionable results and generic preset architecture

- **Severity levels** — Critical, High, Medium, Low, Informational, Passed, stored alongside status on every result.
- **Weighted scoring** — central configuration (Critical −15, High −8, Medium −4, Low −1, Informational 0), clamped to 0–100, with independent scores for Basic, SEO, Accessibility, Links, Performance, and Best Practices.
- **Affected elements** — up to 50 stored per rule (5 shown by default), with safe truncation of text and HTML.
- **View affected elements**, **Highlight on page** (temporary, self-cleaning, never permanently modifies the page), and **Copy selector**.
- **Issues-only default view**, with passed checks always available and never dropped from data or reports.
- **Filter counts**, **collapsible category sections**, and a **deterministic page health summary** (no AI, no network).
- **Generic preset architecture** — Generic Website always runs as the base; platform presets are additive only and can never modify generic rules.
- **Exact-hostname scoping** for the WebToolkit preset — lookalike domains such as `fakewebtoolkit.cloud` or `webtoolkit.cloud.example.com` never activate it.
- **Conservative platform detection** for WordPress, WooCommerce, Shopify, and Next.js, reported as a "Likely platform" with confidence and reasons. Detection alone never changes the score.
- Preset placeholders registered for WordPress, WooCommerce, Shopify, and Next.js (no checks yet).
- **84 tests** using Node's built-in runner (zero dependencies).

### Initial extension

- Chrome Manifest V3 extension with popup UI, light/dark themes, and score display.
- Nine generic check groups: Basic, SEO, Social, Links, Buttons, Downloads, Accessibility, Content, Performance.
- One-pass page collector; every rule reads the same snapshot.
- Copy Report, Clear, and category filtering.
- Local-only processing: no network requests, no storage, no analytics.

---

## Versioning notes

> **First public release: `0.1.0`** — an early public beta. Set in both `manifest.json` and `package.json`.

**Why `0.1.0` rather than `1.0.0`:**

- The extension has **never been published or used outside development**. There is no real-world usage data on how the checks behave across the huge variety of live sites.
- The **removal of `<all_urls>` still needs verification in a real browser.** Until that is confirmed, the release cannot be called stable.
- Four platform presets (WordPress, WooCommerce, Shopify, Next.js) are **placeholders**. Advertising 1.0 while the roadmap's headline features are unimplemented would overpromise.
- No screenshots, no store listing, and no external contributors have exercised the code.
- Under SemVer, `0.x` communicates honestly that the public API and check IDs may still change. `1.0.0` is a commitment to stability that this project has not yet earned.
- Automated tests are strong (84 passing), but automated tests are not the same as field experience.

**When `1.0.0` becomes appropriate:**

- The extension has shipped, been installed by real users, and survived feedback.
- At least one platform preset (likely WordPress) ships real checks.
- Check IDs and the result model are settled enough to treat as a stable contract.
- Screenshots and the store listing are live.

> Chrome Web Store versions must increase monotonically, so starting at `0.1.0` leaves the most room to grow.

[0.1.0]: https://github.com/mudasar8k/webcheckr/commits/main
