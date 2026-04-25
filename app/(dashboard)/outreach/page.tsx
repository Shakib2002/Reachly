'use client';

import { useState } from 'react';
import {
  Plus,
  Send,
  FileText,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'sent'>('compose');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Email Outreach</h1>
          <p className="text-slate-500 text-sm mt-1">
            Compose, manage templates, and track your outreach emails
          </p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-1.5 flex gap-1 w-fit">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'sent', label: 'Sent', icon: CheckCircle2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'compose' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <input
                type="text"
                placeholder="Email subject..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea
                rows={8}
                placeholder="Write your message..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Use Template
              </button>
              <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#1e293b]">No templates yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Create reusable email templates to speed up your outreach workflow
          </p>
          <button className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#1e293b]">No emails sent</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Your sent emails will appear here with delivery status tracking
          </p>
        </div>
      )}
    </div>
  );
}
