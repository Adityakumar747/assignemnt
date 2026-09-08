import { Prisma, MovementType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ConflictError, AppError } from '../../utils/errors.js';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  StockMovementInput,
  StockMovementQueryInput
} from './products.schema.js';

export async function createProduct(input: CreateProductInput, createdById?: string) {
  const existing = await prisma.product.findUnique({
    where: { sku: input.sku }
  });

  if (existing) {
    throw new ConflictError(`A product with SKU '${input.sku}' already exists.`);
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        category: input.category,
        unitPrice: input.unitPrice,
        currentStock: input.currentStock,
        minStockAlert: input.minStockAlert,
        location: input.location
      }
    });

    if (input.currentStock > 0 && createdById) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: input.currentStock,
          movementType: MovementType.IN,
          reason: 'Initial stock setup upon product creation',
          createdById
        }
      });
    }

    return product;
  });
}

export async function getProducts(query: ProductQueryInput) {
  const { search, category, lowStock, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};

  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
      { location: { contains: term, mode: 'insensitive' } }
    ];
  }

  if (lowStock === 'true') {
    const lowStockRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM products WHERE "currentStock" <= "minStockAlert"
    `;
    const lowStockIds = lowStockRows.map((r) => r.id);
    where.id = { in: lowStockIds };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    items: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { id: true, name: true, role: true, email: true }
          }
        }
      }
    }
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Product');
  }

  if (input.sku && input.sku !== existing.sku) {
    const duplicate = await prisma.product.findUnique({
      where: { sku: input.sku }
    });
    if (duplicate) {
      throw new ConflictError(`A product with SKU '${input.sku}' already exists.`);
    }
  }

  return prisma.product.update({
    where: { id },
    data: input
  });
}

export async function createStockMovement(
  productId: string,
  createdById: string,
  input: StockMovementInput
) {
  const { quantityChanged, movementType, reason } = input;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (movementType === MovementType.OUT && product.currentStock < quantityChanged) {
      throw new AppError(
        `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested reduction: ${quantityChanged}`,
        400
      );
    }

    const newStock =
      movementType === MovementType.IN
        ? product.currentStock + quantityChanged
        : product.currentStock - quantityChanged;

    const [updatedProduct, movement] = await Promise.all([
      tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      }),
      tx.stockMovement.create({
        data: {
          productId,
          quantityChanged,
          movementType,
          reason,
          createdById
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true, email: true }
          }
        }
      })
    ]);

    return {
      product: updatedProduct,
      movement
    };
  });
}

export async function getProductStockMovements(
  productId: string,
  query: StockMovementQueryInput
) {
  const { page = 1, limit = 20, movementType } = query;
  const skip = (page - 1) * limit;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError('Product');
  }

  const where: Prisma.StockMovementWhereInput = {
    productId,
    ...(movementType ? { movementType } : {})
  };

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    })
  ]);

  return {
    items: movements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getAllStockMovements(query: StockMovementQueryInput) {
  const { page = 1, limit = 20, movementType } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StockMovementWhereInput = {
    ...(movementType ? { movementType } : {})
  };

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, currentStock: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true, email: true }
        }
      }
    })
  ]);

  return {
    items: movements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          challanItems: true,
          stockMovements: true
        }
      }
    }
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  // If product is referenced in historical challans, prevent deletion to preserve order snapshot integrity
  if (product._count.challanItems > 0) {
    throw new AppError(
      `Cannot delete product '${product.name}' (${product.sku}) because it is linked to ${product._count.challanItems} sales challan(s). Archive or set stock to 0 instead.`,
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    if (product._count.stockMovements > 0) {
      await tx.stockMovement.deleteMany({
        where: { productId: id }
      });
    }

    return tx.product.delete({
      where: { id }
    });
  });
}

