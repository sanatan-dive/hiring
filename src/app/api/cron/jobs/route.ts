import { NextResponse } from 'next/server';
import { fetchAndSaveJobs } from '@/services/job.service';

export async function GET(req: Request) {
  // Verify authentication
  // In development, you might want to bypass this or use a local secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
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
