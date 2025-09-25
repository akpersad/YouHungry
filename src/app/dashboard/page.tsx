import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
            <p className="text-text-light">
              Welcome to your personal restaurant collection manager.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>My Collections</CardTitle>
                <CardDescription>
                  Manage your personal restaurant collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">View Collections</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Find Restaurants</CardTitle>
                <CardDescription>
                  Search and discover new restaurants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Search Restaurants</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Groups</CardTitle>
                <CardDescription>
                  Create and manage groups with friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Manage Groups</Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest restaurant decisions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-muted text-center py-8">
                  No recent activity yet. Start by creating your first
                  collection!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
