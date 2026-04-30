import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Privacy Policy · Hirin',
  description: 'How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="May 1, 2026">
      <p>
        This policy explains what personal data Hirin&apos; collects, why we collect it, and
        what rights you have.
      </p>

      <h2>1. Data We Collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address (via Clerk), profile picture if
          you provide one
        </li>
        <li>
          <strong>Resume content:</strong> the file you upload, extracted text, parsed skills
          and experiences
        </li>
        <li>
          <strong>Job preferences:</strong> roles, locations, salary range, work-style
          preferences you set
        </li>
        <li>
          <strong>Usage data:</strong> which jobs you bookmark, hide, apply to, and your
          interaction with our emails (open/click tracking via Resend)
        </li>
        <li>
          <strong>Payment data:</strong> handled directly by Dodo Payments — we never see your
          card details
        </li>
        <li>
          <strong>Telemetry:</strong> anonymized analytics via Umami; error tracking via Sentry
          (no resume content or PII is sent)
        </li>
      </ul>

      <h2>2. How We Use It</h2>
      <ul>
        <li>To match jobs to your profile (vector embeddings of resume + listings)</li>
        <li>To send you the daily/weekly digest you signed up for</li>
        <li>To process your subscription via Dodo Payments</li>
        <li>To improve match quality based on which jobs you engage with</li>
      </ul>

      <h2>3. Who We Share With</h2>
      <p>
        Your data is shared only with the operational vendors necessary to provide the
        Service:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication
        </li>
        <li>
          <strong>Neon (PostgreSQL)</strong> — database hosting
        </li>
        <li>
          <strong>Vercel</strong> — application hosting
        </li>
        <li>
          <strong>Google Generative AI (Gemini)</strong> — resume parsing &amp; embedding
          (text-embedding-004)
        </li>
        <li>
          <strong>Resend</strong> — email delivery
        </li>
        <li>
          <strong>Dodo Payments</strong> — payment processing (merchant of record)
        </li>
        <li>
          <strong>Upstash</strong> — rate limiting + queue
        </li>
        <li>
          <strong>Sentry</strong> — error monitoring
        </li>
      </ul>
      <p>
        We do not sell your data, do not run third-party advertising, and do not share your
        resume with employers without your explicit action (clicking &quot;Apply&quot; takes
        you off-site).
      </p>

      <h2>4. Your Rights (GDPR/CCPA)</h2>
      <ul>
        <li>
          <strong>Access:</strong> view your data anytime on the <a href="/profile">profile
          page</a>
        </li>
        <li>
          <strong>Correction:</strong> edit your profile and re-upload your resume
        </li>
        <li>
          <strong>Deletion:</strong> permanently delete your account from the profile page —
          this cascades and removes resumes, embeddings, matches, applications, and bookmarks
          within 24 hours
        </li>
        <li>
          <strong>Portability:</strong> contact us for a JSON export of your data
        </li>
        <li>
          <strong>Unsubscribe:</strong> use the link in any digest email or the toggle in
          settings
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain your data while your account is active. After deletion, we keep anonymized
        usage logs for 30 days for security and audit purposes; everything else is
        permanently removed.
      </p>

      <h2>6. Security</h2>
      <p>
        Data in transit is encrypted via HTTPS. Data at rest is encrypted on Neon and Vercel
        infrastructure. We use industry-standard authentication (Clerk) and follow the
        principle of least privilege for vendor access.
      </p>

      <h2>7. Children</h2>
      <p>
        Hirin&apos; is not intended for users under 16. If you believe a child has provided us
        with personal data, contact us and we will delete it.
      </p>

      <h2>8. International Transfers</h2>
      <p>
        Data may be processed in the United States, the European Union, and India where our
        vendors operate. By using the Service, you consent to these transfers.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>Material changes will be communicated by email at least 14 days in advance.</p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions or requests: see the <a href="/contact">contact page</a>.
      </p>
    </LegalLayout>
  );
}
