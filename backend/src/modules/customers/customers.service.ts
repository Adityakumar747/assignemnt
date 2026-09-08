import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
  CreateNoteInput
} from './customers.schema.js';

export async function createCustomer(input: CreateCustomerInput) {
  // Check for duplicate email or mobile
  const existing = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: input.email.toLowerCase() },
        { mobile: input.mobile }
      ]
    }
  });

  if (existing) {
    throw new ConflictError(
      existing.email.toLowerCase() === input.email.toLowerCase()
        ? 'A customer with this email address already exists.'
        : 'A customer with this mobile number already exists.'
    );
  }

  const followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;

  return prisma.customer.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      email: input.email.toLowerCase(),
      businessName: input.businessName,
      gstNumber: input.gstNumber || null,
      customerType: input.customerType,
      address: input.address,
      status: input.status,
      followUpDate
    }
  });
}

export async function getCustomers(query: CustomerQueryInput) {
  const { search, status, customerType, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (customerType) {
    where.customerType = customerType;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { mobile: { contains: term, mode: 'insensitive' } },
      { businessName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } }
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, challans: true }
        }
      }
    })
  ]);

  return {
    items: customers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, role: true, email: true }
          }
        }
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          challanNumber: true,
          status: true,
          totalQuantity: true,
          totalAmount: true,
          createdAt: true
        }
      }
    }
  });

  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return customer;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Customer');
  }

  // Check unique constraints if email or mobile changed
  if (input.email || input.mobile) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(input.email ? [{ email: input.email.toLowerCase() }] : []),
          ...(input.mobile ? [{ mobile: input.mobile }] : [])
        ]
      }
    });

    if (duplicate) {
      throw new ConflictError(
        duplicate.email.toLowerCase() === input.email?.toLowerCase()
          ? 'Another customer already uses this email address.'
          : 'Another customer already uses this mobile number.'
      );
    }
  }

  const data: Prisma.CustomerUpdateInput = { ...input };
  if (input.email) data.email = input.email.toLowerCase();
  if (input.followUpDate !== undefined) {
    data.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
  }

  return prisma.customer.update({
    where: { id },
    data
  });
}

export async function addCustomerNote(
  customerId: string,
  authorId: string,
  input: CreateNoteInput
) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new NotFoundError('Customer');
  }

  return prisma.customerNote.create({
    data: {
      customerId,
      authorId,
      note: input.note
    },
    include: {
      author: {
        select: { id: true, name: true, role: true, email: true }
      }
    }
  });
}
