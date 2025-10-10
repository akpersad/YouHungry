'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SystemSettings {
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  apiKeys: {
    googlePlaces: {
      enabled: boolean;
      dailyLimit: number;
      monthlyLimit: number;
      restrictions: string[];
    };
    googleMaps: {
      enabled: boolean;
      dailyLimit: number;
      monthlyLimit: number;
      restrictions: string[];
    };
  };
  alertThresholds: {
    costAlerts: {
      dailyThreshold: number;
      monthlyThreshold: number;
      enabled: boolean;
    };
    performanceAlerts: {
      responseTimeThreshold: number;
      errorRateThreshold: number;
      enabled: boolean;
    };
    systemAlerts: {
      cpuThreshold: number;
      memoryThreshold: number;
      diskThreshold: number;
      enabled: boolean;
    };
  };
  notificationSettings: {
    email: {
      enabled: boolean;
      recipients: string[];
      frequency: 'immediate' | 'hourly' | 'daily';
    };
    sms: {
      enabled: boolean;
      recipients: string[];
      frequency: 'immediate' | 'hourly' | 'daily';
    };
    webhook: {
      enabled: boolean;
      url: string;
      secret: string;
    };
  };
  maintenance: {
    scheduledDowntime: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
      message: string;
    };
    emergencyMode: {
      enabled: boolean;
      message: string;
      contactInfo: string;
    };
  };
}

interface SettingsResponse {
  success: boolean;
  settings: SystemSettings;
  lastUpdated: string;
  error?: string;
}

