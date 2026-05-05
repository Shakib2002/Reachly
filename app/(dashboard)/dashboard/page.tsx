'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeadStore } from '@/lib/store';
import { useFollowUps } from '@/hooks/useFollowUps';
import Link from 'next/link';
import WelcomeOnboarding from '@/components/onboarding/WelcomeOnboarding';
import GuidedTour from '@/components/onboarding/GuidedTour';
import {
  TrendingUp,
  Send,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Mail,
  Briefcase,
  Users,
  UserPlus,
  MailCheck,
  ArrowRight,
  Rocket,
  Bell,
  XCircle,
  Calendar,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { LeadStatus } from '@/types';

// Skeleton loader
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`}
    />
  );
}

// Status badge component
function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    new: 'bg-blue-50 text-blue-600 border-blue-100',
    applied: 'bg-amber-50 text-amber-600 border-amber-100',
    interview: 'bg-purple-50 text-purple-600 border-purple-100',
    offer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    closed: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${
        styles[status] || styles.new
      }`}
    >
      {status}
    </span>
  );
}

// Activity icon mapper
function ActivityIcon({ action }: { action: string }) {
  const map: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
    lead_added: { icon: UserPlus, bg: 'bg-blue-50', color: 'text-blue-500' },
    status_changed: { icon: ArrowRight, bg: 'bg-purple-50', color: 'text-purple-500' },
    email_sent: { icon: MailCheck, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  };
  const style = map[action] || map.lead_added;
  const Icon = style.icon;
  return (
    <div className={`w-8 h-8 ${style.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${style.color}`} />
    </div>
  );
}

