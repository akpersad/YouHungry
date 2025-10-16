'use client';

import { logger } from '@/lib/logger';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useDecisionHistory,
  useUpdateAmountSpent,
  useDeleteDecision,
  type DecisionHistoryFilters,
  type DecisionHistoryItem,
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
  DollarSign,
  Trash2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ManualDecisionForm } from '@/components/features/ManualDecisionForm';
import { exportToCSV, exportToJSON } from '@/lib/export-utils';

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<DecisionHistoryFilters>({
    type: 'all',
    limit: 10,
    offset: 0,
  });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [selectedDecision, setSelectedDecision] =
    useState<DecisionHistoryItem | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [decisionToDelete, setDecisionToDelete] =
    useState<DecisionHistoryItem | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useDecisionHistory({
    ...filters,
    search: search || undefined,
  });

  const updateAmountMutation = useUpdateAmountSpent();
  const deleteDecisionMutation = useDeleteDecision();

  // Focus the input after modal opens
  useEffect(() => {
    if (showAmountModal && amountInputRef.current) {
      // Delay to let modal's focus trap settle
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAmountModal]);

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
        offset: (prev.offset || 0) + (prev.limit || 10),
      }));
    }
  };

  const prevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 10)),
    }));
  };

  const handleOpenAmountModal = useCallback((decision: DecisionHistoryItem) => {
    setSelectedDecision(decision);
    setAmountInput(decision.amountSpent?.toString() || '');
    setAmountError('');
    setShowAmountModal(true);
  }, []);

  const handleCloseAmountModal = useCallback(() => {
    setShowAmountModal(false);
    setSelectedDecision(null);
    setAmountInput('');
    setAmountError('');
  }, []);

  const handleSubmitAmount = useCallback(async () => {
    if (!selectedDecision) return;

    const amount = parseFloat(amountInput);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid positive amount');
      return;
    }

    try {
      await updateAmountMutation.mutateAsync({
        decisionId: selectedDecision.id,
        amountSpent: amount,
      });
      handleCloseAmountModal();
    } catch (error) {
      setAmountError((error as Error).message || 'Failed to update amount');
    }
  }, [
    selectedDecision,
    amountInput,
    updateAmountMutation,
    handleCloseAmountModal,
  ]);

  const handleOpenDeleteConfirm = useCallback(
    (decision: DecisionHistoryItem) => {
      setDecisionToDelete(decision);
      setShowDeleteConfirm(true);
    },
    []
  );

  const handleCloseDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setDecisionToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!decisionToDelete) return;

    try {
      await deleteDecisionMutation.mutateAsync(decisionToDelete.id);
      handleCloseDeleteConfirm();
    } catch (error) {
      // Error is handled by the mutation hook
      logger.error('Failed to delete decision:', error);
    }
  }, [decisionToDelete, deleteDecisionMutation, handleCloseDeleteConfirm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Decision History
          </h1>
          <p className="text-secondary">
            View and manage your restaurant decision history
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Mobile Search */}
            <div className="flex-1 relative sm:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <Input
                type="text"
                placeholder="Search history"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!pl-12"
              />
            </div>

            {/* Desktop Search */}
            <div className="flex-1 relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <Input
                type="text"
                placeholder="Search restaurants, collections, or groups"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!pl-12"
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
            </div>

            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                disabled={!data?.decisions?.length}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportJSON}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                disabled={!data?.decisions?.length}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">JSON</span>
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
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
                    className="w-full rounded-lg border border-quinary px-3 py-2"
                  >
                    <option value="all">All Decisions</option>
                    <option value="personal">Personal Only</option>
                    <option value="group">Group Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
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
                  <label className="block text-sm font-medium text-primary mb-1">
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
                      setFilters({ type: 'all', limit: 10, offset: 0 });
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
            <div className="text-center text-tertiary">Loading history...</div>
          </Card>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-destructive">
              Error loading history: {(error as Error).message}
            </div>
          </Card>
        ) : !data?.decisions?.length ? (
          <Card className="p-8">
            <div className="text-center text-tertiary">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-text-light" />
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
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Amount Spent Banner */}
                {decision.amountSpent !== undefined && (
                  <div className="bg-success/10 border-b border-success/20 px-6 py-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-success">
                      <DollarSign className="w-4 h-4" />
                      Amount Spent: $
                      {decision.amountSpent.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Restaurant Name */}
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        {decision.result?.restaurant?.name ||
                          'Unknown Restaurant'}
                      </h3>

                      {/* Details */}
                      <div className="space-y-2 text-sm text-secondary">
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
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {decision.result.restaurant.cuisine}
                            </span>
                            {decision.result.restaurant.rating && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                ⭐ {decision.result.restaurant.rating}
                              </span>
                            )}
                            {decision.result.restaurant.priceRange && (
                              <span className="px-2 py-1 bg-success/10 text-green-700 rounded-full text-xs">
                                {decision.result.restaurant.priceRange}
                              </span>
                            )}
                          </div>
                        )}

                        {decision.method && (
                          <div className="text-xs text-tertiary">
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

                    {/* Action Buttons - Desktop */}
                    <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenAmountModal(decision)}
                        className="flex items-center gap-2 whitespace-nowrap"
                        title={
                          decision.amountSpent
                            ? 'Edit amount spent'
                            : 'Add amount spent'
                        }
                      >
                        <DollarSign className="w-4 h-4" />
                        {decision.amountSpent ? 'Edit' : 'Add'} Amount
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenDeleteConfirm(decision)}
                        className="flex items-center gap-2 text-error hover:text-error"
                        title="Delete decision"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>

                    {/* Action Menu - Mobile */}
                    <div className="flex md:hidden flex-shrink-0">
                      <DropdownMenu
                        trigger={
                          <button
                            className="p-2 hover:bg-tertiary rounded-lg transition-colors"
                            aria-label="Decision actions"
                          >
                            <svg
                              className="w-5 h-5 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        }
                        align="right"
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenAmountModal(decision)}
                        >
                          <DollarSign className="w-4 h-4" />
                          {decision.amountSpent ? 'Edit' : 'Add'} Amount
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteConfirm(decision)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {data.pagination.total > (filters.limit || 10) && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-secondary">
                  Showing {(filters.offset || 0) + 1} to{' '}
                  {Math.min(
                    (filters.offset || 0) + (filters.limit || 10),
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
            <div className="text-center text-tertiary">
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

      {/* Amount Spent Modal */}
      <Modal
        isOpen={showAmountModal}
        onClose={handleCloseAmountModal}
        title={
          selectedDecision?.amountSpent
            ? 'Edit Amount Spent'
            : 'Add Amount Spent'
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {selectedDecision?.result?.restaurant?.name && (
              <>
                <strong>{selectedDecision.result.restaurant.name}</strong>
                <br />
              </>
            )}
            {selectedDecision?.visitDate &&
              new Date(selectedDecision.visitDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
          </p>

          <div>
            <label
              htmlFor="amount-input"
              className="block text-sm font-medium text-primary mb-1"
            >
              Amount Spent (USD)
            </label>
            <input
              ref={amountInputRef}
              id="amount-input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setAmountError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitAmount();
                }
              }}
              className="input-base"
            />
            {amountError && (
              <p className="mt-1 text-sm text-error" role="alert">
                {amountError}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleCloseAmountModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitAmount}
              disabled={updateAmountMutation.isPending}
            >
              {updateAmountMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCloseDeleteConfirm}
        title="Delete Decision"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this decision? This will affect the
            weight algorithm for future selections, making this restaurant more
            likely to be selected.
          </p>

          {decisionToDelete && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="font-medium text-primary">
                {decisionToDelete.result?.restaurant?.name ||
                  'Unknown Restaurant'}
              </p>
              <p className="text-sm text-secondary">
                {new Date(decisionToDelete.visitDate).toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
              {decisionToDelete.amountSpent && (
                <p className="text-sm text-secondary mt-1">
                  Amount Spent: $
                  {decisionToDelete.amountSpent.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleCloseDeleteConfirm}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmDelete}
              disabled={deleteDecisionMutation.isPending}
              className="text-error hover:text-error"
            >
              {deleteDecisionMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
