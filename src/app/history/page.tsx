'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useDecisionHistory,
  type DecisionHistoryFilters,
} from '@/hooks/api/useHistory';
import {
  Calendar,
  List,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  Users,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ManualDecisionForm } from '@/components/features/ManualDecisionForm';
import { exportToCSV, exportToJSON } from '@/lib/export-utils';

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<DecisionHistoryFilters>({
    type: 'all',
    limit: 50,
    offset: 0,
  });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const { data, isLoading, error } = useDecisionHistory({
    ...filters,
    search: search || undefined,
  });

  const handleExportCSV = () => {
    if (data?.decisions) {
      const csvData = data.decisions.map((d) => ({
        Date: new Date(d.visitDate).toLocaleDateString(),
        Restaurant: d.result?.restaurant?.name || 'N/A',
        Collection: d.collectionName,
        Type: d.type,
        Group: d.groupName || 'N/A',
        Method: d.method,
        Cuisine: d.result?.restaurant?.cuisine || 'N/A',
        Rating: d.result?.restaurant?.rating || 'N/A',
        PriceRange: d.result?.restaurant?.priceRange || 'N/A',
      }));
      exportToCSV(csvData, 'decision-history.csv');
    }
  };

  const handleExportJSON = () => {
    if (data?.decisions) {
      exportToJSON(data.decisions, 'decision-history.json');
    }
  };

  const nextPage = () => {
    if (data?.pagination.hasMore) {
      setFilters((prev) => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 50),
      }));
    }
  };

  const prevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Decision History
          </h1>
          <p className="text-gray-600">
            View and manage your restaurant decision history
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search restaurants, collections, or groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('calendar')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Manual Entry
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
                disabled={!data?.decisions?.length}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportJSON}
                className="flex items-center gap-2"
                disabled={!data?.decisions?.length}
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type || 'all'}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        type: e.target.value as 'personal' | 'group' | 'all',
                        offset: 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="all">All Decisions</option>
                    <option value="personal">Personal Only</option>
                    <option value="group">Group Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate?.split('T')[0] || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        startDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                        offset: 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate?.split('T')[0] || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        endDate: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                        offset: 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilters({ type: 'all', limit: 50, offset: 0 });
                      setSearch('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">Loading history...</div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-red-600">
              Error loading history: {(error as Error).message}
            </div>
          </Card>
        ) : !data?.decisions?.length ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No decisions found</p>
              <p className="text-sm">
                {search || filters.type !== 'all' || filters.startDate
                  ? 'Try adjusting your filters or search'
                  : 'Start making decisions to see your history here'}
              </p>
            </div>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {data.decisions.map((decision) => (
              <Card
                key={decision.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Restaurant Name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {decision.result?.restaurant?.name ||
                        'Unknown Restaurant'}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {decision.result?.restaurant?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {decision.result.restaurant.address}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(decision.visitDate).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {decision.type === 'group' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        {decision.type === 'group'
                          ? `Group: ${decision.groupName}`
                          : 'Personal Decision'}
                        {' • '}
                        Collection: {decision.collectionName}
                      </div>

                      {decision.result?.restaurant?.cuisine && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {decision.result.restaurant.cuisine}
                          </span>
                          {decision.result.restaurant.rating && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                              ⭐ {decision.result.restaurant.rating}
                            </span>
                          )}
                          {decision.result.restaurant.priceRange && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              {decision.result.restaurant.priceRange}
                            </span>
                          )}
                        </div>
                      )}

                      {decision.method && (
                        <div className="text-xs text-gray-500">
                          Method:{' '}
                          {decision.method === 'random'
                            ? 'Random Selection'
                            : decision.method === 'tiered'
                              ? 'Tiered Choice'
                              : decision.method}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {data.pagination.total > (filters.limit || 50) && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-600">
                  Showing {(filters.offset || 0) + 1} to{' '}
                  {Math.min(
                    (filters.offset || 0) + (filters.limit || 50),
                    data.pagination.total
                  )}{' '}
                  of {data.pagination.total} decisions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={prevPage}
                    disabled={(filters.offset || 0) === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={nextPage}
                    disabled={!data.pagination.hasMore}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              Calendar view coming soon
            </div>
          </Card>
        )}
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="Add Manual Decision"
      >
        <ManualDecisionForm onSuccess={() => setShowManualEntry(false)} />
      </Modal>
    </div>
  );
}
