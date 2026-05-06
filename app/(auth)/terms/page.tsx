import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — Reachly',
  description: 'Terms of Service for using the Reachly platform.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Terms of Service</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: {new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the Reachly platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">2. Use of Service</h2>
            <p>You must be at least 18 years old to use Reachly. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">3. User Content</h2>
            <p>You retain ownership of all data you submit. We do not sell your personal data to third parties. You grant us a limited license to process your data solely to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">4. Prohibited Uses</h2>
            <p>You agree not to: (a) use the Service for any unlawful purpose, (b) transmit spam or unsolicited emails, (c) attempt to reverse engineer the Service, (d) violate the rights of others.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">5. Limitation of Liability</h2>
            <p>Reachly is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">6. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these terms. You may delete your account at any time from the Settings page.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#1e293b] mb-2">7. Contact</h2>
            <p>For questions about these terms, contact us at <span className="text-blue-600 font-medium">support@reachly.app</span>.</p>
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
