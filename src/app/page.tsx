import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthButtons } from '@/components/auth/AuthButtons';

export default async function Home() {
  // Redirect authenticated users to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{ color: 'var(--color-text)' }}
        >
          Fork In The Road
        </h1>
        <p
          className="text-xl mb-8 mx-auto"
          style={{ color: 'var(--color-text-light)' }}
        >
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
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Recently visited restaurants get lower priority, keeping your
              choices fresh and exciting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div
        className="text-center py-12 rounded-xl border"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{ color: 'var(--color-text)' }}
        >
          Ready to stop the endless debate?
        </h2>
        <p className="mb-6" style={{ color: 'var(--color-text-light)' }}>
          Join thousands of people who have already simplified their dining
          decisions.
        </p>
        <div className="text-center">
          <AuthButtons />
        </div>
      </div>

      {/* Developer Tools Section */}
      <div className="mt-8 p-4 bg-surface dark:bg-background rounded-lg border border-border dark:border-border">
        <h3 className="text-sm font-semibold text-text dark:text-text-light mb-3">
          🛠️ Developer Tools
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href="/pwa-explorer">
            <Button variant="outline" size="sm">
              📱 PWA Explorer
            </Button>
          </a>
          <a href="/push-test">
            <Button variant="outline" size="sm">
              🔔 Push Notifications Test
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
