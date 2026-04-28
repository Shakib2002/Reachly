'use client';

import { useState, useCallback, useRef } from 'react';

export type AnalyticsMode = 'job' | 'client' | 'combined';
export type AnalyticsPeriod = '7' | '30' | '90' | '365';
export type DateRange = '7' | '30' | '90' | '365' | 'custom';

export interface JobAnalytics {
  totalLeads: number;
  totalLeadsPct: number;
  emailsSent: number;
  emailsSentPct: number;
  followUpsSent: number;
  followUpsPct: number;
  interviews: number;
  offers: number;
  conversionRate: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  leadsOverTime: { date: string; leads: number; emails: number }[];
  heatmap: { date: string; count: number }[];
}

export interface ClientAnalytics {
  totalClients: number;
  totalClientsPct: number;
  proposalsSent: number;
  activeNegotiations: number;
  projectsWon: number;
  projectsLost: number;
  pipelineValue: number;
  winRate: number;
  followUpsSent: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
  byProjectType: { type: string; count: number }[];
  wonVsLostOverTime: { date: string; won: number; lost: number }[];
  clientsOverTime: { date: string; clients: number }[];
}

export interface AnalyticsData {
  job: JobAnalytics | null;
  client: ClientAnalytics | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: AnalyticsData;
  ts: number;
}

const cache: Record<string, CacheEntry> = {};

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightTime, setInsightTime] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getAnalyticsData = useCallback(async (period: string, mode: AnalyticsMode) => {
    const key = `${period}-${mode}`;
    const cached = cache[key];
    if (cached && Date.now() - cached.ts < CACHE_DURATION) {
      setData(cached.data);
      return cached.data;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${period}&mode=${mode}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json: AnalyticsData = await res.json();
      cache[key] = { data: json, ts: Date.now() };
      setData(json);
      return json;
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setError('Failed to load analytics data');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInsights = useCallback(async (mode: AnalyticsMode, analyticsData: AnalyticsData | null) => {
    if (!analyticsData) return;
    setInsightLoading(true);
    try {
      const summary = mode === 'job'
        ? { job: analyticsData.job }
        : mode === 'client'
        ? { client: analyticsData.client }
        : { job: analyticsData.job, client: analyticsData.client };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, mode }),
      });
      const json = await res.json();
      setInsights(json.insights || []);
      setInsightTime(new Date());
    } catch {
      setInsights(['Unable to generate insights right now.']);
    } finally {
      setInsightLoading(false);
    }
  }, []);

  const exportToCSV = useCallback(async (mode: AnalyticsMode) => {
    try {
      const res = await fetch(`/api/export?mode=${mode}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `reachly-${mode}-report-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('CSV export failed');
    }
  }, []);

  const refreshInsights = useCallback((mode: AnalyticsMode, analyticsData: AnalyticsData | null) => {
    setInsights([]);
    return getInsights(mode, analyticsData);
  }, [getInsights]);

  return {
    data,
    loading,
    error,
    insights,
    insightLoading,
    insightTime,
    getAnalyticsData,
    getInsights,
    exportToCSV,
    refreshInsights,
  };
}
