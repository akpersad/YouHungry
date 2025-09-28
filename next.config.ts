import type { NextConfig } from 'next';

import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'fs/promises': false,
        'timers/promises': false,
      };
    }
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        '*.js': {
          loaders: ['babel-loader'],
          as: '*.js',
        },
      },
      resolveAlias: {
        fs: 'false',
        net: 'false',
        tls: 'false',
        dns: 'false',
        child_process: 'false',
        'fs/promises': 'false',
        'timers/promises': 'false',
      },
    },
  },
};

export default bundleAnalyzer(nextConfig);
