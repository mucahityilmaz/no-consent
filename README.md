# no-consent

Personal Chrome extension that auto-rejects every marketing and legitimate-interest cookie consent option on websites. Functional cookies only. No "reject all" button needed — it does it for you.

## Install

1. Open `chrome://extensions` in Chrome (or Brave / Edge / any Chromium browser ≥ 111).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Pick this folder.

The extension is now active on all sites by default.

## Use

- It runs automatically — no banner action required on supported CMPs.
- Click the toolbar icon to **disable on the current site** if it breaks something. Reload the page after toggling.

## What it covers (v0.1)

Programmatic reject via each CMP's own JS API:

| CMP | API used | Legitimate interest? |
|---|---|---|
| Didomi | `Didomi.setUserDisagreeToAll()` | Yes — covers both |
| OneTrust | `OneTrust.RejectAll()` | Site-config dependent |
| Cookiebot | `Cookiebot.decline()` | Yes |
| Usercentrics | `UC_UI.denyAllConsents()` | Yes |
| Osano | `Osano.cm.denyAll()` | Yes |
| Sourcepoint | `_sp_.gdpr.rejectAll()` | Yes |
| Klaro | `manager.changeAll(false) + saveAndApplyConsents()` | N/A (Klaro has no LI concept) |

Detection-only (logged, no auto-reject yet — add a handler in `src/rejector.js` if you hit these often): TrustArc, CookieYes, Quantcast, generic TCF v2.2.

## Debug

Enable verbose console logging:

```js
// Run in DevTools on any page where the extension is active
chrome.storage.local.set({ debug: true })
```

Then reload. Logs are prefixed `[no-consent]`.

## Architecture

See `CLAUDE.md`.
