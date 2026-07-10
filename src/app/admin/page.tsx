import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAPIUsageStats, getCacheHitRate } from '@/lib/api-usage-tracker';
import { getV2User } from '@/lib/v2/auth';
import { adminWindowStart, isAdminUser } from '@/lib/v2/admin';
import { getV2Db } from '@/lib/v2/db';
import { V2_COLLECTIONS } from '@/lib/v2/schema';
import type { ServerErrorDoc } from '@/lib/v2/error-log';
import { Card } from '@/components/v2/ui';

export const metadata: Metadata = {
  title: 'Admin · Fork In The Road',
  robots: { index: false, follow: false },
};

// Reads live operational data on every request.
export const dynamic = 'force-dynamic';

/**
 * The minimal admin page (WORKPLAN Phase 7): third-party spend and recent
 * server errors, nothing else. Heavier observability is Vercel Analytics /
 * Speed Insights and the provider dashboards. Owner-only: anyone not in
 * ADMIN_USER_IDS gets a 404, not a hint.
 */
export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent('/admin')}`);
  }
  const user = await getV2User();
  if (!user || !isAdminUser(user)) {
    notFound();
  }

  const since = adminWindowStart();
  const { db } = await getV2Db();
  const [usage, cache, errors] = await Promise.all([
    getAPIUsageStats(since),
    getCacheHitRate(since),
    db
      .collection<ServerErrorDoc>(V2_COLLECTIONS.errorLogs)
      .find({ at: { $exists: true } })
      .sort({ at: -1 })
      .limit(50)
      .toArray(),
  ]);

  const rows = (
    Object.entries(usage.byType) as [
      string,
      { count: number; cost: number; costPerCall: number },
    ][]
  ).sort(([, a], [, b]) => b.cost - a.cost);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="type-board text-sm text-ink-muted">Back office</p>
        <h1 className="type-board text-3xl text-ink">Spend and errors</h1>
        <p className="text-sm text-ink-secondary">
          Last 30 days. Traffic and performance live in Vercel Analytics.
        </p>
      </div>

      <section aria-label="API spend" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Third-party calls</h2>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-ink">
              {usage.totalCalls} billed calls · ~${usage.totalCost.toFixed(2)}{' '}
              estimated · cache hit rate {cache.hitRate}%
            </p>
            {rows.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                No billed API calls in the window.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-ink-muted">
                      <th scope="col" className="py-1 pr-4 font-normal">
                        API
                      </th>
                      <th scope="col" className="py-1 pr-4 font-normal">
                        Calls
                      </th>
                      <th scope="col" className="py-1 font-normal">
                        Est. cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {rows.map(([apiType, row]) => (
                      <tr key={apiType} className="border-t border-line">
                        <td className="py-1.5 pr-4">{apiType}</td>
                        <td className="py-1.5 pr-4">{row.count}</td>
                        <td className="py-1.5">${row.cost.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section aria-label="Server errors" className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Server errors</h2>
        <Card>
          <div className="flex flex-col gap-2">
            {errors.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                No unexpected 500s in the window. Good sign.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {errors.map((entry) => (
                  <li
                    key={entry._id?.toString()}
                    className="border-t border-line pt-2 first:border-t-0 first:pt-0"
                  >
                    <p className="font-mono text-xs break-all text-ink-muted">
                      {entry.at.toISOString()} · {entry.route}
                    </p>
                    <p className="text-sm break-words text-ink">
                      {entry.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
