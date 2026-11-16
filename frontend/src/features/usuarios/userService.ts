import { api } from '../../lib/api';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  UserRecord,
} from '../../types/api';

export const userService = {
  async findAll() {
    const response = await api.get<UserRecord[]>('/users');
    return response.data;
  },
  async create(input: CreateStaffInput) {
    const response = await api.post<UserRecord>('/users', input);
    return response.data;
  },
  async update(id: number, input: UpdateStaffInput) {
    const response = await api.patch<UserRecord>(`/users/${id}`, input);
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete<UserRecord>(`/users/${id}`);
    return response.data;
  },
};
