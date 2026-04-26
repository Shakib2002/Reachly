'use client';

import { useState, useMemo } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import ClientCard, { ClientCardSkeleton } from './ClientCard';
import { useClientStore } from '@/lib/clientStore';
import type { ClientLead, ClientLeadStatus } from '@/types';

const columns: { id: ClientLeadStatus; label: string; color: string; dot: string; emptyBorder: string; emptyBg: string }[] = [
  { id: 'lead', label: 'Lead', color: '#3b82f6', dot: 'bg-blue-500', emptyBorder: 'border-blue-200', emptyBg: 'bg-blue-50/40' },
  { id: 'contacted', label: 'Contacted', color: '#f59e0b', dot: 'bg-amber-500', emptyBorder: 'border-amber-200', emptyBg: 'bg-amber-50/40' },
  { id: 'proposal', label: 'Proposal Sent', color: '#8b5cf6', dot: 'bg-purple-500', emptyBorder: 'border-purple-200', emptyBg: 'bg-purple-50/40' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316', dot: 'bg-orange-500', emptyBorder: 'border-orange-200', emptyBg: 'bg-orange-50/40' },
  { id: 'won', label: 'Won', color: '#10b981', dot: 'bg-emerald-500', emptyBorder: 'border-emerald-200', emptyBg: 'bg-emerald-50/40' },
  { id: 'lost', label: 'Lost', color: '#6b7280', dot: 'bg-gray-500', emptyBorder: 'border-slate-200', emptyBg: 'bg-slate-50/40' },
];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`min-h-[120px] transition-colors duration-200 ${isOver ? 'bg-blue-50/50 rounded-xl' : ''}`}>
      {children}
    </div>
  );
}

interface Props {
  searchQuery: string;
  sortBy: string;
  onCardClick: (c: ClientLead) => void;
  onEditCard: (c: ClientLead) => void;
  onAddToColumn: (status: ClientLeadStatus) => void;
}

export default function ClientKanban({ searchQuery, sortBy, onCardClick, onEditCard, onAddToColumn }: Props) {
  const { clients, loading, updateClientStatus, deleteClient } = useClientStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.client_name?.toLowerCase().includes(q) ||
        c.contact_person?.toLowerCase().includes(q) ||
        c.project_type?.toLowerCase().includes(q) ||
        c.source?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'company': result.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [clients, searchQuery, sortBy]);

  const columnClients = useMemo(() => {
    const groups: Record<ClientLeadStatus, ClientLead[]> = { lead: [], contacted: [], proposal: [], negotiation: [], won: [], lost: [] };
    filteredClients.forEach(c => { groups[c.status]?.push(c); });
    return groups;
  }, [filteredClients]);

  const activeClient = activeId ? clients.find(c => c.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
  const handleDragOver = (_e: DragOverEvent) => {};
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const clientId = active.id as string;
    const overId = over.id as string;
    const targetCol = columns.find(col => col.id === overId);
    if (targetCol) {
      const client = clients.find(c => c.id === clientId);
      if (client && client.status !== targetCol.id) updateClientStatus(clientId, targetCol.id);
      return;
    }
    const targetClient = clients.find(c => c.id === overId);
    if (targetClient) {
      const client = clients.find(c => c.id === clientId);
      if (client && client.status !== targetClient.status) updateClientStatus(clientId, targetClient.status);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this client?')) deleteClient(id);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 min-h-[calc(100vh-280px)]">
        {columns.map(col => {
          const colClients = columnClients[col.id] || [];
          return (
            <div key={col.id} className="flex-shrink-0 w-64 flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-[#1e293b]">{col.label}</span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 w-5 h-5 rounded-md flex items-center justify-center">{colClients.length}</span>
                </div>
                <button onClick={() => onAddToColumn(col.id)} className="p-1 hover:bg-white rounded-lg transition-colors group">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                </button>
              </div>
              <div className="flex-1 px-2.5 pb-2.5 overflow-y-auto">
                <DroppableColumn id={col.id}>
                  <SortableContext items={colClients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2.5 min-h-[80px]">
                      {loading ? (<><ClientCardSkeleton /><ClientCardSkeleton /></>) : colClients.length > 0 ? (
                        colClients.map(c => (
                          <ClientCard key={c.id} client={c} onClick={onCardClick} onEdit={onEditCard} onDelete={handleDelete} />
                        ))
                      ) : (
                        <div className={`border-2 border-dashed ${col.emptyBorder} ${col.emptyBg} rounded-xl py-8 flex flex-col items-center justify-center text-center`}>
                          <p className="text-xs font-medium text-slate-400">Drop clients here</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">or click + to add</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              </div>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeClient ? (
          <div className="w-64 opacity-90 rotate-2 shadow-2xl">
            <ClientCard client={activeClient} onClick={() => {}} onEdit={() => {}} onDelete={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
