// MAIN-world content script - no-consent v0.4.3
//
// Watches for visible consent-preference toggles. When at least one is on,
// shows a floating "Disable all" button. Clicking it flips every "on" toggle
// to off across the entire consent flow (visible view + any sub-views like
// vendor preferences) - and ends back where the user started. It never
// closes the banner, never clicks save/confirm. The user verifies visually
// and saves the changes themselves.

(() => {
  if (window.__noConsentLoaded) return;
  window.__noConsentLoaded = true;

  const TAG = '[no-consent]';
  const BTN_ID = 'no-consent-disable-button';

  const TRANSLATIONS = {
    en: {
      disableAll: 'Disable all',
      working:    'Working\u2026',
      disabled:   (n) => `\u2713 Disabled ${n} switch${n === 1 ? '' : 'es'}`,
      error:      (msg) => `\u2717 ${msg}`,
      hideLabel:  'Hide for this page',
      onCount:    (n) => `(${n})`,
    },
    tr: {
      disableAll: 'T\u00fcm\u00fcn\u00fc kapat',
      working:    '\u0130\u015fleniyor\u2026',
      disabled:   (n) => `\u2713 ${n} ge\u00e7i\u015f kapat\u0131ld\u0131`,
      error:      (msg) => `\u2717 ${msg}`,
      hideLabel:  'Bu sayfa i\u00e7in gizle',
      onCount:    (n) => `(${n})`,
    },
  };
  const t = TRANSLATIONS[(navigator.language || '').split('-')[0].toLowerCase()] ?? TRANSLATIONS.en;

  const log = (...a) => console.log(TAG, ...a);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const visible = (el) => !!el && el.offsetParent !== null && el.getBoundingClientRect().height > 0;
  const waitFor = async (pred, timeout = 2000, step = 40) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try { if (pred()) return true; } catch (_) { /* keep trying */ }
      await wait(step);
    }
    return false;
  };

  // Generic visible-on finder used by Google FC handler in both its current
  // view and sub-views. <input> is opacity:0 - visibility lives on the parent
  // .fc-preference-slider.
  const fcVisibleOn = () => Array.from(
    document.querySelectorAll('input[type="checkbox"][class*="fc-preference"]:checked')
  ).filter(i => visible(i.closest('.fc-preference-slider') || i.parentElement));

  // Total on-toggles across all FC views (including hidden sub-views in the DOM).
  // Used for the button label so the count matches what flip() will actually flip.
  const fcTotalOn = () =>
    document.querySelectorAll('input[type="checkbox"][class*="fc-preference"]:checked').length;

  // ---------- CMP handlers ----------
  // Each handler:
  //   findOn   - currently-on, visible toggle elements in the current view
  //              (decides whether to show the button)
  //   countAll - total on-toggles across all views; shown in the button label
  //   flip     - async; flips every reachable on-toggle (visiting sub-views as
  //              needed) and returns the total count flipped
  const handlers = [
    {
      name: 'Google Funding Choices',

      findOn: fcVisibleOn,
      countAll: fcTotalOn,

      flip: async () => {
        // Flip whatever is visible RIGHT NOW.
        const flipVisible = () => {
          const els = fcVisibleOn();
          els.forEach(el => el.click());
          return els.length;
        };

        const inMainView   = () => visible(document.querySelector('.fc-confirm-choices'));
        const inVendorView = () => visible(document.querySelector('.fc-vendor-preferences-back'));

        // Note the user's starting view so we can land back on it.
        const startedInMain   = inMainView();
        const startedInVendor = inVendorView();

        let total = flipVisible();

        // If we're on the main panel, visit Vendor preferences too.
        if (startedInMain) {
          const vendorsLink = document.querySelector('.fc-manage-vendors');
          if (vendorsLink && visible(vendorsLink)) {
            vendorsLink.click();
            if (await waitFor(inVendorView, 2000)) {
              await wait(120); // let toggles paint
              total += flipVisible();
              await wait(120);
              const back = document.querySelector('.fc-vendor-preferences-back');
              if (back) {
                back.click();
                await waitFor(inMainView, 2000);
              }
            }
          }
        }

        // If we entered from vendor view, also hit the main panel and come back.
        if (startedInVendor) {
          const back = document.querySelector('.fc-vendor-preferences-back');
          if (back) {
            back.click();
            if (await waitFor(inMainView, 2000)) {
              await wait(120);
              total += flipVisible();
              await wait(120);
              const vendorsLink = document.querySelector('.fc-manage-vendors');
              if (vendorsLink && visible(vendorsLink)) {
                vendorsLink.click();
                await waitFor(inVendorView, 2000);
              }
            }
          }
        }

        return total;
      },
    },
  ];

  // ---------- button ----------
  let dismissedForThisLoad = false;
  // While the click handler is mid-flight (or showing the success message),
  // the tick must not redraw the button on top of itself.
  let suppressTickUntil = 0;
  let currentHandler = null;

  const removeButton = () => {
    const el = document.getElementById(BTN_ID);
    if (el) el.remove();
  };

  const buildButton = (handler, initialCount) => {
    const host = document.createElement('div');
    host.id = BTN_ID;
    host.style.cssText = [
      'all: initial',
      'position: fixed',
      'top: 12px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 2147483647',
      'pointer-events: auto',
    ].join('; ');

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
        .count { opacity: 0.72; font-weight: 400; font-size: 11px; }
        .close { background: transparent; color: #8a909a; padding: 0 12px;
          border-left: 1px solid #2d3138; font-size: 13px; }
        .close:hover { color: #fff; }
        .status { padding: 9px 14px; display: flex; align-items: center; gap: 8px; }
        .status.ok  { background: #16331f; color: #4ade80; }
        .status.err { background: #3a1d1d; color: #f87171; }
      </style>
      <div class="wrap">
        <button class="btn" type="button">
          <span class="label">${t.disableAll}</span>
          <span class="count"></span>
        </button>
        <button class="close" type="button" aria-label="${t.hideLabel}">\xd7</button>
      </div>
    `;

    const wrap = shadow.querySelector('.wrap');
    const btn = shadow.querySelector('.btn');
    const label = shadow.querySelector('.label');
    const count = shadow.querySelector('.count');
    const close = shadow.querySelector('.close');

    const setCount = (n) => { count.textContent = t.onCount(n); };
    setCount(initialCount);
    host.__update = setCount;

    close.addEventListener('click', () => {
      dismissedForThisLoad = true;
      removeButton();
    });

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      label.textContent = t.working;
      count.textContent = '';
      // Block tick from rebuilding the button while we navigate sub-views.
      suppressTickUntil = Date.now() + 10_000;

      try {
        const n = await handler.flip();
        const ok = document.createElement('div');
        ok.className = 'status ok';
        ok.textContent = t.disabled(n);
        wrap.replaceChildren(ok);
        // Hold the success message for ~1.5s, then let tick decide what to
        // do - retire the button (no on-toggles) or rebuild it (user already
        // re-enabled something / navigated to a view with on-toggles).
        suppressTickUntil = Date.now() + 1500;
        setTimeout(() => {
          suppressTickUntil = 0;
          currentHandler = null; // force buildButton on next tick if needed
          tick();
        }, 1500);
      } catch (e) {
        const err = document.createElement('div');
        err.className = 'status err';
        err.textContent = t.error(String(e).slice(0, 80));
        wrap.replaceChildren(err);
        console.warn(TAG, handler.name, 'flip error', e);
        suppressTickUntil = 0;
      }
    });

    return host;
  };

  // ---------- main loop ----------
  const tick = () => {
    if (dismissedForThisLoad) return;
    if (Date.now() < suppressTickUntil) return;

    let detected = null;
    let onCount = 0;
    for (const h of handlers) {
      try {
        const on = h.findOn();
        if (on && on.length > 0) { detected = h; onCount = h.countAll ? h.countAll() : on.length; break; }
      } catch (_) { /* skip */ }
    }

    if (detected) {
      const existing = document.getElementById(BTN_ID);
      if (currentHandler !== detected || !existing) {
        currentHandler = detected;
        removeButton();
        const node = buildButton(detected, onCount);
        (document.body || document.documentElement).appendChild(node);
        log(`${detected.name}: ${onCount} switch${onCount === 1 ? '' : 'es'} on`);
      } else if (existing.__update) {
        existing.__update(onCount);
      }
    } else {
      // No handler is active. Make sure no leftover button (e.g. from a
      // previous success state, or an existing CMP that just closed) lingers.
      if (document.getElementById(BTN_ID)) removeButton();
      currentHandler = null;
    }
  };

  // Polling beats MutationObserver here because the `checked` property of an
  // <input type="checkbox"> doesn't fire attribute mutations when the user
  // clicks it - so we'd miss state changes. 500ms is cheap and snappy enough
  // for a single querySelectorAll per tick.
  const start = () => {
    tick();
    setInterval(tick, 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
