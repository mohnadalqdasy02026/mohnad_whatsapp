# 🟢 Arabic WhatsApp Team Inbox Platform

> منصة SaaS احترافية لإدارة رسائل واتساب للشركات عبر WhatsApp Web Session (QR Code) — بدون WhatsApp Business API.

مبنية على: **Next.js 14 + NestJS + PostgreSQL + Prisma + Redis + Socket.IO + Baileys**

---

## 🏗️ Architecture

```
arabic-whatsapp-inbox/
├── apps/
│   ├── api/              # NestJS Backend (الـ API + WhatsApp Engine)
│   └── web/              # Next.js 14 Frontend (RTL Arabic UI)
├── docker-compose.yml    # PostgreSQL + Redis + API
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1) Prerequisites
- Node.js >= 20
- Docker & Docker Compose
- pnpm أو npm

### 2) Setup

```bash
# Install dependencies
cd apps/api && npm install
cd ../web && npm install

# Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start DB + Redis
docker-compose up -d postgres redis

# Run migrations
cd apps/api && npx prisma migrate dev

# Start API
npm run start:dev

# In another terminal — start web
cd apps/web && npm run dev
```

API: `http://localhost:4000`
Web: `http://localhost:3000`

---

## 🌐 Production Deployment

### Frontend → Vercel
1. ارفع الـ repo على GitHub
2. استورد `apps/web` على Vercel
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = رابط الـ API على Railway/Render
4. Deploy ✅

### Backend → Railway أو Render
**مهم:** WhatsApp Web عبر Baileys يحتاج server شغال 24/7 — لا يستخدم serverless.

**Railway:**
1. New Project → Deploy from GitHub
2. اختر مجلد `apps/api`
3. أضف PostgreSQL + Redis من Add-ons
4. Environment variables (من `.env.example`)
5. Deploy ✅

**Render:**
1. New Web Service
2. Root: `apps/api`
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `node dist/main.js`
5. أضف PostgreSQL + Redis

### أول ما تشتغل:
1. سجّل شركة جديدة من `/register`
2. ادخل على `/dashboard/whatsapp`
3. امسح QR من واتساب
4. ابدأ استقبال الرسائل

---

## 🔐 Environment Variables

### `apps/api/.env`
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/whatsapp_inbox
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-a-strong-secret
JWT_EXPIRES_IN=7d
PORT=4000
WEBHOOK_BASE_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000
```

### `apps/web/.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 📚 Features (MVP)

- ✅ Multi-tenant (Company isolation)
- ✅ JWT Auth + RBAC (Admin / Agent)
- ✅ WhatsApp QR session per company
- ✅ Real-time messaging (Socket.IO)
- ✅ Inbox (WhatsApp Web-like)
- ✅ Conversation assignment
- ✅ Internal notes
- ✅ Tags + Status (Open / Pending / Closed)
- ✅ RTL Arabic UI
- ✅ Responsive (Desktop + Mobile)
- ✅ Auto-reconnect on session drop

---

## 🛠️ Tech Stack

| Layer       | Tech                                |
|-------------|--------------------------------------|
| Frontend    | Next.js 14, Tailwind, Socket.IO Client |
| Backend     | NestJS, Prisma, Socket.IO Gateway   |
| Database    | PostgreSQL                          |
| Cache       | Redis (sessions + Socket.IO adapter)|
| WhatsApp    | Baileys (whatsapp-web.js core)      |
| Auth        | JWT + bcrypt                        |
| Deploy      | Vercel (web) + Railway (api)        |

---

## 📝 License
MIT
