'use client';

import { lazy, Suspense } from 'react';

// Lazy load PWA components
const PWAInstallPrompt = lazy(() =>
  import('./PWAStatusIndicator').then((module) => ({
    default: module.PWAInstallPrompt,
  }))
);

const PWAOfflineBanner = lazy(() =>
  import('./PWAStatusIndicator').then((module) => ({
    default: module.PWAOfflineBanner,
  }))
);

export function LazyPWAInstallPrompt() {
  return (
    <Suspense fallback={null}>
      <PWAInstallPrompt />
    </Suspense>
  );
}

export function LazyPWAOfflineBanner() {
  return (
    <Suspense fallback={null}>
      <PWAOfflineBanner />
    </Suspense>
  );
}
