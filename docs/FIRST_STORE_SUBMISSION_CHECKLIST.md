# First Chrome Web Store Submission — Step-by-Step (WebCheckr v0.1.0)

A walkthrough for publishing an extension for the first time. Work top to bottom; each stage assumes the previous one passed.

**Copy-ready field values:** [`CHROME_WEB_STORE_SUBMISSION_VALUES.md`](CHROME_WEB_STORE_SUBMISSION_VALUES.md)
**Asset requirements:** [`STORE_ASSETS_CHECKLIST.md`](STORE_ASSETS_CHECKLIST.md)

> **The single most useful habit:** publishing is not the finish line. You can upload, get approved, and *still* decide when it goes live (Stage 9). Nothing is irreversible until you press Publish.

---

## Stage 1 — Final browser verification

Do this **before** packaging. The ZIP is built from these exact files, so anything broken here ships broken.

- [ ] Open `chrome://extensions`, enable **Developer mode**, **Load unpacked** → select the repo folder.
- [ ] The card shows **WebCheckr — Website QA Inspector**, version **0.1.0**, and the real logo.
- [ ] ⚠️ **The card does NOT say "Read and change all your data on all websites."**
      *(`host_permissions` was removed; `activeTab` should cover everything. If this warning appears, stop — the manifest changed.)*
