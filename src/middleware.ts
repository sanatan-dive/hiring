import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/uploadthing(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Check if user is onboarded
  const { sessionClaims } = await auth();
  const isOnboarded = sessionClaims?.metadata?.isOnboarded;

  // 1. If user is authenticated and visiting landing page ('/')
  if (userId && request.nextUrl.pathname === '/') {
    // If onboarded, go to /matches
    if (isOnboarded) {
      return NextResponse.redirect(new URL('/matches', request.url), 303);
    }
    // If not onboarded, go to /Onboard
    return NextResponse.redirect(new URL('/Onboard', request.url), 303);
  }

  // 2. If user is authenticated and visiting /Onboard
  if (userId && request.nextUrl.pathname === '/Onboard') {
    // If already onboarded, preventing re-onboarding manually (unless you want to allow it)
    if (isOnboarded) {
      return NextResponse.redirect(new URL('/matches', request.url), 303);
    }
  }

  // 3. If user is authenticated and visiting any protected route (like /matches)
  /* 
  // Commenting out to prevent infinite loop due to stale session token
  if (userId && !isPublicRoute(request) && request.nextUrl.pathname !== '/Onboard') {
    // If not onboarded, force to /Onboard
    if (!isOnboarded) {
      return NextResponse.redirect(new URL('/Onboard', request.url), 303);
    }
  } 
  */

  // If route is not public and user is not authenticated, protect it
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
