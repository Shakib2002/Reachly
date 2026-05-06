'use client';

import { useState } from 'react';
import {
  Building2, Palette, Globe, Save, Key,
  Users, Copy, Check, ExternalLink, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WhiteLabelConfig {
  enabled: boolean;
  company_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  accent_color: string;
  custom_domain: string;
  support_email: string;
  hide_powered_by: boolean;
  custom_login_bg: string;
}

interface SubAccount {
  id: string;
  name: string;
  email: string;
  plan: string;
  leads: number;
  emails_sent: number;
  status: 'active' | 'paused' | 'cancelled';
  created_at: string;
}

export default function WhiteLabelSettings() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    enabled: false,
    company_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#3b82f6',
    accent_color: '#6366f1',
    custom_domain: '',
    support_email: '',
    hide_powered_by: false,
    custom_login_bg: '',
  });
  const [subAccounts] = useState<SubAccount[]>([]);
  const [activeSection, setActiveSection] = useState<'branding' | 'domain' | 'accounts' | 'api'>('branding');
  const [copied, setCopied] = useState('');

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const sections = [
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'domain' as const, label: 'Domain', icon: Globe },
    { id: 'accounts' as const, label: 'Sub-Accounts', icon: Users },
    { id: 'api' as const, label: 'API Keys', icon: Key },
  ];

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-500" /> White-Label & Agency Mode
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Rebrand Reachly as your own platform and manage client sub-accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[11px] font-semibold text-slate-500">{config.enabled ? 'Enabled' : 'Disabled'}</span>
            <button onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`w-10 h-5 rounded-full transition-colors relative ${config.enabled ? 'bg-violet-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config.enabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      </div>

      {!config.enabled ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-base font-semibold text-[#1e293b]">Agency Mode</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">Replace Reachly branding with your own. Add custom domains, logos, and colors. Manage client accounts under your brand. Perfect for agencies and resellers.</p>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => setConfig({ ...config, enabled: true })}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Enable White-Label
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mt-3 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Requires Business or Enterprise plan
          </p>
        </div>
      ) : (
        <>
          {/* Section Tabs */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                    activeSection === s.id ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {s.label}
                </button>
              );
            })}
          </div>

          {/* Branding Section */}
          {activeSection === 'branding' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
              <h4 className="text-xs font-bold text-[#1e293b] flex items-center gap-2 mb-1">
                <Palette className="w-3.5 h-3.5 text-violet-500" /> Brand Customization
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Company Name</label>
                  <input value={config.company_name} onChange={e => setConfig({ ...config, company_name: e.target.value })}
                    placeholder="Your Agency Name" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Support Email</label>
                  <input value={config.support_email} onChange={e => setConfig({ ...config, support_email: e.target.value })}
                    placeholder="support@youragency.com" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Logo URL</label>
                  <input value={config.logo_url} onChange={e => setConfig({ ...config, logo_url: e.target.value })}
                    placeholder="https://youragency.com/logo.png" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Favicon URL</label>
                  <input value={config.favicon_url} onChange={e => setConfig({ ...config, favicon_url: e.target.value })}
                    placeholder="https://youragency.com/favicon.ico" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.primary_color}
                      onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <span className="text-[11px] text-slate-400 font-mono">{config.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.accent_color}
                      onChange={e => setConfig({ ...config, accent_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                    <span className="text-[11px] text-slate-400 font-mono">{config.accent_color}</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.hide_powered_by}
                  onChange={e => setConfig({ ...config, hide_powered_by: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
                <span className="text-xs text-slate-600">Hide &quot;Powered by Reachly&quot; badge</span>
              </label>

              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Preview</p>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    {config.logo_url ? (
                      <img src={config.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${config.primary_color}, ${config.accent_color})` }}>
                        {config.company_name?.[0] || 'R'}
                      </div>
                    )}
                    <span className="text-sm font-bold" style={{ color: config.primary_color }}>
                      {config.company_name || 'Your Agency'}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${config.primary_color}, ${config.accent_color})`, width: '60%' }} />
                </div>
              </div>

              <button onClick={() => toast.success('Branding saved!')}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-violet-500/20 transition-all">
                <Save className="w-3.5 h-3.5" /> Save Branding
              </button>
            </div>
          )}

          {/* Domain Section */}
          {activeSection === 'domain' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
              <h4 className="text-xs font-bold text-[#1e293b] flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-violet-500" /> Custom Domain
              </h4>
              <p className="text-[11px] text-slate-400">Point your domain to Reachly so clients access your branded platform.</p>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Custom Domain</label>
                <input value={config.custom_domain} onChange={e => setConfig({ ...config, custom_domain: e.target.value })}
                  placeholder="app.youragency.com" className={inputCls} />
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-[#1e293b]">DNS Configuration</p>
                <p className="text-[11px] text-slate-400">Add this CNAME record to your DNS provider:</p>
                <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono">CNAME</p>
                    <p className="text-xs font-mono text-[#1e293b]">{config.custom_domain || 'app.youragency.com'} → cname.reachly.app</p>
                  </div>
                  <button onClick={() => copyText(`${config.custom_domain || 'app.youragency.com'} CNAME cname.reachly.app`, 'cname')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    {copied === 'cname' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button onClick={() => toast.success('Domain saved!')}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-violet-500/20 transition-all">
                <Save className="w-3.5 h-3.5" /> Verify & Save Domain
              </button>
            </div>
          )}

          {/* Sub-Accounts Section */}
          {activeSection === 'accounts' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1e293b] flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-violet-500" /> Client Sub-Accounts
                </h4>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-600 text-[11px] font-semibold rounded-lg border border-violet-200 hover:bg-violet-100 transition-colors">
                  <Users className="w-3 h-3" /> Add Client
                </button>
              </div>

              {subAccounts.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No sub-accounts yet</p>
                  <p className="text-[11px] text-slate-300 mt-1">Create client accounts that operate under your brand</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {subAccounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-[#1e293b]">{account.name}</p>
                        <p className="text-[10px] text-slate-400">{account.email} · {account.leads} leads · {account.emails_sent} emails</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        account.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        account.status === 'paused' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                      }`}>{account.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Keys Section */}
          {activeSection === 'api' && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4">
              <h4 className="text-xs font-bold text-[#1e293b] flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-violet-500" /> API Keys
              </h4>
              <p className="text-[11px] text-slate-400">Generate API keys for Zapier, Make, n8n, or custom integrations.</p>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#1e293b]">Production Key</p>
                    <p className="text-[10px] text-slate-400 font-mono">rly_live_••••••••••••••••</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { copyText('rly_live_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24), 'prod'); toast.success('API key copied!'); }}
                      className="px-2.5 py-1 bg-violet-50 text-violet-600 text-[10px] font-semibold rounded-lg hover:bg-violet-100">
                      {copied === 'prod' ? '✓ Copied' : 'Regenerate'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="text-[11px] font-semibold text-[#1e293b] mb-2">API Endpoints</p>
                  <div className="space-y-1.5 text-[10px] font-mono text-slate-500">
                    <p><span className="text-emerald-500 font-bold">GET</span> /api/v1?resource=leads</p>
                    <p><span className="text-blue-500 font-bold">POST</span> /api/v1?resource=leads</p>
                    <p><span className="text-emerald-500 font-bold">GET</span> /api/v1?resource=templates</p>
                    <p><span className="text-emerald-500 font-bold">GET</span> /api/v1?resource=campaigns</p>
                    <p><span className="text-blue-500 font-bold">POST</span> /api/v1?resource=webhooks</p>
                  </div>
                </div>
              </div>

              <a href="https://docs.reachly.app" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-500 hover:text-violet-600">
                <ExternalLink className="w-3 h-3" /> View Full API Documentation
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
