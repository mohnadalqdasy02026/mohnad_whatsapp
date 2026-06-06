'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/lib/store';

function SettingsContent() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h1>
      <p className="text-gray-500 mb-6 text-sm">معلومات حسابك</p>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl">
        <div className="space-y-3">
          <Row label="البريد الإلكتروني" value={user?.email} />
          <Row label="الدور" value={user?.role === 'ADMIN' ? 'مدير' : 'موظف'} />
          <Row label="معرّف الشركة" value={user?.companyId} mono />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center border-b pb-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
