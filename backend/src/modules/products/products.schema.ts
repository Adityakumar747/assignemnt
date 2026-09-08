import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().trim().toUpperCase().min(3, 'SKU must be at least 3 characters'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
  currentStock: z.coerce.number().int().min(0, 'Current stock cannot be negative').default(0),
  minStockAlert: z.coerce.number().int().min(0, 'Min stock alert cannot be negative').default(10),
  location: z.string().trim().min(2, 'Warehouse location must be at least 2 characters')
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export const stockMovementSchema = z.object({
  quantityChanged: z.coerce.number().int().positive('Quantity must be a positive integer'),
  movementType: z.nativeEnum(MovementType, {
    errorMap: () => ({ message: 'Movement type must be either IN or OUT' })
  }),
  reason: z.string().trim().min(2, 'Reason must be at least 2 characters')
});

export const stockMovementQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  movementType: z.nativeEnum(MovementType).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>;
