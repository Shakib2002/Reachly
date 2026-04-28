'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();
const inp = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all bg-white';

interface Props { userEmail: string }

// Confirm modal
function ConfirmModal({ title, desc, action, onClose, confirmText, onConfirm, busy }: {
  title: string; desc: string; action: string; confirmText: string;
  onClose: () => void; onConfirm: () => void; busy: boolean;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-[#1e293b]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{desc}</p>
        <p className="text-xs text-slate-500 mb-2">Type <strong className="text-red-600">{confirmText}</strong> to confirm:</p>
        <input value={val} onChange={e => setVal(e.target.value)} className={inp} placeholder={confirmText} />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={val !== confirmText || busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DangerZone({ userEmail }: Props) {
  const [exporting, setExporting] = useState(false);
  const [modal, setModal] = useState<'clearJobs' | 'clearClients' | 'deleteAccount' | null>(null);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setExporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setExporting(false); return; }
    const [leads, clients, emails, activities, templates] = await Promise.all([
      supabase.from('leads').select('*').eq('user_id', user.id),
      supabase.from('client_leads').select('*').eq('user_id', user.id),
      supabase.from('emails_sent').select('*').eq('user_id', user.id),
      supabase.from('activities').select('*').eq('user_id', user.id),
      supabase.from('email_templates').select('*').eq('user_id', user.id),
    ]);
    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      leads: leads.data,
      clients: clients.data,
      emails: emails.data,
      activities: activities.data,
      templates: templates.data,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reachly-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
    setExporting(false);
  };

  const clearJobLeads = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('leads').delete().eq('user_id', user.id);
      toast.success('All job leads deleted');
    }
    setBusy(false);
    setModal(null);
  };

  const clearClientLeads = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('client_leads').delete().eq('user_id', user.id);
      toast.success('All client leads deleted');
    }
    setBusy(false);
    setModal(null);
  };

  const deleteAccount = async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Delete all user data
      await Promise.all([
        supabase.from('leads').delete().eq('user_id', user.id),
        supabase.from('client_leads').delete().eq('user_id', user.id),
        supabase.from('emails_sent').delete().eq('user_id', user.id),
        supabase.from('activities').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
      ]);
      await supabase.auth.signOut();
      window.location.href = '/';
    }
    setBusy(false);
  };

  const DangerRow = ({ title, desc, note, button, onClick, loading }: {
    title: string; desc: string; note?: string; button: string; onClick: () => void; loading?: boolean;
  }) => (
    <div className="py-5 first:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          {note && <p className="text-[11px] text-red-400 mt-0.5 font-medium">{note}</p>}
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-red-300 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {button}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-red-50/50 rounded-2xl border-2 border-red-200 p-6">
        <h2 className="text-base font-bold text-red-600 flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h2>
        <div className="divide-y divide-red-100">
          <DangerRow
            title="Export All Data"
            desc="Download all your leads, clients, emails, templates, and activities as JSON"
            button={exporting ? 'Exporting...' : '⬇ Export All Data'}
            onClick={exportData}
            loading={exporting}
          />
          <DangerRow
            title="Clear Job Leads"
            desc="Permanently delete all your job leads and associated emails"
            note="This cannot be undone."
            button="Clear Job Leads"
            onClick={() => setModal('clearJobs')}
          />
          <DangerRow
            title="Clear Client Leads"
            desc="Permanently delete all your client leads and pipeline data"
            note="This cannot be undone."
            button="Clear Client Leads"
            onClick={() => setModal('clearClients')}
          />
          <div className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-red-700">Delete Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and ALL data. Cannot be undone.</p>
                <p className="text-[11px] text-red-500 mt-0.5 font-medium">All your data will be permanently lost.</p>
              </div>
              <button
                onClick={() => setModal('deleteAccount')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'clearJobs' && (
        <ConfirmModal
          title="Clear Job Leads"
          desc="This will permanently delete ALL your job leads. This action cannot be undone."
          action="Delete All Job Leads"
          confirmText="DELETE LEADS"
          onClose={() => setModal(null)}
          onConfirm={clearJobLeads}
          busy={busy}
        />
      )}
      {modal === 'clearClients' && (
        <ConfirmModal
          title="Clear Client Leads"
          desc="This will permanently delete ALL your client leads. This action cannot be undone."
          action="Delete All Client Leads"
          confirmText="DELETE CLIENTS"
          onClose={() => setModal(null)}
          onConfirm={clearClientLeads}
          busy={busy}
        />
      )}
      {modal === 'deleteAccount' && (
        <ConfirmModal
          title="Delete Account"
          desc="This will permanently delete your account and all data. You cannot undo this."
          action="Delete My Account"
          confirmText={userEmail}
          onClose={() => setModal(null)}
          onConfirm={deleteAccount}
          busy={busy}
        />
      )}
    </>
  );
}
