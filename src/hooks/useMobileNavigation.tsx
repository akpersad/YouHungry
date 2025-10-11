'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  href: string;
  isActive: boolean;
}

export function useMobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const { isAdmin, isChecking: isCheckingAdmin } = useIsAdmin();

  // Determine active tab based on current path
  const getActiveTab = (path: string): string => {
    if (path === '/dashboard' || path === '/') return 'home';
    if (path.startsWith('/restaurants')) return 'search';
    if (path.startsWith('/groups')) return 'groups';
    if (
      path.startsWith('/friends') ||
      path.startsWith('/history') ||
      path.startsWith('/profile') ||
      path.startsWith('/analytics') ||
      path.startsWith('/admin')
    ) {
      return 'more';
    }
    return 'home';
  };

  const activeTab = getActiveTab(pathname);

  // Navigation items with icons
  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon className="w-6 h-6" />,
      activeIcon: <HomeIconSolid className="w-6 h-6" />,
      href: '/dashboard',
      isActive: activeTab === 'home',
    },
    {
      id: 'search',
      label: 'Search',
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      activeIcon: <MagnifyingGlassIconSolid className="w-6 h-6" />,
      href: '/restaurants',
      isActive: activeTab === 'search',
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: <UserGroupIcon className="w-6 h-6" />,
      activeIcon: <UserGroupIconSolid className="w-6 h-6" />,
      href: '/groups',
      isActive: activeTab === 'groups',
    },
    {
      id: 'more',
      label: 'More',
      icon: <EllipsisHorizontalIcon className="w-6 h-6" />,
      href: '#', // Not used since this opens a menu
      isActive: activeTab === 'more',
    },
  ];

  // More menu actions - show different options based on auth status
  const moreMenuActions =
    isLoaded && isSignedIn
      ? [
          // User info section
          {
            id: 'user-info',
            label: user?.firstName ? `Hi, ${user.firstName}` : 'Account',
            icon: <UserIcon className="w-5 h-5" />,
            onClick: () => router.push('/profile'),
            variant: 'default' as const,
          },
          // Separator (we'll handle this in the UI)
          {
            id: 'friends',
            label: 'Friends',
            icon: <UserIcon className="w-5 h-5" />,
            onClick: () => router.push('/friends'),
          },
          {
            id: 'history',
            label: 'History',
            icon: <ClockIcon className="w-5 h-5" />,
            onClick: () => router.push('/history'),
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: <ChartBarIcon className="w-5 h-5" />,
            onClick: () => router.push('/analytics'),
          },
          {
            id: 'profile',
            label: 'Profile Settings',
            icon: <Cog6ToothIcon className="w-5 h-5" />,
            onClick: () => router.push('/profile'),
          },
          // Admin Dashboard - only show for authorized admins
          ...(isAdmin && !isCheckingAdmin
            ? [
                {
                  id: 'admin-dashboard',
                  label: 'Admin Dashboard',
                  icon: <ShieldCheckIcon className="w-5 h-5" />,
                  onClick: () => router.push('/admin'),
                },
              ]
            : []),
          // Theme toggle
          {
            id: 'theme-toggle',
            label: resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode',
            icon:
              resolvedTheme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              ),
            onClick: toggleTheme,
          },
          // Sign out
          {
            id: 'signout',
            label: 'Sign Out',
            icon: <ArrowRightOnRectangleIcon className="w-5 h-5" />,
            onClick: () => {
              signOut();
            },
            variant: 'destructive' as const,
          },
        ]
      : [
          // Not signed in - show theme toggle first
          {
            id: 'theme-toggle',
            label: resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode',
            icon:
              resolvedTheme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              ),
            onClick: toggleTheme,
          },
          // Sign in option
          {
            id: 'signin',
            label: 'Sign In',
            icon: <ArrowLeftOnRectangleIcon className="w-5 h-5" />,
            onClick: () => router.push('/sign-in'),
          },
        ];

  // Handle navigation click
  const handleNavigation = (item: NavigationItem) => {
    if (item.id === 'more') {
      // Open the more menu bottom sheet
      setIsMoreMenuOpen(true);
    } else {
      router.push(item.href);
    }
  };

  return {
    navigationItems,
    activeTab,
    handleNavigation,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
    moreMenuActions,
    isSignedIn,
    isLoaded,
    user,
  };
}
