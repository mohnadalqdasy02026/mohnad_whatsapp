'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جاري التحقق...
      </div>
    );
  }
  return <>{children}</>;
}
