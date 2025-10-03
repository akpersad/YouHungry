'use client';

import { useState } from 'react';
import { AdminNav } from './AdminNav';
import { PerformanceDashboard } from './PerformanceDashboard';
import { CostMonitoringDashboard } from './CostMonitoringDashboard';

type AdminTab = 'analytics' | 'costs' | 'users' | 'database' | 'settings';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <PerformanceDashboard />;
      case 'costs':
        return <CostMonitoringDashboard />;
      case 'users':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">User Management</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Coming Soon:</strong> User management features will be
                implemented in a future update.
              </p>
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Database Management</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Coming Soon:</strong> Database management features will
                be implemented in a future update.
              </p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">System Settings</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Coming Soon:</strong> System settings will be
                implemented in a future update.
              </p>
            </div>
          </div>
        );
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
