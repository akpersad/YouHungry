'use client';

import { AdminNav } from '@/components/admin/AdminNav';
import { Sidebar } from '@/components/ui/Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar>
        <AdminNav activeTab="analytics" onTabChange={() => {}} />
      </Sidebar>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
