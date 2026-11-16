import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Product } from '../../types/api';

export interface PosCartItem {
  product: Product;
  quantity: number;
}

interface PosCartState {
  items: PosCartItem[];
  add: (product: Product) => string | null;
  setQuantity: (productId: number, quantity: number) => string | null;
  remove: (productId: number) => void;
  clear: () => void;
}

export const usePosCartStore = create<PosCartState>()(
  devtools(
    (set, get) => ({
      items: [],
      add: (product) => {
        const existing = get().items.find(
          (item) => item.product.id === product.id,
        );
        const requested = (existing?.quantity ?? 0) + 1;
        if (requested > product.stock) {
          return `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${requested}`;
        }
        set(
          (state) => ({
            items: existing
              ? state.items.map((item) =>
                  item.product.id === product.id
                    ? { ...item, quantity: requested, product }
                    : item,
                )
              : [...state.items, { product, quantity: 1 }],
          }),
          false,
          'posCart/add',
        );
        return null;
      },
      setQuantity: (productId, quantity) => {
        const item = get().items.find(
          (current) => current.product.id === productId,
        );
        if (!item) return null;
        if (quantity > item.product.stock) {
          return `Stock insuficiente para "${item.product.name}". Disponible: ${item.product.stock}, Solicitado: ${quantity}`;
        }
        if (quantity < 1) {
          set(
            (state) => ({
              items: state.items.filter(
                (current) => current.product.id !== productId,
              ),
            }),
            false,
            'posCart/remove',
          );
          return null;
        }
        set(
          (state) => ({
            items: state.items.map((current) =>
              current.product.id === productId
                ? { ...current, quantity }
                : current,
            ),
          }),
          false,
          'posCart/setQuantity',
        );
        return null;
      },
      remove: (productId) =>
        set(
          (state) => ({
            items: state.items.filter(
              (item) => item.product.id !== productId,
            ),
          }),
          false,
          'posCart/remove',
        ),
      clear: () => set({ items: [] }, false, 'posCart/clear'),
    }),
    { name: 'pos-cart' },
  ),
);
