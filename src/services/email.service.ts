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
