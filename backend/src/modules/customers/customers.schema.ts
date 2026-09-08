import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Contact name must be at least 2 characters'),
  mobile: z.string().trim().min(8, 'Mobile number must be at least 8 digits'),
  email: z.string().trim().email('Invalid email address'),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().trim().toUpperCase().refine((val) => val === '' || gstRegex.test(val), {
    message: 'Invalid GST number format (15 characters alphanumeric, e.g., 27AABCA1234F1Z1)'
  }).optional().nullable(),
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR' })
  }),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  customerType: z.nativeEnum(CustomerType).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export const createNoteSchema = z.object({
  note: z.string().trim().min(2, 'Note content must be at least 2 characters')
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
