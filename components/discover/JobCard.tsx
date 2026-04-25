'use client';

import { useState } from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Clock,
  CheckCircle,
  Loader2,
  BookmarkPlus,
  Wifi,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  city: string;
  state: string;
  country: string;
  minSalary: number | null;
  maxSalary: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  description: string;
  applyLink: string;
  postedAt: string;
  employmentType: string;
  isRemote: boolean;
}

interface JobCardProps {
  job: Job;
  onSaveToCRM: (job: Job) => Promise<void>;
  isSaved: boolean;
}

function formatSalary(min: number | null, max: number | null, currency: string, period: string) {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k`;
    return String(n);
  };
  const cur = currency === 'USD' ? '$' : currency;
  const per = period === 'YEAR' ? '/yr' : period === 'HOUR' ? '/hr' : '';
  if (min && max) return `${cur}${fmt(min)} - ${cur}${fmt(max)}${per}`;
  if (min) return `${cur}${fmt(min)}+${per}`;
  if (max) return `Up to ${cur}${fmt(max)}${per}`;
  return null;
}

const typeStyles: Record<string, string> = {
  FULLTIME: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  PARTTIME: 'bg-amber-50 text-amber-600 border-amber-100',
  CONTRACTOR: 'bg-violet-50 text-violet-600 border-violet-100',
  INTERN: 'bg-blue-50 text-blue-600 border-blue-100',
};

const typeLabels: Record<string, string> = {
  FULLTIME: 'Full-time',
  PARTTIME: 'Part-time',
  CONTRACTOR: 'Contract',
  INTERN: 'Intern',
};

export default function JobCard({ job, onSaveToCRM, isSaved }: JobCardProps) {
  const [saving, setSaving] = useState(false);

  const salary = formatSalary(job.minSalary, job.maxSalary, job.salaryCurrency, job.salaryPeriod);
  const location = [job.city, job.state, job.country].filter(Boolean).join(', ');
  const description = job.description?.slice(0, 160)?.replace(/<[^>]*>/g, '') || '';

  const handleSave = async () => {
    setSaving(true);
    await onSaveToCRM(job);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
      {/* Top: Logo + Title + Company */}
      <div className="flex items-start gap-3.5">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200/50">
          {job.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={job.logo}
              alt={job.company}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  `<div class="w-full h-full flex items-center justify-center"><span class="text-sm font-bold text-slate-400">${job.company?.[0] || 'J'}</span></div>`;
              }}
            />
          ) : (
            <span className="text-lg font-bold text-slate-400">
              {job.company?.[0]?.toUpperCase() || 'J'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1e293b] leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 truncate">{job.company}</span>
          </div>
        </div>
      </div>

      {/* Meta: Location, Type, Salary */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {(location || job.isRemote) && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {job.isRemote ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Remote</span>
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{location}</span>
              </>
            )}
          </div>
        )}

        {job.employmentType && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeStyles[job.employmentType] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {typeLabels[job.employmentType] || job.employmentType}
          </span>
        )}

        {salary && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <DollarSign className="w-3 h-3" />
            {salary}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-2">
          {description}...
        </p>
      )}

      {/* Bottom: Posted + Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" />
          {job.postedAt ? formatRelativeTime(job.postedAt) : 'Recently'}
        </div>

        <div className="flex items-center gap-2">
          {isSaved ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5" />
              )}
              Save to CRM
            </button>
          )}
          {job.applyLink && (
            <a
              href={job.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Apply
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton
export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse">
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-slate-200/70" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200/70 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-slate-100 rounded w-20" />
        <div className="h-5 bg-slate-100 rounded w-16" />
        <div className="h-5 bg-slate-100 rounded w-24" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full mt-3" />
      <div className="h-3 bg-slate-100 rounded w-2/3 mt-1.5" />
      <div className="flex justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="flex gap-2">
          <div className="h-7 bg-slate-100 rounded w-24" />
          <div className="h-7 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
