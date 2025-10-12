import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  PWAInstallPrompt,
  PWAOfflineBanner,
} from '@/components/ui/PWAStatusIndicator';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Toaster } from 'sonner';
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
  title: 'ForkInTheRoad - Restaurant Discovery',
  description: 'Discover and decide on restaurants with friends',
  keywords: ['restaurants', 'food', 'discovery', 'decision making', 'groups'],
  authors: [{ name: 'Andrew Persad' }],
  creator: 'Andrew Persad',
  publisher: 'Andrew Persad',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://forkintheroad.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ForkInTheRoad - Restaurant Discovery',
    description: 'Discover and decide on restaurants with friends',
    url: 'https://forkintheroad.app',
    siteName: 'ForkInTheRoad',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ForkInTheRoad - Restaurant Discovery App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ForkInTheRoad - Restaurant Discovery',
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
    title: 'ForkInTheRoad',
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
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
          <meta name="theme-color" content="#ff6b6b" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ErrorBoundary level="root">
            <ThemeProvider>
              <QueryProvider>
                <PageTransition>
                  <AppLayout>{children}</AppLayout>
                </PageTransition>
                <PWAInstallPrompt />
                <PWAOfflineBanner />
                <Toaster
                  position="top-center"
                  expand={false}
                  richColors
                  closeButton
                  duration={4000}
                />
              </QueryProvider>
            </ThemeProvider>
          </ErrorBoundary>

          {/* Service Worker Registration */}
          <Script
            id="sw-register"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  // Browser detection for iOS compatibility
                  const isSafari = /Safari/.test(navigator.userAgent) && !(/Chrome/.test(navigator.userAgent) || /CriOS/.test(navigator.userAgent));
                  
                  if (isSafari) {
                    // Safari needs registration on load event
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js', { scope: '/' })
                        .then(function(registration) {
                          window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                        })
                        .catch(function(err) {
                          logger.error('ServiceWorker registration failed:', err);
                          window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                        });
                    });
                  } else {
                    // Standard registration for Chrome and other browsers
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                      })
                      .catch(function(err) {
                        // Fallback to load event if immediate registration fails
                        window.addEventListener('load', function() {
                          navigator.serviceWorker.register('/sw.js')
                            .then(function(registration) {
                              window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                            })
                            .catch(function(err) {
                              logger.error('ServiceWorker registration failed:', err);
                              window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                            });
                        });
                      });
                  }
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
