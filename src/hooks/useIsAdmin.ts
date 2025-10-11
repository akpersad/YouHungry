import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

// List of authorized admin MongoDB user IDs
const ADMIN_USER_IDS = ['68d9b010a25dec569c34c111', '68d9ae3528a9bab6c334d9f9'];

export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsAdmin(false);
      setIsChecking(false);
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
        const mongoUserId = userData.user?._id?.toString();

        if (mongoUserId && ADMIN_USER_IDS.includes(mongoUserId)) {
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

  return { isAdmin, isChecking };
}
