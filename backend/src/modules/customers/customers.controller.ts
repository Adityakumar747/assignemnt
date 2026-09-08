import { Request, Response } from 'express';
import * as customerService from './customers.service.js';

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer
  });
}

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const result = await customerService.getCustomers(req.query as any);
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
}

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const customer = await customerService.getCustomerById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: customer
  });
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const customer = await customerService.updateCustomer(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: customer
  });
}

export async function addCustomerNote(req: Request, res: Response): Promise<void> {
  const note = await customerService.addCustomerNote(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  res.status(201).json({
    success: true,
    message: 'Note added successfully',
    data: note
  });
}
