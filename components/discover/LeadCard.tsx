'use client';

import { useState } from 'react';
import {
  Building2,
  ExternalLink,
  Mail,
  CheckCircle,
  Loader2,
  UserPlus,
  Shield,
} from 'lucide-react';

export interface LeadResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  company: string;
  confidence: number;
  linkedin: string | null;
  department: string;
}

interface LeadCardProps {
  lead: LeadResult;
  onAddToCRM: (lead: LeadResult) => Promise<void>;
  isSaved: boolean;
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600',
    'from-pink-400 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function LeadCard({ lead, onAddToCRM, isSaved }: LeadCardProps) {
  const [saving, setSaving] = useState(false);

  const fullName = `${lead.firstName} ${lead.lastName}`;
  const initials = `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`.toUpperCase();
  const avatarColor = getAvatarColor(fullName);

  const handleAdd = async () => {
    setSaving(true);
    await onAddToCRM(lead);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1e293b] truncate group-hover:text-blue-600 transition-colors">
            {fullName}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {lead.position}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">{lead.company}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
          lead.confidence >= 80
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : lead.confidence >= 50
            ? 'bg-amber-50 text-amber-600 border-amber-100'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          <Shield className="w-3 h-3" />
          {lead.confidence}%
        </div>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-slate-50 rounded-lg">
        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-500 font-mono truncate">
          {maskEmail(lead.email)}
        </span>
      </div>

      {/* Department badge */}
      {lead.department && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
            {lead.department}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        {isSaved ? (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Added to CRM
          </button>
        ) : (
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            Add to CRM
          </button>
        )}
        {lead.linkedin && (
          <a
            href={lead.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// Skeleton
export function LeadCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse">
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-slate-200/70" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200/70 rounded w-2/3 mb-1.5" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mb-1" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="w-12 h-6 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-100 rounded-lg mt-3" />
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <div className="flex-1 h-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}
