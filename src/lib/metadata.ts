/**
 * Centralized metadata configurations for SEO optimization
 * Provides consistent metadata across all pages
 */

import { Metadata } from 'next';

const baseUrl = 'https://forkintheroad.app';

/**
 * Default metadata for all pages
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Fork In The Road - Restaurant Discovery & Decision Making',
    template: '%s | Fork In The Road',
  },
  description:
    'Smart restaurant discovery and group decision-making platform. Stop the endless "where should we eat?" debate with intelligent recommendations, group voting, and personalized collections.',
  keywords: [
    'restaurant decision maker',
    'where to eat',
    'group restaurant voting',
    'restaurant discovery app',
    'food decision app',
    'restaurant collections',
    'dining with friends',
    'restaurant picker',
    'group dining decisions',
    'restaurant recommendations',
  ],
  authors: [{ name: 'Andrew Persad' }],
  creator: 'Andrew Persad',
  publisher: 'Andrew Persad',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Fork In The Road',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@forkintheroad',
  },
};

/**
 * Generate metadata for dashboard page
 */
export function getDashboardMetadata(): Metadata {
  return {
    title: 'Dashboard - Your Restaurant Collections',
    description:
      'Manage your restaurant collections, view recent decisions, and access quick actions. Your personal hub for restaurant discovery and group dining decisions.',
    alternates: {
      canonical: `${baseUrl}/dashboard`,
    },
    openGraph: {
      title: 'Dashboard - Fork In The Road',
      description: 'Manage your restaurant collections and dining decisions',
      url: `${baseUrl}/dashboard`,
    },
    robots: {
      index: false, // Private page, don't index
      follow: true,
    },
  };
}

/**
 * Generate metadata for restaurants search page
 */
export function getRestaurantsMetadata(): Metadata {
  return {
    title: 'Restaurant Search - Discover New Places',
    description:
      'Search and discover restaurants near you. Browse by cuisine, price range, and ratings. Add restaurants to your collections for easy decision making.',
    alternates: {
      canonical: `${baseUrl}/restaurants`,
    },
    openGraph: {
      title: 'Restaurant Search - Fork In The Road',
      description: 'Discover restaurants near you',
      url: `${baseUrl}/restaurants`,
    },
    keywords: [
      'restaurant search',
      'find restaurants',
      'restaurant discovery',
      'nearby restaurants',
      'restaurant finder',
      'food search',
    ],
  };
}

/**
 * Generate metadata for groups page
 */
export function getGroupsMetadata(): Metadata {
  return {
    title: 'Groups - Collaborative Dining Decisions',
    description:
      'Create and manage dining groups with friends. Make collaborative restaurant decisions through voting and smart algorithms. Perfect for friend groups and regular meetups.',
    alternates: {
      canonical: `${baseUrl}/groups`,
    },
    openGraph: {
      title: 'Groups - Fork In The Road',
      description: 'Manage your dining groups and make collaborative decisions',
      url: `${baseUrl}/groups`,
    },
    keywords: [
      'dining groups',
      'group dining',
      'collaborative decisions',
      'friend groups',
      'group voting',
      'shared restaurant collections',
    ],
  };
}

/**
 * Generate metadata for friends page
 */
