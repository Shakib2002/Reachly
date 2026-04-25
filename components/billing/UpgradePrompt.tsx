'use client';

import { X, Sparkles, Zap, Check } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradePrompt({ feature, onClose, onUpgrade }: UpgradePromptProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">Upgrade to Pro</h3>
        <p className="text-sm text-slate-400 mb-4">You&apos;ve reached the Free plan limit for <strong className="text-slate-600">{feature}</strong></p>
        <div className="bg-slate-50 rounded-xl p-4 mb-5 text-left space-y-2">
          {['Unlimited leads & job searches', 'AI email generation', 'Advanced analytics', 'Auto sequences', '2000 emails/month'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}</div>
          ))}
        </div>
        <button onClick={onUpgrade}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Upgrade to Pro — $29/mo
        </button>
        <button onClick={onClose} className="mt-2 text-xs text-slate-400 hover:text-slate-600">Maybe later</button>
      </div>
    </div>
  );
}
