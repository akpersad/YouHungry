import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForkRoom } from '../ForkRoom';
import type { ForkView } from '@/lib/v2/forks';

// jsdom has no EventSource; the room opens one for live forks.
class StubEventSource {
  static instances: StubEventSource[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  url: string;
  closed = false;
  constructor(url: string) {
    this.url = url;
    StubEventSource.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}

beforeAll(() => {
  (global as unknown as { EventSource: unknown }).EventSource = StubEventSource;
});

beforeEach(() => {
  StubEventSource.instances = [];
  (global.fetch as jest.Mock).mockReset();
});

const OPTIONS = [
  { id: 'a'.repeat(24), name: 'Sushi Yama' },
  { id: 'b'.repeat(24), name: 'Taco Bravo' },
  { id: 'c'.repeat(24), name: 'Pho Lantern' },
  { id: 'd'.repeat(24), name: 'Seoul Ember' },
];

function view(overrides: Partial<ForkView> = {}): ForkView {
  return {
    code: 'testfork22',
    mode: 'vote',
    status: 'open',
    sourceKind: 'ad-hoc',
    organizerName: 'Olivia',
    isOrganizer: false,
    options: OPTIONS,
    quorum: 3,
    closesAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    voteCount: 0,
    voterNames: [],
    myRankings: null,
    result: null,
    breakdown: null,
    ...overrides,
  };
}

function closedView(): ForkView {
  return view({
    status: 'closed',
    voteCount: 3,
    voterNames: ['Olivia', 'Marco', 'Mia'],
    result: {
      placeId: OPTIONS[1].id,
      name: OPTIONS[1].name,
      decidedAt: new Date().toISOString(),
      reasoning: 'Clear winner with 7 points (3 votes total)',
      weights: {},
    },
    breakdown: {
      [OPTIONS[0].id]: { first: 1, second: 0, third: 1, total: 4 },
      [OPTIONS[1].id]: { first: 2, second: 0, third: 1, total: 7 },
      [OPTIONS[2].id]: { first: 0, second: 1, third: 0, total: 2 },
      [OPTIONS[3].id]: { first: 0, second: 0, third: 0, total: 0 },
    },
  });
}

describe('ForkRoom — open vote', () => {
  it('ranks by tap (max 3, re-tap removes) and casts the ballot', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fork: view({ myRankings: [OPTIONS[0].id], voteCount: 1 }),
        }),
    });

    render(<ForkRoom initial={view()} />);

    await user.click(screen.getByRole('button', { name: /Sushi Yama/ }));
    await user.click(screen.getByRole('button', { name: /Taco Bravo/ }));
    await user.click(screen.getByRole('button', { name: /Pho Lantern/ }));
    // Ballot is full — the fourth tap bounces.
    await user.click(screen.getByRole('button', { name: /Seoul Ember/ }));
    expect(screen.getByText(/Ballot full/)).toBeInTheDocument();
    // Re-tap removes the second pick.
    await user.click(screen.getByRole('button', { name: /Taco Bravo/ }));

    await user.click(screen.getByRole('button', { name: 'Cast your vote' }));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.rankings).toEqual([OPTIONS[0].id, OPTIONS[2].id]);
    // Server acked the ballot.
    expect(await screen.findByText(/Your ballot is in/)).toBeInTheDocument();
  });

  it('plays the reveal and shows the tally when the SSE close arrives', async () => {
    render(<ForkRoom initial={view({ voteCount: 2 })} />);

    expect(StubEventSource.instances).toHaveLength(1);
    const stream = StubEventSource.instances[0];
    expect(stream.url).toContain('/api/v2/forks/testfork22/live');

    // The quorum lands elsewhere; the stream delivers the close.
    const { act } = await import('react');
    await act(async () => {
      stream.onmessage?.({
        data: JSON.stringify({ type: 'fork', fork: closedView() }),
      });
    });

    // Theater is up — skip it.
    const skip = await screen.findByRole('button', {
      name: 'Skip to the result',
    });
    await userEvent.setup().click(skip);

    expect(await screen.findByText('The tally')).toBeInTheDocument();
    expect(screen.getByText('Winner')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

describe('ForkRoom — terminal states on load', () => {
  it('shows a closed fork instantly with no theater', () => {
    render(<ForkRoom initial={closedView()} />);
    expect(screen.getByText("We're going here.")).toBeInTheDocument();
    expect(screen.getByText('The tally')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Skip to the result' })
    ).not.toBeInTheDocument();
    // No stream for a settled fork.
    expect(StubEventSource.instances).toHaveLength(0);
  });

  it('shows the expired invitation', () => {
    render(<ForkRoom initial={view({ status: 'expired' })} />);
    expect(
      screen.getByText('The timer ran out before anyone decided')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Start another fork' })
    ).toBeVisible();
  });
});

describe('ForkRoom — spin mode', () => {
  it('gives the organizer the lever', () => {
    render(<ForkRoom initial={view({ mode: 'spin', isOrganizer: true })} />);
    expect(
      screen.getByRole('button', { name: 'Spin the board' })
    ).toBeEnabled();
  });

  it('non-organizers wait', () => {
    render(<ForkRoom initial={view({ mode: 'spin', code: 'other12345' })} />);
    expect(
      screen.getByText(/Only Olivia can pull the lever/)
    ).toBeInTheDocument();
  });
});
