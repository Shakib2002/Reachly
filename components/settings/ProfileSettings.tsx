'use client';

import { useState, useRef } from 'react';
import { Loader2, Briefcase, Building2, Globe, Globe2, AtSign, Camera, X, Save } from 'lucide-react';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();

interface Profile {
  full_name: string;
  job_title: string;
  location: string;
  bio: string;
  linkedin_url: string;
  website_url: string;
  twitter_url: string;
  user_type: 'job_seeker' | 'freelancer';
  avatar_url: string;
}

interface Props {
  profile: Profile;
  userEmail: string;
  onChange: (p: Profile) => void;
}

const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white';
const lbl = 'text-xs font-semibold text-slate-500 mb-1.5 block';

export default function ProfileSettings({ profile, userEmail, onChange }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Profile, val: string) => onChange({ ...profile, [key]: val });

  const handleSave = async () => {
    if (!profile.full_name.trim()) { toast.error('Full name is required'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from('user_settings').update({
      full_name: profile.full_name,
      job_title: profile.job_title,
      location: profile.location,
      bio: profile.bio,
      linkedin_url: profile.linkedin_url,
      website_url: profile.website_url,
      twitter_url: profile.twitter_url,
      user_type: profile.user_type,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
    if (error) toast.error('Failed to save profile');
    else toast.success('Profile updated!');
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setUploading(true);
    setUploadProgress(30);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    setUploadProgress(60);
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); setUploading(false); setUploadProgress(0); return; }
    setUploadProgress(90);
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    onChange({ ...profile, avatar_url: publicUrl });
    await supabase.from('user_settings').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    setUploadProgress(100);
    toast.success('Avatar updated');
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  };

  const handleRemoveAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    onChange({ ...profile, avatar_url: '' });
    await supabase.from('user_settings').update({ avatar_url: '' }).eq('user_id', user.id);
    toast.success('Avatar removed');
  };

  const initials = (profile.full_name || userEmail || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-bold text-[#1e293b] mb-5">Profile Information</h2>

        {/* Avatar */}
        <div className="flex items-start gap-5 mb-6">
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" width={80} height={80} className="w-20 h-20 rounded-2xl object-cover shadow-md" unoptimized />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
            {uploading && (
              <div className="mt-2 w-20">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1e293b]">{profile.full_name || 'Your Name'}</p>
            <p className="text-xs text-slate-400 mb-3">{userEmail}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                Upload Photo
              </button>
              {profile.avatar_url && (
                <button onClick={handleRemoveAvatar} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">JPG, PNG up to 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }} />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Full Name <span className="text-red-400">*</span></label>
            <input value={profile.full_name} onChange={e => set('full_name', e.target.value)} className={inp} placeholder="Your full name" />
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input value={userEmail} disabled className={inp + ' bg-slate-50 cursor-not-allowed text-slate-400'} />
          </div>
          <div>
            <label className={lbl}>Job Title / Agency Name</label>
            <input value={profile.job_title} onChange={e => set('job_title', e.target.value)} className={inp} placeholder="e.g. React Developer or Web Design Agency" />
          </div>
          <div>
            <label className={lbl}>Location</label>
            <input value={profile.location} onChange={e => set('location', e.target.value)} className={inp} placeholder="e.g. Dhaka, Bangladesh" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>
              Bio <span className="text-slate-400 font-normal">({(profile.bio || '').length}/160)</span>
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={e => set('bio', e.target.value.slice(0, 160))}
              className={inp + ' resize-none'}
              rows={3}
              placeholder="A short bio about yourself..."
            />
          </div>
          <div>
            <label className={lbl}>LinkedIn URL</label>
            <div className="relative">
              <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0077b5]" />
              <input value={profile.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} className={inp + ' pl-9'} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
          <div>
            <label className={lbl}>Portfolio / Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={profile.website_url} onChange={e => set('website_url', e.target.value)} className={inp + ' pl-9'} placeholder="https://yoursite.com" />
            </div>
          </div>
          <div>
            <label className={lbl}>Twitter / X</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={profile.twitter_url} onChange={e => set('twitter_url', e.target.value)} className={inp + ' pl-9'} placeholder="https://x.com/..." />
            </div>
          </div>
        </div>
      </div>

      {/* User Type */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
        <h2 className="text-base font-bold text-[#1e293b] mb-1.5">I am a...</h2>
        <p className="text-xs text-slate-400 mb-4">This affects CRM labels, analytics views, and dashboard widgets.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { value: 'job_seeker', label: 'Job Seeker', desc: 'I am looking for employment opportunities', icon: Briefcase, color: 'blue' },
            { value: 'freelancer', label: 'Freelancer / Agency', desc: 'I am looking for client projects', icon: Building2, color: 'emerald' },
          ].map(opt => {
            const active = profile.user_type === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => set('user_type', opt.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${active
                  ? opt.color === 'blue' ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active
                  ? opt.color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                  : 'bg-slate-100'
                }`}>
                  <opt.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? opt.color === 'blue' ? 'text-blue-700' : 'text-emerald-700' : 'text-[#1e293b]'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
