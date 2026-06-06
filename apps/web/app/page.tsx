import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wa-green-darker to-wa-green-dark p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">صندوق الوارد للفرق</h1>
        <p className="text-lg text-gray-600 mb-8">
          منصة احترافية لإدارة رسائل الواتساب لشركتك — QR Code، فريق متعدد، بدون API رسمي.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg font-medium transition"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white border-2 border-wa-green text-wa-green-darker hover:bg-green-50 rounded-lg font-medium transition"
          >
            إنشاء حساب شركة
          </Link>
        </div>
      </div>
    </div>
  );
}
