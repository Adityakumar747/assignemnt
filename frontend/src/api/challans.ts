import { api } from './client.js';
import { Challan, PaginatedResponse, ApiResponse } from '../types/index.js';

export interface ChallanFilterParams {
  search?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateChallanPayload {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export async function getChallans(params?: ChallanFilterParams): Promise<PaginatedResponse<Challan>> {
  const res = await api.get<PaginatedResponse<Challan>>('/challans', { params });
  return res.data;
}

export async function getChallanById(id: string): Promise<Challan> {
  const res = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallan(data: CreateChallanPayload): Promise<Challan> {
  const res = await api.post<ApiResponse<Challan>>('/challans', data);
  return res.data.data;
}

export async function confirmChallan(id: string): Promise<Challan> {
  const res = await api.put<ApiResponse<Challan>>(`/challans/${id}/confirm`);
  return res.data.data;
}

export async function cancelChallan(id: string): Promise<Challan> {
  const res = await api.put<ApiResponse<Challan>>(`/challans/${id}/cancel`);
  return res.data.data;
}

export function getChallanPdfUrl(id: string): string {
  const baseURL = import.meta.env.VITE_API_URL || '';
  return `${baseURL}/challans/${id}/pdf`;
}

export async function downloadChallanPdf(id: string, challanNumber: string): Promise<void> {
  const res = await api.get(`/challans/${id}/pdf`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Challan-${challanNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