- [ ] Open `https://example.com` → click the WebCheckr icon → **Run QA**.
      **Results must appear.** *(If they don't, the permission change broke it — stop and investigate before submitting.)*
- [ ] Expand a result → **View N affected elements** → **Highlight** (scrolls, outlines, clears itself) and **Copy selector**.
- [ ] **Copy Report** → paste somewhere → confirm it reads `WebCheckr Report`.
- [ ] **Clear** resets. Filter chips work. **Issues only ↔ All results** toggles.
- [ ] Right-click the popup → **Inspect** → **Console is clean** (no red errors).
- [ ] Repeat Run QA on a second, heavier site (a news site or shop) — confirm no errors and reasonable speed.
- [ ] Check the toolbar icon looks right at your screen's DPI.

If anything fails here, fix it and re-run `npm test` before continuing.

## Stage 2 — Create the package

```bash
npm test              # must be 96/96 passing
npm run package:store
```

The script refuses to build if the version is inconsistent, a runtime file is missing, permissions changed, or a forbidden file would be included.

- [ ] `npm test` passes
- [ ] `npm run package:store` prints **Package ready**
- [ ] Output: `releases/webcheckr-v0.1.0.zip` (~56 KB, 27 files)

## Stage 3 — Inspect the package by hand

Don't trust the script blindly — open the ZIP yourself.

- [ ] Double-click `releases/webcheckr-v0.1.0.zip`.
- [ ] **`manifest.json` is at the top level** — *not* inside a `webcheckr-v0.1.0/` folder. This is the #1 first-timer mistake and Chrome will reject it.
- [ ] You see: `manifest.json`, `popup.html`, `popup.css`, `popup.js`, `content.js`, `checks/`, `presets/`, `utils/`, `icons/`
- [ ] You do **not** see: `tests/`, `docs/`, `scripts/`, `node_modules/`, `.git/`, `.github/`, `README.md`, `package.json`, `icons/source/`
- [ ] `icons/` contains exactly `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- [ ] **Install the ZIP itself:** unzip to a fresh empty folder → `chrome://extensions` → **Load unpacked** → select that folder → **Run QA** works.
      *This proves the packaged copy runs, not just your working tree.*

## Stage 4 — Developer account

- [x] Account already registered (the one-time US$5 fee is done).
- [ ] Sign in: <https://chrome.google.com/webstore/devconsole>
- [ ] Two-factor authentication enabled.
- [ ] Check your **publisher display name** — it appears publicly on the listing.
- [ ] Check the **publisher contact email** and verify it. It may be shown publicly; use an address you are happy to publish.

## Stage 5 — Upload

- [ ] Dashboard → **Items** → **Add new item**.
- [ ] Drag in `releases/webcheckr-v0.1.0.zip`.
- [ ] Wait for the upload to validate. Manifest errors surface here.
- [ ] Note your **Extension ID** (a 32-letter string) — you'll need it for the store URL later.

> If upload fails, the message usually names the problem exactly (bad manifest, wrong ZIP structure, missing icon). Fix, re-run `npm run package:store`, re-upload.

## Stage 6 — Store listing tab

All values: [`CHROME_WEB_STORE_SUBMISSION_VALUES.md`](CHROME_WEB_STORE_SUBMISSION_VALUES.md).

- [ ] **Name:** `WebCheckr — Website QA Inspector`
- [ ] **Short description:** the 105-character line (limit 132)
- [ ] **Detailed description:** from [`CHROME_WEB_STORE_LISTING.md`](CHROME_WEB_STORE_LISTING.md)
- [ ] **Category:** Developer Tools
- [ ] **Language:** English (United States)
- [ ] **Icon:** 128×128 (taken from the package)
- [ ] **Screenshots:** at least **1** at **1280×800** — ⚠️ *required; you cannot submit without one*
      - Use a clean Chrome profile: no bookmarks, no other tabs, no personal data in frame.
      - Use a neutral public site — never a client or internal site.
      - Lead with the results overview (score + graded results).
- [ ] **Promo tiles:** skip for now (only needed for featuring)
- [ ] **Homepage URL** and **Support URL**

## Stage 7 — Privacy tab

This is where first-timers get rejected. Answer honestly — every answer below is verified true for v0.1.0.

- [ ] **Single purpose:** paste the statement from the values doc.
- [ ] **Permission justification — `activeTab`:** paste.
- [ ] **Permission justification — `scripting`:** paste.
- [ ] **Remote code:** **No** → "All executable code is included in the extension package."
- [ ] **Does this item collect user data?** → **No**
- [ ] Leave **every** data category unticked.
- [ ] Tick all three certifications (no selling/transferring, nothing unrelated to single purpose, no creditworthiness use).
- [ ] **Privacy policy URL:** `https://github.com/mudasar8k/webcheckr/blob/main/PRIVACY.md`
      ⚠️ **Open it in an incognito window first.** If the repo is private it 404s and you *will* be rejected.

## Stage 8 — Distribution tab

- [ ] **Visibility:** Public
- [ ] **Regions:** All
- [ ] **Pricing:** Free

## Stage 9 — Submit (and control when it goes live)

- [ ] Click **Submit for review**.
- [ ] ✅ **Tick "Defer publishing"** if you want to press the button yourself once approved.
      *Recommended for a first submission — approval and going live become two separate decisions.*
- [ ] Confirm.

You cannot edit the package while it's in review. To change something, you must withdraw or wait.

## Stage 10 — Monitor review

- [ ] Status shows **Pending review** in the dashboard.
- [ ] Typical wait: **a few days**, occasionally up to two weeks. Extensions using `scripting` get extra scrutiny; having no host permissions and no data collection should make this straightforward.
- [ ] Watch the email tied to your developer account (check spam).
- [ ] Don't resubmit repeatedly — it doesn't speed anything up.

## Stage 11 — If rejected

Rejection is routine, not a verdict. It is a fixable checklist item.

- [ ] Read the email carefully — it names the **specific policy** violated.
- [ ] Common first-time causes and the honest fix:

  | Reason | Fix |
  | --- | --- |
  | Privacy policy URL unreachable | Make the repository public; verify in incognito |
  | Permission not justified | Paste the justification from the values doc |
  | Single purpose unclear | Use the exact single-purpose statement |
  | Description/screenshot mismatch | Ensure screenshots show what the copy claims |
  | Metadata/keyword spam | Don't stuff keywords into the name or description |

- [ ] Fix the **named** issue only. Don't guess and change everything at once.
- [ ] If the package changed: bump the version (`0.1.1`), re-run `npm run package:store`, re-upload.
- [ ] If only listing text changed: no new package needed.
- [ ] Resubmit. If you genuinely believe it's a mistake, reply to the rejection with a clear, specific explanation.

## Stage 12 — After approval

- [ ] If you deferred publishing, press **Publish** when ready.
- [ ] Wait ~30–60 minutes for the listing to appear.
- [ ] Install from the store yourself and run one real QA pass.
- [ ] Copy the store URL: `https://chromewebstore.google.com/detail/webcheckr/<EXTENSION_ID>`
- [ ] Update the GitHub **Website** field to that URL ([`GITHUB_SETUP.md`](GITHUB_SETUP.md)).
- [ ] Add the store link to `README.md`.
- [ ] Tag the release: `git tag -a v0.1.0 -m "WebCheckr v0.1.0"` and `git push origin v0.1.0`.
- [ ] Create a GitHub Release using the `CHANGELOG.md` entry.

## Stage 13 — Publishing an update later

1. Make your changes; `npm test` must pass.
2. **Bump the version in BOTH `manifest.json` and `package.json`.** Chrome Web Store versions must strictly increase, and `npm run package:store` refuses to build if the two disagree.
   - Bug fix → `0.1.1` · New feature → `0.2.0` · Stable/breaking → `1.0.0`
3. Add a `CHANGELOG.md` entry.
4. `npm run package:store` → produces `releases/webcheckr-v<version>.zip`.
5. Dashboard → your item → **Package** → **Upload new package**.
6. Update listing text only if behaviour changed.
7. ⚠️ **If you added a permission, re-do the Privacy tab.** New permissions trigger a fresh, stricter review — and existing users may be auto-disabled until they re-accept.
8. Submit for review. Updates are usually reviewed faster than a first submission.
9. After approval, tag and release on GitHub to keep the repo and store in sync.

---

## Quick reference

```bash
npm test              # 96 tests must pass
npm run package:store # -> releases/webcheckr-v0.1.0.zip
```

| Thing | Value |
| --- | --- |
| Dashboard | <https://chrome.google.com/webstore/devconsole> |
| Package | `releases/webcheckr-v0.1.0.zip` (~56 KB, 27 files) |
| Permissions | `activeTab`, `scripting` — nothing else |
| Data collected | None |
| Test account | Not required |
