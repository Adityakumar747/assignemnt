# 🎬 Demo Video Script — Mini ERP + CRM Portal

> **Target duration**: 4–6 minutes  
> **Format**: Screen recording with voice-over  
> **Tool**: Use OBS / Loom / Windows Game Bar (Win+G)

---

## Before You Start Recording

1. Open browser at `http://localhost:5173` (or your Vercel URL)
2. Clear browser cache / open Incognito tab
3. Have the login page visible — fields should be empty
4. Keep terminal hidden behind browser

---

## 🎬 SCENE 1 — Introduction (0:00 – 0:30)

**[Show the login page]**

> *"Hi, I'm presenting my submission for the Full Stack Developer case study. I've built a Mini ERP and CRM Operations Portal for a wholesale distribution company using React, Node.js, TypeScript, PostgreSQL, and Prisma ORM."*

> *"The system supports 4 user roles — Admin, Sales, Warehouse, and Accounts — each with their own permissions enforced at the API level using JWT and role-based access control."*

> *"Let me walk you through each module."*

---

## 🎬 SCENE 2 — Login & Authentication (0:30 – 1:00)

**[On the Login page]**

> *"Here is the clean split-screen login page. On the left is the form, on the right is the hero image."*

1. **Click** "Need test credentials?" link at the bottom
2. **Click** "Admin Account" button → email auto-fills as `admin@ops.local`, password fills as `Password123!`

> *"I've seeded 4 test accounts. Clicking an account auto-fills the credentials."*

3. **Click** "Log in" button

> *"Authentication is JWT-based. The token is stored in localStorage and sent as a Bearer token with every API request."*

---

## 🎬 SCENE 3 — Dashboard (1:00 – 1:30)

**[You're now on the Dashboard]**

> *"The dashboard shows real-time KPI cards — total customers, products, active challans, and low-stock alerts — all fetched from the API on load."*

1. **Point to** the KPI cards (customers, products, challans, low stock count)
2. **Point to** the left sidebar navigation

> *"The sidebar shows only the modules that the logged-in role can access. As Admin, I can see everything."*

---

## 🎬 SCENE 4 — Customer CRM Module (1:30 – 2:30)

**[Click "Customer CRM" in the sidebar]**

> *"The Customer CRM module manages the company's wholesale and retail customers."*

1. **Point to** the search bar at the top

> *"I can search customers by name, mobile, or business name in real time."*

2. **Click** any customer row to open the detail panel

> *"Each customer has all 10 required fields — name, mobile, email, business name, GST number, customer type, address, status, follow-up date, and notes."*

3. **Point to** the Notes timeline at the bottom of the detail panel

> *"The notes section works like a CRM activity log — each team member can add follow-up notes with timestamps."*

4. **Click** "Add Customer" button → Show the form modal

> *"The form uses Zod validation — all required fields are enforced before the API call."*

5. **Press Escape** to close

---

## 🎬 SCENE 5 — Products & Inventory (2:30 – 3:15)

**[Click "Products & Stock" in the sidebar]**

> *"The product module manages the entire SKU catalogue with real-time stock tracking."*

1. **Point to** the table — show SKU, category, price, stock, location columns
2. **Point to** any row with red/orange stock badge

> *"Products with stock below their minimum alert threshold are highlighted — giving warehouse staff instant visibility into what needs restocking."*

3. **Click** "Stock In" or "Stock Out" button on any product

> *"Clicking Stock IN or OUT opens a movement form. Every movement is tracked — who did it, when, and why. This creates an immutable audit trail."*

4. **Close** the modal
5. **Click** "Add Product" (shows form)

> *"Only Admin can add or delete products. Sales and Warehouse cannot modify the catalogue."*

6. **Press Escape**

---

## 🎬 SCENE 6 — Sales Challan Module (3:15 – 4:15)

**[Click "Sales Challans" in the sidebar]**

> *"The Sales Challan module is the core transactional flow — this is where orders are created and stock is dispatched."*

1. **Click** "New Challan" button

> *"I'll create a new challan now."*

2. **Click** the Customer dropdown → type a name → select a customer

> *"First I select the customer."*

3. **Click** "Add Product" in the line items section → search and select a product → enter a quantity

> *"Then I add products and quantities. The system checks stock availability in real time."*

4. **Click** "Save as Draft"

> *"Saving as Draft does not reduce stock. The challan is reserved but not yet committed."*

5. **Find** the draft challan in the list → **Click** "Confirm"

> *"When I confirm the challan, the backend runs an atomic database transaction — it checks stock for every line item, reduces the stock, and creates stock movement audit records — all or nothing. If any product is out of stock, the entire operation is rejected."*

6. **Click** "Download PDF" / "Export Invoice"

> *"Each confirmed challan can be exported as a PDF invoice, generated server-side using PDFKit."*

---

## 🎬 SCENE 7 — Stock Ledger (4:15 – 4:45)

**[Click "Stock Ledger" in the sidebar]**

> *"The stock ledger is a read-only audit trail of every single stock movement in the system — both manual adjustments and automated challan deductions."*

1. **Point to** the table columns: product, movement type, quantity, reason, created by, timestamp

> *"This gives the accounts and warehouse teams full transparency over inventory history."*

---

## 🎬 SCENE 8 — Role-Based Access (4:45 – 5:15)

**[Click Sign Out → Go back to login page]**

1. **Click** "Need test credentials?" → **Click** "Sales Account" → Log in

> *"Let me log in as a Sales user to demonstrate role-based access control."*

2. **Look at the sidebar** — point out that Stock Ledger is gone

> *"Notice the Stock Ledger is not visible to Sales. RBAC is enforced both in the UI and at the API level — the backend will return 403 Forbidden even if someone tries to call that endpoint directly."*

---

## 🎬 SCENE 9 — Closing (5:15 – 5:30)

**[Show the login page or dashboard one final time]**

> *"To summarise: this project covers all required modules — Authentication with 4 roles, Customer CRM with notes timeline, Product Inventory with atomic stock movements, and Sales Challans with price snapshots and automatic stock management."*

> *"The backend is deployed on Render, frontend on Vercel, and the database on Neon's free-tier PostgreSQL. All code is on GitHub with a full README."*

> *"Thank you for reviewing my submission."*

---

## 📋 Recording Checklist

- [ ] Incognito browser tab open
- [ ] Login page visible and empty at start
- [ ] Microphone tested
- [ ] Screen resolution set to 1920×1080 if possible
- [ ] Notifications / pop-ups disabled
- [ ] Record at 30fps or higher
- [ ] Keep total video under 6 minutes
