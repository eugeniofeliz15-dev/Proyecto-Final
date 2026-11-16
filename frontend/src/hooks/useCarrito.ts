import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

export function useCarrito() {
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const error = useCartStore((state) => state.error);
  const loading = useCartStore((state) => state.loading);
  const hydrate = useCartStore((state) => state.hydrate);
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  useEffect(() => {
    if (user?.role === 'CLIENTE') {
      void hydrate(user.id);
    } else {
      clear();
    }
  }, [clear, hydrate, user?.id, user?.role]);

  const addProduct = (product: Parameters<typeof add>[0], quantity = 1) => {
    if (user?.role !== 'CLIENTE') {
      return Promise.reject(new Error('Inicia sesión con una cuenta de cliente.'));
    }
    return add(product, quantity);
  };
  const removeProduct = (productId: number) => {
    if (user?.role !== 'CLIENTE') {
      return Promise.reject(new Error('Inicia sesión con una cuenta de cliente.'));
    }
    return remove(productId);
  };
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0),
    [items],
  );

  return { items, add: addProduct, remove: removeProduct, clear, total, error, loading };
}
