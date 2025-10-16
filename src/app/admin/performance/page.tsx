import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

export const metadata = {
  title: 'Performance Dashboard - Fork In The Road',
  description: 'Monitor application performance metrics and analytics',
  robots: {
    index: false, // Keep out of search engines
    follow: false,
  },
};

export default function PerformanceDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">
              Performance Dashboard
            </h1>
            <p className="text-text-light">
              Monitor application performance metrics, Core Web Vitals, and
              system analytics.
            </p>
          </div>

          <PerformanceDashboard />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
