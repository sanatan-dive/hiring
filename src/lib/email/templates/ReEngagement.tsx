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

interface Props {
  userName: string;
  daysAway: number;
  newMatchCount: number;
  topJobs: Array<{ id: string; title: string; company: string; url: string }>;
  unsubscribeUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function ReEngagementEmail({
  userName,
  daysAway,
  newMatchCount,
  topJobs,
  unsubscribeUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`${newMatchCount} matches arrived while you were away`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Hirin<span style={{ color: '#0ea5e9' }}>.</span>
          </Heading>
          <Heading as="h2" style={h2}>
            We saved {newMatchCount} matches you haven&apos;t seen
          </Heading>

          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            You haven&apos;t checked in for {daysAway} days. While you were away, we kept ranking
            new jobs against your resume. Here are the top three:
          </Text>

          {topJobs.slice(0, 3).map((j) => (
            <Section key={j.id} style={card}>
              <Text style={role}>{j.title}</Text>
              <Text style={company}>{j.company}</Text>
              <Link href={j.url} style={link}>
                View role →
              </Link>
            </Section>
          ))}

          <Section style={btnContainer}>
            <Button href={`${APP_URL}/matches`} style={button}>
              See all {newMatchCount} matches
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Not searching anymore?{' '}
            {unsubscribeUrl ? (
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            ) : (
              <Link href={`${APP_URL}/profile?tab=notifications`} style={footerLink}>
                Pause emails
              </Link>
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
  fontSize: '22px',
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
const footer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  padding: '0 24px',
};
const footerLink = { color: '#888', textDecoration: 'underline' };
