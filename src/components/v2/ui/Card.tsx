import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from './cx';

/**
 * v2 Card — one elevation story per element: light mode lifts with a tinted
 * layered shadow OR sits flat with a hairline, never both; dark mode
 * elevates by surface lightness. Radius 16 (cards) per the identity scale.
 *
 * `interactive` adds hover/press/focus affordances for cards that act as a
 * single link/button target (consumer supplies the semantics — wrap in a
 * <Link> or pass role/tabIndex via props when the whole card is the control).
 */
export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'raised' | 'outline';
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'raised', interactive = false, className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'rounded-2xl bg-surface p-4',
        variant === 'raised'
          ? 'shadow-lift dark:shadow-none'
          : 'border border-line',
        interactive &&
          'outline-none motion-safe:transition-[transform,background-color] motion-safe:duration-100 motion-safe:ease-snap ' +
            'hover:bg-sunken active:scale-[0.99] cursor-pointer ' +
            'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        className
      )}
      {...rest}
    />
  );
});
