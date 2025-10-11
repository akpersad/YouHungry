import { z } from 'zod';

// User validation schemas
export const userProfileSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  smsOptIn: z.boolean().default(false),
  smsPhoneNumber: z
    .string()
    .regex(/^\+1\d{10}$/)
    .optional(),
  preferences: z.object({
    defaultLocation: z.string().max(200).optional(),
    notificationSettings: z.object({
      groupDecisions: z
        .object({
          started: z.boolean().default(true),
          completed: z.boolean().default(true),
        })
        .default({ started: true, completed: true }),
      friendRequests: z.boolean().default(true),
      groupInvites: z.boolean().default(true),
    }),
  }),
});

// Collection validation schemas
export const collectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['personal', 'group']),
});

// Simple validation functions for forms
export const validateCollectionName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Collection name is required';
  }
  if (name.length > 100) {
    return 'Collection name must be 100 characters or less';
  }
  return null;
};

export const validateCollectionDescription = (
  description: string
): string | null => {
  if (description.length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
};

// Restaurant validation schemas
export const restaurantSearchSchema = z.object({
  query: z.string().max(100).optional(),
  location: z.string().min(1, 'Location is required').max(200),
  distance: z.number().min(1).max(50).default(10),
  cuisine: z.string().max(100).optional(),
  minRating: z.number().min(0).max(5).optional(),
  minPrice: z.number().min(1).max(4).optional(),
  maxPrice: z.number().min(1).max(4).optional(),
});

// Simple validation functions for restaurant search
export const validateLocation = (location: string): string | null => {
  if (!location.trim()) {
    return 'Location is required';
  }
  if (location.length > 200) {
    return 'Location must be 200 characters or less';
  }
  return null;
};

export const restaurantUpdateSchema = z.object({
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  timeToPickUp: z.number().min(1).max(300).optional(), // 1-300 minutes
});

// Group validation schemas
export const groupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const groupInviteSchema = z.object({
  email: z.string().email(),
});

// Simple validation functions for groups
export const validateGroupName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Group name is required';
  }
  if (name.length > 100) {
    return 'Group name must be 100 characters or less';
  }
  return null;
};

export const validateGroupDescription = (
  description: string
): string | null => {
  if (description.length > 500) {
    return 'Description must be 500 characters or less';
  }
  return null;
};

// Decision validation schemas
export const decisionSchema = z.object({
  collectionId: z.string().min(1),
  method: z.enum(['tiered', 'random']),
  deadline: z.date().optional(),
  visitDate: z.date(),
});

export const voteSchema = z.object({
  rankings: z.array(z.string()).min(1),
});

// Friendship validation schemas
export const friendshipRequestSchema = z.object({
  email: z.string().email(),
});

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}
