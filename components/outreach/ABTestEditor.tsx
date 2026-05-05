'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Trophy, Loader2, Beaker } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

interface Variant {
  name: string;
  subject: string;
  body: string;
}

interface ABTestEditorProps {
  onClose: () => void;
  onSaved: () => void;
}

const supabase = createBrowserSupabaseClient();

export default function ABTestEditor({ onClose, onSaved }: ABTestEditorProps) {
  const [name, setName] = useState('');
  const [winningMetric, setWinningMetric] = useState<'open_rate' | 'click_rate'>('open_rate');
  const [threshold, setThreshold] = useState(50);
  const [variants, setVariants] = useState<Variant[]>([
    { name: 'Variant A', subject: '', body: '' },
    { name: 'Variant B', subject: '', body: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const addVariant = () => {
    if (variants.length >= 4) { toast.error('Max 4 variants'); return; }
    const letter = String.fromCharCode(65 + variants.length);
    setVariants([...variants, { name: `Variant ${letter}`, subject: '', body: '' }]);
  };

  const removeVariant = (idx: number) => {
    if (variants.length <= 2) { toast.error('Minimum 2 variants required'); return; }
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, field: keyof Variant, value: string) => {
    setVariants(variants.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Test name required'); return; }
    if (variants.some(v => !v.subject.trim() || !v.body.trim())) {
      toast.error('All variants need subject and body'); return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: test, error: testErr } = await supabase
        .from('ab_tests')
        .insert({
          user_id: user.id,
          name: name.trim(),
          winning_metric: winningMetric,
          auto_winner_threshold: threshold,
          status: 'active',
        })
        .select('id')
        .single();

      if (testErr) throw testErr;

      const variantRows = variants.map(v => ({
        ab_test_id: test.id,
        name: v.name,
        subject: v.subject,
        body: v.body,
        send_count: 0,
        open_count: 0,
        click_count: 0,
      }));

      const { error: varErr } = await supabase.from('ab_variants').insert(variantRows);
      if (varErr) throw varErr;

      toast.success('A/B test created!');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create test');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl" role="dialog" aria-modal="true" aria-label="Create A/B Test">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
            <Beaker className="w-5 h-5 text-violet-500" /> Create A/B Test
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Test Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Test Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Subject line test — Q2 outreach" className={inputCls} />
          </div>

          {/* Winning Metric + Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Winning Metric</label>
              <select value={winningMetric} onChange={(e) => setWinningMetric(e.target.value as 'open_rate' | 'click_rate')} className={inputCls + ' appearance-none'} aria-label="Winning metric">
                <option value="open_rate">Open Rate</option>
                <option value="click_rate">Click Rate</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Auto-winner after (sends)</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value) || 10)} min={10} max={500} className={inputCls} />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500">Variants ({variants.length}/4)</label>
              <button onClick={addVariant} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                <Plus className="w-3 h-3" /> Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <input value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)}
                      className="text-sm font-bold text-[#1e293b] bg-transparent border-none focus:outline-none w-32" />
                    {variants.length > 2 && (
                      <button onClick={() => removeVariant(i)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" aria-label={`Remove ${v.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input value={v.subject} onChange={(e) => updateVariant(i, 'subject', e.target.value)}
                    placeholder="Subject line..." className={inputCls} />
                  <textarea value={v.body} onChange={(e) => updateVariant(i, 'body', e.target.value)}
                    rows={4} placeholder="Email body... Use {{name}}, {{company}}, etc."
                    className={inputCls + ' resize-none font-mono text-xs leading-relaxed'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />} Create A/B Test
          </button>
        </div>
      </div>
    </div>
  );
}
