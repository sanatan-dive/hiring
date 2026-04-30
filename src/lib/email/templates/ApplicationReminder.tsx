import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface Reminder {
  jobTitle: string;
  company: string;
  appliedAt: Date;
  applicationId: string;
}

interface Props {
  userName: string;
  reminders: Reminder[];
  unsubscribeUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function daysAgo(date: Date): number {
  return Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export default function ApplicationReminderEmail({ userName, reminders, unsubscribeUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${reminders.length} application${reminders.length === 1 ? '' : 's'} could use a follow-up`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Hirin<span style={{ color: '#0ea5e9' }}>.</span>
          </Heading>
          <Heading as="h2" style={h2}>
            Quick check-in on your applications
          </Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            You have {reminders.length} application{reminders.length === 1 ? '' : 's'} from ~7-14
            days ago that hasn&apos;t moved. A polite follow-up email or LinkedIn DM at this point
            converts surprisingly often.
          </Text>

          {reminders.map((r) => (
            <Section key={r.applicationId} style={card}>
              <Text style={role}>{r.jobTitle}</Text>
              <Text style={company}>
                {r.company} · applied {daysAgo(r.appliedAt)} days ago
              </Text>
              <Link href={`${APP_URL}/applications`} style={link}>
                Update status →
              </Link>
            </Section>
          ))}

          <Section style={btnContainer}>
            <Button href={`${APP_URL}/applications`} style={button}>
              Open application tracker
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={tip}>
            <strong>Pro tip:</strong> If you used Hirin&apos; AI cover letter for this role, re-open
            the job and click &quot;Draft outreach&quot; to generate a polite follow-up message.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            <Link href={`${APP_URL}/profile?tab=notifications`} style={footerLink}>
              Disable application reminders
            </Link>
            {unsubscribeUrl && (
              <>
                {' · '}
                <Link href={unsubscribeUrl} style={footerLink}>
                  Unsubscribe from all
                </Link>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px' };
const h1 = {
  color: '#000',
  fontSize: '20px',
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '24px 0 4px',
};
const h2 = {
  color: '#111',
  fontSize: '20px',
  fontWeight: 600,
  textAlign: 'center' as const,
  margin: '12px 0 24px',
};
const text = { color: '#333', fontSize: '15px', lineHeight: '24px', padding: '0 24px' };
const card = { padding: '12px 24px', borderTop: '1px solid #eee', marginTop: '8px' };
const role = { color: '#000', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' };
const company = { color: '#666', fontSize: '13px', margin: '0 0 6px' };
const link = { color: '#0284c7', fontSize: '13px', textDecoration: 'none', fontWeight: 500 };
const btnContainer = { textAlign: 'center' as const, marginTop: '28px' };
const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  display: 'inline-block',
  padding: '10px 20px',
};
const hr = { borderColor: '#e6ebf1', margin: '24px 24px' };
const tip = { color: '#475569', fontSize: '13px', lineHeight: '20px', padding: '0 24px' };
const footer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  padding: '0 24px',
};
const footerLink = { color: '#888', textDecoration: 'underline' };
