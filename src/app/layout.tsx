import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { AppLayout } from '@/components/layout/AppLayout';
import { RootNavigation } from '@/components/layout/RootNavigation';
import {
  PWAInstallPrompt,
  PWAOfflineBanner,
} from '@/components/ui/PWAStatusIndicator';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  title: 'Fork In The Road - Restaurant Discovery',
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
    title: 'Fork In The Road - Restaurant Discovery',
    description: 'Discover and decide on restaurants with friends',
    url: 'https://forkintheroad.app',
    siteName: 'Fork In The Road',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fork In The Road - Restaurant Discovery App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fork In The Road - Restaurant Discovery',
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
    title: 'Fork In The Road',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#e3005a',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#527a51',
  viewportFit: 'cover', // Enable safe area insets for notch/status bar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link
            rel="icon"
            href="/favicon-16x16.svg"
            sizes="16x16"
            type="image/svg+xml"
          />
          <link
            rel="icon"
            href="/favicon-32x32.svg"
            sizes="32x32"
            type="image/svg+xml"
          />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
          <meta name="theme-color" content="#e3005a" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* Analytics Components - Google Analytics & Vercel Analytics work independently */}
          <GoogleAnalytics />
          <Analytics />
          <SpeedInsights />
          <ErrorBoundary level="root">
            <ThemeProvider>
              <QueryProvider>
                <PullToRefresh>
                  <PageTransition>
                    <AppLayout>{children}</AppLayout>
                  </PageTransition>
                </PullToRefresh>
                <PWAInstallPrompt />
                <PWAOfflineBanner />
                <RootNavigation />
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
                  const isSafari = /Safari/.test(navigator.userAgent) && !(/Chrome/.test(navigator.userAgent) || /CriOS/.test(navigator.userAgent));
                  
                  if (isSafari) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js', { scope: '/' })
                        .then(function(registration) {
                          window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                        })
                        .catch(function(err) {
                          window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                        });
                    });
                  } else {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                      })
                      .catch(function(err) {
                        window.addEventListener('load', function() {
                          navigator.serviceWorker.register('/sw.js')
                            .then(function(registration) {
                              window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                            })
                            .catch(function(err) {
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
