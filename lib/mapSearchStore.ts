'use client';

import { create } from 'zustand';
import type { MapBusiness } from '@/components/discover/MapCard';

/**
 * Global Map Search Store — persists across page navigation.
 * 
 * When user starts a Lead Search and navigates away,
 * the search continues in the background. Results are
 * available when they return to the Discover page.
 */

interface MapSearchState {
  // Search results
  businesses: MapBusiness[];
  loading: boolean;
  progress: string;
  error: string;
  searched: boolean;
  lastQuery: string;

  // Actions
  startSearch: (params: SearchParams) => void;
  clearResults: () => void;
  setBusinesses: (biz: MapBusiness[]) => void;
}

interface SearchParams {
  query: string;
  maxResults: number;
  minRating: number;
  maxRating: number;
  minReviews: number;
  maxReviews: number;
  websiteFilter: 'any' | 'none' | 'has';
  requirePhone: boolean;
  onlyOpen: boolean;
  painKeywords: string[];
}

// Keep timer reference outside store so it's not part of state
let _timerRef: ReturnType<typeof setInterval> | null = null;

export const useMapSearchStore = create<MapSearchState>((set) => ({
  businesses: [],
  loading: false,
  progress: '',
  error: '',
  searched: false,
  lastQuery: '',

  clearResults: () => {
    if (_timerRef) { clearInterval(_timerRef); _timerRef = null; }
    set({ businesses: [], loading: false, progress: '', error: '', searched: false, lastQuery: '' });
  },

  setBusinesses: (biz: MapBusiness[]) => set({ businesses: biz }),

  startSearch: async (params: SearchParams) => {
    if (_timerRef) { clearInterval(_timerRef); _timerRef = null; }

    set({
      loading: true,
      error: '',
      searched: true,
      businesses: [],
      lastQuery: params.query,
      progress: 'Scanning Google Maps... please wait (2-5 minutes)',
    });

    // Elapsed time ticker — updates store even if component unmounted
    const startTime = Date.now();
    _timerRef = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const dots = '.'.repeat((Math.floor(elapsed / 2) % 3) + 1);
      set({ progress: `Scanning Google Maps${dots} (${elapsed}s elapsed)` });
    }, 1000);

    try {
      const res = await fetch('/api/map-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          maxResults: params.maxResults,
          minRating: params.minRating,
          maxRating: params.maxRating,
          minReviews: params.minReviews,
          maxReviews: params.maxReviews,
          websiteFilter: params.websiteFilter,
          requirePhone: params.requirePhone,
          onlyOpen: params.onlyOpen,
          painKeywords: params.painKeywords,
        }),
      });

      if (_timerRef) { clearInterval(_timerRef); _timerRef = null; }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search');
      }

      const data = await res.json();
      set({
        businesses: data.businesses || [],
        progress: '',
        loading: false,
      });

    } catch (err) {
      if (_timerRef) { clearInterval(_timerRef); _timerRef = null; }
      set({
        error: err instanceof Error ? err.message : 'Something went wrong. Try again.',
        loading: false,
        progress: '',
      });
    }
  },
}));
