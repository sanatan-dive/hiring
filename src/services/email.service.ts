import crypto from 'node:crypto';
import { Resend } from 'resend';
import sanitizeHtml from 'sanitize-html';
import { log } from '@/lib/log';
import JobDigestEmail from '@/lib/email/templates/JobDigest';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Hirin <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const SAFE_HTML_OPTS: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
  allowedAttributes: {},
};

export function safeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeHtml(input, SAFE_HTML_OPTS);
}

/**
 * Generate (and persist) the unsubscribe token for a user lazily on first send.
 * Returns the unsubscribe URL embedded in the email + List-Unsubscribe header.
 */
export function newUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function unsubscribeUrl(token: string): string {
  return `${APP_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
}

interface DigestJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url: string;
  score: number;
  scrapedAt?: Date | string | null;
}

interface SendDigestParams {
  to: string;
  userName: string;
  unsubscribeToken: string;
  unsubscribeUrl?: string;
  frequency?: 'daily' | 'weekly';
  jobs: DigestJob[];
}

/**
 * Build a digest subject line by rotating through 3 templates.
 * Rotation is deterministic per-day so the same digest run uses one template,
 * but templates cycle across days.
 */
export function generateDigestSubject(jobs: DigestJob[]): string {
  const total = jobs.length;
  const fallback = `${total} new matches for you · Hirin`;

  if (total === 0) return fallback;

  // Day-of-year based rotation (0..2)
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const variant = dayOfYear % 3;

  try {
    if (variant === 0) {
      const companies: string[] = [];
      for (const j of jobs) {
        const c = (j.company || '').trim();
        if (c && !companies.includes(c)) companies.push(c);
        if (companies.length === 3) break;
      }
      if (companies.length >= 1) {
        return `${companies.join(', ')} are hiring engineers like you`;
      }
    }

    if (variant === 1) {
      const seniorCount = jobs.filter((j) => (j.score ?? 0) >= 0.8).length;
      const n = seniorCount > 0 ? seniorCount : total;
      return `${n} senior roles match your resume today`;
    }

    // variant === 2: most recent posting
    const sorted = [...jobs].sort((a, b) => {
      const at = a.scrapedAt ? new Date(a.scrapedAt).getTime() : 0;
      const bt = b.scrapedAt ? new Date(b.scrapedAt).getTime() : 0;
      return bt - at;
    });
    const top = sorted[0];
    if (top?.title && top?.company) {
      return `Posted today: ${top.title} at ${top.company}`;
    }
  } catch {
    // fall through to fallback
  }

  return fallback;
}

export const sendJobDigest = async ({
  to,
  userName,
  unsubscribeToken,
  frequency,
  jobs,
}: SendDigestParams) => {
  if (!process.env.RESEND_API_KEY) {
    log.warn('RESEND_API_KEY missing. Skipping email send.');
    return { success: false, error: 'Missing API Key' };
  }

  const unsubUrl = unsubscribeUrl(unsubscribeToken);

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: generateDigestSubject(jobs),
      react: JobDigestEmail({
        userName,
        matchCount: jobs.length,
        jobs,
        unsubscribeUrl: unsubUrl,
      }),
      headers: {
        // CAN-SPAM / Gmail one-click unsubscribe support
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@${
          new URL(APP_URL).hostname
        }?subject=unsubscribe&body=${encodeURIComponent(unsubscribeToken)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'campaign', value: 'digest' },
        { name: 'frequency', value: frequency || 'daily' },
      ],
    });

    if (error) {
      log.error('Email sending failed:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    log.error('Email service error:', err);
    return { success: false, error: err };
  }
};

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string | null;
  description?: string | null;
  url: string;
}

export const sendScrapeCompleteEmail = async (to: string, jobs: ScrapedJob[], source: string) => {
  const count = jobs.length;
  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
    log.info(
      `[DEV] Mock sending email to ${to}: Deep Scrape Finished. Found ${count} jobs from ${source}.`
    );
    if (!process.env.RESEND_API_KEY) return { success: true };
  }

  const jobListHtml = jobs
    .slice(0, 10)
    .map(
      (job) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9fafb;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${sanitizeHtml(job.title, { allowedTags: [], allowedAttributes: {} })}</h3>
        <p style="margin: 0 0 8px 0; color: #4b5563; font-weight: 500;">${sanitizeHtml(job.company, { allowedTags: [], allowedAttributes: {} })} • ${sanitizeHtml(job.location || 'Remote', { allowedTags: [], allowedAttributes: {} })}</p>
        ${job.salary ? `<p style="margin: 0 0 8px 0; color: #059669; font-weight: 600;">${sanitizeHtml(job.salary, { allowedTags: [], allowedAttributes: {} })}</p>` : ''}
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${
          job.description
            ? safeHtml(job.description.substring(0, 300)) + '...'
            : 'No description available.'
        }</p>
        <a href="${job.url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Apply Now</a>
      </div>
    `
    )
    .join('');

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `${count} new jobs from ${source}`,
      html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #111827;">Scrape finished</h1>
              <p style="color: #4b5563; font-size: 16px;">
                Your deep scrape for <strong>${sanitizeHtml(source, { allowedTags: [], allowedAttributes: {} })}</strong> completed. We found <strong>${count}</strong> new matching jobs.
              </p>

              <div style="margin-top: 24px;">
                ${jobListHtml}
              </div>

              ${count > 10 ? `<p style="text-align: center; margin-top: 24px;"><a href="${APP_URL}/matches" style="color: #2563eb; text-decoration: none; font-weight: 600;">View ${count - 10} more matches on dashboard &rarr;</a></p>` : ''}
            </div>
            `,
    });

    if (error) {
      log.error('Scrape email failed:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    log.error('Email error:', err);
    return { success: false, error: err };
  }
};
