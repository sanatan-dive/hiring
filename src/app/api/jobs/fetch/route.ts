import { NextResponse } from 'next/server';
import { fetchAndSaveJobs, getJobs } from '@/services/job.service';

export async function POST(req: Request) {
  try {
    const { query, location } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const count = await fetchAndSaveJobs(query, location);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const jobs = await getJobs(page, limit);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}
