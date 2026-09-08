import { api } from './client.js';
import { Product, StockMovement, PaginatedResponse, ApiResponse } from '../types/index.js';

export interface ProductFilterParams {
  search?: string;
  category?: string;
  lowStock?: 'true' | 'false';
  page?: number;
  limit?: number;
}

export async function getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
  const res = await api.get<PaginatedResponse<Product>>('/products', { params });
  return res.data;
}

export async function getProductById(id: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/products', data);
  return res.data.data;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
}

export async function createStockMovement(
  productId: string,
  data: { quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }
): Promise<{ product: Product; movement: StockMovement }> {
  const res = await api.post<ApiResponse<{ product: Product; movement: StockMovement }>>(
    `/products/${productId}/stock-movements`,
    data
  );
  return res.data.data;
}

export async function getProductStockMovements(
  productId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<StockMovement>> {
  const res = await api.get<PaginatedResponse<StockMovement>>(
    `/products/${productId}/stock-movements`,
    { params }
  );
  return res.data;
}

export async function getAllStockMovements(
  params?: { page?: number; limit?: number; movementType?: 'IN' | 'OUT' }
): Promise<PaginatedResponse<StockMovement>> {
  const res = await api.get<PaginatedResponse<StockMovement>>('/products/movements/ledger', {
    params
  });
  return res.data;
}
