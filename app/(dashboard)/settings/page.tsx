'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Shield, Bell, Plug, CreditCard, AlertTriangle, Loader2, Users, Building2 } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import ProfileSettings from '@/components/settings/ProfileSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import IntegrationSettings from '@/components/settings/IntegrationSettings';
import BillingSettings from '@/components/settings/BillingSettings';
import DangerZone from '@/components/settings/DangerZone';
import TeamSettings from '@/components/settings/TeamSettings';
import WhiteLabelSettings from '@/components/settings/WhiteLabelSettings';

const supabase = createBrowserSupabaseClient();

type Section = 'profile' | 'account' | 'notifications' | 'integrations' | 'billing' | 'team' | 'whitelabel' | 'danger';

const NAV: { id: Section; label: string; icon: typeof User; danger?: boolean }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'whitelabel', label: 'White-Label', icon: Building2 },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
];

interface Settings {
  full_name: string;
  job_title: string;
  location: string;
  bio: string;
  linkedin_url: string;
  website_url: string;
  twitter_url: string;
  user_type: 'job_seeker' | 'freelancer';
  avatar_url: string;
  rapidapi_key: string;
  hunter_api_key: string;
  resend_api_key: string;
  apollo_api_key: string;
  notification_preferences: Record<string, boolean>;
  plan: string;
}

const DEF: Settings = {
  full_name: '', job_title: '', location: '', bio: '',
  linkedin_url: '', website_url: '', twitter_url: '',
  user_type: 'job_seeker', avatar_url: '',
  rapidapi_key: '', hunter_api_key: '', resend_api_key: '', apollo_api_key: '',
  notification_preferences: {
    general_weekly_summary: true,
    general_monthly_report: true,
    general_security_alerts: true,
  },
  plan: 'free',
};

export default function SettingsPage() {
  const [sec, setSec] = useState<Section>('profile');
  const [settings, setSettings] = useState<Settings>(DEF);
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserEmail(user.email || '');
    setMemberSince(new Date(user.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }));
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    if (data) {
      setSettings({
        ...DEF, ...data,
        full_name: data.full_name || '',
        job_title: data.job_title || '',
        location: data.location || '',
        bio: data.bio || '',
        linkedin_url: data.linkedin_url || '',
        website_url: data.website_url || '',
        twitter_url: data.twitter_url || '',
        user_type: data.user_type || 'job_seeker',
        avatar_url: data.avatar_url || '',
        rapidapi_key: data.rapidapi_key || '',
        hunter_api_key: data.hunter_api_key || '',
        resend_api_key: data.resend_api_key || '',
        apollo_api_key: data.apollo_api_key || '',
        plan: data.plan || 'free',
        notification_preferences: { ...DEF.notification_preferences, ...(data.notification_preferences || {}) },
      });
    } else {
      await supabase.from('user_settings').insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || '',
      });
      setSettings({ ...DEF, full_name: user.user_metadata?.full_name || '' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px]">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1e293b]">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, preferences, and integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible sticky top-4">
            {NAV.map(n => (
              <button
                key={n.id}
                onClick={() => setSec(n.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                  sec === n.id
                    ? n.danger
                      ? 'bg-red-50 text-red-600 border-l-2 border-red-500'
                      : 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'
                    : n.danger
                      ? 'text-red-400 hover:bg-red-50/50'
                      : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <n.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:block">{n.label}</span>
                <span className="lg:hidden">{n.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 min-w-0">
          {sec === 'profile' && (
            <ProfileSettings
              profile={{
                full_name: settings.full_name,
                job_title: settings.job_title,
                location: settings.location,
                bio: settings.bio,
                linkedin_url: settings.linkedin_url,
                website_url: settings.website_url,
                twitter_url: settings.twitter_url,
                user_type: settings.user_type,
                avatar_url: settings.avatar_url,
              }}
              userEmail={userEmail}
              onChange={p => setSettings(prev => ({ ...prev, ...p }))}
            />
          )}

          {sec === 'account' && (
            <AccountSettings
              userEmail={userEmail}
              memberSince={memberSince}
              plan={settings.plan}
            />
          )}

          {sec === 'notifications' && (
            <NotificationSettings
              prefs={settings.notification_preferences}
              onChange={p => setSettings(prev => ({ ...prev, notification_preferences: p }))}
            />
          )}

          {sec === 'integrations' && (
            <IntegrationSettings
              keys={{
                rapidapi_key: settings.rapidapi_key,
                hunter_api_key: settings.hunter_api_key,
                resend_api_key: settings.resend_api_key,
                apollo_api_key: settings.apollo_api_key,
              }}
              onSaved={updated => setSettings(prev => ({ ...prev, ...updated }))}
            />
          )}

          {sec === 'billing' && (
            <BillingSettings plan={settings.plan} />
          )}

          {sec === 'team' && (
            <TeamSettings />
          )}

          {sec === 'whitelabel' && (
            <WhiteLabelSettings />
          )}

          {sec === 'danger' && (
            <DangerZone userEmail={userEmail} />
          )}
        </div>
      </div>
    </div>
  );
}
