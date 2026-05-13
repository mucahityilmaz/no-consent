# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal-use Chrome extension that injects a **Reject all consent** button onto cookie banners that don't have one (most don't have it for legitimate-interest specifically). One click → all purposes + all legitimate-interest + all special features off → banner closes. Functional cookies only.

Not published, not shared, single user. Optimize for the user's actual browsing — robustness on the CMPs they hit in practice — not for general coverage.

## Stack

- **Manifest V3** Chrome extension (`world: "MAIN"` content scripts, Chrome 111+)
- **Vanilla JavaScript**, no build step, no bundler, no TypeScript
- Single content script (`src/rejector.js`) running in MAIN world so it can call CMP globals (`Didomi`, `OneTrust`, `window.UC_UI`, etc.) and inspect their DOM
- No `chrome.storage`, no popup, no service worker. The only permission is `host_permissions: <all_urls>` so the script can run everywhere.

## Architecture

One file, one job: watch for a consent banner; when one is visible, inject a Shadow-DOM-isolated floating button at the top of the page; when clicked, run the handler's rejection logic. Nothing happens until the user clicks.

`src/rejector.js`:
- **handlers[]** — array of `{ name, isVisible(), reject() }`. Order matters: higher-confidence handlers first. Each handler's `isVisible` returns true only when *that CMP's banner is currently shown to the user* (not just "the CMP is loaded"). `reject` may be async; returns true on success.
- **Detection loop** — polls every 250ms for ~10s after `DOMContentLoaded`, plus a `MutationObserver` on `documentElement` that runs for the page lifetime. Catches lazy/SPA-mounted banners.
- **Button** — built fresh per handler change, hosted in a closed Shadow Root with `all: initial` to avoid the host site's CSS bleeding in. Single z-index ceiling `2147483647` (max int32) — beats every CMP overlay in practice.

## Key constraints

- **Legitimate interest is the whole point.** A handler that clicks "Reject All" but leaves the LI toggles untouched has failed. Every handler must explicitly address LI — for CMPs with a JS API that covers it (Didomi, Cookiebot, Usercentrics, Osano, Sourcepoint) one call is enough; for ones without (Google Funding Choices) the handler walks the prefs panel and unchecks them by DOM click.
- **No auto-reject.** Action happens only on user click of the injected button. Don't add silent rejection back — past iterations had it, the user explicitly removed it because they wanted to *see* it work.
- **Idempotent.** `tick()` runs many times during a page; `buildButton` must replace any existing button cleanly, and a re-run of a handler's `reject()` shouldn't break the page.
- **Banner-visibility, not CMP-loaded, gates the button.** If the user already accepted/rejected on a previous visit, the CMP global is still around but the banner isn't shown — `isVisible` must return false in that case so we don't show a useless button.

## Adding a new CMP handler

1. Load the target site in Playwright. Run `__tcfapi('ping', 2, cb)` to get the CMP ID (registry: https://iabeurope.eu/cmp-list/).
2. Inspect the live DOM: which selectors mark the banner as visible? Is there a JS API global (e.g. `window.SomeCmp.rejectAll()`) or is DOM-clicking required?
3. Add an entry to `handlers[]` in `src/rejector.js`. Keep `isVisible` cheap — it runs on every MutationObserver tick.
4. If DOM-only: open the prefs panel from inside `reject()`, find consent + LI inputs, click each that's currently checked, then click confirm.

## Status

- v0.2 — banner-injected button, no auto-run, no popup. Handlers: Google Funding Choices (cmpId 300, DOM-based with LI), Didomi, OneTrust, Cookiebot, Usercentrics, Osano, Sourcepoint, Klaro.
- Known gap: TrustArc, CookieYes, AdMiral and other niche TCF CMPs aren't covered — add them as the user encounters them.
- Branching: feature branches are NOT used. Work and commit directly on `main` (user instruction — single-user repo, no review).
