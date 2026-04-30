/**
 * Background service worker.
 * - Persists Hirin profile fetched from API
 * - Routes messages from popup ↔ content script
 * - Handles auth token storage (Clerk session via cookie)
 */

const API_BASE_KEY = 'hirin_api_base';
const PROFILE_KEY = 'hirin_profile';
const PROFILE_FETCHED_AT_KEY = 'hirin_profile_fetched_at';
const PROFILE_TTL_MS = 1000 * 60 * 30; // 30 min

const DEFAULT_API_BASE = 'https://hirin.app';

async function getApiBase(): Promise<string> {
  const data = await chrome.storage.local.get(API_BASE_KEY);
  return data[API_BASE_KEY] ?? DEFAULT_API_BASE;
}

async function fetchProfile(force = false) {
  const cached = await chrome.storage.local.get([PROFILE_KEY, PROFILE_FETCHED_AT_KEY]);
  const fetchedAt = cached[PROFILE_FETCHED_AT_KEY] as number | undefined;

  if (!force && cached[PROFILE_KEY] && fetchedAt && Date.now() - fetchedAt < PROFILE_TTL_MS) {
    return cached[PROFILE_KEY];
  }

  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/api/extension/profile`, {
      credentials: 'include', // sends Clerk session cookie
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { error: 'unauthenticated', loginUrl: `${apiBase}/sign-in` };
      }
      return { error: `Failed to load profile (${res.status})` };
    }

    const profile = await res.json();
    await chrome.storage.local.set({
      [PROFILE_KEY]: profile,
      [PROFILE_FETCHED_AT_KEY]: Date.now(),
    });
    return profile;
  } catch {
    // Probably offline — return cached if available
    return cached[PROFILE_KEY] ?? { error: 'offline' };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'GET_PROFILE') {
    fetchProfile(msg.force).then(sendResponse);
    return true; // async
  }
  if (msg?.type === 'SAVE_JOB') {
    saveJob(msg.url, msg.title).then(sendResponse);
    return true;
  }
  return false;
});

async function saveJob(url: string, title?: string) {
  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/api/jobs/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    return { ok: res.ok, ...data, sentTitle: title };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
