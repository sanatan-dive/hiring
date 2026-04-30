import Link from 'next/link';

export const metadata = {
  title: 'Unsubscribe · Hirin',
  robots: { index: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  const success = result === 'ok';

  return (
    <main className="font-poppins flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {success ? (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">You&apos;re unsubscribed</h1>
            <p className="mt-3 text-sm text-gray-600">
              We won&apos;t send you any more job digests. You can still see matches in your
              dashboard.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Changed your mind?{' '}
              <Link href="/profile" className="text-blue-600 underline">
                Re-enable digests in settings
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-gray-900">Link expired or invalid</h1>
            <p className="mt-3 text-sm text-gray-600">
              We couldn&apos;t process your unsubscribe request. The link may have expired or
              already been used.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              You can also{' '}
              <Link href="/profile" className="text-blue-600 underline">
                manage your preferences
              </Link>{' '}
              from your profile.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
