import { Request, Response } from 'express';
import * as productService from './products.service.js';

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body, req.user!.id);
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const result = await productService.getProducts(req.query as any);
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductById(req.params.id as string);
  res.status(200).json({
    success: true,
    data: product
  });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.updateProduct(req.params.id as string, req.body);
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product
  });
}

export async function createStockMovement(req: Request, res: Response): Promise<void> {
  const result = await productService.createStockMovement(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  res.status(201).json({
    success: true,
    message: 'Stock movement recorded successfully',
    data: result
  });
}

export async function getProductStockMovements(req: Request, res: Response): Promise<void> {
  const result = await productService.getProductStockMovements(
    req.params.id as string,
    req.query as any
  );
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
}

export async function getAllStockMovements(req: Request, res: Response): Promise<void> {
  const result = await productService.getAllStockMovements(req.query as any);
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
}
