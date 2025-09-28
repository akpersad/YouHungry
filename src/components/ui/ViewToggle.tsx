'use client';

import { Button } from './Button';

export type ViewType = 'list' | 'grid';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function ViewToggle({
  currentView,
  onViewChange,
  className = '',
}: ViewToggleProps) {
  return (
    <div
      className={`flex items-center bg-gray-100 rounded-lg p-1 ${className}`}
    >
      <Button
        variant={currentView === 'list' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`px-2 sm:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          currentView === 'list'
            ? 'text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        variant={currentView === 'grid' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`px-2 sm:px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          currentView === 'grid'
            ? 'text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
}
