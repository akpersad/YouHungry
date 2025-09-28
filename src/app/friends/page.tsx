import { FriendsManagement } from '@/components/features/FriendsManagement';
import { MainLayout } from '@/components/layout/MainLayout';

export default function FriendsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FriendsManagement />
      </div>
    </MainLayout>
  );
}
