import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  clerkId: string;
  email: string;
  name: string;
  username?: string;
  city?: string;
  state?: string;
  profilePicture?: string;
  smsOptIn: boolean;
  smsPhoneNumber?: string;
  phoneNumber?: string; // Clerk phone number
  preferences: {
    defaultLocation?: string;
    locationSettings: {
      city?: string;
      state?: string;
      country?: string;
      timezone?: string;
    };
    notificationSettings: {
      groupDecisions: {
        started: boolean; // Notify when a decision is started
        completed: boolean; // Notify when a decision is finalized
      };
      friendRequests: boolean;
      groupInvites: boolean;
      smsEnabled: boolean;
      emailEnabled: boolean;
      pushEnabled: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Restaurant {
  _id: ObjectId;
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  cuisine: string;
  rating: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  timeToPickUp?: number; // minutes
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  hours?: {
    [key: string]: string;
  };
  distance?: number; // miles from search location
  cachedAt: Date;
  lastUpdated: Date;
}

export interface Collection {
  _id: ObjectId;
  name: string;
  description?: string;
  type: 'personal' | 'group';
  ownerId: ObjectId; // User ID for personal, Group ID for group
  restaurantIds: (
    | ObjectId
    | { _id: ObjectId; googlePlaceId: string }
    | { googlePlaceId: string }
  )[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  _id: ObjectId;
  name: string;
  description?: string;
  adminIds: ObjectId[];
  memberIds: ObjectId[];
  collectionIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Decision {
  _id: ObjectId;
  type: 'personal' | 'group';
  collectionId: ObjectId;
  groupId?: ObjectId;
  createdBy?: ObjectId; // User ID of the person who started the decision
  participants: string[]; // User IDs (Clerk user IDs as strings)
  method: 'tiered' | 'random' | 'manual'; // 'manual' for user-entered past decisions
  status: 'active' | 'completed' | 'expired';
  deadline: Date;
  visitDate: Date; // When user actually visited (for manual entries) or when they will visit (for decisions)
  result?: {
    restaurantId: ObjectId;
    selectedAt: Date;
    reasoning: string; // For manual decisions, stores optional user notes
    weights?: { [restaurantId: string]: number };
  };
  votes?: {
    userId: string; // Clerk user ID as string
    rankings: ObjectId[]; // Restaurant IDs in order
    submittedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Decision Method Types:
 * - 'tiered': Group voting with weighted rankings (1st = 3 points, 2nd = 2 points, 3rd = 1 point)
 * - 'random': Weighted random selection using 30-day rolling history to ensure variety
 * - 'manual': User-entered past restaurant visit for history tracking and weight system integration
 */

export interface Friendship {
  _id: ObjectId;
  requesterId: ObjectId;
  addresseeId: ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupInvitation {
  _id: ObjectId;
  groupId: ObjectId;
  inviterId: ObjectId;
  inviteeId: ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface InAppNotification {
  _id: ObjectId;
  userId: ObjectId; // Recipient user ID
  type:
    | 'group_decision'
    | 'friend_request'
    | 'group_invitation'
    | 'decision_result'
    | 'admin_alert';
  title: string;
  message: string;
  data?: {
    groupId?: ObjectId;
    decisionId?: ObjectId;
    requesterId?: ObjectId;
    inviterId?: ObjectId;
    restaurantId?: ObjectId;
    [key: string]: unknown;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShortUrl {
  _id: ObjectId;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt?: Date;
  clickCount: number;
}

export interface ErrorLog {
  _id: ObjectId;
  // Error fingerprint for grouping similar errors
  fingerprint: string;
  // Error details
  message: string;
  stack?: string;
  componentStack?: string;
  // User context
  userId?: ObjectId;
  userEmail?: string;
  userName?: string;
  // Environment context
  url: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  screenSize?: string;
  // Breadcrumbs (user actions leading to error)
  breadcrumbs?: {
    timestamp: Date;
    action: string;
    data?: Record<string, unknown>;
  }[];
  // Classification
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'client' | 'server' | 'network' | 'api';
  // Additional context
  additionalData?: Record<string, unknown>;
  // User report
  userReport?: {
    description: string;
    reportedAt: Date;
  };
  // Status tracking
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: ObjectId;
  notes?: string;
  // Metadata
  occurrenceCount: number; // How many times this specific error occurred
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorGroup {
  _id: ObjectId;
  fingerprint: string; // Unique identifier for this error type
  message: string;
  stack?: string;
  // Aggregated statistics
  totalOccurrences: number;
  affectedUsers: number;
  affectedUserIds: ObjectId[];
  // Classification
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'client' | 'server' | 'network' | 'api';
  // Status
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolvedAt?: Date;
  resolvedBy?: ObjectId;
  notes?: string;
  // Metadata
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
