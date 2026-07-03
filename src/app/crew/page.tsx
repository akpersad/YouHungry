import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getV2User } from '@/lib/v2/auth';
import { getCrewSuggestionsForUser, getCrewsForUser } from '@/lib/v2/crews';
import { getHistoryForUser } from '@/lib/v2/forks';
import {
  CrewLane,
  type HistoryStats,
  type SuggestionView,
} from '@/components/v2/crew/CrewLane';

export const metadata: Metadata = { title: 'Crew · Fork In The Road' };

/** Keep a joined-names crew default under the 40-char name limit. */
function defaultCrewName(names: string[]): string {
  let kept = names.length;
  while (kept > 1) {
    const shown = names.slice(0, kept);
    const base =
      shown.length > 1
        ? `${shown.slice(0, -1).join(', ')} & ${shown[shown.length - 1]}`
        : shown[0];
    const extra = names.length - kept;
    const candidate = extra > 0 ? `${base} +${extra}` : base;
    if (candidate.length <= 40) return candidate;
    kept -= 1;
  }
  return `${names[0]} & co`.slice(0, 40);
}

/**
 * The Crew lane: suggestions derived from the fork record, existing crews,
 * and the history that produced them. Account territory like Places.
 */
export default async function CrewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?next=${encodeURIComponent('/crew')}`);
  }
  const user = await getV2User();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent('/crew')}`);
  }

  const [suggestions, crews, history] = await Promise.all([
    getCrewSuggestionsForUser(user._id),
    getCrewsForUser(user._id),
    getHistoryForUser(user._id),
  ]);

  const me = user._id.toString();
  const suggestionViews: SuggestionView[] = suggestions.map((suggestion) => {
    // "You" leads the display line; the stored name uses real first names
    // (the crew is shared — "You" means someone different to each member).
    const others = suggestion.memberNames.filter(
      (_, index) => suggestion.memberIds[index] !== me
    );
    const displayLine =
      others.length > 1
        ? `You, ${others.slice(0, -1).join(', ')} & ${others[others.length - 1]}`
        : `You & ${others[0] ?? 'company'}`;
    return {
      memberIds: suggestion.memberIds,
      displayLine,
      defaultName: defaultCrewName(suggestion.memberNames),
      forkCount: suggestion.forkCount,
    };
  });

  const counts = new Map<string, number>();
  for (const entry of history) {
    counts.set(entry.winnerName, (counts.get(entry.winnerName) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const stats: HistoryStats = {
    total: history.length,
    distinctPlaces: counts.size,
    topPlace: top ? { name: top[0], count: top[1] } : null,
  };

  return (
    <CrewLane
      suggestions={suggestionViews}
      crews={crews.map((crew) => ({
        id: crew._id.toString(),
        name: crew.name,
        memberCount: crew.memberIds.length,
      }))}
      history={history}
      stats={stats}
    />
  );
}
