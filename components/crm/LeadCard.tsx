'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Building2,
  MapPin,
  DollarSign,
  GripVertical,
  Pencil,
  Trash2,
  Mail,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types';

const columnColors: Record<LeadStatus, string> = {
  new: 'border-l-[#3b82f6]',
  applied: 'border-l-[#f59e0b]',
  interview: 'border-l-[#8b5cf6]',
  offer: 'border-l-[#10b981]',
  closed: 'border-l-[#6b7280]',
};

const sourceBadgeStyles: Record<string, string> = {
  LinkedIn: 'bg-blue-50 text-blue-600 border-blue-100',
  Indeed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Apollo: 'bg-violet-50 text-violet-600 border-violet-100',
  Manual: 'bg-slate-50 text-slate-500 border-slate-200',
  Referral: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Company Site': 'bg-amber-50 text-amber-600 border-amber-100',
  Other: 'bg-gray-50 text-gray-500 border-gray-200',
};

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onEmail: (lead: Lead) => void;
  onClick: (lead: Lead) => void;
  isDragging?: boolean;
}

export default function LeadCard({
  lead,
  onEdit,
  onDelete,
  onEmail,
  onClick,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer border-l-[3px] ${
        columnColors[lead.status]
      } ${isSortableDragging ? 'ring-2 ring-blue-400/30 shadow-lg' : ''}`}
      onClick={() => onClick(lead)}
    >
      <div className="p-3.5">
        {/* Top row: Title + Drag handle */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-[#1e293b] leading-snug line-clamp-2">
            {lead.title}
          </h4>
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          {lead.company && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="w-3 h-3 flex-shrink-0 text-slate-400" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
              <span className="truncate">{lead.location}</span>
            </div>
          )}
          {lead.salary && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <DollarSign className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              <span className="font-medium text-emerald-600">{lead.salary}</span>
            </div>
          )}
        </div>

        {/* Bottom row: Source + Time */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
          {lead.source && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                sourceBadgeStyles[lead.source] || sourceBadgeStyles.Other
              }`}
            >
              {lead.source}
            </span>
          )}
          <span className="text-[10px] text-slate-400 ml-auto">
            {formatRelativeTime(lead.created_at)}
          </span>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEmail(lead);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Mail className="w-3 h-3" />
            Email
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead.id);
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Skeleton version for loading state
export function LeadCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 animate-pulse">
      <div className="h-4 bg-slate-200/70 rounded w-3/4 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
        <div className="h-4 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-14" />
      </div>
    </div>
  );
}
