import { api } from './client.js';
import { Customer, CustomerNote, PaginatedResponse, ApiResponse } from '../types/index.js';

export interface CustomerFilterParams {
  search?: string;
  status?: string;
  customerType?: string;
  page?: number;
  limit?: number;
}

export async function getCustomers(params?: CustomerFilterParams): Promise<PaginatedResponse<Customer>> {
  const res = await api.get<PaginatedResponse<Customer>>('/customers', { params });
  return res.data;
}

export async function getCustomerById(id: string): Promise<Customer> {
  const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const res = await api.post<ApiResponse<Customer>>('/customers', data);
  return res.data.data;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
  const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
  return res.data.data;
}

export async function addCustomerNote(customerId: string, note: string): Promise<CustomerNote> {
  const res = await api.post<ApiResponse<CustomerNote>>(`/customers/${customerId}/notes`, { note });
  return res.data.data;
}
