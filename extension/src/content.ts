/**
 * Content script — injected on supported job pages.
 *
 * Two responsibilities:
 *   1. Detect application form fields and offer to autofill them.
 *   2. Detect "this is a job posting" and offer to save the job to Hirin.
 *
 * The autofill is intentionally OPT-IN per page: we inject a small
 * floating action button rather than auto-filling without consent.
 */

import type { HirinProfile, AutofillResult } from './types';

interface FieldMatch {
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  fieldKey: keyof HirinProfile;
  confidence: number;
}

// Heuristic field matchers. Order matters — first match wins.
const FIELD_PATTERNS: Array<{
  regex: RegExp;
  key: keyof HirinProfile;
  attrs?: string[];
}> = [
  {
    regex: /full[\s_-]?name|your name|name\b/i,
    key: 'fullName',
    attrs: ['name', 'id', 'placeholder', 'aria-label', 'label'],
  },
  { regex: /first[\s_-]?name/i, key: 'fullName' },
  { regex: /email/i, key: 'email' },
  { regex: /phone|tel\b|mobile/i, key: 'phone' },
  { regex: /linkedin/i, key: 'linkedinUrl' },
  { regex: /github/i, key: 'githubUrl' },
  { regex: /portfolio|website|personal site/i, key: 'portfolioUrl' },
  { regex: /resume|cv\b/i, key: 'resumeUrl' },
  { regex: /years[\s_-]?of[\s_-]?experience|yoe/i, key: 'yearsOfExperience' },
  {
    regex: /desired[\s_-]?salary|salary[\s_-]?expectation|expected[\s_-]?compensation/i,
    key: 'desiredSalary',
  },
  { regex: /authorized[\s_-]?to[\s_-]?work|work[\s_-]?authorization/i, key: 'authorizedToWork' },
  { regex: /race|ethnicity/i, key: 'raceEthnicity' },
  { regex: /gender/i, key: 'gender' },
  { regex: /veteran/i, key: 'veteran' as keyof HirinProfile },
];

function getFieldText(el: HTMLElement): string {
  const parts: string[] = [];
  parts.push(el.getAttribute('name') ?? '');
  parts.push(el.getAttribute('id') ?? '');
  parts.push(el.getAttribute('placeholder') ?? '');
  parts.push(el.getAttribute('aria-label') ?? '');
  // Look for an associated label
  const id = el.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) parts.push(label.textContent ?? '');
  }
  // Walk up looking for a containing label
  let parent = el.parentElement;
  let hops = 0;
  while (parent && hops < 3) {
    if (parent.tagName === 'LABEL') {
      parts.push(parent.textContent ?? '');
      break;
    }
    parent = parent.parentElement;
    hops++;
  }
  return parts.filter(Boolean).join(' ');
}

function scanForm(): FieldMatch[] {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea'
    )
  );
  const matches: FieldMatch[] = [];
  for (const el of inputs) {
    if ((el as HTMLInputElement).type === 'password') continue;
    const text = getFieldText(el).toLowerCase();
    for (const pattern of FIELD_PATTERNS) {
      if (pattern.regex.test(text)) {
        matches.push({ el, fieldKey: pattern.key, confidence: 0.85 });
        break;
      }
    }
  }
  return matches;
}

function fillField(match: FieldMatch, profile: HirinProfile): boolean {
  const value = profile[match.fieldKey];
  if (value === undefined || value === null || value === '') return false;
  const stringValue = Array.isArray(value) ? value.join(', ') : String(value);

  const el = match.el;

  // Set value via native setter to bypass React's controlled-input guards
  const setter = Object.getOwnPropertyDescriptor(
    el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    'value'
  )?.set;

  if (setter) {
    setter.call(el, stringValue);
  } else {
    el.value = stringValue;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

async function autofill(): Promise<AutofillResult> {
  const profile = await chrome.runtime.sendMessage({ type: 'GET_PROFILE' });
  if (profile?.error) {
    return { detected: 0, filled: 0, fields: [{ name: 'error', value: profile.error, ok: false }] };
  }

  const matches = scanForm();
  const fields: AutofillResult['fields'] = [];
  let filled = 0;
  for (const m of matches) {
    const ok = fillField(m, profile);
    if (ok) filled++;
    fields.push({
      name: String(m.fieldKey),
      value: String(profile[m.fieldKey] ?? ''),
      ok,
    });
  }
  return { detected: matches.length, filled, fields };
}

// ---- Floating action button ----
function injectFab() {
  if (document.getElementById('hirin-fab')) return;
  const fab = document.createElement('div');
  fab.id = 'hirin-fab';
  fab.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #000;
    color: #fff;
    border-radius: 999px;
    padding: 10px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
  `;
  fab.innerHTML = `<span style="background:#0ea5e9;width:8px;height:8px;border-radius:8px;display:inline-block"></span> Hirin: Autofill`;
  fab.addEventListener('click', async () => {
    fab.textContent = 'Filling…';
    const result = await autofill();
    fab.textContent =
      result.filled > 0 ? `✓ Filled ${result.filled}/${result.detected}` : 'No fields detected';
    setTimeout(() => {
      fab.innerHTML = `<span style="background:#0ea5e9;width:8px;height:8px;border-radius:8px;display:inline-block"></span> Hirin: Autofill`;
    }, 3000);
  });
  document.body.appendChild(fab);
}

// Inject after page settles
window.addEventListener('load', () => setTimeout(injectFab, 1500));

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'AUTOFILL') {
    autofill().then(sendResponse);
    return true;
  }
  return false;
});
