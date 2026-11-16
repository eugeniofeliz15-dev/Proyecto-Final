import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { cartService } from '../features/pedidos/cartService';
import { getErrorMessage } from '../lib/errors';
import type { PublicProduct } from '../types/api';

export interface CartItem {
  product: PublicProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  error: string | null;
  loading: boolean;
  loadedFor: number | null;
  loadingFor: number | null;
  hydrate: (userId: number) => Promise<void>;
  add: (product: PublicProduct, quantity?: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  devtools(
    (set, get) => ({
      items: [],
      error: null,
      loading: false,
      loadedFor: null,
      loadingFor: null,
      hydrate: async (userId) => {
        const state = get();
        if (state.loadedFor === userId || state.loadingFor === userId) return;
        set({ loading: true, loadingFor: userId, error: null });
        try {
          const cart = await cartService.get();
          set((current) =>
            current.loadingFor === userId
              ? {
                  items: cart.items.map(({ product, quantity }) => ({
                    product,
                    quantity,
                  })),
                  loadedFor: userId,
                  loading: false,
                  loadingFor: null,
                  error: null,
                }
              : current,
          );
        } catch (error: unknown) {
          set((current) =>
            current.loadingFor === userId
              ? {
                  ...current,
                  error: getErrorMessage(error, 'No se pudo cargar el carrito.'),
                  loading: false,
                  loadingFor: null,
                }
              : current,
          );
        }
      },
      add: async (product, quantity = 1) => {
        const previousItems = get().items;
        const existing = previousItems.find(
          (item) => item.product.id === product.id,
        );
        const requested = (existing?.quantity ?? 0) + quantity;
        if (requested > product.stock) {
          const message = `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${requested}`;
          set({ error: message });
          throw new Error(message);
        }
        const optimisticItems = existing
          ? previousItems.map((item) =>
              item.product.id === product.id
                ? { ...item, product, quantity: requested }
                : item,
            )
          : [...previousItems, { product, quantity }];
        set({ items: optimisticItems, error: null });
        try {
          await cartService.add(product.id, quantity);
        } catch (error: unknown) {
          const message = getErrorMessage(error, 'No se pudo agregar el producto.');
          set({ items: previousItems, error: message });
          throw error;
        }
      },
      remove: async (productId) => {
        const previousItems = get().items;
        set({
          items: previousItems.filter((item) => item.product.id !== productId),
          error: null,
        });
        try {
          await cartService.remove(productId);
        } catch (error: unknown) {
          set({
            items: previousItems,
            error: getErrorMessage(error, 'No se pudo quitar el producto.'),
          });
          throw error;
        }
      },
      clear: () =>
        set({
          items: [],
          error: null,
          loading: false,
          loadedFor: null,
          loadingFor: null,
        }),
    }),
    { name: 'customer-cart' },
  ),
);