export function SystemSettingsDashboard() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState<string>('rateLimiting');
  const [cacheClearing, setCacheClearing] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/settings');
      const data: SettingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.settings);
      setLastUpdated(new Date(data.lastUpdated));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
      logger.error('Admin: Error fetching system settings', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setLastUpdated(new Date(data.lastUpdated));
      logger.info('Admin: System settings saved successfully');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      logger.error('Admin: Error saving system settings', { error: err });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setShowResetConfirmation(false);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmReset: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset settings');
      }

      setSettings(data.settings);
      setSuccess('Settings reset to defaults');
      setLastUpdated(new Date(data.lastUpdated));
      logger.info('Admin: System settings reset to defaults');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      logger.error('Admin: Error resetting system settings', { error: err });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (
    section: keyof SystemSettings,
    updates: Partial<SystemSettings[keyof SystemSettings]>
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        ...updates,
      },
    });
  };

  const updateNestedSettings = (
    section: keyof SystemSettings,
    subsection: string,
    updates: Record<string, unknown>
  ) => {
    if (!settings) return;

    const currentSection = settings[section] as Record<string, unknown>;
    const currentSubsection =
      (currentSection[subsection] as Record<string, unknown>) || {};

    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [subsection]: {
          ...currentSubsection,
          ...updates,
        },
      },
    });
  };

  const clearCache = async (cacheType: string) => {
    try {
      setCacheClearing(cacheType);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cacheType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cache');
      }

      setSuccess(
        `Cleared ${data.deletedCount} cache entries of type: ${cacheType}`
      );
      logger.info(`Admin: Cleared cache type ${cacheType}`, data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
      logger.error('Admin: Error clearing cache', { error: err });
    } finally {
      setCacheClearing(null);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const sections = [
    { id: 'rateLimiting', label: 'Rate Limiting', icon: '🚦' },
    { id: 'apiKeys', label: 'API Keys', icon: '🔑' },
    { id: 'alertThresholds', label: 'Alert Thresholds', icon: '⚠️' },
    { id: 'notificationSettings', label: 'Notifications', icon: '📧' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'cache', label: 'Cache Management', icon: '🗄️' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-surface rounded w-3/4"></div>
            <div className="h-4 bg-surface rounded w-1/2"></div>
            <div className="h-4 bg-surface rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-destructive"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchSettings}
                  className="bg-destructive/10 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-destructive/10"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-text-light">No settings available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text">System Settings</h2>
          <p className="text-sm text-text-light">
            Configure system-wide settings and monitoring thresholds
          </p>
          {lastUpdated && (
            <p className="text-xs text-text-light mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetSettings}
            disabled={saving}
            className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text hover:bg-surface disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-6 bg-success/10 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-success"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-light hover:bg-surface'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {activeSection === 'rateLimiting' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  Rate Limiting
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rateLimitingEnabled"
                      checked={settings.rateLimiting.enabled}
                      onChange={(e) =>
                        updateSettings('rateLimiting', {
                          enabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="rateLimitingEnabled"
                      className="ml-2 text-sm text-text"
                    >
                      Enable rate limiting
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Requests per minute
                      </label>
                      <input
                        type="number"
                        value={settings.rateLimiting.requestsPerMinute}
                        onChange={(e) =>
                          updateSettings('rateLimiting', {
                            requestsPerMinute: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Requests per hour
                      </label>
                      <input
                        type="number"
                        value={settings.rateLimiting.requestsPerHour}
                        onChange={(e) =>
                          updateSettings('rateLimiting', {
                            requestsPerHour: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Requests per day
                      </label>
                      <input
                        type="number"
                        value={settings.rateLimiting.requestsPerDay}
                        onChange={(e) =>
                          updateSettings('rateLimiting', {
                            requestsPerDay: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">
                        Burst limit
                      </label>
                      <input
                        type="number"
                        value={settings.rateLimiting.burstLimit}
                        onChange={(e) =>
                          updateSettings('rateLimiting', {
                            burstLimit: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'apiKeys' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  API Key Management
                </h3>
                <div className="space-y-6">
                  {/* Google Places API */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Google Places API
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="googlePlacesEnabled"
                          checked={settings.apiKeys.googlePlaces.enabled}
                          onChange={(e) =>
                            updateNestedSettings('apiKeys', 'googlePlaces', {
                              enabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="googlePlacesEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable Google Places API
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Daily limit
                          </label>
                          <input
                            type="number"
                            value={settings.apiKeys.googlePlaces.dailyLimit}
                            onChange={(e) =>
                              updateNestedSettings('apiKeys', 'googlePlaces', {
                                dailyLimit: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Monthly limit
                          </label>
                          <input
                            type="number"
                            value={settings.apiKeys.googlePlaces.monthlyLimit}
                            onChange={(e) =>
                              updateNestedSettings('apiKeys', 'googlePlaces', {
                                monthlyLimit: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Google Maps API */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Google Maps API
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="googleMapsEnabled"
                          checked={settings.apiKeys.googleMaps.enabled}
                          onChange={(e) =>
                            updateNestedSettings('apiKeys', 'googleMaps', {
                              enabled: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="googleMapsEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable Google Maps API
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Daily limit
                          </label>
                          <input
                            type="number"
                            value={settings.apiKeys.googleMaps.dailyLimit}
                            onChange={(e) =>
                              updateNestedSettings('apiKeys', 'googleMaps', {
                                dailyLimit: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Monthly limit
                          </label>
                          <input
                            type="number"
                            value={settings.apiKeys.googleMaps.monthlyLimit}
                            onChange={(e) =>
                              updateNestedSettings('apiKeys', 'googleMaps', {
                                monthlyLimit: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'alertThresholds' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  Alert Thresholds
                </h3>
                <div className="space-y-6">
                  {/* Cost Alerts */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Cost Alerts
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="costAlertsEnabled"
                          checked={settings.alertThresholds.costAlerts.enabled}
                          onChange={(e) =>
                            updateNestedSettings(
                              'alertThresholds',
                              'costAlerts',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="costAlertsEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable cost alerts
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Daily threshold ($)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.costAlerts.dailyThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'costAlerts',
                                { dailyThreshold: parseFloat(e.target.value) }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Monthly threshold ($)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.costAlerts
                                .monthlyThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'costAlerts',
                                { monthlyThreshold: parseFloat(e.target.value) }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Alerts */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Performance Alerts
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="performanceAlertsEnabled"
                          checked={
                            settings.alertThresholds.performanceAlerts.enabled
                          }
                          onChange={(e) =>
                            updateNestedSettings(
                              'alertThresholds',
                              'performanceAlerts',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="performanceAlertsEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable performance alerts
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Response time threshold (ms)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.performanceAlerts
                                .responseTimeThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'performanceAlerts',
                                {
                                  responseTimeThreshold: parseInt(
                                    e.target.value
                                  ),
                                }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Error rate threshold (%)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.performanceAlerts
                                .errorRateThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'performanceAlerts',
                                {
                                  errorRateThreshold: parseFloat(
                                    e.target.value
                                  ),
                                }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Alerts */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      System Alerts
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="systemAlertsEnabled"
                          checked={
                            settings.alertThresholds.systemAlerts.enabled
                          }
                          onChange={(e) =>
                            updateNestedSettings(
                              'alertThresholds',
                              'systemAlerts',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="systemAlertsEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable system alerts
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            CPU threshold (%)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.systemAlerts.cpuThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'systemAlerts',
                                { cpuThreshold: parseInt(e.target.value) }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Memory threshold (%)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.systemAlerts
                                .memoryThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'systemAlerts',
                                { memoryThreshold: parseInt(e.target.value) }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Disk threshold (%)
                          </label>
                          <input
                            type="number"
                            value={
                              settings.alertThresholds.systemAlerts
                                .diskThreshold
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'alertThresholds',
                                'systemAlerts',
                                { diskThreshold: parseInt(e.target.value) }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notificationSettings' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  Notification Settings
                </h3>
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Email Notifications
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="emailEnabled"
                          checked={settings.notificationSettings.email.enabled}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'email',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="emailEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable email notifications
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Recipients (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={settings.notificationSettings.email.recipients.join(
                            ', '
                          )}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'email',
                              {
                                recipients: e.target.value
                                  .split(',')
                                  .map((email) => email.trim())
                                  .filter((email) => email),
                              }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          placeholder="akpersad@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Frequency
                        </label>
                        <select
                          value={settings.notificationSettings.email.frequency}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'email',
                              {
                                frequency: e.target.value as
                                  | 'immediate'
                                  | 'hourly'
                                  | 'daily',
                              }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      SMS Notifications
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="smsEnabled"
                          checked={settings.notificationSettings.sms.enabled}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'sms',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="smsEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable SMS notifications
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Recipients (comma-separated phone numbers)
                        </label>
                        <input
                          type="text"
                          value={settings.notificationSettings.sms.recipients.join(
                            ', '
                          )}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'sms',
                              {
                                recipients: e.target.value
                                  .split(',')
                                  .map((phone) => phone.trim())
                                  .filter((phone) => phone),
                              }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          placeholder="+1234567890, +0987654321"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Frequency
                        </label>
                        <select
                          value={settings.notificationSettings.sms.frequency}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'sms',
                              {
                                frequency: e.target.value as
                                  | 'immediate'
                                  | 'hourly'
                                  | 'daily',
                              }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Webhook Notifications */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Webhook Notifications
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="webhookEnabled"
                          checked={
                            settings.notificationSettings.webhook.enabled
                          }
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'webhook',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="webhookEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable webhook notifications
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={settings.notificationSettings.webhook.url}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'webhook',
                              { url: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Webhook Secret
                        </label>
                        <input
                          type="password"
                          value={settings.notificationSettings.webhook.secret}
                          onChange={(e) =>
                            updateNestedSettings(
                              'notificationSettings',
                              'webhook',
                              { secret: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          placeholder="Enter webhook secret"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'maintenance' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  Maintenance Settings
                </h3>
                <div className="space-y-6">
                  {/* Scheduled Downtime */}
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="text-md font-medium text-text mb-3">
                      Scheduled Downtime
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="scheduledDowntimeEnabled"
                          checked={
                            settings.maintenance.scheduledDowntime.enabled
                          }
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'scheduledDowntime',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        />
                        <label
                          htmlFor="scheduledDowntimeEnabled"
                          className="ml-2 text-sm text-text"
                        >
                          Enable scheduled downtime
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            Start time
                          </label>
                          <input
                            type="time"
                            value={
                              settings.maintenance.scheduledDowntime.startTime
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'maintenance',
                                'scheduledDowntime',
                                { startTime: e.target.value }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-1">
                            End time
                          </label>
                          <input
                            type="time"
                            value={
                              settings.maintenance.scheduledDowntime.endTime
                            }
                            onChange={(e) =>
                              updateNestedSettings(
                                'maintenance',
                                'scheduledDowntime',
                                { endTime: e.target.value }
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Timezone
                        </label>
                        <select
                          value={
                            settings.maintenance.scheduledDowntime.timezone
                          }
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'scheduledDowntime',
                              { timezone: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">
                            Pacific Time
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-1">
                          Maintenance message
                        </label>
                        <textarea
                          value={settings.maintenance.scheduledDowntime.message}
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'scheduledDowntime',
                              { message: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          rows={3}
                          placeholder="System is currently under maintenance..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Mode */}
                  <div className="border border-destructive rounded-lg p-4 bg-destructive/10">
                    <h4 className="text-md font-medium text-red-900 mb-3">
                      Emergency Mode
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="emergencyModeEnabled"
                          checked={settings.maintenance.emergencyMode.enabled}
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'emergencyMode',
                              { enabled: e.target.checked }
                            )
                          }
                          className="h-4 w-4 text-destructive focus:ring-destructive border-destructive rounded"
                        />
                        <label
                          htmlFor="emergencyModeEnabled"
                          className="ml-2 text-sm text-red-700"
                        >
                          Enable emergency mode
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Emergency message
                        </label>
                        <textarea
                          value={settings.maintenance.emergencyMode.message}
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'emergencyMode',
                              { message: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-destructive rounded-md focus:outline-none focus:ring-destructive focus:border-destructive"
                          rows={3}
                          placeholder="System is currently experiencing issues..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Contact information
                        </label>
                        <input
                          type="text"
                          value={settings.maintenance.emergencyMode.contactInfo}
                          onChange={(e) =>
                            updateNestedSettings(
                              'maintenance',
                              'emergencyMode',
                              { contactInfo: e.target.value }
                            )
                          }
                          className="w-full px-3 py-2 border border-destructive rounded-md focus:outline-none focus:ring-destructive focus:border-destructive"
                          placeholder="akpersad@gmail.com, +1234567890"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cache' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-text mb-4">
                  Cache Management
                </h3>
                <div className="mb-4 bg-primary/10 border border-primary rounded-lg p-4">
                  <p className="text-sm text-primary">
                    Clear cached data to force fresh API calls. Use this when
                    you suspect cached data is stale or causing issues.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Restaurant Search Cache */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-md font-medium text-text">
                          Restaurant Search Cache
                        </h4>
                        <p className="text-sm text-text-light mt-1">
                          Cached restaurant search results from Google Places
                          API (7 day TTL)
                        </p>
                      </div>
                      <button
                        onClick={() => clearCache('restaurant_search')}
                        disabled={cacheClearing === 'restaurant_search'}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {cacheClearing === 'restaurant_search'
                          ? 'Clearing...'
                          : 'Clear Cache'}
                      </button>
                    </div>
                  </div>

                  {/* Geocoding Cache */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-md font-medium text-text">
                          Geocoding Cache
                        </h4>
                        <p className="text-sm text-text-light mt-1">
                          Cached address-to-coordinates conversions (90 day TTL)
                        </p>
                      </div>
                      <button
                        onClick={() => clearCache('geocoding')}
                        disabled={cacheClearing === 'geocoding'}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {cacheClearing === 'geocoding'
                          ? 'Clearing...'
                          : 'Clear Cache'}
                      </button>
                    </div>
                  </div>

                  {/* Address Validation Cache */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-md font-medium text-text">
                          Address Validation Cache
                        </h4>
                        <p className="text-sm text-text-light mt-1">
                          Cached address validation results (90 day TTL)
                        </p>
                      </div>
                      <button
                        onClick={() => clearCache('address_validation')}
                        disabled={cacheClearing === 'address_validation'}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {cacheClearing === 'address_validation'
                          ? 'Clearing...'
                          : 'Clear Cache'}
                      </button>
                    </div>
                  </div>

                  {/* Restaurant Details Cache */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-md font-medium text-text">
                          Restaurant Details Cache
                        </h4>
                        <p className="text-sm text-text-light mt-1">
                          Cached detailed restaurant information (30 day TTL)
                        </p>
                      </div>
                      <button
                        onClick={() => clearCache('restaurant_details')}
                        disabled={cacheClearing === 'restaurant_details'}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {cacheClearing === 'restaurant_details'
                          ? 'Clearing...'
                          : 'Clear Cache'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        title="Reset Settings to Defaults?"
      >
        <div className="space-y-4">
          <p className="text-text">
            Are you sure you want to reset all settings to defaults? This action
            cannot be undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowResetConfirmation(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetSettings}
              className="bg-red-600 hover:bg-red-700"
              disabled={saving}
            >
              Reset Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
