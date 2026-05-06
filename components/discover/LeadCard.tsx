'use client';

import { useState } from 'react';
import {
  ExternalLink, Mail, CheckCircle, Loader2,
  UserPlus, MapPin, Briefcase, Search, Link2, Phone,
  Shield, ShieldCheck, ShieldAlert, Globe, DollarSign,
  Clock, ChevronDown, ChevronUp, Award, FileText, Newspaper,
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
    postedAgo?: string;
    type: string;
    description?: string;
    publisher?: string;
    googleLink?: string;
    applyDirect?: boolean;
    benefits?: string[];
    highlights?: {
      qualifications: string[];
      responsibilities: string[];
    };
  } | null;
  salary?: {
    min: number | null;
    max: number | null;
    currency: string;
    period: string;
  } | null;
  isRemote?: boolean;
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
  const [expanded, setExpanded] = useState(false);
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
      // Use /api/leads/enrich — domain-search API that finds ALL contacts at a domain
      // This works even without first_name/last_name (unlike waterfall)
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: lead.domain,
          company: lead.company,
          role: lead.position,
        }),
      });
      const data = await res.json();
      if (data.contacts?.length > 0) {
        const best = data.contacts[0];
        setEnrichedData({
          email: best.email,
          confidence: best.confidence || 0,
          linkedin: best.linkedin,
          phone: best.phone,
          first_name: best.first_name || '',
          last_name: best.last_name || '',
          title: best.position || '',
          source: best.source || 'enrichment',
        });
      } else {
        setEnrichedData({
          email: null, confidence: 0, linkedin: null, phone: null,
          first_name: '', last_name: '', title: '', source: 'no-results',
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
        <div className="mt-3">
          <div className="px-3 py-2 bg-slate-50 rounded-lg">
            {/* Row 1: Title + View */}
            <div className="flex items-start gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 font-medium truncate">{lead.jobPosting.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {/* Posted time */}
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {lead.jobPosting.postedAgo || formatDate(lead.jobPosting.postedAt)}
                  </span>
                  {/* Job type */}
                  <span className="text-[10px] text-slate-400">
                    · {lead.jobPosting.type?.replace('_', ' ')}
                  </span>
                  {/* Publisher badge */}
                  {lead.jobPosting.publisher && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded font-semibold border border-blue-100 flex items-center gap-0.5">
                      <Newspaper className="w-2.5 h-2.5" />
                      {lead.jobPosting.publisher}
                    </span>
                  )}
                  {/* Remote badge */}
                  {lead.isRemote && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded font-semibold border border-violet-100">🌍 Remote</span>
                  )}
                  {/* Salary badge */}
                  {lead.salary && (lead.salary.min || lead.salary.max) && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-semibold border border-emerald-100 flex items-center gap-0.5">
                      <DollarSign className="w-2.5 h-2.5" />
                      {lead.salary.min ? `${Math.round(lead.salary.min / 1000)}k` : '?'}
                      {' - '}
                      {lead.salary.max ? `${Math.round(lead.salary.max / 1000)}k` : '?'}
                      /{lead.salary.period?.toLowerCase() === 'year' ? 'yr' : lead.salary.period?.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={lead.jobPosting.applyLink} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-0.5">
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Benefits badges */}
            {lead.jobPosting.benefits && lead.jobPosting.benefits.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {lead.jobPosting.benefits.slice(0, 4).map((b, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-medium border border-amber-100">
                    {b}
                  </span>
                ))}
                {lead.jobPosting.benefits.length > 4 && (
                  <span className="text-[9px] text-slate-400">+{lead.jobPosting.benefits.length - 4} more</span>
                )}
              </div>
            )}

            {/* Expand/Collapse button */}
            {lead.jobPosting.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition-colors w-full"
              >
                <FileText className="w-3 h-3" />
                {expanded ? 'Hide Details' : 'View Description & Requirements'}
                {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
            )}
          </div>

          {/* ─── Expanded Detail Panel ─── */}
          {expanded && lead.jobPosting.description && (
            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Description */}
              <div className="px-3 py-2.5 bg-white">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Job Description
                </h4>
                <div className="text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-1 whitespace-pre-line">
                  {lead.jobPosting.description.slice(0, 2000)}
                  {lead.jobPosting.description.length > 2000 && '...'}
                </div>
              </div>

              {/* Qualifications */}
              {lead.jobPosting.highlights?.qualifications && lead.jobPosting.highlights.qualifications.length > 0 && (
                <div className="px-3 py-2.5 bg-blue-50/50 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">✅ Requirements</h4>
                  <ul className="space-y-1">
                    {lead.jobPosting.highlights.qualifications.slice(0, 8).map((q, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities */}
              {lead.jobPosting.highlights?.responsibilities && lead.jobPosting.highlights.responsibilities.length > 0 && (
                <div className="px-3 py-2.5 bg-emerald-50/30 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">📋 Responsibilities</h4>
                  <ul className="space-y-1">
                    {lead.jobPosting.highlights.responsibilities.slice(0, 8).map((r, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply bar */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {lead.jobPosting.applyDirect ? '✅ Direct Apply' : '🔗 External Apply'}
                </span>
                <a href={lead.jobPosting.applyLink} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors flex items-center gap-1">
                  Apply Now <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
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
