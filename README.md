[Türkçe](README.tr.md)

# no-consent

Cookie consent panels love to hide "Reject all" behind an endless vendor list. **no-consent** adds a **Disable all** button that flips every toggle — purpose consent, legitimate interest, special features, vendors — right in front of your eyes. You verify visually, then click the site's own Save button yourself.

The extension **never** opens panels, closes banners, or saves anything on your behalf.

---

## Features

- Flips all consent toggles: purpose consent, legitimate interest, special features, vendors
- Visible, one-click operation — you watch every switch flip in real time
- Never submits, auto-saves, or touches your session
- Handles sub-views (navigates to Vendor preferences, flips everything, returns to your starting view)
- Lightweight: no dependencies, no build step, ~260 lines of vanilla JS
- Dismiss per page load with the × button if you don't need it

## Install

1. Open `chrome://extensions` in Chrome (or any Chromium browser ≥ 111).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select this repository folder.

## How it works

1. Visit a site and open its consent preferences panel (*Manage options* / *Customise* / *Preferences* — whatever reveals the toggles).
2. When toggles are detected on screen, a floating button appears at the top of the page:

   > **[ Disable all ]** *48 on • CMP Name* &nbsp; ×

3. Click it. Every "on" toggle flips to off — visibly, in real time. If the panel has a *Vendor preferences* sub-view, the extension navigates there, flips everything, then returns to where you started.
4. The button confirms: `✓ Disabled 80 switches`
5. Click the site's own *Save* / *Confirm choices* / *OK* button.

The count updates within ~½ second as you switch views.

## Tested CMPs

| CMP | Toggles handled |
|---|---|
| Google Funding Choices | `input[class*="fc-preference"]` — purpose consent, LI, special features, vendor consent, vendor LI |

More CMPs are welcome — see [Contributing](#contributing).

## Privacy & security

- **No network requests** — the extension never contacts any server
- **No storage** — nothing is written to `chrome.storage`, `localStorage`, or cookies
- **No eval** — all code is static, loaded from this repository
- Requires `<all_urls>` host permission so it can detect consent panels on any site; it reads only the DOM of the page you're currently on

See [SECURITY.md](SECURITY.md) for full detail.

## Contributing

Adding support for a new consent management platform (CMP) is the primary way to contribute — a two-file change, no tooling required. See [CONTRIBUTING.md](CONTRIBUTING.md) for the step-by-step guide.

Bug reports and CMP requests are welcome via [GitHub Issues](../../issues).

## License

[MIT](LICENSE)
