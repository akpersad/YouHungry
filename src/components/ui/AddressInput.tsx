'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './Input';
import {
  getAddressSuggestions,
  validateAddress,
  isAddressValidForSearch,
} from '@/lib/address-validation';

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

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, placeId?: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
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
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionToken] = useState(() =>
    Math.random().toString(36).substring(2, 15)
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
        console.error('Error fetching address suggestions:', error);
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
        setIsValid(false);
        setValidationError(null);
        onValidationChange?.(false);
        return;
      }

      try {
        const validationResult = await validateAddress(address);
        if (validationResult) {
          const valid = isAddressValidForSearch(validationResult);
          setIsValid(valid);
          setValidationError(valid ? null : 'Address not found or incomplete');
          onValidationChange?.(valid);
        } else {
          setIsValid(false);
          setValidationError('Unable to validate address');
          onValidationChange?.(false);
        }
      } catch (error) {
        console.error('Address validation error:', error);
        setIsValid(false);
        setValidationError('Address validation failed');
        onValidationChange?.(false);
      }
    },
    [onValidationChange]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce suggestions search
    debounceRef.current = setTimeout(() => {
      searchSuggestions(newValue);
    }, 300);

    // Debounce validation (longer delay)
    debounceRef.current = setTimeout(() => {
      validateCurrentAddress(newValue);
    }, 1000);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formattedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsValid(true);
    setValidationError(null);
    onValidationChange?.(true);
    onAddressSelect?.(suggestion.formattedAddress, suggestion.placeId);

    // Focus back to input after selection
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleFocus = () => {
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
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : suggestionElements.length - 1;
        (suggestionElements[prevIndex] as HTMLElement)?.focus();
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

  // Trigger search when component mounts with a value
  useEffect(() => {
    if (value.length >= 3) {
      searchSuggestions(value);
    }
  }, [value, searchSuggestions]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full ${validationError ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Validation status */}
      {value && !isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid ? (
            <span className="text-green-500 text-sm">✓</span>
          ) : validationError ? (
            <span className="text-red-500 text-sm">⚠</span>
          ) : null}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              data-suggestion
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionSelect(suggestion);
              }}
            >
              <div className="text-sm text-gray-900">
                {suggestion.formattedAddress}
              </div>
              {suggestion.confidence < 0.8 && (
                <div className="text-xs text-gray-500">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Validation error message */}
      {validationError && (
        <div className="mt-1 text-sm text-red-600">{validationError}</div>
      )}
    </div>
  );
}
