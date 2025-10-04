/**
 * Cache busting utilities for admin components
 */

export function getCacheBuster(): string {
  return `_cb=${Date.now()}`;
}

export function addCacheBusterToUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${getCacheBuster()}`;
}

export function createCacheBustingHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'Last-Modified': new Date().toUTCString(),
  };
}

export function fetchWithCacheBusting(url: string, options: RequestInit = {}) {
  const cacheBustedUrl = addCacheBusterToUrl(url);

  return fetch(cacheBustedUrl, {
    ...options,
    headers: {
      ...createCacheBustingHeaders(),
      ...options.headers,
    },
  });
}
