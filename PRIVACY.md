# Privacy Policy — WebCheckr

**Last updated:** 2026-07-17
**Applies to:** WebCheckr — Website QA Inspector (Chrome extension)

## Summary

WebCheckr temporarily accesses website content on the active page only after the user requests an inspection. It processes everything locally in your browser and sends nothing anywhere.

## What WebCheckr does

- WebCheckr reads the currently active webpage **only when you start an inspection** — that is, when you click **Run QA** (or **Highlight** on a specific element). It does not read pages in the background, and it does not run on page load.
- All analysis is performed **locally**, inside your browser, by the extension's own JavaScript.
- Results exist only in the extension popup's memory. Closing the popup or clicking **Clear** discards them.

## What WebCheckr does not do

- **No page content is transmitted to external servers.** WebCheckr makes no network requests of any kind — no APIs, no telemetry, no error reporting, no font/CDN fetches.
- **No analytics.** There is no analytics SDK, no tracking pixel, and no usage reporting in the codebase.
- **No account is required.** There is no sign-up, login, or user identity.
- **Browsing history is not collected, stored, transmitted, or sold.** WebCheckr never accesses browser history APIs.
- **No personal data is intentionally collected.**
- **No remote code.** The extension executes only the JavaScript shipped inside it. It never injects external scripts into the page.
- **No persistent storage.** WebCheckr does not use `chrome.storage`, cookies, `localStorage`, or IndexedDB. Nothing is saved between sessions.

## Data WebCheckr reads (and why)

When you click **Run QA**, WebCheckr reads a snapshot of the current page in order to check it:

- Page URL, hostname, protocol, and title
- Meta tags (description, canonical, viewport, robots, Open Graph, Twitter, generator)
- Headings, links, buttons, images, and form field metadata
- Visible text (used to detect leaked values such as `undefined` or `NaN`)
- Resource URLs, body classes, and safe global flags (used for platform detection)
- Performance timings from the browser's Performance API

This snapshot is held in memory, analyzed, and then discarded. It is never written to disk and never sent off your machine.

For Chrome Web Store disclosure purposes, this information is categorized as "Website content." WebCheckr accesses it only to provide the user-requested webpage inspection, processes it locally, and does not transmit or retain it.

### Sensitive data explicitly excluded

WebCheckr is written to avoid sensitive input by design:

- **Password fields are skipped entirely** — they are never read.
- **Form input values are never read.** Only field metadata (type, name, label presence, placeholder) is inspected, so labelling issues can be reported.
- Hidden fields are skipped.

## Reports you copy or export

**Copy Report** places a plain-text report on your system clipboard. From that point the report is entirely under your control — WebCheckr does not upload, transmit, or retain it. Note that a report includes the page URL, title, and short excerpts of page content, so review it before pasting into a public issue tracker.

## Permissions

WebCheckr requests the minimum permissions needed:

| Permission | Why |
| --- | --- |
| `activeTab` | Temporary access to the tab you are on, granted only when you invoke the extension. |
| `scripting` | To run the inspection and highlight code in that tab, on your click. |

WebCheckr does **not** request broad host permissions, `storage`, `tabs`, `history`, `cookies`, `webRequest`, or background access. See [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) for the full justification.

## Third parties

WebCheckr has **no third-party dependencies at runtime**, no bundled libraries, no external services, and no data processors. There is no one to share data with, because no data leaves your browser.

## Children's privacy

WebCheckr collects no personal data from anyone, including children.

## Changes to this policy

Any change to this policy will be committed to the public repository and reflected in [`CHANGELOG.md`](CHANGELOG.md). If WebCheckr ever adds a feature that makes a network request, this policy will be updated **before** that feature ships, and the change will be called out in the release notes.

## Chrome Web Store Limited Use

WebCheckr's use of information received through Chrome APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Website content is accessed only to provide the user-requested QA inspection and related highlighting features.

## Contact

Questions about privacy: open a public issue at
https://github.com/mudasar8k/webcheckr/issues

<!--
REVIEW BEFORE PUBLISHING: no dedicated privacy contact address is configured.
Add a real contact email here if you want one shown in the Chrome Web Store
listing, which asks for a privacy contact. See SECURITY.md for the same note.
-->

---

### Verification

Every claim above was checked against the source at the time of writing. You can verify them yourself:

- No network calls: search the codebase for `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` — there are none.
- No storage: search for `chrome.storage`, `localStorage`, `indexedDB` — there are none.
- No password reads: see `content.js`, which skips `type === 'password'` and `type === 'hidden'` and never reads `.value`.
