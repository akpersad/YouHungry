import type { NextConfig } from 'next';

import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Turbopack is the default in Next 16; the webpack config below may only be
// present when explicitly building with `next build --webpack`, otherwise
// Next fails the build to prevent misconfiguration.
const isUsingWebpack = process.argv.includes('--webpack');

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // The /beta prefix retired at the Phase 7 cutover; links shared before
  // it (fork links in group chats especially) must keep working.
  async redirects() {
    return [
      { source: '/beta', destination: '/', permanent: true },
      { source: '/beta/:path*', destination: '/:path*', permanent: true },
    ];
  },

  // Headers for caching
  async headers() {
    return [
      // Immutable is only true in production, where chunk filenames are
      // content-hashed. In dev the URLs are stable across edits, so this
      // header makes browsers serve year-old chunks and hydration fails
      // with stale-JS-vs-fresh-HTML mismatches (Next warns about exactly
      // this at dev startup).
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ]
        : []),
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Webpack optimizations (only for explicit `next build --webpack`)
  ...(isUsingWebpack && {
    webpack: (config, { dev, isServer }) => {
      // Production optimizations
      if (!dev && !isServer) {
        // Enable tree shaking
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;

        // Optimize chunks
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              chunks: 'all',
              priority: 15,
            },
          },
        };
      }

      return config;
    },
  }),

  // Bundle analyzer (webpack-only; `npm run analyze` uses build:webpack)
  ...(process.env.ANALYZE === 'true' &&
    isUsingWebpack && {
      webpack: (config, { isServer }) => {
        if (!isServer) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: './performance-metrics/bundle-analysis.html',
            })
          );
        }
        return config;
      },
    }),
};

export default bundleAnalyzer(nextConfig);
