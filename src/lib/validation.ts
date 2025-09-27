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
      groupDecisions: z.boolean().default(true),
      friendRequests: z.boolean().default(true),
      groupInvites: z.boolean().default(true),
    }),
  }),
});

// Collection validation schemas
export const collectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['personal', 'group']),
});

// Restaurant validation schemas
export const restaurantSearchSchema = z.object({
  query: z.string().max(100).optional(),
  location: z.string().min(1).max(200),
});

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
