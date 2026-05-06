'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Zap, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PLANS = [
  { id:'free', name:'Free', price:0, annual:0, color:'border-slate-200', badge:'',
    features:['50 leads/month','100 emails/month','20 job searches','Basic CRM','Manual lead entry'],
    no:['AI email generation','Advanced analytics','Auto sequences','Priority support'],
    cta:'Get Started Free', href:'/register' },
  { id:'pro', name:'Pro', price:29, annual:23, color:'border-blue-400 ring-2 ring-blue-100', badge:'Most Popular',
    features:['Unlimited leads','2,000 emails/month','Unlimited job searches','AI email generation','Advanced analytics','Auto sequences','All integrations'],
    no:['Team members','Shared CRM'],
    cta:'Start Pro Trial', href:'' },
  { id:'team', name:'Team', price:79, annual:63, color:'border-violet-400', badge:'',
    features:['Everything in Pro','5 team members','Shared CRM pipeline','10,000 emails/month','Priority support','Custom integrations'],
    no:[],
    cta:'Start Team Trial', href:'' },
];

const FAQ = [
  { q:'Can I cancel anytime?', a:'Yes, you can cancel your subscription at any time from Settings. Your account will revert to the Free plan at the end of the billing cycle.' },
  { q:'Is there a free trial?', a:'Pro and Team plans come with a 14-day free trial. No credit card required to start.' },
  { q:'What happens when I hit my limits?', a:'You\'ll see an upgrade prompt. Your existing data is never deleted — you just can\'t add new items until you upgrade or wait for the next month.' },
  { q:'Can I change plans later?', a:'Absolutely. Upgrade or downgrade at any time. Changes take effect immediately, with prorated billing.' },
  { q:'Do you offer refunds?', a:'We offer a 30-day money-back guarantee on all paid plans. No questions asked.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState('');
  const [openFaq, setOpenFaq] = useState(-1);
  const router = useRouter();

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, annual }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else router.push('/register');
    } catch { router.push('/register'); }
    finally { setLoading(''); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">R</div>
          <span className="text-lg font-bold text-[#1e293b]">Reachly</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-700">Log in</Link>
          <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-16 pb-10 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1e293b] tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-slate-400 mt-3 text-lg max-w-md mx-auto">Choose the plan that fits your outreach goals. No hidden fees.</p>
        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!annual ? 'text-[#1e293b]' : 'text-slate-400'}`}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full p-0.5 transition-colors ${annual ? 'bg-blue-500' : 'bg-slate-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-[#1e293b]' : 'text-slate-400'}`}>Annual</span>
          {annual && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-200">Save 20%</span>}
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-5 pb-16">
        {PLANS.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl border-2 ${p.color} p-6 flex flex-col relative`}>
            {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg">{p.badge}</span>}
            <h3 className="text-lg font-bold text-[#1e293b]">{p.name}</h3>
            <div className="mt-3 mb-5">
              <span className="text-4xl font-extrabold text-[#1e293b]">${annual ? p.annual : p.price}</span>
              {p.price > 0 && <span className="text-slate-400 text-sm">/month</span>}
              {annual && p.price > 0 && <p className="text-[11px] text-slate-400 mt-0.5">Billed ${p.annual * 12}/year</p>}
            </div>
            <div className="flex-1 space-y-2.5 mb-6">
              {p.features.map(f => (
                <div key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{f}</div>
              ))}
              {p.no.map(f => (
                <div key={f} className="flex items-start gap-2 text-sm text-slate-300"><X className="w-4 h-4 flex-shrink-0 mt-0.5" />{f}</div>
              ))}
            </div>
            {p.href ? (
              <Link href={p.href} className="w-full py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-center block">
                {p.cta}
              </Link>
            ) : (
              <button onClick={() => handleCheckout(p.id)} disabled={!!loading}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${p.id === 'pro' ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700' : 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-purple-700'}`}>
                {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.id === 'pro' ? <Sparkles className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {p.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-[#1e293b] text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-semibold text-[#1e293b]">{f.q}</span>
                <Zap className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
