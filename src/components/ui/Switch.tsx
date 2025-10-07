import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  srLabel?: string;
}

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  label,
  srLabel,
  id,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(event.target.checked);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Space and Enter to toggle the switch
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onCheckedChange?.(!checked);
    }
  };

  return (
    <label
      htmlFor={switchId}
      className="relative inline-flex items-center cursor-pointer"
    >
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="sr-only peer"
        aria-checked={checked}
        aria-label={srLabel || label}
        {...props}
      />
      <div
        className={cn(
          'relative w-11 h-6 rounded-full peer transition-all duration-200',
          'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2',
          'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
          'after:bg-white after:rounded-full after:h-5 after:w-5',
          'after:transition-all after:duration-200',
          {
            'bg-accent peer-checked:bg-accent-primary peer-focus:ring-accent':
              checked,
            'bg-quaternary peer-focus:ring-quaternary': !checked,
            'peer-checked:after:translate-x-full': checked,
            'opacity-50 cursor-not-allowed': props.disabled,
          },
          className
        )}
        style={{
          backgroundColor: checked
            ? 'var(--accent-primary)'
            : 'var(--bg-quaternary)',
        }}
        aria-hidden="true"
      />
      {label && (
        <span className="ml-3 text-sm font-medium text-primary">{label}</span>
      )}
    </label>
  );
}
