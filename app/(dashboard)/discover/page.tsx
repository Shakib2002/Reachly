'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import LeadCard, { LeadCardSkeleton, type LeadResult } from '@/components/discover/LeadCard';
import MapSearch from '@/components/discover/MapSearch';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Briefcase, Users, Loader2, Compass,
  ChevronDown, Sparkles, AlertCircle, RefreshCw, X,
  Building2, DollarSign, ChevronRight, Map, Download,
  Clock, History, Trash2,
} from 'lucide-react';

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual'];
const INDUSTRY_OPTIONS = ['Technology', 'Healthcare', 'Finance', 'Marketing', 'SaaS', 'E-commerce', 'Education'];

const TITLE_SUGGESTIONS = [
  'Software Engineer', 'React Developer', 'Product Manager', 'Data Scientist',
  'UX Designer', 'DevOps Engineer', 'Marketing Manager', 'Sales Manager',
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer',
  'Machine Learning Engineer', 'Cloud Architect', 'CTO', 'CEO', 'VP Engineering',
  'HR Manager', 'Project Manager', 'Business Analyst', 'QA Engineer',
];
const COMPANY_SUGGESTIONS = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Stripe',
  'Salesforce', 'Adobe', 'Shopify', 'Spotify', 'Uber', 'Airbnb', 'Tesla',
  'IBM', 'Oracle', 'SAP', 'HubSpot', 'Slack', 'Zoom', 'Twilio', 'Datadog',
];
const LOCATION_SUGGESTIONS = [
  'Remote', 'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Miami, FL',
  'London, UK', 'Berlin, Germany', 'Toronto, Canada', 'Bangalore, India',
  'Singapore', 'Sydney, Australia', 'Dubai, UAE', 'Amsterdam, Netherlands',
];
const MAX_RESULTS_OPTIONS = [25, 50, 100];

type Tab = 'jobs' | 'leads';

interface SearchHistoryEntry {
  id: string;
  query: string;
  company: string;
  location: string;
  jobType: string;
  resultsCount: number;
  source: 'job' | 'map';
  timestamp: string;
}

