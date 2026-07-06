import type { Metadata, Viewport } from 'next';
import { Archivo, Spline_Sans_Mono } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AppHeader } from '@/components/v2/AppHeader';
import './v2.css';

// The root layout — v2 IS the app since the Phase 7 cutover. Identity
// tokens live in v2.css (intent: promptFiles/v2/IDENTITY.md).

// One family, many voices: the wdth axis carries the departure-board display
// register (.type-board compresses to 72%), regular width carries UI + body.
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth'],
});

// Data with ticket energy: fork codes, countdowns, tallies. Always tabular.
const splineSansMono = Spline_Sans_Mono({
  variable: '--font-spline-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fork In The Road',
  description: 'End the where-should-we-eat debate.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icons/app-icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fork',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Browser chrome follows the OS scheme (the app's own default); the
  // in-app override key is cosmetic-only here and not worth a client hook.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fbf6' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1610' },
  ],
};

export default function V2RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${archivo.variable} ${splineSansMono.variable}`}
      >
        <head>
          {/* Pre-hydration theme: set .light/.dark on <html> before first
              paint so class-driven tokens never flash. v2 has its own key —
              the trees must not couple through localStorage. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('fitr-v2-theme');var r=t==='light'||t==='dark'?t:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(r);}catch(e){}})();`,
            }}
          />
          {/* beforeinstallprompt fires once and early — usually before
              hydration subscribes. Stash it (and suppress Chrome's own
              mini-infobar) so InstallPrompt can offer it in context. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__fitrInstallEvent=e;});`,
            }}
          />
        </head>
        <body className="antialiased">
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            {children}
            <footer className="border-t border-line px-4 py-6 sm:px-6">
              <div className="mx-auto flex w-full max-w-3xl items-center justify-between text-xs text-ink-muted">
                <span>Fork In The Road</span>
                <Link
                  href="/privacy"
                  className="text-brass underline underline-offset-2 hover:text-ink"
                >
                  Privacy
                </Link>
              </div>
            </footer>
          </div>
          {/* Hosted observability (charter: no homegrown platform). Both
              no-op outside Vercel deployments. */}
          <Analytics />
          <SpeedInsights />
          {/* The v2 service worker (public/sw.js): production-only, where
              /_next/static filenames are content-hashed — a dev registration
              would recreate the exact stale-chunk bug Phase 4 C7 fixed. Dev
              keeps the unregister + cache eviction so any worker picked up
              from a local production run heals itself. */}
          {process.env.NODE_ENV === 'production' ? (
            <Script
              id="sw-register"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js');
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
                      if (key.indexOf('forkintheroad-') === 0 || key.indexOf('fitr-') === 0) caches.delete(key);
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
