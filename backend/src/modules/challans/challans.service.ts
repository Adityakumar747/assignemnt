import { Prisma, ChallanStatus, MovementType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { CreateChallanInput, ChallanQueryInput } from './challans.schema.js';

async function generateNextChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CH-${currentYear}-`;

  const latest = await tx.challan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      challanNumber: 'desc'
    },
    select: {
      challanNumber: true
    }
  });

  let nextSequence = 1;
  if (latest && latest.challanNumber) {
    const parts = latest.challanNumber.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, '0')}`;
}

export async function createChallan(input: CreateChallanInput, createdById: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId }
  });

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  // Fetch all product snapshots
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Verify all products exist
  for (const item of input.items) {
    if (!productMap.has(item.productId)) {
      throw new NotFoundError(`Product ID '${item.productId}'`);
    }
  }

  let totalQuantity = 0;
  let totalAmount = 0;

  const itemSnapshots = input.items.map((item) => {
    const prod = productMap.get(item.productId)!;
    const itemTotal = item.quantity * prod.unitPrice;
    totalQuantity += item.quantity;
    totalAmount += itemTotal;

    return {
      productId: item.productId,
      quantity: item.quantity,
      productNameSnapshot: prod.name,
      productSkuSnapshot: prod.sku,
      unitPriceSnapshot: prod.unitPrice
    };
  });

  return prisma.$transaction(async (tx) => {
    const challanNumber = await generateNextChallanNumber(tx);

    return tx.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        totalQuantity,
        totalAmount,
        status: ChallanStatus.DRAFT,
        createdById,
        items: {
          create: itemSnapshots
        }
      },
      include: {
        customer: true,
        items: true,
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    });
  });
}

export async function confirmChallan(challanId: string, confirmedById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: challanId },
      include: {
        items: true,
        customer: true
      }
    });

    if (!challan) {
      throw new NotFoundError('Challan');
    }

    if (challan.status !== ChallanStatus.DRAFT) {
      throw new AppError(
        `Only DRAFT challans can be confirmed. Current status: ${challan.status}`,
        400
      );
    }

    // Check stock for all items
    const shortages: string[] = [];
    const productUpdates: { product: any; requestedQty: number }[] = [];

    for (const item of challan.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        shortages.push(`Product '${item.productNameSnapshot}' (SKU: ${item.productSkuSnapshot}) no longer exists in inventory.`);
        continue;
      }

      if (product.currentStock < item.quantity) {
        shortages.push(
          `'${product.name}' (SKU: ${product.sku}) - Available: ${product.currentStock}, Required: ${item.quantity} (Short by: ${item.quantity - product.currentStock})`
        );
      } else {
        productUpdates.push({ product, requestedQty: item.quantity });
      }
    }

    if (shortages.length > 0) {
      throw new AppError(
        `Cannot confirm Challan ${challan.challanNumber}. Insufficient inventory:\n• ${shortages.join('\n• ')}`,
        400,
        { inventory: shortages }
      );
    }

    // Decrement stock and create StockMovement records
    for (const { product, requestedQty } of productUpdates) {
      await tx.product.update({
        where: { id: product.id },
        data: { currentStock: product.currentStock - requestedQty }
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: requestedQty,
          movementType: MovementType.OUT,
          reason: `Dispatched under Sales Challan ${challan.challanNumber}`,
          createdById: confirmedById
        }
      });
    }

    // Mark challan as CONFIRMED
    return tx.challan.update({
      where: { id: challanId },
      data: { status: ChallanStatus.CONFIRMED },
      include: {
        customer: true,
        items: true,
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    });
  });
}

export async function cancelChallan(challanId: string, cancelledById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id: challanId },
      include: { items: true }
    });

    if (!challan) {
      throw new NotFoundError('Challan');
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new AppError(`Challan ${challan.challanNumber} is already cancelled.`, 400);
    }

    // If CONFIRMED -> Restock all items (create reverse IN stock movements)
    if (challan.status === ChallanStatus.CONFIRMED) {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: MovementType.IN,
            reason: `Restocked from Cancelled Sales Challan ${challan.challanNumber}`,
            createdById: cancelledById
          }
        });
      }
    }

    // Mark status as CANCELLED
    return tx.challan.update({
      where: { id: challanId },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        items: true,
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    });
  });
}

export async function getChallans(query: ChallanQueryInput) {
  const { search, status, customerId, startDate, endDate, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ChallanWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { challanNumber: { contains: term, mode: 'insensitive' } },
      { customer: { businessName: { contains: term, mode: 'insensitive' } } },
      { customer: { name: { contains: term, mode: 'insensitive' } } }
    ];
  }

  const [total, challans] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, mobile: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        },
        items: true
      }
    })
  ]);

  return {
    items: challans,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getChallanById(id: string) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      createdBy: {
        select: { id: true, name: true, role: true, email: true }
      }
    }
  });

  if (!challan) {
    throw new NotFoundError('Challan');
  }

  return challan;
}