// Empty state component
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    recentLeads,
    activities,
    stats,
    loading,
    fetchLeads,
    fetchActivities,
    subscribeToChanges,
    setAddLeadModalOpen,
  } = useLeadStore();
  const { followUps, loading: _fuLoading, getUpcomingFollowUps, cancelFollowUp, sendFollowUpNow } = useFollowUps();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] 
    || user?.email?.split('@')[0] 
    || 'there';

  useEffect(() => {
    fetchLeads();
    fetchActivities();
    getUpcomingFollowUps();
    const unsub = subscribeToChanges();
    return () => unsub();
  }, [fetchLeads, fetchActivities, subscribeToChanges, getUpcomingFollowUps]);

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      change: `+${stats.weeklyChange}%`,
      icon: TrendingUp,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Applied',
      value: stats.applied,
      change: stats.applied > 0 ? `${Math.round((stats.applied / Math.max(stats.totalLeads, 1)) * 100)}%` : '0%',
      icon: Send,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      iconBg: 'from-amber-500 to-amber-600',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      change: stats.inProgress > 0 ? `${Math.round((stats.inProgress / Math.max(stats.totalLeads, 1)) * 100)}%` : '0%',
      icon: Clock,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconBg: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Converted',
      value: stats.converted,
      change: stats.converted > 0 ? `${Math.round((stats.converted / Math.max(stats.totalLeads, 1)) * 100)}%` : '0%',
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.06] rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/[0.04] rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/[0.05] rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-blue-200" />
            <span className="text-blue-200 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold mt-1">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-blue-100/80 mt-2 text-sm lg:text-base max-w-xl">
            Find leads, send personalized emails, and close deals — your complete outreach toolkit. Start by discovering prospects below! 👇
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => setAddLeadModalOpen(true)}
              className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg shadow-blue-800/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
            <Link
              href="/discover"
              className="bg-white/15 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Jobs
            </Link>
            <Link
              href="/outreach"
              className="bg-white/15 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Outreach
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding — Welcome Modal + Getting Started Checklist */}
      <WelcomeOnboarding userName={firstName} />
      <GuidedTour />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="w-14 h-5 rounded-lg" />
                </div>
                <Skeleton className="w-16 h-8 mb-1" />
                <Skeleton className="w-24 h-4" />
              </div>
            ))
          : statCards.map((stat) => (
              <div
                key={stat.title}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-md hover:border-slate-300/80 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                  </div>
                  {(() => {
                    const _isPercent = stat.change.includes('%');
                    const numVal = parseFloat(stat.change.replace(/[^\d.-]/g, ''));
                    const isPositive = numVal > 0;
                    const isZero = numVal === 0;
                    const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;
                    const badgeColor = isZero
                      ? 'text-slate-500 bg-slate-50 border-slate-200'
                      : isPositive
                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                        : 'text-red-500 bg-red-50 border-red-100';
                    return (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-0.5 border ${badgeColor}`}>
                        {!isZero && <Arrow className="w-3 h-3" />}
                        {stat.change}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-2xl font-bold text-[#1e293b]">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.title}</p>
              </div>
            ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider mb-4">
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            {[
              { label: 'Add New Lead', icon: Plus, onClick: () => setAddLeadModalOpen(true), color: 'group-hover:bg-blue-50 group-hover:text-blue-500' },
              { label: 'Search Jobs', icon: Search, href: '/discover', color: 'group-hover:bg-emerald-50 group-hover:text-emerald-500' },
              { label: 'Send Outreach', icon: Mail, href: '/outreach', color: 'group-hover:bg-violet-50 group-hover:text-violet-500' },
              { label: 'View Analytics', icon: Briefcase, href: '/analytics', color: 'group-hover:bg-amber-50 group-hover:text-amber-500' },
            ].map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-[#1e293b] hover:bg-slate-50 transition-all duration-200 group"
                >
                  <div className={`w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center transition-colors ${action.color}`}>
                    <action.icon className="w-4 h-4 text-slate-500 group-hover:text-inherit transition-colors" />
                  </div>
                  <span>{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ) : (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-[#1e293b] hover:bg-slate-50 transition-all duration-200 group w-full"
                >
                  <div className={`w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center transition-colors ${action.color}`}>
                    <action.icon className="w-4 h-4 text-slate-500 group-hover:text-inherit transition-colors" />
                  </div>
                  <span>{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">
              Recent Activity
            </h3>
            {activities.length > 0 && (
              <Link
                href="/analytics"
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="w-3/4 h-4 mb-1.5" />
                    <Skeleton className="w-1/3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-1">
              {activities.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ActivityIcon action={activity.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No recent activity"
              description="Start by adding a lead or discovering new job opportunities to see your activity here."
            />
          )}
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      {followUps.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />Upcoming Follow-ups
            </h3>
            <Link href="/outreach" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">View all</Link>
          </div>
          <div className="space-y-2">
            {followUps.slice(0, 5).map(fu => (
              <div key={fu.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1e293b] truncate max-w-[300px]">{fu.subject}</p>
                    <p className="text-[10px] text-slate-400">{new Date(fu.scheduled_date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} · {fu.lead_type === 'client' ? 'Client' : 'Job'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => sendFollowUpNow(fu.id)} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1">
                    <Send className="w-3 h-3" />Send Now
                  </button>
                  <button onClick={() => cancelFollowUp(fu.id)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
                    <XCircle className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">
            Recent Leads
          </h3>
          {recentLeads.length > 0 && (
            <Link
              href="/crm"
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-16 h-5 rounded-md" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        ) : recentLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                    Source
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                          {lead.title?.[0]?.toUpperCase() || 'L'}
                        </div>
                        <span className="text-sm font-medium text-[#1e293b] truncate max-w-[200px]">
                          {lead.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {lead.company || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 hidden sm:table-cell">
                      {lead.source || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 hidden md:table-cell">
                      {formatRelativeTime(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Start tracking your job applications and business opportunities by adding your first lead."
            actionLabel="Add Your First Lead"
            onAction={() => setAddLeadModalOpen(true)}
          />
        )}
      </div>
    </div>
  );
}
