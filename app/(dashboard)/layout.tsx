'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, Briefcase, MapPin } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import AddLeadModal from '@/components/dashboard/AddLeadModal';
import AddClientModalGlobal from '@/components/dashboard/AddClientModalGlobal';
import { useMapSearchStore } from '@/lib/mapSearchStore';
import { useJobSearchStore } from '@/lib/jobSearchStore';

function SearchBannerItem({ type, loading, label, query, count, progress }: {
  type: 'job' | 'lead';
  loading: boolean;
  label: string;
  query: string;
  count: number;
  progress?: string;
}) {
  const Icon = type === 'job' ? Briefcase : MapPin;
  return (
    <Link href="/discover" className="block">
      <div className={`mx-4 mt-2 px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer hover:shadow-md ${
        loading
          ? 'bg-blue-50 border-blue-200 animate-pulse'
          : 'bg-emerald-50 border-emerald-200'
      }`}>
        {loading ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        )}
        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">
            {loading ? (
              <>{label}: &quot;{query}&quot;</>
            ) : (
              <>✅ Found {count} results for &quot;{query}&quot;</>
            )}
          </p>
          {loading && progress && (
            <p className="text-[10px] text-blue-500 truncate">{progress}</p>
          )}
        </div>
        <span className="text-[10px] text-slate-400 flex-shrink-0">
          {loading ? 'Processing...' : 'Click to view →'}
        </span>
      </div>
    </Link>
  );
}

function SearchStatusBanners() {
  const mapSearch = useMapSearchStore();
  const jobSearch = useJobSearchStore();

  // Don't show completion banners on discover page
  const isDiscoverPage = typeof window !== 'undefined' && window.location.pathname === '/discover';

  const showMap = mapSearch.loading || (!isDiscoverPage && mapSearch.searched && mapSearch.businesses.length > 0);
  const showJob = jobSearch.loading || (!isDiscoverPage && jobSearch.searched && jobSearch.leads.length > 0);

  if (!showMap && !showJob) return null;

  return (
    <div>
      {showJob && (
        <SearchBannerItem
          type="job"
          loading={jobSearch.loading}
          label="Job Search"
          query={jobSearch.lastQuery}
          count={jobSearch.leads.length}
        />
      )}
      {showMap && (
        <SearchBannerItem
          type="lead"
          loading={mapSearch.loading}
          label="Lead Search"
          query={mapSearch.lastQuery}
          count={mapSearch.businesses.length}
          progress={mapSearch.progress}
        />
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative">
      {/* Subtle dashboard background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.03) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(56,189,248,0.02) 0%, transparent 50%)'}} />
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)', backgroundSize:'32px 32px'}} />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1a30] to-[#0a1628]" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/5 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent" />
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-3 p-1.5 hover:bg-white/10 rounded-lg z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />

        {/* Global search status banner — shows on all pages when search is running */}
        <SearchStatusBanners />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative z-10">
          {children}
        </main>
      </div>

      {/* Global modals */}
      <AddLeadModal />
      <AddClientModalGlobal />
    </div>
  );
}
