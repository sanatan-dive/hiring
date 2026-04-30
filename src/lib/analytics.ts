/**
 * Lightweight Umami analytics helper.
 *
 * Umami's script (loaded via NEXT_PUBLIC_UMAMI_WEBSITE_ID + a <script> tag in
 * the root layout) attaches `window.umami`. We wrap it so:
 *   1. SSR doesn't crash (window === undefined)
 *   2. Local dev without Umami logs to console instead of being silent
 *   3. Calls are typed so we don't drift on event names
 *
 * Add new events to FunnelEvent so the funnel report stays consistent.
 */

export type FunnelEvent =
  | 'signup'
  | 'resume_uploaded'
  | 'first_match_shown'
  | 'cover_letter_generated'
  | 'interview_prep_generated'
  | 'subscribe_clicked'
  | 'subscribe_completed'
  | 'subscribe_cancelled'
  | 'job_applied'
  | 'job_bookmarked'
  | 'unsubscribed';

type EventProps = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    umami?: {
      track(event: string, data?: EventProps): void;
    };
  }
}

export function track(event: FunnelEvent, props?: EventProps) {
  if (typeof window === 'undefined') return;
  if (window.umami?.track) {
    window.umami.track(event, props);
    return;
  }
  // Fallback for dev / users with adblock
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[analytics] ${event}`, props ?? '');
  }
}
