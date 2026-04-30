import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns the caller's country code, sourced from Vercel's edge header
 * `x-vercel-ip-country`. Used by the pricing page to auto-detect INR.
 * Returns `{ country: null }` in local dev where the header is absent.
 */
export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country');
  return NextResponse.json(
    { country: country ?? null },
    {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    }
  );
}
