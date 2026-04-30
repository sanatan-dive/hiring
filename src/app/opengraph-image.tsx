/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Hirin' — AI-powered job matching";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic Open Graph image for social previews.
 * Used by Twitter/X, LinkedIn, Slack, etc. when the link is shared.
 *
 * Lives at /opengraph-image and is auto-attached by Next.js metadata
 * to the root layout.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c4a6e 100%)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Hirin
          </div>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 12,
              backgroundColor: '#0ea5e9',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 1000,
            }}
          >
            Stop scrolling job boards.
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#7dd3fc',
            }}
          >
            Get matched jobs in your inbox.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 24,
            color: '#cbd5e1',
          }}
        >
          <div>AI ranks jobs from 6 sources, daily.</div>
          <div style={{ color: '#7dd3fc' }}>hirin.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
