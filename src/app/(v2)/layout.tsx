import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './v2.css';

// v2 root layout — the (v2) route group is a separate app tree served at
// /beta with its own <html>/<body>. It deliberately shares nothing with the
// v1 shell (no AppLayout/RootNavigation/PWA chrome, no v1 globals.css); the
// v2 identity and providers are built up phase by phase.

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
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
