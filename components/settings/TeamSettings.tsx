'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import toast from 'react-hot-toast';
import { Users, Plus, Copy, Check, Trash2, Crown, Shield, Eye, User, Loader2 } from 'lucide-react';
import type { TeamRole } from '@/types';

interface Member {
  id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  email?: string;
  full_name?: string;
}

interface TeamData {
  id: string;
  name: string;
  owner_id: string;
}

const supabase = createBrowserSupabaseClient();

const ROLE_CONFIG: Record<TeamRole, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-500 bg-amber-50' },
  admin: { label: 'Admin', icon: Shield, color: 'text-blue-500 bg-blue-50' },
  member: { label: 'Member', icon: User, color: 'text-slate-500 bg-slate-50' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-slate-400 bg-slate-50' },
};

export default function TeamSettings() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const fetchTeam = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Check if user has a team
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (membership) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', membership.team_id)
          .single();

        if (teamData) {
          setTeam(teamData);
          setTeamName(teamData.name);

          // Fetch members
          const { data: memberData } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamData.id)
            .order('joined_at', { ascending: true });

          setMembers((memberData || []) as Member[]);
        }
      }
    } catch (e) {
      console.error('Team fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const createTeam = async () => {
    if (!teamName.trim()) { toast.error('Team name required'); return; }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newTeam, error: teamErr } = await supabase
        .from('teams')
        .insert({ name: teamName.trim(), owner_id: user.id })
        .select('id, name, owner_id')
        .single();

      if (teamErr) throw teamErr;

      // Add owner as first member
      await supabase.from('team_members').insert({
        team_id: newTeam.id,
        user_id: user.id,
        role: 'owner',
      });

      setTeam(newTeam);
      toast.success('Team created!');
      fetchTeam();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const generateInvite = async () => {
    if (!team) return;
    setInviteLoading(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('team_invites').insert({
        team_id: team.id,
        token,
        expires_at: expiresAt,
      });

      if (error) throw error;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const link = `${baseUrl}/join?token=${token}`;
      setInviteLink(link);
      toast.success('Invite link generated!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const updateRole = async (memberId: string, newRole: TeamRole) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await supabase.from('team_members').delete().eq('id', memberId);
      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const isOwner = team?.owner_id === currentUserId;

  const inputCls = 'w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // No team — show creation UI
  if (!team) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-8 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#1e293b]">Create Your Team</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">Invite team members to collaborate on leads, outreach, and analytics.</p>
        <div className="mt-5 w-full space-y-3">
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name..." className={inputCls} />
          <button onClick={createTeam} disabled={creating}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Team
          </button>
        </div>
      </div>
    );
  }

  // Team exists — show management UI
  return (
    <div className="space-y-5">
      {/* Team Info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
        <h3 className="text-sm font-bold text-[#1e293b] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" /> Team Settings
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {team.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">{team.name}</p>
            <p className="text-[11px] text-slate-400">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Invite */}
      {isOwner && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-bold text-[#1e293b] mb-3">Invite Members</h3>
          {inviteLink ? (
            <div className="flex items-center gap-2">
              <input value={inviteLink} readOnly className={inputCls + ' text-xs font-mono bg-slate-50'} />
              <button onClick={copyInvite} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" aria-label="Copy invite link">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button onClick={generateInvite} disabled={inviteLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50">
              {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Generate Invite Link
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-2">Link expires in 7 days</p>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#1e293b]">Members ({members.length})</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {members.map((m) => {
            const roleConf = ROLE_CONFIG[m.role];
            const RoleIcon = roleConf.icon;
            return (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                    {(m.full_name?.[0] || m.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1e293b]">{m.full_name || m.email || 'User'}</p>
                    <p className="text-[11px] text-slate-400">{m.email || m.user_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && m.role !== 'owner' ? (
                    <select value={m.role} onChange={(e) => updateRole(m.id, e.target.value as TeamRole)}
                      className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white appearance-none cursor-pointer" aria-label={`Change role for ${m.full_name || 'member'}`}>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${roleConf.color}`}>
                      <RoleIcon className="w-3 h-3" /> {roleConf.label}
                    </span>
                  )}
                  {isOwner && m.role !== 'owner' && (
                    <button onClick={() => removeMember(m.id)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" aria-label="Remove member">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
