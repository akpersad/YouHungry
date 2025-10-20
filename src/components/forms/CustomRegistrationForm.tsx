'use client';

import { logger } from '@/lib/logger';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { trackSignupComplete } from '@/lib/analytics';

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  smsOptIn: boolean;
  city: string;
  state: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  general?: string;
}

type FormState = 'registration' | 'verification';

interface FieldValidation {
  email: boolean;
  username: boolean;
  password: boolean;
  confirmPassword: boolean;
  firstName: boolean;
  lastName: boolean;
  phoneNumber: boolean;
}

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+52', country: 'Mexico', flag: '🇲🇰' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
];

export function CustomRegistrationForm() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [formState, setFormState] = useState<FormState>('registration');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '+1', // Default to US
    smsOptIn: false,
    city: '',
    state: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [canResendCode, setCanResendCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Track field validation status
  const [fieldValidation, setFieldValidation] = useState<FieldValidation>({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
    firstName: false,
    lastName: false,
    phoneNumber: true, // Optional field
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    // 4-64 characters, alphanumeric + underscore/hyphen only
    if (username.length < 4 || username.length > 64) {
      return false;
    }
    // No special characters except underscore and hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username);
  };

  const checkUsernameAvailability = async (
    username: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(username)}`
      );
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    }
  };

  const getPasswordError = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 10) {
      return 'Password must be at least 10 characters';
    }
    if (password.length > 72) {
      return 'Password must not exceed 72 characters';
    }
    return undefined;
  };

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    const passwordError = getPasswordError(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    // Phone validation (if provided)
    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    // If SMS is opted in, phone is required
    if (formData.smsOptIn && !formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required for SMS notifications';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Blur validation handlers
  const handleEmailBlur = () => {
    if (!formData.email) {
      setFieldValidation((prev) => ({ ...prev, email: false }));
      return;
    }

    const isValid = validateEmail(formData.email);
    setFieldValidation((prev) => ({ ...prev, email: isValid }));

    if (!isValid) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.username) {
      setFieldValidation((prev) => ({ ...prev, username: false }));
      return;
    }

    // First check format
    if (!validateUsername(formData.username)) {
      setErrors((prev) => ({
        ...prev,
        username: 'Username must be 4-64 characters (letters, numbers, -, _)',
      }));
      setFieldValidation((prev) => ({ ...prev, username: false }));
      return;
    }

    // Then check availability
    setIsCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(formData.username);
    setIsCheckingUsername(false);

    if (!isAvailable) {
      setErrors((prev) => ({
        ...prev,
        username: 'Username is already taken',
      }));
      setFieldValidation((prev) => ({ ...prev, username: false }));
    } else {
      setFieldValidation((prev) => ({ ...prev, username: true }));
    }
  };

  const handlePasswordBlur = () => {
    const passwordError = getPasswordError(formData.password);
    setFieldValidation((prev) => ({ ...prev, password: !passwordError }));

    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    const isValid = !!(
      formData.confirmPassword && formData.password === formData.confirmPassword
    );
    setFieldValidation((prev) => ({ ...prev, confirmPassword: isValid }));

    if (formData.confirmPassword && !isValid) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match',
      }));
    }
  };

  const handlePhoneBlur = () => {
    // Phone is optional, so it's valid if empty or if valid format
    const isValid =
      !formData.phoneNumber || validatePhoneNumber(formData.phoneNumber);
    setFieldValidation((prev) => ({ ...prev, phoneNumber: isValid }));

    if (formData.phoneNumber && !isValid) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: 'Please enter a valid 10-digit phone number',
      }));
    }
  };

  const handleNameBlur = (field: 'firstName' | 'lastName') => {
    const isValid = !!formData[field];
    setFieldValidation((prev) => ({ ...prev, [field]: isValid }));
  };

  // Check if all required fields are valid
  const isFormValid = Object.values(fieldValidation).every(
    (isValid) => isValid
  );

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    // Special handling for phone number formatting
    if (field === 'phoneNumber' && typeof value === 'string') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !isLoaded || !signUp) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Format phone number (with country code)
      let fullPhoneNumber;
      if (formData.phoneNumber) {
        const digits = formData.phoneNumber.replace(/\D/g, '');
        fullPhoneNumber = `${formData.countryCode}${digits}`;
      }

      // Create user with Clerk's client SDK
      await signUp.create({
        emailAddress: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        unsafeMetadata: {
          city: formData.city || undefined,
          state: formData.state || undefined,
          smsOptIn: formData.smsOptIn || false,
          phoneNumber: fullPhoneNumber || undefined,
        },
      });

      // Prepare email verification - sends the code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Note: Phone verification is skipped during registration since user isn't authenticated yet
      // User can verify their phone number later on the profile page

      // Registration successful - transition to verification state
      setFormState('verification');
      // Enable resend after 60 seconds
      setResendCooldown(60);
      setCanResendCode(false);

      // Start cooldown timer
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResendCode(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      logger.error('Registration error:', err);

      // Handle different types of Clerk errors
      if (err && typeof err === 'object') {
        // Check for Clerk error format
        if ('errors' in err && Array.isArray(err.errors) && err.errors[0]) {
          const firstError = err.errors[0];
          if (typeof firstError === 'object' && 'message' in firstError) {
            const errorMessage = firstError.message as string;

            // Handle specific password breach error
            if (errorMessage.includes('data breach')) {
              setErrors({
                password:
                  'This password has been found in an online data breach. Please choose a different, more secure password.',
              });
            } else {
              setErrors({ general: errorMessage });
            }
            return;
          }
        }

        // Check for direct error message (some Clerk errors might be in different format)
        if ('message' in err) {
          const errorMessage = err.message as string;
          if (errorMessage.includes('data breach')) {
            setErrors({
              password:
                'This password has been found in an online data breach. Please choose a different, more secure password.',
            });
          } else {
            setErrors({ general: errorMessage });
          }
          return;
        }
      }

      // Fallback for unexpected errors
      setErrors({
        general: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !verificationCode ||
      verificationCode.length !== 6 ||
      !isLoaded ||
      !signUp
    ) {
      setErrors({ general: 'Please enter a valid 6-digit code' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Attempt email verification with the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      // Check if sign-up is complete
      if (completeSignUp.status === 'complete') {
        // Set the session as active
        await setActive({ session: completeSignUp.createdSessionId });

        // Track successful signup
        trackSignupComplete('email');

        // Redirect to profile so user can verify phone and set preferences
        // Add new_user query param to trigger push notification prompt
        router.push('/profile?new_user=true');
      } else {
        // If not complete, there may be additional steps required
        logger.error('Sign-up not complete:', completeSignUp.status);
        setErrors({ general: 'Verification incomplete. Please try again.' });
      }
    } catch (err: unknown) {
      logger.error('Verification error:', err);
      // Handle Clerk errors
      if (
        err &&
        typeof err === 'object' &&
        'errors' in err &&
        Array.isArray(err.errors) &&
        err.errors[0] &&
        typeof err.errors[0] === 'object'
      ) {
        const firstError = err.errors[0];
        const errorMessage =
          ('longMessage' in firstError &&
          typeof firstError.longMessage === 'string'
            ? firstError.longMessage
            : '') ||
          ('message' in firstError && typeof firstError.message === 'string'
            ? firstError.message
            : '') ||
          'Invalid verification code';
        setErrors({ general: errorMessage });
      } else {
        setErrors({
          general: 'Failed to verify code. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResendCode || isSubmitting || !isLoaded || !signUp) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Resend the verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Reset cooldown
      setResendCooldown(60);
      setCanResendCode(false);

      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResendCode(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      logger.error('Resend error:', err);
      if (
        err &&
        typeof err === 'object' &&
        'errors' in err &&
        Array.isArray(err.errors) &&
        err.errors[0] &&
        typeof err.errors[0] === 'object' &&
        'message' in err.errors[0]
      ) {
        const errorMessage =
          (err.errors[0].message as string) || 'Failed to resend code';
        setErrors({ general: errorMessage });
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verification view
  if (formState === 'verification') {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--color-success-light)',
            }}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-sm">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium mt-1">{formData.email}</p>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div
            className="p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--color-destructive-light)',
              borderColor: 'var(--color-destructive)',
            }}
          >
            {errors.general}
          </div>
        )}

        {/* Verification Code Input */}
        <div>
          <label
            htmlFor="verificationCode"
            className="block text-sm font-medium mb-2 text-center"
          >
            Enter Verification Code
          </label>
          <Input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setVerificationCode(value);
            }}
            disabled={isSubmitting}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs mt-2 text-center">
            Enter the 6-digit code from your email
          </p>
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || verificationCode.length !== 6}
          className="w-full"
        >
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </Button>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm">
            Didn&apos;t receive the code?{' '}
            {canResendCode ? (
              <button
                type="button"
                onClick={handleResendCode}
                className="font-medium underline"
                disabled={isSubmitting}
              >
                Resend Code
              </button>
            ) : (
              <span>Resend in {resendCooldown}s</span>
            )}
          </p>
        </div>
      </form>
    );
  }

  // Registration view
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div
          className="p-3 rounded-lg border text-sm"
          style={{
            backgroundColor: 'var(--color-destructive-light)',
            borderColor: 'var(--color-destructive)',
          }}
        >
          {errors.general}
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            First Name *
          </label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            onBlur={() => handleNameBlur('firstName')}
            error={errors.firstName}
            disabled={isSubmitting}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Last Name *
          </label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            onBlur={() => handleNameBlur('lastName')}
            error={errors.lastName}
            disabled={isSubmitting}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address *
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          onBlur={handleEmailBlur}
          error={errors.email}
          disabled={isSubmitting}
          placeholder="john@example.com"
        />
        {errors.email && <p className="text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username *
        </label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          onBlur={handleUsernameBlur}
          error={errors.username}
          disabled={isSubmitting || isCheckingUsername}
          placeholder="johndoe"
        />
        <p className="text-xs mt-1">4-64 characters (letters, numbers, -, _)</p>
        {isCheckingUsername && (
          <p className="text-xs mt-1">Checking availability...</p>
        )}
        {!isCheckingUsername &&
          fieldValidation.username &&
          !errors.username &&
          formData.username && (
            <p className="text-sm mt-1 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Username is available
            </p>
          )}
        {errors.username && <p className="text-sm mt-1">{errors.username}</p>}
      </div>

      {/* Password Fields */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password *
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          onBlur={handlePasswordBlur}
          error={errors.password}
          disabled={isSubmitting}
          placeholder="••••••••"
        />
        <p className="text-xs mt-1">Must be between 10 and 72 characters</p>
        {errors.password && <p className="text-sm mt-1">{errors.password}</p>}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium mb-1"
        >
          Confirm Password *
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          onBlur={handleConfirmPasswordBlur}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            City (Optional)
          </label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={isSubmitting}
            placeholder="New York"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium mb-1">
            State (Optional)
          </label>
          <Input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            disabled={isSubmitting}
            placeholder="NY"
            maxLength={2}
          />
        </div>
      </div>

      {/* Phone Number Field */}
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
          Phone Number (Optional)
        </label>
        <div className="flex gap-2">
          {/* Country Code Dropdown */}
          <select
            id="countryCode"
            value={formData.countryCode}
            onChange={(e) => handleInputChange('countryCode', e.target.value)}
            disabled={isSubmitting}
            aria-label="Country code for phone number"
            className="px-3 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              minWidth: '7.5rem',
            }}
          >
            {COUNTRY_CODES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.code}
              </option>
            ))}
          </select>

          {/* Phone Number Input */}
          <div className="flex-1">
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              onBlur={handlePhoneBlur}
              error={errors.phoneNumber}
              disabled={isSubmitting}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
          </div>
        </div>
        {errors.phoneNumber && (
          <p className="text-sm mt-1">{errors.phoneNumber}</p>
        )}
      </div>

      {/* SMS Opt-in Checkbox */}
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="smsOptIn"
            checked={formData.smsOptIn}
            onChange={(e) => handleInputChange('smsOptIn', e.target.checked)}
            disabled={isSubmitting}
            className="mt-1"
          />
          <label htmlFor="smsOptIn" className="text-sm">
            Enable SMS notifications for updates
          </label>
        </div>
        <p className="text-xs ml-6">
          Receive texts about group decisions, friend requests & invites. Msg &
          data rates may apply. Frequency varies by activity. Disable anytime in
          settings.
        </p>
      </div>

      {/* Clerk CAPTCHA Widget - Required for bot protection */}
      <div id="clerk-captcha" data-cl-theme="auto" data-cl-size="normal" />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || !isFormValid}
        className="w-full"
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </Button>

      {/* Sign In Link */}
      <div className="text-center">
        <p className="text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="font-medium"
            disabled={isSubmitting}
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}
