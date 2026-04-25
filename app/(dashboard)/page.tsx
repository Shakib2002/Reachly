'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  Briefcase,
  Users,
  Mail,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const stats = [
  {
    title: 'Total Leads',
    value: '0',
    change: '+0%',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Applications',
    value: '0',
    change: '+0%',
    icon: Briefcase,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    title: 'Emails Sent',
    value: '0',
    change: '+0%',
    icon: Mail,
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    title: 'Response Rate',
    value: '0%',
    change: '+0%',
    icon: TrendingUp,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
];

const quickActions = [
  { label: 'Add Lead', href: '/crm', icon: Plus },
  { label: 'Discover Jobs', href: '/discover', icon: Briefcase },
  { label: 'Send Email', href: '/outreach', icon: Mail },
  { label: 'View Analytics', href: '/analytics', icon: TrendingUp },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-blue-100 mt-2 text-sm lg:text-base max-w-xl">
            Track your job applications, manage leads, and close more
            opportunities — all from one place.
          </p>
          <div className="flex gap-3 mt-5">
            <Link
              href="/crm"
              className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-700/20"
            >
              Add a Lead
            </Link>
            <Link
              href="/discover"
              className="bg-white/15 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
            >
              Discover Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {stat.change}
              </span>
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
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e293b] transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <action.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-500" />
                </div>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Recent Activity
          </h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">No recent activity</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Start by adding a lead or discovering new job opportunities to see
              your activity here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
