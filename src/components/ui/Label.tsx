import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium text-text dark:text-text-light',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
