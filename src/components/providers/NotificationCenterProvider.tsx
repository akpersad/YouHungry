'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { NotificationPanel } from '@/components/ui/NotificationPanel';

interface NotificationCenterContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

// Safe no-op default so consumers (e.g. the mobile-nav hook) never crash when
// rendered without the provider — the panel simply won't open.
const NotificationCenterContext = createContext<NotificationCenterContextValue>(
  {
    isOpen: false,
    open: () => {},
    close: () => {},
  }
);

/**
 * Holds the single notification-center panel and its open state so both entry
 * points share it: the desktop header bell and the mobile "More" menu. Mounts
 * the panel once for signed-in users (its polling hook only runs then).
 */
export function NotificationCenterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
      {isLoaded && isSignedIn && (
        <NotificationPanel isOpen={isOpen} onClose={close} />
      )}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  return useContext(NotificationCenterContext);
}
