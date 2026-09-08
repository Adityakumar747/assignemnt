# Deployment Guide — Mini ERP + CRM Portal

> Full instructions for deploying backend to Render, frontend to Vercel, and database to Neon (free-tier PostgreSQL).

---

## Architecture Overview

```
Vercel (Frontend)  ──→  Render (Backend API)  ──→  Neon Postgres (DB)
       ↑                        ↑
   React + Vite            Node.js Express
   (Static CDN)           (Web Service)
```

---

## Step 1 — Set Up Database on Neon (Free)

1. Go to **https://neon.tech** → Sign Up (free, no credit card)
2. Create a new project → name it `mini-erp-crm`
3. Choose region closest to you (e.g., `us-east-1`)
4. From the **Dashboard → Connection Details**, copy the **Connection string**:
   ```
   postgresql://username:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this — you'll need it in Step 2

---

## Step 2 — Deploy Backend to Render

1. Go to **https://render.com** → Sign Up → **New → Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Environment**: `Node`
   - **Plan**: Free

4. Add the following **Environment Variables** in Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your Neon connection string from Step 1 |
   | `JWT_SECRET` | A long random string (min 64 chars) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | Your Vercel frontend URL (set after Step 3) |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |

5. Click **Deploy** → Wait for build to complete
6. Once live, copy the Render URL (e.g., `https://mini-erp-api.onrender.com`)
7. **Seed the database** by opening Render Shell tab and running:
   ```bash
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const bcrypt = require('bcryptjs');
   // (seed runs automatically via prisma seed in package.json)
   "
   ```
   Or add `&& npx ts-node prisma/seed.ts` to the build command temporarily.

---

## Step 3 — Deploy Frontend to Vercel

1. Go to **https://vercel.com** → Sign Up → **New Project**
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add **Environment Variable**:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | Your Render backend URL (e.g., `https://mini-erp-api.onrender.com`) |

5. Click **Deploy** → Copy the Vercel URL (e.g., `https://mini-erp-crm.vercel.app`)

6. Go back to **Render → Environment Variables** and update:
   - `CORS_ORIGIN` → set to your Vercel URL

7. Trigger a **Manual Redeploy** on Render so the CORS update takes effect.

---

## Step 4 — Verify Deployment

Test these URLs:

```bash
# Backend health
curl https://mini-erp-api.onrender.com/health

# Backend login
curl -X POST https://mini-erp-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ops.local","password":"Password123!"}'

# Frontend
open https://mini-erp-crm.vercel.app
```

---

## Local Docker Deployment (Alternative)

A `docker-compose.yml` is included for fully containerized local setup:

```bash
# From project root
cp .env.example .env
# Edit .env with your values

docker-compose up --build
```

Services started:
- `postgres` on port `5432`
- `backend` on port `5000`
- `frontend` on port `3000`

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=your_super_secret_64_char_minimum_key_here_change_this_now
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
PORT=5000
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## Test Credentials

All seeded accounts use password: **`Password123!`**

| Role | Email |
|------|-------|
| Admin | `admin@ops.local` |
| Sales | `sales@ops.local` |
| Warehouse | `warehouse@ops.local` |
| Accounts | `accounts@ops.local` |
