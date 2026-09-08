import { Router } from 'express';
import { Role } from '@prisma/client';
import * as challanController from './challans.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createChallanSchema, challanQuerySchema } from './challans.schema.js';

const router = Router();

// Protect all challan routes
router.use(authenticate);

router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validate({ body: createChallanSchema }),
  challanController.createChallan
);

router.get(
  '/',
  validate({ query: challanQuerySchema }),
  challanController.getChallans
);

router.get('/:id', challanController.getChallanById);

router.get('/:id/pdf', challanController.downloadChallanPdf);

router.put(
  '/:id/confirm',
  authorize(Role.ADMIN, Role.SALES),
  challanController.confirmChallan
);

router.put(
  '/:id/cancel',
  authorize(Role.ADMIN, Role.SALES),
  challanController.cancelChallan
);

export default router;
