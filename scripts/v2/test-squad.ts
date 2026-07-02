/**
 * The v2 dev-instance test squad (WORKPLAN Phase 1). Emails use Clerk's
 * `+clerk_test` convention: on a DEV instance they verify with the fixed
 * OTP 424242 and never send real email. The password is dev-instance-only
 * (override with TEST_SQUAD_PASSWORD; the seed script applies it).
 *
 * Shared by the seed script, the exit-demo script, and Playwright — one
 * definition, no drift.
 */

export interface SquadMember {
  /** Stable handle used in scripts/tests. */
  role: 'organizer' | 'member1' | 'member2' | 'claimer' | 'fresh';
  email: string;
  firstName: string;
  lastName: string;
  /** What shows on fork pages. */
  displayName: string;
  /** Whether the seed script gives this user decision history. */
  seedsHistory: boolean;
}

export const TEST_SQUAD: SquadMember[] = [
  {
    role: 'organizer',
    email: 'fitr.organizer+clerk_test@example.com',
    firstName: 'Olivia',
    lastName: 'Organizer',
    displayName: 'Olivia',
    seedsHistory: true,
  },
  {
    role: 'member1',
    email: 'fitr.member1+clerk_test@example.com',
    firstName: 'Marco',
    lastName: 'Member',
    displayName: 'Marco',
    seedsHistory: true,
  },
  {
    role: 'member2',
    email: 'fitr.member2+clerk_test@example.com',
    firstName: 'Mia',
    lastName: 'Member',
    displayName: 'Mia',
    seedsHistory: false,
  },
  {
    // Votes as a guest first, then claims the votes into an account (Phase 4).
    role: 'claimer',
    email: 'fitr.claimer+clerk_test@example.com',
    firstName: 'Casey',
    lastName: 'Claimer',
    displayName: 'Casey',
    seedsHistory: false,
  },
  {
    // Brand-new user with zero history — first-run journeys.
    role: 'fresh',
    email: 'fitr.fresh+clerk_test@example.com',
    firstName: 'Finn',
    lastName: 'Fresh',
    displayName: 'Finn',
    seedsHistory: false,
  },
];

export const SQUAD_PASSWORD =
  process.env.TEST_SQUAD_PASSWORD ?? 'fitr-v2-squad-Pw!2026';

/** Clerk dev-instance fixed OTP for +clerk_test addresses. */
export const CLERK_TEST_OTP = '424242';
