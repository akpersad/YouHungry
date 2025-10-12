'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { ADMIN_USER_IDS } from '@/constants/admin';

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      logger.warn('Admin access attempted without authentication');
      router.push('/sign-in?redirect_url=/admin');
      return;
    }

    // Check if user has admin access by fetching their MongoDB user data
    const checkAdminAccess = async () => {
      setIsCheckingAccess(true);
      console.log('AdminGate: Starting admin access check...');
      try {
        console.log('AdminGate: Fetching /api/user/current...');
        const response = await fetch('/api/user/current');
        console.log('AdminGate: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();
        console.log('AdminGate: Raw user data:', userData);

        const mongoUserId = userData.user?._id;
        console.log('AdminGate: Extracted mongoUserId:', mongoUserId);

        // Convert to string to ensure comparison works
        const userIdString = mongoUserId?.toString();

        if (userIdString && ADMIN_USER_IDS.includes(userIdString)) {
          setHasAccess(true);
          logger.info(
            `Admin access granted to user: ${user.id} (MongoDB: ${mongoUserId})`
          );
        } else {
          setHasAccess(false);
          logger.warn(
            `Unauthorized admin access attempt by user: ${user.id} (MongoDB: ${mongoUserId})`
          );
        }
      } catch (error) {
        console.log('AdminGate: Error occurred:', error);
        logger.error('Error checking admin access:', error);
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [user, isLoaded, router]);

  if (!isLoaded || isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          role="status"
          aria-label="Loading"
        ></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Access Denied
          </h1>
          <p className="text-text-light">
            You don&apos;t have permission to access this area.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (hasAccess === true) {
    return <>{children}</>;
  }

  // Still checking access
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
        role="status"
        aria-label="Loading"
      ></div>
    </div>
  );
}
