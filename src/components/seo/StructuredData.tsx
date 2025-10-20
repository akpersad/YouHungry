/**
 * Structured Data (JSON-LD) Components for SEO and GEO Optimization
 * These components provide rich metadata to search engines and AI models
 * for better understanding and representation of Fork In The Road
 */

import Script from 'next/script';

/**
 * Organization structured data
 * Defines Fork In The Road as a software application organization
 */
export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fork In The Road',
    alternateName: 'Fork In The Road App',
    url: 'https://forkintheroad.app',
    logo: 'https://forkintheroad.app/icons/icon-512x512.svg',
    description:
      'A smart restaurant discovery and group decision-making platform that helps friends decide where to eat together.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Andrew Persad',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'nodemailer_persad@yahoo.com',
      contactType: 'Customer Support',
      availableLanguage: 'English',
    },
    sameAs: [],
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Web Application structured data
 * Defines the app's features, capabilities, and platform information
 */
export function WebApplicationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Fork In The Road',
    applicationCategory: 'FoodEstablishmentReservationApplication',
    operatingSystem: 'Web Browser, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Restaurant search and discovery',
      'Personal restaurant collections',
      'Group decision making with voting',
      'Smart recommendation algorithm',
      'Friend and group management',
      'Real-time notifications',
      'Progressive Web App (PWA) support',
      'Cross-platform compatibility',
    ],
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '0.1.0',
    author: {
      '@type': 'Person',
      name: 'Andrew Persad',
    },
    url: 'https://forkintheroad.app',
    installUrl: 'https://forkintheroad.app',
    screenshot: [
      'https://forkintheroad.app/screenshots/dashboard.png',
      'https://forkintheroad.app/screenshots/restaurant-search.png',
    ],
    description:
      'Stop the endless "where should we eat?" debate. Fork In The Road uses smart decision algorithms and group voting to help you and your friends choose the perfect restaurant every time. Create collections, invite friends, and make dining decisions together with ease.',
  };

  return (
    <Script
      id="webapp-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Software Application structured data
 * More detailed technical information about the application
 */
export function SoftwareApplicationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Fork In The Road',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'A smart restaurant discovery and collaborative decision-making platform that eliminates the endless debate of "where should we eat?" through intelligent algorithms, group voting, and personalized recommendations.',
    screenshot: [
      'https://forkintheroad.app/screenshots/dashboard.png',
      'https://forkintheroad.app/screenshots/restaurant-search.png',
    ],
    softwareHelp: {
      '@type': 'CreativeWork',
      url: 'https://forkintheroad.app/privacy-policy',
    },
    author: {
      '@type': 'Person',
      name: 'Andrew Persad',
    },
    datePublished: '2024-01-01',
    softwareVersion: '0.1.0',
  };

  return (
    <Script
      id="software-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * FAQ structured data
 * Provides common questions and answers for GEO optimization
 */
export function FAQStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Fork In The Road?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Fork In The Road is a smart restaurant discovery and group decision-making platform that helps friends decide where to eat together. It eliminates the endless "where should we eat?" debate through intelligent algorithms, personalized collections, and collaborative voting systems.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the group decision making work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Fork In The Road offers two decision-making methods: (1) Random Selection - uses a smart weighting algorithm that considers recent visits to ensure variety while respecting preferences, and (2) Tiered Voting - allows group members to rank their restaurant preferences, and the system calculates the best choice based on everyone's input.",
        },
      },
      {
        '@type': 'Question',
        name: 'Is Fork In The Road free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Fork In The Road is completely free to use. You can create collections, search for restaurants, form groups with friends, and make unlimited decisions without any cost.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the smart weighting algorithm?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The smart weighting algorithm tracks your restaurant visits over a 30-day rolling period. Recently visited restaurants automatically receive lower priority in random selections, ensuring you discover new places while still allowing your favorites to appear. This keeps your dining choices fresh and exciting.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use Fork In The Road on my phone?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Absolutely! Fork In The Road is built as a Progressive Web App (PWA) that works seamlessly on all devices - desktop, tablet, and mobile. You can even install it on your phone's home screen for a native app-like experience without downloading from an app store.",
        },
      },
      {
        '@type': 'Question',
        name: 'How do I create restaurant collections?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Creating collections is simple: (1) Go to your Dashboard, (2) Click "Create Collection", (3) Give it a name like "Date Night Spots" or "Quick Lunch", (4) Search for restaurants using our integrated Google Places search, and (5) Add restaurants to your collection. You can create unlimited personal collections and share group collections with friends.',
        },
      },
      {
        '@type': 'Question',
        name: 'What restaurants can I search for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Fork In The Road integrates with Google Places API and Yelp Fusion API, giving you access to millions of restaurants worldwide. Search by location, cuisine type, price range, or restaurant name to discover dining options anywhere.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the group voting system work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "When a group needs to decide on a restaurant, members can participate in tiered voting by ranking their top choices. Each person orders their preferences from most to least favorite. The system then calculates the optimal choice based on everyone's rankings, ensuring the decision reflects the group's collective preference.",
        },
      },
      {
        '@type': 'Question',
        name: 'Can I track my restaurant visit history?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Fork In The Road automatically tracks all decisions made through the app. You can view your complete history of restaurant visits, including personal decisions and group decisions, along with dates and decision methods used. This history also powers the smart weighting algorithm.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need to create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, a free account is required to use Fork In The Road. This allows you to save your collections, maintain your history, connect with friends, and participate in group decisions. You can sign up using email or phone number through our secure Clerk authentication.',
        },
      },
    ],
  };

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * BreadcrumbList structured data
 * Helps search engines understand site navigation
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * WebSite structured data with SearchAction
 * Enables search functionality in search results
 */
export function WebSiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fork In The Road',
    alternateName: 'Fork In The Road App',
    url: 'https://forkintheroad.app',
    description:
      'Smart restaurant discovery and group decision-making platform',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://forkintheroad.app/restaurants?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
