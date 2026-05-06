'use client';

import { useState, useCallback } from 'react';
import { useClientStore } from '@/lib/clientStore';
import MapCard, { type MapBusiness } from './MapCard';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Loader2, AlertCircle, RefreshCw,
  Download, SlidersHorizontal, Sparkles, Target,
  ChevronDown, Save,
} from 'lucide-react';

const NICHES = [
  { label: '🦷 Dentist', value: 'Dentist' },
  { label: '💇 Salon', value: 'Beauty salon' },
  { label: '🏋 Gym', value: 'Gym' },
  { label: '🍕 Restaurant', value: 'Restaurant' },
  { label: '🏠 Real Estate', value: 'Real estate agency' },
  { label: '⚖️ Law Firm', value: 'Law firm' },
  { label: '📚 Coaching', value: 'Coaching center' },
  { label: '🏥 Pharmacy', value: 'Pharmacy' },
  { label: '🚗 Car Wash', value: 'Car wash' },
  { label: '🐾 Pet Shop', value: 'Pet shop' },
];

const POPULAR_CITIES = [
  'New York', 'London', 'Dubai', 'Toronto', 'Sydney',
  'Dhaka', 'Mumbai', 'Singapore', 'Berlin', 'Tokyo',
];

const PAIN_KEYWORDS = ['slow', 'bad service', 'late response', 'not professional', 'no response', 'rude'];

