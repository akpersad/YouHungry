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
      groupDecisions: boolean;
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
  participants: string[]; // User IDs (Clerk user IDs as strings)
  method: 'tiered' | 'random';
  status: 'active' | 'completed' | 'expired';
  deadline: Date;
  visitDate: Date;
  result?: {
    restaurantId: ObjectId;
    selectedAt: Date;
    reasoning: string;
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
