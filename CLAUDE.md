# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal-use Chrome extension that auto-rejects every non-functional cookie/consent option on websites — including **legitimate interest** toggles, which most CMPs (Consent Management Platforms) hide behind extra clicks and have no "reject all" button for. Goal: end state equivalent to functional-only cookies on every site, with zero user interaction.

Not published, not shared, single user. Optimize for the user's actual browsing — robustness on the CMPs they hit in practice — not for general coverage.

## Stack

- **Manifest V3** Chrome extension (no MV2 APIs — `chrome.scripting`, service worker background, not `chrome.tabs.executeScript` / persistent background pages)
- **Vanilla JavaScript** — no build step, no bundler, no TypeScript. Files load directly as listed in `manifest.json`
- No npm dependencies in the extension itself. If a dev tool is ever needed (e.g. linting), keep it in a separate `dev/` boundary so the shipped extension stays buildless

## Architecture

Two layers, because consent UIs live in two places:

1. **DOM layer** — content script that detects visible consent banners and dismisses them by toggling off non-functional categories then clicking the save/confirm button. Per-CMP handlers (OneTrust, Cookiebot, TrustArc, Didomi, Sourcepoint, Usercentrics, Osano, CookieYes, Quantcast, Klaro, plus ad-hoc handlers for sites the user hits frequently). Each handler is a small module: a detector (selector or global var that proves this CMP is on the page) and a rejector (the actual click/toggle sequence).

2. **TCF layer** — IAB TCF v2.2 (`__tcfapi`) is the standard API for purpose + legitimate-interest signaling. Where it's exposed, prefer calling it over poking the DOM: more reliable, doesn't depend on banner being open. Set all purposes and all legitimate interests to `false` except whatever the user explicitly wants (likely none).

The DOM layer runs at `document_start` with `run_at` early so banners are killed before they're visible. The TCF layer needs `world: "MAIN"` to access page-context globals.

## Key constraints

- **Legitimate interest is the whole point.** A handler that clicks "Reject All" but leaves the LI tab untouched has failed. Every CMP handler must explicitly address LI toggles, not just consent toggles. When adding/reviewing a handler, verify the LI path is covered before merging.
- **Functional cookies must remain.** Sites breaking because session/auth cookies got rejected is a regression. If a CMP exposes a "strictly necessary" category, leave it as-is.
- **Idempotent.** Banners sometimes re-appear after SPA navigation. Handlers should be safe to run repeatedly and exit fast when nothing's to do.
- **Silent on success.** No notifications, no popups, no console spam in production. Logging is fine behind a debug flag.

## Status

Greenfield — no code yet. First milestones in order:
1. `manifest.json` + a stub content script that logs which CMP it detected on each page
2. Use the logger output to prioritize which CMPs to write real handlers for (the user's actual top sites, not a coverage matrix)
3. TCF v2.2 handler
4. Per-CMP DOM handlers, highest-frequency first
