'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminNav } from './AdminNav';
import { PerformanceDashboard } from './PerformanceDashboard';
import { CostMonitoringDashboard } from './CostMonitoringDashboard';
import { UserManagementDashboard } from './UserManagementDashboard';
import { DatabaseManagementDashboard } from './DatabaseManagementDashboard';
import { UsageAnalyticsDashboard } from './UsageAnalyticsDashboard';
import { SystemSettingsDashboard } from './SystemSettingsDashboard';
import { AdminAlertsDashboard } from './AdminAlertsDashboard';
import { AdminErrorsDashboard } from './AdminErrorsDashboard';

type AdminTab =
  | 'performance'
  | 'analytics'
  | 'errors'
  | 'costs'
  | 'users'
  | 'database'
  | 'settings'
  | 'alerts';

const VALID_TABS: AdminTab[] = [
  'performance',
  'analytics',
  'errors',
  'costs',
  'users',
  'database',
  'settings',
  'alerts',
];

export function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Initialize active tab from URL param, defaulting to 'performance'
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (tabParam && VALID_TABS.includes(tabParam as AdminTab)) {
      return tabParam as AdminTab;
    }
    return 'performance';
  });

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as AdminTab)) {
      setActiveTab(tabParam as AdminTab);
    } else if (!tabParam) {
      // If no tab param, default to performance
      setActiveTab('performance');
    }
  }, [tabParam]);

  // Handle tab changes by updating URL
  const handleTabChange = (tab: string) => {
    const newTab = tab as AdminTab;
    setActiveTab(newTab);

    // Update URL with new tab parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/admin?${params.toString()}`, { scroll: false });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return <PerformanceDashboard />;
      case 'analytics':
        return <UsageAnalyticsDashboard />;
      case 'errors':
        return <AdminErrorsDashboard />;
      case 'costs':
        return <CostMonitoringDashboard />;
      case 'users':
        return <UserManagementDashboard />;
      case 'database':
        return <DatabaseManagementDashboard />;
      case 'settings':
        return <SystemSettingsDashboard />;
      case 'alerts':
        return <AdminAlertsDashboard />;
      default:
        return <PerformanceDashboard />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="shadow-subtle border-b"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--bg-quaternary)',
        }}
      >
        <div className="max-w-7xl mx-auto lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
              <p className="text-sm text-text-light">
                System administration and monitoring
              </p>
            </div>
            <div className="text-sm">Fork In The Road Admin Dashboard</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:px-8 py-6">
        <AdminNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}
