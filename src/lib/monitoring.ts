import { logger } from './logger';
import { AlertData, AlertType } from './email-notifications';

// Monitoring metrics interface
interface MonitoringMetrics {
  timestamp: Date;
  apiMetrics: {
    googlePlaces: {
      requests: number;
      errors: number;
      avgResponseTime: number;
      lastError?: string;
    };
    googleMaps: {
      requests: number;
      errors: number;
      avgResponseTime: number;
      lastError?: string;
    };
    internal: {
      requests: number;
      errors: number;
      avgResponseTime: number;
      lastError?: string;
    };
  };
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  costMetrics: {
    daily: number;
    monthly: number;
    googlePlaces: number;
    googleMaps: number;
  };
}

// Circuit breaker state
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
}

// Monitoring thresholds
interface MonitoringThresholds {
  apiResponseTime: number; // ms
  apiErrorRate: number; // percentage
  systemCpu: number; // percentage
  systemMemory: number; // percentage
  systemDisk: number; // percentage
  dailyCost: number; // dollars
  monthlyCost: number; // dollars
}

// Default thresholds
const DEFAULT_THRESHOLDS: MonitoringThresholds = {
  apiResponseTime: 2000,
  apiErrorRate: 5,
  systemCpu: 80,
  systemMemory: 85,
  systemDisk: 90,
  dailyCost: 50,
  monthlyCost: 1000,
};

// Circuit breaker configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  halfOpenMaxCalls: 3,
};

