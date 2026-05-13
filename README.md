# no-consent

Personal Chrome extension that adds a **Reject all consent** button — including legitimate interest — to cookie banners that don't have one. Click the button, the banner closes, all non-functional cookies are rejected.

## Install

1. Open `chrome://extensions` in Chrome (or any Chromium browser ≥ 111).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Pick this folder.

## How it works

When a supported consent banner appears, a small floating button shows up at the top of the page:

> **[ Reject all consent ]** *Google Funding Choices* &nbsp; ×

Click it. The extension opens the banner's "manage options" panel (if needed), unchecks every consent + legitimate-interest + special-feature toggle, and clicks "save" / "confirm" — all in one go. The banner closes and you see `✓ Rejected via …`.

Click the **×** to hide the button for this page if you don't want to reject.

Nothing happens automatically — no banner action runs until you click.

## Supported CMPs

| CMP | LI handling |
|---|---|
| Google Funding Choices | DOM: opens prefs panel, unchecks every purpose/LI/special-feature, confirms |
| Didomi | `setUserDisagreeToAll()` — covers consent + LI |
| OneTrust | `RejectAll()` (site-config dependent for LI) |
| Cookiebot | `decline()` |
| Usercentrics | `denyAllConsents()` |
| Osano | `cm.denyAll()` |
| Sourcepoint | `gdpr.rejectAll()` |
| Klaro | `manager.changeAll(false) + saveAndApplyConsents()` |

To add a new CMP: add a handler `{name, isVisible, reject}` to the `handlers` array in `src/rejector.js`. Use Playwright or DevTools on a real site to find the right selectors.

## Architecture

See `CLAUDE.md`.
