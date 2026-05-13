# Contributing

The primary way to contribute is to **add support for a new CMP** (consent management platform). It's a small, self-contained change - no build tooling, no TypeScript, no dependencies.

## Prerequisites

- Chrome with Developer mode enabled (to test unpacked extensions)
- Chrome DevTools familiarity (inspecting DOM elements, testing selectors in the Console)

## How consent handlers work

Each CMP is described by a handler object in `src/rejector.js`:

```js
{
  name: 'Your CMP Name',

  // Returns currently-on, visible toggles in the CURRENT view only.
  // Called every 500ms - keep it cheap (no awaits, no heavy DOM work).
  findOn: () => [ ...elements ],

  // Returns the total count across ALL views (including hidden sub-views).
  // Used for the button label so the number matches what flip() will actually flip.
  countAll: () => number,

  // Async. Flips every reachable on-toggle, including sub-views.
  // Must return the total count of toggles flipped.
  flip: async () => { ... return count; },
}
```

## Step-by-step: adding a new CMP

**1. Find the consent panel**

Visit a site that uses the CMP, click *Manage options* / *Customise* / *Preferences* to open the toggle view.

**2. Find the selector**

Open DevTools → Console. Find a selector that matches every togglable switch - purpose consent, legitimate interest, special features, and vendors - but excludes any "Strictly necessary" toggles that can't be turned off.

```js
// Test in the DevTools console:
document.querySelectorAll('input[class*="your-prefix"]:checked')
```

A class-prefix selector is often the cleanest. The `:checked` pseudo-class restricts it to on-toggles.

**3. Check for sub-views**

Does the panel have a separate *Vendor preferences* or *Purposes* tab that also contains toggles? If yes, your `flip()` must navigate there, flip, and return.

**4. Write the handler**

```js
{
  name: 'YourCMP',

  findOn: () => Array.from(
    document.querySelectorAll('input[class*="your-prefix"]:checked')
  ).filter(el => el.offsetParent !== null),  // visible only

  flip: async () => {
    // Helper: flip all currently-visible on-toggles and return count.
    const flipVisible = () => {
      const els = Array.from(
        document.querySelectorAll('input[class*="your-prefix"]:checked')
      ).filter(el => el.offsetParent !== null);
      els.forEach(el => el.click());
      return els.length;
    };

    let total = flipVisible();

    // If there is a sub-view (e.g. Vendor preferences), navigate to it,
    // flip, then return. Use waitFor() to wait for view transitions.
    // See the Google Funding Choices handler for a complete example.

    return total;
  },
},
```

Push it into the `handlers` array near the top of `src/rejector.js`.

**5. Test visually**

1. Load the extension unpacked (`chrome://extensions` → Load unpacked).
2. Visit the target site and open the consent panel.
3. Confirm the floating button appears with the right count.
4. Click **Disable all** - every toggle should visibly flip to off.
5. If the CMP has sub-views, verify those are flipped too.
6. Confirm the extension returns to the view you started on.
7. Confirm the site's own Save button still works after flipping.

## Code style

- Vanilla JavaScript only - no TypeScript, no bundler, no build step
- No external dependencies
- No JS-API calls that auto-save (e.g. `Didomi.setUserDisagreeToAll()`, `cmp.rejectAll()`) - these bypass the visible-flip requirement
- Keep `findOn()` fast: one `querySelectorAll` + a filter, nothing else

## Submitting

Open a pull request against `main`. Fill in the PR template checklist. Include the site URL you tested on so it can be verified.

Questions? Open an issue first.
