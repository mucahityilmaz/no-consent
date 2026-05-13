const $host    = document.getElementById('host');
const $reject  = document.getElementById('reject');
const $status  = document.getElementById('status');
const $enabled = document.getElementById('enabled');

const HOSTLESS = new Set(['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'file:']);

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return { tab: null, host: null };
  let url;
  try { url = new URL(tab.url); } catch { return { tab, host: null }; }
  if (HOSTLESS.has(url.protocol)) return { tab, host: null };
  return { tab, host: url.hostname };
}

function setStatus(kind, text) {
  $status.className = `status show ${kind}`;
  $status.textContent = text;
}

function renderResult(result) {
  if (!result) {
    setStatus('err', 'No response from page. Try reloading the tab.');
    return;
  }
  switch (result.status) {
    case 'ok':
      setStatus('ok', `Rejected via ${result.cmp}.`);
      break;
    case 'detected-no-handler':
      setStatus('warn', `Detected ${result.cmps.join(', ')} but no handler yet.`);
      break;
    case 'no-cmp':
      setStatus('warn', 'No supported consent banner found on this page.');
      break;
    case 'timeout':
      setStatus('err', 'No response from page. Reload the tab and try again.');
      break;
    default:
      setStatus('err', `Unknown response: ${JSON.stringify(result)}`);
  }
}

async function init() {
  const { tab, host } = await activeTab();

  if (!host || !tab) {
    $host.textContent = '—';
    $reject.disabled = true;
    $enabled.disabled = true;
    setStatus('warn', 'Not applicable on this page.');
    return;
  }

  $host.textContent = host;

  const { disabledHosts = [] } = await chrome.storage.local.get('disabledHosts');
  $enabled.checked = !disabledHosts.includes(host);

  $enabled.addEventListener('change', async () => {
    const { disabledHosts: current = [] } = await chrome.storage.local.get('disabledHosts');
    const next = new Set(current);
    if ($enabled.checked) next.delete(host);
    else next.add(host);
    await chrome.storage.local.set({ disabledHosts: Array.from(next) });
  });

  $reject.addEventListener('click', async () => {
    $reject.disabled = true;
    setStatus('warn', 'Working…');
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'reject-now' });
      renderResult(result);
    } catch (e) {
      // sendMessage rejects when no content script is loaded (e.g. chrome://,
      // PDF viewer, or page loaded before the extension was installed).
      setStatus('err', 'Content script not loaded. Reload the tab and try again.');
    } finally {
      $reject.disabled = false;
    }
  });
}

init();
