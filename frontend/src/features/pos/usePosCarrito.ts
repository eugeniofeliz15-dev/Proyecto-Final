import { useMemo } from 'react';
import { usePosCartStore } from './posCartStore';

export function usePosCarrito() {
  const items = usePosCartStore((state) => state.items);
  const add = usePosCartStore((state) => state.add);
  const setQuantity = usePosCartStore((state) => state.setQuantity);
  const remove = usePosCartStore((state) => state.remove);
  const clear = usePosCartStore((state) => state.clear);
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.salePrice * item.quantity,
        0,
      ),
    [items],
  );
  return { items, add, setQuantity, remove, clear, total };
}
