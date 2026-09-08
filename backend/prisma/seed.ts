import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // 1. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Seed Users
  const usersData = [
    {
      name: 'Alex Vance (Admin)',
      email: 'admin@ops.local',
      passwordHash,
      role: Role.ADMIN
    },
    {
      name: 'Sarah Jenkins (Sales)',
      email: 'sales@ops.local',
      passwordHash,
      role: Role.SALES
    },
    {
      name: 'Warren Hayes (Warehouse)',
      email: 'warehouse@ops.local',
      passwordHash,
      role: Role.WAREHOUSE
    },
    {
      name: 'Alice Miller (Accounts)',
      email: 'accounts@ops.local',
      passwordHash,
      role: Role.ACCOUNTS
    }
  ];

  const createdUsers: Record<string, string> = {};

  for (const user of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      const created = await prisma.user.create({ data: user });
      createdUsers[user.role] = created.id;
      console.log(`[Seed] Created user: ${user.name} (${user.email})`);
    } else {
      createdUsers[user.role] = existing.id;
      console.log(`[Seed] User already exists: ${user.email}`);
    }
  }

  const adminId = createdUsers[Role.ADMIN];
  const salesId = createdUsers[Role.SALES];
  const warehouseId = createdUsers[Role.WAREHOUSE];

  // 3. Seed Products
  const productsData = [
    {
      name: 'Grade 8.8 Hex Bolts M12x50',
      sku: 'PRD-FST-001',
      category: 'Fasteners',
      unitPrice: 14.50,
      currentStock: 450,
      minStockAlert: 100,
      location: 'Bay A-01'
    },
    {
      name: 'Stainless Steel Lock Nuts M10',
      sku: 'PRD-FST-002',
      category: 'Fasteners',
      unitPrice: 8.20,
      currentStock: 25, // Low stock
      minStockAlert: 50,
      location: 'Bay A-02'
    },
    {
      name: 'Deep Groove Ball Bearing 6205-2RS',
      sku: 'PRD-BRG-101',
      category: 'Bearings',
      unitPrice: 245.00,
      currentStock: 120,
      minStockAlert: 30,
      location: 'Rack B-12'
    },
    {
      name: 'Tapered Roller Bearing 32208',
      sku: 'PRD-BRG-102',
      category: 'Bearings',
      unitPrice: 580.00,
      currentStock: 8, // Low stock
      minStockAlert: 15,
      location: 'Rack B-14'
    },
    {
      name: 'Nitrile O-Ring Seal Kit (Universal 382 Pcs)',
      sku: 'PRD-HYD-201',
      category: 'Hydraulics',
      unitPrice: 850.00,
      currentStock: 140,
      minStockAlert: 40,
      location: 'Bin C-03'
    },
    {
      name: 'High-Pressure Hydraulic Hose 1/2" 5-Meter',
      sku: 'PRD-HYD-202',
      category: 'Hydraulics',
      unitPrice: 1250.00,
      currentStock: 22,
      minStockAlert: 10,
      location: 'Rack C-07'
    },
    {
      name: 'Industrial Armored Cable 4-Core 6mm (Per Meter)',
      sku: 'PRD-ELC-301',
      category: 'Electrical',
      unitPrice: 320.00,
      currentStock: 500,
      minStockAlert: 100,
      location: 'Drum Area D-01'
    },
    {
      name: 'Heavy-Duty Motor Contactor 32A 24V Coil',
      sku: 'PRD-ELC-302',
      category: 'Electrical',
      unitPrice: 890.00,
      currentStock: 5, // Low stock
      minStockAlert: 12,
      location: 'Bin D-05'
    }
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    if (!existing) {
      const created = await prisma.product.create({ data: prod });
      // Log initial stock movement
      if (prod.currentStock > 0 && warehouseId) {
        await prisma.stockMovement.create({
          data: {
            productId: created.id,
            quantityChanged: prod.currentStock,
            movementType: MovementType.IN,
            reason: 'Initial stock intake batch from supplier',
            createdById: warehouseId
          }
        });
      }
      console.log(`[Seed] Created product: ${prod.name} (SKU: ${prod.sku}, Stock: ${prod.currentStock})`);
    } else {
      console.log(`[Seed] Product already exists: ${prod.sku}`);
    }
  }

  // 4. Seed Customers
  const customersData = [
    {
      name: 'Rajesh Sharma',
      businessName: 'Apex Heavy Engineering Works',
      mobile: '+91 98200 11223',
      email: 'procurement@apexheavyeng.com',
      gstNumber: '27AABCA1234F1Z1',
      customerType: CustomerType.WHOLESALE,
      address: 'Plot 45-B, MIDC Industrial Area, Phase II, Turbhe, Navi Mumbai - 400705',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Pooja Mehta',
      businessName: 'Metro Industrial Supply Corp',
      mobile: '+91 98110 99887',
      email: 'orders@metrosupply.in',
      gstNumber: '27XYZPA9876Q1Z2',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Shop 12-14, Commercial Complex, Sector 18, Gurugram, Haryana - 122001',
      status: CustomerStatus.ACTIVE,
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Karan Dave',
      businessName: 'Precision Tools & Hydraulics',
      mobile: '+91 98334 45566',
      email: 'contact@precisionhydraulics.net',
      gstNumber: null,
      customerType: CustomerType.RETAIL,
      address: 'Gala No. 4, Star Compound, Kherani Road, Sakinaka, Mumbai - 400072',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    }
  ];

  for (const cust of customersData) {
    const existing = await prisma.customer.findFirst({ where: { email: cust.email } });
    if (!existing) {
      const created = await prisma.customer.create({ data: cust });
      // Add initial CRM notes
      if (salesId) {
        await prisma.customerNote.create({
          data: {
            customerId: created.id,
            authorId: salesId,
            note: 'Initial account setup completed. Customer expressed interest in bulk monthly bearing orders.'
          }
        });
      }
      console.log(`[Seed] Created customer: ${cust.businessName} (${cust.name})`);
    } else {
      console.log(`[Seed] Customer already exists: ${cust.email}`);
    }
  }

  console.log('[Seed] Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
