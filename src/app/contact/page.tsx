import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Contact · Hirin',
  description: 'Get in touch with the Hirin team.',
};

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@hirin.app';

export default function ContactPage() {
  return (
    <LegalLayout title="Contact" lastUpdated="May 1, 2026">
      <p>
        We&apos;re a small team. The fastest way to reach us is by email — we typically reply
        within one business day.
      </p>

      <h2>General Support</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>

      <h2>Billing &amp; Refunds</h2>
      <p>
        Questions about your subscription, refund requests, or chargebacks: email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Billing`}>{SUPPORT_EMAIL}</a> with subject
        line &quot;Billing&quot; and include the email on your account plus the approximate
        date of any charge.
      </p>

      <h2>Privacy &amp; Data Requests</h2>
      <p>
        For GDPR/CCPA data access, correction, deletion, or portability requests: email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Privacy`}>{SUPPORT_EMAIL}</a>. Most actions
        (delete, edit, export) you can do yourself from the{' '}
        <a href="/profile">profile page</a> faster than emailing us.
      </p>

      <h2>Bug Reports &amp; Feature Requests</h2>
      <p>
        We love hearing from users. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{' '}
        with subject &quot;Feedback&quot; or open an issue at our{' '}
        <a href="https://github.com/sanatan-dive/hiring/issues" target="_blank" rel="noopener">
          GitHub repo
        </a>
        .
      </p>

      <h2>Security Disclosure</h2>
      <p>
        If you discover a security vulnerability, please email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Security`}>{SUPPORT_EMAIL}</a> with subject
        &quot;Security&quot;. Please do not publicly disclose until we have had a reasonable
        opportunity to fix it (typically 30 days).
      </p>
    </LegalLayout>
  );
}
