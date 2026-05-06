'use client';

import { useState } from 'react';
import {
  ExternalLink, Mail, CheckCircle, Loader2,
  UserPlus, MapPin, Briefcase, Search, Link2, Phone,
  Shield, ShieldCheck, ShieldAlert, Globe,
} from 'lucide-react';

export interface LeadResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string;
  company: string;
  confidence: number;
  linkedin: string | null;
  department: string;
  logo?: string | null;
  location?: string;
  domain?: string;
  jobPosting?: {
    title: string;
    applyLink: string;
    postedAt: string;
    type: string;
  } | null;
}

interface LeadCardProps {
  lead: LeadResult;
  onAddToCRM: (lead: LeadResult) => Promise<void>;
  isSaved: boolean;
}

function getAvatarColor(name: string) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
    'from-blue-500 to-blue-700',
    'from-pink-400 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
        <Shield className="w-3 h-3" /> Not Enriched
      </span>
    );
  }
  if (confidence >= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        <ShieldCheck className="w-3 h-3" /> {confidence}% Verified
      </span>
    );
  }
  if (confidence >= 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <Shield className="w-3 h-3" /> {confidence}% Likely
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200">
      <ShieldAlert className="w-3 h-3" /> {confidence}% Guess
    </span>
  );
}

export default function LeadCard({ lead, onAddToCRM, isSaved }: LeadCardProps) {
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<{
    email: string | null;
    confidence: number;
    linkedin: string | null;
    phone: string | null;
    first_name: string;
    last_name: string;
    title: string;
    source: string;
  } | null>(null);

  // Use company name as lead identity (real data, not fake person)
  const companyName = lead.company;
  const initials = companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = getAvatarColor(companyName);

  const displayEmail = enrichedData?.email || lead.email;
  const displayConfidence = enrichedData?.confidence || lead.confidence;
  const displayLinkedin = enrichedData?.linkedin || lead.linkedin;
  const displayPhone = enrichedData?.phone || null;
  const enrichedContactName = enrichedData?.first_name
    ? `${enrichedData.first_name} ${enrichedData.last_name}`.trim()
    : null;

  const handleAdd = async () => {
    setSaving(true);
    const enrichedLead = enrichedData ? {
      ...lead,
      email: enrichedData.email || lead.email,
      confidence: enrichedData.confidence,
      linkedin: enrichedData.linkedin || lead.linkedin,
      firstName: enrichedData.first_name || lead.firstName,
      lastName: enrichedData.last_name || lead.lastName,
      position: enrichedData.title || lead.position,
    } : lead;
    await onAddToCRM(enrichedLead);
    setSaving(false);
  };

  const handleEnrich = async () => {
    if (!lead.domain && !lead.company) return;
    setEnriching(true);
    try {
      const res = await fetch('/api/leads/waterfall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: lead.company,
          domain: lead.domain,
          role: lead.position,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setEnrichedData({
          email: data.result.email,
          confidence: data.result.confidence,
          linkedin: data.result.linkedin,
          phone: data.result.phone,
          first_name: data.result.first_name || '',
          last_name: data.result.last_name || '',
          title: data.result.title || '',
          source: data.result.source,
        });
      }
    } catch {
      setEnrichedData({
        email: null, confidence: 0, linkedin: null, phone: null,
        first_name: '', last_name: '', title: '', source: 'failed',
      });
    }
    setEnriching(false);
  };

  const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.company)}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        {lead.logo ? (
          <img
            src={lead.logo}
            alt={lead.company}
            className="w-11 h-11 rounded-xl object-contain border border-slate-100 bg-white p-1 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}>
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1e293b] truncate group-hover:text-blue-600 transition-colors">
            {companyName}
          </h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">Hiring: {lead.position}</p>
          {lead.domain && (
            <div className="flex items-center gap-1.5 mt-1">
              <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-blue-500 truncate">{lead.domain}</span>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-400 truncate">{lead.location}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {lead.department && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              {lead.department}
            </span>
          )}
          <ConfidenceBadge confidence={displayConfidence} />
        </div>
      </div>

      {/* Job Posting info (REAL data from JSearch) */}
      {lead.jobPosting && (
        <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg flex items-start gap-2">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">{lead.jobPosting.title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lead.jobPosting.type?.replace('_', ' ')} · Posted {formatDate(lead.jobPosting.postedAt)}
            </p>
          </div>
          <a href={lead.jobPosting.applyLink} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-0.5 flex-shrink-0">
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Enriched Contact (only shown after enrichment — REAL data) */}
      {enrichedContactName && (
        <div className="mt-2 px-3 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Enriched Contact</p>
          <p className="text-xs font-semibold text-[#1e293b]">{enrichedContactName}</p>
          {enrichedData?.title && <p className="text-[11px] text-slate-500">{enrichedData.title}</p>}
          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold mt-1 inline-block">
            via {enrichedData?.source}
          </span>
        </div>
      )}

      {/* Email row */}
      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-slate-50 rounded-lg">
        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        {displayEmail ? (
          <a href={`mailto:${displayEmail}`} className="text-xs text-blue-600 font-mono truncate flex-1 hover:text-blue-700">
            {displayEmail}
          </a>
        ) : lead.domain ? (
          <span className="text-xs text-slate-400 truncate flex-1">
            Click &quot;Find Email&quot; to discover contacts at <span className="text-blue-500 font-medium">{lead.domain}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic flex-1">Click &quot;Find Email&quot; to enrich</span>
        )}
      </div>

      {/* Phone row (only if enriched — REAL data) */}
      {displayPhone && (
        <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-slate-50 rounded-lg">
          <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <a href={`tel:${displayPhone}`} className="text-xs text-slate-600 font-mono truncate hover:text-blue-600">
            {displayPhone}
          </a>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1.5 mt-3">
        {/* Find Email — calls real waterfall API (Hunter → Skrapp → Apollo) */}
        {!displayEmail && (
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Find Email
          </button>
        )}

        {/* LinkedIn Company Search */}
        <a
          href={displayLinkedin || linkedinSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <Link2 className="w-3 h-3" />
          {displayLinkedin ? 'View Profile' : 'Find on LinkedIn'}
        </a>

        {/* Phone (only if enriched) */}
        {displayPhone && (
          <a href={`tel:${displayPhone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
      </div>

      {/* CRM Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        {isSaved ? (
          <button disabled
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Saved to CRM
          </button>
        ) : (
          <button onClick={handleAdd} disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Add to CRM
          </button>
        )}
        {lead.jobPosting?.applyLink && (
          <a href={lead.jobPosting.applyLink} target="_blank" rel="noopener noreferrer"
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            title="View Job Posting">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

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
        <div className="w-16 h-5 bg-slate-100 rounded-md" />
      </div>
      <div className="h-12 bg-slate-100 rounded-lg mt-3" />
      <div className="h-8 bg-slate-100 rounded-lg mt-2" />
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <div className="flex-1 h-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}
