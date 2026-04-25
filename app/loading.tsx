export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 animate-pulse shadow-lg shadow-blue-500/30">R</div>
        <div className="flex gap-1 justify-center"><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>
      </div>
    </div>
  );
}
