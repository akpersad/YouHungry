import { logger } from '@/lib/logger';

// Circuit breaker pattern implementation for external API calls
// Prevents cascading failures and provides graceful degradation

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time in ms before trying to close circuit
  monitoringPeriod: number; // Time window for failure counting
  successThreshold: number; // Successes needed to close circuit from half-open
}

interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  totalRequests: number;
  totalFailures: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 300000, // 5 minutes
      successThreshold: config.successThreshold || 3,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        logger.info(`Circuit breaker: transitioning to HALF_OPEN state`);
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        logger.info(`Circuit breaker: transitioning to CLOSED state`);
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failures++;
    this.totalFailures++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.state = CircuitState.OPEN;
      this.successes = 0;
      logger.warn(
        `Circuit breaker: transitioning to OPEN state from HALF_OPEN`
      );
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(
        `Circuit breaker: transitioning to OPEN state (${this.failures} failures)`
      );
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    logger.info('Circuit breaker: manually reset');
  }
}

// Circuit breaker instances for different services
export const googlePlacesCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  successThreshold: 2,
});

export const googleMapsCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000,
  successThreshold: 2,
});

export const geocodingCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  successThreshold: 3,
});

export const addressValidationCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000,
  successThreshold: 2,
});

// Circuit breaker manager for monitoring
class CircuitBreakerManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  register(name: string, circuitBreaker: CircuitBreaker): void {
    this.circuitBreakers.set(name, circuitBreaker);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.circuitBreakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }
  }

  reset(name: string): void {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

export const circuitBreakerManager = new CircuitBreakerManager();

// Register circuit breakers
circuitBreakerManager.register('google-places', googlePlacesCircuitBreaker);
circuitBreakerManager.register('google-maps', googleMapsCircuitBreaker);
circuitBreakerManager.register('geocoding', geocodingCircuitBreaker);
circuitBreakerManager.register(
  'address-validation',
  addressValidationCircuitBreaker
);

// Helper function to wrap API calls with circuit breaker
export function withCircuitBreaker<T extends unknown[], R>(
  circuitBreaker: CircuitBreaker,
  operation: (...args: T) => Promise<R>,
  fallback?: (...args: T) => R
) {
  return async (...args: T): Promise<R> => {
    try {
      return await circuitBreaker.execute(() => operation(...args));
    } catch (error) {
      if (fallback) {
        logger.warn(`Circuit breaker: using fallback for operation`, error);
        return fallback(...args);
      }
      throw error;
    }
  };
}

// Specific circuit breaker wrappers for Google APIs
export const circuitBreakerGooglePlacesSearch = withCircuitBreaker(
  googlePlacesCircuitBreaker,
  async (query: string, location?: string, radius?: number) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const baseUrl =
      'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      query,
      key: apiKey,
      type: 'restaurant',
    });

    if (location) {
      params.append('location', location);
    }
    if (radius) {
      params.append('radius', radius.toString());
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    return response.json();
  },
  // Fallback: return empty results
  () => ({ results: [], status: 'CIRCUIT_BREAKER_FALLBACK' })
);

export const circuitBreakerGeocoding = withCircuitBreaker(
  geocodingCircuitBreaker,
  async (address: string) => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      address,
      key: apiKey,
    });

    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    return response.json();
  },
  // Fallback: return null for geocoding
  () => null
);

// Export for monitoring
export async function getCircuitBreakerStats() {
  return circuitBreakerManager.getAllStats();
}
