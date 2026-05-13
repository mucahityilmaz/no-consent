# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal-use Chrome extension that adds a **Disable all** button to cookie-consent preference panels. Click - every visible "on" toggle (consent + legitimate interest + special features + vendors) flips to off. User verifies visually, then clicks the site's own save button.

Single user, not published. Optimize for the user's actual browsing - robustness on the CMPs they hit in practice.

## The cardinal rule

The user wants to **see** consent toggles flip and **save themselves**. The extension must never:

- Open the *initial* prefs panel from the consent banner (user does that)
- Close the banner
- Click save / confirm / OK
- Submit anything

What IS allowed (per the user's later refinement): traversing *within* the prefs flow on click - e.g. visiting *Vendor preferences*, flipping toggles, coming back. That's visible navigation the user is OK with, since they can verify by clicking through afterwards. Always **return to the user's starting view** so they see the same screen they clicked on.

Don't add JS-API-based handlers (e.g. `Didomi.setUserDisagreeToAll()`) - those auto-save, breaking the see-it-yourself rule.

## Stack

- **Manifest V3** Chrome extension (`world: "MAIN"` content scripts, Chrome 111+)
- **Vanilla JavaScript**, no build step, no bundler, no TypeScript
- Single content script (`src/rejector.js`) running in MAIN world so it can access the page's toggle elements directly
- Only permission: `host_permissions: <all_urls>`. No `chrome.storage`, no popup, no service worker.

## Architecture

`src/rejector.js`:
- **handlers[]** - array of `{ name, findOn(), countAll(), flip() }`. `findOn` returns currently-on, visible toggle elements in the **current view** (decides whether to show the button). `countAll` returns the total count across all views including hidden sub-views (used for the button label). `flip` is async and flips *everything reachable* - including hopping to sub-views, flipping, and returning. Returns the total count flipped.
- **Detection loop** - `setInterval(tick, 500)`. A polling loop instead of MutationObserver, because `<input>.checked` flips don't fire attribute mutations and we'd miss user-driven toggle changes. 500ms is cheap.
- **Suppression window** - `suppressTickUntil` timestamp blocks the tick from redrawing the button while `flip()` is mid-flight (sub-view navigation) and while the success message is displayed. Cleared after ~1.5s, at which point the next tick decides whether the button stays (re-enabled toggles), disappears (all off), or rebuilds (user navigated to a different view).
- **Button** - shadow-DOM-hosted (mode `open`, `all: initial`) with `z-index: 2147483647`. Shows `Disable all (N)` where N is the total from `countAll()`. On click: `Working...` -> success message for ~1.5s -> tick decides next state.
- **i18n** - `TRANSLATIONS` object keyed by ISO 639-1 code. `t` is resolved from `navigator.language` with English fallback. To add a language, add one block to `TRANSLATIONS`.

## Adding a new CMP handler

1. Open the target site, click *Manage options* yourself to expose the toggles.
2. Use DevTools to find a CSS selector that catches every togglable switch - consent, legitimate interest, special features, **and** per-vendor toggles - but excludes any "strictly necessary" or otherwise-forced toggles. A class-prefix selector (e.g. `input[class*="fc-preference"]`) is often the cleanest.
3. Add the handler to `handlers[]` with `findOn`, `countAll`, and `flip`. Keep `findOn()` and `countAll()` cheap - they run on every tick.
4. Test the recipe live (toggles flip, none come back, page doesn't error).

## Verified CMPs

- **Google Funding Choices** (TCF cmpId 300). Selectors: `input[type="checkbox"][class*="fc-preference"]`. Validated on gamesjobsdirect.com via Playwright in May 2026.

## Status

- v0.4 - adds i18n (EN/TR), corrects pre-click count via `countAll`, cleans up button label.
- v0.3 - flip-only behavior. Drops every JS-API-based handler from v0.2. Single CMP supported (Google Funding Choices).
- Branching: feature branches NOT used. Work and commit directly on `main`.

## Version

Bump the version in **both** `manifest.json` and the header comment of `src/rejector.js` on every commit that changes extension behavior or user-visible content. Use semver patch for fixes, minor for new features or CMP handlers.
