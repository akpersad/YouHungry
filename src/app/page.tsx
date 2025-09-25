import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ color: "var(--color-text)" }}
          >
            You Hungry?
          </h1>
          <p
            className="text-xl mb-8 mx-auto"
            style={{ color: "var(--color-text-light)" }}
          >
            Stop the endless &ldquo;where should we eat?&rdquo; debate. Let our
            smart decision engine help you and your friends choose the perfect
            restaurant every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </a>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
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
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
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
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
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
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
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
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Ready to stop the endless debate?
          </h2>
          <p className="mb-6" style={{ color: "var(--color-text-light)" }}>
            Join thousands of people who have already simplified their dining
            decisions.
          </p>
          <Button size="lg">Start Your First Collection</Button>
        </div>
      </div>
    </MainLayout>
  );
}
