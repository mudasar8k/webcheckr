# Chrome Web Store Assets Checklist — WebCheckr

Everything needed to submit WebCheckr to the Chrome Web Store. Text content lives in [`CHROME_WEB_STORE_LISTING.md`](CHROME_WEB_STORE_LISTING.md); permission wording in [`PERMISSIONS.md`](PERMISSIONS.md).

> **Screenshots have not been produced yet.** This is the checklist for creating them.

---

## 1. Extension icons

Shipped in the extension package and declared in `manifest.json`.

| Size | File | Status | Used for |
| --- | --- | --- | --- |
| 16×16 | `icons/icon16.png` | ✅ Logo (4% padding) | Toolbar (1x), favicon |
| 32×32 | `icons/icon32.png` | ✅ Logo (6% padding) | Toolbar (2x / HiDPI), favicon |
| 48×48 | `icons/icon48.png` | ✅ Logo (8% padding) | Extensions management page + popup header |
| 128×128 | `icons/icon128.png` | ✅ Logo (10% padding) | Web Store listing + install dialog |

**All four sizes are the same logo**, generated from `icons/source/webcheckr-logo.png` (510×510) with high-quality bicubic resampling onto a transparent canvas. Padding decreases at smaller sizes so the mark stays legible.

The logo is a single flat colour — `#2563EB`, the same blue as the extension's `--primary` token — which is why it survives downscaling: the window outline and checkmark stay readable all the way down to 16×16 on both light and dark toolbars. No simplified small-size variant is needed, so every size is identical brand artwork.

**Source masters** (committed, not shipped in the zip):

| File | Size | Use |
| --- | --- | --- |
| `icons/source/webcheckr-logo.png` | 510×510 | Icon mark — source of all four icons and the README header |
| `icons/source/webcheckr-logo-with-text.png` | 1075×272 | Full lockup — promo tiles, store graphics |

