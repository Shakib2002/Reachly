export default function DashboardLoading() {
  return (
    <div className="space-y-5 max-w-[1200px] animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-48" />
      <div className="h-4 bg-slate-100 rounded w-72" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-28"><div className="w-9 h-9 bg-slate-100 rounded-xl mb-3" /><div className="h-5 bg-slate-100 rounded w-12 mb-1" /><div className="h-3 bg-slate-50 rounded w-20" /></div>))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-64" />))}
      </div>
    </div>
  );
}
