'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon3D from '@/components/ui/Icon3D';
import { Search, BarChart3, Mail, Kanban, ChevronDown, Play, Star, Menu, Check, Zap, ArrowRight } from 'lucide-react';

const NAV = ['Features','Pricing','About'];
const TESTIMONIALS = [
  {q:"Reachly helped me land 3 interviews in 2 weeks. The CRM is a game changer.",n:"Sarah K.",r:"Software Engineer",img:"/images/reviews/sarah.png"},
  {q:"I manage all my freelance leads here. Saves me 2 hours every day.",n:"Ahmed R.",r:"Freelancer",img:"/images/reviews/ahmed.png"},
  {q:"The AI email feature is incredible. My response rate doubled.",n:"Maria L.",r:"Sales Rep",img:"/images/reviews/maria.png"},
  {q:"Finally one tool for everything. I cancelled 4 subscriptions.",n:"James T.",r:"Job Seeker",img:"/images/reviews/james.png"},
  {q:"The analytics showed me exactly what was working. Conversion up 40%.",n:"Lisa M.",r:"Recruiter",img:"/images/reviews/lisa.png"},
  {q:"Best investment for my job search. Got hired in 3 weeks.",n:"David C.",r:"Developer",img:"/images/reviews/david.png"},
];
const FAQ = [
  {q:"Is Reachly really free to start?",a:"Yes! Our Free plan includes 50 leads, 100 emails, and 20 job searches per month. No credit card required."},
  {q:"How does the AI email generation work?",a:"Our AI analyzes the job posting and lead info to generate personalized, professional outreach emails. You can edit before sending."},
  {q:"Can I import my existing leads?",a:"Yes, you can import leads via CSV or add them manually. We also support importing from LinkedIn and Apollo."},
  {q:"Which job boards do you support?",a:"We currently support Indeed, LinkedIn (coming soon), and multiple other sources via our JSearch API integration."},
  {q:"Is my data secure?",a:"Absolutely. We use Supabase with Row Level Security, ensuring your data is encrypted and only accessible by you."},
  {q:"Can I cancel anytime?",a:"Yes, cancel anytime from Settings. Your data is kept for 30 days after cancellation."},
];


