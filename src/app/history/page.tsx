'use client';

import { logger } from '@/lib/logger';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import {
  useDecisionHistory,
  useUpdateAmountSpent,
  useDeleteDecision,
  type DecisionHistoryFilters,
  type DecisionHistoryItem,
} from '@/hooks/api/useHistory';
import {
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
  Dices,
  UtensilsCrossed,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { ManualDecisionForm } from '@/components/features/ManualDecisionForm';
import { exportToCSV, exportToJSON } from '@/lib/export-utils';

/**
 * Bucket a decision's visit date into a human date-group label. Buckets are
 * ordered from most-recent to oldest so that iterating a date-descending list
 * yields section headers in the right order (R2).
 */
function dateGroupLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Undated';

  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / dayMs);

  if (diffDays < 0) return 'Upcoming';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Earlier this week';
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  ) {
    return 'This month';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Group a date-descending decision list into ordered [label, items] sections. */
function groupDecisionsByDate(
  decisions: DecisionHistoryItem[]
): Array<{ label: string; items: DecisionHistoryItem[] }> {
  const groups: Array<{ label: string; items: DecisionHistoryItem[] }> = [];
  for (const decision of decisions) {
    const label = dateGroupLabel(decision.visitDate);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(decision);
    } else {
      groups.push({ label, items: [decision] });
    }
  }
  return groups;
}

function formatVisitDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function HistoryPage() {
  const router = useRouter();
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
        Cost: d.amountSpent ? `$${d.amountSpent.toFixed(2)}` : 'N/A',
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

  // Re-decide from a past decision (R1): personal decisions rerun the
  // weighted spin for their collection; group decisions return to the group.
  const handleDecideAgain = useCallback(
    (decision: DecisionHistoryItem) => {
      if (decision.type === 'group' && decision.groupId) {
        router.push(`/groups/${decision.groupId}`);
      } else {
        router.push(`/decide?collectionId=${decision.collectionId}`);
      }
    },
    [router]
  );

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

  const hasActiveFilters =
    !!search || filters.type !== 'all' || !!filters.startDate;

  const groups = data?.decisions ? groupDecisionsByDate(data.decisions) : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Decision history
          </h1>
          <p className="text-secondary">
            Every spot you&apos;ve landed on — search it, price it, or run it
            back.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
            <Input
              type="text"
              placeholder="Search restaurants, collections, or groups"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-12"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
                aria-expanded={showFilters}
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
                Add manual entry
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
                  <label
                    htmlFor="filter-type"
                    className="block text-sm font-medium text-primary mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="filter-type"
                    value={filters.type || 'all'}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        type: e.target.value as 'personal' | 'group' | 'all',
                        offset: 0,
                      })
                    }
                    className="input-base"
                  >
                    <option value="all">All decisions</option>
                    <option value="personal">Personal only</option>
                    <option value="group">Group only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Start date
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
                    End date
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
                    Clear filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonGroup label="Loading decision history" className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-24 rounded-xl hidden md:block" />
                </div>
              </Card>
            ))}
          </SkeletonGroup>
        ) : error ? (
          <Card className="p-8">
            <div className="text-center text-destructive">
              Error loading history: {(error as Error).message}
            </div>
          </Card>
        ) : !data?.decisions?.length ? (
          <Card>
            <EmptyState
              icon={<UtensilsCrossed className="h-6 w-6" />}
              title={hasActiveFilters ? 'No matches' : 'No decisions yet'}
              description={
                hasActiveFilters
                  ? 'Nothing lines up with those filters. Try widening the date range or clearing the search.'
                  : 'Once you spin a collection or log a meal, every pick lands here.'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setFilters({ type: 'all', limit: 10, offset: 0 });
                        setSearch('');
                      },
                    }
                  : {
                      label: 'Make a decision',
                      onClick: () => router.push('/decide'),
                    }
              }
            />
          </Card>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.label} className="space-y-4">
                <h2 className="sticky top-0 z-10 bg-primary/95 py-1 text-sm font-semibold uppercase tracking-wide text-tertiary backdrop-blur">
                  {group.label}
                </h2>
                {group.items.map((decision) => (
                  <Card
                    key={decision.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Amount Spent Banner */}
                    {decision.amountSpent !== undefined && (
                      <div className="bg-success/10 border-b border-success/20 px-6 py-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-success">
                          <DollarSign className="w-4 h-4" />
                          Amount spent:{' '}
                          <span className="tabular-nums">
                            $
                            {decision.amountSpent.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Restaurant Name */}
                          <h3 className="text-xl font-semibold text-primary mb-2">
                            {decision.result?.restaurant?.name ||
                              'Unknown restaurant'}
                          </h3>

                          {/* Details */}
                          <div className="space-y-2 text-sm text-secondary">
                            {decision.result?.restaurant?.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                {decision.result.restaurant.address}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="tabular-nums">
                                {formatVisitDate(decision.visitDate)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {decision.type === 'group' ? (
                                <Users className="w-4 h-4 flex-shrink-0" />
                              ) : (
                                <User className="w-4 h-4 flex-shrink-0" />
                              )}
                              {decision.type === 'group'
                                ? `Group: ${decision.groupName}`
                                : 'Personal decision'}
                              {' • '}
                              Collection: {decision.collectionName}
                            </div>

                            {decision.result?.restaurant?.cuisine && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  {decision.result.restaurant.cuisine}
                                </span>
                                {decision.result.restaurant.rating && (
                                  <span className="px-2 py-1 bg-warning/20 text-warning rounded-full text-xs tabular-nums">
                                    ⭐ {decision.result.restaurant.rating}
                                  </span>
                                )}
                                {decision.result.restaurant.priceRange && (
                                  <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">
                                    {decision.result.restaurant.priceRange}
                                  </span>
                                )}
                              </div>
                            )}

                            {decision.method && (
                              <div className="text-xs text-tertiary">
                                Method:{' '}
                                {decision.method === 'random'
                                  ? 'Random selection'
                                  : decision.method === 'tiered'
                                    ? 'Tiered choice'
                                    : decision.method}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Desktop */}
                        <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
                          <Button
                            onClick={() => handleDecideAgain(decision)}
                            className="flex items-center gap-2 whitespace-nowrap"
                            title="Decide again from this collection"
                          >
                            <Dices className="w-4 h-4" />
                            Decide again
                          </Button>
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
                            {decision.amountSpent ? 'Edit' : 'Add'} amount
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
                              onClick={() => handleDecideAgain(decision)}
                            >
                              <Dices className="w-4 h-4" />
                              Decide again
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenAmountModal(decision)}
                            >
                              <DollarSign className="w-4 h-4" />
                              {decision.amountSpent ? 'Edit' : 'Add'} amount
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
              </section>
            ))}

            {/* Pagination */}
            {data.pagination.total > (filters.limit || 10) && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-secondary tabular-nums">
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
        )}
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="Add manual decision"
      >
        <ManualDecisionForm onSuccess={() => setShowManualEntry(false)} />
      </Modal>

      {/* Amount Spent Modal */}
      <Modal
        isOpen={showAmountModal}
        onClose={handleCloseAmountModal}
        title={
          selectedDecision?.amountSpent
            ? 'Edit amount spent'
            : 'Add amount spent'
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
              formatVisitDate(selectedDecision.visitDate)}
          </p>

          <div>
            <label
              htmlFor="amount-input"
              className="block text-sm font-medium text-primary mb-1"
            >
              Amount spent (USD)
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
              aria-invalid={!!amountError}
              aria-describedby={amountError ? 'amount-error' : undefined}
            />
            {amountError && (
              <p
                id="amount-error"
                className="mt-1 text-sm text-error"
                role="alert"
              >
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
        title="Delete decision"
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
                  'Unknown restaurant'}
              </p>
              <p className="text-sm text-secondary tabular-nums">
                {formatVisitDate(decisionToDelete.visitDate)}
              </p>
              {decisionToDelete.amountSpent && (
                <p className="text-sm text-secondary mt-1 tabular-nums">
                  Amount spent: $
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
