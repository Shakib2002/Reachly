'use client';

import { useState, useCallback, useRef } from 'react';
import { useLeadStore } from '@/lib/store';
import MapCard, { MapCardSkeleton, type MapBusiness } from './MapCard';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Loader2, AlertCircle, RefreshCw,
  Download, SlidersHorizontal, Sparkles, Target,
  ChevronDown, X,
} from 'lucide-react';

const NICHES = [
  { label: '🦷 Dentist / Clinic', value: 'Dentist' },
  { label: '💇 Salon / Beauty', value: 'Beauty salon' },
  { label: '🏋 Gym / Fitness', value: 'Gym' },
  { label: '🍕 Restaurant / Cafe', value: 'Restaurant' },
  { label: '🏠 Real Estate', value: 'Real estate agency' },
  { label: '⚖️ Law Firm', value: 'Law firm' },
  { label: '📚 Coaching Center', value: 'Coaching center' },
  { label: '✍️ Custom...', value: 'custom' },
];

const PAIN_KEYWORDS = ['slow', 'bad service', 'late response', 'not professional', 'no response', 'rude'];
const AREAS = ['Gulshan', 'Banani', 'Dhanmondi', 'Uttara', 'Mirpur', 'Wari', 'Motijheel'];

export default function MapSearch() {
  const { addLead } = useLeadStore();

  // Form state
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(30);
  const [minRating, setMinRating] = useState(3.5);
  const [maxRating, setMaxRating] = useState(4.3);
  const [minReviews, setMinReviews] = useState(15);
  const [maxReviews, setMaxReviews] = useState(120);
  const [websiteFilter, setWebsiteFilter] = useState<'any' | 'none' | 'has'>('any');
  const [requirePhone, setRequirePhone] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(true);
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

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveNiche = niche === 'custom' ? customNiche : niche;
  const searchQuery = effectiveNiche && location ? `${effectiveNiche} in ${location}` : (effectiveNiche || location);

  const togglePainKw = (kw: string) => {
    setSelectedPainKw(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const startSearch = useCallback(async () => {
    if (!searchQuery.trim()) { toast.error('Enter a business type and location'); return; }
    setLoading(true); setError(''); setSearched(true); setBusinesses([]);
    setProgress('Starting Google Maps scan...');

    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      // Start run
      const res = await fetch('/api/map-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          maxResults,
          minRating, maxRating,
          minReviews, maxReviews,
          websiteFilter, requirePhone, onlyOpen,
        }),
      });

      if (!res.ok) throw new Error('Failed to start search');
      const { runId, filters } = await res.json();

      setProgress('Scraping Google Maps... (this takes 30–90 seconds)');

      // Build filter query string for polling
      const filterQs = new URLSearchParams({
        minRating: String(filters.minRating),
        maxRating: String(filters.maxRating),
        minReviews: String(filters.minReviews),
        maxReviews: String(filters.maxReviews),
        websiteFilter: filters.websiteFilter,
        requirePhone: String(filters.requirePhone),
        onlyOpen: String(filters.onlyOpen),
        maxResults: String(filters.maxResults),
        painKeywords: selectedPainKw.join(','),
      });

      // Poll for results
      let attempts = 0;
      pollingRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 40) {
          clearInterval(pollingRef.current!);
          setError('Search timed out. Please try again.');
          setLoading(false);
          return;
        }

        const dots = '.'.repeat((attempts % 3) + 1);
        setProgress(`Scanning Google Maps${dots} (${attempts * 4}s)`);

        const pollRes = await fetch(`/api/map-search/results/${runId}?${filterQs}`);
        const pollData = await pollRes.json();

        if (pollData.status === 'SUCCEEDED') {
          clearInterval(pollingRef.current!);
          setBusinesses(pollData.businesses || []);
          setLoading(false);
          setProgress('');
          toast.success(`Found ${pollData.businesses?.length || 0} qualified leads!`);
        } else if (pollData.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          setError('Map search failed. Please try again.');
          setLoading(false);
        }
      }, 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }, [searchQuery, maxResults, minRating, maxRating, minReviews, maxReviews, websiteFilter, requirePhone, onlyOpen, selectedPainKw]);

  const addToCRM = async (biz: MapBusiness) => {
    await addLead({
      title: biz.category || 'Business',
      company: biz.name,
      location: biz.address,
      source: 'Google Maps',
      status: 'new',
      notes: `Rating: ${biz.rating} (${biz.reviewsCount} reviews) | Lead Score: ${biz.leadScore}/100${biz.phone ? ` | Phone: ${biz.phone}` : ''}${biz.website ? ` | Website: ${biz.website}` : ' | No Website'}`,
    });
    setSavedIds(prev => new Set([...Array.from(prev), biz.id]));
    toast.success('Added to CRM!');
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

  // Filter display by campaign
  const displayBiz = businesses.filter(b => {
    if (campaignFilter === 'none') return !b.website;
    if (campaignFilter === 'has') return !!b.website;
    return true;
  });

  const selectCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none';

  return (
    <div className="space-y-5">
      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        {/* Niche Selection */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">🏷 Business Type</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(n => (
              <button
                key={n.value}
                onClick={() => setNiche(n.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${niche === n.value ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
              >
                {n.label}
              </button>
            ))}
          </div>
          {niche === 'custom' && (
            <input
              type="text"
              value={customNiche}
              onChange={e => setCustomNiche(e.target.value)}
              placeholder="e.g. Photography studio"
              className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          )}
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">📍 Micro-Location</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {AREAS.map(a => (
              <button key={a} onClick={() => setLocation(a)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${location === a ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Or type custom: Gulshan 2, Dhaka"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <Search className="w-3 h-3" /> Will search: <span className="font-semibold text-slate-600">"{searchQuery}"</span>
            </p>
          )}
        </div>

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
            {/* Pain Keywords */}
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

            {/* Toggles */}
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
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{progress}</>
            : <><Target className="w-4 h-4" />Find High-Converting Leads</>}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 flex flex-col items-center text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{error}</p>
          <button onClick={startSearch} className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}

      {businesses.length > 0 && !loading && (
        <div>
          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                <span className="text-blue-600">{displayBiz.length}</span> qualified leads
                <span className="text-slate-400 font-normal"> from "{searchQuery}"</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Sorted by Lead Score · Highest first</p>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
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

      {searched && !loading && businesses.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-700">No leads matched your filters</h3>
          <p className="text-sm text-slate-400 mt-1">Try widening the rating/review range or a different location</p>
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Find High-Converting Local Leads</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Select a niche + location above. Our AI filters only businesses that <em>need your services</em>.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-5 text-xs text-slate-500 max-w-xs">
            <div className="p-2 bg-slate-50 rounded-lg">⭐ 3.5–4.3<br/>Rating Sweet Spot</div>
            <div className="p-2 bg-slate-50 rounded-lg">🎯 No Website<br/>Easy Pitch</div>
            <div className="p-2 bg-slate-50 rounded-lg">🔥 Lead Score<br/>AI Ranked</div>
          </div>
        </div>
      )}
    </div>
  );
}
