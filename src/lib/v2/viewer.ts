import { getV2User, participantFromUser } from './auth';
import {
  findGuestByCookie,
  getClaimedGuestIds,
  participantFromGuest,
} from './guests';
import type { Participant } from './schema';

/**
 * Who is looking at a fork. One resolution order everywhere (page, GET,
 * SSE, vote): a Clerk session wins, then a signed guest cookie, then
 * anonymous. Anonymous viewers still see the fork — knowing the unguessable
 * code is the capability — they just can't act until they vote (which mints
 * their guest identity).
 */
export interface ForkViewer {
  kind: 'user' | 'guest' | 'anonymous';
  participant: Participant | null;
  /** Guest identities a signed-in viewer claimed (identity continuity). */
  claimedGuestIds: string[];
}

export async function resolveForkViewer(
  guestCookieValue: string | undefined
): Promise<ForkViewer> {
  const user = await getV2User();
  if (user) {
    return {
      kind: 'user',
      participant: participantFromUser(user),
      claimedGuestIds: await getClaimedGuestIds(user._id),
    };
  }

  const guest = await findGuestByCookie(guestCookieValue);
  if (guest) {
    return {
      kind: 'guest',
      participant: participantFromGuest(guest),
      claimedGuestIds: [],
    };
  }

  return { kind: 'anonymous', participant: null, claimedGuestIds: [] };
}
