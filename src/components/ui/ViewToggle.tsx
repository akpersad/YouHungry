'use client';

// import { ReactNode } from 'react'; // Will be used in future variants
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  currentView: 'list' | 'map';
  onToggle: (view: 'list' | 'map') => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'inline';
}

export function ViewToggle({
  currentView,
  onToggle,
  className,
  size = 'md',
  position = 'top-right',
}: ViewToggleProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'md':
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'fixed top-20 left-4 z-40';
      case 'top-right':
        return 'fixed top-20 right-4 z-40';
      case 'inline':
      default:
        return 'relative';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      case 'md':
      default:
        return 'w-5 h-5';
    }
  };

  // List icon
  const ListIcon = () => (
    <svg
      className={getIconSize()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );

  // Map icon
  const MapIcon = () => (
    <svg
      className={getIconSize()}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );

  return (
    <div
      className={cn(
        'bg-secondary rounded-xl shadow-neumorphic-elevated',
        'border border-quaternary p-1 flex gap-1',
        getPositionClasses(),
        className
      )}
      style={{
        borderColor: 'var(--bg-quaternary)',
      }}
    >
      {/* List View Button */}
      <button
        onClick={() => onToggle('list')}
        className={cn(
          'flex items-center justify-center rounded-lg',
          'transition-all duration-200 touch-target',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'active:scale-95',
          {
            'bg-accent text-inverse shadow-neumorphic-pressed':
              currentView === 'list',
            'text-secondary hover:bg-tertiary hover:text-primary hover:scale-105':
              currentView !== 'list',
          },
          getSizeClasses()
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label="Switch to list view"
      >
        <ListIcon />
      </button>

      {/* Map View Button */}
      <button
        onClick={() => onToggle('map')}
        className={cn(
          'flex items-center justify-center rounded-lg',
          'transition-all duration-200 touch-target',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'active:scale-95',
          {
            'bg-accent text-inverse shadow-neumorphic-pressed':
              currentView === 'map',
            'text-secondary hover:bg-tertiary hover:text-primary hover:scale-105':
              currentView !== 'map',
          },
          getSizeClasses()
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label="Switch to map view"
      >
        <MapIcon />
      </button>
    </div>
  );
}

// Enhanced view toggle with labels for larger screens
interface ViewToggleWithLabelsProps extends ViewToggleProps {
  showLabels?: boolean;
}

export function ViewToggleWithLabels({
  currentView,
  onToggle,
  className,
  size = 'md',
  position = 'top-right',
  showLabels = false,
}: ViewToggleWithLabelsProps) {
  if (!showLabels) {
    return (
      <ViewToggle
        currentView={currentView}
        onToggle={onToggle}
        className={className}
        size={size}
        position={position}
      />
    );
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'md':
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'fixed top-20 left-4 z-40';
      case 'top-right':
        return 'fixed top-20 right-4 z-40';
      case 'inline':
      default:
        return 'relative';
    }
  };

  return (
    <div
      className={cn(
        'bg-secondary rounded-xl shadow-neumorphic-elevated',
        'border border-quaternary flex gap-1',
        getPositionClasses(),
        className
      )}
      style={{
        borderColor: 'var(--bg-quaternary)',
      }}
    >
      {/* List View Button */}
      <button
        onClick={() => onToggle('list')}
        className={cn(
          'flex items-center gap-2 rounded-lg font-medium',
          'transition-all duration-200 touch-target',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'active:scale-95',
          {
            'bg-accent text-inverse shadow-neumorphic-pressed':
              currentView === 'list',
            'text-secondary hover:bg-tertiary hover:text-primary hover:scale-105':
              currentView !== 'list',
          },
          getSizeClasses()
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label="Switch to list view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <span>List</span>
      </button>

      {/* Map View Button */}
      <button
        onClick={() => onToggle('map')}
        className={cn(
          'flex items-center gap-2 rounded-lg font-medium',
          'transition-all duration-200 touch-target',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'active:scale-95',
          {
            'bg-accent text-inverse shadow-neumorphic-pressed':
              currentView === 'map',
            'text-secondary hover:bg-tertiary hover:text-primary hover:scale-105':
              currentView !== 'map',
          },
          getSizeClasses()
        )}
        style={
          {
            '--tw-ring-color': 'var(--accent-primary)',
            '--tw-ring-opacity': '0.3',
          } as React.CSSProperties
        }
        aria-label="Switch to map view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        <span>Map</span>
      </button>
    </div>
  );
}
