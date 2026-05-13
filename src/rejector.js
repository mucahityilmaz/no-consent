// MAIN-world content script.
//
// Watches for visible consent-preference toggles. When at least one is on,
// shows a floating "Disable all" button. Clicking it flips every visible
// toggle to off — and that is ALL it does. It never opens preferences panels,
// never clicks save/confirm, and never closes the banner. The user verifies
// visually and saves the changes themselves.

(() => {
  if (window.__noConsentLoaded) return;
  window.__noConsentLoaded = true;

  const TAG = '[no-consent]';
  const BTN_ID = 'no-consent-disable-button';

  const log = (...a) => console.log(TAG, ...a);
  const visible = (el) => !!el && el.offsetParent !== null && el.getBoundingClientRect().height > 0;

  // ---------- CMP handlers ----------
  // Each handler:
  //   name       — display name shown in the button
  //   findOn     — returns an array of currently-on toggle elements that we'd flip.
  //                Empty array = no work to do, button stays hidden.
  //   flip       — called with the array from findOn. Must flip each element off.
  //
  // The button appears whenever ANY handler returns a non-empty findOn().
  // Only the highest-priority matching handler is acted on.
  const handlers = [
    {
      // Google Funding Choices (TCF cmpId 300). Prefs panel uses native <input
      // type="checkbox"> elements with class prefix "fc-preference-".
      // Includes purposes, special features, and (in Vendor preferences) vendors.
      name: 'Google Funding Choices',
      findOn: () => Array.from(document.querySelectorAll(
        'input[type="checkbox"][class*="fc-preference"]:checked'
      )).filter(i => {
        // The actual <input> is hidden (opacity:0, 0x0); the visible UI is the
        // .fc-preference-slider parent. Use that for the visibility check.
        const slider = i.closest('.fc-preference-slider') || i.parentElement;
        return visible(slider);
      }),
      flip: (els) => { els.forEach(el => el.click()); },
    },
  ];

  // ---------- button ----------
  let dismissedForThisLoad = false;
  let recentlyClicked = false; // suppresses auto-removal during success display

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
          <span class="label">Disable all</span>
          <span class="count"></span>
        </button>
        <button class="close" type="button" aria-label="Hide for this page">×</button>
      </div>
    `;

    const wrap = shadow.querySelector('.wrap');
    const btn = shadow.querySelector('.btn');
    const label = shadow.querySelector('.label');
    const count = shadow.querySelector('.count');
    const close = shadow.querySelector('.close');

    const setCount = (n) => { count.textContent = `${n} on • ${handler.name}`; };
    setCount(initialCount);
    host.__update = setCount;

    close.addEventListener('click', () => {
      dismissedForThisLoad = true;
      removeButton();
    });

    btn.addEventListener('click', () => {
      btn.disabled = true;
      try {
        const targets = handler.findOn();
        const n = targets.length;
        handler.flip(targets);
        recentlyClicked = true;
        wrap.innerHTML = `<div class="status ok">✓ Disabled ${n} switch${n === 1 ? '' : 'es'}</div>`;
        // Hold the confirmation on screen long enough to read.
        setTimeout(() => {
          recentlyClicked = false;
          // Don't force-remove — the tick will retire the button when
          // findOn() is empty, OR re-show it if the user re-enabled something.
        }, 1800);
      } catch (e) {
        wrap.innerHTML = `<div class="status err">✗ ${String(e).slice(0, 80)}</div>`;
        console.warn(TAG, handler.name, 'flip error', e);
      }
    });

    return host;
  };

  // ---------- main loop ----------
  let currentHandler = null;

  const tick = () => {
    if (dismissedForThisLoad) return;
    if (recentlyClicked) return; // keep the ✓ banner up

    let detected = null;
    let onCount = 0;
    for (const h of handlers) {
      try {
        const on = h.findOn();
        if (on && on.length > 0) { detected = h; onCount = on.length; break; }
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
        // Same handler; just refresh the count.
        existing.__update(onCount);
      }
    } else if (currentHandler) {
      removeButton();
      currentHandler = null;
    }
  };

  const startObserver = () => {
    new MutationObserver(() => tick()).observe(
      document.documentElement,
      { childList: true, subtree: true, attributes: true, attributeFilter: ['checked', 'aria-checked', 'class'] }
    );
    tick();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  } else {
    startObserver();
  }
})();
