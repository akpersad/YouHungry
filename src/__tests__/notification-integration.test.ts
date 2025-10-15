import { ToastNotificationService } from '@/lib/toast-notifications';

// Mock Sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    promise: jest.fn(),
  },
}));

describe('Notification Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toast Notification Service', () => {
    it('should show basic toast types', () => {
      const { toast } = require('sonner');

      ToastNotificationService.success('Test success message');
      expect(toast.success).toHaveBeenCalledWith('Test success message', {
        duration: 4000,
      });

      ToastNotificationService.error('Test error message', {
        description: 'Test error description',
      });
      expect(toast.error).toHaveBeenCalledWith('Test error message', {
        description: 'Test error description',
        duration: 6000,
      });

      ToastNotificationService.warning('Test warning message');
      expect(toast.warning).toHaveBeenCalledWith('Test warning message', {
        duration: 5000,
      });
    });

    it('should show predefined notification messages', () => {
      const { toast } = require('sonner');

      // Test collection notification
      ToastNotificationService.collectionCreated('Test Collection');
      expect(toast.success).toHaveBeenCalledWith(
        'Collection "Test Collection" created successfully!',
        expect.any(Object)
      );

      // Test group decision notification
      ToastNotificationService.groupDecisionStarted('Test Group', 'tiered');
      expect(toast.success).toHaveBeenCalledWith(
        'Test Group decision started',
        expect.objectContaining({
          description: 'Group voting is now active',
        })
      );
    });

    it('should show error notifications', () => {
      const { toast } = require('sonner');

      // Test network error
      ToastNotificationService.networkError();
      expect(toast.error).toHaveBeenCalledWith(
        'Network error',
        expect.objectContaining({
          description: 'Please check your connection and try again',
        })
      );

      // Test API error with custom message
      ToastNotificationService.apiError('Server error occurred');
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          description: 'Server error occurred',
        })
      );
    });

    it('should show connectivity status changes', () => {
      const { toast } = require('sonner');

      ToastNotificationService.offlineMode();
      expect(toast.warning).toHaveBeenCalledWith(
        'You are offline',
        expect.objectContaining({
          description: 'Some features may not be available',
        })
      );

      ToastNotificationService.backOnline();
      expect(toast.success).toHaveBeenCalledWith(
        'You are back online',
        expect.objectContaining({
          description: 'All features are now available',
        })
      );
    });
  });
});