- [x] PNG, transparent background, square canvas — all four verified (corner alpha = 0)
- [x] ~10% padding inside the 128×128 canvas (Google's guidance)
- [x] **16×16 legibility verified** — bold single-colour artwork reads clearly at toolbar size.
- [ ] ⚠️ **The lockup is out of date.** `webcheckr-logo-with-text.png` still uses the *previous* mark (dark window, green check, blue brackets), so it no longer matches the icons. Re-export it with the current mark before using it on any promo tile or store graphic.
- [ ] ⚠️ **The lockup's "WebCheckr" text is pure black** (R0 G2 B14), so it disappears on dark backgrounds. Only use `webcheckr-logo-with-text.png` on light backgrounds. A white-text variant would unlock dark contexts (GitHub dark README, dark promo tiles).
- [ ] ⚠️ **Master resolution is modest** (272px tall). Fine for all icon sizes and the 440×280 tile (downscale), but the 1400×560 marquee would require upscaling the lockup — request a larger export if you pursue featuring.

## 2. Screenshots — **required**

At least **1**, up to **5**. This is the highest-impact asset: most users decide from screenshot 1.

| Requirement | Value |
| --- | --- |
| Size | **1280×800** (preferred) or 640×400 |
| Format | PNG or JPEG (PNG recommended for UI) |
| Aspect | Must match exactly — no letterboxing |
| Count | 1 minimum, 5 maximum |

Suggested set (the popup is 400px wide, so compose it on a page background rather than cropping tight):

- [ ] **1 — Results overview.** Popup open on a real site showing the score ring, health summary, and a few graded results. The money shot.
- [ ] **2 — Affected elements.** A result expanded showing "View N affected elements" with selectors, plus the Highlight button.
- [ ] **3 — Highlight on page.** The blue outline + "WebCheckr" marker on a real element.
- [ ] **4 — Filters and severity.** Filter chips with counts and a mix of severity chips.
- [ ] **5 — Copy Report.** The plain-text report, or the dark theme variant.

Tips:
- [ ] Use a **public, neutral site** — never a client site, an internal tool, or anything under NDA.
- [ ] Check for personal data in the frame: bookmarks bar, profile avatar, other tabs, browser history dropdown. **Use a clean Chrome profile.**
- [ ] Consider one dark-theme shot; the popup supports it and it demos well.
- [ ] Don't show `webtoolkit.cloud` in screenshot 1 — the store listing should lead with the generic product, not a private preset.

## 3. Promotional images — optional

Only needed for store promotion/featuring. Not required to publish.

| Asset | Size | Required? | Status |
| --- | --- | --- | --- |
| Small promo tile | **440×280** | Optional — needed to be considered for featuring | [ ] Not created — `webcheckr-logo-with-text.png` on a light background would work well |
| Marquee promo tile | **1400×560** | Optional — only for the featured carousel | [ ] Not created — would need a larger lockup export |

- Both PNG or JPEG, no alpha.
- Keep text minimal and large; these get scaled down heavily.
- Recommendation: **skip both for the initial release.** Add the 440×280 tile later if you pursue featuring.

## 4. Listing URLs

| Field | Value | Status |
| --- | --- | --- |
| Homepage URL | `https://github.com/mudasar8k/webcheckr` | [ ] Repo must be **public** first |
| Support URL | `https://github.com/mudasar8k/webcheckr/issues` | [ ] Requires public repo + Issues enabled |
| Privacy policy URL | `https://github.com/mudasar8k/webcheckr/blob/main/PRIVACY.md` | [ ] Requires public repo |
| GitHub URL | `https://github.com/mudasar8k/webcheckr` | [ ] Same as homepage |

> ⚠️ All must return HTTP 200 publicly before submission. A private repo returns 404 and **will fail review**.

## 5. Store description

- [ ] Name — `WebCheckr — Website QA Inspector` (from the listing doc)
- [ ] Summary — 105 chars, within the 132 limit
- [ ] Detailed description — ready in the listing doc
- [ ] Category — Developer Tools
- [ ] Language — English (US)

## 6. Permission justifications

- [ ] `activeTab` — justification ready in `PERMISSIONS.md`
- [ ] `scripting` — justification ready in `PERMISSIONS.md`
- [ ] Host permissions — **none requested** (`<all_urls>` was removed during release prep). This is the single biggest review advantage; do not add it back without cause.
- [ ] ⚠️ **Verify in a real browser that Run QA and Highlight still work without host permissions before uploading.**

## 7. Single-purpose explanation

- [ ] Ready in `CHROME_WEB_STORE_LISTING.md` — one purpose: inspect the current page and report quality issues to the user.

## 8. Data usage disclosure

Chrome Web Store Privacy tab. WebCheckr answers **No** to every collection category — verified against the code (no `fetch`, no storage, no analytics).

- [ ] Collects user data? → **No**
- [ ] Personally identifiable information → No
- [ ] Health / financial / authentication information → No
- [ ] Personal communications → No
- [ ] Location → No
- [ ] Web history → No
- [ ] User activity → No
- [ ] Website content → No *(read into memory and analyzed locally; never collected or transmitted)*
- [ ] Certify: no sale/transfer of user data to third parties
- [ ] Certify: no use unrelated to the single purpose
- [ ] Certify: no use for creditworthiness/lending

## 9. Test account status

**Not required.** No login, no account, no gated features. Reviewer note is ready in the listing doc.

## 10. Package

- [ ] Zip the extension **contents** (not a wrapping folder) — `manifest.json` must be at the zip root.
- [ ] Include: `manifest.json`, `popup.html`, `popup.css`, `popup.js`, `content.js`, `checks/`, `presets/`, `utils/`, `icons/`
- [ ] Exclude: `tests/`, `docs/`, `node_modules/`, `.git/`, `.github/`, `package.json`, `*.md`, dotfiles
- [ ] Confirm the zip contains **no secrets, no source maps, no local paths**
- [ ] Verify `manifest.json` version matches the intended release

Example (run from the repo root):

```bash
zip -r ../webcheckr-0.1.0.zip \
  manifest.json popup.html popup.css popup.js content.js \
  checks presets utils icons \
  -x "*.DS_Store"
```

- [ ] Test the zip: unzip to a clean folder → **Load unpacked** → verify it runs.

## 11. Developer account

- [x] **Chrome Web Store developer account registered** — already held; the one-time US$5 fee does not apply.
- [ ] Publisher display name decided — appears publicly on the listing
- [ ] ⚠️ Verify the publisher email you expose; it is public
- [ ] Two-factor authentication enabled

## 12. Pre-submission final checks

- [x] `npm test` passes
- [x] `manifest.json` is valid and the version is set (`0.1.0`, public beta)
- [x] Contact placeholders in `SECURITY.md` / `CODE_OF_CONDUCT.md` resolved
- [x] WebToolkit preset reviewed and cleared for public release
- [ ] **Manual browser verification** (popup, Run QA, Copy Report, Clear, filters, Highlight, no console errors) — ⚠️ includes confirming the `<all_urls>` removal
- [ ] Icons load correctly at all three sizes
- [ ] Screenshots captured (≥1 at 1280×800)
- [ ] Repository is public and all three URLs return 200
- [ ] Extension packaged as a zip and test-loaded from a clean unzip

> **Expect review to take a few days to two weeks.** Extensions using `scripting` get extra scrutiny; the absence of host permissions and the zero-network-request design should make this a straightforward review.
