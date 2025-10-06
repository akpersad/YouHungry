import { toast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class ToastNotificationService {
  /**
   * Show success toast
   */
  static success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  /**
   * Show error toast
   */
  static error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  }

  /**
   * Show info toast
   */
  static info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  /**
   * Show warning toast
   */
  static warning(message: string, options?: ToastOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }

  /**
   * Show loading toast
   */
  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      description: options?.description,
    });
  }

  /**
   * Dismiss specific toast
   */
  static dismiss(toastId?: string | number) {
    return toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll() {
    return toast.dismiss();
  }

  /**
   * Show promise toast
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  }

  // Predefined toast messages for common actions

  /**
   * Collection created successfully
   */
  static collectionCreated(collectionName: string) {
    return this.success(`Collection "${collectionName}" created successfully!`);
  }

  /**
   * Restaurant added to collection
   */
  static restaurantAdded(restaurantName: string, collectionName: string) {
    return this.success(`${restaurantName} added to ${collectionName}`, {
      description: 'Restaurant added to your collection',
    });
  }

  /**
   * Friend request sent
   */
  static friendRequestSent(friendName: string) {
    return this.success(`Friend request sent to ${friendName}`, {
      description: 'They will be notified of your request',
    });
  }

  /**
   * Group decision started
   */
  static groupDecisionStarted(
    groupName: string,
    decisionType: 'tiered' | 'random'
  ) {
    const typeText = decisionType === 'tiered' ? 'voting' : 'random selection';
    return this.success(`${groupName} decision started`, {
      description: `Group ${typeText} is now active`,
    });
  }

  /**
   * SMS notification sent
   */
  static smsNotificationSent(recipient: string) {
    return this.success('SMS notification sent', {
      description: `Notification sent to ${recipient}`,
    });
  }

  /**
   * SMS notification failed
   */
  static smsNotificationFailed(error: string) {
    return this.error('SMS notification failed', {
      description: error,
    });
  }

  /**
   * Push notification subscribed
   */
  static pushNotificationSubscribed() {
    return this.success('Push notifications enabled', {
      description: 'You will receive notifications for group activities',
    });
  }

  /**
   * Push notification unsubscribed
   */
  static pushNotificationUnsubscribed() {
    return this.info('Push notifications disabled', {
      description: 'You will no longer receive push notifications',
    });
  }

  /**
   * Network error
   */
  static networkError() {
    return this.error('Network error', {
      description: 'Please check your connection and try again',
    });
  }

  /**
   * Generic API error
   */
  static apiError(error: string) {
    return this.error('Something went wrong', {
      description: error,
    });
  }

  /**
   * Form validation error
   */
  static validationError(field: string) {
    return this.error('Please check your input', {
      description: `${field} is required or invalid`,
    });
  }

  /**
   * Offline mode
   */
  static offlineMode() {
    return this.warning('You are offline', {
      description: 'Some features may not be available',
    });
  }

  /**
   * Back online
   */
  static backOnline() {
    return this.success('You are back online', {
      description: 'All features are now available',
    });
  }
}

// Export individual functions for convenience
export const {
  success,
  error,
  info,
  warning,
  loading,
  dismiss,
  dismissAll,
  promise,
} = ToastNotificationService;
