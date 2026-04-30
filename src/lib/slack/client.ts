import { log } from '@/lib/log';

/**
 * Slack incoming webhook helper.
 * Each user can opt to receive their digest in Slack instead of email by
 * setting User.slackWebhookUrl to their personal incoming-webhook URL.
 *
 * Webhook setup: https://api.slack.com/messaging/webhooks
 */

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: Array<{ type: string; text: string }>;
  accessory?: unknown;
  elements?: unknown[];
}

interface SlackPayload {
  text: string; // fallback for notifications
  blocks?: SlackBlock[];
}

export async function sendSlackMessage(webhookUrl: string, payload: SlackPayload): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
    log.warn('invalid slack webhook url', { hasUrl: Boolean(webhookUrl) });
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text();
      log.warn('slack webhook returned non-ok', { status: res.status, detail: detail.slice(0, 200) });
      return false;
    }
    return true;
  } catch (err) {
    log.error('slack send failed', err);
    return false;
  }
}

/**
 * Format a job-digest send for Slack. Uses Block Kit with fallbacks for
 * notification text.
 */
export function formatDigestForSlack(args: {
  matchCount: number;
  jobs: Array<{
    title: string;
    company: string;
    location: string | null;
    salary: string | null;
    url: string;
    score: number;
  }>;
  matchesUrl: string;
}): SlackPayload {
  const { matchCount, jobs, matchesUrl } = args;
  const top = jobs.slice(0, 5);

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${matchCount} new job match${matchCount === 1 ? '' : 'es'} for you today*`,
      },
    },
  ];

  for (const j of top) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${j.url}|${j.title}>*\n${j.company} · ${j.location ?? 'Remote'}${j.salary ? ` · ${j.salary}` : ''}\n_${Math.round(j.score * 100)}% match_`,
      },
    });
  }

  if (matchCount > top.length) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_…and ${matchCount - top.length} more in your <${matchesUrl}|dashboard>._`,
      },
    });
  }

  return {
    text: `${matchCount} new job matches`,
    blocks,
  };
}
