# Chrome Web Store — Submission Values (v0.1.0)

Copy-ready values for the Chrome Web Store Developer Dashboard. Every value below reflects the **verified** state of the code at v0.1.0 — nothing here is aspirational.

> Step-by-step walkthrough: [`FIRST_STORE_SUBMISSION_CHECKLIST.md`](FIRST_STORE_SUBMISSION_CHECKLIST.md)
> Longer marketing copy: [`CHROME_WEB_STORE_LISTING.md`](CHROME_WEB_STORE_LISTING.md)

---

## Package

| Field | Value |
| --- | --- |
| Version | `0.1.0` |
| ZIP | `releases/webcheckr-v0.1.0.zip` |
| Build command | `npm run package:store` |

---

## Store listing

### Extension name

```
WebCheckr — Website QA Inspector
```

> 32 characters (limit 75). Uses an em dash (—). If the dashboard rejects it, use `WebCheckr - Website QA Inspector`.

### Short description

```
Inspect webpages for common SEO, accessibility, links, performance, usability, and website quality issues.
```

> 105 characters (limit 132).

### Category

```
Developer Tools
```

### Language

```
English (United States)
```

### Detailed description

Use the long-form description in [`CHROME_WEB_STORE_LISTING.md`](CHROME_WEB_STORE_LISTING.md#detailed-description).

---

## Single-purpose statement

```
WebCheckr inspects the active webpage, when requested by the user, and reports common website quality issues related to SEO, accessibility, links, performance, usability and best practices.
```

---

## Permission justifications

### `activeTab`

```
WebCheckr uses activeTab only after the user opens the extension and starts an inspection. It allows the extension to inspect the currently active webpage without requesting permanent access to all websites.
```

### `scripting`

```
WebCheckr uses the scripting permission to run its local inspection and highlighting code on the active webpage after the user requests it.
```

### Host permissions

```
None requested.
```

> WebCheckr declares no `host_permissions`, so it installs with **no "read and change all your data on all websites" warning**. `activeTab` covers every flow. Full reasoning: [`PERMISSIONS.md`](PERMISSIONS.md).

---

## Remote code

**Answer: No.**

```
No. All executable code is included in the extension package.
```

> Verified: the package contains no remote `<script>`/`<link>`, no `fetch`/`XHR`/`WebSocket`, and no `eval` of fetched content. `npm run package:store` fails the build if a remote resource is ever referenced.

---

## Privacy — data collection

**Answer: Does this item collect user data? → No**

```
None, based on the current verified implementation.
```

Answer **No** to every category:

| Category | Answer |
| --- | --- |
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No |

> On "Website content": WebCheckr reads the active page into memory to analyse it locally and then discards it. Nothing is collected, stored, or transmitted, so the correct answer is **No**.

### Data transmission

```
None.
```

> WebCheckr makes zero network requests. Verified: no `fetch`, `XMLHttpRequest`, `WebSocket`, or `sendBeacon` anywhere in the shipped code. It also uses no storage (`chrome.storage`, `localStorage`, `indexedDB`), so nothing persists between sessions.

### Required certifications — tick all three

- [x] I do not sell or transfer user data to third parties, apart from the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Account, monetisation and testing

| Field | Value |
| --- | --- |
| Authentication | Not required. |
| Test account | Not required. |
| In-app purchases | None. |
| Ads | None. |
| Pricing | Free |

### Reviewer test instructions

```
No account or test credentials are needed.

1. Install the extension.
2. Open any website, for example https://example.com
3. Click the WebCheckr toolbar icon.
4. Click "Run QA".

Results appear immediately in the popup. The extension requires no host
permissions, makes no network requests, and stores no data. All analysis
runs locally in the browser and only after the user clicks "Run QA".
```

---

## URLs

| Field | Value |
| --- | --- |
| Homepage URL | `https://github.com/mudasar8k/webcheckr` |
| Support URL | `https://github.com/mudasar8k/webcheckr/issues` |
| Privacy policy URL | `https://github.com/mudasar8k/webcheckr/blob/main/PRIVACY.md` |

> ⚠️ All three must return **HTTP 200 publicly** before you submit. If the repository is private, they return 404 and the submission will be rejected. Verify each in a logged-out/incognito window.

---

## Distribution

| Field | Value |
| --- | --- |
| Visibility | Public |
| Regions | All regions |
| Pricing | Free |

---

## Post-publication

Once the listing is live, update the GitHub repository **Website** field to the Chrome Web Store URL:

```
https://chromewebstore.google.com/detail/webcheckr/<EXTENSION_ID>
```

`<EXTENSION_ID>` is assigned by Google when the item is first created. See [`GITHUB_SETUP.md`](GITHUB_SETUP.md).
