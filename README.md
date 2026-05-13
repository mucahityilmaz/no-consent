# no-consent

Personal Chrome extension that adds a **Disable all** button to cookie-consent preference panels. Click it and every visible "on" toggle (consent + legitimate interest + special features + vendors) flips to off. You verify with your own eyes, then click the site's own save / confirm button.

The extension never opens panels, closes banners, or saves anything on your behalf.

## Install

1. Open `chrome://extensions` in Chrome (or any Chromium browser ≥ 111).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Pick this folder.

## How it works

1. You visit a site and see its consent banner.
2. You click *Manage options* / *Customise* / *Preferences* yourself — whatever opens the panel with the toggles.
3. When the toggles are on screen, a small floating button appears at the top of the page:

   > **[ Disable all ]** *6 on • Google Funding Choices* &nbsp; ×

4. Click it. Every currently-on toggle flips to off — visibly, in front of you. The button updates to `✓ Disabled 6 switches`.
5. You click the site's own *Save* / *Confirm choices* / *OK* button.

Click the **×** to dismiss the button for this page load if you don't want to use it.

## Supported CMPs

| CMP | Toggles handled |
|---|---|
| Google Funding Choices | `input[class*="fc-preference"]` — purpose consent, purpose LI, special features, vendor consent, vendor LI |

That's it for v0.3. Other CMPs (OneTrust, Cookiebot, Didomi, etc.) need DOM-based handlers added — most of their JS APIs auto-save, which violates the "let me see it" rule. They'll get added as you hit them in real browsing.

## Adding a new CMP

In `src/rejector.js`, push an entry into `handlers`:

```js
{
  name: 'YourCMP',
  findOn: () => Array.from(document.querySelectorAll('YOUR_SELECTOR'))
    .filter(i => /* still on */ && /* visible */),
  flip: (els) => { els.forEach(el => el.click()); },
}
```

Use DevTools on a real consent panel to find a selector that catches every togglable switch (consent + LI + special features + vendors) but excludes any forced-on "strictly necessary" toggles.

## Architecture

See `CLAUDE.md`.
