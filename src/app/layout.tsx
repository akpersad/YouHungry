import type { Metadata, Viewport } from 'next';
import { Archivo, Spline_Sans_Mono } from 'next/font/google';
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
        </head>
        <body className="antialiased">
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            {children}
          </div>
          {/* Hosted observability (charter: no homegrown platform). Both
              no-op outside Vercel deployments. */}
          <Analytics />
          <SpeedInsights />
          {/* v1's service worker registered at scope '/'; a browser that
              picked it up before cutover would serve stale v1 chunks
              forever. Unregister + evict in dev; the v2 SW story (and a
              prod-side takeover of the old scope) is Phase 8. */}
          {process.env.NODE_ENV !== 'production' && (
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
