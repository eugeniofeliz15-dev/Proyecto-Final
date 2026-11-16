import { api } from '../../lib/api';
import type { CartApiResponse } from '../../types/api';

export const cartService = {
  async get() {
    const response = await api.get<CartApiResponse>('/cart');
    return response.data;
  },
  async add(productId: number, quantity: number) {
    const response = await api.post<{
      id: number;
      cartId: number;
      productId: number;
      quantity: number;
    }>('/cart/add', { productId, quantity });
    return response.data;
  },
  async remove(productId: number) {
    const response = await api.delete<{ id: number }>(
      `/cart/remove/${productId}`,
    );
    return response.data;
  },
};
