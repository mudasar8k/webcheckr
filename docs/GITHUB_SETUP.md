# GitHub Repository Setup — WebCheckr

Recommended settings for <https://github.com/mudasar8k/webcheckr>. These are configured in the GitHub web UI; this file is the reference to copy from.

## Repository description

Paste into **Settings → General → Description** (or the "About" panel on the repo home page):

```
A free and open-source Chrome extension for checking website SEO, accessibility, links, performance, usability, and page quality.
```

## Website field

**Settings → General → Website** (or the About panel).

- **Now (pre-release):** leave blank, or use the repository README URL.
- **After publication:** use the **Chrome Web Store listing URL**, which will look like:

  ```
  https://chromewebstore.google.com/detail/webcheckr/<EXTENSION_ID>
  ```

  > The `<EXTENSION_ID>` is assigned by Google when the item is first created in the Developer Dashboard. Update this field as soon as the listing is live.

## Topics

Add via the **About** panel → ⚙️ → Topics:

```
chrome-extension
website-qa
quality-assurance
seo
accessibility
web-performance
developer-tools
wordpress
shopify
nextjs
open-source
```

> Note: `wordpress`, `shopify`, and `nextjs` describe sites WebCheckr can inspect. Platform-specific presets for these are currently placeholders (detection only) — see the Roadmap in the README. Keep the topics for discoverability, but don't let the listing imply the presets ship rules today.

## About panel checklist

- [ ] Description set (above)
- [ ] Website set (Chrome Web Store URL after publication)
- [ ] Topics added
- [ ] ✅ Releases shown
- [ ] ⬜ Packages hidden (not a package)
- [ ] ⬜ Deployments hidden (nothing is deployed)
- [ ] ⬜ Sponsorships — optional

## Recommended settings

### General
- **Default branch:** `main`
- **Features:** Issues ✅ · Discussions (optional) · Wiki ❌ (docs live in the repo) · Projects (optional)
- **Pull requests:** enable *Allow squash merging*; disable merge commits and rebase merging for a clean linear history.
- ✅ *Always suggest updating pull request branches*
- ✅ *Automatically delete head branches*

### Code security and analysis
- ✅ **Private vulnerability reporting** — **required**, because `SECURITY.md` points to it as the preferred reporting channel. Enable this before going public.
- ✅ Dependency graph
- ✅ Dependabot alerts *(no dependencies today, but free insurance if any are ever added)*
- ✅ Secret scanning + push protection

### Branch protection (`main`)
Reasonable for a solo maintainer who wants a safety net:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (once CI exists — see below)
- ✅ Require branches to be up to date before merging
- ⬜ Require approvals — impractical for a solo project; enable if co-maintainers join

## Files already in the repository

GitHub will automatically surface these:

| File | Where it appears |
| --- | --- |
| `README.md` | Repository home |
| `LICENSE` | "MIT" badge in the About panel |
| `CONTRIBUTING.md` | Link when opening issues/PRs |
| `CODE_OF_CONDUCT.md` | Community profile |
| `SECURITY.md` | Security tab |
| `PRIVACY.md` | Linked from README (also needed for the Web Store) |
| `.github/ISSUE_TEMPLATE/*.yml` | Issue creation chooser |
| `.github/pull_request_template.md` | Pre-filled PR body |
| `CHANGELOG.md` | Linked from releases |

Check **Insights → Community Standards** after publishing; it should be 100%.

## Before making the repository public

- [x] `SECURITY.md` contact resolved — points to GitHub Private Vulnerability Reporting.
- [x] `CODE_OF_CONDUCT.md` contact resolved — points to the maintainer's GitHub profile. No private email is published in the repository.
- [x] WebToolkit preset reviewed — internal-only checks removed; it now contains only publicly visible behaviour checks.
- [ ] ⚠️ **Enable Private vulnerability reporting** (Settings → Code security and analysis). `SECURITY.md` directs reporters there, so the link 404s until this is on.
- [ ] Confirm the committed git author email is one you are willing to publish (it is permanent and public in every commit). Consider GitHub's `noreply` address: **Settings → Emails → Keep my email addresses private**, then set `git config user.email "<id>+<username>@users.noreply.github.com"`.

## Suggested first release

Once public:

1. Tag: `git tag -a v0.1.0 -m "WebCheckr v0.1.0 — first public beta"` (see `CHANGELOG.md` for the version rationale).
2. Push the tag: `git push origin v0.1.0`.
3. Create a GitHub Release from the tag, using the `CHANGELOG.md` entry as the notes.
4. Attach a zipped extension build if you want people to install without cloning.

## Optional: CI

A minimal workflow keeps `main` honest, since the test suite needs no dependencies:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm test
```

> Not added yet — create it if you want the green check on PRs.
