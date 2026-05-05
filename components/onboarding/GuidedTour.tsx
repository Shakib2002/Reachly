'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface TooltipStep {
  target: string; // selector or sidebar item id
  title: string;
  description: string;
  position: 'right' | 'bottom' | 'left';
}

const TOUR_STEPS: TooltipStep[] = [
  {
    target: 'nav-dashboard',
    title: '📊 Dashboard',
    description: 'Your home base. See stats, quick actions, and recent activity at a glance.',
    position: 'right',
  },
  {
    target: 'nav-discover',
    title: '🔍 Discover',
    description: 'Find leads! Search job boards, use Google Maps scraper, or look up emails by domain.',
    position: 'right',
  },
  {
    target: 'nav-crm',
    title: '📋 CRM Pipeline',
    description: 'Drag-and-drop Kanban board. Move leads through your pipeline: New → Applied → Interview → Offer → Closed.',
    position: 'right',
  },
  {
    target: 'nav-outreach',
    title: '✉️ Outreach',
    description: 'Create templates, send emails, build sequences, A/B test, and manage your inbox — all in one place.',
    position: 'right',
  },
  {
    target: 'nav-analytics',
    title: '📈 Analytics',
    description: 'Track conversion rates, response times, and get AI-powered insights on what\'s working.',
    position: 'right',
  },
  {
    target: 'nav-settings',
    title: '⚙️ Settings',
    description: 'Connect your email (Resend API), set up integrations, manage team members, and customize branding.',
    position: 'right',
  },
];

export default function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toured = localStorage.getItem('reachly_tour_done');
    if (!toured) {
      // Auto-start tour after 2 seconds on first visit
      const timer = setTimeout(() => setActive(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    const currentStep = TOUR_STEPS[step];
    const el = document.getElementById(currentStep.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Highlight the element
      el.style.position = 'relative';
      el.style.zIndex = '60';
      el.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.15)';
      el.style.borderRadius = '12px';
      el.style.transition = 'all 0.3s ease';

      if (currentStep.position === 'right') {
        setTooltipPos({
          top: rect.top + rect.height / 2 - 60,
          left: rect.right + 16,
        });
      }
    }

    return () => {
      // Clean up all highlights
      TOUR_STEPS.forEach(s => {
        const el2 = document.getElementById(s.target);
        if (el2) {
          el2.style.zIndex = '';
          el2.style.boxShadow = '';
        }
      });
    };
  }, [active, step]);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else endTour();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const endTour = () => {
    setActive(false);
    localStorage.setItem('reachly_tour_done', 'true');
    // Clean up
    TOUR_STEPS.forEach(s => {
      const el = document.getElementById(s.target);
      if (el) {
        el.style.zIndex = '';
        el.style.boxShadow = '';
      }
    });
  };

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={endTour} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[60] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-[#1e293b]">{currentStep.title}</h4>
            <button onClick={endTour} className="text-slate-300 hover:text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{currentStep.description}</p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-blue-500' : i < step ? 'bg-blue-300' : 'bg-slate-300'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prev} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 font-semibold">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 text-[11px] bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* Floating "Take Tour" button for returning users */
export function TourTrigger() {
  const handleStartTour = () => {
    localStorage.removeItem('reachly_tour_done');
    window.location.reload();
  };

  return (
    <button
      onClick={handleStartTour}
      className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-blue-500 font-semibold transition-colors px-3 py-2"
      title="Take a guided tour"
    >
      <Sparkles className="w-3.5 h-3.5" /> Take a Tour
    </button>
  );
}
