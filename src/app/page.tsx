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

export const metadata: Metadata = {
  title: 'Fork In The Road - Restaurant Discovery & Decision Making',
  description:
    'Stop the endless "where should we eat?" debate. Smart decision engine helps you and your friends choose the perfect restaurant with group voting, collections, and intelligent recommendations.',
};

export default async function Home() {
  // Redirect authenticated users to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
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
              No more endless group chats. Get everyone&apos;s input and reach a
              decision quickly.
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
    </div>
  );
}
