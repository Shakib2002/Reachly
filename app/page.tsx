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
const FEATURES = [
  {icon:Search,t:"Find Jobs & Leads Instantly",d:"Search thousands of jobs from Indeed and find leads with Hunter integration. Save anything to your CRM with one click.",tag:"Discover"},
  {icon:Kanban,t:"Track Everything with Visual Pipeline",d:"Drag and drop Kanban board keeps you organized. Never lose track of where you stand with any opportunity.",tag:"CRM Pipeline"},
  {icon:Mail,t:"AI-Powered Email Outreach",d:"Generate personalized emails with AI, send sequences, and track who opens and replies.",tag:"Outreach"},
  {icon:BarChart3,t:"Insights That Drive Results",d:"Track conversion rates, best sources, and get AI-powered recommendations to improve your strategy.",tag:"Analytics"},
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

      {/* Problem */}
      <section className="py-20 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-[#1e293b] mb-10 font-display reveal">Sound familiar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[{e:'🔄',t:'Switching between 5+ tools daily',d:'Job boards, CRM, email, analytics — all separate'},{e:'😵',t:'Losing track of applications',d:'Which jobs did you apply to? When? No clue.'},{e:'✍️',t:'Writing the same email over and over',d:'Copy-pasting the same template 50 times a week'}].map((p,i)=>(
              <div key={i} className={`glass-card rounded-2xl p-6 reveal delay-${i+1}`}>
                <span className="text-3xl">{p.e}</span><h3 className="text-sm font-bold text-[#1e293b] mt-3 mb-1 font-display">{p.t}</h3><p className="text-xs text-slate-400">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-slate-300"><ChevronDown className="w-8 h-8 mx-auto animate-bounce"/></div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/80 bg-dots">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal"><h2 className="text-3xl font-extrabold text-[#1e293b] font-display">Everything you need, in one place</h2><p className="text-slate-400 mt-2">Four powerful modules working together seamlessly</p></div>
          <div className="space-y-20">
            {FEATURES.map((f,i)=>(
              <div key={i} className={`flex flex-col ${i%2===0?'lg:flex-row':'lg:flex-row-reverse'} items-center gap-12 reveal`}>
                <div className="flex-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold mb-3"><f.icon className="w-3.5 h-3.5"/>{f.tag}</span>
                  <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">{f.t}</h3>
                  <p className="text-slate-500 leading-relaxed">{f.d}</p>
                  <Link href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 mt-4 hover:gap-3 transition-all">Try it free <ArrowRight className="w-4 h-4"/></Link>
                </div>
                <div className="flex-1 w-full">
                  <div className="glass-card rounded-2xl p-8 h-56 flex items-center justify-center glow-blue">
                    <Icon3D icon={f.icon} size="xl" variant={(['blue','indigo','violet','cyan'] as const)[i]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-[#1e293b] mb-12 font-display reveal">Get started in 3 simple steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{n:'01',icon:Search,t:'Search & Discover',d:'Search for jobs or leads using our powerful search. Filter by location, skills, salary.',v:'blue' as const},{n:'02',icon:Zap,t:'Save & Organize',d:'Save opportunities to your pipeline with one click. Organize with drag and drop.',v:'indigo' as const},{n:'03',icon:Mail,t:'Reach Out & Close',d:'Send AI-powered personalized emails. Follow up automatically. Land the opportunity.',v:'emerald' as const}].map(s=>(
              <div key={s.n} className="text-center group reveal">
                <span className="text-5xl font-extrabold text-blue-100 group-hover:text-blue-200 transition-colors">{s.n}</span>
                <div className="flex justify-center mt-3 mb-4"><Icon3D icon={s.icon} size="lg" variant={s.v} /></div>
                <h3 className="text-base font-bold text-[#1e293b] mb-2 font-display">{s.t}</h3>
                <p className="text-sm text-slate-400">{s.d}</p>
              </div>
            ))}
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
