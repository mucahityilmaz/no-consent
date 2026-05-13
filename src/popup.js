// Popup: per-site on/off toggle. State lives in chrome.storage.local
// under `disabledHosts` — a list of hostnames where the rejector should NOT run.

const $host = document.getElementById('host');
const $enabled = document.getElementById('enabled');
const $status = document.getElementById('status');

const HOSTLESS = new Set(['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:']);

async function activeHost() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return null;
  let url;
  try { url = new URL(tab.url); } catch { return null; }
  if (HOSTLESS.has(url.protocol)) return null;
  return url.hostname;
}

async function init() {
  const host = await activeHost();
  if (!host) {
    $host.textContent = '—';
    $enabled.disabled = true;
    $status.textContent = 'Not applicable on this page.';
    return;
  }
  $host.textContent = host;

  const { disabledHosts = [] } = await chrome.storage.local.get('disabledHosts');
  $enabled.checked = !disabledHosts.includes(host);

  $enabled.addEventListener('change', async () => {
    const { disabledHosts: current = [] } = await chrome.storage.local.get('disabledHosts');
    const set = new Set(current);
    if ($enabled.checked) set.delete(host);
    else set.add(host);
    await chrome.storage.local.set({ disabledHosts: Array.from(set) });
    $status.textContent = 'Saved. Reload the page.';
  });
}

init();
