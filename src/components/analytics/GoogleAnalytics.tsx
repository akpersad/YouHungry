'use client';

import { useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { setAnalyticsUserId, trackPageView } from '@/lib/analytics';

function GoogleAnalyticsInner() {
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Set user ID when user is authenticated
  useEffect(() => {
    if (user?.id) {
      setAnalyticsUserId(user.id);
    }
  }, [user?.id]);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Only render in production with valid measurement ID
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: false, // We'll handle this manually
              anonymize_ip: true, // Anonymize IP addresses
              cookie_flags: 'SameSite=None;Secure', // Cookie settings
            });
            
            // Enable enhanced measurement
            gtag('config', '${GA_MEASUREMENT_ID}', {
              enhanced_measurement: {
                scrolls: true,
                outbound_clicks: true,
                site_search: true,
                video_engagement: true,
                file_downloads: true,
              }
            });
          `,
        }}
      />
      {/* Wrap in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <GoogleAnalyticsInner />
      </Suspense>
    </>
  );
}
