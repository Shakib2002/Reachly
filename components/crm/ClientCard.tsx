'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, DollarSign, GripVertical, Pencil, Trash2, Bell, Clock } from 'lucide-react';
import type { ClientLead, ClientLeadStatus } from '@/types';

const columnColors: Record<ClientLeadStatus, string> = {
  lead: 'border-l-[#3b82f6]',
  contacted: 'border-l-[#f59e0b]',
  proposal: 'border-l-[#8b5cf6]',
  negotiation: 'border-l-[#f97316]',
  won: 'border-l-[#10b981]',
  lost: 'border-l-[#6b7280]',
};

const sourceBadge: Record<string, string> = {
  Upwork: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Fiverr: 'bg-green-50 text-green-600 border-green-100',
  LinkedIn: 'bg-blue-50 text-blue-600 border-blue-100',
  Referral: 'bg-amber-50 text-amber-600 border-amber-100',
  'Cold Email': 'bg-violet-50 text-violet-600 border-violet-100',
  'Cold Call': 'bg-rose-50 text-rose-600 border-rose-100',
  Website: 'bg-blue-50 text-indigo-600 border-indigo-100',
  Facebook: 'bg-blue-50 text-blue-700 border-blue-100',
  Other: 'bg-slate-50 text-slate-500 border-slate-200',
};

const projectBadge: Record<string, string> = {
  'Web Development': 'bg-blue-50 text-blue-600',
  'Mobile App': 'bg-purple-50 text-purple-600',
  'UI/UX Design': 'bg-pink-50 text-pink-600',
  'Digital Marketing': 'bg-orange-50 text-orange-600',
  'Content Writing': 'bg-teal-50 text-teal-600',
  'SEO': 'bg-lime-50 text-lime-700',
  'Video Editing': 'bg-red-50 text-red-600',
  'Other': 'bg-slate-50 text-slate-500',
};

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
};

interface ClientCardProps {
  client: ClientLead;
  onClick: (c: ClientLead) => void;
  onEdit: (c: ClientLead) => void;
  onDelete: (id: string) => void;
  onFollowUp?: (c: ClientLead) => void;
  isDragging?: boolean;
}

export default function ClientCard({ client, onClick, onEdit, onDelete, onFollowUp }: ClientCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: client.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortableDragging ? 0.5 : 1 };
  const daysInPipeline = Math.floor((Date.now() - new Date(client.created_at).getTime()) / 86400000);

  return (
    <div ref={setNodeRef} style={style}
      className={`group bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer border-l-[3px] ${columnColors[client.status]} ${isSortableDragging ? 'ring-2 ring-blue-400/30 shadow-lg' : ''} ${client.status === 'lost' ? 'opacity-70' : ''}`}
      onClick={() => onClick(client)}>
      <div className="p-3.5">
        {/* Top: Name + Drag + Priority */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[client.priority] || priorityDot.medium}`} />
            <h4 className="text-sm font-bold text-[#1e293b] leading-snug line-clamp-1">{client.client_name}</h4>
          </div>
          <button {...attributes} {...listeners} onClick={e => e.stopPropagation()}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all cursor-grab active:cursor-grabbing flex-shrink-0">
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Contact person */}
        {client.contact_person && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <User className="w-3 h-3" /><span className="truncate">{client.contact_person}</span>
          </div>
        )}

        {/* Project type badge */}
        {client.project_type && (
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mb-2 ${projectBadge[client.project_type] || projectBadge.Other}`}>
            {client.project_type}
          </span>
        )}

        {/* Budget */}
        {client.budget_range && (
          <div className="flex items-center gap-1.5 text-xs mb-2">
            <DollarSign className="w-3 h-3 text-emerald-500" />
            <span className="font-medium text-emerald-600">{client.budget_range}</span>
          </div>
        )}

        {/* Bottom: Source + Days */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          {client.source && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${sourceBadge[client.source] || sourceBadge.Other}`}>
              {client.source}
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto">
            <Clock className="w-3 h-3" />{daysInPipeline}d
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onEdit(client); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <Pencil className="w-3 h-3" />Edit
          </button>
          {onFollowUp && (
            <button onClick={e => { e.stopPropagation(); onFollowUp(client); }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
              <Bell className="w-3 h-3" />Follow-up
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(client.id); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3 h-3" />Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 animate-pulse">
      <div className="h-4 bg-slate-200/70 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-5 bg-slate-100 rounded w-20 mb-2" />
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <div className="h-4 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-10" />
      </div>
    </div>
  );
}
