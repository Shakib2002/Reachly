import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-4">404</div>
        <h1 className="text-2xl font-extrabold text-[#1e293b] mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/discover" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25">Go to Dashboard</Link>
          <Link href="/" className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Home</Link>
        </div>
      </div>
    </div>
  );
}
