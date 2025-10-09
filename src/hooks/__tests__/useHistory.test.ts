import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useManualDecision, useDecisionHistory } from '../api/useHistory';
import React from 'react';

describe('useHistory hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useManualDecision', () => {
    it('should create a manual personal decision', async () => {
      const mockResponse = {
        decision: {
          id: 'decision1',
          restaurantId: 'restaurant1',
          visitDate: '2024-01-15T18:00:00.000Z',
          type: 'personal',
          notes: 'Great food!',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useManualDecision(), { wrapper });

      const input = {
        restaurantId: 'restaurant1',
        visitDate: '2024-01-15T18:00:00.000Z',
        type: 'personal' as const,
        notes: 'Great food!',
      };

      await result.current.mutateAsync(input);

      expect(global.fetch).toHaveBeenCalledWith('/api/decisions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    });

    it('should create a manual group decision', async () => {
      const mockResponse = {
        decision: {
          id: 'decision1',
          restaurantId: 'restaurant1',
          visitDate: '2024-01-15T18:00:00.000Z',
          type: 'group',
          groupId: 'group1',
          notes: 'Group dinner',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useManualDecision(), { wrapper });

      const input = {
        restaurantId: 'restaurant1',
        visitDate: '2024-01-15T18:00:00.000Z',
        type: 'group' as const,
        groupId: 'group1',
        notes: 'Group dinner',
      };

      await result.current.mutateAsync(input);

      expect(global.fetch).toHaveBeenCalledWith('/api/decisions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    });

    it('should handle errors when creating manual decision', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create decision' }),
      });

      const { result } = renderHook(() => useManualDecision(), { wrapper });

      const input = {
        restaurantId: 'restaurant1',
        visitDate: '2024-01-15T18:00:00.000Z',
        type: 'personal' as const,
      };

      await expect(result.current.mutateAsync(input)).rejects.toThrow(
        'Failed to create decision'
      );
    });

    it('should invalidate decision history queries on success', async () => {
      const mockResponse = {
        decision: {
          id: 'decision1',
          restaurantId: 'restaurant1',
          visitDate: '2024-01-15T18:00:00.000Z',
          type: 'personal',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useManualDecision(), { wrapper });

      const input = {
        restaurantId: 'restaurant1',
        visitDate: '2024-01-15T18:00:00.000Z',
        type: 'personal' as const,
      };

      await result.current.mutateAsync(input);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['decision-history'],
        });
      });
    });

    it('should handle minimum required fields', async () => {
      const mockResponse = {
        decision: {
          id: 'decision1',
          restaurantId: 'restaurant1',
          visitDate: '2024-01-15T18:00:00.000Z',
          type: 'personal',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useManualDecision(), { wrapper });

      const input = {
        restaurantId: 'restaurant1',
        visitDate: '2024-01-15T18:00:00.000Z',
      };

      await result.current.mutateAsync(input);

      expect(global.fetch).toHaveBeenCalledWith('/api/decisions/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    });
  });

  describe('useDecisionHistory', () => {
    it('should fetch decision history with default filters', async () => {
      const mockResponse = {
        decisions: [
          {
            _id: 'decision1',
            type: 'personal',
            visitDate: '2024-01-15T18:00:00.000Z',
            result: {
              restaurant: {
                name: 'Test Restaurant',
              },
            },
          },
        ],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useDecisionHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/decisions/history')
      );
    });

    it('should fetch decision history with custom filters', async () => {
      const mockResponse = {
        decisions: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filters = {
        type: 'group' as const,
        limit: 10,
        offset: 0,
        groupId: 'group1',
      };

      const { result } = renderHook(() => useDecisionHistory(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=group')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('groupId=group1')
      );
    });

    it('should handle date range filters', async () => {
      const mockResponse = {
        decisions: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filters = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      const { result } = renderHook(() => useDecisionHistory(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('startDate=')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('endDate=')
      );
    });

    it('should handle search query', async () => {
      const mockResponse = {
        decisions: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filters = {
        search: 'pizza',
      };

      const { result } = renderHook(() => useDecisionHistory(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=pizza')
      );
    });

    it('should handle pagination', async () => {
      const mockResponse = {
        decisions: [],
        pagination: {
          total: 100,
          limit: 50,
          offset: 50,
          hasMore: false,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const filters = {
        limit: 50,
        offset: 50,
      };

      const { result } = renderHook(() => useDecisionHistory(filters), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=50')
      );
    });

    it('should handle errors when fetching history', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDecisionHistory(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should be disabled when enabled is false', () => {
      const { result } = renderHook(() => useDecisionHistory({}, false), {
        wrapper,
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });
});
