'use client';

import { useState } from 'react';
import {
  X, Eye, Edit3, Sparkles, Loader2, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TemplateEditorProps {
  template?: { id?: string; name: string; subject: string; body: string } | null;
  onSave: (t: { name: string; subject: string; body: string }) => void;
  onClose: () => void;
}

const VARIABLES = [
  { key: '{{name}}', label: 'Recipient Name' },
  { key: '{{company}}', label: 'Company' },
  { key: '{{position}}', label: 'Position' },
  { key: '{{my_name}}', label: 'My Name' },
  { key: '{{date}}', label: 'Date' },
];

const sampleVars: Record<string, string> = {
  '{{name}}': 'John Smith',
  '{{company}}': 'Acme Inc.',
  '{{position}}': 'Senior Developer',
  '{{my_name}}': 'You',
  '{{date}}': new Date().toLocaleDateString(),
};

export default function TemplateEditor({ template, onSave, onClose }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showAI, setShowAI] = useState(false);
  const [aiPurpose, setAiPurpose] = useState('job-application');
  const [aiTone, setAiTone] = useState('professional');
  const [aiPoints, setAiPoints] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedVar, setCopiedVar] = useState('');

  const preview = (text: string) => {
    let r = text;
    Object.entries(sampleVars).forEach(([k, v]) => {
      r = r.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v);
    });
    return r;
  };

  const insertVariable = (v: string) => {
    setBody((prev) => prev + v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(''), 1500);
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: aiPurpose, tone: aiTone, keyPoints: aiPoints }),
      });
      const data = await res.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      setShowAI(false);
      toast.success('Email generated!');
    } catch { toast.error('Generation failed'); }
    finally { setAiLoading(false); }
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Template name is required'); return; }
    if (!subject.trim()) { toast.error('Subject line is required'); return; }
    onSave({ name, subject, body });
  };

  const selectClass = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#1e293b]">{template?.id ? 'Edit Template' : 'Create Template'}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'preview' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              {mode === 'preview' ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {mode === 'preview' ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Template Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Template Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Job Application"
              className={selectClass} />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Subject Line</label>
            {mode === 'edit' ? (
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..."
                className={selectClass} />
            ) : (
              <div className="px-3 py-2 bg-slate-50 rounded-xl text-sm text-[#1e293b]">{preview(subject) || 'No subject'}</div>
            )}
          </div>

          {/* Variables */}
          {mode === 'edit' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Insert Variable</label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button key={v.key} onClick={() => insertVariable(v.key)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-violet-50 text-violet-600 border border-violet-100 hover:bg-violet-100 transition-colors">
                    {copiedVar === v.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500">Email Body</label>
              {mode === 'edit' && (
                <button onClick={() => setShowAI(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 transition-all shadow-sm">
                  <Sparkles className="w-3 h-3" /> Generate with AI
                </button>
              )}
            </div>
            {mode === 'edit' ? (
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Write your email template..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none font-mono leading-relaxed" />
            ) : (
              <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-[#1e293b] whitespace-pre-wrap leading-relaxed min-h-[200px]">
                {preview(body) || 'No content'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all">
            {template?.id ? 'Update' : 'Save'} Template
          </button>
        </div>

        {/* AI Generate Modal */}
        {showAI && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] rounded-2xl flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" /> AI Email Generator
                </h4>
                <button onClick={() => setShowAI(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Purpose</label>
                <select value={aiPurpose} onChange={(e) => setAiPurpose(e.target.value)} className={selectClass}>
                  <option value="job-application">Job Application</option>
                  <option value="follow-up">Follow Up</option>
                  <option value="introduction">Introduction</option>
                  <option value="thank-you">Thank You</option>
                  <option value="cold-outreach">Cold Outreach</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Tone</label>
                <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className={selectClass}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Key Points (optional)</label>
                <textarea value={aiPoints} onChange={(e) => setAiPoints(e.target.value)} rows={3} placeholder="Mention specific skills, experience..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none" />
              </div>
              <button onClick={handleAIGenerate} disabled={aiLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
