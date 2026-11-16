import { api } from '../../lib/api';
import type {
  CreateSaleInput,
  Paginated,
  SaleRecord,
} from '../../types/api';

export const salesService = {
  async create(input: CreateSaleInput) {
    const response = await api.post<SaleRecord>('/sales', input);
    return response.data;
  },
  async getHistory(params: { page: number; limit: number; date?: string }) {
    const response = await api.get<Paginated<SaleRecord>>('/sales', { params });
    return response.data;
  },
};
