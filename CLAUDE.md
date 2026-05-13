# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal-use Chrome extension that adds a **Disable all** button to cookie-consent preference panels. Click → every visible "on" toggle (consent + legitimate interest + special features + vendors) flips to off. User verifies visually, then clicks the site's own save button.

Single user, not published. Optimize for the user's actual browsing — robustness on the CMPs they hit in practice.

## The cardinal rule

The user wants to **see** consent toggles flip and **save themselves**. The extension must never:

- Open the *initial* prefs panel from the consent banner (user does that)
- Close the banner
- Click save / confirm / OK
- Submit anything

What IS allowed (per the user's later refinement): traversing *within* the prefs flow on click — e.g. visiting *Vendor preferences*, flipping toggles, coming back. That's visible navigation the user is OK with, since they can verify by clicking through afterwards. Always **return to the user's starting view** so they see the same screen they clicked on.

Don't add JS-API-based handlers (e.g. `Didomi.setUserDisagreeToAll()`) — those auto-save, breaking the see-it-yourself rule.

## Stack

- **Manifest V3** Chrome extension (`world: "MAIN"` content scripts, Chrome 111+)
- **Vanilla JavaScript**, no build step, no bundler, no TypeScript
- Single content script (`src/rejector.js`) running in MAIN world so it can access the page's toggle elements directly
- Only permission: `host_permissions: <all_urls>`. No `chrome.storage`, no popup, no service worker.

## Architecture

`src/rejector.js`:
- **handlers[]** — array of `{ name, findOn(), flip() }`. `findOn` returns currently-on, visible toggle elements in the **current view** (used to decide whether to show the button and what count to display). `flip` is async and is responsible for flipping *everything reachable* — including hopping to sub-views, flipping, and returning. Returns the total count flipped.
- **Detection loop** — `setInterval(tick, 500)`. A polling loop instead of MutationObserver, because `<input>.checked` flips don't fire attribute mutations and we'd miss user-driven toggle changes. 500ms is cheap.
- **Suppression window** — `suppressTickUntil` timestamp blocks the tick from redrawing the button while `flip()` is mid-flight (sub-view navigation) and while the success message is displayed. Cleared after ~1.5s, at which point the next tick decides whether the button stays (re-enabled toggles), disappears (all off), or rebuilds (user navigated to a different view).
- **Button** — shadow-DOM-hosted (mode `open`, `all: initial`) with `z-index: 2147483647`. Shows `Disable all` + `N on • CMP-name`. On click: `Working…` → success message `✓ Disabled N switches` for ~1.5s → tick decides next state.

## Adding a new CMP handler

1. Open the target site, click *Manage options* yourself to expose the toggles.
2. Use DevTools to find a CSS selector that catches every togglable switch — consent, legitimate interest, special features, **and** per-vendor toggles — but excludes any "strictly necessary" or otherwise-forced toggles. A class-prefix selector (e.g. `input[class*="fc-preference"]`) is often the cleanest.
3. Add the handler to `handlers[]`. Keep `findOn()` cheap — it runs on every observer tick.
4. Test the recipe live (toggles flip, none come back, page doesn't error).

## Verified CMPs

- **Google Funding Choices** (TCF cmpId 300). Selectors: `input[type="checkbox"][class*="fc-preference"]`. Validated on gamesjobsdirect.com via Playwright in May 2026.

## Status

- v0.3 — flip-only behavior. Drops every JS-API-based handler from v0.2. Single CMP supported (Google Funding Choices). Others to be added as the user hits them.
- Branching: feature branches NOT used. Work and commit directly on `main`.
