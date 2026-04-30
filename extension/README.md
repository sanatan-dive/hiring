# Hirin' Browser Extension

Manifest v3 Chrome/Edge extension. Two features:

1. **Autofill application forms** with your Hirin profile data (name, email, phone, LinkedIn, GitHub, salary expectations, etc).
2. **Save jobs while you browse** — a "Save this job" button in the popup pings Hirin's `/api/jobs/scrape` to add the current page to your matches.

A floating "Hirin: Autofill" button injects on supported domains (LinkedIn, Greenhouse, Lever, Ashby, Workday, Wellfound).

## Build

```bash
cd extension
npm install
npm run build           # creates dist/
# OR
npm run watch           # for live development
```

Then in Chrome: `chrome://extensions` → enable Developer mode → "Load unpacked" → select `extension/dist/`.

## Architecture

```
extension/
├── public/
│   ├── manifest.json       # MV3 config
│   ├── popup.html          # Popup UI
│   └── icons/              # 16/32/48/128 PNGs (you create these)
├── src/
│   ├── background.ts       # Service worker — fetches profile, routes messages
│   ├── content.ts          # Injected on job pages — scans form, autofills
│   ├── popup.ts            # Popup logic
│   └── types.ts            # Shared types
├── build.mjs               # esbuild bundler (compiles TS → dist/*.js)
└── package.json
```

## API contract with Hirin

The extension talks to two endpoints:

- `GET /api/extension/profile` (auth via Clerk session cookie) →
  ```json
  { "fullName": "...", "email": "...", "linkedinUrl": "...", "skills": ["..."], ... }
  ```
- `POST /api/jobs/scrape` body `{ "url": "..." }` — same as the in-app paste-URL flow.

The `host_permissions` in `manifest.json` allow the extension to send the user's Clerk session cookie when calling the API. Make sure `hirin.app` (and `localhost:3000` for dev) are listed.

## Form-detection heuristic

`content.ts` walks every `input/select/textarea` on the page and checks the field's `name`/`id`/`placeholder`/`aria-label`/`<label>` text against a list of regex patterns (e.g. `/email/i` → `email`, `/linkedin/i` → `linkedinUrl`). First match wins. Confidence is hard-coded at 0.85 for now — future improvement: use a tiny model or per-domain selectors.

The fill uses the native `value` setter via `Object.getOwnPropertyDescriptor` so it works with React-controlled inputs (Greenhouse uses React).

## Privacy

- Profile data is cached locally for 30 minutes; cleared on logout
- Race/ethnicity/gender/veteran fields are NEVER auto-detected — user must explicitly enable in `/profile` (these fields are typically optional and user-controlled)
- No analytics, no tracking, no ad code
- No domains other than `hirin.app` (and dev `localhost`) are contacted

## Publishing checklist (Chrome Web Store)

- [ ] Generate 4 icon sizes (16, 32, 48, 128 px PNG)
- [ ] Register a developer account at chromewebstore.google.com ($5 one-time fee)
- [ ] Write a Privacy Policy URL — link to `https://hirin.app/privacy` (already exists)
- [ ] Take 4-5 screenshots (1280×800 or 640×400)
- [ ] Set permissions justification — "host_permissions for hirin.app needed to authenticate"
- [ ] Submit for review (typically 1-3 business days)

## Roadmap

- v0.2 — auto-detect "Apply" buttons on LinkedIn/Greenhouse and offer one-click apply
- v0.3 — keyboard shortcut (Cmd+Shift+H) to autofill without opening popup
- v0.4 — site-specific selector packs for common ATS (Greenhouse, Lever, Workday) for >95% fill accuracy
- v1.0 — Firefox port (manifest v3-compatible)
