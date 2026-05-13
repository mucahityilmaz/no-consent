[Türkçe](README.tr.md)

# no-consent

Cookie consent panels love to hide "Reject all" behind an endless vendor list. **no-consent** adds a **Disable all** button that flips every toggle - purpose consent, legitimate interest, special features, vendors - right in front of your eyes. You verify visually, then click the site's own Save button yourself.

The extension **never** opens panels, closes banners, or saves anything on your behalf.

---

## Features

- Flips all consent toggles: purpose consent, legitimate interest, special features, vendors
- Visible, one-click operation - you watch every switch flip in real time
- Never submits, auto-saves, or touches your session
- Handles sub-views (navigates to Vendor preferences, flips everything, returns to your starting view)
- Lightweight: no dependencies, no build step, ~260 lines of vanilla JS
- Dismiss per page load with the × button if you don't need it

## Install

Works in Chrome, Edge, Brave, and any Chromium-based browser.

### Step 1 - Get the files

**No git?** Click the green **Code** button at the top of this page, choose **Download ZIP**, and unzip it anywhere on your computer.

**Using git:**
```
git clone https://github.com/mucahityilmaz/no-consent.git
```

### Step 2 - Load it into your browser

1. Open a new tab and go to **chrome://extensions**
2. Turn on **Developer mode** using the toggle in the top-right corner
   *(This just lets you load extensions from your own computer - it's safe)*
3. Click **Load unpacked**
4. Select the folder you just unzipped or cloned - the one that contains `manifest.json`

Done. The extension is now active. You won't see anything until you open a cookie consent panel on a website.

## How it works

1. Visit a site and open its consent preferences panel (*Manage options* / *Customise* / *Preferences* - whatever reveals the toggles).
2. When toggles are detected on screen, a floating button appears at the top of the page:

   > **[ Disable all (48) ]** &nbsp; ×

3. Click it. Every "on" toggle flips to off - visibly, in real time. If the panel has a *Vendor preferences* sub-view, the extension navigates there, flips everything, then returns to where you started.
4. The button confirms: `✓ Disabled 80 switches`
5. Click the site's own *Save* / *Confirm choices* / *OK* button.

The count updates within ~½ second as you switch views.

## Tested CMPs

| CMP | Toggles handled |
|---|---|
| Google Funding Choices | `input[class*="fc-preference"]` - purpose consent, LI, special features, vendor consent, vendor LI |

More CMPs are welcome - see [Contributing](#contributing).

## Privacy & security

**This extension cannot spy on you.** It has no servers, makes zero network requests, and stores nothing. It only reads the cookie toggle buttons on the page you're currently looking at - nothing else on that page, and nothing from any other tab or site.

- **No network requests** - the extension never contacts any server
- **No storage** - nothing is written to `chrome.storage`, `localStorage`, or cookies
- **No eval** - all code is static, loaded from this repository
- Requires `<all_urls>` host permission so it can detect consent panels on any site; it reads only the DOM of the page you're currently on

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for full detail.

## Contributing

Adding support for a new consent management platform (CMP) is the primary way to contribute - a two-file change, no tooling required. See [CONTRIBUTING.md](CONTRIBUTING.md) for the step-by-step guide.

Bug reports and CMP requests are welcome via [GitHub Issues](../../issues).

## License

[MIT](LICENSE)
