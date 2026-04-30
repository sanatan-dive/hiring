import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/monitoring(.*)',
  '/api/uploadthing(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { sessionClaims } = await auth();
  const isOnboarded = sessionClaims?.metadata?.isOnboarded;
  const pathname = request.nextUrl.pathname;

  // 1. Authenticated user on landing page → redirect to matches
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/matches', request.url), 303);
  }

  // 2. Already-onboarded user trying to access /Onboard → block, send to matches
  if (userId && pathname === '/Onboard' && isOnboarded) {
    return NextResponse.redirect(new URL('/matches', request.url), 303);
  }

  // 3. Protect all non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