export default function MapSearch() {
  const { addClient } = useClientStore();

  // Form state
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(30);
  const [minRating, setMinRating] = useState(1.0);
  const [maxRating, setMaxRating] = useState(5.0);
  const [minReviews, setMinReviews] = useState(1);
  const [maxReviews, setMaxReviews] = useState(10000);
  const [websiteFilter, setWebsiteFilter] = useState<'any' | 'none' | 'has'>('any');
  const [requirePhone, setRequirePhone] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedPainKw, setSelectedPainKw] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results state
  const [businesses, setBusinesses] = useState<MapBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'none' | 'has'>('all');
  const [bulkSaving, setBulkSaving] = useState(false);


  const searchQuery = keyword && location ? `${keyword} in ${location}` : (keyword || location);

  const togglePainKw = (kw: string) => {
    setSelectedPainKw(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const startSearch = useCallback(async () => {
    if (!searchQuery.trim()) { toast.error('Enter a business type and location'); return; }
    setLoading(true); setError(''); setSearched(true); setBusinesses([]);
    setProgress('Scanning Google Maps... please wait (2-5 minutes)');

    // Show elapsed time while waiting
    const startTime = Date.now();
    const timerRef = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const dots = '.'.repeat((Math.floor(elapsed / 2) % 3) + 1);
      setProgress(`Scanning Google Maps${dots} (${elapsed}s elapsed)`);
    }, 1000);

    try {
      const res = await fetch('/api/map-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          maxResults,
          minRating, maxRating,
          minReviews, maxReviews,
          websiteFilter, requirePhone, onlyOpen,
          painKeywords: selectedPainKw,
        }),
      });

      clearInterval(timerRef);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to search');
      }

      const data = await res.json();
      setBusinesses(data.businesses || []);
      setProgress('');

      if (data.businesses?.length > 0) {
        toast.success(`Found ${data.businesses.length} qualified leads!`);
      } else {
        toast(data.message || 'No leads matched your filters. Try adjusting rating/review ranges.');
      }

    } catch (err) {
      clearInterval(timerRef);
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, maxResults, minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen, selectedPainKw]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addToCRM = async (biz: MapBusiness & { enrichedEmail?: string }) => {
    // Lead Search → Client Pipeline (client_leads table)
    await addClient({
      client_name: biz.name,
      contact_person: biz.category || 'Owner',
      email: biz.enrichedEmail || null,
      phone: biz.phone || null,
      project_type: biz.category || 'Local Business',
      source: 'Google Maps',
      status: 'lead',
      priority: biz.leadScore >= 70 ? 'high' : biz.leadScore >= 40 ? 'medium' : 'low',
      description: `Local business found via Google Maps search`,
      notes: `⭐ ${biz.rating}/5 (${biz.reviewsCount} reviews) | Score: ${biz.leadScore}/100${biz.website ? ` | 🌐 ${biz.website}` : ' | 🎯 No Website'} | 📍 ${biz.address}, ${biz.city} | Maps: ${biz.mapsUrl}`,
    });
    setSavedIds(prev => new Set([...Array.from(prev), biz.id]));
    toast.success('Added to Client Pipeline!');
  };

  const saveAllToCRM = async () => {
    const unsaved = displayBiz.filter(b => !savedIds.has(b.id));
    if (unsaved.length === 0) { toast('All leads already saved'); return; }
    setBulkSaving(true);
    let count = 0;
    for (const biz of unsaved) {
      await addToCRM(biz);
      count++;
    }
    setBulkSaving(false);
    toast.success(`Saved ${count} leads to CRM!`);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Rating', 'Reviews', 'Phone', 'Website', 'Address', 'City', 'Lead Score', 'Maps URL'];
    const rows = displayBiz.map(b => [
      b.name, b.category, b.rating, b.reviewsCount,
      b.phone || '', b.website || '', b.address, b.city,
      b.leadScore, b.mapsUrl,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `reachly-leads-${searchQuery.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${displayBiz.length} leads to CSV`);
  };

  const displayBiz = businesses.filter(b => {
    if (campaignFilter === 'none') return !b.website;
    if (campaignFilter === 'has') return !!b.website;
    return true;
  });

  const selectCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none';

  return (
    <div className="space-y-5">
      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
        {/* Keyword Input — Primary */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">🔍 Business Type / Keyword</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startSearch()}
              placeholder="e.g. Dentist, Restaurant, Gym, Photography studio..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          {/* Quick-fill chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {NICHES.map(n => (
              <button
                key={n.value}
                onClick={() => setKeyword(n.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${keyword === n.value ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Input — Global */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">📍 Location (Worldwide)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startSearch()}
              placeholder="e.g. Manhattan, New York / Gulshan, Dhaka / London, UK..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          {/* Popular cities quick-fill */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_CITIES.map(city => (
              <button key={city} onClick={() => setLocation(city)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${location === city ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Search Preview */}
        {searchQuery && (
          <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Searching: <span className="font-bold">&quot;{searchQuery}&quot;</span>
            </p>
          </div>
        )}

        {/* Quick Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Max Results</label>
            <div className="relative">
              <select value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} className={selectCls}>
                <option value={10}>10 businesses</option>
                <option value={20}>20 businesses</option>
                <option value={30}>30 businesses</option>
                <option value={50}>50 businesses</option>
                <option value={100}>100 businesses</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">🌐 Website</label>
            <div className="relative">
              <select value={websiteFilter} onChange={e => setWebsiteFilter(e.target.value as typeof websiteFilter)} className={selectCls}>
                <option value="any">Any</option>
                <option value="none">No Website 🎯</option>
                <option value="has">Has Website</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">⭐ Rating</label>
            <div className="flex items-center gap-1">
              <input type="number" value={minRating} onChange={e => setMinRating(Number(e.target.value))} step={0.1} min={1} max={5}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <span className="text-slate-400 text-xs">–</span>
              <input type="number" value={maxRating} onChange={e => setMaxRating(Number(e.target.value))} step={0.1} min={1} max={5}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">🧾 Reviews</label>
            <div className="flex items-center gap-1">
              <input type="number" value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} min={0}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <span className="text-slate-400 text-xs">–</span>
              <input type="number" value={maxReviews} onChange={e => setMaxReviews(Number(e.target.value))} min={0}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
        </div>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">💬 Pain-Point Keywords</label>
              <div className="flex flex-wrap gap-2">
                {PAIN_KEYWORDS.map(kw => (
                  <button key={kw} onClick={() => togglePainKw(kw)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${selectedPainKw.includes(kw) ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'}`}>
                    {kw}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={requirePhone} onChange={e => setRequirePhone(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/20" />
                <span className="text-xs font-medium text-slate-600">📞 Phone Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/20" />
                <span className="text-xs font-medium text-slate-600">🕒 Open Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={startSearch}
          disabled={loading || !searchQuery.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{progress}</>
            : <><Target className="w-4 h-4" />Find High-Converting Leads</>}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{error}</p>
          <button onClick={startSearch} className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {businesses.length > 0 && !loading && (
        <div>
          {/* Results header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                <span className="text-blue-600">{displayBiz.length}</span> qualified leads
                <span className="text-slate-400 font-normal"> from &quot;{searchQuery}&quot;</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Sorted by Lead Score · Highest first</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveAllToCRM}
                disabled={bulkSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {bulkSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save All ({displayBiz.filter(b => !savedIds.has(b.id)).length})
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Campaign Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
            {(['all', 'none', 'has'] as const).map(f => (
              <button key={f} onClick={() => setCampaignFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${campaignFilter === f ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f === 'all' ? '🌐 All' : f === 'none' ? '🎯 No Website' : '💻 Has Website'}
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({businesses.filter(b => f === 'all' ? true : f === 'none' ? !b.website : !!b.website).length})
                </span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBiz.map(biz => (
              <div key={biz.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <MapCard business={biz} onAddToCRM={addToCRM} isSaved={savedIds.has(biz.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && businesses.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-700">No leads matched your filters</h3>
          <p className="text-sm text-slate-400 mt-1">Try widening the rating/review range or a different location</p>
        </div>
      )}

      {/* Empty State */}
      {!searched && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <Sparkles className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Find High-Converting Local Leads</h3>
          <p className="text-sm text-slate-400 mt-1.5 max-w-md">
            Search any business type in any city worldwide. Our AI scores each lead based on rating, reviews, website presence, and more.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-6 text-xs text-slate-600 max-w-sm w-full">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <div className="text-xl mb-1">1️⃣</div>
              <span className="font-semibold">Type Keyword</span>
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. &quot;Restaurant&quot;</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <div className="text-xl mb-1">2️⃣</div>
              <span className="font-semibold">Add Location</span>
              <p className="text-[10px] text-slate-400 mt-0.5">e.g. &quot;New York&quot;</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <div className="text-xl mb-1">3️⃣</div>
              <span className="font-semibold">Get Leads</span>
              <p className="text-[10px] text-slate-400 mt-0.5">AI-scored results</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-400 border border-slate-100">⭐ 3.5–4.3 Sweet Spot</span>
            <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-400 border border-slate-100">🎯 No Website = Easy Pitch</span>
            <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-400 border border-slate-100">🔥 AI Lead Score</span>
            <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-400 border border-slate-100">🌍 Works Worldwide</span>
          </div>
        </div>
      )}
    </div>
  );
}
