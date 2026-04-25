'use client';

import { useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Loader2,
} from 'lucide-react';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [loading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">Discover Jobs</h1>
        <p className="text-slate-500 text-sm mt-1">
          Search and discover new job opportunities from multiple sources
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Job title, company, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="sm:w-48 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Location"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {['Remote', 'Full-time', 'Part-time', 'Contract', 'Entry Level', 'Senior'].map(
            (filter) => (
              <button
                key={filter}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {filter}
              </button>
            )
          )}
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-[#1e293b]">
          Start Discovering
        </h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Search for jobs by title, company, or keywords. We&apos;ll aggregate
          results from multiple sources to help you find the perfect
          opportunity.
        </p>
      </div>
    </div>
  );
}
