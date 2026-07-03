import type { Metadata, Viewport } from 'next';
import { Archivo, Spline_Sans_Mono } from 'next/font/google';
import Script from 'next/script';
import { ClerkProvider } from '@clerk/nextjs';
import './v2.css';

// v2 root layout — the (v2) route group is a separate app tree served at
// /beta with its own <html>/<body>. It deliberately shares nothing with the
// v1 shell; identity tokens live in v2.css (intent: promptFiles/v2/IDENTITY.md).

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
  title: 'Fork In The Road (beta)',
  description: 'End the where-should-we-eat debate.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
          {children}
          {/* v1's service worker registers at scope '/', so it controls
              /beta too. In dev it would serve stale, non-content-hashed
              chunks (hydration mismatch vs fresh HTML) — unregister + evict
              here as well, so a browser heals from either tree. The v2 SW
              story proper is Phase 8. */}
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
