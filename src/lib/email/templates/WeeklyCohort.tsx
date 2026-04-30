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
  weekStart: Date;
  yourStats: {
    applications: number;
    bookmarks: number;
    matchesViewed: number;
    coverLettersGenerated: number;
  };
  cohortAverage: {
    applications: number;
    bookmarks: number;
    matchesViewed: number;
    coverLettersGenerated: number;
  };
  unsubscribeUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function delta(you: number, avg: number): { sign: '+' | '-' | '='; value: string } {
  if (you === avg) return { sign: '=', value: '0' };
  const diff = you - avg;
  return {
    sign: diff > 0 ? '+' : '-',
    value: String(Math.abs(diff).toFixed(0)),
  };
}

export default function WeeklyCohortEmail({
  userName,
  weekStart,
  yourStats,
  cohortAverage,
  unsubscribeUrl,
}: Props) {
  const rows: Array<[string, number, number]> = [
    ['Applications', yourStats.applications, cohortAverage.applications],
    ['Bookmarks', yourStats.bookmarks, cohortAverage.bookmarks],
    ['Matches viewed', yourStats.matchesViewed, cohortAverage.matchesViewed],
    ['AI cover letters', yourStats.coverLettersGenerated, cohortAverage.coverLettersGenerated],
  ];

  return (
    <Html>
      <Head />
      <Preview>Your week vs other job seekers like you</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Hirin<span style={{ color: '#0ea5e9' }}>.</span>
          </Heading>
          <Heading as="h2" style={h2}>
            Your week, by the numbers
          </Heading>

          <Text style={subtitle}>
            Week of {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>

          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            Here&apos;s how your job-search activity compared to other engineers using Hirin&apos;
            this week.
          </Text>

          <Section style={tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Metric</th>
                  <th style={thRight}>You</th>
                  <th style={thRight}>Avg</th>
                  <th style={thRight}>vs avg</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, you, avg]) => {
                  const d = delta(you, avg);
                  const color = d.sign === '+' ? '#16a34a' : d.sign === '-' ? '#dc2626' : '#888';
                  return (
                    <tr key={label}>
                      <td style={td}>{label}</td>
                      <td style={tdRight}>{you}</td>
                      <td style={tdRightSubtle}>{avg.toFixed(1)}</td>
                      <td style={{ ...tdRight, color }}>
                        {d.sign}
                        {d.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          <Section style={btnContainer}>
            <Button href={`${APP_URL}/matches`} style={button}>
              Open dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            <Link href={`${APP_URL}/profile?tab=notifications`} style={footerLink}>
              Disable weekly reports
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
  fontSize: '22px',
  fontWeight: 600,
  textAlign: 'center' as const,
  margin: '8px 0 4px',
};
const subtitle = {
  color: '#888',
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};
const text = { color: '#333', fontSize: '15px', lineHeight: '24px', padding: '0 24px' };
const tableWrap = { padding: '0 24px', marginTop: '20px' };
const th = {
  textAlign: 'left' as const,
  fontSize: '12px',
  color: '#888',
  borderBottom: '1px solid #eee',
  padding: '8px 0',
  fontWeight: 500,
};
const thRight = { ...th, textAlign: 'right' as const };
const td = {
  padding: '10px 0',
  fontSize: '14px',
  color: '#000',
  borderBottom: '1px solid #f3f4f6',
};
const tdRight = { ...td, textAlign: 'right' as const, fontWeight: 600 };
const tdRightSubtle = { ...td, textAlign: 'right' as const, color: '#888', fontWeight: 400 };
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
