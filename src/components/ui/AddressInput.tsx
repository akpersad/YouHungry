'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './Input';
import {
  getAddressSuggestions,
  validateAddress,
  isAddressValidForSearch,
} from '@/lib/address-validation';
import { Lock, Info, AlertTriangle } from 'lucide-react';

interface AddressSuggestion {
  formattedAddress: string;
  placeId: string;
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: string[];
    languageCode: string;
  }>;
  confidence: number;
}

interface ValidationState {
  isValid: boolean;
  hasUnconfirmedComponents: boolean;
  hasInferredComponents: boolean;
  hasReplacedComponents: boolean;
  missingComponents: string[];
  unconfirmedComponents: string[];
  unresolvedTokens: string[];
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, placeId?: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function AddressInput({
  value,
  onChange,
  onAddressSelect,
  onValidationChange,
  placeholder = 'Enter address...',
  className = '',
  required = false,
  disabled = false,
  id,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    hasUnconfirmedComponents: false,
    hasInferredComponents: false,
    hasReplacedComponents: false,
    missingComponents: [],
    unconfirmedComponents: [],
    unresolvedTokens: [],
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [justSelected, setJustSelected] = useState(false);
  const [sessionToken] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const validationDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const justSelectedRef = useRef(false);
  const hasMountedRef = useRef(false);
  const userHasInteractedRef = useRef(false);

  // Debounced search for suggestions
  const searchSuggestions = useCallback(
    async (input: string) => {
      if (input.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getAddressSuggestions(input, sessionToken);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        logger.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionToken]
  );

  // Validate address when user stops typing
  const validateCurrentAddress = useCallback(
    async (address: string) => {
      if (!address.trim()) {
        setValidationState({
          isValid: false,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
          missingComponents: [],
          unconfirmedComponents: [],
          unresolvedTokens: [],
        });
        setValidationError(null);
        onValidationChange?.(false);
        return;
      }

      // Skip validation for "Current Location" - it's handled separately
      if (address.trim() === 'Current Location') {
        setValidationState({
          isValid: true,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
          missingComponents: [],
          unconfirmedComponents: [],
          unresolvedTokens: [],
        });
        setValidationError(null);
        onValidationChange?.(true);
        return;
      }

      try {
        const validationResult = await validateAddress(address);
        if (validationResult) {
          const valid = isAddressValidForSearch(validationResult);
          setValidationState({
            isValid: valid,
            hasUnconfirmedComponents:
              validationResult.verdict.hasUnconfirmedComponents,
            hasInferredComponents:
              validationResult.verdict.hasInferredComponents,
            hasReplacedComponents:
              validationResult.verdict.hasReplacedComponents,
            missingComponents: validationResult.missingComponentTypes,
            unconfirmedComponents: validationResult.unconfirmedComponentTypes,
            unresolvedTokens: validationResult.unresolvedTokens,
          });
          setValidationError(valid ? null : 'Address not found or incomplete');
          onValidationChange?.(valid);
        } else {
          setValidationState({
            isValid: false,
            hasUnconfirmedComponents: false,
            hasInferredComponents: false,
            hasReplacedComponents: false,
            missingComponents: [],
            unconfirmedComponents: [],
            unresolvedTokens: [],
          });
          setValidationError('Unable to validate address');
          onValidationChange?.(false);
        }
      } catch (error) {
        logger.error('Address validation error:', error);
        setValidationState({
          isValid: false,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
          missingComponents: [],
          unconfirmedComponents: [],
          unresolvedTokens: [],
        });
        setValidationError('Address validation failed');
        onValidationChange?.(false);
      }
    },
    [onValidationChange]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Mark that user has interacted with the input
    userHasInteractedRef.current = true;

    onChange(newValue);
    setShowSuggestions(true);
    setJustSelected(false); // Reset the flag when user types
    justSelectedRef.current = false; // Reset the ref when user types

    // Clear previous debounces
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (validationDebounceRef.current) {
      clearTimeout(validationDebounceRef.current);
    }

    // Debounce suggestions search
    debounceRef.current = setTimeout(() => {
      searchSuggestions(newValue);
    }, 300);

    // Debounce validation (longer delay)
    validationDebounceRef.current = setTimeout(() => {
      validateCurrentAddress(newValue);
    }, 1000);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    // Clear any pending searches
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (validationDebounceRef.current) {
      clearTimeout(validationDebounceRef.current);
    }

    // Set ref immediately to prevent useEffect from running
    justSelectedRef.current = true;
    setJustSelected(true);

    onChange(suggestion.formattedAddress);
    setShowSuggestions(false);
    setSuggestions([]);

    // Since this came from a valid suggestion, mark it as valid immediately
    setValidationState({
      isValid: true,
      hasUnconfirmedComponents: false,
      hasInferredComponents: false,
      hasReplacedComponents: false,
      missingComponents: [],
      unconfirmedComponents: [],
      unresolvedTokens: [],
    });
    setValidationError(null);
    onValidationChange?.(true);
    onAddressSelect?.(suggestion.formattedAddress, suggestion.placeId);

    // Focus back to input after selection
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleFocus = () => {
    if (justSelected) {
      // Don't trigger search if we just selected a suggestion
      setJustSelected(false);
      return;
    }

    // Don't search on initial mount to avoid unnecessary API calls
    if (!hasMountedRef.current) {
      return;
    }

    // Mark that user has interacted with the input
    userHasInteractedRef.current = true;

    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (value.length >= 3) {
      // If we have a value but no suggestions, trigger search
      searchSuggestions(value);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    const suggestionElements =
      suggestionsRef.current?.querySelectorAll('[data-suggestion]');
    if (!suggestionElements) return;

    const currentIndex = Array.from(suggestionElements).findIndex(
      (el) => el === document.activeElement
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex =
          currentIndex < suggestionElements.length - 1 ? currentIndex + 1 : 0;
        (suggestionElements[nextIndex] as HTMLElement)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex === 0) {
          // If we're at the first suggestion, return focus to input
          inputRef.current?.focus();
        } else {
          const prevIndex = currentIndex - 1;
          (suggestionElements[prevIndex] as HTMLElement)?.focus();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0) {
          handleSuggestionSelect(suggestions[currentIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.focus();
        break;
    }
  };

  // Track initial mount to prevent unnecessary searches
  useEffect(() => {
    hasMountedRef.current = true;

    // Validate the initial address if it exists
    if (value && value.length >= 3) {
      validateCurrentAddress(value);
    }
  }, [value, validateCurrentAddress]);

  // Trigger search when value changes (but not on initial mount)
  useEffect(() => {
    // Skip search on initial mount or if user hasn't interacted to avoid unnecessary API calls
    if (!hasMountedRef.current || !userHasInteractedRef.current) {
      return;
    }

    // Only trigger search if we have a value and haven't just selected
    if (value.length >= 3 && !justSelectedRef.current) {
      // Use a small delay to avoid conflicts with other search triggers
      const timeoutId = setTimeout(() => {
        searchSuggestions(value);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [value, searchSuggestions]);

  // Cleanup debounces on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (validationDebounceRef.current) {
        clearTimeout(validationDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full ${validationError ? 'border-destructive' : validationState.isValid ? 'border-success' : ''}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Validation status */}
      {value && !isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-1">
          {validationState.isValid ? (
            <span
              className="address-validation-icon success"
              title="Address validated successfully"
              aria-label="Address validated successfully"
            >
              ✓
            </span>
          ) : validationError ? (
            <span
              className="address-validation-icon error"
              title="Address validation failed"
              aria-label="Address validation failed"
            >
              ⚠
            </span>
          ) : null}

          {/* Additional validation indicators */}
          {validationState.hasUnconfirmedComponents && (
            <span title="Unconfirmed components">
              <Lock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            </span>
          )}
          {validationState.hasInferredComponents && (
            <span title="Inferred components">
              <Info className="h-3 w-3 text-blue-500 dark:text-blue-400" />
            </span>
          )}
          {validationState.hasReplacedComponents && (
            <span title="Replaced components">
              <AlertTriangle className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            </span>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-[60] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              data-suggestion
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionSelect(suggestion);
              }}
            >
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {suggestion.formattedAddress}
              </div>
              {suggestion.confidence < 0.8 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Validation error message */}
      {validationError && (
        <div
          className="mt-1 text-sm text-destructive font-medium"
          role="alert"
          aria-live="polite"
        >
          {validationError}
        </div>
      )}
    </div>
  );
}
