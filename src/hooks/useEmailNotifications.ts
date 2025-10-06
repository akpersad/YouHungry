import { useMutation, useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface EmailTestRequest {
  email: string;
}

interface EmailTestResponse {
  success: boolean;
  message: string;
  error?: string;
  emailId?: string;
}

interface EmailValidationResponse {
  valid: boolean;
  error?: string;
}

// Email notification hook
export function useEmailNotifications() {
  // Test email notification
  const testEmail = useMutation<EmailTestResponse, Error, EmailTestRequest>({
    mutationFn: async ({ email }) => {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }

      return response.json();
    },
    onSuccess: (data) => {
      logger.info('Test email sent successfully', data);
    },
    onError: (error) => {
      logger.error('Failed to send test email', error);
    },
  });

  // Validate email configuration
  const validateEmailConfig = useQuery<EmailValidationResponse>({
    queryKey: ['email-config-validation'],
    queryFn: async () => {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to validate email configuration'
        );
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    testEmail: {
      mutate: testEmail.mutate,
      mutateAsync: testEmail.mutateAsync,
      isLoading: testEmail.isPending,
      isError: testEmail.isError,
      isSuccess: testEmail.isSuccess,
      error: testEmail.error,
      data: testEmail.data,
      reset: testEmail.reset,
    },
    validateConfig: {
      data: validateEmailConfig.data,
      isLoading: validateEmailConfig.isLoading,
      isError: validateEmailConfig.isError,
      error: validateEmailConfig.error,
      refetch: validateEmailConfig.refetch,
    },
  };
}
