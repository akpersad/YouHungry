import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/user/current');

        if (!response.ok) {
          setIsAdmin(false);
          return;
        }

        const userData = await response.json();

        // Server returns isAdmin status after checking env var server-side
        const isAdminUser = userData.user?.isAdmin === true;

        if (isAdminUser) {
          setIsAdmin(true);
          logger.debug(`Admin status confirmed for user: ${user.id}`);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        logger.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, isLoaded]);

  // Without a signed-in user there is nothing to check — derive the result
  // during render instead of setting state synchronously in the effect.
  if (!isLoaded || !user) {
    return { isAdmin: false, isChecking: false };
  }

  return { isAdmin, isChecking };
}
