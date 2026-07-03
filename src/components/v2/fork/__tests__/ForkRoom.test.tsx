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

describe('ForkRoom — guest voting (Phase 4)', () => {
  const guestProps = {
    viewer: { kind: 'anonymous' as const, displayName: null },
    forkToken: 'payload.sig',
  };

  it('requires a name before a guest ballot leaves the browser', async () => {
    const user = userEvent.setup();
    render(<ForkRoom initial={view()} {...guestProps} />);

    await user.click(screen.getByRole('button', { name: /Sushi Yama/ }));
    await user.click(screen.getByRole('button', { name: 'Cast your vote' }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText('Pick a name so the group knows who voted')
    ).toBeInTheDocument();
    const nameField = screen.getByLabelText(/Your name/);
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
  });

  it('sends the fork token and name with a guest ballot, then owns it', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fork: view({ myRankings: [OPTIONS[0].id], voteCount: 1 }),
          viewer: { kind: 'guest', displayName: 'Sam' },
        }),
    });

    render(<ForkRoom initial={view()} {...guestProps} />);

    await user.click(screen.getByRole('button', { name: /Sushi Yama/ }));
    await user.type(screen.getByLabelText(/Your name/), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Cast your vote' }));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toEqual({
      rankings: [OPTIONS[0].id],
      forkToken: 'payload.sig',
      displayName: 'Sam',
    });
    expect(await screen.findByText(/Your ballot is in/)).toBeInTheDocument();
    expect(screen.getByText(/Voting as Sam/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create an account' })
    ).toBeInTheDocument();
  });

  it('keeps the ballot state when an anonymous-connected stream says otherwise', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fork: view({ myRankings: [OPTIONS[0].id], voteCount: 1 }),
        }),
    });

    render(<ForkRoom initial={view()} {...guestProps} />);
    await user.click(screen.getByRole('button', { name: /Sushi Yama/ }));
    await user.type(screen.getByLabelText(/Your name/), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Cast your vote' }));
    await screen.findByText(/Your ballot is in/);

    // The stream was opened before the guest cookie existed, so its frames
    // carry myRankings: null — the room must not forget the cast ballot.
    const stream = StubEventSource.instances[0];
    const { act } = await import('react');
    await act(async () => {
      stream.onmessage?.({
        data: JSON.stringify({
          type: 'fork',
          fork: view({ myRankings: null, voteCount: 1 }),
        }),
      });
    });
    expect(screen.getByText(/Your ballot is in/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update your vote' })
    ).toBeInTheDocument();
  });

  it('signed-in members never see the name field', () => {
    render(<ForkRoom initial={view()} />);
    expect(screen.queryByLabelText(/Your name/)).not.toBeInTheDocument();
  });
});

describe('ForkRoom — claim your votes', () => {
  it('offers the claim and confirms it', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ claimed: true, guestDisplayName: 'Sam' }),
    });

    render(<ForkRoom initial={closedView()} claimGuestName="Sam" />);

    expect(
      screen.getByText(/Votes cast in this browser as Sam/)
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Claim your votes' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/v2/guests/claim', {
      method: 'POST',
    });
    expect(
      await screen.findByText(/Votes cast as Sam are yours now/)
    ).toBeInTheDocument();
  });

  it('surfaces a failed claim and lets the viewer retry', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: 'These votes were already claimed by another account',
        }),
    });

    render(<ForkRoom initial={closedView()} claimGuestName="Sam" />);
    await user.click(screen.getByRole('button', { name: 'Claim your votes' }));

    expect(
      await screen.findByText(
        'These votes were already claimed by another account'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Claim your votes' })
    ).toBeEnabled();
  });

  it('never shows the banner without an unclaimed guest identity', () => {
    render(<ForkRoom initial={closedView()} />);
    expect(screen.queryByText(/Claim your votes/)).not.toBeInTheDocument();
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
