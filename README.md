# Mini ERP + CRM — Wholesale Operations Portal

> **Full-stack screening assignment** — Senior Full Stack Developer role.  
> Demonstrates production-grade business logic, RBAC, atomic transactions, and clean architecture across a React + Node.js + PostgreSQL monorepo.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Feature Matrix](#feature-matrix)
- [RBAC — Role Permissions](#rbac--role-permissions)
- [Getting Started (Local)](#getting-started-local)
- [Getting Started (Docker)](#getting-started-docker)
- [API Reference](#api-reference)
- [Key Business Logic](#key-business-logic)
- [Folder Structure](#folder-structure)
- [Seeded Test Data](#seeded-test-data)
- [Design Decisions](#design-decisions)

---

## Project Overview

A wholesale/distribution management console combining:

| Module | Description |
|--------|-------------|
| **Auth & RBAC** | JWT-based authentication, 4 roles, route-level guards |
| **Customer CRM** | Full CRUD, status pipeline, notes timeline, follow-up dates |
| **Product Inventory** | SKU catalogue, atomic stock IN/OUT movements, low-stock alerts |
| **Sales Challans** | Sequential IDs, multi-line orders, draft → confirm → cancel lifecycle |
| **Stock Ledger** | Immutable audit trail of all inventory movements |
| **PDF Export** | Server-side PDFKit invoice generation per challan |

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 + `express-async-errors` |
| Database | PostgreSQL 16 (embedded for local dev) |
| ORM | Prisma 6 |
| Auth | JWT + bcrypt |
| Validation | Zod |
| PDF | PDFKit |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router DOM v7 |
| Data Fetching | TanStack Query (React Query) v5 |
| Forms | React Hook Form + Zod resolver |
| Animation | Framer Motion |
| HTTP Client | Axios |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  Login → Protected Routes → TanStack Query → Axios → API calls  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/JSON  (port 5000)
┌────────────────────────▼────────────────────────────────────────┐
│                    Express API Server                            │
│                                                                  │
│  /api/auth  →  Auth Module (JWT, bcrypt)                        │
│  /api/customers → CRM Module (CRUD, Notes)                      │
│  /api/products  → Inventory Module (Stock Movements)            │
│  /api/challans  → Challan Module (Lifecycle + PDF)              │
│                                                                  │
│  Middleware: authenticate → authorize(roles) → controller       │
└────────────────────────┬────────────────────────────────────────┘
                         │ Prisma Client (typed queries)
┌────────────────────────▼────────────────────────────────────────┐
│                    PostgreSQL 16                                  │
│  users | customers | customer_notes                             │
│  products | stock_movements                                      │
│  challans | challan_items                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| JWT Authentication | ✅ | Access token, `/me` endpoint |
| Role-Based Access Control | ✅ | 4 roles, route + action level |
| Customer CRUD | ✅ | Zod-validated, paginated |
| Customer Search & Filter | ✅ | Full-text, status/type filter |
| Customer Notes Timeline | ✅ | Chronological, author-stamped |
| Follow-Up Date Tracking | ✅ | ISO datetime, filterable |
| Product Catalogue | ✅ | SKU, category, price, location |
| Stock IN / OUT (Atomic) | ✅ | `prisma.$transaction` guard |
| Negative Stock Prevention | ✅ | Hard reject at transaction level |
| Low Stock Alerts | ✅ | `minStockAlert` threshold |
| Stock Ledger / Audit | ✅ | Full movement history with reasons |
| Challan Draft Creation | ✅ | Sequential CH-YYYY-XXXX |
| Immutable Price Snapshots | ✅ | `ChallanItem` stores point-in-time price |
| Challan Confirm (Atomic) | ✅ | Multi-product stock reduction in single tx |
| Challan Cancel + Restock | ✅ | Reversal IN movements created atomically |
| PDF Challan Export | ✅ | Server-side PDFKit, streams to client |
| React Dashboard | ✅ | KPI cards, top products, recent challans |
| Role-Aware Navigation | ✅ | Sidebar items filtered by role |
| Evaluator Role Switcher | ✅ | One-click login for all 4 roles |
| Docker Compose | ✅ | PostgreSQL + Backend + Nginx frontend |
| Postman Collection | ✅ | All endpoints + auto-token, RBAC tests |

---

## RBAC — Role Permissions

| Endpoint | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|----------|:-----:|:-----:|:---------:|:--------:|
| GET /api/customers | ✅ | ✅ | ❌ | ✅ |
| POST/PUT /api/customers | ✅ | ✅ | ❌ | ❌ |
| DELETE /api/customers | ✅ | ❌ | ❌ | ❌ |
| Customer Notes | ✅ | ✅ | ❌ | ✅ |
| GET /api/products | ✅ | ✅ | ✅ | ✅ |
| POST/PUT /api/products | ✅ | ❌ | ✅ | ❌ |
| DELETE /api/products | ✅ | ❌ | ❌ | ❌ |
| Stock Adjustment IN/OUT | ✅ | ❌ | ✅ | ❌ |
| Stock Ledger (read) | ✅ | ❌ | ✅ | ✅ |
| GET /api/challans | ✅ | ✅ | ✅ | ✅ |
| POST /api/challans | ✅ | ✅ | ❌ | ❌ |
| PATCH confirm/cancel | ✅ | ✅ | ❌ | ❌ |
| GET /api/challans/:id/pdf | ✅ | ✅ | ✅ | ✅ |

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+ 
- npm 9+

### 1. Clone & Install

```bash
git clone <repo-url> mini-erp-crm
cd mini-erp-crm
npm install          # root workspace
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Copy and edit backend environment
cp backend/.env.example backend/.env
```

The default `.env` for local dev works out-of-the-box with the embedded PostgreSQL runner:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp_crm?schema=public"
JWT_SECRET="local_dev_secret_change_in_prod"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
```

### 3. Start the Database (Embedded PostgreSQL)

```bash
cd backend
npm run db:start
```

> This starts a real PostgreSQL 16 instance inside `backend/data/postgres/` — no Docker needed.

### 4. Run Migrations & Seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Backend

```bash
cd backend
npm run dev          # Runs on http://localhost:5000
```

### 6. Start Frontend

```bash
cd frontend
npm run dev          # Runs on http://localhost:5173
```

### 7. Open the App

Navigate to **http://localhost:5173** — you will see the login page.

Use the **Quick Login buttons** (bottom of login card) to instantly authenticate as any role.

---

## Getting Started (Docker)

### Prerequisites

- Docker Desktop / Docker Engine + Compose v2

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env to set secure JWT_SECRET for production
```

### 2. Build & Run

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5432 |

### 3. Seed Data

On first run the backend auto-runs `prisma migrate deploy`. To seed:

```bash
docker compose exec backend npx prisma db seed
```

### Useful Commands

```bash
docker compose down          # Stop all services
docker compose down -v       # Stop + wipe database volume
docker compose logs backend  # View backend logs
```

---

## API Reference

Import `Mini-ERP-CRM.postman_collection.json` into Postman for a complete, interactive API reference.

### Quick Reference

```
GET    /health                          — Service health check

POST   /api/auth/login                  — Get JWT token
GET    /api/auth/me                     — Current user profile

GET    /api/customers                   — List (paginated, filterable)
POST   /api/customers                   — Create
GET    /api/customers/:id               — Get single
PUT    /api/customers/:id               — Update
DELETE /api/customers/:id               — Delete (Admin)
POST   /api/customers/:id/notes         — Add CRM note

GET    /api/products                    — List (paginated, filterable)
POST   /api/products                    — Create
GET    /api/products/:id                — Get single
PUT    /api/products/:id                — Update
DELETE /api/products/:id                — Delete (Admin)
POST   /api/products/:id/stock          — Adjust stock (IN/OUT)
GET    /api/products/movements          — Stock ledger

GET    /api/challans                    — List (paginated, filterable)
POST   /api/challans                    — Create (Draft)
GET    /api/challans/:id                — Get single
PATCH  /api/challans/:id/confirm        — Confirm (atomic stock deduction)
PATCH  /api/challans/:id/cancel         — Cancel (atomic restock)
GET    /api/challans/:id/pdf            — Download invoice PDF
```

---

## Key Business Logic

### 1. Atomic Stock Movements

Every stock change (manual adjustment or challan confirmation) runs inside a `prisma.$transaction`:

```typescript
// Pseudocode — see backend/src/modules/products/products.service.ts
await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUniqueOrThrow({ where: { id } });
  if (type === 'OUT' && product.currentStock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }
  await tx.product.update({
    where: { id },
    data: { currentStock: { increment/decrement: quantity } }
  });
  await tx.stockMovement.create({ data: { ... } });
});
```

### 2. Challan Price Snapshots

`ChallanItem` stores three snapshot fields at the time of challan creation:

```typescript
productNameSnapshot: string   // Product name at time of order
productSkuSnapshot: string    // SKU at time of order
unitPriceSnapshot: float      // Price at time of order
```

This ensures the challan/invoice is historically accurate even if the product's master data is later changed.

### 3. Sequential Challan Numbers

Format: `CH-YYYY-XXXX` (e.g., `CH-2025-0001`)

Generated by counting existing challans for the current year and padding to 4 digits — ensures unique, human-readable references.

### 4. Cancel → Restock Logic

Cancelling a CONFIRMED challan creates reversal `IN` stock movements for each item in a single transaction, restoring inventory to the pre-confirmation state.

---

## Folder Structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 7 models, 5 enums
│   │   ├── seed.ts             # Seeder (4 users, 8 products, 3 customers)
│   │   └── migrations/
│   ├── scripts/
│   │   └── db-runner.js        # Embedded PostgreSQL starter
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts          # Zod-validated environment config
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authenticate + authorize(roles)
│   │   │   └── errorHandler.ts # Centralized error handler
│   │   ├── modules/
│   │   │   ├── auth/           # Login, /me
│   │   │   ├── customers/      # CRM CRUD + Notes
│   │   │   ├── products/       # Inventory + Stock movements
│   │   │   └── challans/       # Challan lifecycle + PDF
│   │   ├── app.ts              # Express setup, routes
│   │   └── server.ts           # HTTP server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # Typed Axios client + API modules
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI primitives
│   │   │   └── layout/
│   │   │       └── AppLayout.tsx  # Sidebar, nav, role switcher
│   │   ├── context/
│   │   │   └── AuthContext.tsx # JWT auth state, login/logout
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ChallansPage.tsx
│   │   │   └── StockLedgerPage.tsx
│   │   ├── types/              # Shared TypeScript interfaces
│   │   └── App.tsx             # Router + protected routes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
├── Mini-ERP-CRM.postman_collection.json
└── PROJECT_STATUS.md
```

---

## Seeded Test Data

All accounts use password: **`Password123!`**

| Role | Email | Access Level |
|------|-------|-------------|
| Admin | admin@ops.local | Full system access |
| Sales | sales@ops.local | Customers, create/confirm challans, view products |
| Warehouse | warehouse@ops.local | Inventory, stock adjustments, view challans |
| Accounts | accounts@ops.local | Read-only: challans, customers, PDF export |

### Sample Products (8)

| SKU | Product | Stock | Category |
|-----|---------|-------|----------|
| STL-PIPE-001 | Industrial Steel Pipe 50mm | 150 | Steel |
| STL-ROD-002 | Stainless Rod 12mm | 300 | Steel |
| HW-BOLT-001 | Hex Bolt M8×30 | 2000 | Fasteners |
| HW-NUT-002 | Hex Nut M8 | 1800 | Fasteners |
| SEAL-ORG-001 | O-Ring Seal 25mm | 500 | Seals |
| PIPE-PVC-001 | PVC Pipe 40mm | 80 | Pipes |
| MTR-PUMP-001 | Centrifugal Pump Motor | 8 | Motors |
| WELD-ROD-001 | Welding Rod E6013 | 40 | Welding |

---

## Design Decisions

### Why Embedded PostgreSQL?
Zero-config local development. Evaluators can clone → install → run without any external services. The same `DATABASE_URL` variable transparently connects to cloud Postgres in production.

### Why Immutable Snapshots in ChallanItem?
Historical financial records must not change. If a product price changes after a challan is confirmed, the challan must still reflect the original price. Storing snapshots in the line item row is the simplest, most reliable approach.

### Why `prisma.$transaction` for Every Stock Change?
Prevents race conditions in concurrent requests. Without transactions, two simultaneous challan confirmations could both pass the stock check but together reduce stock below zero.

### Why TanStack Query?
Provides automatic caching, background refetch, optimistic updates, and loading/error states out of the box — eliminating a large class of data-synchronization bugs that would otherwise need manual `useState` management.

### Why Not Redux?
The app has no complex shared state that requires cross-component synchronization. Server state (TanStack Query) + local React state covers all cases cleanly without additional complexity.
