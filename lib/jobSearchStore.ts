'use client';

import { create } from 'zustand';
import type { LeadResult } from '@/components/discover/LeadCard';

/**
 * Global Job Search Store — persists across page navigation.
 * 
 * When user starts a Job Search and navigates away,
 * the search continues in the background. Results are
 * available when they return to the Discover page.
 */

interface JobSearchState {
  // Search results
  leads: LeadResult[];
  loading: boolean;
  error: string;
  searched: boolean;
  lastQuery: string;

  // Actions
  startSearch: (params: JobSearchParams) => void;
  clearResults: () => void;
  updateLead: (id: string, updates: Partial<LeadResult>) => void;
}

interface JobSearchParams {
  title: string;
  company: string;
  location: string;
  jobType?: string;
  datePosted?: string;
  maxResults: number;
  seniority: string;
  industry: string;
}

export const useJobSearchStore = create<JobSearchState>((set) => ({
  leads: [],
  loading: false,
  error: '',
  searched: false,
  lastQuery: '',

  clearResults: () => {
    set({ leads: [], loading: false, error: '', searched: false, lastQuery: '' });
  },

  updateLead: (id: string, updates: Partial<LeadResult>) => {
    set(state => ({
      leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  },

  startSearch: async (params: JobSearchParams) => {
    const queryLabel = params.title || params.company || 'jobs';

    set({
      loading: true,
      error: '',
      searched: true,
      leads: [],
      lastQuery: queryLabel,
    });

    try {
      // Build enhanced query with seniority
      let enhancedTitle = params.title;
      if (params.seniority && !params.title.toLowerCase().includes(params.seniority.toLowerCase())) {
        enhancedTitle = params.seniority === 'C-Suite' ? `CEO ${params.title}`.trim() : `${params.seniority} ${params.title}`.trim();
      }
      // Append industry to company query for better targeting
      let enhancedCompany = params.company;
      if (params.industry && !params.company.toLowerCase().includes(params.industry.toLowerCase())) {
        enhancedCompany = params.company ? `${params.company} ${params.industry}` : params.industry;
      }

      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: enhancedCompany,
          title: enhancedTitle,
          location: params.location,
          jobType: params.jobType !== 'all' ? params.jobType : undefined,
          datePosted: params.datePosted !== 'all' ? params.datePosted : undefined,
          maxResults: params.maxResults,
        }),
      });

      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();

      set({
        leads: data.leads || [],
        loading: false,
      });

    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Something went wrong',
        loading: false,
      });
    }
  },
}));
