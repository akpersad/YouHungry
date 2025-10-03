import { logger } from '@/lib/logger';

// Offline Storage Utilities for PWA
// Handles IndexedDB operations for offline data persistence

const DB_NAME = 'YouHungryOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  RESTAURANTS: 'restaurants',
  COLLECTIONS: 'collections',
  DECISIONS: 'decisions',
  VOTES: 'votes',
  OFFLINE_ACTIONS: 'offlineActions',
} as const;

// Database schema
const DB_SCHEMA = {
  [STORES.RESTAURANTS]: { keyPath: 'id', autoIncrement: false },
  [STORES.COLLECTIONS]: { keyPath: 'id', autoIncrement: false },
  [STORES.DECISIONS]: { keyPath: 'id', autoIncrement: false },
  [STORES.VOTES]: { keyPath: 'id', autoIncrement: true },
  [STORES.OFFLINE_ACTIONS]: { keyPath: 'id', autoIncrement: true },
};

// Types for offline storage
export interface OfflineRestaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  cuisine?: string[];
  lastUpdated: number;
}

export interface OfflineCollection {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'group';
  groupId?: string;
  restaurantIds: string[];
  lastUpdated: number;
}

export interface OfflineDecision {
  id: string;
  collectionId: string;
  type: 'random' | 'tiered';
  status: 'pending' | 'completed' | 'expired';
  result?: {
    restaurantId: string;
    restaurantName: string;
    reasoning: string;
  };
  createdAt: number;
  completedAt?: number;
}

export interface OfflineVote {
  id: number;
  decisionId: string;
  userId: string;
  restaurantId: string;
  rank: number;
  submittedAt: number;
}

export interface OfflineAction {
  id: number;
  type: 'restaurant_vote' | 'collection_update' | 'decision_create';
  data: Record<string, unknown>;
  url: string;
  method: string;
  headers: Record<string, string>;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return resolved promise if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.debug('IndexedDB opened successfully');
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.entries(DB_SCHEMA).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, config);

            // Create indexes for better querying
            if (storeName === STORES.RESTAURANTS) {
              store.createIndex('lastUpdated', 'lastUpdated', {
                unique: false,
              });
            }
            if (storeName === STORES.COLLECTIONS) {
              store.createIndex('type', 'type', { unique: false });
              store.createIndex('groupId', 'groupId', { unique: false });
            }
            if (storeName === STORES.DECISIONS) {
              store.createIndex('collectionId', 'collectionId', {
                unique: false,
              });
              store.createIndex('status', 'status', { unique: false });
            }
            if (storeName === STORES.VOTES) {
              store.createIndex('decisionId', 'decisionId', { unique: false });
              store.createIndex('userId', 'userId', { unique: false });
            }
            if (storeName === STORES.OFFLINE_ACTIONS) {
              store.createIndex('type', 'type', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
          }
        });
      };
    });
  }

  private async getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }

    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Restaurant operations
  async saveRestaurant(restaurant: OfflineRestaurant): Promise<void> {
    const store = await this.getStore(STORES.RESTAURANTS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(restaurant);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRestaurant(id: string): Promise<OfflineRestaurant | null> {
    const store = await this.getStore(STORES.RESTAURANTS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllRestaurants(): Promise<OfflineRestaurant[]> {
    const store = await this.getStore(STORES.RESTAURANTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Collection operations
  async saveCollection(collection: OfflineCollection): Promise<void> {
    const store = await this.getStore(STORES.COLLECTIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(collection);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCollection(id: string): Promise<OfflineCollection | null> {
    const store = await this.getStore(STORES.COLLECTIONS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCollections(): Promise<OfflineCollection[]> {
    const store = await this.getStore(STORES.COLLECTIONS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Decision operations
  async saveDecision(decision: OfflineDecision): Promise<void> {
    const store = await this.getStore(STORES.DECISIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(decision);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDecision(id: string): Promise<OfflineDecision | null> {
    const store = await this.getStore(STORES.DECISIONS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDecisions(): Promise<OfflineDecision[]> {
    const store = await this.getStore(STORES.DECISIONS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Vote operations
  async saveVote(vote: Omit<OfflineVote, 'id'>): Promise<number> {
    const store = await this.getStore(STORES.VOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(vote);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getVotesForDecision(decisionId: string): Promise<OfflineVote[]> {
    const store = await this.getStore(STORES.VOTES);
    const index = store.index('decisionId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(decisionId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Offline action operations
  async saveOfflineAction(action: Omit<OfflineAction, 'id'>): Promise<number> {
    const store = await this.getStore(STORES.OFFLINE_ACTIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOfflineActions(): Promise<OfflineAction[]> {
    const store = await this.getStore(STORES.OFFLINE_ACTIONS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOfflineAction(id: number): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_ACTIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateOfflineAction(
    id: number,
    updates: Partial<OfflineAction>
  ): Promise<void> {
    const store = await this.getStore(STORES.OFFLINE_ACTIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          const updatedAction = { ...action, ...updates };
          const putRequest = store.put(updatedAction);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Action not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cleanup operations
  async clearExpiredData(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    const cutoff = Date.now() - maxAge;

    // Clear expired restaurants
    const restaurants = await this.getAllRestaurants();
    const expiredRestaurants = restaurants.filter(
      (r) => r.lastUpdated < cutoff
    );

    for (const restaurant of expiredRestaurants) {
      const store = await this.getStore(STORES.RESTAURANTS, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(restaurant.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Clear expired offline actions
    const actions = await this.getAllOfflineActions();
    const expiredActions = actions.filter((a) => a.createdAt < cutoff);

    for (const action of expiredActions) {
      await this.removeOfflineAction(action.id);
    }
  }

  // Sync status
  async getSyncStatus(): Promise<{
    totalActions: number;
    pendingActions: number;
    lastSync: number | null;
  }> {
    const actions = await this.getAllOfflineActions();
    const pendingActions = actions.filter((a) => a.retryCount < a.maxRetries);

    return {
      totalActions: actions.length,
      pendingActions: pendingActions.length,
      lastSync:
        actions.length > 0
          ? Math.max(...actions.map((a) => a.createdAt))
          : null,
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on module load only once
let isInitialized = false;
if (typeof window !== 'undefined' && 'indexedDB' in window && !isInitialized) {
  isInitialized = true;
  offlineStorage.init().catch(console.error);
}
