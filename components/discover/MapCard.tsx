'use client';

import { useState } from 'react';
import {
  Star, Phone, Globe, MapPin, ExternalLink,
  CheckCircle, Loader2, UserPlus, ImageOff,
  AlertCircle, TrendingUp,
} from 'lucide-react';

export interface MapBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  rating: number;
  reviewsCount: number;
  imagesCount: number;
  isOpen: boolean;
  mapsUrl: string;
  imageUrl: string | null;
  description: string | null;
  leadScore: number;
  hasPainKeywords: boolean;
  websiteMissing: boolean;
}

interface MapCardProps {
  business: MapBusiness;
  onAddToCRM: (biz: MapBusiness) => Promise<void>;
  isSaved: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
        />
      ))}
      <span className="text-xs font-bold text-slate-700 ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
    score >= 65 ? 'bg-blue-50 text-blue-600 border-blue-200' :
    score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' :
    'bg-slate-50 text-slate-500 border-slate-200';

  const label = score >= 80 ? 'Hot Lead 🔥' : score >= 65 ? 'Good Lead' : score >= 50 ? 'Warm' : 'Cold';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${color}`}>
      <TrendingUp className="w-3 h-3" />
      <span>{score}</span>
      <span className="opacity-70">·</span>
      <span>{label}</span>
    </div>
  );
}

export default function MapCard({ business: biz, onAddToCRM, isSaved }: MapCardProps) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    await onAddToCRM(biz);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 hover:shadow-md hover:border-blue-200 transition-all duration-200 group overflow-hidden">
      {/* Image / Header */}
      <div className="relative h-28 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {biz.imageUrl && !imgError ? (
          <img
            src={biz.imageUrl}
            alt={biz.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-slate-300" />
          </div>
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Score badge top-right */}
        <div className="absolute top-2 right-2">
          <ScoreBadge score={biz.leadScore} />
        </div>

        {/* Status badge top-left */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${biz.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {biz.isOpen ? 'Open' : 'Closed'}
        </div>

        {/* Name at bottom */}
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 drop-shadow">
            {biz.name}
          </h3>
          <p className="text-white/80 text-[10px] mt-0.5">{biz.category}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2.5">
        {/* Rating + Reviews */}
        <div className="flex items-center justify-between">
          <StarRating rating={biz.rating} />
          <span className="text-[10px] text-slate-400">{biz.reviewsCount} reviews</span>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5">
          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="flex items-center gap-2 group/row">
              <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-slate-600 group-hover/row:text-blue-600 transition-colors">{biz.phone}</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            {biz.website ? (
              <a href={biz.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 truncate transition-colors">
                {biz.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            ) : (
              <span className="text-xs text-amber-500 font-semibold">No Website 🎯</span>
            )}
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-500 line-clamp-1">{biz.address}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {biz.websiteMissing && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[10px] font-semibold">
              No Website
            </span>
          )}
          {biz.imagesCount < 10 && (
            <span className="px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-200 rounded-md text-[10px] font-semibold">
              Few Photos
            </span>
          )}
          {biz.hasPainKeywords && (
            <span className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-md text-[10px] font-semibold flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> Pain Point
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-md text-[10px]">
            {biz.imagesCount} photos
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          {isSaved ? (
            <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" /> Added to CRM
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add to CRM
            </button>
          )}
          <a
            href={biz.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function MapCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden animate-pulse">
      <div className="h-28 bg-slate-200/70" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <div key={i} className="w-3 h-3 rounded-full bg-slate-200" />)}
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-8 bg-slate-100 rounded-lg" />
          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
