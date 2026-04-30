'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            gap: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Something went wrong!</h2>
          <p style={{ color: '#6b7280' }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#126fff',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
