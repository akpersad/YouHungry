import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Controllable reduced-motion + prop-stripping motion mock.
let mockReduced = true;
jest.mock('framer-motion', () => {
  const ReactLib = jest.requireActual('react');
  const strip = (tag: string) =>
    function MotionMock({ children, ...props }: Record<string, unknown>) {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileTap,
        ...rest
      } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      void variants;
      void whileHover;
      void whileTap;
      return ReactLib.createElement(tag, rest, children as React.ReactNode);
    };
  return {
    useReducedMotion: () => mockReduced,
    motion: new Proxy({}, { get: (_t, tag: string) => strip(tag) }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { SpinReveal } from '../SpinReveal';

describe('SpinReveal', () => {
  afterEach(() => {
    mockReduced = true;
    jest.useRealTimers();
  });

  it('reveals the winner immediately under reduced motion and calls onComplete', () => {
    mockReduced = true;
    const onComplete = jest.fn();
    render(
      <SpinReveal
        names={['Pho House', 'Taco Cart', 'Sushi Bar']}
        winner="Sushi Bar"
        onComplete={onComplete}
      />
    );
    expect(screen.getByText('Sushi Bar')).toBeInTheDocument();
    expect(screen.getByText('Tonight you eat at')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('lands on the winner and calls onComplete after the animated cycle', () => {
    mockReduced = false;
    jest.useFakeTimers();
    const onComplete = jest.fn();
    render(
      <SpinReveal
        names={['Pho House', 'Taco Cart']}
        winner="Taco Cart"
        onComplete={onComplete}
      />
    );
    // Mid-spin: onComplete not fired yet.
    expect(onComplete).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Taco Cart')).toBeInTheDocument();
  });
});
