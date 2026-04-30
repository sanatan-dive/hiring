import LegalLayout from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Terms of Service · Hirin',
  description: 'The terms governing your use of Hirin.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="May 1, 2026">
      <p>
        Welcome to Hirin&apos; (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). These Terms
        of Service govern your use of our website and services. By creating an account or using
        the Service, you agree to these terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Hirin&apos; aggregates job listings from third-party sources (including but not limited
        to Adzuna, JSearch, RemoteOK, WeWorkRemotely, and LinkedIn job pages you provide), uses
        AI to match them against your resume, and delivers a daily or weekly digest to your
        inbox.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must be at least 16 years old to use the Service.</li>
        <li>You are responsible for keeping your account credentials secure.</li>
        <li>One account per person. Sharing accounts may result in suspension.</li>
      </ul>

      <h2>3. Subscriptions and Payments</h2>
      <p>
        We offer a free tier and a paid &quot;Pro&quot; subscription. Payments are processed by
        Dodo Payments (our merchant of record). By subscribing, you authorize Dodo to charge
        your payment method on a recurring basis until you cancel. See our{' '}
        <a href="/refund">Refund Policy</a> for cancellation and refund details.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Reverse-engineer, scrape, or attempt to extract our database</li>
        <li>Use the Service to send spam or unsolicited communications</li>
        <li>Impersonate another person or upload content you don&apos;t have rights to</li>
        <li>Probe or violate the security of the Service</li>
      </ul>

      <h2>5. User Content</h2>
      <p>
        You retain ownership of your resume and profile data. By uploading, you grant us a
        limited, non-exclusive license to process the content for the purpose of providing the
        Service (parsing, embedding, matching). We do not sell your resume data to third
        parties.
      </p>

      <h2>6. Third-Party Job Sources</h2>
      <p>
        Job listings are aggregated from public sources and APIs. We do not employ, endorse, or
        guarantee any employer or job posting. Apply at your own discretion. We are not
        affiliated with LinkedIn, Indeed, or any other listed source.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. We do not
        guarantee job placement, the accuracy of listings, or any specific outcome from using
        Hirin&apos;.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability for any claim arising from
        your use of the Service is limited to the amount you paid us in the 12 months preceding
        the claim.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may delete your account at any time from the profile page. We may suspend or
        terminate your account for violations of these terms. Upon termination, we will delete
        your data per our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>
        We may update these terms occasionally. Material changes will be communicated via email
        or in-app notification at least 14 days before they take effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions? Reach us via the <a href="/contact">contact page</a>.
      </p>
    </LegalLayout>
  );
}
