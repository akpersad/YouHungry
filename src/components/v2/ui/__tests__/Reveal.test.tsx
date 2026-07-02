import { render, screen, fireEvent, act } from '@testing-library/react';
import { Reveal } from '../Reveal';

const candidates = ['Blue Ribbon', 'Taqueria Norte', 'Golden Duck'];

describe('v2 Reveal', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('ticks through the pool without teasing the winner, then locks', () => {
    const onDone = jest.fn();
    render(
      <Reveal
        candidates={candidates}
        winner="Golden Duck"
        onDone={onDone}
        reduceMotion={false}
      />
    );

    // Mid-spin: skip affordance is present, winner is never on the board.
    expect(
      screen.getByRole('button', { name: 'Skip to the result' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Golden Duck')).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    // Each tick's timeout is scheduled from an effect, which only flushes
    // when act() ends — so advance the clock one act per tick.
    for (let i = 0; i < 13; i++) {
      act(() => {
        jest.advanceTimersByTime(500);
      });
    }

    expect(screen.getByText('Golden Duck')).toBeInTheDocument();
    expect(screen.getByText("We're going here.")).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      "We're going to Golden Duck."
    );
  });

  it('tap skips straight to the result', () => {
    const onDone = jest.fn();
    render(
      <Reveal
        candidates={candidates}
        winner="Taqueria Norte"
        onDone={onDone}
        reduceMotion={false}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Skip to the result' }));
    expect(screen.getByText('Taqueria Norte')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reduced motion goes straight to the locked result', () => {
    const onDone = jest.fn();
    render(
      <Reveal
        candidates={candidates}
        winner="Blue Ribbon"
        onDone={onDone}
        reduceMotion
      />
    );
    expect(screen.getByText('Blue Ribbon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders the why-this-pick context after the lock', () => {
    render(
      <Reveal
        candidates={candidates}
        winner="Blue Ribbon"
        context={<span>You haven't been in 3 weeks.</span>}
        reduceMotion
      />
    );
    expect(
      screen.getByText("You haven't been in 3 weeks.")
    ).toBeInTheDocument();
  });
});
