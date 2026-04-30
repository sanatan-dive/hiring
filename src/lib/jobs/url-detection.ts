/**
 * Detect what kind of job URL the user pasted.
 * Determines which scraper / source to route to.
 */

export type JobUrlSource =
  | 'linkedin'
  | 'indeed'
  | 'wellfound'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'ashby'
  | 'unknown';

export interface DetectedJobUrl {
  source: JobUrlSource;
  url: string;
  isSupported: boolean;
}

const PATTERNS: Array<[JobUrlSource, RegExp, boolean]> = [
  ['linkedin', /^https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/\d+/i, true],
  ['indeed', /^https?:\/\/(www\.)?indeed\.com\/(viewjob|cmp\/[\w-]+\/jobs)/i, false], // walled
  ['wellfound', /^https?:\/\/(www\.)?wellfound\.com\/jobs\/\d+/i, true],
  ['greenhouse', /^https?:\/\/boards\.greenhouse\.io\/[\w-]+\/jobs\/\d+/i, true],
  ['lever', /^https?:\/\/jobs\.lever\.co\/[\w-]+\/[\w-]+/i, true],
  ['workday', /^https?:\/\/[\w-]+\.wd\d*\.myworkdayjobs\.com\//i, false], // SPA, hard
  ['ashby', /^https?:\/\/jobs\.ashbyhq\.com\/[\w-]+\/[\w-]+/i, true],
];

export function detectJobUrl(input: string): DetectedJobUrl | null {
  const url = input.trim();
  if (!url) return null;
  // Reject anything that's not http(s)
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
  } catch {
    return null;
  }

  for (const [source, re, supported] of PATTERNS) {
    if (re.test(url)) {
      return { source, url: url.split('?')[0], isSupported: supported };
    }
  }
  return { source: 'unknown', url, isSupported: false };
}

/**
 * Parse a textarea full of newline-separated URLs into an array of detected
 * job URLs. Empty lines and obvious non-URLs are skipped.
 */
export function parseBulkUrls(text: string): {
  detected: DetectedJobUrl[];
  invalid: string[];
} {
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const detected: DetectedJobUrl[] = [];
  const invalid: string[] = [];

  for (const line of lines) {
    const d = detectJobUrl(line);
    if (d) {
      detected.push(d);
    } else {
      invalid.push(line);
    }
  }
  return { detected, invalid };
}
