import { toast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showToast = (options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    const { title, description, variant = 'default' } = options;

    if (variant === 'destructive') {
      toast.error(title, {
        description,
        duration: 6000,
      });
    } else {
      toast.success(title, {
        description,
        duration: 4000,
      });
    }
  };

  return {
    toast: showToast,
  };
}
