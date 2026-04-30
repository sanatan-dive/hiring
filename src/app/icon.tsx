import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon — black rounded-square with sky-blue dot.
 * Auto-served by Next.js at /icon
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: 6,
          color: '#0ea5e9',
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        H
      </div>
    ),
    { ...size }
  );
}
