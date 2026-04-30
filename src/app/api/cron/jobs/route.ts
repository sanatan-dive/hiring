import { NextResponse } from 'next/server';
import { fetchAndSaveJobs } from '@/services/job.service';

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // Default search params for cron
    // You might want to rotate queries or have multiple cron jobs for different queries
    const count = await fetchAndSaveJobs('software engineer', 'remote');
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
