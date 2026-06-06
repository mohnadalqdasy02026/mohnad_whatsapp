'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Smartphone, CheckCircle2, XCircle, Loader2, QrCode } from 'lucide-react';

export default function WhatsAppPage() {
  const token = useAuthStore((s) => s.token);
  const [status, setStatus] = useState<string>('DISCONNECTED');
  const [qr, setQr] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [pushName, setPushName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
    const sock = getSocket(token!);
    sock.on('whatsapp:qr', (p: any) => {
      setQr(p.qr);
      setStatus('CONNECTING');
    });
    sock.on('whatsapp:status', (p: any) => {
      setStatus(p.status);
      if (p.status === 'CONNECTED') {
        setQr(null);
        setPhone(p.phone || null);
        toast.success('تم ربط واتساب بنجاح ✅');
        refresh();
      } else if (p.status === 'FAILED') {
        toast.error('فشل ربط واتساب');
      } else if (p.status === 'DISCONNECTED') {
        toast('تم قطع الاتصال');
        refresh();
      }
    });
    return () => {
      sock.off('whatsapp:qr');
      sock.off('whatsapp:status');
    };
  }, [token]);

  async function refresh() {
    try {
      const r = await api.get('/whatsapp/status');
      setStatus(r.data?.status || 'DISCONNECTED');
      setPhone(r.data?.phoneNumber || null);
      setPushName(r.data?.pushName || null);
    } catch {}
  }

  async function connect() {
    setLoading(true);
    try {
      await api.post('/whatsapp/connect');
      toast.success('جاري توليد رمز QR...');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل البدء');
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm('هل أنت متأكد من قطع الاتصال بواتساب؟')) return;
    try {
      await api.post('/whatsapp/disconnect');
      toast.success('تم قطع الاتصال');
      setStatus('DISCONNECTED');
      setQr(null);
      setPhone(null);
    } catch (e: any) {
      toast.error('فشل قطع الاتصال');
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ربط واتساب</h1>
      <p className="text-gray-500 mb-6 text-sm">اربط رقم واتساب عبر مسح رمز QR</p>

      <div className="max-w-2xl bg-white rounded-2xl shadow-sm p-6 md:p-10">
        {/* Status badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-sm text-gray-600">الحالة:</div>
          {status === 'CONNECTED' && (
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle2 size={16} /> متصل {phone && `· ${phone}`}
            </div>
          )}
          {status === 'CONNECTING' && (
            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
              <Loader2 size={16} className="animate-spin" /> جاري الاتصال
            </div>
          )}
          {(status === 'DISCONNECTED' || status === 'FAILED') && (
            <div className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              <XCircle size={16} /> غير متصل
            </div>
          )}
        </div>

        {status === 'CONNECTED' ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto bg-wa-green rounded-full flex items-center justify-center mb-4">
              <Smartphone className="text-white" size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">واتساب مربوط</h2>
            <p className="text-gray-500 mb-1">الرقم: {phone || '—'}</p>
            {pushName && <p className="text-gray-500 mb-6">الاسم: {pushName}</p>}
            <button
              onClick={disconnect}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium"
            >
              قطع الاتصال
            </button>
          </div>
        ) : (
          <div className="text-center">
            {qr ? (
              <>
                <div className="inline-block p-4 bg-white border-4 border-wa-green rounded-2xl mb-4">
                  <img src={qr} alt="WhatsApp QR" className="w-64 h-64" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">امسح الرمز من واتساب</h2>
                <ol className="text-right text-sm text-gray-600 space-y-1.5 max-w-sm mx-auto">
                  <li>1. افتح واتساب على هاتفك</li>
                  <li>2. اذهب إلى الإعدادات ← الأجهزة المرتبطة</li>
                  <li>3. اضغط "ربط جهاز"</li>
                  <li>4. وجّه الكاميرا نحو هذا الرمز</li>
                </ol>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <QrCode className="text-gray-400" size={36} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">ابدأ ربط واتساب</h2>
                <p className="text-gray-500 text-sm mb-6">
                  اضغط الزر أدناه لتوليد رمز QR جديد
                </p>
                <button
                  onClick={connect}
                  disabled={loading}
                  className="bg-wa-green hover:bg-wa-green-dark text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'توليد رمز QR'}
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded text-sm text-yellow-900">
          ⚠️ ملاحظة: لا تستخدم هذه الخدمة لإرسال رسائل مزعجة. تأكد من امتثالك لشروط استخدام واتساب.
        </div>
      </div>
    </div>
  );
}
