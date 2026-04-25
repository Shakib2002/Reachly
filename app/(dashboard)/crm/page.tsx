'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import type { LeadStatus } from '@/types';

const statusColumns: { status: LeadStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'new', label: 'New', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  { status: 'applied', label: 'Applied', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  { status: 'interview', label: 'Interview', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  { status: 'offer', label: 'Offer', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  { status: 'closed', label: 'Closed', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
];

export default function CRMPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Lead CRM</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and track your leads through every stage
          </p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === 'board'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((col) => (
            <div
              key={col.status}
              className="flex-shrink-0 w-72 bg-slate-50/50 rounded-2xl border border-[#e2e8f0]"
            >
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${col.bgColor} ${col.color} border`}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">0</span>
                </div>
                <button className="p-1 hover:bg-slate-200/50 rounded-lg">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Column Body */}
              <div className="px-3 pb-3 min-h-[200px]">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-slate-400">
                    No leads yet
                  </p>
                </div>
              </div>

              {/* Add Card Button */}
              <div className="p-3 border-t border-[#e2e8f0]">
                <button className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add lead
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">No leads yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first lead to start tracking
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
