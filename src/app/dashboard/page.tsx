'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CollectionList } from '@/components/features/CollectionList';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDecisionHistory } from '@/hooks/api/useHistory';
import { Clock, Users, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Fetch recent decisions for the activity feed
  const { data: recentDecisions, isLoading: isLoadingDecisions } =
    useDecisionHistory({
      type: 'all',
      limit: 5,
      offset: 0,
    });
  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
          <p className="text-text-light">
            Welcome to your personal restaurant collection manager.
          </p>
        </div>

        <CollectionList />

        {/* Hidden on mobile - actions are available via bottom navigation */}
        <div className="hidden md:block mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Restaurants</CardTitle>
              <CardDescription>
                Search and discover new restaurants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/restaurants">
                <Button className="w-full">Search Restaurants</Button>
              </Link>
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

        {/* Hidden on mobile - not essential for mobile experience */}
        <div className="hidden md:block mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest restaurant decisions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDecisions ? (
                <p className="text-text-muted text-center py-8">
                  Loading recent activity...
                </p>
              ) : !recentDecisions?.decisions ||
                recentDecisions.decisions.length === 0 ? (
                <p className="text-text-muted text-center py-8">
                  No recent activity yet. Start by creating your first
                  collection!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentDecisions.decisions.map((decision, index) => (
                    <div
                      key={decision.id || `decision-${index}`}
                      className="flex items-start gap-3 p-3 border border-quaternary rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {decision.type === 'group' ? (
                          <Users className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary">
                            {decision.result?.restaurant?.name ||
                              'Restaurant Decision'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-tertiary text-primary">
                            {decision.method}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Visited:{' '}
                            {new Date(decision.visitDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Logged:{' '}
                            {new Date(decision.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-sm text-tertiary mt-1">
                          {decision.type === 'group'
                            ? `Group: ${decision.groupName}`
                            : 'Personal Decision'}{' '}
                          • {decision.collectionName}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentDecisions.pagination.hasMore && (
                    <div className="text-center pt-4">
                      <Link href="/history">
                        <Button variant="outline" size="sm">
                          View All History
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
