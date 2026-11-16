import { api } from '../../lib/api';
import type {
  AuthResponse,
  Credentials,
  RegisterCustomer,
} from '../../types/api';

export const authService = {
  async login(credentials: Credentials) {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  async registerCustomer(input: RegisterCustomer) {
    const response = await api.post<AuthResponse>('/auth/register', input);
    return response.data;
  },
};
