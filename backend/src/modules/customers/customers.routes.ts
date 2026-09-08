import { Router } from 'express';
import { Role } from '@prisma/client';
import * as customerController from './customers.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  createNoteSchema
} from './customers.schema.js';

const router = Router();

// Protect all customer routes with authentication
router.use(authenticate);

router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validate({ body: createCustomerSchema }),
  customerController.createCustomer
);

router.get(
  '/',
  validate({ query: customerQuerySchema }),
  customerController.getCustomers
);

router.get('/:id', customerController.getCustomerById);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validate({ body: updateCustomerSchema }),
  customerController.updateCustomer
);

router.post(
  '/:id/notes',
  authorize(Role.ADMIN, Role.SALES),
  validate({ body: createNoteSchema }),
  customerController.addCustomerNote
);

export default router;
