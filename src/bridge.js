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
})();
