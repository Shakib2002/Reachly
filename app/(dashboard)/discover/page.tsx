'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import JobCard, { JobCardSkeleton, type Job } from '@/components/discover/JobCard';
import LeadCard, { LeadCardSkeleton, type LeadResult } from '@/components/discover/LeadCard';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Briefcase, Users, Loader2, Compass,
  ChevronDown, Sparkles, AlertCircle, RefreshCw,
} from 'lucide-react';

type Tab = 'jobs' | 'leads';

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
    setJobsLoading(true); setJobsError(''); setJobsSearched(true);
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
    setLeadsLoading(true); setLeadsError(''); setLeadsSearched(true);
    addToHistory(leadCompany || leadTitle);
    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: leadCompany, title: leadTitle, location: leadLocation }),
      });
      if (!res.ok) throw new Error('Failed to search leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLeadsLoading(false); }
  }, [leadCompany, leadTitle, leadLocation, addToHistory]);

  const saveJobToCRM = async (job: Job) => {
    const salary = job.minSalary || job.maxSalary
      ? `$${job.minSalary ? Math.round(job.minSalary / 1000) + 'k' : '?'} - $${job.maxSalary ? Math.round(job.maxSalary / 1000) + 'k' : '?'}`
      : undefined;
    await addLead({
      title: job.title, company: job.company,
      location: [job.city, job.state].filter(Boolean).join(', ') || (job.isRemote ? 'Remote' : ''),
      salary, source: 'Indeed', status: 'new',
    });
    setSavedJobIds((prev) => new Set([...Array.from(prev), job.id]));
  };

  const saveLeadToCRM = async (lead: LeadResult) => {
    await addLead({
      title: lead.position, company: lead.company,
      email: lead.email, source: 'Hunter', status: 'new',
    });
    setSavedLeadIds((prev) => new Set([...Array.from(prev), lead.id]));
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
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-1.5 inline-flex">
        <button onClick={() => setTab('jobs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'jobs' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Briefcase className="w-4 h-4" /> Job Search
        </button>
        <button onClick={() => setTab('leads')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'leads' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Users className="w-4 h-4" /> Lead Search
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sticky top-0 z-10 shadow-sm">
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
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={selectClasses}>
                  <option value="all">All Types</option>
                  <option value="FULLTIME">Full-time</option>
                  <option value="PARTTIME">Part-time</option>
                  <option value="CONTRACTOR">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className={selectClasses}>
                  <option value="all">Any Time</option>
                  <option value="today">Last 24h</option>
                  <option value="3days">Last 3 days</option>
                  <option value="week">Last week</option>
                  <option value="month">Last month</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button onClick={searchJobs} disabled={jobsLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 col-span-2 sm:col-span-1">
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
        ) : (
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
            <button onClick={searchLeads} disabled={leadsLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
              {leadsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Find Leads
            </button>
          </div>
        )}
      </div>

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
              <p className="text-sm text-slate-400 mb-3"><span className="font-semibold text-[#1e293b]">{jobs.length}</span> jobs found</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <JobCard job={job} onSaveToCRM={saveJobToCRM} isSaved={savedJobIds.has(job.id)} />
                  </div>
                ))}
              </div>
            </>
          ) : jobsSearched ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-[#1e293b]">No jobs found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Try different keywords or broaden your search filters</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
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
      ) : (
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
              <p className="text-sm text-slate-400 mb-3"><span className="font-semibold text-[#1e293b]">{leads.length}</span> leads found</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <LeadCard lead={lead} onAddToCRM={saveLeadToCRM} isSaved={savedLeadIds.has(lead.id)} />
                  </div>
                ))}
              </div>
            </>
          ) : leadsSearched ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-[#1e293b]">No leads found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">Try a different company name or job title</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
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
      )}
    </div>
  );
}
