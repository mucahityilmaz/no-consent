// MAIN-world content script.
//
// Watches for known cookie-consent banners. When one is visible, injects a
// floating "Reject all consent" button at the top of the page. Clicking it
// runs the CMP-specific rejection (including legitimate-interest toggles)
// and the banner closes.
//
// No auto-reject: nothing happens until the user clicks the injected button.
// No popup, no settings — just the button when a banner is on screen.

(() => {
  if (window.__noConsentLoaded) return;
  window.__noConsentLoaded = true;

  const TAG = '[no-consent]';
  const BTN_ID = 'no-consent-reject-button';

  const log = (...a) => console.log(TAG, ...a);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const visible = (el) => !!el && el.offsetParent !== null && el.getBoundingClientRect().height > 0;

  const waitFor = async (predicate, timeout = 2000, step = 50) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try { if (predicate()) return true; } catch (_) { /* keep trying */ }
      await wait(step);
    }
    return false;
  };

  // ---------- CMP handlers ----------
  // Each handler:
  //   name       — display name shown in the button
  //   isVisible  — true if this CMP's consent UI is currently being shown
  //   reject     — async, returns true when the user-visible state is rejected
  //
  // Order matters: more specific handlers first.
  const handlers = [
    {
      // Google Funding Choices (TCF CMP ID 300). No "Reject all" button in
      // their UI — only "Consent" and "Manage options". This handler opens
      // the prefs panel, unchecks every consent/LI/special-feature toggle,
      // then clicks "Confirm choices".
      name: 'Google Funding Choices',
      isVisible: () => visible(document.querySelector('.fc-cta-consent, .fc-confirm-choices')),
      reject: async () => {
        // Step 1: if we're on the initial banner (no prefs panel yet), open
        // "Manage options" to expose the toggles.
        if (!document.querySelector('.fc-confirm-choices')) {
          const manage = document.querySelector('.fc-cta-manage-options');
          if (!manage) return false;
          manage.click();
          const opened = await waitFor(() => !!document.querySelector('.fc-confirm-choices'), 2000);
          if (!opened) return false;
        }
        // Step 2: uncheck every purpose consent, purpose LI, special-feature
        // consent. (Purpose LI is what Google FC leaves ON by default — the
        // whole point of this handler.)
        const inputs = document.querySelectorAll(
          'input.fc-preference-consent.purpose, ' +
          'input.fc-preference-legitimate-interest.purpose, ' +
          'input.fc-preference-consent.special-feature'
        );
        inputs.forEach(i => { if (i.checked) i.click(); });
        // Step 3: save.
        const confirm = document.querySelector('.fc-confirm-choices');
        if (!confirm) return false;
        confirm.click();
        return true;
      },
    },
    {
      name: 'Didomi',
      isVisible: () => {
        try {
          if (typeof window.Didomi?.notice?.isVisible === 'function') {
            return !!window.Didomi.notice.isVisible();
          }
        } catch (_) { /* fall through */ }
        return visible(document.querySelector('#didomi-popup, #didomi-notice'));
      },
      reject: () => { window.Didomi.setUserDisagreeToAll(); return true; },
    },
    {
      name: 'OneTrust',
      isVisible: () => visible(document.querySelector('#onetrust-banner-sdk, #onetrust-pc-sdk')),
      reject: () => {
        if (typeof window.OneTrust?.RejectAll === 'function') {
          window.OneTrust.RejectAll();
          return true;
        }
        const btn = document.querySelector('#onetrust-reject-all-handler');
        if (btn) { btn.click(); return true; }
        return false;
      },
    },
    {
      name: 'Cookiebot',
      isVisible: () => visible(document.querySelector('#CybotCookiebotDialog')),
      reject: () => { window.Cookiebot.decline(); return true; },
    },
    {
      name: 'Usercentrics',
      isVisible: () => !!document.querySelector('#usercentrics-root, [data-testid="uc-default-banner"]')
        && typeof window.UC_UI?.isInitialized === 'function' && window.UC_UI.isInitialized(),
      reject: () => { window.UC_UI.denyAllConsents(); return true; },
    },
    {
      name: 'Osano',
      isVisible: () => visible(document.querySelector('.osano-cm-window, .osano-cm-dialog')),
      reject: () => { window.Osano.cm.denyAll(); return true; },
    },
    {
      name: 'Sourcepoint',
      isVisible: () => visible(document.querySelector('.sp_message_container, [id^="sp_message_container"]')),
      reject: () => { window._sp_.gdpr.rejectAll(); return true; },
    },
    {
      name: 'Klaro',
      isVisible: () => visible(document.querySelector('.klaro .cookie-notice, .klaro .cm-modal')),
      reject: () => {
        const mgr = window.klaro.getManager();
        mgr.changeAll(false);
        mgr.saveAndApplyConsents();
        return true;
      },
    },
  ];

  // ---------- button ----------
  let dismissedForThisLoad = false;

  const removeButton = () => {
    const el = document.getElementById(BTN_ID);
    if (el) el.remove();
  };

  const buildButton = (handler) => {
    const host = document.createElement('div');
    host.id = BTN_ID;
    // Outer host: positioning + max z-index so we beat the banner's overlay.
    host.style.cssText = [
      'all: initial',
      'position: fixed',
      'top: 12px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 2147483647',
      'pointer-events: auto',
    ].join('; ');

    // Shadow DOM keeps host-page CSS from leaking in. Mode is 'open' so it's
    // inspectable from DevTools; closed mode isn't meaningful security here.
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap {
          display: inline-flex; align-items: stretch;
          font: 13px/1.2 -apple-system, "SF Pro Text", system-ui, sans-serif;
          color: #fff; border-radius: 8px; overflow: hidden;
          background: #1c1f26; border: 1px solid #2d3138;
          box-shadow: 0 6px 20px rgba(0,0,0,0.45);
        }
        button { font: inherit; color: inherit; border: 0; cursor: pointer; }
        .btn {
          background: #4f8cff; color: #fff; padding: 9px 14px;
          font-weight: 600; display: flex; align-items: center; gap: 10px;
        }
        .btn:hover  { background: #6a9eff; }
        .btn:active { background: #4378d8; }
        .btn:disabled { background: #2a2e36; color: #8a909a; cursor: default; }
        .cmp  { opacity: 0.72; font-weight: 400; font-size: 11px; }
        .close { background: transparent; color: #8a909a; padding: 0 12px;
          border-left: 1px solid #2d3138; font-size: 13px; }
        .close:hover { color: #fff; }
        .status { padding: 9px 14px; display: flex; align-items: center; gap: 8px; }
        .status.ok  { background: #16331f; color: #4ade80; }
        .status.err { background: #3a1d1d; color: #f87171; }
      </style>
      <div class="wrap" part="wrap">
        <button class="btn" type="button">
          <span class="label">Reject all consent</span>
          <span class="cmp"></span>
        </button>
        <button class="close" type="button" aria-label="Hide for this page">×</button>
      </div>
    `;

    const wrap = shadow.querySelector('.wrap');
    const btn = shadow.querySelector('.btn');
    const label = shadow.querySelector('.label');
    const cmp = shadow.querySelector('.cmp');
    const close = shadow.querySelector('.close');

    cmp.textContent = handler.name;

    close.addEventListener('click', () => {
      dismissedForThisLoad = true;
      removeButton();
    });

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      label.textContent = 'Working…';
      try {
        const ok = await Promise.resolve(handler.reject());
        if (ok) {
          wrap.innerHTML = `<div class="status ok">✓ Rejected via ${handler.name}</div>`;
          // Banner will disappear from the page; pull the button after a short
          // celebration so the user actually sees the confirmation.
          setTimeout(() => removeButton(), 2200);
        } else {
          wrap.innerHTML = `<div class="status err">✗ Reject failed (${handler.name})</div>`;
        }
      } catch (e) {
        wrap.innerHTML = `<div class="status err">✗ ${String(e).slice(0, 80)}</div>`;
        console.warn(TAG, handler.name, 'reject error', e);
      }
    });

    return host;
  };

  // ---------- main loop ----------
  let currentHandler = null;

  const tick = () => {
    if (dismissedForThisLoad) return;

    let detected = null;
    for (const h of handlers) {
      try { if (h.isVisible()) { detected = h; break; } } catch (_) { /* skip */ }
    }

    if (detected) {
      // Update button only when the active CMP changes — avoids replacing the
      // button on every observer tick.
      if (currentHandler !== detected || !document.getElementById(BTN_ID)) {
        currentHandler = detected;
        removeButton();
        const node = buildButton(detected);
        (document.body || document.documentElement).appendChild(node);
        log(`detected ${detected.name} banner — button injected`);
      }
    } else if (currentHandler) {
      removeButton();
      currentHandler = null;
    }
  };

  const startObserver = () => {
    new MutationObserver(() => tick()).observe(
      document.documentElement,
      { childList: true, subtree: true }
    );
    tick();
  };

  // Poll briefly during early page life — some CMPs lazy-mount, and the
  // observer alone can miss a banner that appears synchronously while we're
  // still setting up.
  const startPoll = () => {
    let count = 0;
    const id = setInterval(() => {
      tick();
      if (++count > 40) clearInterval(id); // ~10s @ 250ms
    }, 250);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { startObserver(); startPoll(); }, { once: true });
  } else {
    startObserver();
    startPoll();
  }
})();
