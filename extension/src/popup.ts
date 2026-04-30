/**
 * Popup script — controls the popup UI.
 */

const main = document.getElementById('main')!;

interface ProfileResponse {
  fullName?: string;
  email?: string;
  skills?: string[];
  error?: string;
  loginUrl?: string;
}

function render(html: string) {
  main.innerHTML = html;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

async function init() {
  const profile = (await chrome.runtime.sendMessage({ type: 'GET_PROFILE' })) as ProfileResponse;

  if (profile?.error === 'unauthenticated') {
    render(`
      <div class="empty">
        <p>Sign in to Hirin to enable autofill.</p>
        <button id="login">Open Hirin</button>
      </div>
    `);
    document.getElementById('login')!.addEventListener('click', () => {
      chrome.tabs.create({ url: profile.loginUrl ?? 'https://hirin.app/sign-in' });
    });
    return;
  }

  if (profile?.error) {
    render(`<div class="empty"><p>Couldn't load profile: ${escapeHtml(profile.error)}</p></div>`);
    return;
  }

  render(`
    <div>
      <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(profile.fullName ?? '—')}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${escapeHtml(profile.email ?? '—')}</span></div>
      <div class="row"><span class="label">Skills</span><span class="value">${(profile.skills ?? []).slice(0, 3).join(', ') || '—'}</span></div>
    </div>
    <button id="autofill">Autofill this page</button>
    <button id="save" class="secondary">Save this job</button>
    <button id="refresh" class="secondary">Refresh profile</button>
    <div id="status"></div>
  `);

  const status = document.getElementById('status')!;
  document.getElementById('autofill')!.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    status.innerHTML = '';
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'AUTOFILL' });
    status.innerHTML = `<div class="status ${result.filled > 0 ? 'ok' : 'err'}">Filled ${result.filled} of ${result.detected} detected fields</div>`;
  });

  document.getElementById('save')!.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    status.innerHTML = '<div class="status">Saving…</div>';
    const result = await chrome.runtime.sendMessage({
      type: 'SAVE_JOB',
      url: tab.url,
      title: tab.title,
    });
    status.innerHTML = result.ok
      ? `<div class="status ok">${escapeHtml(result.message ?? 'Saved')}</div>`
      : `<div class="status err">${escapeHtml(result.error ?? 'Failed')}</div>`;
  });

  document.getElementById('refresh')!.addEventListener('click', async () => {
    status.innerHTML = '<div class="status">Refreshing…</div>';
    await chrome.runtime.sendMessage({ type: 'GET_PROFILE', force: true });
    init();
  });
}

init();
