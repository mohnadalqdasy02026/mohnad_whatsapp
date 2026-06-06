'use client';

import AuthGuard from '@/components/layout/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

function TeamContent() {
  const user = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' });

  async function load() {
    const { data } = await api.get('/users');
    setUsers(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('تمت إضافة الموظف');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'AGENT' });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل');
    }
  }

  async function toggle(id: string, activate: boolean) {
    try {
      await api.patch(`/users/${id}/${activate ? 'activate' : 'deactivate'}`);
      load();
    } catch {}
  }

  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-gray-500">هذه الصفحة للمديرين فقط</div>;
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الفريق</h1>
          <p className="text-gray-500 text-sm">موظفو شركتك ({users.length})</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-wa-green hover:bg-wa-green-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <UserPlus size={18} /> إضافة موظف
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-right px-4 py-3">الاسم</th>
              <th className="text-right px-4 py-3">البريد</th>
              <th className="text-right px-4 py-3">الدور</th>
              <th className="text-right px-4 py-3">الحالة</th>
              <th className="text-right px-4 py-3">آخر دخول</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role === 'ADMIN' ? 'مدير' : 'موظف'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggle(u.id, !u.isActive)}
                    disabled={u.id === user.id}
                    className="text-xs text-wa-green-darker hover:underline disabled:opacity-30"
                  >
                    {u.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">إضافة موظف</h2>
            {(['name', 'email', 'password'] as const).map((k) => (
              <label key={k} className="block mb-3">
                <span className="text-sm text-gray-700">
                  {k === 'name' ? 'الاسم' : k === 'email' ? 'البريد' : 'كلمة المرور'}
                </span>
                <input
                  type={k === 'email' ? 'email' : k === 'password' ? 'password' : 'text'}
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  required
                />
              </label>
            ))}
            <label className="block mb-4">
              <span className="text-sm text-gray-700">الدور</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2"
              >
                <option value="AGENT">موظف</option>
                <option value="ADMIN">مدير</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-wa-green text-white py-2 rounded-lg">إضافة</button>
              <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-gray-100 py-2 rounded-lg">إلغاء</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <TeamContent />
      </DashboardLayout>
    </AuthGuard>
  );
}
