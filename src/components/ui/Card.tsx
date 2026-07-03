import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  as?: 'article' | 'section' | 'div';
}

const Card = forwardRef<HTMLElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      as: Component = 'div',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        className={cn(
          'card-base',
          {
            'card-elevated': variant === 'elevated',
            'p-sm': padding === 'sm',
            'p-md': padding === 'md',
            'p-lg': padding === 'lg',
          },
          className
        )}
        ref={ref as unknown as React.Ref<HTMLDivElement>}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex flex-col space-y-1.5 pb-4', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardHeader.displayName = 'CardHeader';

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level must fit the PAGE outline, not the card — a card that is
   * a top-level section under the h1 needs h2, or heading order breaks
   * whenever sibling sections are loading/empty (axe heading-order). */
  as?: 'h2' | 'h3' | 'h4';
};

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Heading = 'h3', ...props }, ref) => {
    return (
      <Heading
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-ink',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={cn('text-sm text-ink-muted', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardDescription.displayName = 'CardDescription';

type CardContentProps = HTMLAttributes<HTMLDivElement>;

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn('pt-0', className)} ref={ref} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn('flex items-center pt-4', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
