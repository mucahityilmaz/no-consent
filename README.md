# no-consent

Personal Chrome extension that auto-rejects every marketing and legitimate-interest cookie consent option on websites. Functional cookies only. No "reject all" button needed — it does it for you.

## Install

1. Open `chrome://extensions` in Chrome (or Brave / Edge / any Chromium browser ≥ 111).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Pick this folder.

The extension is now active on all sites by default.

## Use

- It runs automatically on page load — supported CMPs get rejected before the banner shows.
- Click the toolbar icon for the popup:
  - **Reject all consent** — runs a fresh rejection on the current tab and reports which CMP it hit (or "no banner found"). Use this if a banner pops up late or you want to verify it worked.
  - **Auto-run on this site** — toggle off if the extension breaks something on a specific site. Reload after toggling.

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

## Architecture

See `CLAUDE.md`.
