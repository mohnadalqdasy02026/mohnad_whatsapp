'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    companyName: '',
    slug: '',
    companyEmail: '',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function change(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.access_token, data.user);
      toast.success('تم إنشاء الشركة بنجاح 🎉');
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(
        Array.isArray(e.response?.data?.message)
          ? e.response.data.message.join(', ')
          : e.response?.data?.message || 'فشل التسجيل',
      );
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ k, label, type = 'text' }: { k: string; label: string; type?: string }) => (
    <label className="block mb-3">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type={type}
        value={(form as any)[k]}
        onChange={change(k)}
        className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wa-green"
        required
      />
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wa-green-darker to-wa-green-dark p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">إنشاء شركة جديدة</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">سجّل شركتك وابدأ بإدارة رسائل الواتساب</p>

        <h2 className="text-sm font-semibold text-gray-600 mb-2">بيانات الشركة</h2>
        <Field k="companyName" label="اسم الشركة" />
        <Field k="slug" label="معرّف الشركة (slug) — أحرف لاتينية صغيرة" />
        <Field k="companyEmail" label="البريد الرسمي للشركة" type="email" />

        <h2 className="text-sm font-semibold text-gray-600 mb-2 mt-4">حساب المدير (Admin)</h2>
        <Field k="name" label="الاسم الكامل" />
        <Field k="email" label="البريد الإلكتروني" type="email" />
        <Field k="password" label="كلمة المرور (8 أحرف على الأقل)" type="password" />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wa-green hover:bg-wa-green-dark text-white py-2.5 rounded-lg font-medium disabled:opacity-50 mt-2"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>

        <p className="text-center text-sm text-gray-600 mt-5">
          عندك حساب؟{' '}
          <Link href="/login" className="text-wa-green-darker font-medium hover:underline">
            تسجيل دخول
          </Link>
        </p>
      </form>
    </div>
  );
}
