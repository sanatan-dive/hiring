import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: "Hirin' — AI-Powered Job Matching",
    template: "%s | Hirin'",
  },
  description:
    "Upload your resume, and Hirin' finds jobs everywhere, matches with AI, and delivers the best opportunities to your inbox daily.",
  keywords: [
    'job search',
    'AI job matching',
    'resume parser',
    'job scraper',
    'career',
    'job board aggregator',
    'cover letter generator',
    'interview prep',
  ],
  authors: [{ name: "Hirin'" }],
  creator: "Hirin'",
  metadataBase: new URL('https://hirin.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hirin.app',
    siteName: "Hirin'",
    title: "Hirin' — Apply Smarter, Land Better",
    description:
      'AI-powered job matching that scrapes, matches, and delivers the best jobs to your inbox.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "Hirin' — AI Job Matching Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Hirin' — AI-Powered Job Matching",
    description: 'Upload your resume. Get matched to jobs with AI. Land better.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Header />
          {children}
          <Footer />
          <Toaster position="top-right" />

          {/* Umami Analytics — only loads when env var is set */}
          {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
            <Script
              defer
              src="https://cloud.umami.is/script.js"
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              strategy="afterInteractive"
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
