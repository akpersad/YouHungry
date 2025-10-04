'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
  affectedServices?: string[];
  recommendedActions?: string[];
}

interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unacknowledged: number;
  unresolved: number;
}

interface AlertsResponse {
  success: boolean;
  alerts: Alert[];
  stats: AlertStats;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export function AdminAlertsDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('akpersad@gmail.com');

  const fetchAlerts = async (filter: string = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'all') {
        if (filter === 'unacknowledged') {
          params.append('acknowledged', 'false');
        } else if (filter === 'unresolved') {
          params.append('resolved', 'false');
        } else if (['critical', 'high', 'medium', 'low'].includes(filter)) {
          params.append('severity', filter);
        }
      }
      params.append('limit', '50');

      const response = await fetch(`/api/admin/alerts?${params}`);
      const data: AlertsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.success === false ? 'Failed to fetch alerts' : 'Unknown error'
        );
      }

      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch alerts';
      setError(errorMessage);
      logger.error('Admin: Error fetching alerts', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          action: 'acknowledge',
          userId: 'admin', // In a real app, this would be the current user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                acknowledged: true,
                acknowledgedBy: 'admin',
                acknowledgedAt: new Date(),
              }
            : alert
        )
      );

      logger.info('Admin: Alert acknowledged', { alertId });
    } catch (err) {
      logger.error('Admin: Error acknowledging alert', { error: err, alertId });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          action: 'resolve',
          userId: 'admin', // In a real app, this would be the current user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                resolved: true,
                resolvedBy: 'admin',
                resolvedAt: new Date(),
              }
            : alert
        )
      );

      logger.info('Admin: Alert resolved', { alertId });
    } catch (err) {
      logger.error('Admin: Error resolving alert', { error: err, alertId });
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/alerts?id=${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }

      // Update local state
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setSelectedAlert(null);

      logger.info('Admin: Alert deleted', { alertId });
    } catch (err) {
      logger.error('Admin: Error deleting alert', { error: err, alertId });
    }
  };

  const sendTestEmail = async () => {
    try {
      setEmailTestLoading(true);
      setEmailTestResult(null);

      const response = await fetch('/api/admin/alerts/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient: testEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailTestResult('Test email sent successfully!');
      } else {
        setEmailTestResult(`Failed to send test email: ${data.error}`);
      }
    } catch (err) {
      setEmailTestResult('Error sending test email');
      logger.error('Admin: Error sending test email', { error: err });
    } finally {
      setEmailTestLoading(false);
    }
  };

  const validateEmailConfig = async () => {
    try {
      const response = await fetch('/api/admin/alerts/test-email');
      const data = await response.json();

      if (data.success && data.valid) {
        setEmailTestResult('Email configuration is valid');
      } else {
        setEmailTestResult(`Email configuration invalid: ${data.error}`);
      }
    } catch (err) {
      setEmailTestResult('Error validating email configuration');
      logger.error('Admin: Error validating email configuration', {
        error: err,
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  useEffect(() => {
    fetchAlerts(activeFilter);
  }, [activeFilter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
                  onClick={() => fetchAlerts(activeFilter)}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Alerts</h2>
          <p className="text-sm text-gray-600">
            Monitor system alerts and notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={validateEmailConfig}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Validate Email Config
          </button>
          <button
            onClick={() => fetchAlerts(activeFilter)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Email Test Section */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Email Test</h3>
        <div className="flex space-x-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="akpersad@gmail.com"
            />
          </div>
          <button
            onClick={sendTestEmail}
            disabled={emailTestLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {emailTestLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        {emailTestResult && (
          <div
            className={`mt-3 p-3 rounded-md text-sm ${
              emailTestResult.includes('successfully') ||
              emailTestResult.includes('valid')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {emailTestResult}
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.high}
            </div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.medium}
            </div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
            <div className="text-sm text-gray-600">Low</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.unacknowledged}
            </div>
            <div className="text-sm text-gray-600">Unacknowledged</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.unresolved}
            </div>
            <div className="text-sm text-gray-600">Unresolved</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Alerts' },
            { key: 'unacknowledged', label: 'Unacknowledged' },
            { key: 'unresolved', label: 'Unresolved' },
            { key: 'critical', label: 'Critical' },
            { key: 'high', label: 'High' },
            { key: 'medium', label: 'Medium' },
            { key: 'low', label: 'Low' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeFilter === filter.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow">
        {!alerts || alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeFilter === 'all'
                  ? 'No alerts have been generated yet.'
                  : `No ${activeFilter} alerts found.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  selectedAlert?.id === alert.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {alert.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                        {!alert.acknowledged && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Unacknowledged
                          </span>
                        )}
                        {!alert.resolved && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Unresolved
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {alert.acknowledgedBy && (
                          <span>Acknowledged by {alert.acknowledgedBy}</span>
                        )}
                        {alert.resolvedBy && (
                          <span>Resolved by {alert.resolvedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          acknowledgeAlert(alert.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Acknowledge
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAlert(alert.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAlert(alert.id);
                      }}
                      className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Alert Details
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {getSeverityIcon(selectedAlert.severity)}
                  </span>
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedAlert.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}
                  >
                    {selectedAlert.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Timestamp:</span>
                  <p className="text-gray-600">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-gray-600">{selectedAlert.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Acknowledged:
                  </span>
                  <p className="text-gray-600">
                    {selectedAlert.acknowledged ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Resolved:</span>
                  <p className="text-gray-600">
                    {selectedAlert.resolved ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {selectedAlert.affectedServices &&
                selectedAlert.affectedServices.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Affected Services:
                    </span>
                    <ul className="mt-1 text-sm text-gray-600">
                      {selectedAlert.affectedServices.map((service, index) => (
                        <li key={index}>• {service}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedAlert.metadata &&
                Object.keys(selectedAlert.metadata).length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Additional Information:
                    </span>
                    <div className="mt-1 text-sm text-gray-600">
                      {Object.entries(selectedAlert.metadata).map(
                        ([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedAlert.recommendedActions &&
                selectedAlert.recommendedActions.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Recommended Actions:
                    </span>
                    <ul className="mt-1 text-sm text-gray-600">
                      {selectedAlert.recommendedActions.map((action, index) => (
                        <li key={index}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                {!selectedAlert.acknowledged && (
                  <button
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Acknowledge
                  </button>
                )}
                {!selectedAlert.resolved && (
                  <button
                    onClick={() => {
                      resolveAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
