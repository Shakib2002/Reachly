'use client';

import { useState } from 'react';
import {
  Star, Phone, Globe, MapPin, ExternalLink,
  CheckCircle, Loader2, UserPlus, ImageOff,
  AlertCircle, TrendingUp, MessageCircle, Mail,
  Search, Info, Link2, Clock, AtSign,
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
  openingHours?: string[];
  socialMedia?: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    linkedin: string | null;
  };
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

function ScoreBadge({ score, biz }: { score: number; biz: MapBusiness }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const color =
    score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
    score >= 65 ? 'bg-blue-50 text-blue-600 border-blue-200' :
    score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' :
    'bg-slate-50 text-slate-500 border-slate-200';

  const label = score >= 80 ? 'Hot Lead 🔥' : score >= 65 ? 'Good Lead' : score >= 50 ? 'Warm' : 'Cold';

  // Score breakdown logic (mirrors backend)
  const rating = biz.rating || 0;
  const rev = biz.reviewsCount || 0;
  const breakdown = [
    { label: 'Base', pts: 40, icon: '🏢' },
    { label: 'Rating sweet spot', pts: rating >= 3.8 && rating <= 4.2 ? 20 : rating >= 3.5 && rating <= 4.3 ? 12 : 0, icon: '⭐' },
    { label: 'Review count', pts: rev >= 20 && rev <= 100 ? 15 : rev >= 15 && rev <= 120 ? 8 : 0, icon: '🧾' },
    { label: 'No website', pts: !biz.website ? 12 : 3, icon: '🎯' },
    { label: 'Has phone', pts: biz.phone ? 8 : 0, icon: '📞' },
    { label: 'Few photos', pts: biz.imagesCount < 10 ? 8 : biz.imagesCount < 25 ? 4 : 0, icon: '📸' },
    { label: 'Active business', pts: biz.isOpen ? 5 : 0, icon: '✅' },
  ].filter(b => b.pts > 0);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowBreakdown(true)}
        onMouseLeave={() => setShowBreakdown(false)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${color} cursor-help`}
      >
        <TrendingUp className="w-3 h-3" />
        <span>{score}</span>
        <span className="opacity-70">·</span>
        <span>{label}</span>
        <Info className="w-2.5 h-2.5 opacity-50" />
      </button>

      {/* Score Breakdown Tooltip */}
      {showBreakdown && (
        <div className="absolute top-full right-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Score Breakdown</p>
          <div className="space-y-1">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">{b.icon} {b.label}</span>
                <span className="font-bold text-emerald-600">+{b.pts}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-2 pt-1.5 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Total</span>
            <span className="font-black text-blue-600">{score}/100</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapCard({ business: biz, onAddToCRM, isSaved }: MapCardProps) {
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [findingEmail, setFindingEmail] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [emailMeta, setEmailMeta] = useState<{ source?: string; confidence?: number; verified?: boolean } | null>(null);

  const handleAdd = async () => {
    setSaving(true);
    // Pass enriched email if found — so CRM gets the real email
    const enrichedBiz = foundEmail && foundEmail !== 'not-found'
      ? { ...biz, enrichedEmail: foundEmail }
      : biz;
    await onAddToCRM(enrichedBiz);
    setSaving(false);
  };

  const handleFindEmail = async () => {
    setFindingEmail(true);
    try {
      // Extract domain from website, or use company name as fallback
      const domain = biz.website
        ? biz.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        : null;
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, company: biz.name }),
      });
      const data = await res.json();
      if (data.contacts?.length > 0 && data.contacts[0].email) {
        const contact = data.contacts[0];
        setFoundEmail(contact.email);
        setEmailMeta({ source: contact.source, confidence: contact.confidence, verified: contact.verified });
      } else {
        setFoundEmail('not-found');
      }
    } catch {
      setFoundEmail('not-found');
    }
    setFindingEmail(false);
  };

  const whatsappNumber = biz.phone?.replace(/[^0-9+]/g, '').replace(/^\+/, '');

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Score badge top-right */}
        <div className="absolute top-2 right-2">
          <ScoreBadge score={biz.leadScore} biz={biz} />
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

          {/* Business Description */}
          {biz.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{biz.description}</p>
          )}

          {/* Opening Hours */}
          {biz.openingHours && biz.openingHours.length > 0 && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-slate-400 line-clamp-1">{biz.openingHours[0]}</span>
            </div>
          )}

          {/* Social Media Links */}
          {biz.socialMedia && (biz.socialMedia.facebook || biz.socialMedia.instagram || biz.socialMedia.twitter || biz.socialMedia.linkedin) && (
            <div className="flex items-center gap-1.5">
              {biz.socialMedia.facebook && (
                <a href={biz.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Facebook">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </a>
              )}
              {biz.socialMedia.instagram && (
                <a href={biz.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors" title="Instagram">
                  <AtSign className="w-3 h-3" />
                </a>
              )}
              {biz.socialMedia.twitter && (
                <a href={biz.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors" title="Twitter/X">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {biz.socialMedia.linkedin && (
                <a href={biz.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"
                  className="p-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" title="LinkedIn">
                  <Link2 className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Found email */}
          {foundEmail && foundEmail !== 'not-found' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Mail className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <a href={`mailto:${foundEmail}`} className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 truncate">{foundEmail}</a>
              {emailMeta && (
                <>
                  {emailMeta.verified && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[9px] font-bold">✓ Verified</span>
                  )}
                  {emailMeta.source && (
                    <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded text-[9px]">via {emailMeta.source}</span>
                  )}
                  {emailMeta.confidence && !emailMeta.verified && (
                    <span className="text-[9px] text-slate-400">{emailMeta.confidence}%</span>
                  )}
                </>
              )}
            </div>
          )}
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

        {/* Enriched Email Display */}
        {foundEmail && foundEmail !== 'not-found' && (
          <div className="flex items-center gap-2 mt-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <Mail className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <a href={`mailto:${foundEmail}`} className="text-xs text-emerald-700 font-mono truncate hover:text-emerald-800 flex-1">
              {foundEmail}
            </a>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded font-semibold">Found</span>
          </div>
        )}

        {/* Quick Actions Row */}
        <div className="flex items-center gap-1.5 pt-1">
          {biz.phone && (
            <a href={`tel:${biz.phone}`} className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors" title="Call">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {whatsappNumber && (
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors" title="WhatsApp">
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
          {biz.website && (
            <a href={biz.website} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors" title="Visit Website">
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
          {!foundEmail && (
            <button
              onClick={handleFindEmail}
              disabled={findingEmail}
              className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors disabled:opacity-50"
              title="Find Email"
            >
              {findingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          )}
          {foundEmail === 'not-found' && (
            <span className="text-[10px] text-slate-400 ml-1">No email found</span>
          )}
          <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(biz.name)}`}
            target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Find on LinkedIn">
            <Link2 className="w-3.5 h-3.5" />
          </a>
          <a href={biz.mapsUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-colors ml-auto"
            title="Open in Google Maps">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* CRM Action */}
        <div className="pt-1 border-t border-slate-100">
          {isSaved ? (
            <button disabled className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" /> Saved to CRM
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Add to CRM
            </button>
          )}
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
