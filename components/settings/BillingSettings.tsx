'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Check, ExternalLink, Loader2 } from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/planLimitsConstants';
import toast from 'react-hot-toast';


interface Props {
  plan: string;
}

interface Usage {
  leads_count: number;
  emails_count: number;
  job_searches_count: number;
  ai_generations_count: number;
  followups_count: number;
}

const PLAN_PRICES: Record<string, number> = { free: 0, pro: 29, team: 79 };

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max === Infinity ? 0 : Math.min(100, Math.round((used / max) * 100));
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="text-[#1e293b] font-semibold">
          {used}{max === Infinity ? ' / ∞' : ` / ${max}`}
          {max !== Infinity && <span className="text-slate-400 font-normal ml-1">({pct}%)</span>}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${max === Infinity ? 'bg-emerald-400 w-full opacity-30' : barColor}`}
          style={{ width: max === Infinity ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingSettings({ plan }: Props) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await globalThis.fetch('/api/usage');
        if (!res.ok) throw new Error('Failed to fetch usage');
        setUsage(await res.json());
      } catch (e) {
        console.error('Error fetching usage:', e);
        toast.error('Failed to load usage data');
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
  }, []);

  const handleUpgrade = async (targetPlan: string, annual = false) => {
    setUpgrading(true);
    try {
      const res = await globalThis.fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, annual }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Failed to start checkout');
    } catch {
      toast.error('Failed to connect to payment provider');
    } finally {
      setUpgrading(false);
    }
  };

  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const card = 'bg-white rounded-2xl border border-slate-200/60 p-6';

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">Current Plan</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage your subscription</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
              plan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
              plan === 'team' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' :
              'bg-slate-100 text-slate-500'
            }`}>
              {plan}
            </span>
            <span className="text-lg font-bold text-[#1e293b]">
              {PLAN_PRICES[plan] === 0 ? 'Free' : `$${PLAN_PRICES[plan]}/mo`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
          <CreditCard className="w-3.5 h-3.5" />
          {plan === 'free' ? 'No payment method required' : 'Next billing date: contact support'}
        </div>
      </div>

      {/* Usage */}
      <div className={card}>
        <h2 className="text-base font-bold text-[#1e293b] mb-4">Usage This Month</h2>
        {loadingUsage ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <UsageBar label="Leads" used={usage?.leads_count || 0} max={typeof limits.leads === 'number' ? limits.leads : Infinity} />
            <UsageBar label="Emails Sent" used={usage?.emails_count || 0} max={typeof limits.emails === 'number' ? limits.emails : Infinity} />
            <UsageBar label="Job Searches" used={usage?.job_searches_count || 0} max={typeof limits.jobSearches === 'number' ? limits.jobSearches : Infinity} />
            <UsageBar label="AI Generations" used={usage?.ai_generations_count || 0} max={limits.aiGeneration ? Infinity : 0} />
          </div>
        )}
      </div>

      {/* Upgrade card */}
      {plan === 'free' && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold">Upgrade to Pro</h3>
              <p className="text-blue-100 text-sm mt-0.5">Unlock the full power of Reachly</p>
            </div>
            <span className="text-2xl font-black">$29<span className="text-base font-normal text-blue-200">/mo</span></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {[
              'Unlimited leads',
              '2,000 emails / month',
              'AI email generation',
              'Full analytics',
              'Unlimited follow-ups',
              'Client pipeline',
              'Priority support',
              'Advanced integrations',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                {f}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={upgrading}
              className="flex items-center gap-2 bg-white text-blue-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-60"
            >
              {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Upgrade to Pro
            </button>
            <a href="/pricing" className="flex items-center gap-1 text-blue-100 text-xs hover:text-white transition-colors">
              View all plans <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
