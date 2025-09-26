import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RestaurantSearchPage } from '@/components/features/RestaurantSearchPage';

export default function RestaurantsPage() {
  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">
              Restaurant Search
            </h1>
            <p className="text-text-light">
              Discover and explore restaurants in your area or search by name.
            </p>
          </div>

          <RestaurantSearchPage />
        </div>
      </ProtectedRoute>
    </MainLayout>
  );
}
