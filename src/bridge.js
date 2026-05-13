// ISOLATED-world content script.
// Reads per-site enable flag from chrome.storage (which MAIN world cannot reach)
// and hands it to the rejector via window.postMessage.

(async () => {
  const host = location.hostname;

  const send = (cfg) => {
    window.postMessage(
      { source: 'no-consent', type: 'config', ...cfg },
      location.origin
    );
  };

  const load = async () => {
    const { disabledHosts = [], debug = false } =
      await chrome.storage.local.get(['disabledHosts', 'debug']);
    send({ enabled: !disabledHosts.includes(host), debug });
  };

  await load();

  // Re-push config when toggled from the popup. The rejector decides whether
  // to act on it — most CMPs latch their banner, so a reload is usually needed.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.disabledHosts || changes.debug) load();
  });

  // Popup button → ISOLATED bridge → MAIN rejector → reply chain.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== 'reject-now') return;
    const requestId = String(Math.random()).slice(2);
    let resolved = false;

    const onReply = (ev) => {
      if (ev.source !== window) return;
      const d = ev.data;
      if (!d || d.source !== 'no-consent' || d.type !== 'reject-result') return;
      if (d.requestId !== requestId) return;
      if (resolved) return;
      resolved = true;
      window.removeEventListener('message', onReply);
      sendResponse(d.result);
    };
    window.addEventListener('message', onReply);
    window.postMessage(
      { source: 'no-consent', type: 'reject-now', requestId },
      location.origin
    );

    // Safety net: MAIN script could be slow to load on very fresh tabs.
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('message', onReply);
      sendResponse({ status: 'timeout' });
    }, 1500);

    return true; // keep the message channel open for the async sendResponse
  });
})();
