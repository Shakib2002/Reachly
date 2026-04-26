'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

import toast from 'react-hot-toast';
import {
  User, Shield, Bell, Plug, CreditCard, AlertTriangle, Save, Loader2,
  Eye, EyeOff, Download, Trash2, Check,
} from 'lucide-react';

const supabase = createClient();
type Section = 'profile'|'account'|'notifications'|'integrations'|'billing'|'danger';

const NAV: {id:Section;label:string;icon:typeof User;danger?:boolean}[] = [
  {id:'profile',label:'Profile',icon:User},
  {id:'account',label:'Account',icon:Shield},
  {id:'notifications',label:'Notifications',icon:Bell},
  {id:'integrations',label:'Integrations',icon:Plug},
  {id:'billing',label:'Billing',icon:CreditCard},
  {id:'danger',label:'Danger Zone',icon:AlertTriangle,danger:true},
];

interface Settings {
  full_name:string; job_title:string; location:string; bio:string;
  linkedin_url:string; website_url:string; avatar_url:string;
  rapidapi_key:string; hunter_api_key:string; resend_api_key:string;
  notification_preferences:Record<string,boolean>; plan:string;
}
const DEF: Settings = {
  full_name:'',job_title:'',location:'',bio:'',linkedin_url:'',website_url:'',avatar_url:'',
  rapidapi_key:'',hunter_api_key:'',resend_api_key:'',
  notification_preferences:{new_lead:true,status_changed:true,email_reply:true,followup_reminder:true,weekly_summary:true,product_updates:false},
  plan:'free',
};

