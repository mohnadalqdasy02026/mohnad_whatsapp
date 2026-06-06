'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.access_token, data.user);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wa-green-darker to-wa-green-dark p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">تسجيل الدخول</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">مرحباً بعودتك 👋</p>

        <label className="block mb-3">
          <span className="text-sm text-gray-700">البريد الإلكتروني</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wa-green"
            required
          />
        </label>

        <label className="block mb-5">
          <span className="text-sm text-gray-700">كلمة المرور</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wa-green"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wa-green hover:bg-wa-green-dark text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>

        <p className="text-center text-sm text-gray-600 mt-5">
          ما عندك حساب؟{' '}
          <Link href="/register" className="text-wa-green-darker font-medium hover:underline">
            أنشئ شركة
          </Link>
        </p>
      </form>
    </div>
  );
}