export default function DiscoverPage() {
  const { addLead } = useLeadStore();
  const [tab, setTab] = useState<Tab>('jobs');

  // Job Search state (merged: old Jobs + old Leads)
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [maxResults, setMaxResults] = useState(50);
  const [leadSeniority, setLeadSeniority] = useState('');
  const [leadIndustry, setLeadIndustry] = useState('');
  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [leadsSearched, setLeadsSearched] = useState(false);
  const [savedLeadIds, setSavedLeadIds] = useState<Set<string>>(new Set());
  const [visibleLeadCount, setVisibleLeadCount] = useState(10);

  // Save confirm modal
  const [confirmModal, setConfirmModal] = useState<{ data: LeadResult } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Search history — stores full search details
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('reachly-search-history-v2');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const addToHistory = useCallback((term: string, resultsCount = 0, source: 'job' | 'map' = 'job') => {
    setSearchHistory((prev) => {
      const entry: SearchHistoryEntry = {
        id: `${Date.now()}`,
        query: term,
        company: jobCompany,
        location: jobLocation,
        jobType,
        resultsCount,
        source,
        timestamp: new Date().toISOString(),
      };
      const updated = [entry, ...prev].slice(0, 20);
      localStorage.setItem('reachly-search-history-v2', JSON.stringify(updated));
      return updated;
    });
  }, [jobCompany, jobLocation, jobType]);

  // ─── Unified Job Search (calls /api/leads/search with enhanced params) ───
  const searchLeads = useCallback(async () => {
    if (!jobTitle.trim() && !jobCompany.trim()) { toast.error('Enter a job title or company name'); return; }
    setLeadsLoading(true); setLeadsError(''); setLeadsSearched(true); setVisibleLeadCount(10);
    try {
      // Build enhanced query with seniority
      let enhancedTitle = jobTitle;
      if (leadSeniority && !jobTitle.toLowerCase().includes(leadSeniority.toLowerCase())) {
        enhancedTitle = leadSeniority === 'C-Suite' ? `CEO ${jobTitle}`.trim() : `${leadSeniority} ${jobTitle}`.trim();
      }
      // Append industry to company query for better targeting
      let enhancedCompany = jobCompany;
      if (leadIndustry && !jobCompany.toLowerCase().includes(leadIndustry.toLowerCase())) {
        enhancedCompany = jobCompany ? `${jobCompany} ${leadIndustry}` : leadIndustry;
      }
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: enhancedCompany,
          title: enhancedTitle,
          location: jobLocation,
          jobType: jobType !== 'all' ? jobType : undefined,
          datePosted: datePosted !== 'all' ? datePosted : undefined,
          maxResults,
        }),
      });
      if (!res.ok) throw new Error('Failed to search');
      const data = await res.json();
      setLeads(data.leads || []);
      addToHistory(jobTitle || jobCompany, data.leads?.length || 0, 'job');
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLeadsLoading(false); }
  }, [jobTitle, jobCompany, jobLocation, jobType, datePosted, maxResults, leadSeniority, leadIndustry, addToHistory]);

  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Company', 'Position', 'Department', 'Domain', 'Email', 'Location', 'Salary', 'Job Type', 'Apply Link'];
    const rows = leads.map(l => {
      const sal = l.salary && (l.salary.min || l.salary.max)
        ? `$${l.salary.min ? Math.round(l.salary.min/1000)+'k' : '?'}-$${l.salary.max ? Math.round(l.salary.max/1000)+'k' : '?'}`
        : '';
      return [
        l.company, l.position, l.department,
        l.domain || '', l.email || '', l.location || '',
        sal, l.jobPosting?.type || '', l.jobPosting?.applyLink || '',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reachly-leads-${(jobTitle || jobCompany).replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads to CSV`);
  };

  const saveLeadToCRM = async (lead: LeadResult) => {
    setConfirmModal({ data: lead });
    setConfirmNotes('');
  };

  const handleConfirmSave = async () => {
    if (!confirmModal) return;
    setConfirmSaving(true);
    try {
      const lead = confirmModal.data;
      const salary = lead.salary && (lead.salary.min || lead.salary.max)
        ? `$${lead.salary.min ? Math.round(lead.salary.min / 1000) + 'k' : '?'} - $${lead.salary.max ? Math.round(lead.salary.max / 1000) + 'k' : '?'}`
        : undefined;

      // Build comprehensive notes with all available data
      const notesParts: string[] = [];
      if (confirmNotes) notesParts.push(confirmNotes);
      if (lead.department) notesParts.push(`Dept: ${lead.department}`);
      if (lead.domain) notesParts.push(`Domain: ${lead.domain}`);
      if (lead.jobPosting?.publisher) notesParts.push(`Source: ${lead.jobPosting.publisher}`);
      if (lead.jobPosting?.postedAgo) notesParts.push(`Posted: ${lead.jobPosting.postedAgo}`);
      if (lead.jobPosting?.applyLink) notesParts.push(`Apply: ${lead.jobPosting.applyLink}`);
      if (lead.isRemote) notesParts.push('🌍 Remote');
      if (lead.jobPosting?.benefits && lead.jobPosting.benefits.length > 0) {
        notesParts.push(`Benefits: ${lead.jobPosting.benefits.join(', ')}`);
      }

      // Job Search → Job Pipeline (leads table)
      await addLead({
        title: lead.position,
        company: lead.company,
        email: lead.email,
        location: lead.location || undefined,
        salary,
        source: lead.jobPosting?.publisher ? `JSearch (${lead.jobPosting.publisher})` : 'JSearch',
        status: 'new',
        phone: null,
        notes: notesParts.join(' | ') || undefined,
      });
      setSavedLeadIds((prev) => new Set([...Array.from(prev), lead.id]));
    } finally {
      setConfirmSaving(false);
      setConfirmModal(null);
    }
  };

  const selectClasses = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none';

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-blue-500" />
          Discover
        </h1>
        <p className="text-slate-400 text-sm mt-1">Find high-quality leads from job boards and Google Maps</p>
      </div>

      {/* Tab Switcher — 2 Tabs Only */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-1.5 inline-flex">
        <button onClick={() => setTab('jobs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'jobs' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Briefcase className="w-4 h-4" /> Job Search
        </button>
        <button onClick={() => setTab('leads')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'leads' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Map className="w-4 h-4" /> Lead Search
        </button>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 1: Job Search (Merged) */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'jobs' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sticky top-0 z-10 shadow-sm">
            <div className="space-y-3">
              {/* Row 1: Title + Company + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" list="title-suggestions" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                    placeholder="Job Title (e.g. React Developer, CEO)"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  <datalist id="title-suggestions">
                    {TITLE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" list="company-suggestions" value={jobCompany} onChange={(e) => setJobCompany(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                    placeholder="Company (e.g. Google, Stripe)"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  <datalist id="company-suggestions">
                    {COMPANY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" list="location-suggestions" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                    placeholder="Location (e.g. Remote, New York)"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                  <datalist id="location-suggestions">
                    {LOCATION_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              {/* Row 2: Filters (Job Type + Date + Search Button) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="relative">
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={selectClasses} aria-label="Job type filter">
                    <option value="all">All Types</option>
                    <option value="FULLTIME">Full-time</option>
                    <option value="PARTTIME">Part-time</option>
                    <option value="CONTRACTOR">Contract</option>
                    <option value="INTERN">Internship</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className={selectClasses} aria-label="Date posted filter">
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} className={selectClasses} aria-label="Max results">
                    {MAX_RESULTS_OPTIONS.map(n => (
                      <option key={n} value={n}>Max {n} results</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button onClick={searchLeads} disabled={leadsLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 col-span-2 sm:col-span-1">
                  {leadsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Find Leads
                </button>
              </div>

              {/* Row 3: Seniority */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Seniority Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {SENIORITY_OPTIONS.map(s => (
                    <button key={s} onClick={() => setLeadSeniority(leadSeniority === s ? '' : s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${leadSeniority === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Industry */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Industry</label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRY_OPTIONS.map(ind => (
                    <button key={ind} onClick={() => setLeadIndustry(leadIndustry === ind ? '' : ind)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${leadIndustry === ind ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search History Quick Chips */}
              {searchHistory.length > 0 && !leadsSearched && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recent:</span>
                  {searchHistory.slice(0, 5).map((entry) => (
                    <button key={entry.id} onClick={() => { setJobTitle(entry.query); if (entry.company) setJobCompany(entry.company); if (entry.location) setJobLocation(entry.location); }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.query}
                      {entry.resultsCount > 0 && <span className="text-[9px] text-slate-400">({entry.resultsCount})</span>}
                    </button>
                  ))}
                  <button onClick={() => setShowHistory(!showHistory)}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-0.5">
                    <History className="w-3 h-3" /> All History
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Full Search History Panel ─── */}
          {showHistory && searchHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-500" />
                  Search History
                  <span className="text-xs font-normal text-slate-400">({searchHistory.length} searches)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSearchHistory([]); localStorage.removeItem('reachly-search-history-v2'); }}
                    className="text-[11px] text-red-400 hover:text-red-600 font-medium flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                  <button onClick={() => setShowHistory(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {searchHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.source === 'job' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1e293b] truncate">
                        {entry.query}
                        {entry.company && <span className="text-slate-400 font-normal"> at {entry.company}</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {entry.location && `📍 ${entry.location} · `}
                        {entry.resultsCount > 0 ? `${entry.resultsCount} results` : 'No results'}
                        {' · '}
                        {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={() => { setJobTitle(entry.query); if (entry.company) setJobCompany(entry.company); if (entry.location) setJobLocation(entry.location); setShowHistory(false); }}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                      <RefreshCw className="w-3 h-3" /> Re-search
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {leadsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <LeadCardSkeleton key={i} />)}
              </div>
            ) : leadsError ? (
              <div className="bg-white rounded-2xl border border-red-100 p-12 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-[#1e293b]">Something went wrong</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">{leadsError}</p>
                <button onClick={searchLeads}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            ) : leads.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">Showing <span className="font-semibold text-[#1e293b]">{Math.min(visibleLeadCount, leads.length)}</span> of <span className="font-semibold text-[#1e293b]">{leads.length}</span> leads</p>
                  <button onClick={exportLeadsCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {leads.slice(0, visibleLeadCount).map((lead) => (
                    <div key={lead.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <LeadCard lead={lead} onAddToCRM={saveLeadToCRM} isSaved={savedLeadIds.has(lead.id)} />
                    </div>
                  ))}
                </div>
                {visibleLeadCount < leads.length && (
                  <div className="flex justify-center mt-6">
                    <button onClick={() => setVisibleLeadCount((p) => p + 10)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm">
                      <ChevronRight className="w-4 h-4" /> Load More ({leads.length - visibleLeadCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : leadsSearched ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-[#1e293b]">No leads found</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">Try a different job title, company, or broaden your filters</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#1e293b]">Find Companies Hiring</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">Search by job title or company to discover leads with enrichment & CRM integration</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['React Developer', 'Product Manager', 'UX Designer', 'Data Scientist'].map((s) => (
                    <button key={s} onClick={() => { setJobTitle(s); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 2: Lead Search (Google Maps) */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'leads' && <MapSearch />}

      {/* Save to CRM Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1e293b]">Save to CRM</h3>
              <button onClick={() => setConfirmModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1e293b] truncate">
                    {confirmModal.data.position}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 truncate">{confirmModal.data.company}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {confirmModal.data.location && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 truncate">{confirmModal.data.location}</span>
                  </div>
                )}
                {confirmModal.data.salary && (confirmModal.data.salary.min || confirmModal.data.salary.max) && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">${Math.round((confirmModal.data.salary.min || 0) / 1000)}k - ${Math.round((confirmModal.data.salary.max || 0) / 1000)}k</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-semibold border border-blue-100">Source: JSearch</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-semibold border border-emerald-100">Status: New</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Add any notes about this lead..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmSave} disabled={confirmSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {confirmSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save to CRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
