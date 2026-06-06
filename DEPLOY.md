# 🚀 دليل النشر الكامل — GitHub + Vercel + Railway

## 📋 المتطلبات
- حساب GitHub
- حساب Vercel (مجاني)
- حساب Railway (مجاني يكفي للبداية)
- حساب WhatsApp عادي للربط

---

## 1️⃣ رفع المشروع على GitHub

```bash
cd arabic-whatsapp-inbox
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/arabic-whatsapp-inbox.git
git push -u origin main
```

---

## 2️⃣ نشر الـ Backend على Railway

### خطوة 1: إنشاء مشروع
1. ادخل [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. اختر `arabic-whatsapp-inbox`

### خطوة 2: إضافة الخدمات
في نفس المشروع:
- **+ New** → **Database** → **PostgreSQL** → أنشئ
- **+ New** → **Database** → **Redis** → أنشئ

### خطوة 3: إعدادات الخدمة
- **Settings** → **Root Directory**: `apps/api`
- **Settings** → **Build Command**: `npm install && npx prisma generate && npm run build`
- **Settings** → **Start Command**: `npx prisma migrate deploy && node dist/main.js`

### خطوة 4: Environment Variables
في **Variables** tab:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | من PostgreSQL service → Variables → DATABASE_URL |
| `REDIS_URL` | من Redis service → Variables → REDIS_URL |
| `JWT_SECRET` | أي نص عشوائي طويل (32 حرف على الأقل) |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | رابط Vercel (ستحصل عليه بعد الخطوة التالية) |
| `WA_SESSIONS_PATH` | `./sessions` |

### خطوة 5: Volume للـ Sessions
مهم جداً — حتى لا تضيع جلسات WhatsApp:
- **Settings** → **Volumes** → **+ New Volume**
- Mount Path: `/app/sessions`

### خطوة 6: Deploy
اضغط **Deploy** وانتظر حتى يشتغل.
انسخ الرابط العام للـ API (مثلاً: `https://your-app.up.railway.app`)

---

## 3️⃣ نشر الـ Frontend على Vercel

### خطوة 1: استيراد المشروع
1. ادخل [vercel.com](https://vercel.com)
2. **Add New** → **Project**
3. استورد نفس repo `arabic-whatsapp-inbox`

### خطوة 2: الإعدادات
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`

### خطوة 3: Environment Variables
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | رابط Railway API (بدون / في النهاية) |
| `NEXT_PUBLIC_SOCKET_URL` | نفس رابط Railway API |

### خطوة 4: Deploy
اضغط **Deploy** وانتظر دقيقتين.

### خطوة 5: ارجع لـ Railway
أضف رابط Vercel في `CORS_ORIGIN` (مثلاً `https://your-app.vercel.app`)
أعد deploy.

---

## 4️⃣ أول استخدام

1. افتح موقعك على Vercel
2. اضغط **إنشاء حساب شركة**
3. ادخل اسم شركتك وبيانات الـ Admin
4. ستنتقل للـ Dashboard
5. اذهب لـ **ربط واتساب** → **توليد رمز QR**
6. افتح واتساب على هاتفك → **الأجهزة المرتبطة** → **ربط جهاز**
7. امسح الـ QR
8. ارجع للموقع → **الرسائل** وستجد المحادثات

✅ تم! أنت الآن تشغّل منصة WhatsApp Team Inbox كاملة.

---

## 🛠️ Troubleshooting

### QR لا يظهر
- تأكد إن الـ volume مربوط في Railway
- راجع logs في Railway للبحث عن أخطاء

### Socket لا يعمل
- تأكد إن `NEXT_PUBLIC_SOCKET_URL` يشير لنفس Railway URL
- في Vercel dashboard، تأكد إن `NEXT_PUBLIC_API_URL` بدون `/` في الآخر

### Database migration فشل
- احذف الـ PostgreSQL service وأنشئ واحد جديد
- أو شغّل يدوياً من Railway CLI: `railway run npx prisma migrate deploy`

### WhatsApp يقطع كل فترة
- هذا طبيعي — Baileys يعيد الاتصال تلقائياً
- لكن لو يقطع كثير، تأكد من ثبات الإنترنت على السيرفر

---

## 💡 نصائح للإنتاج

1. **أضف Domain مخصص** في Vercel و Railway
2. **فعّل Backups** للـ PostgreSQL من Railway
3. **راقب Logs** بانتظام
4. **حدّث Baileys** عند صدور إصدارات جديدة
5. **فعّل Rate Limiting** عند النمو

---

## 🔄 للتحديث لاحقاً

```bash
git add .
git commit -m "تحديثات"
git push
```
Vercel و Railway سيعيدان النشر تلقائياً 🚀
