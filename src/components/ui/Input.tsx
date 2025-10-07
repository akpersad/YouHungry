import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);
    const hasHelper = Boolean(helperText);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary mb-1"
          >
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'input-base',
            {
              'input-error': hasError,
              'input-disabled': props.disabled,
            },
            className
          )}
          ref={ref}
          required={required}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : hasHelper ? helperId : undefined
          }
          {...props}
        />
        {hasError && (
          <p
            id={errorId}
            className="mt-1 text-sm text-error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {helperText && !hasError && (
          <p id={helperId} className="mt-1 text-sm text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
