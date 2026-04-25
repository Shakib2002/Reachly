'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('App error:', error); }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1e293b] mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-6">We encountered an unexpected error. Please try again or go back to the homepage.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-slate-300 mt-6">Error ID: {error.digest}</p>}
      </div>
    </div>
  );
}
