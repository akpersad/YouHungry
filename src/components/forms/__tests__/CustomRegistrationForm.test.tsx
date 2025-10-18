/**
 * Unit Tests: CustomRegistrationForm
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomRegistrationForm } from '../CustomRegistrationForm';
import { useSignUp } from '@clerk/nextjs';

// Mock next/navigation first
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useSignUp: jest.fn(),
}));

// Mock fetch for username availability
global.fetch = jest.fn();

describe('CustomRegistrationForm', () => {
  const mockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
    attemptEmailAddressVerification: jest.fn(),
  };

  const mockSetActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (useSignUp as jest.Mock).mockReturnValue({
      isLoaded: true,
      signUp: mockSignUp,
      setActive: mockSetActive,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ available: true }),
    });
  });

  describe('Registration Form Rendering', () => {
    it('renders all required form fields', () => {
      render(<CustomRegistrationForm />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^phone number \(optional\)$/i)
      ).toBeInTheDocument();
    });

    it('renders submit button as disabled initially', () => {
      render(<CustomRegistrationForm />);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('renders SMS opt-in checkbox', () => {
      render(<CustomRegistrationForm />);

      const checkbox = screen.getByRole('checkbox', {
        name: /enable sms notifications/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('renders sign-in link', () => {
      render(<CustomRegistrationForm />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error for invalid email', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(
          screen.getAllByText(/please enter a valid email address/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('shows error for password less than 10 characters', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'short');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(
          screen.getAllByText(/must be at least 10 characters/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('shows error for password more than 72 characters', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(
        passwordInput,
        'a'.repeat(73) // 73 characters
      );
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getAllByText(/must not exceed 72 characters/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'TestPassword123');
      await user.type(confirmPasswordInput, 'DifferentPassword');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getAllByText(/passwords do not match/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('shows error for invalid username format', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'ab'); // Too short
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getAllByText(/must be 4-64 characters/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('validates first name is required', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.click(firstNameInput);
      await user.tab(); // Blur without typing

      // Submit button should remain disabled
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Username Availability Check', () => {
    it('checks username availability on blur', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'validusername');
      await user.tab();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(
            '/api/auth/check-username?username=validusername'
          )
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/username is available/i)).toBeInTheDocument();
      });
    });

    it('shows error when username is taken', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ available: false }),
      });

      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'takenusername');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getAllByText(/username is already taken/i).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Phone Number Formatting', () => {
    it('formats phone number as (XXX) XXX-XXXX', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const phoneInput = screen.getByLabelText(/^phone number \(optional\)$/i);
      await user.type(phoneInput, '5551234567');

      await waitFor(() => {
        expect(phoneInput).toHaveValue('(555) 123-4567');
      });
    });

    it('validates phone number has 10 digits', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const phoneInput = screen.getByLabelText(/^phone number \(optional\)$/i);
      await user.type(phoneInput, '123'); // Too short
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getAllByText(/valid 10-digit phone number/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('requires phone number when SMS opt-in is checked', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const smsCheckbox = screen.getByRole('checkbox', {
        name: /enable sms notifications/i,
      });
      await user.click(smsCheckbox);

      // Fill all fields except phone
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(
        screen.getByLabelText(/email address/i),
        'test@example.com'
      );
      await user.type(screen.getByLabelText(/^username/i), 'testuser123');
      await user.type(screen.getByLabelText(/^password/i), 'TestPassword123');
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'TestPassword123'
      );

      // Submit button should be disabled without phone
      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      mockSignUp.create.mockResolvedValue({});
      mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

      render(<CustomRegistrationForm />);

      // Fill all required fields with proper blur events
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Test');
      fireEvent.blur(firstNameInput);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'User');
      fireEvent.blur(lastNameInput);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      fireEvent.blur(emailInput);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'testuser123');
      fireEvent.blur(usernameInput); // Trigger username check
      await waitFor(() =>
        expect(screen.getByText(/username is available/i)).toBeInTheDocument()
      );

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'TestPassword123');
      fireEvent.blur(passwordInput);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'TestPassword123');
      fireEvent.blur(confirmPasswordInput);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });

      await waitFor(
        () => {
          expect(submitButton).toBeEnabled();
        },
        { timeout: 3000 }
      );

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp.create).toHaveBeenCalledWith(
          expect.objectContaining({
            emailAddress: 'test@example.com',
            username: 'testuser123',
            password: 'TestPassword123',
            firstName: 'Test',
            lastName: 'User',
          })
        );
      });
    });

    it('includes phone number in submission when provided', async () => {
      const user = userEvent.setup();
      mockSignUp.create.mockResolvedValue({});
      mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

      render(<CustomRegistrationForm />);

      // Fill all fields including phone with blur events
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Test');
      fireEvent.blur(firstNameInput);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'User');
      fireEvent.blur(lastNameInput);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      fireEvent.blur(emailInput);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'testuser123');
      fireEvent.blur(usernameInput);
      await waitFor(() =>
        expect(screen.getByText(/username is available/i)).toBeInTheDocument()
      );

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'TestPassword123');
      fireEvent.blur(passwordInput);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'TestPassword123');
      fireEvent.blur(confirmPasswordInput);

      const phoneInput = screen.getByLabelText(/^phone number \(optional\)$/i);
      await user.type(phoneInput, '5551234567');
      fireEvent.blur(phoneInput);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await waitFor(() => expect(submitButton).toBeEnabled(), {
        timeout: 3000,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignUp.create).toHaveBeenCalledWith(
          expect.objectContaining({
            unsafeMetadata: expect.objectContaining({
              phoneNumber: '+15551234567',
            }),
          })
        );
      });
    });

    it('transitions to verification view after successful submission', async () => {
      const user = userEvent.setup();
      mockSignUp.create.mockResolvedValue({});
      mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

      render(<CustomRegistrationForm />);

      // Fill and submit form with blur events
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Test');
      fireEvent.blur(firstNameInput);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'User');
      fireEvent.blur(lastNameInput);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      fireEvent.blur(emailInput);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'testuser123');
      fireEvent.blur(usernameInput);
      await waitFor(() =>
        expect(screen.getByText(/username is available/i)).toBeInTheDocument()
      );

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'TestPassword123');
      fireEvent.blur(passwordInput);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'TestPassword123');
      fireEvent.blur(confirmPasswordInput);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await waitFor(() => expect(submitButton).toBeEnabled(), {
        timeout: 3000,
      });
      await user.click(submitButton);

      // Should show verification view
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(
          screen.getByLabelText(/enter verification code/i)
        ).toBeInTheDocument();
      });
    });

    it('shows error message on submission failure', async () => {
      const user = userEvent.setup();
      mockSignUp.create.mockRejectedValue({
        errors: [{ message: 'Email already exists' }],
      });

      render(<CustomRegistrationForm />);

      // Fill and submit form with blur events
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Test');
      fireEvent.blur(firstNameInput);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'User');
      fireEvent.blur(lastNameInput);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'existing@example.com');
      fireEvent.blur(emailInput);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'testuser123');
      fireEvent.blur(usernameInput);
      await waitFor(() =>
        expect(screen.getByText(/username is available/i)).toBeInTheDocument()
      );

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'TestPassword123');
      fireEvent.blur(passwordInput);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'TestPassword123');
      fireEvent.blur(confirmPasswordInput);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await waitFor(() => expect(submitButton).toBeEnabled(), {
        timeout: 3000,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign-in Navigation', () => {
    it('navigates to sign-in page when sign-in button is clicked', async () => {
      const user = userEvent.setup();
      render(<CustomRegistrationForm />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(mockPush).toHaveBeenCalledWith('/sign-in');
    });
  });

  describe('Verification Code Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      mockSignUp.create.mockResolvedValue({});
      mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

      render(<CustomRegistrationForm />);

      // Fill and submit to get to verification view with blur events
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Test');
      fireEvent.blur(firstNameInput);

      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.type(lastNameInput, 'User');
      fireEvent.blur(lastNameInput);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      fireEvent.blur(emailInput);

      const usernameInput = screen.getByLabelText(/^username/i);
      await user.type(usernameInput, 'testuser123');
      fireEvent.blur(usernameInput);
      await waitFor(() =>
        expect(screen.getByText(/username is available/i)).toBeInTheDocument()
      );

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'TestPassword123');
      fireEvent.blur(passwordInput);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmPasswordInput, 'TestPassword123');
      fireEvent.blur(confirmPasswordInput);

      const submitButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await waitFor(() => expect(submitButton).toBeEnabled(), {
        timeout: 3000,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('renders verification code input', () => {
      expect(
        screen.getByLabelText(/enter verification code/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /verify email/i })
      ).toBeInTheDocument();
    });

    it('disables verify button until 6 digits are entered', async () => {
      const user = userEvent.setup();
      const verifyButton = screen.getByRole('button', {
        name: /verify email/i,
      });
      const codeInput = screen.getByLabelText(/enter verification code/i);

      expect(verifyButton).toBeDisabled();

      await user.type(codeInput, '12345'); // Only 5 digits
      expect(verifyButton).toBeDisabled();

      await user.type(codeInput, '6'); // Now 6 digits
      await waitFor(() => expect(verifyButton).toBeEnabled());
    });

    it('verifies code and redirects to profile with new_user param on success', async () => {
      const user = userEvent.setup();
      mockSignUp.attemptEmailAddressVerification.mockResolvedValue({
        status: 'complete',
        createdSessionId: 'session123',
      });

      const codeInput = screen.getByLabelText(/enter verification code/i);
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', {
        name: /verify email/i,
      });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(mockSignUp.attemptEmailAddressVerification).toHaveBeenCalledWith(
          {
            code: '123456',
          }
        );
        expect(mockSetActive).toHaveBeenCalledWith({
          session: 'session123',
        });
        expect(mockPush).toHaveBeenCalledWith('/profile?new_user=true');
      });
    });

    it('shows error for invalid verification code', async () => {
      const user = userEvent.setup();
      mockSignUp.attemptEmailAddressVerification.mockRejectedValue({
        errors: [{ message: 'Invalid verification code' }],
      });

      const codeInput = screen.getByLabelText(/enter verification code/i);
      await user.type(codeInput, '000000');

      const verifyButton = screen.getByRole('button', {
        name: /verify email/i,
      });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid verification code/i)
        ).toBeInTheDocument();
      });
    });

    it('shows resend cooldown initially', async () => {
      // Initially, resend should show cooldown
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument();
    });
  });
});
