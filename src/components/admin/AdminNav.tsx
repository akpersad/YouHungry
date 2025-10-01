'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Settings,
  Users,
  Database,
  Activity,
  ExternalLink,
} from 'lucide-react';

const adminNavItems = [
  {
    title: 'Performance',
    href: '/admin/performance',
    icon: BarChart3,
    description: 'Monitor app performance metrics',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: Activity,
    description: 'View user analytics and insights',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage user accounts',
  },
  {
    title: 'Database',
    href: '/admin/database',
    icon: Database,
    description: 'Database management tools',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration',
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <div className="px-3 py-2">
        <h2 className="mb-1 px-4 text-lg font-semibold tracking-tight">
          Admin Panel
        </h2>
        <p className="px-4 text-sm text-muted-foreground">
          System administration and monitoring
        </p>
      </div>

      <nav className="space-y-1 px-3">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}

        {/* External Links */}
        <div className="border-t pt-4 mt-4">
          <div className="px-3 py-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              External Tools
            </h3>
          </div>

          <a
            href="/performance-dashboard.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Legacy Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Standalone HTML dashboard
              </div>
            </div>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </nav>
    </div>
  );
}
