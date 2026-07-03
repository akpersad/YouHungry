import type { Metadata } from 'next';
import { Geist, Geist_Mono, Fraunces } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotificationCenterProvider } from '@/components/providers/NotificationCenterProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { AppLayout } from '@/components/layout/AppLayout';
import { RootNavigation } from '@/components/layout/RootNavigation';
import {
  LazyPWAInstallPrompt,
  LazyPWAOfflineBanner,
} from '@/components/ui/LazyPWAComponents';
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

// Display serif for headings and brand moments (DESIGN.md). Variable axes:
// opsz auto-tunes for size; SOFT/WONK reserved for decision-reveal moments.
const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
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
    'theme-color': '#bd3e26',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#bd3e26',
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
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
    >
      {/* data-scroll-behavior keeps Next 16 overriding our CSS smooth-scroll
          during route transitions (pre-16 default behavior) */}
      <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
        <head>
          {/* Pre-hydration theme: set .light/.dark on <html> before first
              paint so class-driven tokens and dark: utilities never flash.
              Mirrors ThemeProvider's storage key and resolution rules. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('forkintheroad-theme');var r=t==='light'||t==='dark'?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(r);}catch(e){}})();`,
            }}
          />
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
          <meta name="theme-color" content="#bd3e26" />
          {/* Performance optimizations */}
          <link rel="preconnect" href="https://clerk.com" />
          <link rel="dns-prefetch" href="https://clerk.com" />
          <link rel="preconnect" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
        >
          {/* Analytics Components - Google Analytics & Vercel Analytics work independently */}
          <GoogleAnalytics />
          <Analytics />
          <SpeedInsights />
          <ErrorBoundary level="root">
            <ThemeProvider>
              <QueryProvider>
                <NotificationCenterProvider>
                  <PullToRefresh>
                    <PageTransition>
                      <AppLayout>{children}</AppLayout>
                    </PageTransition>
                  </PullToRefresh>
                  <LazyPWAInstallPrompt />
                  <LazyPWAOfflineBanner />
                  <RootNavigation />
                </NotificationCenterProvider>
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

          {/* Service Worker: register in production only. sw.js cache-firsts
              /_next/static on the content-hashed-filenames assumption, which
              is false under `next dev` (stable URLs) — a dev-registered SW
              serves stale chunks and hydration fails against fresh HTML.
              Dev actively unregisters + evicts, so a browser that picked the
              SW up from a local production run heals itself. */}
          {process.env.NODE_ENV === 'production' ? (
            <Script
              id="sw-register"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                if ('serviceWorker' in navigator) {
                  const registerSW = function() {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(function(registration) {
                        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
                      })
                      .catch(function(err) {
                        console.error('Service worker registration failed:', err);
                        window.dispatchEvent(new CustomEvent('sw-error', { detail: err }));
                      });
                  };

                  // Try to register immediately
                  registerSW();

                  // Also try on window load as fallback
                  window.addEventListener('load', function() {
                    registerSW();
                  });
                }
              `,
              }}
            />
          ) : (
            <Script
              id="sw-unregister-dev"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) { registration.unregister(); });
                  });
                }
                if (window.caches) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(key) {
                      if (key.indexOf('forkintheroad-') === 0) caches.delete(key);
                    });
                  });
                }
              `,
              }}
            />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
