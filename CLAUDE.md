# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal-use Chrome extension that adds a **Disable all** button to cookie-consent preference panels. Click → every visible "on" toggle (consent + legitimate interest + special features + vendors) flips to off. User verifies visually, then clicks the site's own save button.

Single user, not published. Optimize for the user's actual browsing — robustness on the CMPs they hit in practice.

## The cardinal rule

The extension **only flips visible toggles**. It must never:

- Open a preferences/manage-options panel
- Close the banner
- Click save / confirm / OK
- Submit anything

The user wants to see the toggles flip with their own eyes and then save themselves. Previous iterations did "the whole flow" via CMP JS APIs (e.g. `Didomi.setUserDisagreeToAll()`) and were rejected for exactly this reason — the user can't verify a one-shot reject visually. **Don't add JS-API-based handlers back.**

## Stack

- **Manifest V3** Chrome extension (`world: "MAIN"` content scripts, Chrome 111+)
- **Vanilla JavaScript**, no build step, no bundler, no TypeScript
- Single content script (`src/rejector.js`) running in MAIN world so it can access the page's toggle elements directly
- Only permission: `host_permissions: <all_urls>`. No `chrome.storage`, no popup, no service worker.

## Architecture

`src/rejector.js`:
- **handlers[]** — array of `{ name, findOn(), flip(els) }`. `findOn` returns currently-on toggle elements that are visible. `flip` flips them all off. Order matters: first match wins.
- **Detection loop** — `MutationObserver` on `documentElement` (childList + subtree + attribute changes for `checked`, `aria-checked`, `class`). Each tick: if any handler's `findOn()` is non-empty, show/refresh the button; otherwise hide it.
- **Button** — shadow-DOM-hosted (mode `open`, `all: initial`) with `z-index: 2147483647`. Shows `Disable all` plus a live count `N on • CMP-name`. On click: runs `flip()`, then displays `✓ Disabled N switches` for ~1.8s while a `recentlyClicked` flag suppresses the auto-remove tick.

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
