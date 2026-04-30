/**
 * Returns true if the current UTC hour matches the user's local 9am send slot.
 * E.g. user in "America/New_York" → their 09:00 = 13:00 UTC (or 14:00 in winter).
 *
 * The cron runs hourly (vercel.json was updated to "0 * * * *" for digest).
 * For each user we check if NOW in their tz is 09:00 (±0).
 */
export function isUserDigestHour(timezone: string | null | undefined, now = new Date()): boolean {
  const tz = timezone || 'UTC';
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(fmt.format(now), 10);
    return hour === 9;
  } catch {
    // Bad timezone string — fall back to UTC 9am
    return now.getUTCHours() === 9;
  }
}

/**
 * For a given user's timezone, return the local day-of-week (0=Sun, 1=Mon...).
 * Used for FREE-tier "Mondays only" gating in the user's own time.
 */
export function getUserLocalDow(timezone: string | null | undefined, now = new Date()): number {
  const tz = timezone || 'UTC';
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
    });
    const map: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    return map[fmt.format(now)] ?? 0;
  } catch {
    return now.getUTCDay();
  }
}
