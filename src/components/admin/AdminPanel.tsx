'use client';

import { useState } from 'react';
import { AdminNav } from './AdminNav';
import { PerformanceDashboard } from './PerformanceDashboard';
import { CostMonitoringDashboard } from './CostMonitoringDashboard';
import { UserManagementDashboard } from './UserManagementDashboard';
import { DatabaseManagementDashboard } from './DatabaseManagementDashboard';
import { UsageAnalyticsDashboard } from './UsageAnalyticsDashboard';
import { SystemSettingsDashboard } from './SystemSettingsDashboard';
import { AdminAlertsDashboard } from './AdminAlertsDashboard';

type AdminTab =
  | 'performance'
  | 'analytics'
  | 'costs'
  | 'users'
  | 'database'
  | 'settings'
  | 'alerts';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('performance');
  // const [cacheBuster, setCacheBuster] = useState(Date.now());

  // Add cache busting when component mounts or tab changes
  // useEffect(() => {
  //   setCacheBuster(Date.now());
  // }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return <PerformanceDashboard />;
      case 'analytics':
        return <UsageAnalyticsDashboard />;
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">
                System administration and monitoring
              </p>
            </div>
            <div className="text-sm text-gray-500">
              You Hungry? Admin Dashboard
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as AdminTab)}
        />

        <div className="mt-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}
