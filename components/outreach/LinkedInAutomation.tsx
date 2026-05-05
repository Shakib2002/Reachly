'use client';

import { useState } from 'react';
import {
  Users, MessageSquare, Eye, UserPlus, Play, Pause,
  Plus, Trash2, Clock, ArrowRight, CheckCircle2,
  Settings, Shield, Link,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LinkedInStep {
  id: string;
  type: 'profile_visit' | 'connect' | 'message' | 'follow' | 'endorse';
  delay_days: number;
  delay_hours: number;
  message?: string;
  note?: string;
}

interface LinkedInSequence {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused';
  steps: LinkedInStep[];
  enrolled: number;
  completed: number;
}

const STEP_TYPES = [
  { id: 'profile_visit' as const, label: 'Profile Visit', icon: Eye, desc: 'View their profile — they get notified', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'connect' as const, label: 'Connection Request', icon: UserPlus, desc: 'Send invite with optional note (300 chars)', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'message' as const, label: 'Direct Message', icon: MessageSquare, desc: 'Send InMail or message (must be connected)', color: 'text-violet-500', bg: 'bg-violet-50' },
  { id: 'follow' as const, label: 'Follow', icon: Users, desc: 'Follow their profile for updates', color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'endorse' as const, label: 'Endorse Skills', icon: CheckCircle2, desc: 'Endorse their top skills', color: 'text-cyan-500', bg: 'bg-cyan-50' },
];

export default function LinkedInAutomation() {
  const [sequences, setSequences] = useState<LinkedInSequence[]>([]);
  const [editing, setEditing] = useState<LinkedInSequence | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const createNew = () => {
    const seq: LinkedInSequence = {
      id: `li-${Date.now()}`,
      name: '',
      status: 'draft',
      steps: [
        { id: `s-${Date.now()}`, type: 'profile_visit', delay_days: 0, delay_hours: 0 },
      ],
      enrolled: 0,
      completed: 0,
    };
    setEditing(seq);
    setShowBuilder(true);
  };

  const addStep = () => {
    if (!editing || editing.steps.length >= 8) return;
    setEditing({
      ...editing,
      steps: [...editing.steps, { id: `s-${Date.now()}`, type: 'profile_visit', delay_days: 1, delay_hours: 0 }],
    });
  };

  const updateStep = (idx: number, updates: Partial<LinkedInStep>) => {
    if (!editing) return;
    const steps = [...editing.steps];
    steps[idx] = { ...steps[idx], ...updates };
    setEditing({ ...editing, steps });
  };

  const removeStep = (idx: number) => {
    if (!editing || editing.steps.length <= 1) return;
    setEditing({ ...editing, steps: editing.steps.filter((_, i) => i !== idx) });
  };

  const saveSequence = () => {
    if (!editing || !editing.name.trim()) { toast.error('Name required'); return; }
    setSequences(prev => {
      const exists = prev.find(s => s.id === editing.id);
      if (exists) return prev.map(s => s.id === editing.id ? editing : s);
      return [...prev, editing];
    });
    setShowBuilder(false);
    setEditing(null);
    toast.success('LinkedIn sequence saved!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
            <Link className="w-4 h-4 text-[#0077B5]" /> LinkedIn Automation
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Automate profile visits, connection requests, and DMs</p>
        </div>
        <button onClick={createNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0077B5] to-[#0a66c2] text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all">
          <Plus className="w-3.5 h-3.5" /> New Sequence
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-800 mb-1">LinkedIn Safety Limits</h4>
            <ul className="space-y-0.5 text-[11px] text-amber-700">
              <li>• Max <strong>100 connection requests/week</strong> for new accounts</li>
              <li>• Max <strong>150 profile visits/day</strong> to avoid flags</li>
              <li>• Always <strong>personalize</strong> connection notes — generic invites get flagged</li>
              <li>• Use <strong>random delays</strong> between actions (2-5 min) to mimic human behavior</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sequence Builder Modal */}
      {showBuilder && editing && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1e293b]">
              {editing.steps.length > 0 ? 'Build Sequence' : 'New Sequence'}
            </h4>
            <button onClick={() => { setShowBuilder(false); setEditing(null); }}
              className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>

          <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
            placeholder="Sequence name (e.g. 'SaaS Founders Outreach')"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />

          {/* Steps */}
          <div className="space-y-3">
            {editing.steps.map((step, idx) => {
              const stepType = STEP_TYPES.find(s => s.id === step.type)!;
              const Icon = stepType.icon;
              return (
                <div key={step.id}>
                  {idx > 0 && (
                    <div className="flex items-center gap-2 ml-8 my-2">
                      <div className="w-px h-4 bg-slate-200" />
                      <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <input type="number" min={0} max={30} value={step.delay_days}
                          onChange={e => updateStep(idx, { delay_days: parseInt(e.target.value) || 0 })}
                          className="w-10 text-center text-[11px] font-semibold text-[#1e293b] border border-slate-200 rounded px-1 py-0.5" />
                        <span className="text-[10px] text-slate-400">days</span>
                        <input type="number" min={0} max={23} value={step.delay_hours}
                          onChange={e => updateStep(idx, { delay_hours: parseInt(e.target.value) || 0 })}
                          className="w-10 text-center text-[11px] font-semibold text-[#1e293b] border border-slate-200 rounded px-1 py-0.5" />
                        <span className="text-[10px] text-slate-400">hrs</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                  <div className={`rounded-xl border border-slate-200 p-4 ${stepType.bg}/30`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                        <select value={step.type} onChange={e => updateStep(idx, { type: e.target.value as LinkedInStep['type'] })}
                          className="text-xs font-semibold text-[#1e293b] bg-transparent border-none focus:outline-none cursor-pointer">
                          {STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => removeStep(idx)} className="text-slate-300 hover:text-red-400" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${stepType.color}`} /> {stepType.desc}
                    </p>
                    {(step.type === 'connect') && (
                      <textarea value={step.note || ''} onChange={e => updateStep(idx, { note: e.target.value.slice(0, 300) })}
                        placeholder="Connection note (optional, 300 chars max)..."
                        rows={2} maxLength={300}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none" />
                    )}
                    {step.type === 'message' && (
                      <textarea value={step.message || ''} onChange={e => updateStep(idx, { message: e.target.value })}
                        placeholder="Hi {{first_name}}, I noticed you're {{position}} at {{company}}..."
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={addStep} disabled={editing.steps.length >= 8}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 hover:text-blue-600 disabled:text-slate-300">
              <Plus className="w-3.5 h-3.5" /> Add Step ({editing.steps.length}/8)
            </button>
            <button onClick={saveSequence}
              className="px-5 py-2 bg-gradient-to-r from-[#0077B5] to-[#0a66c2] text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all">
              Save Sequence
            </button>
          </div>
        </div>
      )}

      {/* Sequence List */}
      {sequences.length > 0 ? (
        <div className="space-y-3">
          {sequences.map(seq => (
            <div key={seq.id} className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-[#0077B5]" />
                  <h4 className="text-sm font-semibold text-[#1e293b]">{seq.name}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    seq.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    seq.status === 'paused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  }`}>{seq.status}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{seq.steps.length} steps · {seq.enrolled} enrolled · {seq.completed} completed</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditing(seq); setShowBuilder(true); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500">
                  {seq.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showBuilder && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0077B5]/10 to-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Link className="w-8 h-8 text-[#0077B5]/50" />
          </div>
          <h3 className="text-base font-semibold text-[#1e293b]">LinkedIn Automation</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Create multi-step LinkedIn sequences: profile visits → connection requests → DMs. Combine with email for true multichannel outreach.</p>
          <button onClick={createNew} className="mt-4 px-4 py-2 bg-[#0077B5]/10 text-[#0077B5] rounded-xl text-sm font-semibold border border-[#0077B5]/20 flex items-center gap-2">
            <Link className="w-3.5 h-3.5" /> Create First Sequence
          </button>
        </div>
      )}
    </div>
  );
}
