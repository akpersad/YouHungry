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
    it('should show success toast', () => {
      ToastNotificationService.success('Test success message');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith('Test success message', {
        duration: 4000,
      });
    });

    it('should show error toast', () => {
      ToastNotificationService.error('Test error message', {
        description: 'Test error description',
      });

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Test error message', {
        description: 'Test error description',
        duration: 6000,
      });
    });

    it('should show info toast', () => {
      ToastNotificationService.info('Test info message');

      const { toast } = require('sonner');
      expect(toast.info).toHaveBeenCalledWith('Test info message', {
        duration: 4000,
      });
    });

    it('should show warning toast', () => {
      ToastNotificationService.warning('Test warning message');

      const { toast } = require('sonner');
      expect(toast.warning).toHaveBeenCalledWith('Test warning message', {
        duration: 5000,
      });
    });

    it('should show loading toast', () => {
      ToastNotificationService.loading('Test loading message');

      const { toast } = require('sonner');
      expect(toast.loading).toHaveBeenCalledWith('Test loading message', {});
    });

    it('should show predefined notifications', () => {
      ToastNotificationService.collectionCreated('Test Collection');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'Collection "Test Collection" created successfully!',
        expect.any(Object)
      );
    });

    it('should show restaurant added notification', () => {
      ToastNotificationService.restaurantAdded('Pizza Palace', 'My Collection');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'Pizza Palace added to My Collection',
        expect.objectContaining({
          description: 'Restaurant added to your collection',
        })
      );
    });

    it('should show friend request notification', () => {
      ToastNotificationService.friendRequestSent('John Doe');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'Friend request sent to John Doe',
        expect.objectContaining({
          description: 'They will be notified of your request',
        })
      );
    });

    it('should show group decision notification', () => {
      ToastNotificationService.groupDecisionStarted('Test Group', 'tiered');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'Test Group decision started',
        expect.objectContaining({
          description: 'Group voting is now active',
        })
      );
    });

    it('should show SMS notification success', () => {
      ToastNotificationService.smsNotificationSent('+18777804236');

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'SMS notification sent',
        expect.objectContaining({
          description: 'Notification sent to +18777804236',
        })
      );
    });

    it('should show SMS notification failure', () => {
      ToastNotificationService.smsNotificationFailed('Invalid phone number');

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        'SMS notification failed',
        expect.objectContaining({
          description: 'Invalid phone number',
        })
      );
    });

    it('should show push notification subscribed', () => {
      ToastNotificationService.pushNotificationSubscribed();

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'Push notifications enabled',
        expect.objectContaining({
          description: 'You will receive notifications for group activities',
        })
      );
    });

    it('should show push notification unsubscribed', () => {
      ToastNotificationService.pushNotificationUnsubscribed();

      const { toast } = require('sonner');
      expect(toast.info).toHaveBeenCalledWith(
        'Push notifications disabled',
        expect.objectContaining({
          description: 'You will no longer receive push notifications',
        })
      );
    });

    it('should show network error', () => {
      ToastNotificationService.networkError();

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        'Network error',
        expect.objectContaining({
          description: 'Please check your connection and try again',
        })
      );
    });

    it('should show API error', () => {
      ToastNotificationService.apiError('Server error occurred');

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong',
        expect.objectContaining({
          description: 'Server error occurred',
        })
      );
    });

    it('should show validation error', () => {
      ToastNotificationService.validationError('Email');

      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith(
        'Please check your input',
        expect.objectContaining({
          description: 'Email is required or invalid',
        })
      );
    });

    it('should show offline mode', () => {
      ToastNotificationService.offlineMode();

      const { toast } = require('sonner');
      expect(toast.warning).toHaveBeenCalledWith(
        'You are offline',
        expect.objectContaining({
          description: 'Some features may not be available',
        })
      );
    });

    it('should show back online', () => {
      ToastNotificationService.backOnline();

      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith(
        'You are back online',
        expect.objectContaining({
          description: 'All features are now available',
        })
      );
    });
  });
});
