import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Refund Policy · Hirin',
  description: 'Cancellation and refund terms for Hirin Pro.',
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="May 1, 2026">
      <h2>Cancellation</h2>
      <p>
        You can cancel your Pro subscription at any time from the{' '}
        <a href="/profile">profile page</a>. After cancellation:
      </p>
      <ul>
        <li>You will retain Pro access until the end of your current billing period.</li>
        <li>You will not be charged again.</li>
        <li>You can resume your subscription before the period ends without losing access.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        We offer a <strong>14-day refund</strong> on your first Pro subscription if you have
        not used Pro-only features (deep scrapes, AI cover letters, AI interview prep). To
        request a refund, contact us within 14 days of your initial subscription via the{' '}
        <a href="/contact">contact page</a>.
      </p>

      <p>
        Refunds for renewal payments are evaluated on a case-by-case basis. We are generally
        flexible if you forgot to cancel and have not used the renewed period — just write
        in.
      </p>

      <h2>How Refunds Are Processed</h2>
      <p>
        Approved refunds are issued via Dodo Payments to your original payment method.
        Processing time varies by payment method and bank, typically 5-10 business days for
        cards and 1-3 business days for UPI (India).
      </p>

      <h2>Free Tier</h2>
      <p>
        The Free tier is, by definition, free — no payment is taken and no refunds apply.
      </p>

      <h2>Disputed Charges</h2>
      <p>
        If you believe you were charged in error, please contact us before initiating a
        chargeback. We will resolve legitimate billing disputes promptly.
      </p>

      <h2>Contact</h2>
      <p>
        Refund requests:{' '}
        <a href="/contact">contact page</a>. Please include the email address on your
        account and the approximate date of the charge.
      </p>
    </LegalLayout>
  );
}
