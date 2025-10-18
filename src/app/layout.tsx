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
                console.log('🔧 Service Worker: Starting registration check...');
                
                if ('serviceWorker' in navigator) {
                  console.log('🔧 Service Worker: Navigator supports service workers');
                  
                  // Browser detection for iOS compatibility
                  const isSafari = /Safari/.test(navigator.userAgent) && !(/Chrome/.test(navigator.userAgent) || /CriOS/.test(navigator.userAgent));
                  console.log('🔧 Service Worker: Browser detection - isSafari:', isSafari);
                  
                  if (isSafari) {
                    console.log('🔧 Service Worker: Using Safari registration strategy');
                    // Safari needs registration on load event
                    window.addEventListener('load', function() {
                      console.log('🔧 Service Worker: Safari - attempting registration on load event');
                      navigator.serviceWorker.register('/sw.js', { scope: '/' })
                        .then(function(registration) {
                          console.log('🔧 Service Worker: Safari registration successful!', registration);
                          window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                        })
                        .catch(function(err) {
                          console.error('🔧 Service Worker: Safari registration failed:', err);
                          window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                        });
                    });
                  } else {
                    console.log('🔧 Service Worker: Using standard registration strategy');
                    // Standard registration for Chrome and other browsers
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('🔧 Service Worker: Standard registration successful!', registration);
                        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                      })
                      .catch(function(err) {
                        console.error('🔧 Service Worker: Standard registration failed, trying fallback:', err);
                        // Fallback to load event if immediate registration fails
                        window.addEventListener('load', function() {
                          console.log('🔧 Service Worker: Fallback - attempting registration on load event');
                          navigator.serviceWorker.register('/sw.js')
                            .then(function(registration) {
                              console.log('🔧 Service Worker: Fallback registration successful!', registration);
                              window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                            })
                            .catch(function(err) {
                              console.error('🔧 Service Worker: Fallback registration failed:', err);
                              window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                            });
                        });
                      });
                  }
                } else {
                  console.error('🔧 Service Worker: Navigator does NOT support service workers');
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
