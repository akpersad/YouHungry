import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'You Hungry? - Restaurant Discovery',
  description: 'Discover and decide on restaurants with friends',
  keywords: ['restaurants', 'food', 'discovery', 'decision making', 'groups'],
  authors: [{ name: 'You Hungry Team' }],
  creator: 'You Hungry Team',
  publisher: 'You Hungry Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://you-hungry.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'You Hungry? - Restaurant Discovery',
    description: 'Discover and decide on restaurants with friends',
    url: 'https://you-hungry.app',
    siteName: 'You Hungry?',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'You Hungry? - Restaurant Discovery App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'You Hungry? - Restaurant Discovery',
    description: 'Discover and decide on restaurants with friends',
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'You Hungry?',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#ff6b6b',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#527a51',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="theme-color" content="#ff6b6b" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
            <QueryProvider>
              <PageTransition>{children}</PageTransition>
            </QueryProvider>
          </ThemeProvider>

          {/* Service Worker Registration */}
          <Script
            id="sw-register"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('ServiceWorker registration successful');
                      })
                      .catch(function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      });
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
