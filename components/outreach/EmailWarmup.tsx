'use client';

import { useState } from 'react';
import { Flame, Calendar, TrendingUp, CheckCircle2, Info, ExternalLink, Clock, ArrowRight } from 'lucide-react';

interface WarmupDay {
  day: number;
  target: number;
  status: 'completed' | 'today' | 'upcoming';
}

const WARMUP_SCHEDULE: WarmupDay[] = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  target: Math.min(5 + Math.floor(i * 1.8), 50),
  status: 'upcoming' as const,
}));

export default function EmailWarmup() {
  const [startDate, setStartDate] = useState('');
  const [started, setStarted] = useState(false);

  const getDayStatus = (day: number): 'completed' | 'today' | 'upcoming' => {
    if (!startDate) return 'upcoming';
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (day - 1 < diff) return 'completed';
    if (day - 1 === diff) return 'today';
    return 'upcoming';
  };

  const schedule = WARMUP_SCHEDULE.map(d => ({ ...d, status: getDayStatus(d.day) }));
  const completedDays = schedule.filter(d => d.status === 'completed').length;
  const todaySchedule = schedule.find(d => d.status === 'today');
  const progress = started ? Math.round((completedDays / 28) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Email Warmup
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Gradually increase sending volume to build domain reputation</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200/50 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-orange-800 mb-1">How Email Warmup Works</h4>
            <ul className="space-y-1 text-[11px] text-orange-700">
              <li>• New domains need <strong>2-4 weeks</strong> of warmup before cold outreach</li>
              <li>• Start with <strong>5 emails/day</strong> and gradually increase to <strong>50/day</strong></li>
              <li>• Send to real contacts who will <strong>open and reply</strong> to your emails</li>
              <li>• This builds sender reputation with Gmail, Outlook, and other providers</li>
              <li>• Without warmup, your emails go straight to <strong>spam</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Start Warmup */}
      {!started ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-base font-semibold text-[#1e293b]">Start Your Warmup Schedule</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">Select the date you started (or plan to start) sending emails from this domain. We&apos;ll track your 28-day warmup progress.</p>
          <div className="mt-4 flex items-center gap-3">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all" />
            <button onClick={() => { if (startDate) setStarted(true); }}
              disabled={!startDate}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
              <Flame className="w-4 h-4" /> Start Tracking
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-[#1e293b]">Warmup Progress</span>
              </div>
              <span className={`text-xs font-bold ${progress >= 100 ? 'text-emerald-500' : 'text-orange-500'}`}>
                Day {completedDays + 1} of 28 · {progress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }} />
            </div>
            {todaySchedule && (
              <p className="text-[11px] text-orange-600 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Today: Send up to <strong>{todaySchedule.target} emails</strong>
              </p>
            )}
          </div>

          {/* 28-Day Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <h4 className="text-xs font-bold text-[#1e293b] mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> 28-Day Warmup Schedule
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {schedule.map(d => (
                <div key={d.day}
                  className={`rounded-xl p-2 text-center border transition-all ${
                    d.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
                    d.status === 'today' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' :
                    'bg-slate-50 border-slate-100'
                  }`}>
                  <p className={`text-[10px] font-bold ${
                    d.status === 'completed' ? 'text-emerald-500' :
                    d.status === 'today' ? 'text-orange-600' : 'text-slate-300'
                  }`}>Day {d.day}</p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    d.status === 'completed' ? 'text-emerald-600' :
                    d.status === 'today' ? 'text-orange-700' : 'text-slate-400'
                  }`}>{d.target}</p>
                  <p className="text-[9px] text-slate-400">emails</p>
                  {d.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 mx-auto mt-0.5" />}
                  {d.status === 'today' && <ArrowRight className="w-3 h-3 text-orange-500 mx-auto mt-0.5" />}
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <h4 className="text-xs font-bold text-[#1e293b] mb-3">Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { tip: 'Use your real business email (not a new alias)', icon: '✅' },
                { tip: 'Reply to every bounce and unsubscribe request', icon: '📩' },
                { tip: 'Keep spam complaint rate below 0.1%', icon: '🛡️' },
                { tip: 'Set up SPF, DKIM, and DMARC DNS records', icon: '🔐' },
                { tip: 'Personalize every email — avoid generic blasts', icon: '✍️' },
                { tip: 'Monitor deliverability dashboard daily', icon: '📊' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[11px] text-slate-600">{item.tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* External Warmup Services */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <h4 className="text-xs font-bold text-[#1e293b] mb-2">Advanced: External Warmup Services</h4>
            <p className="text-[11px] text-slate-400 mb-3">For faster warmup, consider using a dedicated warmup network:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Lemwarm', url: 'https://lemwarm.com' },
                { name: 'Warmbox', url: 'https://warmbox.ai' },
                { name: 'Mailreach', url: 'https://mailreach.co' },
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                  {s.name} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
