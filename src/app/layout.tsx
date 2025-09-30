import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
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
  title: 'You Hungry? - Smart Restaurant Decision Making',
  description:
    "Stop the endless 'where should we eat?' debate. Let our smart decision engine help you and your friends choose the perfect restaurant every time.",
  keywords: ['restaurant', 'decision', 'group', 'food', 'dining', 'choice'],
  authors: [{ name: 'You Hungry Team' }],
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
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
