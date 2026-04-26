'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '@/lib/store';
import { useClientStore } from '@/lib/clientStore';
import KanbanBoard from '@/components/crm/KanbanBoard';
import ClientKanban from '@/components/crm/ClientKanban';
import LeadModal from '@/components/crm/LeadModal';
import ClientModal from '@/components/crm/ClientModal';
import {
  Plus, Search, SlidersHorizontal, ArrowDownAZ, Users, Kanban, List, Briefcase, Building2,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Lead, LeadStatus, ClientLead, ClientLeadStatus } from '@/types';

type CRMMode = 'job' | 'client';

const statusBadge: Record<LeadStatus, string> = {
  new: 'bg-blue-50 text-blue-600 border-blue-100',
  applied: 'bg-amber-50 text-amber-600 border-amber-100',
  interview: 'bg-purple-50 text-purple-600 border-purple-100',
  offer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  closed: 'bg-slate-50 text-slate-500 border-slate-200',
};

const clientStatusBadge: Record<ClientLeadStatus, string> = {
  lead: 'bg-blue-50 text-blue-600 border-blue-100',
  contacted: 'bg-amber-50 text-amber-600 border-amber-100',
  proposal: 'bg-purple-50 text-purple-600 border-purple-100',
  negotiation: 'bg-orange-50 text-orange-600 border-orange-100',
  won: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  lost: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function CRMPage() {
  const {
    leads, loading, fetchLeads, subscribeToChanges, setAddLeadModalOpen, deleteLead,
  } = useLeadStore();

  const {
    clients, loading: clientLoading, fetchClients, subscribeToChanges: subClients,
    setAddModalOpen: setClientModalOpen, deleteClient,
  } = useClientStore();

  const [mode, setMode] = useState<CRMMode>('job');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientLead | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  // Load saved mode
  useEffect(() => {
    const saved = localStorage.getItem('reachly_crm_mode') as CRMMode;
    if (saved === 'job' || saved === 'client') setMode(saved);
  }, []);

  // Save mode
  useEffect(() => {
    localStorage.setItem('reachly_crm_mode', mode);
  }, [mode]);

  // Fetch data
  useEffect(() => {
    fetchLeads();
    fetchClients();
    const unsub1 = subscribeToChanges();
    const unsub2 = subClients();
    return () => { unsub1(); unsub2(); };
  }, [fetchLeads, fetchClients, subscribeToChanges, subClients]);

  // Filtered job leads for list
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'company': result.sort((a, b) => (a.company || '').localeCompare(b.company || '')); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [leads, searchQuery, sortBy]);

  // Filtered clients for list
  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.client_name?.toLowerCase().includes(q) || c.contact_person?.toLowerCase().includes(q) ||
        c.project_type?.toLowerCase().includes(q) || c.source?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'company': result.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [clients, searchQuery, sortBy]);

  const handleAddToJobColumn = (_status: LeadStatus) => setAddLeadModalOpen(true);
  const handleAddToClientColumn = (_status: ClientLeadStatus) => setClientModalOpen(true);
  const handleEditLead = (lead: Lead) => setSelectedLead(lead);
  const handleEditClient = (client: ClientLead) => setSelectedClient(client);
  const handleDeleteLead = (id: string) => { if (window.confirm('Delete this lead?')) deleteLead(id); };
  const handleDeleteClient = (id: string) => { if (window.confirm('Delete this client?')) deleteClient(id); };

  const isJobMode = mode === 'job';
  const totalCount = isJobMode ? leads.length : clients.length;
  const isLoading = isJobMode ? loading : clientLoading;

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] flex items-center gap-2.5">
            <Kanban className="w-6 h-6 text-blue-500" />CRM Pipeline
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalCount} total {isJobMode ? 'lead' : 'client'}{totalCount !== 1 ? 's' : ''} across all stages
          </p>
        </div>
        <button
          onClick={() => isJobMode ? setAddLeadModalOpen(true) : setClientModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />Add {isJobMode ? 'Lead' : 'Client'}
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-1.5 flex gap-1.5 w-fit">
        <button onClick={() => setMode('job')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isJobMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Briefcase className="w-4 h-4" />Job Pipeline
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${isJobMode ? 'bg-white/20' : 'bg-slate-100'}`}>
            {leads.length}
          </span>
        </button>
        <button onClick={() => setMode('client')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            !isJobMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:bg-slate-50'
          }`}>
          <Building2 className="w-4 h-4" />Client Pipeline
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${!isJobMode ? 'bg-white/20' : 'bg-slate-100'}`}>
            {clients.length}
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={isJobMode ? 'Search by position, company, source...' : 'Search by client, contact, project...'}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setSortOpen(!sortOpen)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <ArrowDownAZ className="w-4 h-4" />
              <span className="hidden sm:inline">{sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Name A-Z'}</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                {[{ value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' }, { value: 'company', label: 'Name A-Z' }].map(opt => (
                  <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${sortBy === opt.value ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-600'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Filter</span>
          </button>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setView('board')}
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'board' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Kanban className="w-3.5 h-3.5" /><span className="hidden sm:inline">Board</span>
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-3.5 h-3.5" /><span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Board / List View */}
      {view === 'board' ? (
        isJobMode ? (
          <KanbanBoard searchQuery={searchQuery} sortBy={sortBy} onCardClick={setSelectedLead} onEditCard={handleEditLead} onAddToColumn={handleAddToJobColumn} />
        ) : (
          <ClientKanban searchQuery={searchQuery} sortBy={sortBy} onCardClick={setSelectedClient} onEditCard={handleEditClient} onAddToColumn={handleAddToClientColumn} />
        )
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 bg-slate-200/70 rounded-lg" />
                  <div className="flex-1 h-4 bg-slate-200/70 rounded" />
                  <div className="w-20 h-4 bg-slate-100 rounded" />
                  <div className="w-16 h-5 bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
          ) : isJobMode ? (
            /* Job List */
            filteredLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Position</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Source</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Added</th>
                      <th className="px-5 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                              {lead.title?.[0]?.toUpperCase() || 'L'}
                            </div>
                            <span className="text-sm font-semibold text-[#1e293b] truncate max-w-[200px]">{lead.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{lead.company || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${statusBadge[lead.status]}`}>{lead.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-400 hidden md:table-cell">{lead.source || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400 hidden sm:table-cell">{formatRelativeTime(lead.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={e => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Users className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">{searchQuery ? 'No leads match' : 'No leads yet'}</p>
                {!searchQuery && (
                  <button onClick={() => setAddLeadModalOpen(true)}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />Add First Lead
                  </button>
                )}
              </div>
            )
          ) : (
            /* Client List */
            filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100 bg-slate-50/50">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Budget</th>
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Added</th>
                      <th className="px-5 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(client => (
                      <tr key={client.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelectedClient(client)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-purple-600 text-xs font-bold flex-shrink-0">
                              {client.client_name?.[0]?.toUpperCase() || 'C'}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-[#1e293b] truncate block max-w-[180px]">{client.client_name}</span>
                              {client.contact_person && <span className="text-[11px] text-slate-400">{client.contact_person}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{client.project_type || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${clientStatusBadge[client.status]}`}>{client.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-emerald-600 font-medium hidden md:table-cell">{client.budget_range || '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400 hidden sm:table-cell">{formatRelativeTime(client.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={e => { e.stopPropagation(); handleDeleteClient(client.id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Building2 className="w-7 h-7 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">{searchQuery ? 'No clients match' : 'No clients yet'}</p>
                {!searchQuery && (
                  <button onClick={() => setClientModalOpen(true)}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />Add First Client
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Modals */}
      {selectedLead && <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      {selectedClient && <ClientModal client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  );
}
