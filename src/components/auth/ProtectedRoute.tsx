'use client';

import { useUser } from '@clerk/nextjs';
import { ReactNode } from 'react';
import { SignInButton } from './SignInButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      fallback || (
        <div className="mx-auto mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                You need to be signed in to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton className="w-full" />
            </CardContent>
          </Card>
        </div>
      )
    );
  }

  return <>{children}</>;
}
