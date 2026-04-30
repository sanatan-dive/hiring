import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/extension/profile
 *
 * Auth: Clerk session cookie (browser extension calls with credentials: 'include')
 * Returns the user's profile shaped for application autofill.
 *
 * Includes CORS headers so the extension's content script can call from
 * any host_permission allowed by manifest.json.
 */

const ALLOWED_ORIGINS = [
  'https://hirin.app',
  'http://localhost:3000',
  // Chrome extension requests come with Origin: chrome-extension://<id>
  // We accept any chrome-extension origin since the auth cookie scopes us.
];

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('chrome-extension://') ||
      origin.startsWith('moz-extension://'))
  ) {
    h['Access-Control-Allow-Origin'] = origin;
  }
  return h;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: Request) {
  const cors = corsHeaders(req.headers.get('origin'));
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          error: 'unauthenticated',
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sign-in`,
        },
        { status: 401, headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        socialLinks: true,
        jobPreferences: true,
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 404, headers: cors });
    }

    // Map social links into top-level fields the extension knows
    const socials = Object.fromEntries(
      user.socialLinks.map((s) => [s.platform.toLowerCase(), s.url])
    );

    const prefs = user.jobPreferences;
    const desiredSalary =
      prefs?.salaryMin && prefs?.salaryMax
        ? `${prefs.salaryMin}-${prefs.salaryMax} ${prefs.salaryCurrency ?? 'USD'}`
        : undefined;

    return NextResponse.json(
      {
        fullName: user.name ?? '',
        email: user.email,
        linkedinUrl: socials.linkedin ?? null,
        githubUrl: socials.github ?? null,
        portfolioUrl: socials.portfolio ?? socials.website ?? null,
        resumeUrl: user.resumes[0]?.fileUrl ?? null,
        skills: user.skills ?? [],
        workLocation: prefs?.workLocation ?? null,
        desiredSalary,
        // Demographic fields are intentionally omitted — these should be
        // user-controlled in profile settings, never auto-suggested.
      },
      { headers: cors }
    );
  } catch (err) {
    log.error('extension profile failed', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500, headers: cors });
  }
}
