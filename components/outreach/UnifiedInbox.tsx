'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  Inbox, Mail, MailOpen, Reply, Archive, Star, Trash2, Search,
  Clock, AlertCircle, CheckCircle2,
  ArrowLeft, Send, Loader2, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const supabase = createBrowserSupabaseClient();

interface InboxMessage {
  id: string;
  direction: 'inbound' | 'outbound' | 'system';
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  starred: boolean;
  resend_email_id: string | null;
  thread_id: string | null;
  created_at: string;
}

type FilterType = 'all' | 'unread' | 'starred' | 'archived';

export default function UnifiedInbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('inbox_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'unread') query = query.eq('status', 'unread');
      if (filter === 'starred') query = query.eq('starred', true);
      if (filter === 'archived') query = query.eq('status', 'archived');

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error('Inbox fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markAsRead = async (msg: InboxMessage) => {
    if (msg.status === 'unread') {
      await supabase.from('inbox_messages').update({ status: 'read' }).eq('id', msg.id);
      setMessages(messages.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
    }
    setSelected(msg);
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    await supabase.from('inbox_messages').update({ starred: !msg.starred }).eq('id', id);
    setMessages(messages.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
  };

  const archiveMessage = async (id: string) => {
    await supabase.from('inbox_messages').update({ status: 'archived' }).eq('id', id);
    setMessages(messages.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Archived');
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('inbox_messages').delete().eq('id', id);
    setMessages(messages.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Deleted');
  };

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selected.from_email,
          subject: `Re: ${selected.subject}`,
          body: replyBody,
        }),
      });
      if (!res.ok) throw new Error('Send failed');

      await supabase.from('inbox_messages').update({ status: 'replied' }).eq('id', selected.id);
      toast.success('Reply sent!');
      setReplyBody('');
      setSelected({ ...selected, status: 'replied' });
      fetchMessages();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const filtered = messages.filter(m =>
    !search || m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from_email.toLowerCase().includes(search.toLowerCase()) ||
    m.body?.toLowerCase().includes(search.toLowerCase())
  );

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'All Mail', count: messages.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'starred', label: 'Starred' },
    { id: 'archived', label: 'Archived' },
  ];

  const getStatusIcon = (msg: InboxMessage) => {
    if (msg.direction === 'system') return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
    if (msg.status === 'replied') return <Reply className="w-3.5 h-3.5 text-emerald-500" />;
    if (msg.status === 'unread') return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    return <MailOpen className="w-3.5 h-3.5 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 p-12 flex flex-col items-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden" style={{ minHeight: '70vh' }}>
      <div className="flex h-full" style={{ minHeight: '70vh' }}>
        {/* Sidebar — Filter + Message List */}
        <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] border-r border-slate-100`}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-500" /> Unified Inbox
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
                )}
              </h3>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 px-3 py-2 border-b border-slate-50">
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === f.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'
                }`}>
                {f.label} {f.count !== undefined && <span className="ml-0.5 text-[10px] opacity-60">({f.count})</span>}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Inbox className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">No messages</p>
                <p className="text-[11px] text-slate-300 mt-1">Email replies and system notifications will appear here</p>
              </div>
            ) : filtered.map(msg => (
              <div key={msg.id} onClick={() => markAsRead(msg)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-blue-50/30 ${
                  selected?.id === msg.id ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                } ${msg.status === 'unread' ? 'bg-blue-50/20' : ''}`}>
                <div className="mt-1">{getStatusIcon(msg)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-xs truncate ${msg.status === 'unread' ? 'font-bold text-[#1e293b]' : 'font-medium text-slate-600'}`}>
                      {msg.from_email}
                    </p>
                    <span className="text-[10px] text-slate-300 flex-shrink-0 ml-2">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate ${msg.status === 'unread' ? 'font-semibold text-[#1e293b]' : 'text-slate-500'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{msg.body?.slice(0, 80)}</p>
                </div>
                <button onClick={(e) => toggleStar(msg.id, e)} className="mt-1 flex-shrink-0">
                  <Star className={`w-3.5 h-3.5 transition-colors ${msg.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Pane */}
        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
          {selected ? (
            <>
              {/* Detail Header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => archiveMessage(selected.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Archive">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMessage(selected.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h2 className="text-base font-bold text-[#1e293b]">{selected.subject}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {selected.from_email[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1e293b]">{selected.from_email}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selected.created_at).toLocaleString()}
                      {selected.status === 'replied' && <span className="ml-2 flex items-center gap-0.5 text-emerald-500"><CheckCircle2 className="w-3 h-3" /> Replied</span>}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selected.body}
                </div>
              </div>

              {/* Reply Box */}
              {selected.direction !== 'system' && (
                <div className="border-t border-slate-100 p-4">
                  <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
                    rows={3} placeholder="Write your reply..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-[#1e293b] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all" />
                  <div className="flex justify-end mt-2">
                    <button onClick={handleReply} disabled={sending || !replyBody.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50">
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send Reply
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">Select a message</h3>
              <p className="text-xs text-slate-300 mt-1">Choose a conversation to view details and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
