'use client';

import React from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'blue' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple' | 'teal' | 'orange' | 'slate';

const SIZES: Record<IconSize, { box: string; icon: string }> = {
  xs: { box: 'w-8 h-8', icon: 'w-3.5 h-3.5' },
  sm: { box: 'w-10 h-10', icon: 'w-4.5 h-4.5' },
  md: { box: 'w-12 h-12', icon: 'w-5 h-5' },
  lg: { box: 'w-14 h-14', icon: 'w-6 h-6' },
  xl: { box: 'w-16 h-16', icon: 'w-7 h-7' },
};

const VARIANTS: Record<IconVariant, { gradient: string; shadow: string; iconColor: string }> = {
  blue: { gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', iconColor: 'text-white' },
  indigo: { gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/30', iconColor: 'text-white' },
  violet: { gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/30', iconColor: 'text-white' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30', iconColor: 'text-white' },
  amber: { gradient: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-500/30', iconColor: 'text-white' },
  rose: { gradient: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-500/30', iconColor: 'text-white' },
  cyan: { gradient: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/30', iconColor: 'text-white' },
  purple: { gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', iconColor: 'text-white' },
  teal: { gradient: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/30', iconColor: 'text-white' },
  orange: { gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/30', iconColor: 'text-white' },
  slate: { gradient: 'from-slate-500 to-slate-600', shadow: 'shadow-slate-500/30', iconColor: 'text-white' },
};

interface Icon3DProps {
  icon: React.ElementType;
  size?: IconSize;
  variant?: IconVariant;
  animate?: boolean;
  className?: string;
}

export default function Icon3D({ icon: IconComponent, size = 'md', variant = 'blue', animate = true, className = '' }: Icon3DProps) {
  const s = SIZES[size];
  const v = VARIANTS[variant];

  return (
    <div
      className={`
        ${s.box} rounded-2xl flex items-center justify-center relative
        bg-gradient-to-br ${v.gradient}
        shadow-lg ${v.shadow}
        ${animate ? 'icon-3d' : ''}
        ${className}
      `}
    >
      {/* 3D shine layer */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent" />
      {/* Bottom edge for 3D depth */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-2xl bg-black/15" />
      <IconComponent className={`${s.icon} ${v.iconColor} relative z-10 drop-shadow-sm`} />
    </div>
  );
}

/* Soft/Pastel variant for lighter backgrounds */
export function Icon3DSoft({ icon: IconComponent, size = 'md', variant = 'blue', animate = true, className = '' }: Icon3DProps) {
  const s = SIZES[size];
  
  const SOFT: Record<IconVariant, { bg: string; iconColor: string; border: string }> = {
    blue: { bg: 'bg-blue-50', iconColor: 'text-blue-500', border: 'border-blue-100' },
    indigo: { bg: 'bg-indigo-50', iconColor: 'text-indigo-500', border: 'border-indigo-100' },
    violet: { bg: 'bg-violet-50', iconColor: 'text-violet-500', border: 'border-violet-100' },
    emerald: { bg: 'bg-emerald-50', iconColor: 'text-emerald-500', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', iconColor: 'text-amber-500', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', iconColor: 'text-rose-500', border: 'border-rose-100' },
    cyan: { bg: 'bg-cyan-50', iconColor: 'text-cyan-500', border: 'border-cyan-100' },
    purple: { bg: 'bg-purple-50', iconColor: 'text-purple-500', border: 'border-purple-100' },
    teal: { bg: 'bg-teal-50', iconColor: 'text-teal-500', border: 'border-teal-100' },
    orange: { bg: 'bg-orange-50', iconColor: 'text-orange-500', border: 'border-orange-100' },
    slate: { bg: 'bg-slate-100', iconColor: 'text-slate-500', border: 'border-slate-200' },
  };

  const sv = SOFT[variant];

  return (
    <div
      className={`
        ${s.box} rounded-2xl flex items-center justify-center relative
        ${sv.bg} border ${sv.border}
        shadow-sm
        ${animate ? 'icon-3d-soft' : ''}
        ${className}
      `}
    >
      <IconComponent className={`${s.icon} ${sv.iconColor} relative z-10`} />
    </div>
  );
}
