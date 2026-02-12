import { Resend } from 'resend';
import JobDigestEmail from '@/lib/email/templates/JobDigest';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendDigestParams {
  to: string;
  userName: string;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    salary: string | null;
    url: string;
    score: number;
  }[];
}

export const sendJobDigest = async ({ to, userName, jobs }: SendDigestParams) => {
  // In development, you might want to force email to your own address testing
  // const recipient = process.env.NODE_ENV === 'development' ? 'your-test-email@example.com' : to;

  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY missing. Skipping email send.');
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Hirin Job Digest <onboarding@resend.dev>', // Use resend.dev for testing unless domain verified
      to: [to],
      subject: `Your Daily Job Digest: ${jobs.length} New Matches`,
      react: JobDigestEmail({ userName, matchCount: jobs.length, jobs }),
    });

    if (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email service error:', err);
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
    console.log(
      `[DEV] Mock sending email to ${to}: Deep Scrape Finished. Found ${count} jobs from ${source}.`
    );
    if (!process.env.RESEND_API_KEY) return { success: true };
  }

  const jobListHtml = jobs
    .slice(0, 10)
    .map(
      (job) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f9fafb;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${job.title}</h3>
        <p style="margin: 0 0 8px 0; color: #4b5563; font-weight: 500;">${job.company} • ${job.location || 'Remote'}</p>
        ${job.salary ? `<p style="margin: 0 0 8px 0; color: #059669; font-weight: 600;">💰 ${job.salary}</p>` : ''}
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${job.description ? job.description.substring(0, 150) + '...' : 'No description available.'}</p>
        <a href="${job.url}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Apply Now</a>
      </div>
    `
    )
    .join('');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Hirin Scraper <scraper@resend.dev>',
      to: [to],
      subject: `🎯 We found ${count} new jobs for you!`,
      html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #111827;">Scrape Finished!</h1>
              <p style="color: #4b5563; font-size: 16px;">
                Your deep scrape for <strong>${source}</strong> has completed. We found <strong>${count}</strong> new matching jobs.
                Here are the top matches:
              </p>
              
              <div style="margin-top: 24px;">
                ${jobListHtml}
              </div>

              ${count > 10 ? `<p style="text-align: center; margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/matches" style="color: #2563eb; text-decoration: none; font-weight: 600;">View ${count - 10} more matches on dashboard &rarr;</a></p>` : ''}
            </div>
            `,
    });

    if (error) {
      console.error('Scrape email failed:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: err };
  }
};
