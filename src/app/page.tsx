import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { AuthButtons } from '@/components/auth/AuthButtons';
import {
  OrganizationStructuredData,
  WebApplicationStructuredData,
  SoftwareApplicationStructuredData,
  FAQStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Fork In The Road - Restaurant Discovery & Group Decision Making',
  description:
    'Stop the endless "where should we eat?" debate. Smart decision engine helps you and your friends choose the perfect restaurant with group voting, collections, and intelligent recommendations. Free restaurant discovery app.',
  keywords: [
    'restaurant decision maker',
    'where to eat',
    'group restaurant voting',
    'restaurant discovery app',
    'food decision app',
    'restaurant collections',
    'dining with friends',
    'restaurant picker',
    'group dining decisions',
    'restaurant recommendations',
    'food app',
    'restaurant finder',
    'collaborative dining',
    'restaurant voting app',
    'smart restaurant selection',
  ],
  alternates: {
    canonical: 'https://forkintheroad.app',
  },
  openGraph: {
    title: 'Fork In The Road - Restaurant Discovery & Group Decision Making',
    description:
      'Stop the endless "where should we eat?" debate. Smart decision engine helps you and your friends choose the perfect restaurant with group voting, collections, and intelligent recommendations.',
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
    title: 'Fork In The Road - Restaurant Discovery & Group Decision Making',
    description:
      'Smart decision engine helps you and your friends choose the perfect restaurant. Free app with group voting and intelligent recommendations.',
    images: ['/og-image.png'],
  },
};

export default async function Home() {
  // Redirect authenticated users to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <>
      {/* Structured Data for SEO and GEO */}
      <OrganizationStructuredData />
      <WebApplicationStructuredData />
      <SoftwareApplicationStructuredData />
      <FAQStructuredData />
      <WebSiteStructuredData />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fork In The Road
          </h1>
          <p className="text-xl mb-8 mx-auto max-w-3xl px-4">
            Stop the endless &ldquo;where should we eat?&rdquo; debate. Let our
            smart decision engine help you and your friends choose the perfect
            restaurant every time.
          </p>
          <AuthButtons />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Smart Collections</CardTitle>
              <CardDescription>
                Organize your favorite restaurants into personal or group
                collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Create custom collections for different occasions, cuisines, or
                groups of friends.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group Decisions</CardTitle>
              <CardDescription>
                Make decisions together with tiered voting or random selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                No more endless group chats. Get everyone&apos;s input and reach
                a decision quickly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Weighting</CardTitle>
              <CardDescription>
                Our algorithm learns from your choices to make better
                recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Recently visited restaurants get lower priority, keeping your
                choices fresh and exciting.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div
          className="text-center py-12 px-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-2xl font-bold mb-4">
            Ready to stop the endless debate?
          </h2>
          <p className="mb-6">
            Join thousands of people who have already simplified their dining
            decisions.
          </p>
          <div className="text-center">
            <AuthButtons />
          </div>
        </div>

        {/* FAQ Section for GEO Optimization */}
        <section className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>What is Fork In The Road?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                Fork In The Road is a smart restaurant discovery and group
                decision-making platform that helps friends decide where to eat
                together. It eliminates the endless &ldquo;where should we
                eat?&rdquo; debate through intelligent algorithms, personalized
                collections, and collaborative voting systems.
              </p>
            </details>

            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>How does the group decision making work?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                Fork In The Road offers two decision-making methods: (1) Random
                Selection - uses a smart weighting algorithm that considers
                recent visits to ensure variety while respecting preferences,
                and (2) Tiered Voting - allows group members to rank their
                restaurant preferences, and the system calculates the best
                choice based on everyone&apos;s input.
              </p>
            </details>

            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>Is Fork In The Road free to use?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                Yes! Fork In The Road is completely free to use. You can create
                collections, search for restaurants, form groups with friends,
                and make unlimited decisions without any cost.
              </p>
            </details>

            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>What is the smart weighting algorithm?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                The smart weighting algorithm tracks your restaurant visits over
                a 30-day rolling period. Recently visited restaurants
                automatically receive lower priority in random selections,
                ensuring you discover new places while still allowing your
                favorites to appear. This keeps your dining choices fresh and
                exciting.
              </p>
            </details>

            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>Can I use Fork In The Road on my phone?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                Absolutely! Fork In The Road is built as a Progressive Web App
                (PWA) that works seamlessly on all devices - desktop, tablet,
                and mobile. You can even install it on your phone&apos;s home
                screen for a native app-like experience without downloading from
                an app store.
              </p>
            </details>

            <details
              className="group p-6 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <summary className="cursor-pointer font-semibold text-lg mb-2 list-none flex items-center justify-between">
                <span>How do I create restaurant collections?</span>
                <span className="ml-2 transform transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--color-text-light)' }}
              >
                Creating collections is simple: (1) Go to your Dashboard, (2)
                Click &ldquo;Create Collection&rdquo;, (3) Give it a name like
                &ldquo;Date Night Spots&rdquo; or &ldquo;Quick Lunch&rdquo;, (4)
                Search for restaurants using our integrated Google Places
                search, and (5) Add restaurants to your collection. You can
                create unlimited personal collections and share group
                collections with friends.
              </p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
