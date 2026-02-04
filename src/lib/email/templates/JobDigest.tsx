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

interface JobDigestProps {
  userName: string;
  matchCount: number;
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

export const JobDigestEmail = ({
  userName = 'Job Seeker',
  matchCount = 0,
  jobs = [],
}: JobDigestProps) => {
  return (
    <Html>
      <Head />
      <Preview>{`${matchCount} new job matches found for you!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hirin&apos; Job Digest</Heading>
          <Text style={text}>Hi {userName},</Text>
          <Text style={text}>
            We found <strong>{matchCount} new jobs</strong> that match your profile since your last
            visit. Here are the top matches:
          </Text>

          <Section style={jobList}>
            {jobs.slice(0, 5).map((job) => (
              <Section key={job.id} style={jobCard}>
                <Heading as="h3" style={jobTitle}>
                  {job.title}
                </Heading>
                <Text style={companyName}>
                  {job.company} • {job.location || 'Remote'}
                </Text>
                {job.salary && <Text style={salary}>{job.salary}</Text>}
                <Text style={matchScore}>{Math.round(job.score * 100)}% Match</Text>
                <Link href={job.url} style={link}>
                  View Job
                </Link>
              </Section>
            ))}
          </Section>

          {matchCount > 5 && (
            <Text style={moreText}>...and {matchCount - 5} more matches waiting for you.</Text>
          )}

          <Section style={btnContainer}>
            <Button href="https://smarthire.app/matches" style={button}>
              View All Matches
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Sent by Hirin&apos; • All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default JobDigestEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 20px',
};

const jobList = {
  padding: '0 20px',
  marginTop: '20px',
};

const jobCard = {
  border: '1px solid #eee',
  borderRadius: '5px',
  padding: '15px',
  marginBottom: '15px',
  backgroundColor: '#fafafa',
};

const jobTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 5px',
  color: '#333',
};

const companyName = {
  fontSize: '14px',
  color: '#666',
  margin: '0 0 5px',
};

const salary = {
  fontSize: '14px',
  color: '#16a34a', // green
  fontWeight: 'bold',
  margin: '0 0 5px',
};

const matchScore = {
  fontSize: '12px',
  color: '#2563eb', // blue
  fontWeight: 'bold',
  marginBottom: '10px',
  display: 'block',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
  fontSize: '14px',
};

const moreText = {
  textAlign: 'center' as const,
  color: '#666',
  fontSize: '14px',
  marginTop: '10px',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '30px',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
