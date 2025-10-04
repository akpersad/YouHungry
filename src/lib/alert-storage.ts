import { AlertData } from '@/lib/email-notifications';

// Alert storage interface (in a real implementation, this would be a database)
export interface StoredAlert extends AlertData {
  id: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// In-memory alert storage (in production, this would be a database)
export const alertStorage: Map<string, StoredAlert> = new Map();

// Helper function to clear storage (for testing)
export function clearAlertStorage() {
  alertStorage.clear();
}