// Real-time monitoring service
export class RealTimeMonitoringService {
  private metrics: MonitoringMetrics;
  private thresholds: MonitoringThresholds;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private alertCooldowns: Map<string, Date>;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.thresholds = DEFAULT_THRESHOLDS;
    this.circuitBreakers = new Map();
    this.alertCooldowns = new Map();
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      timestamp: new Date(),
      apiMetrics: {
        googlePlaces: { requests: 0, errors: 0, avgResponseTime: 0 },
        googleMaps: { requests: 0, errors: 0, avgResponseTime: 0 },
        internal: { requests: 0, errors: 0, avgResponseTime: 0 },
      },
      systemMetrics: {
        cpu: 0,
        memory: 0,
        disk: 0,
        uptime: 0,
      },
      costMetrics: {
        daily: 0,
        monthly: 0,
        googlePlaces: 0,
        googleMaps: 0,
      },
    };
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn('RealTimeMonitoringService: Monitoring already started');
      return;
    }

    logger.info('RealTimeMonitoringService: Starting real-time monitoring');
    this.isMonitoring = true;

    // Monitor every 5 minutes in production, 30 seconds in development
    const monitoringInterval =
      process.env.NODE_ENV === 'production' ? 300000 : 30000;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.updateCircuitBreakers();
    }, monitoringInterval);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.warn('RealTimeMonitoringService: Monitoring not started');
      return;
    }

    logger.info('RealTimeMonitoringService: Stopping real-time monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Collect current system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // In a real implementation, this would collect actual metrics
      // For now, we'll simulate some metrics
      this.metrics = {
        timestamp: new Date(),
        apiMetrics: {
          googlePlaces: {
            requests: Math.floor(Math.random() * 100) + 50,
            errors: Math.floor(Math.random() * 5),
            avgResponseTime: Math.floor(Math.random() * 1000) + 500,
            lastError: Math.random() > 0.8 ? 'API quota exceeded' : undefined,
          },
          googleMaps: {
            requests: Math.floor(Math.random() * 50) + 25,
            errors: Math.floor(Math.random() * 3),
            avgResponseTime: Math.floor(Math.random() * 800) + 400,
            lastError: Math.random() > 0.9 ? 'Invalid API key' : undefined,
          },
          internal: {
            requests: Math.floor(Math.random() * 200) + 100,
            errors: Math.floor(Math.random() * 2),
            avgResponseTime: Math.floor(Math.random() * 200) + 100,
            lastError:
              Math.random() > 0.95 ? 'Database connection failed' : undefined,
          },
        },
        systemMetrics: {
          cpu: Math.floor(Math.random() * 30) + 20,
          memory: Math.floor(Math.random() * 40) + 30,
          disk: Math.floor(Math.random() * 20) + 10,
          uptime: Date.now() - Math.random() * 86400000, // Random uptime up to 24 hours
        },
        costMetrics: {
          daily: Math.floor(Math.random() * 20) + 10,
          monthly: Math.floor(Math.random() * 500) + 200,
          googlePlaces: Math.floor(Math.random() * 15) + 5,
          googleMaps: Math.floor(Math.random() * 10) + 3,
        },
      };

      logger.debug('RealTimeMonitoringService: Metrics collected', {
        metrics: this.metrics,
      });
    } catch (error) {
      logger.error('RealTimeMonitoringService: Error collecting metrics', {
        error,
      });
    }
  }

  /**
   * Check if metrics exceed thresholds and trigger alerts
   */
  private async checkThresholds(): Promise<void> {
    try {
      const alerts: AlertData[] = [];

      // Check API response times
      if (
        this.metrics.apiMetrics.googlePlaces.avgResponseTime >
        this.thresholds.apiResponseTime
      ) {
        alerts.push(
          this.createAlert(
            'performance_degradation',
            'high',
            'Google Places API Response Time High',
            `Google Places API average response time is ${this.metrics.apiMetrics.googlePlaces.avgResponseTime}ms, exceeding threshold of ${this.thresholds.apiResponseTime}ms`,
            {
              responseTime:
                this.metrics.apiMetrics.googlePlaces.avgResponseTime,
              threshold: this.thresholds.apiResponseTime,
            },
            ['Google Places API'],
            [
              'Check API performance',
              'Review rate limiting',
              'Consider caching strategies',
            ]
          )
        );
      }

      if (
        this.metrics.apiMetrics.googleMaps.avgResponseTime >
        this.thresholds.apiResponseTime
      ) {
        alerts.push(
          this.createAlert(
            'performance_degradation',
            'high',
            'Google Maps API Response Time High',
            `Google Maps API average response time is ${this.metrics.apiMetrics.googleMaps.avgResponseTime}ms, exceeding threshold of ${this.thresholds.apiResponseTime}ms`,
            {
              responseTime: this.metrics.apiMetrics.googleMaps.avgResponseTime,
              threshold: this.thresholds.apiResponseTime,
            },
            ['Google Maps API'],
            [
              'Check API performance',
              'Review rate limiting',
              'Consider caching strategies',
            ]
          )
        );
      }

      // Check API error rates
      const googlePlacesErrorRate =
        (this.metrics.apiMetrics.googlePlaces.errors /
          this.metrics.apiMetrics.googlePlaces.requests) *
        100;
      if (googlePlacesErrorRate > this.thresholds.apiErrorRate) {
        alerts.push(
          this.createAlert(
            'api_failure',
            'high',
            'Google Places API Error Rate High',
            `Google Places API error rate is ${googlePlacesErrorRate.toFixed(2)}%, exceeding threshold of ${this.thresholds.apiErrorRate}%`,
            {
              errorRate: googlePlacesErrorRate,
              threshold: this.thresholds.apiErrorRate,
            },
            ['Google Places API'],
            [
              'Check API key validity',
              'Review quota limits',
              'Investigate error logs',
            ]
          )
        );
      }

      // Check system resources
      if (this.metrics.systemMetrics.cpu > this.thresholds.systemCpu) {
        alerts.push(
          this.createAlert(
            'system_resource_high',
            'high',
            'High CPU Usage',
            `CPU usage is ${this.metrics.systemMetrics.cpu}%, exceeding threshold of ${this.thresholds.systemCpu}%`,
            {
              cpu: this.metrics.systemMetrics.cpu,
              threshold: this.thresholds.systemCpu,
            },
            undefined,
            [
              'Monitor CPU-intensive processes',
              'Consider scaling resources',
              'Review application performance',
            ]
          )
        );
      }

      if (this.metrics.systemMetrics.memory > this.thresholds.systemMemory) {
        alerts.push(
          this.createAlert(
            'system_resource_high',
            'high',
            'High Memory Usage',
            `Memory usage is ${this.metrics.systemMetrics.memory}%, exceeding threshold of ${this.thresholds.systemMemory}%`,
            {
              memory: this.metrics.systemMetrics.memory,
              threshold: this.thresholds.systemMemory,
            },
            undefined,
            [
              'Monitor memory usage',
              'Check for memory leaks',
              'Consider scaling resources',
            ]
          )
        );
      }

      if (this.metrics.systemMetrics.disk > this.thresholds.systemDisk) {
        alerts.push(
          this.createAlert(
            'system_resource_high',
            'critical',
            'High Disk Usage',
            `Disk usage is ${this.metrics.systemMetrics.disk}%, exceeding threshold of ${this.thresholds.systemDisk}%`,
            {
              disk: this.metrics.systemMetrics.disk,
              threshold: this.thresholds.systemDisk,
            },
            undefined,
            [
              'Clean up disk space',
              'Archive old data',
              'Consider storage expansion',
            ]
          )
        );
      }

      // Check costs
      if (this.metrics.costMetrics.daily > this.thresholds.dailyCost) {
        alerts.push(
          this.createAlert(
            'cost_threshold_exceeded',
            'medium',
            'Daily Cost Threshold Exceeded',
            `Daily cost is $${this.metrics.costMetrics.daily}, exceeding threshold of $${this.thresholds.dailyCost}`,
            {
              dailyCost: this.metrics.costMetrics.daily,
              threshold: this.thresholds.dailyCost,
            },
            undefined,
            [
              'Review API usage',
              'Implement cost controls',
              'Consider caching strategies',
            ]
          )
        );
      }

      if (this.metrics.costMetrics.monthly > this.thresholds.monthlyCost) {
        alerts.push(
          this.createAlert(
            'cost_threshold_exceeded',
            'high',
            'Monthly Cost Threshold Exceeded',
            `Monthly cost is $${this.metrics.costMetrics.monthly}, exceeding threshold of $${this.thresholds.monthlyCost}`,
            {
              monthlyCost: this.metrics.costMetrics.monthly,
              threshold: this.thresholds.monthlyCost,
            },
            undefined,
            [
              'Review API usage patterns',
              'Implement stricter cost controls',
              'Consider alternative solutions',
            ]
          )
        );
      }

      // Send alerts
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }
    } catch (error) {
      logger.error('RealTimeMonitoringService: Error checking thresholds', {
        error,
      });
    }
  }

  /**
   * Update circuit breaker states
   */
  private updateCircuitBreakers(): void {
    const now = new Date();

    for (const [service, breaker] of this.circuitBreakers) {
      switch (breaker.state) {
        case 'open':
          if (breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
            breaker.state = 'half-open';
            breaker.successCount = 0;
            logger.info(
              'RealTimeMonitoringService: Circuit breaker half-open',
              { service }
            );
          }
          break;
        case 'half-open':
          if (breaker.successCount >= CIRCUIT_BREAKER_CONFIG.halfOpenMaxCalls) {
            breaker.state = 'closed';
            breaker.failureCount = 0;
            logger.info('RealTimeMonitoringService: Circuit breaker closed', {
              service,
            });
          }
          break;
      }
    }
  }

  /**
   * Create an alert data object
   */
  private createAlert(
    type: AlertType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
    affectedServices?: string[],
    recommendedActions?: string[]
  ): AlertData {
    return {
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      metadata,
      affectedServices,
      recommendedActions,
    };
  }

  /**
   * Send an alert with cooldown protection
   */
  private async sendAlert(alertData: AlertData): Promise<void> {
    const alertKey = `${alertData.type}_${alertData.severity}`;
    const cooldownPeriod = this.getCooldownPeriod(alertData.severity);
    const lastAlert = this.alertCooldowns.get(alertKey);

    if (lastAlert && Date.now() - lastAlert.getTime() < cooldownPeriod) {
      logger.debug(
        'RealTimeMonitoringService: Alert suppressed due to cooldown',
        { alertKey }
      );
      return;
    }

    try {
      // Send alert to admin API
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertData, sendEmail: true }),
      });

      if (response.ok) {
        this.alertCooldowns.set(alertKey, new Date());
        logger.info('RealTimeMonitoringService: Alert sent successfully', {
          alertType: alertData.type,
        });
      } else {
        logger.error('RealTimeMonitoringService: Failed to send alert', {
          alertType: alertData.type,
        });
      }
    } catch (error) {
      logger.error('RealTimeMonitoringService: Error sending alert', {
        error,
        alertType: alertData.type,
      });
    }
  }

  /**
   * Get cooldown period based on alert severity
   */
  private getCooldownPeriod(severity: string): number {
    switch (severity) {
      case 'critical':
        return 5 * 60 * 1000; // 5 minutes
      case 'high':
        return 15 * 60 * 1000; // 15 minutes
      case 'medium':
        return 30 * 60 * 1000; // 30 minutes
      case 'low':
        return 60 * 60 * 1000; // 1 hour
      default:
        return 30 * 60 * 1000; // 30 minutes
    }
  }

  /**
   * Record API call metrics
   */
  recordApiCall(
    service: 'googlePlaces' | 'googleMaps' | 'internal',
    responseTime: number,
    success: boolean
  ): void {
    if (!this.metrics.apiMetrics[service]) {
      return;
    }

    this.metrics.apiMetrics[service].requests++;
    if (!success) {
      this.metrics.apiMetrics[service].errors++;
    }

    // Update average response time
    const currentAvg = this.metrics.apiMetrics[service].avgResponseTime;
    const totalRequests = this.metrics.apiMetrics[service].requests;
    this.metrics.apiMetrics[service].avgResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;

    // Update circuit breaker
    this.updateCircuitBreakerForService(service, success);
  }

  /**
   * Update circuit breaker for a specific service
   */
  private updateCircuitBreakerForService(
    service: string,
    success: boolean
  ): void {
    let breaker = this.circuitBreakers.get(service);
    if (!breaker) {
      breaker = {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
      };
      this.circuitBreakers.set(service, breaker);
    }

    if (success) {
      breaker.successCount++;
      if (breaker.state === 'half-open') {
        // Success in half-open state
        if (breaker.successCount >= CIRCUIT_BREAKER_CONFIG.halfOpenMaxCalls) {
          breaker.state = 'closed';
          breaker.failureCount = 0;
          logger.info(
            'RealTimeMonitoringService: Circuit breaker closed after recovery',
            { service }
          );
        }
      } else if (breaker.state === 'closed') {
        breaker.failureCount = Math.max(0, breaker.failureCount - 1);
      }
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = new Date();

      if (
        breaker.state === 'closed' &&
        breaker.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold
      ) {
        breaker.state = 'open';
        breaker.nextAttemptTime = new Date(
          Date.now() + CIRCUIT_BREAKER_CONFIG.recoveryTimeout
        );
        logger.warn('RealTimeMonitoringService: Circuit breaker opened', {
          service,
          failureCount: breaker.failureCount,
        });

        // Send circuit breaker alert
        this.sendAlert(
          this.createAlert(
            'circuit_breaker_activated',
            'high',
            `Circuit Breaker Activated: ${service}`,
            `Circuit breaker for ${service} has been activated due to ${breaker.failureCount} consecutive failures`,
            { service, failureCount: breaker.failureCount },
            [service],
            [
              'Check service health',
              'Review error logs',
              'Consider scaling or fixes',
            ]
          )
        );
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  /**
   * Update monitoring thresholds
   */
  updateThresholds(newThresholds: Partial<MonitoringThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('RealTimeMonitoringService: Thresholds updated', {
      thresholds: this.thresholds,
    });
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
export const realTimeMonitoringService = new RealTimeMonitoringService();