export default function SettingsPage() {

  const [sec, setSec] = useState<Section>('profile');
  const [settings, setSettings] = useState<Settings>(DEF);
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [clearConfirm, setClearConfirm] = useState('');

  // API key visibility
  const [showKeys, setShowKeys] = useState<Record<string,boolean>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserEmail(user.email||'');
    setMemberSince(new Date(user.created_at).toLocaleDateString('en',{year:'numeric',month:'long',day:'numeric'}));
    const { data } = await supabase.from('user_settings').select('*').eq('user_id',user.id).single();
    if (data) {
      setSettings({...DEF,...data, 
        full_name: data.full_name || '', job_title: data.job_title || '', location: data.location || '',
        bio: data.bio || '', linkedin_url: data.linkedin_url || '', website_url: data.website_url || '',
        avatar_url: data.avatar_url || '', rapidapi_key: data.rapidapi_key || '',
        hunter_api_key: data.hunter_api_key || '', resend_api_key: data.resend_api_key || '',
        plan: data.plan || 'free',
        notification_preferences:{...DEF.notification_preferences,...(data.notification_preferences||{})}
      });
    } else {
      await supabase.from('user_settings').insert({user_id:user.id, full_name:user.user_metadata?.full_name||''});
      setSettings({...DEF, full_name:user.user_metadata?.full_name||''});
    }
    setLoading(false);
  },[]);

  useEffect(()=>{fetchSettings()},[fetchSettings]);

  const saveSettings = async (updates:Partial<Settings>) => {
    setSaving(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from('user_settings').update({...updates, updated_at:new Date().toISOString()}).eq('user_id',user.id);
    if (error) toast.error('Failed to save'); else { toast.success('Settings saved'); setSettings(p=>({...p,...updates})); }
    setSaving(false);
  };

  const updatePassword = async () => {
    if (newPwd.length < 6) { toast.error('Password must be 6+ characters'); return; }
    if (newPwd !== confPwd) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({password:newPwd});
    if (error) toast.error(error.message); else { toast.success('Password updated'); setCurPwd(''); setNewPwd(''); setConfPwd(''); }
    setSaving(false);
  };

  const exportData = async () => {
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    const [leads,emails,activities] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id',user.id),
      supabase.from('emails_sent').select('*').eq('user_id',user.id),
      supabase.from('activities').select('*').eq('user_id',user.id),
    ]);
    const blob = new Blob([JSON.stringify({leads:leads.data,emails:emails.data,activities:activities.data},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`reachly-export-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const clearLeads = async () => {
    if (clearConfirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('leads').delete().eq('user_id',user.id);
    toast.success('All leads cleared'); setClearConfirm('');
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== userEmail) { toast.error('Type your email to confirm'); return; }
    toast.success('Account deletion requested. Contact support.'); setDeleteConfirm('');
  };

  const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const label = 'text-xs font-semibold text-slate-500 mb-1.5 block';
  const card = 'bg-white rounded-2xl border border-[#e2e8f0] p-6';

  const Toggle = ({checked,onChange,label:l}:{checked:boolean;onChange:(v:boolean)=>void;label:string}) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-[#1e293b]">{l}</span>
      <button onClick={()=>onChange(!checked)} className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${checked?'bg-blue-500':'bg-slate-200'}`}>
        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${checked?'translate-x-[18px]':''}`} style={{width:18,height:18}}/>
      </button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-blue-500 animate-spin"/></div>;

  return (
    <div className="max-w-[1100px]">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1e293b]">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setSec(n.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${sec===n.id?(n.danger?'bg-red-50 text-red-600':'bg-blue-50 text-blue-600'):n.danger?'text-red-400 hover:bg-red-50/50':'text-slate-500 hover:bg-slate-50'}`}>
                <n.icon className="w-4 h-4"/>{n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {/* Profile */}
          {sec==='profile'&&(
            <div className={card}>
              <h2 className="text-base font-bold text-[#1e293b] mb-5">Profile Information</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {(settings.full_name?.[0]||userEmail[0]||'U').toUpperCase()}
                </div>
                <div><p className="text-sm font-semibold text-[#1e293b]">{settings.full_name||'User'}</p><p className="text-xs text-slate-400">{userEmail}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={label}>Full Name</label><input value={settings.full_name} onChange={e=>setSettings(p=>({...p,full_name:e.target.value}))} className={inp} placeholder="Your name"/></div>
                <div><label className={label}>Email</label><input value={userEmail} disabled className={inp+' bg-slate-50 cursor-not-allowed'}/></div>
                <div><label className={label}>Job Title</label><input value={settings.job_title} onChange={e=>setSettings(p=>({...p,job_title:e.target.value}))} className={inp} placeholder="e.g. Software Developer"/></div>
                <div><label className={label}>Location</label><input value={settings.location} onChange={e=>setSettings(p=>({...p,location:e.target.value}))} className={inp} placeholder="e.g. Dhaka, Bangladesh"/></div>
                <div className="sm:col-span-2"><label className={label}>Bio <span className="text-slate-400 font-normal">({(settings.bio||'').length}/160)</span></label><textarea value={settings.bio||''} onChange={e=>setSettings(p=>({...p,bio:e.target.value.slice(0,160)}))} className={inp+' resize-none'} rows={2} placeholder="Short bio..."/></div>
                <div><label className={label}>LinkedIn URL</label><input value={settings.linkedin_url} onChange={e=>setSettings(p=>({...p,linkedin_url:e.target.value}))} className={inp} placeholder="https://linkedin.com/in/..."/></div>
                <div><label className={label}>Website</label><input value={settings.website_url} onChange={e=>setSettings(p=>({...p,website_url:e.target.value}))} className={inp} placeholder="https://..."/></div>
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={()=>saveSettings({full_name:settings.full_name,job_title:settings.job_title,location:settings.location,bio:settings.bio,linkedin_url:settings.linkedin_url,website_url:settings.website_url})} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                  {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Account */}
          {sec==='account'&&(
            <div className="space-y-5">
              <div className={card}>
                <h2 className="text-base font-bold text-[#1e293b] mb-4">Change Password</h2>
                <div className="space-y-3 max-w-md">
                  <div><label className={label}>Current Password</label><input type="password" value={curPwd} onChange={e=>setCurPwd(e.target.value)} className={inp}/></div>
                  <div><label className={label}>New Password</label><input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} className={inp}/>
                    {newPwd&&<div className="flex gap-1 mt-1.5">{[1,2,3,4].map(i=><div key={i} className={`h-1 flex-1 rounded-full ${newPwd.length>=i*3?i>=3?'bg-emerald-400':'bg-amber-400':'bg-slate-200'}`}/>)}</div>}
                  </div>
                  <div><label className={label}>Confirm Password</label><input type="password" value={confPwd} onChange={e=>setConfPwd(e.target.value)} className={inp}/></div>
                  <button onClick={updatePassword} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                    {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Shield className="w-4 h-4"/>} Update Password
                  </button>
                </div>
              </div>
              <div className={card}>
                <h2 className="text-base font-bold text-[#1e293b] mb-3">Account Info</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Email</span><span className="text-[#1e293b] font-medium">{userEmail}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Member since</span><span className="text-[#1e293b] font-medium">{memberSince}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Plan</span><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold capitalize">{settings.plan}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {sec==='notifications'&&(
            <div className={card}>
              <h2 className="text-base font-bold text-[#1e293b] mb-4">Notification Preferences</h2>
              <div className="space-y-1 divide-y divide-slate-100">
                {[{k:'new_lead',l:'New lead added'},{k:'status_changed',l:'Lead status changed'},{k:'email_reply',l:'Email reply received'},{k:'followup_reminder',l:'Follow-up reminder'},{k:'weekly_summary',l:'Weekly summary report'},{k:'product_updates',l:'Product updates'}].map(n=>(
                  <Toggle key={n.k} label={n.l} checked={settings.notification_preferences[n.k]??false}
                    onChange={v=>{const np={...settings.notification_preferences,[n.k]:v};setSettings(p=>({...p,notification_preferences:np}))}}/>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={()=>saveSettings({notification_preferences:settings.notification_preferences})} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 disabled:opacity-50">
                  {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>} Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Integrations */}
          {sec==='integrations'&&(
            <div className="space-y-4">
              {[
                {key:'rapidapi_key',name:'JSearch (RapidAPI)',desc:'Job search API for Indeed, LinkedIn',icon:'🔍',color:'bg-blue-50'},
                {key:'hunter_api_key',name:'Hunter.io',desc:'Email finder for lead discovery',icon:'📧',color:'bg-emerald-50'},
                {key:'resend_api_key',name:'Resend',desc:'Email delivery for outreach',icon:'✉️',color:'bg-violet-50'},
              ].map(intg=>{const val=settings[intg.key as keyof Settings] as string;const connected=!!val;return(
                <div key={intg.key} className={card}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${intg.color} rounded-xl flex items-center justify-center text-lg`}>{intg.icon}</div>
                      <div><p className="text-sm font-bold text-[#1e293b]">{intg.name}</p><p className="text-[11px] text-slate-400">{intg.desc}</p></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${connected?'bg-emerald-50 text-emerald-600 border border-emerald-200':'bg-slate-50 text-slate-400 border border-slate-200'}`}>
                      {connected?'Connected':'Not Connected'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={showKeys[intg.key]?'text':'password'} value={val||''} onChange={e=>setSettings(p=>({...p,[intg.key]:e.target.value}))}
                        className={inp} placeholder="Enter API key..."/>
                      <button onClick={()=>setShowKeys(p=>({...p,[intg.key]:!p[intg.key]}))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showKeys[intg.key]?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    <button onClick={()=>saveSettings({[intg.key]:val} as Partial<Settings>)} disabled={saving}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm disabled:opacity-50 flex-shrink-0">
                      {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              )})}
              {['LinkedIn','Gmail','HubSpot','Notion'].map(s=>(
                <div key={s} className={card+' opacity-60'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">🔗</div>
                      <div><p className="text-sm font-bold text-[#1e293b]">{s}</p><p className="text-[11px] text-slate-400">Integration coming soon</p></div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold">Coming Soon</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Billing */}
          {sec==='billing'&&(
            <div className="space-y-5">
              <div className={card}>
                <div className="flex items-center justify-between mb-4">
                  <div><h2 className="text-base font-bold text-[#1e293b]">Current Plan</h2><p className="text-xs text-slate-400">Manage your subscription</p></div>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase">{settings.plan}</span>
                </div>
                <div className="space-y-3">
                  {[{l:'Leads',used:45,max:settings.plan==='free'?50:500,color:'bg-blue-500'},{l:'Emails',used:12,max:settings.plan==='free'?100:2000,color:'bg-violet-500'},{l:'API Calls',used:200,max:settings.plan==='free'?500:5000,color:'bg-emerald-500'}].map(u=>(
                    <div key={u.l}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-500 font-medium">{u.l}</span><span className="text-[#1e293b] font-semibold">{u.used}/{u.max}</span></div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${u.color} rounded-full transition-all`} style={{width:`${Math.min(100,(u.used/u.max)*100)}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
              {settings.plan==='free'&&(
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-1">Upgrade to Pro</h3>
                  <p className="text-blue-100 text-sm mb-4">$29/month · Unlock unlimited leads, emails, and premium features</p>
                  <div className="flex flex-wrap gap-2 mb-4">{['500 Leads','2000 Emails','AI Insights','Priority Support','Advanced Analytics'].map(f=>(
                    <span key={f} className="flex items-center gap-1 text-xs bg-white/15 px-2.5 py-1 rounded-lg"><Check className="w-3 h-3"/>{f}</span>
                  ))}</div>
                  <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg">Upgrade Now</button>
                </div>
              )}
            </div>
          )}

          {/* Danger Zone */}
          {sec==='danger'&&(
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
                <h2 className="text-base font-bold text-red-600 flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5"/> Danger Zone</h2>
                <div className="space-y-5 divide-y divide-red-100">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1e293b]">Export All Data</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">Download all your leads, emails, and activities as JSON</p>
                    <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Download className="w-3.5 h-3.5"/> Export Data
                    </button>
                  </div>
                  <div className="pt-5">
                    <h3 className="text-sm font-semibold text-[#1e293b]">Clear All Leads</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">This will permanently delete all your leads. Type <strong>DELETE</strong> to confirm.</p>
                    <div className="flex gap-2 max-w-sm">
                      <input value={clearConfirm} onChange={e=>setClearConfirm(e.target.value)} className={inp} placeholder='Type "DELETE"'/>
                      <button onClick={clearLeads} disabled={clearConfirm!=='DELETE'}
                        className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 disabled:opacity-30 flex-shrink-0 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5"/> Clear
                      </button>
                    </div>
                  </div>
                  <div className="pt-5">
                    <h3 className="text-sm font-semibold text-red-600">Delete Account</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">This cannot be undone. Type your email to confirm.</p>
                    <div className="flex gap-2 max-w-sm">
                      <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} className={inp} placeholder={userEmail}/>
                      <button onClick={deleteAccount} disabled={deleteConfirm!==userEmail}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-30 flex-shrink-0 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5"/> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
