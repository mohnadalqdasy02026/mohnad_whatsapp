'use client';

import { Conversation } from '@/lib/types';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import clsx from 'clsx';

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  loading,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return conversations;
    const s = q.toLowerCase();
    return conversations.filter(
      (c) =>
        c.contact.name?.toLowerCase().includes(s) ||
        c.contact.pushName?.toLowerCase().includes(s) ||
        c.contact.phone.includes(s) ||
        c.lastMessagePreview?.toLowerCase().includes(s),
    );
  }, [q, conversations]);

  return (
    <>
      {/* Header */}
      <div className="bg-wa-green-darker text-white px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">المحادثات</div>
        <div className="text-xs opacity-80">{filtered.length}</div>
      </div>

      {/* Search */}
      <div className="p-2 bg-white border-b">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-gray-100 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wa-green"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        {loading && <div className="p-6 text-center text-gray-400 text-sm">جاري التحميل...</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-400 text-sm">لا توجد محادثات</div>
        )}
        {filtered.map((c) => {
          const name = c.contact.name || c.contact.pushName || c.contact.phone;
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={clsx(
                'w-full text-right px-3 py-3 flex items-start gap-3 border-b hover:bg-gray-50 transition',
                active && 'bg-green-50',
              )}
            >
              <div className="w-11 h-11 rounded-full bg-wa-green-darker text-white flex items-center justify-center font-semibold flex-shrink-0">
                {name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="font-semibold text-gray-900 truncate">{name}</div>
                  <div className="text-[10px] text-gray-500 flex-shrink-0">
                    {c.lastMessageAt && new Date(c.lastMessageAt).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2 mt-0.5">
                  <div className="text-sm text-gray-500 truncate">{c.lastMessagePreview || '—'}</div>
                  {c.unreadCount > 0 && (
                    <div className="bg-wa-green text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {c.unreadCount}
                    </div>
                  )}
                </div>
                {c.assignment?.user && (
                  <div className="text-[10px] text-purple-600 mt-0.5">👤 {c.assignment.user.name}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
