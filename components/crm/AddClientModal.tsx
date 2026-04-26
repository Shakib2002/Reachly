'use client';

import { useState } from 'react';
import { X, Loader2, Building2, User, Mail, Phone, FileText, DollarSign, Globe, Flag } from 'lucide-react';
import { useClientStore } from '@/lib/clientStore';
import toast from 'react-hot-toast';

const PROJECT_TYPES = ['Web Development', 'Mobile App', 'UI/UX Design', 'Digital Marketing', 'Content Writing', 'SEO', 'Video Editing', 'Other'];
const BUDGET_RANGES = ['Under $500', '$500 - $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+', 'Custom'];
const SOURCES = ['Upwork', 'Fiverr', 'LinkedIn', 'Referral', 'Cold Email', 'Cold Call', 'Website', 'Facebook', 'Other'];

export default function AddClientModal({ onClose }: { onClose: () => void }) {
  const { addClient } = useClientStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: '', contact_person: '', email: '', phone: '',
    project_type: '', budget_range: '', description: '', source: 'Upwork',
    priority: 'medium' as 'low' | 'medium' | 'high',
    customBudget: '',
  });

  const handleSubmit = async () => {
    if (!form.client_name.trim()) { toast.error('Client name is required'); return; }
    setSaving(true);
    await addClient({
      client_name: form.client_name,
      contact_person: form.contact_person || null,
      email: form.email || null,
      phone: form.phone || null,
      project_type: form.project_type || null,
      budget_range: form.budget_range === 'Custom' ? form.customBudget : form.budget_range || null,
      description: form.description || null,
      source: form.source || null,
      priority: form.priority,
      status: 'lead',
    });
    setSaving(false);
    onClose();
  };

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const label = 'text-xs font-semibold text-slate-500 mb-1.5 block';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">Add New Client</h2>
            <p className="text-xs text-slate-400">Fill in the details to track a new client opportunity</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Client Name */}
          <div>
            <label className={label}>Client / Company Name <span className="text-red-400">*</span></label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} className={inp + ' pl-10'} placeholder="Acme Corp" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Contact Person</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className={inp + ' pl-10'} placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className={label}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inp + ' pl-10'} placeholder="john@acme.com" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inp + ' pl-10'} placeholder="+1234567890" />
              </div>
            </div>
            <div>
              <label className={label}>Source</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={inp + ' pl-10 appearance-none'}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Project Type</label>
              <select value={form.project_type} onChange={e => setForm(p => ({ ...p, project_type: e.target.value }))} className={inp + ' appearance-none'}>
                <option value="">Select...</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Budget Range</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={form.budget_range} onChange={e => setForm(p => ({ ...p, budget_range: e.target.value }))} className={inp + ' pl-10 appearance-none'}>
                  <option value="">Select...</option>
                  {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {form.budget_range === 'Custom' && (
            <div>
              <label className={label}>Custom Budget</label>
              <input value={form.customBudget} onChange={e => setForm(p => ({ ...p, customBudget: e.target.value }))} className={inp} placeholder="e.g. $3,500/month" />
            </div>
          )}

          <div>
            <label className={label}>Project Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inp + ' pl-10 resize-none'} rows={2} placeholder="Brief project description..." />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className={label}><Flag className="w-3 h-3 inline mr-1" />Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                    form.priority === p
                      ? p === 'high' ? 'bg-red-50 text-red-600 border-red-200' : p === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                  }`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />} Save Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
