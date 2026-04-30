import React from 'react';
import Link from 'next/link';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="font-poppins min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to Hirin&apos;
        </Link>
        <h1 className="mt-6 text-4xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray mt-8 max-w-none text-gray-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-blue-600 [&_a:hover]:underline">
          {children}
        </div>

        <hr className="mt-12 border-gray-200" />
        <p className="mt-6 text-xs text-gray-400">
          Questions?{' '}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default LegalLayout;
