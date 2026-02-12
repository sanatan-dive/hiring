import { NextResponse } from 'next/server';
import { performDeepScrape } from '@/services/job.service';
import { sendScrapeCompleteEmail } from '@/services/email.service';

// This endpoint is called by QStash
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
