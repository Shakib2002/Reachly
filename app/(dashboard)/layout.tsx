'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import AddLeadModal from '@/components/dashboard/AddLeadModal';
import AddClientModalGlobal from '@/components/dashboard/AddClientModalGlobal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative">
      {/* Subtle dashboard background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.03) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(56,189,248,0.02) 0%, transparent 50%)'}} />
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.5) 1px, transparent 1px)', backgroundSize:'32px 32px'}} />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1a30] to-[#0a1628]" />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/5 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent" />
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-4 right-3 p-1.5 hover:bg-white/10 rounded-lg z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative z-10">
          {children}
        </main>
      </div>

      {/* Global modals */}
      <AddLeadModal />
      <AddClientModalGlobal />
    </div>
  );
}
