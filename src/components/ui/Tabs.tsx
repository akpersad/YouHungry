'use client';

import { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabsProps) {
  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className="border-b border-border">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium transition-colors
                  whitespace-nowrap
                  ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-muted hover:text-text border-b-2 border-transparent'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`
                        px-2 py-0.5 text-xs rounded-full
                        ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-background-secondary text-text-muted'
                        }
                      `}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={tab.id !== activeTab}
            className={tab.id === activeTab ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
