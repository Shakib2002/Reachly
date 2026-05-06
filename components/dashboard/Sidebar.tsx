'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Search,
  Kanban,
  Mail,
  BarChart2,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Crown,
} from 'lucide-react';
import { TourTrigger } from '@/components/onboarding/GuidedTour';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, id: 'nav-dashboard' },
  { name: 'Discover', href: '/discover', icon: Search, id: 'nav-discover' },
  { name: 'CRM Pipeline', href: '/crm', icon: Kanban, id: 'nav-crm' },
  { name: 'Outreach', href: '/outreach', icon: Mail, id: 'nav-outreach' },
  { name: 'Analytics', href: '/analytics', icon: BarChart2, id: 'nav-analytics' },
  { name: 'Settings', href: '/settings', icon: Settings, id: 'nav-settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const fullName = user?.user_metadata?.full_name || 'User';
  const email = user?.email || '';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => pathname === href || (href !== '/discover' && href !== '/dashboard' && pathname.startsWith(href));

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Logo Section */}
      <div className={`px-5 pt-6 pb-4 ${collapsed ? 'px-3' : ''}`}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 ring-1 ring-white/10">
            <span className="text-white text-lg font-black">R</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight leading-none">
                Reachly
              </h1>
              <p className="text-gray-400 text-[10px] font-medium tracking-wider mt-0.5">
                FIND. TRACK. CLOSE.
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 mt-2 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        <p className={`text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 ${collapsed ? 'text-center' : 'px-3'}`}>
          {collapsed ? '—' : 'Menu'}
        </p>
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              id={item.id}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full" />
              )}
              <item.icon
                className={`w-[18px] h-[18px] flex-shrink-0 ${
                  active ? 'text-white' : 'text-gray-500 group-hover:text-white'
                }`}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className={`mt-auto border-t border-white/[0.06] ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-3`}>
        {/* Take Tour */}
        {!collapsed && <TourTrigger />}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={`hidden lg:flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* User Profile */}
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-blue-400/20 shadow-md shadow-blue-500/20">
            {initials || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {fullName}
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] text-gray-400 truncate">{email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan badge */}
        {!collapsed && (
          <div className="mx-2 px-3 py-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Free Plan</span>
              </div>
              <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1" aria-label="Upgrade plan">
                <Crown className="w-3 h-3" />
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
