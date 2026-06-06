'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Inbox, MessageSquare, Users, Smartphone, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalConversations: number;
  statusBreakdown: { open: number; pending: number; closed: number };
  todayMessages: number;
  activeAgents: number;
  totalContacts: number;
  last7Days: { date: string; inbound: number; outbound: number }[];
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/whatsapp/status').then((r) => setSession(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="p-10 text-center text-gray-500">جاري التحميل...</div>;
  }

  const cards = [
    { label: 'إجمالي المحادثات', value: stats.totalConversations, icon: Inbox, color: 'bg-blue-500' },
    { label: 'رسائل اليوم', value: stats.todayMessages, icon: MessageSquare, color: 'bg-wa-green' },
    { label: 'الموظفون النشطون', value: stats.activeAgents, icon: Users, color: 'bg-purple-500' },
    { label: 'جهات الاتصال', value: stats.totalContacts, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const maxDay = Math.max(1, ...stats.last7Days.map((d) => d.inbound + d.outbound));

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
      <p className="text-gray-500 mb-6 text-sm">نظرة عامة على نشاط شركتك</p>

      {/* WhatsApp status banner */}
      {session?.status !== 'CONNECTED' && (
        <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded-lg mb-6 flex items-center justify-between">
          <div>
            <div className="font-semibold text-yellow-900">واتساب غير مربوط</div>
            <div className="text-sm text-yellow-800">اربط رقم واتساب للبدء في استقبال الرسائل</div>
          </div>
          <Link
            href="/dashboard/whatsapp"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            ربط الآن
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-white`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">حالة المحادثات</h2>
          <div className="space-y-3">
            {[
              { label: 'مفتوحة', value: stats.statusBreakdown.open, color: 'bg-wa-green' },
              { label: 'قيد الانتظار', value: stats.statusBreakdown.pending, color: 'bg-yellow-500' },
              { label: 'مغلقة', value: stats.statusBreakdown.closed, color: 'bg-gray-400' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{s.label}</span>
                  <span className="font-semibold">{s.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.color} transition-all`}
                    style={{ width: `${stats.totalConversations ? (s.value / stats.totalConversations) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">آخر 7 أيام</h2>
          <div className="flex items-end justify-between h-40 gap-1">
            {stats.last7Days.map((d) => {
              const total = d.inbound + d.outbound;
              const h = (total / maxDay) * 100;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-wa-green rounded-t transition-all"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(d.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-wa-green rounded" />
              <span>واردة + صادرة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
