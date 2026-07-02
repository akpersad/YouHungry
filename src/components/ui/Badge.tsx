import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Tint-background badges (DESIGN.md): light accent fill + mid-tone accent
// text in light mode; tokens flip to dark fill + bright text in dark mode.
const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--tomato)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-[var(--tomato-tint)] text-[var(--tomato)]',
        secondary: 'bg-[var(--surface-sunken)] text-[var(--ink-secondary)]',
        success: 'bg-[var(--olive-tint)] text-[var(--olive)]',
        warning: 'bg-[var(--saffron-tint)] text-[var(--on-saffron)]',
        destructive: 'bg-[var(--color-error)] text-[var(--on-tomato)]',
        outline: 'border-[var(--border)] text-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
