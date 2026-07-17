# Pull request

## What does this change?

<!-- A clear summary of the change. -->

## Why?

<!-- The problem this solves. Link any related issue: "Closes #123". -->

Closes #

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New QA check
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (existing behaviour changes)
- [ ] Documentation
- [ ] Refactor / chore (no behaviour change)

## How was this verified?

<!--
Say what you actually ran and observed. "npm test passes" alone is not enough
for a UI or check change — load the extension and drive it.
-->

- [ ] `npm test` passes
- [ ] Loaded the unpacked extension and ran **Run QA** on a real page
- [ ] No errors in the popup console
- [ ] Tested on a non-WebToolkit website (generic checks still run)

**Pages tested:**

## Screenshots

<!-- Required for UI changes. Before/after if possible. Light and dark theme if relevant. -->

## If this adds or changes a QA check

- [ ] The result uses a stable, unique, namespaced id (e.g. `links.href.empty`)
- [ ] Severity is justified (Critical −15, High −8, Medium −4, Low −1, Informational 0)
- [ ] Informational results deduct **no** points
- [ ] Affected elements include a `selector` so Highlight / Copy selector work
- [ ] False-positive risks considered and narrowed
- [ ] Tests added: it fires when it should **and** does not fire when it shouldn't

## Safety checklist (required)

WebCheckr is a read-only, local, informational tool. Confirm this change:

- [ ] Makes **no** network requests (no fetching links/images, no APIs, no telemetry)
- [ ] Does **not** crawl beyond the current page
- [ ] Does **not** perform login testing, brute-force, or exploitation
- [ ] Does **not** permanently modify the inspected page
- [ ] Does **not** read password fields or form input values
- [ ] Does **not** collect, store, or transmit user or browsing data
- [ ] Adds **no** new permissions or dependencies

## Housekeeping

- [ ] If I added a source file, I registered it in **both** `popup.html` and `tests/harness.mjs`
- [ ] Code style matches the surrounding files
- [ ] I did not remove or weaken existing passing tests
- [ ] Docs updated if behaviour changed (README / PRIVACY / PERMISSIONS)

## Notes for the reviewer

<!-- Anything you're unsure about, trade-offs you made, or areas to look at closely. -->
