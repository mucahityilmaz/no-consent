// MAIN-world content script. Has access to page JS context (window.OneTrust,
// window.Didomi, etc.) so it can call each CMP's reject API directly.
//
// Strategy: poll for known CMP globals for ~10s after page start, plus a
// MutationObserver that keeps watching forever so SPAs that lazy-mount the
// banner still get caught. Each handler must be idempotent — handlers may be
// called many times during a single page life.

(() => {
  const TAG = '[no-consent]';
  let enabled = false;
  let debug = false;
  let dismissedCMP = null; // last CMP we successfully acted on
  let pollTimer = null;
  let pollStop = 0;
  let observer = null;

  const log = (...a) => { if (debug) console.log(TAG, ...a); };
  const warn = (...a) => { if (debug) console.warn(TAG, ...a); };

  // ---------- CMP handlers ----------
  // Each: { name, detect() -> bool, reject() -> bool }
  // reject() returns true if the user-visible state is "all non-functional off".
  // Order matters: more specific / higher-confidence handlers go first.
  const handlers = [
    {
      // Didomi exposes a single call that disables BOTH consents and legitimate
      // interests — the cleanest CMP for our use case.
      name: 'Didomi',
      detect: () => typeof window.Didomi === 'object' && window.Didomi !== null
        && typeof window.Didomi.setUserDisagreeToAll === 'function',
      reject: () => { window.Didomi.setUserDisagreeToAll(); return true; },
    },
    {
      name: 'OneTrust',
      detect: () => typeof window.OneTrust === 'object' && window.OneTrust !== null
        && typeof window.OneTrust.RejectAll === 'function',
      reject: () => {
        // RejectAll covers consent categories. LI handling on OneTrust depends
        // on the site's config — some installs include LI here, others require
        // toggling the "Legitimate Interest" tab manually. Best-effort for now.
        window.OneTrust.RejectAll();
        return true;
      },
    },
    {
      name: 'Cookiebot',
      detect: () => typeof window.Cookiebot === 'object' && window.Cookiebot !== null
        && typeof window.Cookiebot.decline === 'function',
      reject: () => { window.Cookiebot.decline(); return true; },
    },
    {
      name: 'Usercentrics',
      detect: () => typeof window.UC_UI === 'object' && window.UC_UI !== null
        && typeof window.UC_UI.denyAllConsents === 'function',
      reject: () => { window.UC_UI.denyAllConsents(); return true; },
    },
    {
      name: 'Osano',
      detect: () => typeof window.Osano === 'object' && window.Osano !== null
        && window.Osano.cm && typeof window.Osano.cm.denyAll === 'function',
      reject: () => { window.Osano.cm.denyAll(); return true; },
    },
    {
      name: 'Sourcepoint',
      detect: () => typeof window._sp_ === 'object' && window._sp_ !== null
        && window._sp_.gdpr && typeof window._sp_.gdpr.rejectAll === 'function',
      reject: () => { window._sp_.gdpr.rejectAll(); return true; },
    },
    {
      name: 'Klaro',
      detect: () => typeof window.klaro === 'object' && window.klaro !== null
        && typeof window.klaro.getManager === 'function',
      reject: () => {
        const mgr = window.klaro.getManager();
        if (!mgr) return false;
        mgr.changeAll(false);
        mgr.saveAndApplyConsents();
        return true;
      },
    },
  ];

  // Detection-only entries — known CMPs we recognize but don't yet
  // auto-reject. They get logged so the user knows which sites need a
  // handler written.
  const detectOnly = [
    { name: 'TrustArc',  test: () => typeof window.truste === 'object' || !!document.getElementById('truste-consent-track') },
    { name: 'CookieYes', test: () => !!document.querySelector('.cli-bar-container, #cookie-law-info-bar') },
    { name: 'Quantcast', test: () => typeof window.__cmp === 'function' || !!document.querySelector('.qc-cmp2-container') },
    { name: 'TCF v2.2',  test: () => typeof window.__tcfapi === 'function' },
  ];

  // ---------- Main loop ----------
  const tryReject = () => {
    for (const h of handlers) {
      let present;
      try { present = h.detect(); } catch (e) { warn(`${h.name} detect threw`, e); continue; }
      if (!present) continue;
      try {
        const ok = h.reject();
        if (ok) {
          if (dismissedCMP !== h.name) {
            log(`rejected via ${h.name}`);
            dismissedCMP = h.name;
          }
          return true;
        }
      } catch (e) {
        warn(`${h.name} reject threw`, e);
      }
    }
    return false;
  };

  const logDetectOnly = () => {
    for (const d of detectOnly) {
      try {
        if (d.test()) log(`detected ${d.name} (no auto-reject yet — add a handler if this site matters)`);
      } catch (_) { /* noop */ }
    }
  };

  const start = () => {
    if (pollTimer) return;
    log(`active on ${location.hostname}`);

    // Aggressive poll for the first ~10s.
    pollStop = Date.now() + 10000;
    pollTimer = setInterval(() => {
      tryReject();
      if (Date.now() > pollStop) {
        clearInterval(pollTimer);
        pollTimer = null;
        if (!dismissedCMP) logDetectOnly();
      }
    }, 250);

    // Observer runs for the lifetime of the page — catches lazy banners and
    // SPA re-mounts. Cheap because tryReject early-exits when no global matches.
    const attachObserver = () => {
      if (observer || !document.body) return;
      observer = new MutationObserver(() => { tryReject(); });
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) attachObserver();
    else document.addEventListener('DOMContentLoaded', attachObserver, { once: true });
  };

  // Builds a one-shot report for the popup button. Forces handlers to run
  // even if `enabled` is false, so the user can always trigger manually.
  const runOnce = () => {
    const ok = tryReject();
    if (ok) return { status: 'ok', cmp: dismissedCMP };
    const detected = [];
    for (const d of detectOnly) {
      try { if (d.test()) detected.push(d.name); } catch (_) { /* noop */ }
    }
    if (detected.length) return { status: 'detected-no-handler', cmps: detected };
    return { status: 'no-cmp' };
  };

  // ---------- Messages from bridge ----------
  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.source !== 'no-consent') return;

    if (d.type === 'config') {
      debug = !!d.debug;
      if (d.enabled && !enabled) {
        enabled = true;
        start();
      } else if (!d.enabled) {
        enabled = false;
        log(`disabled on ${location.hostname}`);
      }
      return;
    }

    if (d.type === 'reject-now') {
      const result = runOnce();
      window.postMessage(
        { source: 'no-consent', type: 'reject-result', requestId: d.requestId, result },
        location.origin
      );
    }
  });
})();