export function getFriendsMetadata(): Metadata {
  return {
    title: 'Friends - Connect & Share Collections',
    description:
      'Connect with friends to share restaurant collections and make group dining decisions together. Send friend requests and build your dining network.',
    alternates: {
      canonical: `${baseUrl}/friends`,
    },
    openGraph: {
      title: 'Friends - Fork In The Road',
      description: 'Connect with friends and share restaurant collections',
      url: `${baseUrl}/friends`,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}

/**
 * Generate metadata for decision history page
 */
export function getHistoryMetadata(): Metadata {
  return {
    title: 'Decision History - Track Your Restaurant Visits',
    description:
      'View your complete restaurant decision history. Track past visits, analyze dining patterns, and see how our smart weighting algorithm works.',
    alternates: {
      canonical: `${baseUrl}/history`,
    },
    openGraph: {
      title: 'Decision History - Fork In The Road',
      description: 'Track your restaurant visit history',
      url: `${baseUrl}/history`,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}

/**
 * Generate metadata for profile page
 */
export function getProfileMetadata(): Metadata {
  return {
    title: 'Profile Settings - Manage Your Account',
    description:
      'Manage your profile, notification preferences, and account settings. Customize your Fork In The Road experience.',
    alternates: {
      canonical: `${baseUrl}/profile`,
    },
    openGraph: {
      title: 'Profile - Fork In The Road',
      description: 'Manage your account settings',
      url: `${baseUrl}/profile`,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}

/**
 * Generate metadata for analytics page
 */
export function getAnalyticsMetadata(): Metadata {
  return {
    title: 'Analytics - Insights & Statistics',
    description:
      'View detailed analytics about your dining decisions, restaurant preferences, and group activity. Gain insights into your dining patterns.',
    alternates: {
      canonical: `${baseUrl}/analytics`,
    },
    openGraph: {
      title: 'Analytics - Fork In The Road',
      description: 'View your dining analytics and insights',
      url: `${baseUrl}/analytics`,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}

/**
 * Generate metadata for privacy policy page
 */
export function getPrivacyPolicyMetadata(): Metadata {
  return {
    title: 'Privacy Policy & Terms of Service',
    description:
      'Fork In The Road privacy policy and terms of service. Learn how we collect, use, and protect your information. Details on SMS notifications, data storage, and user rights.',
    alternates: {
      canonical: `${baseUrl}/privacy-policy`,
    },
    openGraph: {
      title: 'Privacy Policy - Fork In The Road',
      description: 'Our privacy policy and terms of service',
      url: `${baseUrl}/privacy-policy`,
    },
    keywords: [
      'privacy policy',
      'terms of service',
      'data protection',
      'user privacy',
      'SMS consent',
      'GDPR',
    ],
  };
}

/**
 * Generate metadata for sign-in page
 */
export function getSignInMetadata(): Metadata {
  return {
    title: 'Sign In - Access Your Account',
    description:
      'Sign in to Fork In The Road to access your restaurant collections, groups, and dining decisions. Free account with secure authentication.',
    alternates: {
      canonical: `${baseUrl}/sign-in`,
    },
    openGraph: {
      title: 'Sign In - Fork In The Road',
      description: 'Sign in to your account',
      url: `${baseUrl}/sign-in`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for sign-up page
 */
export function getSignUpMetadata(): Metadata {
  return {
    title: 'Sign Up - Create Free Account',
    description:
      'Create a free Fork In The Road account. Join thousands of users simplifying their dining decisions with smart recommendations and group voting. No credit card required.',
    alternates: {
      canonical: `${baseUrl}/sign-up`,
    },
    openGraph: {
      title: 'Sign Up - Fork In The Road',
      description: 'Create your free account today',
      url: `${baseUrl}/sign-up`,
    },
    keywords: [
      'sign up',
      'create account',
      'free registration',
      'join now',
      'get started',
    ],
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate metadata for collection detail page
 */
export function getCollectionMetadata(
  collectionName?: string,
  collectionId?: string
): Metadata {
  const title = collectionName
    ? `${collectionName} - Restaurant Collection`
    : 'Restaurant Collection';
  const description = collectionName
    ? `View and manage restaurants in ${collectionName}. Make decisions, add new restaurants, and share with friends.`
    : 'View and manage your restaurant collection. Make decisions and share with friends.';

  return {
    title,
    description,
    alternates: {
      canonical: collectionId
        ? `${baseUrl}/collections/${collectionId}`
        : undefined,
    },
    openGraph: {
      title: `${title} - Fork In The Road`,
      description,
      url: collectionId ? `${baseUrl}/collections/${collectionId}` : undefined,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}

/**
 * Generate metadata for group detail page
 */
export function getGroupMetadata(
  groupName?: string,
  groupId?: string
): Metadata {
  const title = groupName ? `${groupName} - Dining Group` : 'Dining Group';
  const description = groupName
    ? `Collaborate with ${groupName} members to make dining decisions. View group collections and participate in voting.`
    : 'Collaborate with group members to make dining decisions.';

  return {
    title,
    description,
    alternates: {
      canonical: groupId ? `${baseUrl}/groups/${groupId}` : undefined,
    },
    openGraph: {
      title: `${title} - Fork In The Road`,
      description,
      url: groupId ? `${baseUrl}/groups/${groupId}` : undefined,
    },
    robots: {
      index: false, // Private page
      follow: true,
    },
  };
}
