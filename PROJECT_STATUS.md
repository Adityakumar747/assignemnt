# Mini ERP + CRM Operations Portal — Project State & Progress Log

> **Purpose**: This living document tracks the exact status of each build phase, test verification, architecture details, and next steps so that any developer or AI model can instantly understand current state without re-reading the entire trajectory.

---

## 📌 Quick Summary
- **Project**: Wholesale / Distribution Mini ERP & CRM Operations Console
- **Location**: `y:\assignment`
- **Tech Stack**:
  - Backend: Node.js, TypeScript, Express, PostgreSQL, Prisma ORM, Zod, JWT, Bcrypt, PDFKit
  - Frontend: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Framer Motion
- **Current Phase**: Phase 1 (Database Schema & Seed Setup)
- **Overall Status**: IN PROGRESS

---

## 🧭 Phase Completion Tracker

| Phase | Description | Status | Verification & Checks |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Project Init & Git Monorepo | ✅ Completed | Git initialized, monorepo structure created, `.gitignore` active |
| **Phase 1** | Database Schema & Seed Data | ✅ Completed | PostgreSQL 18.4 running, Prisma schema applied (7 models, enums), seeded 4 roles, 8 products with varied stock, 3 customers, initial stock movements |
| **Phase 2** | Auth & RBAC Middleware | 🔄 In Progress | Login (JWT), /me, authenticate, authorize role guards |
| **Phase 3** | Customer CRM Module | ⏳ Pending | CRUD, validation, search, filter, pagination, notes timeline |
| **Phase 4** | Product & Inventory Module | ⏳ Pending | CRUD, low stock filter, atomic stock IN/OUT transactions, negative check |
| **Phase 5** | Sales Challan Module | ⏳ Pending | Sequential numbers, product snapshotting, atomic confirm/cancel stock adjustments |
| **Phase 6** | Frontend Industrial Console | ⏳ Pending | Custom industrial ops theme, role-based nav, dashboard, customer/product/challan screens |
| **Phase 7** | Polish, PDF, Docker & Postman | ⏳ Pending | PDF challan/invoice export, Docker Compose, Postman collection, README documentation |

---

## 🔑 Test Credentials (Seeded)
- All accounts use password: `Password123!`
- **Admin**: `admin@ops.local` (Full system access)
- **Sales**: `sales@ops.local` (Customers, Draft & Confirm Challans, Product View)
- **Warehouse**: `warehouse@ops.local` (Inventory, Stock Movements IN/OUT, Challan View)
- **Accounts**: `accounts@ops.local` (Read-only Challans, Invoices, Customers)

---

## 🏗️ Architecture & Business Logic Rules
1. **Stock Movements**:
   - `OUT` movement is strictly rejected if `currentStock < requested`.
   - Update `currentStock` and insert `StockMovement` inside a single `prisma.$transaction`.
2. **Sales Challan**:
   - Stores immutable snapshots of product name, SKU, and unit price in `ChallanItem`.
   - Auto-generated sequential ID (`CH-YYYY-XXXX`).
   - `CONFIRM`: Atomic stock decrement + `StockMovement` generation. Rejects if any product is short.
   - `CANCEL`: Restocks items (reversal `IN` stock movement) if cancelled after confirmation.
3. **Database Local Strategy**:
   - Uses embedded PostgreSQL runner (`npm run db:start`) for self-contained 100% native Postgres execution without external Docker or service setup needed.
   - Supports any cloud Postgres (`DATABASE_URL`) seamlessly.