export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);

    // Scroll-triggered reveal animations
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => { window.removeEventListener('scroll', h); observer.disconnect(); };
  }, []);

  return (
    <div className="min-h-screen bg-white bg-dots bg-noise overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/images/logo.png" alt="Reachly" width={36} height={36} className="rounded-xl shadow-lg shadow-blue-500/30" />
            <span className={`text-xl font-bold font-display transition-colors ${scrolled ? 'text-[#1e293b]' : 'text-white'}`}>Reachly</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map(n=><a key={n} href={`#${n.toLowerCase()}`} className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-[#1e293b]' : 'text-blue-100 hover:text-white'}`}>{n}</a>)}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className={`px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-[#1e293b]' : 'text-blue-100 hover:text-white'}`}>Login</Link>
            <Link href="/register" className={`px-5 py-2.5 text-sm font-semibold rounded-full shadow-lg transition-all ${scrolled ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25' : 'bg-white text-blue-600 shadow-black/10 hover:shadow-black/20'}`}>Get Started Free</Link>
          </div>
          <button onClick={()=>setMobileMenu(!mobileMenu)} className="md:hidden p-2"><Menu className={`w-5 h-5 ${scrolled ? 'text-slate-600' : 'text-white'}`}/></button>
        </div>
        {mobileMenu&&<div className="md:hidden bg-white border-t px-6 py-4 space-y-3 shadow-lg">
          {NAV.map(n=><a key={n} href={`#${n.toLowerCase()}`} onClick={()=>setMobileMenu(false)} className="block text-sm font-medium text-slate-600 py-2">{n}</a>)}
          <Link href="/login" className="block text-sm font-medium text-slate-600 py-2">Login</Link>
          <Link href="/register" className="block w-full text-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-full">Get Started Free</Link>
        </div>}
      </nav>

      {/* Hero — Clean blue monochromatic gradient */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Smooth blue gradient — navy to sky to white */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #0f2557 20%, #1e40af 42%, #3b82f6 60%, #93c5fd 78%, #dbeafe 90%, #ffffff 100%)'
        }} />
        {/* Orb 1 — Deep blue glow, top-left */}
        <div className="absolute -top-20 left-[15%] w-[700px] h-[700px] rounded-full opacity-25" style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.6) 0%, transparent 65%)',
          animation: 'orb-float-1 20s ease-in-out infinite'
        }} />
        {/* Orb 2 — Cyan accent, top-right */}
        <div className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.5) 0%, transparent 65%)',
          animation: 'orb-float-2 25s ease-in-out infinite'
        }} />
        {/* Orb 3 — Bright blue wash, bottom-center */}
        <div className="absolute -bottom-20 left-[40%] w-[900px] h-[500px] rounded-full opacity-15" style={{
          background: 'radial-gradient(ellipse, rgba(96,165,250,0.7) 0%, transparent 60%)',
          animation: 'orb-float-3 18s ease-in-out infinite'
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-blue-100 mb-6 hero-animate backdrop-blur-sm">🚀 Now with AI-powered outreach &amp; LinkedIn automation</div>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.1] tracking-tight font-display hero-animate hero-animate-delay-1">Close 10x More Deals<br/><span className="text-blue-200">Without the Busywork.</span></h1>
            <p className="mt-5 text-lg text-blue-100/80 max-w-lg mx-auto lg:mx-0 leading-relaxed hero-animate hero-animate-delay-2">Find prospects, send AI-personalized emails, and track every deal in one platform. Replace 5 tools with Reachly.</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 justify-center lg:justify-start hero-animate hero-animate-delay-3">
              <Link href="/register" className="px-8 py-3.5 bg-white text-blue-600 font-bold rounded-full shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-105 transition-all text-sm flex items-center gap-2">Start for Free <ArrowRight className="w-4 h-4"/></Link>
              <button className="px-6 py-3.5 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 backdrop-blur-sm text-sm flex items-center gap-2 transition-all"><Play className="w-4 h-4"/>Watch Demo</button>
            </div>
            <div className="flex items-center gap-3 mt-8 justify-center lg:justify-start hero-animate hero-animate-delay-4">
              <div className="flex -space-x-2">{['bg-blue-300','bg-cyan-300','bg-sky-300','bg-teal-300','bg-emerald-300'].map((c,i)=><div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white/50 flex items-center justify-center text-white text-[10px] font-bold shadow-lg`}>{String.fromCharCode(65+i)}</div>)}</div>
              <div><div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className="w-3.5 h-3.5 fill-amber-300 text-amber-300"/>)}</div><p className="text-[11px] text-blue-200/70 mt-0.5">Join 2,000+ professionals · 4.9/5</p></div>
            </div>
          </div>
          {/* Dashboard Mockup */}
          <div className="flex-1 relative max-w-lg w-full hero-animate hero-animate-delay-5">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex gap-1.5 mb-3">{['bg-red-400','bg-amber-400','bg-emerald-400'].map((c,i)=><div key={i} className={`w-2.5 h-2.5 ${c} rounded-full`}/>)}</div>
              <div className="grid grid-cols-4 gap-2 mb-3">{['New','Applied','Interview','Offer'].map((s,i)=><div key={s} className="text-center"><p className="text-[9px] font-bold text-blue-200/60 uppercase mb-1">{s}</p><div className={`h-1 rounded-full ${['bg-blue-400','bg-amber-400','bg-cyan-400','bg-emerald-400'][i]}`}/></div>)}</div>
              {[{c:'Google',t:'Senior React Dev',s:'bg-blue-500/20 text-blue-200'},{c:'Microsoft',t:'Full Stack Engineer',s:'bg-amber-500/20 text-amber-200'},{c:'Stripe',t:'Frontend Developer',s:'bg-cyan-500/20 text-cyan-200'}].map((j,i)=>(
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 mb-1.5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-200">{j.c[0]}</div><div><p className="text-xs font-semibold text-white">{j.t}</p><p className="text-[10px] text-blue-300/60">{j.c}</p></div></div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${j.s}`}>{['New','Applied','Interview'][i]}</span>
                </div>
              ))}
            </div>
            {/* Floating cards */}
            <div className="absolute -top-4 -right-4 bg-white/15 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 px-3 py-2 animate-float"><p className="text-[10px] font-semibold text-emerald-300">✓ New lead added: Google</p></div>
            <div className="absolute -bottom-2 -left-4 bg-white/15 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 px-3 py-2 animate-float-slow"><p className="text-[10px] font-semibold text-blue-200">📧 Email sent to Microsoft</p></div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
        <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest mb-6">Trusted by professionals from</p>
        <div className="relative"><div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10"/><div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10"/>
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {['Google','Microsoft','Amazon','Meta','Stripe','Indeed','Apollo','Netflix','Uber','Airbnb','Google','Microsoft','Amazon','Meta','Stripe','Indeed'].map((l,i)=>(
              <span key={i} className="text-xl font-bold text-slate-200 select-none">{l}</span>
            ))}
          </div>
        </div>
        <style jsx>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.animate-marquee{animation:marquee 20s linear infinite}`}</style>
      </section>

      {/* Problem — "Sound familiar?" */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Subtle red-tinted gradient background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fef2f2 30%, #fff1f2 50%, #fef2f2 70%, #ffffff 100%)'
        }} />
        <div className="absolute inset-0 bg-dots opacity-50" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Section header */}
          <div className="reveal">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-full text-[11px] font-bold mb-4 border border-red-100">😤 The Problem</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] mb-3 font-display">Sound familiar?</h2>
            <p className="text-slate-400 max-w-md mx-auto">Most professionals waste hours every week juggling disconnected tools. Here&apos;s what that looks like:</p>
          </div>

          {/* Pain point cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                emoji: '🔄',
                stat: '5+',
                statLabel: 'tools daily',
                title: 'Tool overload is killing your flow',
                desc: 'Job boards, CRM, email, analytics, notes — you\'re paying for 5 subscriptions and none of them talk to each other.',
                items: ['LinkedIn', 'Indeed', 'Gmail', 'Notion', 'HubSpot'],
              },
              {
                emoji: '😵‍💫',
                stat: '40%',
                statLabel: 'leads lost',
                title: 'Opportunities slip through cracks',
                desc: 'Which jobs did you apply to? When was the last follow-up? Important leads go cold because there\'s no system.',
                items: ['Missed follow-ups', 'Lost contacts', 'No tracking', 'Forgotten apps'],
              },
              {
                emoji: '⏰',
                stat: '2h+',
                statLabel: 'wasted daily',
                title: 'Same email, different name, repeat',
                desc: 'Copy-pasting the same template 50 times a week. Personalizing by hand. No idea who even opened it.',
                items: ['Manual copy-paste', 'No personalization', 'Zero tracking', 'No sequences'],
              },
            ].map((p, i) => (
              <div key={i} className={`bg-white rounded-2xl border border-red-100/60 p-6 text-left relative overflow-hidden hover:shadow-xl hover:shadow-red-100/50 transition-all duration-500 reveal delay-${i + 1} group`}>
                {/* Red accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-rose-400 rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Stat number */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{p.emoji}</span>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-red-500 font-display">{p.stat}</p>
                    <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">{p.statLabel}</p>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-[#1e293b] mb-2 font-display">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{p.desc}</p>

                {/* Crossed-out items (the old way) */}
                <div className="space-y-1.5">
                  {p.items.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-400 text-[10px] font-bold">✕</span>
                      </div>
                      <span className="text-xs text-slate-400 line-through decoration-red-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Transition to solution */}
          <div className="mt-14 reveal">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-px h-12 bg-gradient-to-b from-red-200 to-blue-400" />
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all cursor-default">
                ✨ There&apos;s a better way
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-blue-400 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-white to-slate-50/80 bg-dots">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold mb-4">✨ Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] font-display">Everything you need, in one place</h2>
            <p className="text-slate-400 mt-3 max-w-md mx-auto">Four powerful modules working together seamlessly to supercharge your outreach</p>
          </div>
          <div className="space-y-24">

            {/* Feature 1: Discover */}
            <div className="flex flex-col lg:flex-row items-center gap-12 reveal">
              <div className="flex-1">
                <Icon3D icon={Search} size="md" variant="blue" className="mb-4" />
                <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">Find Jobs & Leads Instantly</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Search thousands of jobs from Indeed and find leads with Hunter integration. Save anything to your CRM with one click.</p>
                <div className="space-y-2.5">
                  {['Indeed + LinkedIn job aggregation','Hunter.io email finder built-in','One-click save to your pipeline','Smart filters: location, salary, skills'].map(f=>(
                    <div key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0"/><span className="text-sm text-slate-600">{f}</span></div>
                  ))}
                </div>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-5 hover:gap-3 transition-all">Try it free <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-5 hover:shadow-2xl transition-shadow duration-500 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400 rounded-l-2xl" />
                  <div className="flex items-center gap-2 mb-4"><Search className="w-4 h-4 text-slate-400"/><div className="flex-1 h-9 bg-slate-100 rounded-lg flex items-center px-3"><span className="text-xs text-slate-400">Search &ldquo;React Developer in NYC&rdquo;...</span></div></div>
                  {[{t:'Senior React Developer',c:'Google',l:'NYC',s:'$180k',tag:'New'},{t:'Full Stack Engineer',c:'Stripe',l:'Remote',s:'$160k',tag:'Hot'},{t:'Frontend Lead',c:'Airbnb',l:'SF',s:'$200k',tag:'Saved'}].map((j,i)=>(
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 transition-colors mb-1 group/item">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${['bg-blue-500','bg-cyan-500','bg-teal-500'][i]}`}>{j.c[0]}</div>
                        <div><p className="text-sm font-semibold text-[#1e293b]">{j.t}</p><p className="text-[11px] text-slate-400">{j.c} · {j.l} · {j.s}</p></div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${['bg-blue-100 text-blue-600','bg-amber-100 text-amber-600','bg-emerald-100 text-emerald-600'][i]}`}>{j.tag}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"><span className="text-[11px] text-slate-400">2,847 results found</span><span className="text-[11px] font-semibold text-blue-600">View all →</span></div>
                </div>
              </div>
            </div>

            {/* Feature 2: CRM Pipeline */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 reveal">
              <div className="flex-1">
                <Icon3D icon={Kanban} size="md" variant="cyan" className="mb-4" />
                <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">Track Everything with Visual Pipeline</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Drag and drop Kanban board keeps you organized. Never lose track of where you stand with any opportunity.</p>
                <div className="space-y-2.5">
                  {['Drag & drop Kanban board','Custom pipeline stages','Follow-up reminders','Contact notes & activity log'].map(f=>(
                    <div key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0"/><span className="text-sm text-slate-600">{f}</span></div>
                  ))}
                </div>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-5 hover:gap-3 transition-all">Try it free <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-5 hover:shadow-2xl transition-shadow duration-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-teal-400 rounded-l-2xl" />
                  <div className="grid grid-cols-4 gap-3">
                    {[{s:'New',c:'bg-blue-500',n:12},{s:'Applied',c:'bg-amber-500',n:8},{s:'Interview',c:'bg-cyan-500',n:5},{s:'Offer',c:'bg-emerald-500',n:3}].map(col=>(
                      <div key={col.s}>
                        <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase">{col.s}</span><span className={`w-5 h-5 ${col.c} rounded-full text-[9px] text-white flex items-center justify-center font-bold`}>{col.n}</span></div>
                        {Array.from({length: Math.min(col.n, 3)}).map((_,j)=>(
                          <div key={j} className="bg-slate-50 rounded-lg p-2 mb-1.5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-grab">
                            <div className={`w-full h-0.5 ${col.c} rounded-full mb-1.5 opacity-60`}/>
                            <div className="h-2 bg-slate-200 rounded w-3/4 mb-1"/>
                            <div className="h-1.5 bg-slate-100 rounded w-1/2"/>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Email Outreach */}
            <div className="flex flex-col lg:flex-row items-center gap-12 reveal">
              <div className="flex-1">
                <Icon3D icon={Mail} size="md" variant="indigo" className="mb-4" />
                <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">AI-Powered Email Outreach</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Generate personalized emails with AI, send sequences, and track who opens and replies.</p>
                <div className="space-y-2.5">
                  {['GPT-4 powered email generation','Automated follow-up sequences','Open & click tracking','A/B testing built-in'].map(f=>(
                    <div key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0"/><span className="text-sm text-slate-600">{f}</span></div>
                  ))}
                </div>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-5 hover:gap-3 transition-all">Try it free <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-5 hover:shadow-2xl transition-shadow duration-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-blue-400 rounded-l-2xl" />
                  <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-indigo-500"/></div><span className="text-xs font-bold text-[#1e293b]">AI Email Composer</span><span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-bold rounded-full">AI Generated</span></div>
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-2"><span className="text-[10px] text-slate-400 w-8 flex-shrink-0">To:</span><span className="text-[10px] text-[#1e293b] font-medium">sarah.k@google.com</span></div>
                    <div className="flex gap-2"><span className="text-[10px] text-slate-400 w-8 flex-shrink-0">Subj:</span><span className="text-[10px] text-[#1e293b] font-medium">Quick question about the React role</span></div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                    <p className="text-[11px] text-slate-600 leading-relaxed">Hi Sarah, I noticed you&apos;re looking for a Senior React Developer. With 5+ years building scalable apps at top startups, I&apos;d love to chat about how I can contribute to your team...</p>
                  </div>
                  <div className="flex items-center justify-between"><div className="flex gap-1.5">{['😊','📎','⏰'].map((e,i)=><span key={i} className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs cursor-pointer hover:bg-slate-200 transition-colors">{e}</span>)}</div><button className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-md shadow-blue-500/20">Send ✨</button></div>
                </div>
              </div>
            </div>

            {/* Feature 4: Analytics */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 reveal">
              <div className="flex-1">
                <Icon3D icon={BarChart3} size="md" variant="emerald" className="mb-4" />
                <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">Insights That Drive Results</h3>
                <p className="text-slate-500 leading-relaxed mb-5">Track conversion rates, best sources, and get AI-powered recommendations to improve your strategy.</p>
                <div className="space-y-2.5">
                  {['Conversion funnel analytics','Source performance tracking','AI-powered suggestions','CSV export & reporting'].map(f=>(
                    <div key={f} className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0"/><span className="text-sm text-slate-600">{f}</span></div>
                  ))}
                </div>
                <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-5 hover:gap-3 transition-all">Try it free <ArrowRight className="w-4 h-4"/></Link>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-5 hover:shadow-2xl transition-shadow duration-500 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-400 rounded-l-2xl" />
                  <div className="flex items-center justify-between mb-4"><span className="text-xs font-bold text-[#1e293b]">This Month</span><div className="flex gap-1">{['1W','1M','3M'].map((p,i)=><span key={p} className={`px-2 py-0.5 text-[9px] font-bold rounded-md cursor-pointer ${i===1?'bg-emerald-100 text-emerald-600':'text-slate-400 hover:bg-slate-100'}`}>{p}</span>)}</div></div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{l:'Emails Sent',v:'1,247',c:'+23%',clr:'text-emerald-500'},{l:'Open Rate',v:'67.2%',c:'+8%',clr:'text-emerald-500'},{l:'Replies',v:'189',c:'+31%',clr:'text-emerald-500'}].map(s=>(
                      <div key={s.l} className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[9px] text-slate-400 font-medium uppercase">{s.l}</p><p className="text-lg font-extrabold text-[#1e293b] mt-0.5">{s.v}</p><p className={`text-[10px] font-bold ${s.clr}`}>{s.c}</p></div>
                    ))}
                  </div>
                  {/* Mini bar chart */}
                  <div className="flex items-end gap-1.5 h-16 px-2">{[40,65,45,80,60,90,75,55,85,70,95,65].map((h,i)=>(<div key={i} className="flex-1 rounded-t-sm transition-all hover:opacity-80" style={{height:`${h}%`,background:h>70?'linear-gradient(to top, #10b981, #34d399)':'#e2e8f0'}}/>))}</div>
                  <div className="flex justify-between mt-1.5 px-2">{['Jan','','Mar','','May','','Jul','','Sep','','Nov',''].map((m,i)=><span key={i} className="text-[8px] text-slate-300 flex-1 text-center">{m}</span>)}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 30%, #e8f2ff 50%, #f0f7ff 70%, #ffffff 100%)'
        }} />
        <div className="absolute inset-0 bg-dots opacity-40" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold mb-4 border border-blue-100">🚀 How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] font-display">Get started in 3 simple steps</h2>
            <p className="text-slate-400 mt-3 max-w-md mx-auto">From signup to your first deal — it takes less than 5 minutes</p>
          </div>

          {/* Steps with connecting line */}
          <div className="relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-0.5">
              <div className="w-full h-full bg-gradient-to-r from-blue-200 via-cyan-200 to-emerald-200 rounded-full" />
              <div className="absolute top-[-3px] left-0 w-2 h-2 bg-blue-400 rounded-full" />
              <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
              <div className="absolute top-[-3px] right-0 w-2 h-2 bg-emerald-400 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="reveal delay-1">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-500 group h-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-t-2xl" />

                  <div className="flex items-center justify-between mb-5">
                    <Icon3D icon={Search} size="md" variant="blue" />
                    <span className="w-10 h-10 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center text-sm font-extrabold text-blue-600 font-display">01</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1e293b] mb-1.5 font-display">Search &amp; Discover</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full text-[10px] font-semibold mb-3">⚡ Takes 30 seconds</span>

                  <p className="text-sm text-slate-400 leading-relaxed mb-4">Find jobs from Indeed or leads with Hunter. Smart filters help you find exactly what you need.</p>

                  {/* Mini visual */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-3 h-3 text-slate-300" />
                      <div className="h-5 bg-slate-200/80 rounded flex-1" />
                    </div>
                    {[85, 70, 55].map((w, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <div className={`w-5 h-5 rounded ${['bg-blue-100', 'bg-cyan-100', 'bg-teal-100'][i]} flex-shrink-0`} />
                        <div className="h-2 bg-slate-200/60 rounded" style={{ width: `${w}%` }} />
                        <div className={`w-8 h-3 rounded-full ${['bg-blue-100', 'bg-amber-100', 'bg-emerald-100'][i]}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="reveal delay-2">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-500 group h-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-t-2xl" />

                  <div className="flex items-center justify-between mb-5">
                    <Icon3D icon={Zap} size="md" variant="cyan" />
                    <span className="w-10 h-10 bg-cyan-50 border-2 border-cyan-200 rounded-full flex items-center justify-center text-sm font-extrabold text-cyan-600 font-display">02</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1e293b] mb-1.5 font-display">Save &amp; Organize</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-500 rounded-full text-[10px] font-semibold mb-3">🖱️ One click to save</span>

                  <p className="text-sm text-slate-400 leading-relaxed mb-4">Save to your pipeline instantly. Drag-and-drop Kanban keeps everything organized.</p>

                  {/* Mini Kanban */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[{ l: 'New', c: 'bg-blue-400', n: 3 }, { l: 'Active', c: 'bg-cyan-400', n: 2 }, { l: 'Won', c: 'bg-emerald-400', n: 1 }].map(col => (
                        <div key={col.l}>
                          <div className="flex items-center gap-1 mb-1"><div className={`w-1.5 h-1.5 ${col.c} rounded-full`} /><span className="text-[8px] font-bold text-slate-400 uppercase">{col.l}</span></div>
                          {Array.from({ length: col.n }).map((_, j) => (
                            <div key={j} className="bg-white rounded p-1.5 mb-1 border border-slate-100 shadow-sm">
                              <div className="h-1.5 bg-slate-200 rounded w-4/5 mb-0.5" />
                              <div className="h-1 bg-slate-100 rounded w-3/5" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="reveal delay-3">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-500 group h-full">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-t-2xl" />

                  <div className="flex items-center justify-between mb-5">
                    <Icon3D icon={Mail} size="md" variant="emerald" />
                    <span className="w-10 h-10 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center text-sm font-extrabold text-emerald-600 font-display">03</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1e293b] mb-1.5 font-display">Reach Out &amp; Close</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-full text-[10px] font-semibold mb-3">🤖 AI writes for you</span>

                  <p className="text-sm text-slate-400 leading-relaxed mb-4">AI generates personalized emails. Send, track opens, and follow up automatically.</p>

                  {/* Mini email */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Mail className="w-3 h-3 text-emerald-400" />
                      <span className="text-[8px] font-bold text-slate-400">AI Compose</span>
                      <span className="ml-auto px-1.5 py-0.5 bg-emerald-100 rounded text-[7px] font-bold text-emerald-500">SENT ✓</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-200/80 rounded w-full" />
                      <div className="h-1.5 bg-slate-200/60 rounded w-4/5" />
                      <div className="h-1.5 bg-slate-200/40 rounded w-3/5" />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <div className="px-2 py-1 bg-emerald-500 rounded text-[7px] text-white font-bold">Send ✨</div>
                      <div className="px-2 py-1 bg-slate-200 rounded text-[7px] text-slate-400 font-bold">Schedule</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-14 reveal">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all text-sm">
              Start Your Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">No credit card required · Free forever plan</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50/80 bg-dots">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1e293b] text-center mb-12 font-display reveal">What our users say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} className={`glass-card rounded-2xl p-5 reveal delay-${(i%3)+1}`}>
                <div className="flex gap-0.5 mb-3">{Array.from({length:5}).map((_,j)=><Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}</div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.q}&rdquo;</p>
                <div className="flex items-center gap-2.5"><Image src={t.img} alt={t.n} width={36} height={36} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100" /><div><p className="text-xs font-bold text-[#1e293b]">{t.n}</p><p className="text-[10px] text-slate-400">{t.r}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-[#1e293b] mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-400 mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[{n:'Free',p:'$0',f:['50 leads/month','100 emails','Basic CRM','20 job searches'],cta:'Get Started Free',href:'/register',pop:false},{n:'Pro',p:'$29',f:['Unlimited leads','2,000 emails','AI email generation','Advanced analytics','Auto sequences'],cta:'Start Pro Trial',href:'/pricing',pop:true},{n:'Team',p:'$79',f:['Everything in Pro','5 team members','10,000 emails','Priority support','Shared CRM'],cta:'Start Team Trial',href:'/pricing',pop:false}].map(p=>(
              <div key={p.n} className={`bg-white rounded-2xl border-2 p-6 flex flex-col relative ${p.pop?'border-blue-400 ring-2 ring-blue-100 scale-105':'border-slate-200'}`}>
                {p.pop&&<span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold rounded-full">Most Popular</span>}
                <h3 className="text-lg font-bold text-[#1e293b]">{p.n}</h3>
                <div className="mt-2 mb-5"><span className="text-3xl font-extrabold text-[#1e293b]">{p.p}</span>{p.p!=='$0'&&<span className="text-slate-400 text-sm">/mo</span>}</div>
                <div className="flex-1 space-y-2 mb-6">{p.f.map(f=><div key={f} className="flex items-center gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0"/>{f}</div>)}</div>
                <Link href={p.href} className={`w-full py-3 rounded-xl text-sm font-bold text-center block ${p.pop?'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25':'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 gradient-mesh">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1e293b] text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">{FAQ.map((f,i)=>(
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={()=>setOpenFaq(openFaq===i?-1:i)} className="w-full flex items-center justify-between px-5 py-4 text-left"><span className="text-sm font-semibold text-[#1e293b]">{f.q}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq===i?'rotate-180':''}`}/></button>
              {openFaq===i&&<div className="px-5 pb-4 text-sm text-slate-500">{f.a}</div>}
            </div>
          ))}</div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-12 shadow-2xl shadow-blue-500/20">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to land your dream opportunity?</h2>
          <p className="text-blue-100 mb-8">Join thousands of professionals using Reachly</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all text-sm">Get Started for Free <ArrowRight className="w-4 h-4"/></Link>
          <p className="text-blue-200 text-xs mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-[#0f172a] text-white pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3"><Image src="/images/logo.png" alt="Reachly" width={32} height={32} className="rounded-xl" /><span className="text-lg font-bold font-display">Reachly</span></div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">All-in-one outreach platform. Find prospects, send AI emails, and close more deals.</p>
            <div className="flex gap-3">{['𝕏','in','◆'].map((s,i)=><div key={i} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs hover:bg-white/20 cursor-pointer transition-colors">{s}</div>)}</div>
          </div>
          {[{t:'Product',l:['Features','Pricing','Changelog','Roadmap']},{t:'Company',l:['About','Blog','Careers','Press']},{t:'Legal',l:['Privacy','Terms','Cookies','Contact']}].map(c=>(
            <div key={c.t}><h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{c.t}</h4><ul className="space-y-2">{c.l.map(l=><li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{l}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 text-center"><p className="text-xs text-slate-500">© 2026 Reachly. All rights reserved. Made with ❤️</p></div>
      </footer>
    </div>
  );
}
