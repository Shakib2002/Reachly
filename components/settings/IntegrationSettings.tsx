'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Check, Plug, Zap, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

const supabase = createBrowserSupabaseClient();
const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white';

interface IntegrationKeys {
  rapidapi_key: string;
  hunter_api_key: string;
  resend_api_key: string;
  apollo_api_key: string;
  [key: string]: string;
}

interface Props {
  keys: IntegrationKeys;
  onSaved: (keys: Partial<IntegrationKeys>) => void;
}

const INTEGRATIONS = [
  {
    id: 'rapidapi_key',
    name: 'JSearch (Indeed)',
    category: 'Job Search',
    desc: 'Search millions of jobs from Indeed, LinkedIn and more',
    icon: '🔍',
    iconBg: 'bg-blue-50',
    hint: 'Using platform default. Optionally add your own RapidAPI key for higher limits.',
    docsUrl: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch',
    hasDefault: true,
  },
  {
    id: 'hunter_api_key',
    name: 'Hunter.io',
    category: 'Lead Search',
    desc: 'Find professional email addresses for lead discovery',
    icon: '📧',
    iconBg: 'bg-emerald-50',
    hint: 'Using platform default. Add your own key at hunter.io for higher limits.',
    docsUrl: 'https://hunter.io/api',
    hasDefault: true,
  },
  {
    id: 'resend_api_key',
    name: 'Resend',
    category: 'Email',
    desc: 'Send transactional emails for outreach campaigns',
    icon: '✉️',
    iconBg: 'bg-violet-50',
    hint: 'Using platform default. Add your own key at resend.com to send from your domain.',
    docsUrl: 'https://resend.com/docs',
    hasDefault: true,
  },
  {
    id: 'apollo_api_key',
    name: 'Apollo.io',
    category: 'Lead Search',
    desc: 'B2B lead database with 275M+ contacts',
    icon: '🚀',
    iconBg: 'bg-orange-50',
    hint: 'Using platform default. Add your own key at app.apollo.io for higher limits.',
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/',
    hasDefault: true,
  },
];

const COMING_SOON = [
  { name: 'LinkedIn Jobs', category: 'Job Search', icon: '💼', desc: 'Direct LinkedIn job search integration' },
  { name: 'Gmail', category: 'Email', icon: '📬', desc: 'Send emails directly from your Gmail account' },
  { name: 'Upwork', category: 'Freelance', icon: '🏗️', desc: 'Sync Upwork proposals and client leads' },
  { name: 'Fiverr', category: 'Freelance', icon: '🎨', desc: 'Track Fiverr orders and client conversations' },
  { name: 'Notion', category: 'Export', icon: '📝', desc: 'Sync your leads and clients to Notion' },
  { name: 'HubSpot', category: 'Export', icon: '🔶', desc: 'Export pipeline data to HubSpot CRM' },
];

function IntegrationCard({ intg, value, onSaved }: {
  intg: typeof INTEGRATIONS[0];
  value: string;
  onSaved: (key: string, val: string) => void;
}) {
  const [val, setVal] = useState(value);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Always "connected" since we have platform defaults
  const hasCustomKey = !!value;

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('user_settings').update({
        [intg.id]: val || null, updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
      if (!error) { toast.success(`${intg.name} key saved`); onSaved(intg.id, val); }
      else toast.error('Failed to save');
    }
    setSaving(false);
  };

  const resetToDefault = async () => {
    setVal('');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_settings').update({ [intg.id]: null, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      toast.success(`${intg.name} reset to platform default`);
      onSaved(intg.id, '');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${intg.iconBg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
            {intg.icon}
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">{intg.name}</p>
            <p className="text-[10px] text-slate-400">{intg.category}</p>
          </div>
        </div>
        {/* Always show as active since platform provides default */}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          {hasCustomKey ? 'Custom Key' : 'Platform Default'}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3">{intg.desc}</p>

      {/* Info banner */}
      <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2 mb-3">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-600">{intg.hint}</p>
      </div>

      {/* Optional override toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors mb-2 flex items-center gap-1"
      >
        <Zap className="w-3 h-3" />
        {expanded ? 'Hide' : 'Use your own API key (optional)'}
      </button>

      {expanded && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={show ? 'text' : 'password'}
                value={val}
                onChange={e => setVal(e.target.value)}
                className={inp + ' pr-10 text-xs font-mono'}
                placeholder="Enter your own API key (optional)..."
              />
              <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button onClick={save} disabled={saving} className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 disabled:opacity-40 flex-shrink-0 flex items-center gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
          {hasCustomKey && (
            <button onClick={resetToDefault} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
              Reset to platform default
            </button>
          )}
          <a href={intg.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-600 transition-colors block">
            Get API key →
          </a>
        </div>
      )}
    </div>
  );
}

export default function IntegrationSettings({ keys, onSaved }: Props) {
  const categories = Array.from(new Set(INTEGRATIONS.map(i => i.category)));

  return (
    <div className="space-y-6">
      {/* Platform default notice */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Plug className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">All integrations are pre-configured</p>
          <p className="text-xs text-emerald-600 mt-0.5">All features work out of the box using platform defaults. You can optionally add your own API keys for higher rate limits.</p>
        </div>
      </div>

      {categories.map(cat => {
        const catIntgs = INTEGRATIONS.filter(i => i.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Plug className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat}</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {catIntgs.map(intg => (
                <IntegrationCard
                  key={intg.id}
                  intg={intg}
                  value={keys[intg.id] || ''}
                  onSaved={(k, v) => onSaved({ [k]: v })}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Coming soon */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coming Soon</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMING_SOON.map(cs => (
            <div key={cs.name} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 opacity-60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-base">{cs.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-[#1e293b]">{cs.name}</p>
                    <p className="text-[9px] text-slate-400">{cs.category}</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[9px] font-bold">Soon</span>
              </div>
              <p className="text-[11px] text-slate-400">{cs.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
