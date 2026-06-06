import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'صندوق الوارد - WhatsApp Team Inbox',
  description: 'منصة إدارة رسائل الواتساب للشركات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
