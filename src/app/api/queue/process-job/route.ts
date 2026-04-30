import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { performDeepScrape } from '@/services/job.service';
import { sendScrapeCompleteEmail } from '@/services/email.service';

const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

const receiver =
  currentSigningKey && nextSigningKey
    ? new Receiver({
        currentSigningKey,
        nextSigningKey,
      })
    : null;

// This endpoint is called by QStash
export async function POST(req: Request) {
  try {
    const signature = req.headers.get('upstash-signature');
    const rawBody = await req.text();

    if (!receiver) {
      console.error('QStash signing keys are not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing upstash-signature header' }, { status: 400 });
    }

    try {
      await receiver.verify({
        signature,
        body: rawBody,
      });
    } catch (err) {
      console.error('QStash signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const { source, query, location } = body;

    console.log(`Processing queue job: ${source} - ${query} in ${location}`);

    if (!source || !query) {
      return NextResponse.json({ error: 'Missing source or query' }, { status: 400 });
    }

    const jobs = await performDeepScrape(source, query, location);

    // Send notification if email provided
    if (body.email) {
      await sendScrapeCompleteEmail(body.email, jobs, source);
    }

    return NextResponse.json({ success: true, count: jobs.length });
  } catch (error) {
    console.error('Queue job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
