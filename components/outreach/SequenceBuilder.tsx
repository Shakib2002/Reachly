'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ArrowDown, Clock, Mail, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

interface Step {
  delay_days: number;
  delay_hours: number;
  subject: string;
  body: string;
  condition: 'always' | 'if_opened' | 'if_not_opened' | 'if_clicked' | 'if_not_clicked';
}

interface SequenceBuilderProps {
  onClose: () => void;
  onSaved: () => void;
}

const supabase = createBrowserSupabaseClient();

const CONDITIONS = [
  { value: 'always', label: 'Always send' },
  { value: 'if_opened', label: 'If previous was opened' },
  { value: 'if_not_opened', label: 'If previous was NOT opened' },
  { value: 'if_clicked', label: 'If previous was clicked' },
  { value: 'if_not_clicked', label: 'If previous was NOT clicked' },
];

export default function SequenceBuilder({ onClose, onSaved }: SequenceBuilderProps) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { delay_days: 0, delay_hours: 0, subject: '', body: '', condition: 'always' },
  ]);
  const [saving, setSaving] = useState(false);

  const addStep = (afterIdx: number) => {
    if (steps.length >= 10) { toast.error('Max 10 steps per sequence'); return; }
    const newStep: Step = { delay_days: 3, delay_hours: 0, subject: '', body: '', condition: 'always' };
    const updated = [...steps];
    updated.splice(afterIdx + 1, 0, newStep);
    setSteps(updated);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) { toast.error('Need at least 1 step'); return; }
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof Step, value: string | number) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Sequence name required'); return; }
    if (steps.some(s => !s.subject.trim() || !s.body.trim())) {
      toast.error('All steps need subject and body'); return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: seq, error: seqErr } = await supabase
        .from('sequences')
        .insert({ user_id: user.id, name: name.trim(), status: 'draft' })
        .select('id')
        .single();

      if (seqErr) throw seqErr;

      const stepRows = steps.map((s, i) => ({
        sequence_id: seq.id,
        step_order: i + 1,
        delay_days: s.delay_days,
        delay_hours: s.delay_hours,
        subject: s.subject,
        body: s.body,
        condition: s.condition,
      }));

      const { error: stepErr } = await supabase.from('sequence_steps').insert(stepRows);
      if (stepErr) throw stepErr;

      toast.success('Sequence created!');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create sequence');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[3vh] overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl" role="dialog" aria-modal="true" aria-label="Sequence Builder">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Build Email Sequence
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Sequence Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sequence Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cold outreach — 5 step drip" className={inputCls} />
          </div>

          {/* Steps — Visual Flow */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i}>
                {/* Delay Indicator (between steps) */}
                {i > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-700">
                        Wait {step.delay_days}d {step.delay_hours}h
                      </span>
                    </div>
                  </div>
                )}

                {/* Step Card */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 relative group bg-white hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-[#1e293b]">Step {i + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {steps.length > 1 && (
                        <button onClick={() => removeStep(i)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" aria-label={`Remove step ${i + 1}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delay + Condition (for steps after first) */}
                  {i > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Days</label>
                        <input type="number" value={step.delay_days} onChange={(e) => updateStep(i, 'delay_days', parseInt(e.target.value) || 0)} min={0} max={30} className={inputCls + ' text-center'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Hours</label>
                        <input type="number" value={step.delay_hours} onChange={(e) => updateStep(i, 'delay_hours', parseInt(e.target.value) || 0)} min={0} max={23} className={inputCls + ' text-center'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Condition</label>
                        <select value={step.condition} onChange={(e) => updateStep(i, 'condition', e.target.value)} className={inputCls + ' appearance-none text-[11px]'} aria-label={`Step ${i + 1} condition`}>
                          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <input value={step.subject} onChange={(e) => updateStep(i, 'subject', e.target.value)}
                    placeholder="Subject line..." className={inputCls} />
                  <textarea value={step.body} onChange={(e) => updateStep(i, 'body', e.target.value)}
                    rows={3} placeholder="Email body... Use {{name}}, {{company}}, etc."
                    className={inputCls + ' resize-none font-mono text-xs leading-relaxed'} />
                </div>

                {/* Add Step Button */}
                <div className="flex justify-center py-1">
                  <button onClick={() => addStep(i)} className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200" aria-label="Add step">
                    <ArrowDown className="w-3 h-3" />
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            {steps.length} step{steps.length > 1 ? 's' : ''} · Total duration: ~{steps.reduce((a, s) => a + s.delay_days, 0)} days
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Create Sequence
          </button>
        </div>
      </div>
    </div>
  );
}
