'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  Settings,
  Users,
  Database,
  DollarSign,
  ExternalLink,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface AdminNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminNavItems = [
  {
    id: 'performance',
    title: 'Performance',
    icon: Activity,
    description: 'Monitor Core Web Vitals and system performance',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    description: 'Monitor app usage analytics',
  },
  {
    id: 'costs',
    title: 'Cost Monitoring',
    icon: DollarSign,
    description: 'Track API costs and usage',
  },
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    description: 'Manage user accounts',
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    description: 'Database management tools',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    description: 'System configuration',
  },
  {
    id: 'alerts',
    title: 'Alerts',
    icon: AlertTriangle,
    description: 'System alerts and notifications',
  },
];

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-light hover:text-text hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* External Links */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-text-light">
          <span>External Tools:</span>
          <a
            href="/performance-dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
          >
            <BarChart3 className="h-3 w-3" />
            Legacy Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
