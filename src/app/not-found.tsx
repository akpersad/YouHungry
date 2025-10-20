/**
 * 404 Not Found Page
 *
 * Custom 404 page with friendly mascot and helpful navigation
 */

'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Mascot } from '@/components/errors/Mascot';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Mascot */}
        <div className="flex justify-center">
          <Mascot pose="searching" size={250} />
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold">404</h1>
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="text-lg">
            Looks like Nibbles couldn&apos;t find what you&apos;re looking for.
            <br />
            This page might have been moved or doesn&apos;t exist.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button variant="primary" className="min-w-[200px]">
              <Home className="h-5 w-5 mr-2" />
              Go to Home
            </Button>
          </Link>

          <Link href="/restaurants">
            <Button variant="secondary" className="min-w-[200px]">
              <Search className="h-5 w-5 mr-2" />
              Search Restaurants
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-accent-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back to previous page
        </button>

        {/* Fun Fact */}
        <div
          className="mt-8 p-4 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <p className="text-sm">
            💡 <strong>Fun fact:</strong> The 404 error has been around since
            the early days of the web. Some say it originated from room 404 at
            CERN where the first web server was located!
          </p>
        </div>
      </div>
    </div>
  );
}
