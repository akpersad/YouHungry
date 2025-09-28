import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CollectionView } from '@/components/features/CollectionView';

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <ProtectedRoute>
        <CollectionView collectionId={id} />
      </ProtectedRoute>
    </MainLayout>
  );
}
