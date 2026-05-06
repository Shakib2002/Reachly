'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import JobCard, { JobCardSkeleton, type Job } from '@/components/discover/JobCard';
import LeadCard, { LeadCardSkeleton, type LeadResult } from '@/components/discover/LeadCard';
import MapSearch from '@/components/discover/MapSearch';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Briefcase, Users, Loader2, Compass,
  ChevronDown, Sparkles, AlertCircle, RefreshCw, X,
  Building2, DollarSign, ChevronRight, Map, Download,
} from 'lucide-react';

const SENIORITY_OPTIONS = ['C-Suite', 'VP', 'Director', 'Manager', 'Individual'];
const INDUSTRY_OPTIONS = ['Technology', 'Healthcare', 'Finance', 'Marketing', 'SaaS', 'E-commerce', 'Education'];

type Tab = 'jobs' | 'leads' | 'map';

export default function DiscoverPage() {
  const { addLead } = useLeadStore();
  const [tab, setTab] = useState<Tab>('jobs');

  // Job search state
  const [jobQuery, setJobQuery] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [visibleJobCount, setVisibleJobCount] = useState(10);
  const [jobsSearched, setJobsSearched] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Lead search state
  const [leadCompany, setLeadCompany] = useState('');
  const [leadTitle, setLeadTitle] = useState('');
  const [leadLocation, setLeadLocation] = useState('');
  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [leadsSearched, setLeadsSearched] = useState(false);
  const [savedLeadIds, setSavedLeadIds] = useState<Set<string>>(new Set());
  const [visibleLeadCount, setVisibleLeadCount] = useState(10);
  const [leadSeniority, setLeadSeniority] = useState('');
  const [leadIndustry, setLeadIndustry] = useState('');

  // Save confirm modal
  const [confirmModal, setConfirmModal] = useState<{ type: 'job'; data: Job } | { type: 'lead'; data: LeadResult } | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmSaving, setConfirmSaving] = useState(false);

  // Search history
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reachly-search-history');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const addToHistory = useCallback((term: string) => {
    setSearchHistory((prev) => {
      const updated = [term, ...prev.filter((h) => h !== term)].slice(0, 5);
      localStorage.setItem('reachly-search-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const searchJobs = useCallback(async () => {
    if (!jobQuery.trim()) { toast.error('Enter a search term'); return; }
    setJobsLoading(true); setJobsError(''); setJobsSearched(true); setVisibleJobCount(10);
    addToHistory(jobQuery);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: jobQuery, location: jobLocation, jobType, datePosted }),
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setJobsLoading(false); }
  }, [jobQuery, jobLocation, jobType, datePosted, addToHistory]);

  const searchLeads = useCallback(async () => {
    if (!leadCompany.trim() && !leadTitle.trim()) { toast.error('Enter a company or title'); return; }
    setLeadsLoading(true); setLeadsError(''); setLeadsSearched(true); setVisibleLeadCount(10);
    addToHistory(leadCompany || leadTitle);
    try {
      // Build enhanced query with seniority/industry
      let enhancedTitle = leadTitle;
      if (leadSeniority && !leadTitle.toLowerCase().includes(leadSeniority.toLowerCase())) {
        enhancedTitle = leadSeniority === 'C-Suite' ? `CEO ${leadTitle}`.trim() : `${leadSeniority} ${leadTitle}`.trim();
      }
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: leadCompany, title: enhancedTitle, location: leadLocation }),
      });
      if (!res.ok) throw new Error('Failed to search leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLeadsLoading(false); }
  }, [leadCompany, leadTitle, leadLocation, leadSeniority, addToHistory]);

  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Position', 'Company', 'Department', 'Domain', 'Email', 'Location', 'Job Title', 'Apply Link'];
    const rows = leads.map(l => [
      `${l.firstName} ${l.lastName}`, l.position, l.company, l.department,
      l.domain || '', l.email || '', l.location || '',
      l.jobPosting?.title || '', l.jobPosting?.applyLink || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reachly-leads-${(leadCompany || leadTitle).replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads to CSV`);
  };

  const saveJobToCRM = async (job: Job) => {
    setConfirmModal({ type: 'job', data: job });
    setConfirmNotes('');
  };

  const saveLeadToCRM = async (lead: LeadResult) => {
    setConfirmModal({ type: 'lead', data: lead });
    setConfirmNotes('');
  };

  const handleConfirmSave = async () => {
    if (!confirmModal) return;
    setConfirmSaving(true);
    try {
      if (confirmModal.type === 'job') {
        const job = confirmModal.data;
        const salary = job.minSalary || job.maxSalary
          ? `$${job.minSalary ? Math.round(job.minSalary / 1000) + 'k' : '?'} - $${job.maxSalary ? Math.round(job.maxSalary / 1000) + 'k' : '?'}`
          : undefined;
        await addLead({
          title: job.title, company: job.company,
          location: [job.city, job.state].filter(Boolean).join(', ') || (job.isRemote ? 'Remote' : ''),
          salary, source: 'Indeed', status: 'new', notes: confirmNotes || undefined,
        });
        setSavedJobIds((prev) => new Set([...Array.from(prev), job.id]));
      } else {
        const lead = confirmModal.data;
        await addLead({
          title: lead.position, company: lead.company,
          email: lead.email, source: 'Hunter', status: 'new', notes: confirmNotes || undefined,
        });
        setSavedLeadIds((prev) => new Set([...Array.from(prev), lead.id]));
      }
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
        <p className="text-slate-400 text-sm mt-1">Search for jobs and leads from multiple sources</p>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-1.5 inline-flex">
        <button onClick={() => setTab('jobs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'jobs' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Briefcase className="w-4 h-4" /> Job Search
        </button>
        <button onClick={() => setTab('leads')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'leads' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Users className="w-4 h-4" /> Lead Search
        </button>
        <button onClick={() => setTab('map')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'map' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Map className="w-4 h-4" /> Map Search
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sticky top-0 z-10 shadow-sm">
        {tab === 'jobs' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={jobQuery} onChange={(e) => setJobQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchJobs()}
                  placeholder="Keywords (e.g. React Developer)"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchJobs()}
                  placeholder="Location (e.g. Remote, New York)"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <button onClick={searchJobs} disabled={jobsLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 col-span-2 sm:col-span-1">
                {jobsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search Jobs
              </button>
            </div>
            {/* Search History */}
            {searchHistory.length > 0 && !jobsSearched && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recent:</span>
                {searchHistory.map((term) => (
                  <button key={term} onClick={() => { setJobQuery(term); }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'leads' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                  placeholder="Job Title (e.g. CEO, HR Manager)"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                  placeholder="Company Name"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={leadLocation} onChange={(e) => setLeadLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLeads()}
                  placeholder="Location"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
              </div>
            </div>

            {/* Seniority Filter */}
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

            {/* Industry Filter */}
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

            <button onClick={searchLeads} disabled={leadsLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
              {leadsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Find Leads
            </button>
          </div>
        ) : null}
      </div>

      {/* Map Search Tab */}
      {tab === 'map' && <MapSearch />}

      {/* Results */}
      {tab === 'jobs' ? (
        <div>
          {jobsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : jobsError ? (
            <div className="bg-white rounded-2xl border border-red-100 p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-[#1e293b]">Something went wrong</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">{jobsError}</p>
              <button onClick={searchJobs}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : jobs.length > 0 ? (
            <>
              <p className="text-sm text-slate-400 mb-3">Showing <span className="font-semibold text-[#1e293b]">{Math.min(visibleJobCount, jobs.length)}</span> of <span className="font-semibold text-[#1e293b]">{jobs.length}</span> jobs</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.slice(0, visibleJobCount).map((job) => (
                  <div key={job.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <JobCard job={job} onSaveToCRM={saveJobToCRM} isSaved={savedJobIds.has(job.id)} />
                  </div>
                ))}
              </div>
              {visibleJobCount < jobs.length && (
                <div className="flex justify-center mt-6">
                  <button onClick={() => setVisibleJobCount((p) => p + 10)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm">
                    <ChevronRight className="w-4 h-4" /> Load More ({jobs.length - visibleJobCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : jobsSearched ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-[#1e293b]">No jobs found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Try different keywords or broaden your search filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">Search for Jobs</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Enter keywords above to discover opportunities from multiple job boards</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['React Developer', 'Product Manager', 'UX Designer', 'Data Scientist'].map((s) => (
                  <button key={s} onClick={() => { setJobQuery(s); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'leads' ? (
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
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Try a different company name or job title</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b]">Find Leads</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Search by company or job title to discover potential contacts</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['Google', 'Microsoft', 'Amazon', 'Meta'].map((s) => (
                  <button key={s} onClick={() => { setLeadCompany(s); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

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
                    {confirmModal.type === 'job' ? confirmModal.data.title : confirmModal.data.position}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 truncate">{confirmModal.data.company}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {confirmModal.type === 'job' && confirmModal.data.city && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500 truncate">{confirmModal.data.city}{confirmModal.data.state ? `, ${confirmModal.data.state}` : ''}</span>
                  </div>
                )}
                {confirmModal.type === 'job' && (confirmModal.data.minSalary || confirmModal.data.maxSalary) && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-lg">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">${Math.round((confirmModal.data.minSalary || 0) / 1000)}k - ${Math.round((confirmModal.data.maxSalary || 0) / 1000)}k</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-semibold border border-blue-100">Source: {confirmModal.type === 'job' ? 'Indeed' : 'Hunter'}</span>
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
