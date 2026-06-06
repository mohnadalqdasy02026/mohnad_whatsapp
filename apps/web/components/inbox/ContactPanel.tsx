'use client';

import { useEffect, useState } from 'react';
import { X, UserCheck, UserPlus, StickyNote } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ContactPanel({
  conversation,
  onClose,
  onAssign,
  onAddNote,
  onUpdateStatus,
}: {
  conversation: any;
  onClose: () => void;
  onAssign: (userId: string | null) => void;
  onAddNote: (body: string) => void;
  onUpdateStatus: (s: 'OPEN' | 'PENDING' | 'CLOSED') => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<any[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
    }
  }, [user]);

  const c = conversation.contact;
  const name = c.name || c.pushName || c.phone;
  const assigned = conversation.assignment?.userId;

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="bg-wa-green-darker text-white px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">تفاصيل جهة الاتصال</div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 scroll-thin">
        {/* Avatar + name */}
        <div className="text-center py-6 border-b">
          <div className="w-24 h-24 mx-auto rounded-full bg-wa-green-darker text-white flex items-center justify-center text-3xl font-bold mb-3">
            {name.charAt(0)}
          </div>
          <div className="text-lg font-bold text-gray-900">{name}</div>
          <div className="text-sm text-gray-500" dir="ltr">{c.phone}</div>
        </div>

        {/* Status */}
        <div className="p-4 border-b">
          <div className="text-xs font-semibold text-gray-500 mb-2">الحالة</div>
          <div className="flex gap-1.5">
            {(['OPEN', 'PENDING', 'CLOSED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onUpdateStatus(s)}
                className={`flex-1 text-xs py-1.5 rounded ${
                  conversation.status === s
                    ? 'bg-wa-green text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {s === 'OPEN' ? 'مفتوحة' : s === 'PENDING' ? 'انتظار' : 'مغلقة'}
              </button>
            ))}
          </div>
        </div>

        {/* Assign */}
        {user?.role === 'ADMIN' && (
          <div className="p-4 border-b">
            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <UserCheck size={14} /> تعيين لموظف
            </div>
            <select
              value={assigned || ''}
              onChange={(e) => onAssign(e.target.value || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">غير معين</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="p-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <StickyNote size={14} /> ملاحظات داخلية
          </div>

          <div className="flex gap-2 mb-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ملاحظة..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (note.trim()) {
                  onAddNote(note);
                  setNote('');
                }
              }}
              className="bg-wa-green text-white px-3 rounded-lg text-sm"
            >
              إضافة
            </button>
          </div>

          <div className="space-y-2">
            {(conversation.notes || []).map((n: any) => (
              <div key={n.id} className="bg-yellow-50 border-r-2 border-yellow-500 p-2.5 rounded text-sm">
                <div className="text-gray-900">{n.body}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {n.user.name} · {new Date(n.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>
            ))}
            {(!conversation.notes || conversation.notes.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-3">لا توجد ملاحظات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
