import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/terms',
  '/privacy',
  '/refund',
  '/contact',
  '/unsubscribe',
  '/robots.txt',
  '/sitemap.xml',
  '/monitoring(.*)',
  '/api/uploadthing(.*)',
  '/api/webhooks(.*)',
  '/api/unsubscribe(.*)',
]);

const REF_COOKIE = 'hirin_ref';
const REF_COOKIE_TTL = 60 * 60 * 24 * 30; // 30 days

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { sessionClaims } = await auth();
  const isOnboarded = sessionClaims?.metadata?.isOnboarded;
  const pathname = request.nextUrl.pathname;

  // Capture ?ref= referral codes BEFORE auth checks (works for anonymous + authed)
  const ref = request.nextUrl.searchParams.get('ref');
  let response: NextResponse | null = null;
  if (ref && /^[\w-]{4,40}$/.test(ref)) {
    response = NextResponse.next();
    response.cookies.set(REF_COOKIE, ref, {
      maxAge: REF_COOKIE_TTL,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  // 1. Authenticated user on landing page → redirect to matches
  if (userId && pathname === '/') {
    const redirect = NextResponse.redirect(new URL('/matches', request.url), 303);
    if (ref && /^[\w-]{4,40}$/.test(ref)) {
      redirect.cookies.set(REF_COOKIE, ref, {
        maxAge: REF_COOKIE_TTL,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    return redirect;
  }

  // 2. Already-onboarded user trying to access /onboard → block, send to matches
  if (userId && pathname === '/onboard' && isOnboarded) {
    return NextResponse.redirect(new URL('/matches', request.url), 303);
  }

  // 3. Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return response ?? undefined;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
