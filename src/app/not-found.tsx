/**
 * 404 Not Found Page
 *
 * On-brand typographic 404 with helpful navigation
 */

'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <main className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-3">
          <p className="font-display text-8xl text-tomato" aria-hidden>
            404
          </p>
          <h1 className="font-display text-3xl text-ink">
            This page isn&apos;t on the menu
          </h1>
          <p className="text-lg text-ink-secondary text-pretty">
            It may have moved, or it never existed. Either way, there&apos;s
            nothing to eat here.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button variant="primary" className="min-w-[200px]">
              <Home className="h-5 w-5 mr-2" />
              Go home
            </Button>
          </Link>

          <Link href="/restaurants">
            <Button variant="secondary" className="min-w-[200px]">
              <Search className="h-5 w-5 mr-2" />
              Search restaurants
            </Button>
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-tomato"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the previous page
        </button>
      </main>
    </div>
  );
}
