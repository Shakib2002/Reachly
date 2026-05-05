'use client';

import { useState } from 'react';
import { Eye, EyeOff, Shield, Loader2, Check, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();
const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white';
const lbl = 'text-xs font-semibold text-slate-500 mb-1.5 block';

function getStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Very Strong', color: 'bg-blue-500' },
  ];
  return { score, ...map[Math.min(score - 1, 3)] };
}

interface Props {
  userEmail: string;
  memberSince: string;
  plan: string;
}

export default function AccountSettings({ userEmail, memberSince, plan }: Props) {
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = getStrength(newPwd);

  const reqs = [
    { label: 'At least 8 characters', ok: newPwd.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(newPwd) },
    { label: 'One number', ok: /[0-9]/.test(newPwd) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(newPwd) },
  ];

  const updatePassword = async () => {
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPwd !== confPwd) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) toast.error(error.message);
    else { toast.success('Password updated successfully'); setCurPwd(''); setNewPwd(''); setConfPwd(''); }
    setSaving(false);
  };

  const copyUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { await navigator.clipboard.writeText(user.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const card = 'bg-white rounded-2xl border border-[#e2e8f0] p-6';

  return (
    <div className="space-y-5">
      {/* Change Password */}
      <div className={card}>
        <h2 className="text-base font-bold text-[#1e293b] mb-4">Change Password</h2>
        <div className="space-y-4 max-w-md">
          {/* Current */}
          <div>
            <label className={lbl}>Current Password</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} value={curPwd} onChange={e => setCurPwd(e.target.value)} className={inp + ' pr-10'} placeholder="••••••••" />
              <button type="button" onClick={() => setShowCur(!showCur)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showCur ? 'Hide current password' : 'Show current password'}>
                {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New */}
          <div>
            <label className={lbl}>New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} className={inp + ' pr-10'} placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showNew ? 'Hide new password' : 'Show new password'}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPwd && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  {strength.label && <span className="text-[11px] font-semibold text-slate-500">{strength.label}</span>}
                </div>
                <div className="space-y-1">
                  {reqs.map(r => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      {r.ok ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                      <span className={`text-[11px] ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className={lbl}>Confirm Password</label>
            <div className="relative">
              <input type={showConf ? 'text' : 'password'} value={confPwd} onChange={e => setConfPwd(e.target.value)} className={inp + ' pr-10'} placeholder="••••••••" />
              <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showConf ? 'Hide confirm password' : 'Show confirm password'}>
                {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confPwd && newPwd !== confPwd && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            onClick={updatePassword}
            disabled={saving || !newPwd || !confPwd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className={card}>
        <h2 className="text-base font-bold text-[#1e293b] mb-4">Account Info</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
            <span className="text-sm text-slate-500">Email address</span>
            <span className="text-sm font-medium text-[#1e293b]">{userEmail}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
            <span className="text-sm text-slate-500">Member since</span>
            <span className="text-sm font-medium text-[#1e293b]">{memberSince}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
            <span className="text-sm text-slate-500">Current plan</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${plan === 'pro' ? 'bg-blue-50 text-blue-600' : plan === 'team' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
              {plan}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-500">Account ID</span>
            <button
              onClick={copyUserId}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-blue-500 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : null}
              {copied ? 'Copied!' : 'Click to copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
