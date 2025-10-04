import { AdminGate } from '@/components/admin/AdminGate';
import { AdminPanel } from '@/components/admin/AdminPanel';

// Disable caching for admin pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  );
}
