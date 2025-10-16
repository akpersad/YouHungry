'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Search,
  // Filter,
  RefreshCw,
  UserCheck,
  // UserX,
  Mail,
  // Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { addCacheBusterToUrl } from '@/lib/cache-buster';

interface UserStats {
  overview: {
    totalUsers: number;
    recentUsers: number;
    weeklyUsers: number;
    usersWithCollections: number;
    usersWithGroups: number;
    usersWithDecisions: number;
  };
  trends: {
    dailyRegistrations: Array<{
      date: string;
      count: number;
    }>;
  };
  social: {
    totalFriendRequests: number;
    pendingFriendRequests: number;
    totalGroupInvitations: number;
    pendingGroupInvitations: number;
  };
  topActiveUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    collectionCount: number;
    groupCount: number;
  }>;
}

interface UserSearchResult {
  users: Array<{
    id: string;
    name: string;
    email: string;
    username: string;
    createdAt: string;
    lastActiveAt: string;
    collectionCount: number;
    groupCount: number;
    decisionCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export function UserManagementDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchStats = async () => {
    try {
      const response = await fetch(
        addCacheBusterToUrl('/api/admin/users/stats')
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      logger.error('Error fetching user stats:', error);
    }
  };

  const searchUsers = useCallback(
    async (query: string = searchQuery, page: number = 1) => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
          limit: '20',
          sortBy,
          sortOrder,
        });

        const response = await fetch(
          addCacheBusterToUrl(`/api/admin/users/search?${params}`)
        );
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data);
          setCurrentPage(page);
        }
      } catch (error) {
        logger.error('Error searching users:', error);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery, sortBy, sortOrder]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(searchQuery, 1);
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([fetchStats(), searchUsers()]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    Promise.all([fetchStats(), searchUsers()]).finally(() => {
      setLoading(false);
    });
  }, [searchUsers]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading user data"
      >
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading user data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            User Management
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitor user activity and manage accounts
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && stats.overview && stats.social && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.totalUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <UserPlus className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  New This Week
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.weeklyUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.usersWithCollections +
                    stats.overview.usersWithGroups}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  With Collections
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.usersWithCollections}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">In Groups</p>
                <p className="text-2xl font-bold text-text">
                  {stats.overview.usersWithGroups}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Mail className="h-6 w-6 text-destructive" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-light">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-text">
                  {stats.social.pendingFriendRequests +
                    stats.social.pendingGroupInvitations}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* User Search */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">User Search</h3>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-border rounded-md text-sm"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1 border border-border rounded-md text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={searchLoading}
            aria-label="Search users"
          >
            {searchLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-4">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {searchResults.users.length} of{' '}
              {searchResults.pagination.totalCount} users
            </div>

            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y"
                style={{ borderColor: 'var(--bg-quaternary)' }}
              >
                <thead style={{ background: 'var(--bg-tertiary)' }}>
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      User
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Collections
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Groups
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Decisions
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--bg-quaternary)',
                  }}
                >
                  {searchResults.users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ background: 'var(--bg-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'var(--bg-secondary)';
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {user.name}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {user.email}
                          </div>
                          {user.username && (
                            <div
                              className="text-xs"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user.collectionCount}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user.groupCount}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user.decisionCount}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {searchResults.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div
                  className="text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Page {searchResults.pagination.page} of{' '}
                  {searchResults.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => searchUsers(searchQuery, currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage === searchResults.pagination.totalPages
                    }
                    onClick={() => searchUsers(searchQuery, currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Top Active Users */}
      {stats && stats.topActiveUsers && stats.topActiveUsers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Active Users</h3>
          <div className="space-y-3">
            {stats.topActiveUsers.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-surface rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-text">
                      {user.name}
                    </div>
                    <div className="text-xs text-text-light">{user.email}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-text-light">
                  <span>{user.collectionCount} collections</span>
                  <span>{user.groupCount} groups</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
