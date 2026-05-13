# Privacy Policy

## The short version

**no-consent does not collect, store, or transmit any data. Ever.**

It has no servers. It makes no network requests. It knows nothing about you or what sites you visit.

---

## For regular users

When you install and use no-consent:

- **Nothing is sent anywhere.** The extension never contacts the internet. No requests leave your computer.
- **Nothing is stored.** It does not write to any database, file, or browser storage. When you close Chrome, no trace of the extension's activity remains.
- **No one can see what you do.** There is no developer dashboard, no analytics, no error reporting. Nobody receives any information about which sites you visit or how you use the extension.
- **It only does one thing:** when you open a cookie consent panel and click the button, it simulates clicking the toggles on that page - exactly what you would do by hand.

You can verify all of this by reading the full source code. It is a single file: [`src/rejector.js`](src/rejector.js).

---

## For developers

**Permissions requested:**

| Permission | Why it is needed |
|---|---|
| `host_permissions: <all_urls>` | Cookie consent panels appear on any website. The extension must be able to run on every page to detect when toggles are present. Without this, it would only work on a manually maintained list of sites. |

**What the extension reads:** DOM elements on the current page only - specifically `<input type="checkbox">` elements matching the consent panel's class names. It reads nothing else.

**What the extension writes:** Nothing. No `chrome.storage`, no `localStorage`, no `sessionStorage`, no cookies, no `IndexedDB`.

**Network activity:** None. There are no `fetch()`, `XMLHttpRequest`, `WebSocket`, or any other outbound calls in the codebase.

**What runs and when:** A single content script (`src/rejector.js`) is injected into every page at `document_start`. It runs a `setInterval` polling loop at 500ms to check for visible consent toggles. When none are found, the loop idles. The script is entirely self-contained with no imports or external dependencies.

The complete source is auditable in one read: [`src/rejector.js`](src/rejector.js).
