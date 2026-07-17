# Contributing to WebCheckr

Thanks for your interest in improving WebCheckr. This guide covers everything you need to get a change merged.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ground rules (read this first)

WebCheckr is a **read-only, local, informational** QA tool. Any contribution must preserve that. See [Safety rules](#safety-rules-non-negotiable) below — a PR that breaks them will be declined regardless of how useful the check is.

## Getting started

**Requirements:** Node.js 18+ (tests only) and Chrome. There are no runtime dependencies and no build step.

1. **Fork** the repository on GitHub.
2. **Clone your fork:**
   ```bash
   git clone https://github.com/<your-username>/webcheckr.git
   cd webcheckr
   ```
3. **Create a branch** — never work on `main`:
   ```bash
   git checkout -b feat/short-description
   ```
   Suggested prefixes: `feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`.
4. **Load the extension** to try it live: `chrome://extensions` → Developer mode → **Load unpacked** → select the repo folder. Click **Reload** on the card after each edit.

## Running tests

```bash
npm test
```

This runs `node --test "tests/*.test.mjs"` using Node's built-in test runner (zero dependencies).

- **All tests must pass before you open a PR.**
- Add tests for any behaviour you add or change.
- Don't delete or weaken an existing passing test to make a new change fit. If a test is genuinely wrong, say so explicitly in the PR and explain why.

`tests/harness.mjs` loads the browser scripts into a VM context in the same order `popup.html` does. **If you add a file, add it to both** — a test enforces that they stay in sync.

## Building

There is no build step. The repository root is the extension: Chrome loads `manifest.json` and the plain source files directly. Nothing is compiled, bundled, minified, or generated.

To package for the Chrome Web Store, zip the repo contents excluding `tests/`, `docs/`, `node_modules/`, and `.git*`.

## Coding style

Match the surrounding code — consistency beats personal preference.

- **2-space indent, semicolons, single quotes** in JS. `.editorconfig` covers the basics.
- **ES5-style syntax in extension source** (`var`, `function`, no arrow functions/`const` in `checks/`, `presets/`, `utils/`, `content.js`). These files load as classic scripts into a shared namespace; keep them consistent. Tests are modern ESM (`.mjs`) and may use `const`/arrow functions freely.
- **No dependencies.** Do not add npm packages, bundlers, or frameworks. Zero-dependency is a feature.
- **No remote code, ever.** No `fetch`, no CDN scripts, no `eval` of fetched strings.
- Comment *why*, not *what*. Only note constraints the code can't express itself.
- Keep the existing UI design tokens in `popup.css`. Don't hardcode colours — use the `--sev-*` and theme variables so light/dark keep working.

## Adding a QA rule

1. **Pick the right check module** in `checks/` (or add one, and register it in `popup.html`, `tests/harness.mjs`, and `checkKeys` in `presets/generic.js`).
2. **Build results with the shared helpers** so the model stays uniform:
   ```js
   SiteQA.warn('Accessibility', 'a11y.img.alt', 'Image alt text',
     '3 images have no alt attribute.', {
       severity: 'high',
       recommendation: 'Add descriptive alt text, or alt="" for decorative images.',
       elements: [{ selector: 'main > img', tagName: 'img', url: '/a.png' }]
     });
   ```
   Helpers: `SiteQA.pass` / `warn` / `fail` / `info`.
3. **Use a stable, namespaced id** — `category.thing.problem` (e.g. `links.href.empty`). IDs must be unique; a test enforces it.
4. **Choose severity honestly** — it is the only input to scoring:

   | Severity | Use for |
   | --- | --- |
   | `critical` | Major functionality or security-related failure |
   | `high` | Important SEO/accessibility/broken-resource/usability issue |
   | `medium` | Meaningful quality issue that should be fixed |
   | `low` | Minor improvement |
   | `informational` | Observation only — **must not** deduct points |
   | `passed` | Successful check |

5. **Read from the existing page snapshot.** `content.js` collects the page once and every rule reads that object. Do not re-scan the DOM per rule, and do not add DOM access inside `checks/`.
6. **Attach affected elements** where a real element is at fault, including a `selector` so **Highlight** and **Copy selector** work.
7. **Mind false positives.** A noisy check is worse than no check. If a pattern has a legitimate use, narrow it. (Real example: the placeholder check matches `lorem ipsum dolor`, not the bare phrase, so a site with a legitimate "Lorem Ipsum Generator" tool isn't flagged.)
8. **Write tests** — at minimum: it fires when it should, it does *not* fire when it shouldn't, and severity/status are correct.

### Adding a platform preset

Presets are **additive only**. A preset may add results; it may never remove, replace, or alter a generic rule. Generic checks always run underneath.

In `presets/platforms.js`, drop `placeholder: true` and add a `run(data)` returning results. If the preset is scoped to a specific site, use **exact hostname matching** via `SiteQA.hostnameMatches(hostname, [...])` — never `indexOf`/substring, which lookalike domains can defeat.

## Safety rules (non-negotiable)

Every check must be **passive, local, and read-only**. WebCheckr is not a security scanner. Do not add anything that:

- makes **network requests** of any kind (no link checking, no image fetching, no API calls, no telemetry);
- **crawls** beyond the current page;
- performs **login/authentication testing**, brute-force, or credential handling;
- attempts **exploitation**, injection, or any intrusive probing;
- performs **destructive** actions or **modifies** the inspected page persistently (highlights must be temporary and self-cleaning);
- reads **password fields or form input values**;
- collects, stores, or transmits **user or browsing data**;
- adds **storage**, background pages, or new permissions.

If your idea needs any of the above, open an issue to discuss before writing code — it will most likely fall outside WebCheckr's scope.

## Submitting a pull request

1. Run `npm test` — everything must pass.
2. Manually check the popup still works (Run QA, Copy Report, Clear, filters, Highlight) with no console errors.
3. Commit with a clear message (e.g. `fix: don't flag decorative images with role=presentation`).
4. Push and open a PR against `main`, filling in the [PR template](.github/pull_request_template.md).
5. Explain **what** changed, **why**, and how you verified it. Screenshots help for UI changes.
6. Keep PRs focused — one logical change each. Unrelated refactors make review harder.

## Reporting issues

Use the [issue templates](.github/ISSUE_TEMPLATE). For anything security-sensitive, follow [`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## License

Contributions are licensed under the [MIT License](LICENSE), the same as the project.
