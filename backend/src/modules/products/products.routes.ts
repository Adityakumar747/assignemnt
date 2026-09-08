import { Router } from 'express';
import { Role } from '@prisma/client';
import * as productController from './products.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  stockMovementSchema,
  stockMovementQuerySchema
} from './products.schema.js';

const router = Router();

// Require authentication for all product & stock routes
router.use(authenticate);

// Global stock movements ledger
router.get(
  '/movements/ledger',
  validate({ query: stockMovementQuerySchema }),
  productController.getAllStockMovements
);

router.post(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate({ body: createProductSchema }),
  productController.createProduct
);

router.get(
  '/',
  validate({ query: productQuerySchema }),
  productController.getProducts
);

router.get('/:id', productController.getProductById);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate({ body: updateProductSchema }),
  productController.updateProduct
);

router.post(
  '/:id/stock-movements',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate({ body: stockMovementSchema }),
  productController.createStockMovement
);

router.get(
  '/:id/stock-movements',
  validate({ query: stockMovementQuerySchema }),
  productController.getProductStockMovements
);

export default router;
