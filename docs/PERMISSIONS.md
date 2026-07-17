# Permission Justifications — WebCheckr

This document explains every permission WebCheckr requests, why it is required, and whether it can be narrowed. It is written to be pasted into the Chrome Web Store submission form, which asks for a justification per permission.

**Current manifest declaration:**

```json
{
  "permissions": ["activeTab", "scripting"]
}
```

That is the complete list. WebCheckr declares **no** `host_permissions`, **no** `content_scripts`, **no** `externally_connectable`, and **no** `web_accessible_resources`.

---

## `activeTab`

| | |
| --- | --- |
| **Why it is required** | Grants temporary access to the single tab the user is currently on, and only at the moment the user invokes the extension (clicking the WebCheckr toolbar icon). Without it, the extension cannot read the page the user asked it to inspect, and cannot read the tab's URL/title to display them. |
| **Feature that uses it** | **Run QA** — reads the page snapshot. **Highlight on page** — outlines an affected element. The current URL/title shown in the popup header. |
| **Can it be narrowed?** | No — this *is* the narrow option. `activeTab` is the least-privileged way to reach the current page. It is strictly narrower than any host permission: access is temporary, limited to one tab, and only after an explicit user gesture. |
| **User impact** | **No install-time permission warning.** Chrome does not warn for `activeTab`. Access ends when the tab navigates or closes, and never extends to other tabs, windows, or background pages. |

## `scripting`

| | |
| --- | --- |
| **Why it is required** | WebCheckr has no static content script. It uses `chrome.scripting.executeScript` to inject its collector (`content.js`) into the active tab on demand, and to inject the temporary highlight function. This is what makes the extension inert until the user asks for something. |
| **Feature that uses it** | **Run QA** (injects `content.js`, which returns a page snapshot). **Highlight on page** (injects `utils/highlight.js`'s function with a CSS selector). |
| **Can it be narrowed?** | No. `scripting` is the MV3 API for on-demand injection and has no narrower variant. It is gated by `activeTab`, so it can only reach a tab the user has explicitly invoked the extension on. The alternative — a static `content_scripts` declaration — would be **broader**, because it would run automatically on every page load. |
| **User impact** | No standalone warning. Injection happens only on an explicit click, only into the active tab, and the injected code is bundled in the extension (no remote code). |

---

## Reviewed and deliberately **not** requested

| Not requested | Why it is unnecessary |
| --- | --- |
| **`host_permissions`** (e.g. `<all_urls>`) | **Removed during release preparation** — see the note below. `activeTab` covers every flow. |
| `content_scripts` | Nothing should run automatically on page load. Injection is on demand only. |
| `externally_connectable` | No web page or other extension may message WebCheckr. Not declared, so the default (nothing can connect) applies. |
| `web_accessible_resources` | No extension file is exposed to web pages. The highlight overlay is created in-page via injected DOM/CSS, not by loading an extension resource. |
| `storage` | WebCheckr saves nothing between sessions. Results live in popup memory only. |
| `tabs` | Not needed. `chrome.tabs.query` returns the active tab, and `activeTab` supplies its URL/title. Declaring `tabs` would grant URL access to **all** tabs — far broader than required. |
| `history`, `cookies`, `webRequest`, `downloads`, `background` | No feature uses them. WebCheckr does not track browsing, read cookies, intercept requests, download files, or run in the background. |

### ⚠️ Change made during release preparation

Earlier versions declared:

```json
"host_permissions": ["<all_urls>"]
```

This was **removed** because it was unnecessary. `activeTab` + `scripting` already grants everything WebCheckr does — `chrome.scripting.executeScript` into the active tab after a user gesture.

Why this matters:

- `<all_urls>` triggers the install warning **"Read and change all your data on all websites"**, which is the single biggest deterrent for users and the most heavily scrutinised item in Chrome Web Store review.
- With `activeTab` alone, WebCheckr installs with **no host permission warning at all**.

**This change must be verified in a real browser before release:** reload the extension and confirm **Run QA** and **Highlight** still work. See the manual checklist in the release notes.

---

## Single-purpose statement

> WebCheckr has a single purpose: to inspect the webpage the user is currently viewing and report website quality issues (SEO, accessibility, links, performance, usability, and content problems) to that user.

Every permission above serves that one purpose. There is no secondary functionality.

## Remote code

**No remote code is used.** All executed JavaScript ships inside the extension package. WebCheckr makes no network requests, loads no external scripts, and evaluates no fetched strings.

## Data usage disclosure

WebCheckr collects **none** of the Chrome Web Store's disclosable data categories. It does not transmit any data off the user's device. See [`../PRIVACY.md`](../PRIVACY.md).
