/**
 * Salary parser + percentile estimator.
 *
 * No paid APIs. Uses two cheap signals:
 *   1. Parse the job's own salary string into a normalized [min, max] in
 *      USD (with simple heuristics for k/K, $/€/£/₹, hourly→annual).
 *   2. Compare against the distribution of OTHER jobs in our DB with the
 *      same role family + location bucket (Remote vs Onsite). Returns
 *      "you're at the 65th percentile of similar roles".
 *
 * For paid coverage at scale, you'd swap step 2 for Levels.fyi's API
 * (license required) — same shape, just a different data source.
 */

export interface ParsedSalary {
  min: number; // USD per year
  max: number;
  currency: string; // detected
  isHourly: boolean;
}

const CURRENCY_RATES_USD: Record<string, number> = {
  USD: 1,
  CAD: 0.74,
  EUR: 1.08,
  GBP: 1.25,
  INR: 0.012,
  AUD: 0.66,
  SGD: 0.74,
};

export function parseSalary(raw: string | null | undefined): ParsedSalary | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;

  // Detect currency
  let currency = 'USD';
  if (/₹/.test(text) || /\bINR\b/i.test(text) || /\bRs\.?/i.test(text)) currency = 'INR';
  else if (/€/.test(text) || /\bEUR\b/i.test(text)) currency = 'EUR';
  else if (/£/.test(text) || /\bGBP\b/i.test(text)) currency = 'GBP';
  else if (/\bCAD\b/i.test(text) || /\bCA\$/i.test(text)) currency = 'CAD';
  else if (/\bAUD\b/i.test(text) || /\bA\$/i.test(text)) currency = 'AUD';
  else if (/\bSGD\b/i.test(text) || /\bS\$/i.test(text)) currency = 'SGD';

  // Detect "k" / "K" multiplier
  const hasK = /\d+\s*[kK]\b/.test(text);

  // Detect hourly
  const isHourly = /\bper hour\b|\bper hr\b|\bhourly\b|\/h\b|\/hr\b/i.test(text);

  // Extract numbers (ignore commas)
  const matches = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return null;

  const nums = matches.map((n) => parseFloat(n)).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;

  let lo = nums[0];
  let hi = nums.length > 1 ? nums[1] : nums[0];

  // K multiplier
  if (hasK) {
    if (lo < 1000) lo *= 1000;
    if (hi < 1000) hi *= 1000;
  }

  // INR ranges are often "lakhs" (e.g. "12-18 LPA" = 12-18 lakh per annum)
  if (currency === 'INR' && /\bLPA\b|\blakh\b|\blacs?\b/i.test(text)) {
    lo *= 100000;
    hi *= 100000;
  }

  // Hourly → annual
  if (isHourly) {
    lo *= 2080;
    hi *= 2080;
  }

  // Sanity: salaries between 10k and 10M USD (after conversion)
  const rate = CURRENCY_RATES_USD[currency] ?? 1;
  const minUsd = lo * rate;
  const maxUsd = hi * rate;
  if (minUsd < 5000 || maxUsd > 10_000_000) return null;

  return {
    min: Math.round(minUsd),
    max: Math.round(maxUsd),
    currency,
    isHourly,
  };
}

/**
 * Percentile of `value` within sorted `arr`. 0-100.
 */
export function percentile(arr: number[], value: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v <= value) count++;
    else break;
  }
  return Math.round((count / sorted.length) * 100);
}

export function formatSalaryRangeUSD(min: number, max: number): string {
  if (min === max) return `$${(min / 1000).toFixed(0)}k`;
  return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`;
}

/**
 * Detect a coarse role family from a job title for cohort matching.
 * Returns null if we can't classify it.
 */
const ROLE_PATTERNS: Array<[string, RegExp]> = [
  [
    'frontend',
    /\b(front[\s-]?end|react|vue|angular|frontend engineer|ui engineer|web developer)\b/i,
  ],
  ['backend', /\b(back[\s-]?end|backend engineer|api engineer|services engineer|server)\b/i],
  ['fullstack', /\b(full[\s-]?stack|full stack)\b/i],
  ['mobile', /\b(ios|android|mobile|flutter|react native)\b/i],
  ['devops', /\b(devops|sre|site reliability|platform|infrastructure|cloud engineer)\b/i],
  ['data', /\b(data engineer|analytics engineer|etl|warehouse)\b/i],
  ['ml', /\b(machine learning|ml engineer|ai engineer|data scientist|nlp|computer vision)\b/i],
  ['security', /\b(security|infosec|appsec|penetration|red team)\b/i],
  ['design', /\b(designer|ux|ui designer|product designer)\b/i],
  ['pm', /\b(product manager|pm\b|product owner)\b/i],
  ['eng_general', /\b(software engineer|swe|engineer)\b/i],
];

export function detectRoleFamily(title: string): string | null {
  for (const [family, re] of ROLE_PATTERNS) {
    if (re.test(title)) return family;
  }
  return null;
}

export function isRemoteLocation(loc: string | null | undefined): boolean {
  if (!loc) return false;
  return /\bremote\b|\bworld[\s-]?wide\b|\banywhere\b|\bdistributed\b/i.test(loc);
}
