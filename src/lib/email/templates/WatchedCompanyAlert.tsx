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

interface CompanyAlert {
  company: string;
  jobs: Array<{ id: string; title: string; url: string; location: string | null }>;
}

interface Props {
  userName: string;
  alerts: CompanyAlert[];
  unsubscribeUrl?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function WatchedCompanyAlertEmail({ userName, alerts, unsubscribeUrl }: Props) {
  const totalJobs = alerts.reduce((acc, a) => acc + a.jobs.length, 0);
  return (
    <Html>
      <Head />
      <Preview>{`${totalJobs} new jobs at companies you watch`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New roles at companies you watch</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            {totalJobs} new role{totalJobs === 1 ? '' : 's'} just posted at{' '}
            {alerts.length} compan{alerts.length === 1 ? 'y' : 'ies'} you&apos;re watching.
          </Text>

          {alerts.map((a) => (
            <Section key={a.company} style={card}>
              <Heading as="h3" style={companyName}>
                {a.company}
              </Heading>
              {a.jobs.map((j) => (
                <div key={j.id} style={{ marginBottom: 12 }}>
                  <Link href={j.url} style={link}>
                    {j.title}
                  </Link>
                  {j.location && <Text style={loc}>{j.location}</Text>}
                </div>
              ))}
            </Section>
          ))}

          <Section style={btnContainer}>
            <Button href={`${APP_URL}/matches`} style={button}>
              View in dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You watched these companies in your Hirin&apos; settings.{' '}
            <Link href={`${APP_URL}/watched-companies`} style={footerLink}>
              Manage watched companies
            </Link>
            {unsubscribeUrl && (
              <>
                {' · '}
                <Link href={unsubscribeUrl} style={footerLink}>
                  Unsubscribe from all emails
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
const h1 = { color: '#333', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' as const, margin: '24px 0' };
const text = { color: '#333', fontSize: '15px', lineHeight: '24px', padding: '0 24px' };
const card = { padding: '0 24px', marginTop: '12px' };
const companyName = { fontSize: '17px', color: '#000', fontWeight: 700, margin: '16px 0 8px', borderTop: '1px solid #eee', paddingTop: '16px' };
const link = { color: '#0284c7', textDecoration: 'none', fontWeight: 500 };
const loc = { color: '#777', fontSize: '13px', margin: '2px 0 0' };
const btnContainer = { textAlign: 'center' as const, marginTop: '28px' };
const button = { backgroundColor: '#000', borderRadius: '6px', color: '#fff', fontSize: '15px', fontWeight: 500, textDecoration: 'none', display: 'inline-block', padding: '10px 20px' };
const hr = { borderColor: '#e6ebf1', margin: '24px 0' };
const footer = { color: '#888', fontSize: '12px', lineHeight: '18px', textAlign: 'center' as const, padding: '0 24px' };
const footerLink = { color: '#888', textDecoration: 'underline' };
