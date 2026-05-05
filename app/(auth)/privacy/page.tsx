import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Reachly',
  description: 'Privacy Policy for the Reachly platform.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: {new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email, and any lead/client data you enter. We also collect usage data such as pages visited, features used, and device information.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">2. How We Use Your Information</h2>
            <p>Your data is used to: (a) provide and improve the Service, (b) send transactional emails (follow-ups, password resets), (c) generate analytics and AI insights, (d) ensure platform security.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">3. Data Storage & Security</h2>
            <p>Your data is stored securely on Supabase infrastructure with row-level security (RLS) policies. We use encryption in transit (TLS) and enforce strict access controls.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">4. Third-Party Services</h2>
            <p>We integrate with third-party services including Stripe (payments), Resend (email delivery), and AI providers. These services have their own privacy policies. We do not sell your data to any third party.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You can request data deletion at any time by deleting your account from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">6. Your Rights</h2>
            <p>You have the right to: (a) access your data, (b) correct inaccurate data, (c) delete your account and data, (d) export your data via the Analytics page CSV export.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">8. Contact</h2>
            <p>For privacy inquiries, contact us at <span className="text-blue-600 font-medium">privacy@reachly.app</span>.</p>
          </section>
        </div>

        <div className="text-center mt-8">
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold text-sm inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}
