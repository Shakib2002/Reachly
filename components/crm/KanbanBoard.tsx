'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import LeadCard, { LeadCardSkeleton } from './LeadCard';
import { useLeadStore } from '@/lib/store';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Lead, LeadStatus } from '@/types';

const columns: {
  id: LeadStatus;
  label: string;
  color: string;
  dot: string;
  emptyBorder: string;
  emptyBg: string;
}[] = [
  {
    id: 'new',
    label: 'New',
    color: '#3b82f6',
    dot: 'bg-blue-500',
    emptyBorder: 'border-blue-200',
    emptyBg: 'bg-blue-50/40',
  },
  {
    id: 'applied',
    label: 'Applied',
    color: '#f59e0b',
    dot: 'bg-amber-500',
    emptyBorder: 'border-amber-200',
    emptyBg: 'bg-amber-50/40',
  },
  {
    id: 'interview',
    label: 'Interview',
    color: '#8b5cf6',
    dot: 'bg-purple-500',
    emptyBorder: 'border-purple-200',
    emptyBg: 'bg-purple-50/40',
  },
  {
    id: 'offer',
    label: 'Offer',
    color: '#10b981',
    dot: 'bg-emerald-500',
    emptyBorder: 'border-emerald-200',
    emptyBg: 'bg-emerald-50/40',
  },
  {
    id: 'closed',
    label: 'Closed',
    color: '#6b7280',
    dot: 'bg-gray-500',
    emptyBorder: 'border-slate-200',
    emptyBg: 'bg-slate-50/40',
  },
];

// Droppable column wrapper
function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] transition-colors duration-200 ${
        isOver ? 'bg-blue-50/50 rounded-xl' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface KanbanBoardProps {
  searchQuery: string;
  sortBy: string;
  onCardClick: (lead: Lead) => void;
  onEditCard: (lead: Lead) => void;
  onAddToColumn: (status: LeadStatus) => void;
}

export default function KanbanBoard({
  searchQuery,
  sortBy,
  onCardClick,
  onEditCard,
  onAddToColumn,
}: KanbanBoardProps) {
  const { leads, loading, updateLeadStatus, deleteLead } = useLeadStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.source?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'company':
        result.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [leads, searchQuery, sortBy]);

  // Group leads by status
  const columnLeads = useMemo(() => {
    const groups: Record<LeadStatus, Lead[]> = {
      new: [],
      applied: [],
      interview: [],
      offer: [],
      closed: [],
    };
    filteredLeads.forEach((lead) => {
      groups[lead.status]?.push(lead);
    });
    return groups;
  }, [filteredLeads]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // We handle movement in onDragEnd for simplicity
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.id === overId);
    if (targetColumn) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== targetColumn.id) {
        updateLeadStatus(leadId, targetColumn.id);
      }
      return;
    }

    // Check if dropped on another card — find which column that card is in
    const targetLead = leads.find((l) => l.id === overId);
    if (targetLead) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== targetLead.status) {
        updateLeadStatus(leadId, targetLead.status);
      }
    }
  };

  const handleDeleteLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setDeleteTarget({ id, name: lead?.title || 'this lead' });
  };

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteLead(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteLead]);

  const handleEmailLead = (lead: Lead) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`);
    }
  };

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 min-h-[calc(100vh-280px)]">
        {columns.map((col) => {
          const colLeads = columnLeads[col.id] || [];
          const leadIds = colLeads.map((l) => l.id);

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col bg-slate-50/80 rounded-2xl border border-slate-200/80"
            >
              {/* Column Header */}
              <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-[#1e293b]">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 w-5 h-5 rounded-md flex items-center justify-center">
                    {colLeads.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddToColumn(col.id)}
                  className="p-1 hover:bg-white rounded-lg transition-colors group"
                  aria-label={`Add lead to ${col.label} column`}
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                </button>
              </div>

              {/* Column Body */}
              <div className="flex-1 px-2.5 pb-2.5 overflow-y-auto">
                <DroppableColumn id={col.id}>
                  <SortableContext
                    items={leadIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2.5 min-h-[80px]">
                      {loading ? (
                        <>
                          <LeadCardSkeleton />
                          <LeadCardSkeleton />
                        </>
                      ) : colLeads.length > 0 ? (
                        colLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={onCardClick}
                            onEdit={onEditCard}
                            onDelete={handleDeleteLead}
                            onEmail={handleEmailLead}
                          />
                        ))
                      ) : (
                        <div
                          className={`border-2 border-dashed ${col.emptyBorder} ${col.emptyBg} rounded-xl py-8 flex flex-col items-center justify-center text-center`}
                        >
                          <p className="text-xs font-medium text-slate-400">
                            Drop leads here
                          </p>
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            or click + to add
                          </p>
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

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLead ? (
          <div className="w-72 opacity-90 rotate-2 shadow-2xl">
            <LeadCard
              lead={activeLead}
              onClick={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onEmail={() => {}}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

    {/* Delete Confirmation */}
    <ConfirmDialog
      open={!!deleteTarget}
      title="Delete lead?"
      message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      onConfirm={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
    />
    </>
  );
}
