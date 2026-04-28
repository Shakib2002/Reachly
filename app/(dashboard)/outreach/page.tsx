'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useLeadStore } from '@/lib/store';
import TemplateEditor from '@/components/outreach/TemplateEditor';
import toast from 'react-hot-toast';
import {
  Plus, Send, FileText, Mail, Loader2, Trash2, Pencil, Clock,
  CheckCircle2, XCircle, Users, Search, ChevronDown, Sparkles, X,
} from 'lucide-react';
import type { Lead } from '@/types';

interface Template { id: string; name: string; subject: string; body: string; created_at: string; usage_count?: number; }
interface SentEmail { id: string; to_email: string; to_name: string; company: string; subject: string; template_name: string; sent_at: string; status: string; }

const supabase = createBrowserSupabaseClient();

export default function OutreachPage() {
  const { leads, fetchLeads } = useLeadStore();
  const [tab, setTab] = useState<'templates' | 'compose' | 'campaigns'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Compose state
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [toCompany, setToCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    setTemplates((data || []) as Template[]);
  }, []);

  const fetchSentEmails = useCallback(async () => {
    const { data } = await supabase.from('emails_sent').select('*').order('sent_at', { ascending: false }).limit(50);
    setSentEmails((data || []) as SentEmail[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchSentEmails(), fetchLeads()]).finally(() => setLoading(false));
  }, [fetchTemplates, fetchSentEmails, fetchLeads]);

  const handleSaveTemplate = async (t: { name: string; subject: string; body: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Not authenticated'); return; }
    if (editingTemplate?.id) {
      await supabase.from('templates').update({ name: t.name, subject: t.subject, body: t.body }).eq('id', editingTemplate.id);
      toast.success('Template updated');
    } else {
      await supabase.from('templates').insert({ ...t, user_id: user.id });
      toast.success('Template created');
    }
    setEditorOpen(false); setEditingTemplate(null); fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('templates').delete().eq('id', id);
    toast.success('Template deleted'); fetchTemplates();
  };

  const applyTemplate = (t: Template) => {
    setSelectedTemplate(t.id); setSubject(t.subject); setBody(t.body); setTab('compose');
  };

  const selectLead = (lead: Lead) => {
    setToEmail(lead.email || ''); setToName(lead.title || ''); setToCompany(lead.company || '');
    setLeadSearch(''); setShowLeadDropdown(false);
  };

  const replaceVars = (text: string) => {
    return text.replace(/\{\{name\}\}/g, toName || 'there').replace(/\{\{company\}\}/g, toCompany || 'your company')
      .replace(/\{\{position\}\}/g, toName || 'the role').replace(/\{\{my_name\}\}/g, 'User')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
  };

  const handleSendEmail = async () => {
    if (!toEmail) { toast.error('Recipient email required'); return; }
    if (!subject) { toast.error('Subject required'); return; }
    if (!body) { toast.error('Email body required'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toEmail, subject, body, variables: { name: toName, company: toCompany, position: toName, my_name: 'User', date: new Date().toLocaleDateString() } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('emails_sent').insert({
          user_id: user.id, to_email: toEmail, to_name: toName, company: toCompany,
          subject: replaceVars(subject), template_name: templates.find(t => t.id === selectedTemplate)?.name || 'Custom',
          status: 'sent', sent_at: new Date().toISOString(),
        });
      }
      toast.success('Email sent!');
      setToEmail(''); setToName(''); setToCompany(''); setSubject(''); setBody(''); setSelectedTemplate('');
      fetchSentEmails();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  const filteredLeads = leads.filter(l => (l.title?.toLowerCase().includes(leadSearch.toLowerCase()) || l.company?.toLowerCase().includes(leadSearch.toLowerCase()) || l.email?.toLowerCase().includes(leadSearch.toLowerCase())) && l.email);
  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  const tabs = [
    { id: 'templates' as const, label: 'Templates', icon: FileText, count: templates.length },
    { id: 'compose' as const, label: 'Compose', icon: Send },
    { id: 'campaigns' as const, label: 'Sent Emails', icon: CheckCircle2, count: sentEmails.length },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5"><Mail className="w-6 h-6 text-blue-500" /> Email Outreach</h1>
          <p className="text-slate-400 text-sm mt-1">Compose, manage templates, and track emails</p>
        </div>
        <button onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-1.5 flex gap-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
            {t.count !== undefined && t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div>{loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"><div className="h-4 bg-slate-200 rounded w-1/2 mb-3"/><div className="h-3 bg-slate-100 rounded w-3/4 mb-2"/><div className="h-3 bg-slate-100 rounded w-1/3"/></div>)}</div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-blue-400" /></div>
            <h3 className="text-lg font-semibold text-[#1e293b]">No templates yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Create reusable email templates to speed up your outreach</p>
            <button onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}
              className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25">
              <Plus className="w-4 h-4" /> Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#1e293b] truncate">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 truncate"><span className="font-medium text-slate-500">Subject:</span> {t.subject}</p>
                    <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTemplate(t); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => applyTemplate(t)}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                    <Send className="w-3 h-3" /> Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}</div>
      )}

      {/* Compose Tab */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2"><Send className="w-4 h-4 text-blue-500" /> Compose Email</h3>

            {/* Recipient */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Recipient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={leadSearch || toEmail} onChange={(e) => { setLeadSearch(e.target.value); setToEmail(e.target.value); setShowLeadDropdown(true); }}
                  onFocus={() => setShowLeadDropdown(true)} placeholder="Search CRM leads or type email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                {showLeadDropdown && filteredLeads.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredLeads.slice(0, 5).map((l) => (
                      <button key={l.id} onClick={() => selectLead(l)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">{(l.title?.[0] || 'L').toUpperCase()}</div>
                        <div className="min-w-0"><p className="text-xs font-semibold text-[#1e293b] truncate">{l.title}</p><p className="text-[11px] text-slate-400 truncate">{l.company} · {l.email}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {toName && <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-blue-50 rounded-lg text-xs text-blue-600 font-medium"><Users className="w-3 h-3" />{toName} at {toCompany}<button onClick={() => { setToEmail(''); setToName(''); setToCompany(''); }} className="ml-auto"><X className="w-3 h-3" /></button></div>}
            </div>

            {/* Template Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Template</label>
              <div className="relative">
                <select value={selectedTemplate} onChange={(e) => { const t = templates.find(tp => tp.id === e.target.value); if (t) { setSubject(t.subject); setBody(t.body); } setSelectedTemplate(e.target.value); }}
                  className={inputCls + ' appearance-none'}>
                  <option value="">Custom Email</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..." className={inputCls} />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Write your message... Use {{name}}, {{company}}, etc."
                className={inputCls + ' resize-none font-mono leading-relaxed'} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => { setEditingTemplate(null); setEditorOpen(true); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-500" /> AI Generate</button>
              <button onClick={handleSendEmail} disabled={sending}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Email
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Preview</h3>
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">To: <span className="text-[#1e293b] font-medium">{toEmail || 'recipient@email.com'}</span></div>
              <div className="text-[11px] text-slate-400">Subject: <span className="text-[#1e293b] font-medium">{replaceVars(subject) || 'No subject'}</span></div>
              <div className="border-t border-slate-100 pt-3">
                <div className="text-sm text-[#1e293b] whitespace-pre-wrap leading-relaxed">{replaceVars(body) || 'Your email preview will appear here...'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns/Sent Tab */}
      {tab === 'campaigns' && (
        <div>{sentEmails.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4"><Mail className="w-8 h-8 text-blue-400" /></div>
            <h3 className="text-lg font-semibold text-[#1e293b]">No emails sent yet</h3>
            <p className="text-sm text-slate-400 mt-1">Sent emails will appear here with delivery tracking</p>
            <button onClick={() => setTab('compose')} className="mt-4 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200 flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Compose Email</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recipient</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Subject</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Template</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr></thead>
                <tbody>
                  {sentEmails.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3"><p className="text-xs font-semibold text-[#1e293b]">{e.to_name || e.to_email}</p><p className="text-[11px] text-slate-400">{e.company || e.to_email}</p></td>
                      <td className="px-5 py-3 text-xs text-slate-600 max-w-[200px] truncate">{e.subject}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold">{e.template_name}</span></td>
                      <td className="px-5 py-3 text-[11px] text-slate-400">{new Date(e.sent_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : e.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                          {e.status === 'sent' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}</div>
      )}

      {/* Template Editor Modal */}
      {editorOpen && <TemplateEditor template={editingTemplate} onSave={handleSaveTemplate} onClose={() => { setEditorOpen(false); setEditingTemplate(null); }} />}
    </div>
  );
}
