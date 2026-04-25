'use client';

import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';

const metrics = [
  {
    title: 'Total Leads',
    value: '0',
    change: '0%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Applications Sent',
    value: '0',
    change: '0%',
    trend: 'up',
    icon: Briefcase,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Emails Delivered',
    value: '0',
    change: '0%',
    trend: 'up',
    icon: Mail,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    title: 'Response Rate',
    value: '0%',
    change: '0%',
    trend: 'neutral',
    icon: TrendingUp,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your performance and optimize your workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 bg-white">
            <Calendar className="w-4 h-4" />
            Last 30 days
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${metric.bgColor} rounded-xl flex items-center justify-center`}
              >
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-0.5 ${
                  metric.trend === 'up'
                    ? 'text-emerald-600 bg-emerald-50'
                    : metric.trend === 'down'
                    ? 'text-red-600 bg-red-50'
                    : 'text-slate-500 bg-slate-50'
                }`}
              >
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : metric.trend === 'down' ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : null}
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1e293b]">{metric.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{metric.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Applications Over Time */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Applications Over Time
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                Chart will populate with data
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Powered by Recharts
              </p>
            </div>
          </div>
        </div>

        {/* Lead Funnel */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Lead Funnel
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                Funnel will populate with data
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Track conversion rates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sources & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Sources */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Top Sources
          </h3>
          <div className="space-y-3">
            {['LinkedIn', 'Indeed', 'Company Site', 'Referral'].map(
              (source) => (
                <div
                  key={source}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-slate-600">{source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-blue-500 rounded-full" />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">0</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-5">
          <h3 className="text-base font-semibold text-[#1e293b] mb-4">
            Weekly Activity
          </h3>
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-500">
              Activity data will appear as you use the platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
