# Security Policy

## Permissions

**no-consent** requests `<all_urls>` host permission. This is required because consent panels appear on any website - the extension must be able to run on every page you visit to detect when toggles are present.

## What the extension does

- Reads the DOM of the current page to find consent toggle elements
- Simulates clicks on those elements (the same as you clicking them manually)
- Navigates within the consent panel's own sub-views (e.g. Vendor preferences) to reach all toggles

## What the extension does NOT do

- Makes no network requests to any server - ever
- Writes nothing to `chrome.storage`, `localStorage`, cookies, or any other storage
- Collects no analytics, usage data, or telemetry
- Contains no `eval()` or dynamically constructed code
- Does not open, close, or submit consent panels - the user does that

The full source is in [`src/rejector.js`](src/rejector.js) (~260 lines of plain JavaScript).

## Reporting a vulnerability

If you discover a security issue, please open a [GitHub Issue](../../issues) describing the problem. For sensitive reports, use the email address on the maintainer's GitHub profile.
