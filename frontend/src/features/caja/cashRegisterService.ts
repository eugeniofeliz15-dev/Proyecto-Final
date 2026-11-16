import { api } from '../../lib/api';
import type {
  CashRegister,
  CashRegisterInput,
  CashRegisterStatus,
  CloseCashRegisterInput,
} from '../../types/api';

export const cashRegisterService = {
  async getStatus() {
    const response = await api.get<CashRegisterStatus>('/cash-register/status');
    return response.data;
  },
  async open(input: CashRegisterInput) {
    const response = await api.post<CashRegister>('/cash-register/open', input);
    return response.data;
  },
  async close(input: CloseCashRegisterInput) {
    const response = await api.post<CashRegister>('/cash-register/close', input);
    return response.data;
  },
};
