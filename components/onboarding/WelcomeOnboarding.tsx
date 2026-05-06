'use client';

import { useState, useEffect } from 'react';
import {
  Rocket, Search, Users, Mail, BarChart3, ArrowRight,
  CheckCircle2, Circle, X, Sparkles, Target, Zap,
  Globe, MousePointerClick, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bg: string;
  action: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'find_leads',
    title: 'Find Your First Leads',
    description: 'Search for jobs, companies, or use Google Maps to discover local businesses in your niche.',
    icon: Search,
    href: '/discover',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    action: 'Go to Discover →',
  },
  {
    id: 'save_crm',
    title: 'Save Leads to CRM',
    description: 'Click "Save to CRM" on any lead to add it to your pipeline. Organize leads by status: New → Applied → In Progress → Converted.',
    icon: Users,
    href: '/crm',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    action: 'Open CRM →',
  },
  {
    id: 'create_template',
    title: 'Create Email Templates',
    description: 'Build personalized outreach templates with AI. Use variables like {{company}}, {{name}} for auto-personalization.',
    icon: Mail,
    href: '/outreach',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    action: 'Create Template →',
  },
  {
    id: 'send_outreach',
    title: 'Send Your First Campaign',
    description: 'Select leads from your CRM, pick a template, and send personalized emails at scale. Track opens, clicks, and replies.',
    icon: Zap,
    href: '/outreach',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    action: 'Send Outreach →',
  },
  {
    id: 'track_analytics',
    title: 'Track Your Results',
    description: 'Monitor your pipeline, conversion rates, and AI-powered insights. See what\'s working and optimize.',
    icon: BarChart3,
    href: '/analytics',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    action: 'View Analytics →',
  },
];

const FEATURES = [
  { icon: Search, label: 'Lead Discovery', desc: 'Find prospects via job boards, Google Maps, and email finder' },
  { icon: Users, label: 'CRM Pipeline', desc: 'Kanban board to track every deal from lead to conversion' },
  { icon: Mail, label: 'Email Outreach', desc: 'AI templates, A/B testing, sequences, and tracking' },
  { icon: Globe, label: 'LinkedIn Automation', desc: 'Profile visits, connections, and DM sequences' },
  { icon: Target, label: 'Deliverability Suite', desc: 'Email warmup, health score, and inbox placement' },
  { icon: BarChart3, label: 'Analytics & Insights', desc: 'AI-powered reporting and conversion analytics' },
];

export default function WelcomeOnboarding({ userName }: { userName: string }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const onboarded = localStorage.getItem('reachly_onboarded');
    const savedSteps = localStorage.getItem('reachly_onboarding_steps');
    const welcomeDismissed = localStorage.getItem('reachly_welcome_dismissed');

    if (!onboarded) {
      setShowWelcome(true);
      localStorage.setItem('reachly_onboarded', 'true');
    }
    if (savedSteps) {
      setCompletedSteps(JSON.parse(savedSteps));
    }
    if (welcomeDismissed) {
      setDismissed(true);
    }
  }, []);

  const completeStep = (stepId: string) => {
    const updated = Array.from(new Set([...completedSteps, stepId]));
    setCompletedSteps(updated);
    localStorage.setItem('reachly_onboarding_steps', JSON.stringify(updated));
  };

  const dismissChecklist = () => {
    setDismissed(true);
    localStorage.setItem('reachly_welcome_dismissed', 'true');
  };

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);
  const allComplete = completedSteps.length === STEPS.length;

  return (
    <>
      {/* Welcome Modal — only on first visit */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            {currentSlide === 0 && (
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Welcome to Reachly! 🎉</h2>
                  <p className="text-blue-100 mt-2 text-sm">
                    Hi <strong>{userName}</strong>! Your all-in-one outreach & lead generation platform is ready.
                  </p>
                </div>
              </div>
            )}

            {currentSlide === 0 && (
              <div className="p-6">
                <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Here&apos;s what you can do
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {FEATURES.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                        <Icon className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-semibold text-[#1e293b]">{f.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentSlide(1)}
                  className="w-full mt-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  Show Me How <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 py-2 transition-colors"
                >
                  I&apos;ll figure it out myself
                </button>
              </div>
            )}

            {currentSlide === 1 && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#1e293b] flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5 text-blue-500" /> Your 5-Step Workflow
                  </h3>
                  <span className="text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Quick Guide</span>
                </div>

                <div className="space-y-3">
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex items-start gap-3 group">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 ${step.bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-4 h-4 ${step.color}`} />
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className="w-px h-4 bg-slate-200 mt-1" />
                          )}
                        </div>
                        <div className="pt-0.5">
                          <p className="text-xs font-bold text-[#1e293b]">
                            <span className="text-slate-300 mr-1">Step {idx + 1}.</span> {step.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full mt-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  Let&apos;s Get Started! <Rocket className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Getting Started Checklist — persists on dashboard until all done or dismissed */}
      {!dismissed && !allComplete && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {/* Checklist Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-blue-500" /> Getting Started
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Complete these steps to set up your outreach machine</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{completedSteps.length}/{STEPS.length}</span>
                </div>
                <button onClick={dismissChecklist} className="text-slate-300 hover:text-slate-500 transition-colors" title="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="divide-y divide-slate-50">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const done = completedSteps.includes(step.id);
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={() => completeStep(step.id)}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-all group ${done ? 'opacity-60' : ''}`}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                  )}
                  <div className={`w-8 h-8 ${step.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${done ? 'text-slate-400 line-through' : 'text-[#1e293b]'}`}>{step.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {step.action} <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion celebration */}
      {allComplete && !dismissed && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">You&apos;re all set! 🎉</p>
              <p className="text-xs text-emerald-100 mt-0.5">You&apos;ve completed all onboarding steps. Happy outreaching!</p>
            </div>
          </div>
          <button onClick={dismissChecklist} className="text-emerald-200 hover:text-white text-xs font-semibold px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
