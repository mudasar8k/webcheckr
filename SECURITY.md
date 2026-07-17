# Security Policy — WebCheckr

## WebCheckr is not a vulnerability scanner

Please read this first, because it shapes what counts as a security issue here.

WebCheckr is a **read-only, informational website QA tool**. It inspects the DOM of the single page you are already viewing, in your own browser, and reports quality issues (SEO, accessibility, links, performance, usability, content).

WebCheckr deliberately does **not**:

- scan for vulnerabilities or perform exploitation of any kind,
- run brute-force or password attacks,
- perform login or authentication testing,
- run destructive or intrusive security scans,
- crawl sites or fetch links,
- make any network request whatsoever.

**Reports asking WebCheckr to add offensive or intrusive security testing are out of scope and will be declined.** Findings from running WebCheckr *against* a website are findings about that website, not about WebCheckr — report those to the website's owner, not here.

## Supported versions

WebCheckr is pre-1.0 and under active development. Security fixes are applied to the latest version on `main` only.

| Version | Supported |
| --- | --- |
| Latest `main` / latest release | ✅ |
| Older versions | ❌ |

## What is in scope

A security issue in WebCheckr itself, such as:

- Code that could execute untrusted content from an inspected page inside the extension's privileged context (for example an XSS in the popup via unescaped page content).
- Any path that sends page data, user data, or browsing information off the device. *(There should be none — WebCheckr makes zero network requests.)*
- A permission escalation, or the extension acting on a page without an explicit user gesture.
- The highlight feature permanently modifying, damaging, or leaking data from an inspected page.
- Selector handling that could be abused to break out of the intended read-only behaviour.
- A dependency or supply-chain risk. *(There should be none — WebCheckr has zero dependencies.)*

## How to report a security issue privately

Please report security issues using **GitHub Private Vulnerability Reporting** for this repository. **Do not publish suspected security vulnerabilities in public GitHub issues**, pull requests, or discussions — and do not include sensitive details, exploit code, or affected URLs there.

**To report:**

> Open a private report at
> <https://github.com/mudasar8k/webcheckr/security/advisories/new>
>
> Or go to the repository's **Security** tab → **Report a vulnerability**.

This creates a draft advisory visible only to you and the maintainer, so the issue can be fixed before it becomes public.

### What to include

- A description of the issue and why you believe it is a security problem.
- Steps to reproduce, or a minimal proof of concept.
- The WebCheckr version (see `manifest.json`) and your Chrome version.
- The impact you believe it has.

## Safe disclosure expectations

- **Acknowledgement:** within **7 days** of your report.
- **Initial assessment:** within **14 days**, including whether it is in scope and a rough severity.
- **Fix timeline:** we aim to ship a fix for confirmed issues within **90 days**, sooner for severe ones.
- **Disclosure:** please give us a reasonable chance to fix the issue before publishing. We will coordinate a disclosure date with you, credit you in the advisory and `CHANGELOG.md` (unless you prefer to stay anonymous), and publish a security advisory once a fix is available.
- **Good faith:** we will not pursue or support legal action against researchers who report in good faith, act in scope, avoid privacy violations and service disruption, and do not access or modify data that is not theirs.

This is a free, unfunded, open-source project maintained in spare time. **There is no bug bounty and no monetary reward.** Please set expectations accordingly — we still genuinely appreciate reports.

## Out of scope

- Vulnerabilities in websites you inspect with WebCheckr (report to that site's owner).
- Reports asking for offensive security, exploitation, or intrusive scanning features.
- Issues requiring a compromised browser, a malicious extension already installed, or physical device access.
- Missing security hardening with no demonstrable impact.
- Automated scanner output without a working proof of concept.
