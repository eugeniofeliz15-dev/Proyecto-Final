import { api } from '../../lib/api';
import type {
  Address,
  AddressInput,
  CheckoutResponse,
  OrderRecord,
  OrderStatus,
  Paginated,
} from '../../types/api';

export interface OrderQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface CheckoutInput {
  addressId: number;
  paymentMethod: 'MOCKPAY';
  notes?: string;
}

export const orderService = {
  async getAddresses() {
    const response = await api.get<Address[]>('/addresses');
    return response.data;
  },
  async createAddress(input: AddressInput) {
    const response = await api.post<Address>('/addresses', input);
    return response.data;
  },
  async updateAddress(id: number, input: Partial<AddressInput>) {
    const response = await api.patch<Address>(`/addresses/${id}`, input);
    return response.data;
  },
  async checkout(input: CheckoutInput) {
    const response = await api.post<CheckoutResponse>(
      '/orders/checkout-mockpay',
      input,
    );
    return response.data;
  },
  async retryPayment(orderId: number) {
    const response = await api.post<{ checkout_url: string }>(
      `/orders/${orderId}/payment-link`,
    );
    return response.data;
  },
  async getMyOrders(query: OrderQuery) {
    const response = await api.get<Paginated<OrderRecord>>(
      '/orders/my-orders',
      {
        params: query,
      },
    );
    return response.data;
  },
  async getQueue(query: OrderQuery) {
    const response = await api.get<Paginated<OrderRecord>>('/orders', {
      params: query,
    });
    return response.data;
  },
  async updateStatus(id: number, status: OrderStatus) {
    const response = await api.patch<
      Pick<OrderRecord, 'id' | 'status' | 'updatedAt'>
    >(`/orders/${id}/status`, { status });
    return response.data;
  },
};
