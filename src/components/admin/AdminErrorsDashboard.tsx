'use client';

/**
 * Admin Errors Dashboard
 *
 * Comprehensive error monitoring and management interface for admins.
 * Shows error groups, statistics, trends, and individual error details.
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  RefreshCw,
  Check,
  Eye,
  Trash2,
  Filter,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ErrorGroup {
  _id: string;
  fingerprint: string;
  message: string;
  stack?: string;
  totalOccurrences: number;
  affectedUsers: number;
  affectedUserIds: string[];
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'client' | 'server' | 'network' | 'api';
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolvedAt?: string;
  notes?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  affectedUsers: number;
  errorRate: number;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    occurrences: number;
    affectedUsers: number;
  }>;
}

interface ErrorLog {
  _id: string;
  fingerprint: string;
  message: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  url: string;
  browser?: string;
  device?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'client' | 'server' | 'network' | 'api';
  userReport?: {
    description: string;
    reportedAt: string;
  };
  createdAt: string;
}

export function AdminErrorsDashboard() {
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    fetchErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, severityFilter, categoryFilter]);

  const fetchErrors = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/admin/errors?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to fetch errors:', data.error || 'Unknown error');
        setErrorGroups([]);
        setErrorStats(null);
        return;
      }

      setErrorGroups(data.groups || []);
      setErrorStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      setErrorGroups([]);
      setErrorStats(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchGroupDetails = async (fingerprint: string) => {
    try {
      const response = await fetch(`/api/admin/errors?groupId=${fingerprint}`);
      const data = await response.json();

      setSelectedGroup(data.group);
      setErrorLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    }
  };

  const updateErrorStatus = async (
    fingerprint: string,
    status: string,
    notes?: string
  ) => {
    try {
      await fetch(`/api/admin/errors/${fingerprint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      await fetchErrors();
      if (selectedGroup?.fingerprint === fingerprint) {
        await fetchGroupDetails(fingerprint);
      }
    } catch (error) {
      console.error('Failed to update error status:', error);
    }
  };

  const deleteErrorGroup = async (fingerprint: string) => {
    if (!confirm('Are you sure you want to delete this error group?')) return;

    try {
      await fetch(`/api/admin/errors/${fingerprint}`, {
        method: 'DELETE',
      });

      await fetchErrors();
      if (selectedGroup?.fingerprint === fingerprint) {
        setSelectedGroup(null);
        setErrorLogs([]);
      }
    } catch (error) {
      console.error('Failed to delete error group:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="h-4 w-4 text-destructive" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/10 text-red-800 border-destructive';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-primary/10 text-blue-800 border-primary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw
            className="h-8 w-8 animate-spin mx-auto mb-2"
            style={{ color: 'var(--accent-primary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading errors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Errors"
            value={errorStats.totalErrors}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="orange"
          />
          <StatCard
            title="Critical Errors"
            value={errorStats.criticalErrors}
            icon={<AlertOctagon className="h-5 w-5" />}
            color="red"
          />
          <StatCard
            title="Affected Users"
            value={errorStats.affectedUsers}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Error Rate"
            value={`${errorStats.errorRate}/hr`}
            icon={<Activity className="h-5 w-5" />}
            color="purple"
          />
        </div>
      )}

      {/* Filters and Actions */}
      <div
        className="rounded-lg p-4 border"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--bg-quaternary)',
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Filter
              className="h-5 w-5"
              style={{ color: 'var(--text-secondary)' }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 rounded border text-sm"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--bg-quaternary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1 rounded border text-sm"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--bg-quaternary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 rounded border text-sm"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--bg-quaternary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">All Categories</option>
              <option value="client">Client</option>
              <option value="server">Server</option>
              <option value="network">Network</option>
              <option value="api">API</option>
            </select>
          </div>

          <Button
            onClick={fetchErrors}
            variant="secondary"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Groups List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Error Groups ({errorGroups.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {errorGroups.length === 0 ? (
              <div
                className="text-center py-12"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Check
                  className="h-12 w-12 mx-auto mb-2"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <p>No errors found! 🎉</p>
              </div>
            ) : (
              errorGroups.map((group) => (
                <div
                  key={group.fingerprint}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                    selectedGroup?.fingerprint === group.fingerprint &&
                      'ring-2 ring-primary'
                  )}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--bg-quaternary)',
                  }}
                  onClick={() => fetchGroupDetails(group.fingerprint)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(group.severity)}
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded border',
                            getSeverityColor(group.severity)
                          )}
                        >
                          {group.severity}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded border"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--bg-quaternary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {group.category}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded border"
                          style={{
                            background: 'var(--bg-tertiary)',
                            borderColor: 'var(--bg-quaternary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {group.status}
                        </span>
                      </div>

                      <p
                        className="text-sm font-medium mb-1 truncate"
                        style={{ color: 'var(--text-primary)' }}
                        title={group.message}
                      >
                        {group.message}
                      </p>

                      <div
                        className="flex items-center gap-4 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {group.totalOccurrences} occurrences
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.affectedUsers} users
                        </span>
                      </div>
                    </div>

                    <Eye
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: 'var(--text-light)' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Details */}
        <div className="space-y-3">
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Error Details
          </h3>

          {selectedGroup ? (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg border"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--bg-quaternary)',
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Error Message
                    </label>
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {selectedGroup.message}
                    </p>
                  </div>

                  {selectedGroup.stack && (
                    <details>
                      <summary
                        className="text-sm font-medium cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Stack Trace
                      </summary>
                      <pre
                        className="text-xs p-3 rounded mt-2 overflow-auto max-h-40"
                        style={{
                          background: 'var(--bg-quaternary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {selectedGroup.stack}
                      </pre>
                    </details>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label
                        className="font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        First Seen
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {new Date(selectedGroup.firstSeenAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label
                        className="font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Last Seen
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {new Date(selectedGroup.lastSeenAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedGroup.notes && (
                    <div>
                      <label
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Notes
                      </label>
                      <p
                        className="text-sm mt-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {selectedGroup.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() =>
                        updateErrorStatus(
                          selectedGroup.fingerprint,
                          'investigating'
                        )
                      }
                      variant="secondary"
                      className="flex-1"
                      disabled={selectedGroup.status === 'investigating'}
                    >
                      Investigate
                    </Button>
                    <Button
                      onClick={() =>
                        updateErrorStatus(selectedGroup.fingerprint, 'resolved')
                      }
                      variant="primary"
                      className="flex-1"
                      disabled={selectedGroup.status === 'resolved'}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      onClick={() =>
                        deleteErrorGroup(selectedGroup.fingerprint)
                      }
                      variant="accent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Individual Error Logs */}
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Recent Occurrences ({errorLogs.length})
                </h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {errorLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-3 rounded border text-sm"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--bg-quaternary)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {log.userEmail || 'Anonymous'}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: 'var(--text-secondary)' }}
                            title={log.url}
                          >
                            {log.url}
                          </p>
                        </div>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: 'var(--text-light)' }}
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span>{log.browser}</span>
                        <span>•</span>
                        <span>{log.device}</span>
                      </div>

                      {log.userReport && (
                        <div
                          className="mt-2 p-2 rounded"
                          style={{ background: 'var(--bg-secondary)' }}
                        >
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            User Report:
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {log.userReport.description}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-64"
              style={{ color: 'var(--text-secondary)' }}
            >
              <div className="text-center">
                <Eye
                  className="h-12 w-12 mx-auto mb-2"
                  style={{ color: 'var(--text-light)' }}
                />
                <p>Select an error group to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'orange' | 'red' | 'blue' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-primary/10 text-primary',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--bg-quaternary)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </p>
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>{icon}</div>
      </div>
    </div>
  );
}
