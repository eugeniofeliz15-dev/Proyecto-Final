import { zodResolver } from '@hookform/resolvers/zod';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { notifyStockSync, useStockSync } from '../../hooks/useStockSync';
import { productService } from '../productos/productService';
import { usePosCarrito } from './usePosCarrito';
import { salesService } from './salesService';
import type { Category, Paginated, Product, SaleRecord } from '../../types/api';

const paymentSchema = z.object({
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']),
});

type PaymentForm = z.infer<typeof paymentSchema>;

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

interface PosProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const PosProductCard = memo(function PosProductCard({
  product,
  onAdd,
}: PosProductCardProps) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {product.category.name} · Stock: {product.stock}
        </p>
        <p className="mt-2 font-bold text-ink">
          {currency.format(product.salePrice)}
        </p>
      </div>
      <button
        className="button-primary shrink-0 !px-3 !py-2"
        disabled={product.stock < 1}
        onClick={() => onAdd(product)}
        type="button"
      >
        {product.stock < 1 ? 'Agotado' : 'Agregar'}
      </button>
    </article>
  );
});

export default function PosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageValue = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const categoryValue = searchParams.get('category');
  const categoryId =
    categoryValue && Number.isInteger(Number(categoryValue))
      ? Number(categoryValue)
      : undefined;
  const inventory = useApi<Paginated<Product>>();
  const categories = useApi<Category[]>();
  const mutation = useApi<SaleRecord>();
  const { items, add, setQuantity, remove, clear, total } = usePosCarrito();
  const [cartError, setCartError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SaleRecord | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: 'EFECTIVO' },
  });

  const loadInventory = useCallback(async () => {
    await inventory.execute(() =>
      productService.getInventory({ page, limit: 12, categoryId }),
    );
  }, [categoryId, inventory.execute, page]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  useStockSync(loadInventory);

  useEffect(() => {
    void categories.execute(() => productService.getCategories());
  }, [categories.execute]);

  const products = useMemo(() => inventory.data?.data ?? [], [inventory.data]);
  const totalPages = Math.max(1, inventory.data?.meta.totalPages ?? 1);

  const updateQuery = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const addProduct = (product: Product) => {
    const error = add(product);
    setCartError(error);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCartError(setQuantity(productId, quantity));
  };

  const submitSale = handleSubmit(async ({ paymentMethod }) => {
    setCartError(null);
    const sale = await mutation.execute(() =>
      salesService.create({
        paymentMethod,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      }),
    );
    if (!sale) return;
    setReceipt(sale);
    clear();
    notifyStockSync();
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Punto de venta
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">Nueva venta</h1>
          <p className="mt-3 text-slate-500">
            Agrega productos, selecciona el pago y confirma.
          </p>
        </div>
        <label
          className="w-full text-sm font-semibold text-slate-700 sm:w-64"
          htmlFor="pos-category"
        >
          Categoría
          {categories.loading ? (
            <span
              aria-label="Cargando categorías"
              className="mt-2 block h-12 animate-pulse rounded-xl bg-slate-200"
            />
          ) : (
            <select
              className="field mt-2"
              id="pos-category"
              onChange={(event) => updateQuery('category', event.target.value)}
              value={categoryId?.toString() ?? ''}
            >
              <option value="">Todas las categorías</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </label>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_390px]">
        <section aria-label="Productos disponibles">
          {inventory.error && (
            <p
              className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {inventory.error}
            </p>
          )}
          {categories.error && (
            <p className="mb-4 text-sm text-red-700" role="alert">
              {categories.error}
            </p>
          )}
          {inventory.loading ? (
            <LoadingSkeleton cards={6} />
          ) : products.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <PosProductCard
                  key={product.id}
                  onAdd={addProduct}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              No hay productos disponibles.
            </p>
          )}
          <nav
            aria-label="Paginación de productos"
            className="mt-5 flex justify-between"
          >
            <button
              className="button-secondary"
              disabled={page <= 1 || inventory.loading}
              onClick={() => updateQuery('page', String(page - 1))}
              type="button"
            >
              Anterior
            </button>
            <p className="self-center text-sm text-slate-500">
              Página {page} de {totalPages}
            </p>
            <button
              className="button-secondary"
              disabled={page >= totalPages || inventory.loading}
              onClick={() => updateQuery('page', String(page + 1))}
              type="button"
            >
              Siguiente
            </button>
          </nav>
        </section>

        <aside className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card lg:sticky lg:top-6">
          <h2 className="text-xl font-bold text-ink">Carrito POS</h2>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} productos distintos
          </p>
          {items.length > 0 ? (
            <ul className="mt-5 divide-y divide-slate-100">
              {items.map(({ product, quantity }) => (
                <li className="py-4" key={product.id}>
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {currency.format(product.salePrice)} c/u
                      </p>
                    </div>
                    <button
                      aria-label={`Quitar ${product.name}`}
                      className="text-sm font-semibold text-red-600"
                      onClick={() => remove(product.id)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label={`Reducir cantidad de ${product.name}`}
                        className="button-secondary !px-3 !py-1"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        type="button"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">
                        {quantity}
                      </span>
                      <button
                        aria-label={`Aumentar cantidad de ${product.name}`}
                        className="button-secondary !px-3 !py-1"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold">
                      {currency.format(product.salePrice * quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
              Agrega productos para iniciar la venta.
            </p>
          )}
          {(cartError || mutation.error) && (
            <p
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {cartError ?? mutation.error}
            </p>
          )}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-lg font-black text-ink">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
            <form className="mt-5 space-y-4" onSubmit={submitSale}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="payment-method"
                >
                  Método de pago
                </label>
                <select
                  className="field"
                  id="payment-method"
                  {...register('paymentMethod')}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia / QR</option>
                </select>
              </div>
              <button
                className="button-primary w-full"
                disabled={
                  isSubmitting || mutation.loading || items.length === 0
                }
                type="submit"
              >
                {isSubmitting || mutation.loading
                  ? 'Procesando venta...'
                  : 'Confirmar venta'}
              </button>
            </form>
          </div>
        </aside>
      </div>

      {receipt && (
        <section
          aria-labelledby="sale-receipt-title"
          aria-modal="true"
          className="fixed inset-0 z-20 grid place-items-center bg-ink/50 p-4"
          role="dialog"
        >
          <article className="w-full max-w-md rounded-3xl bg-white p-7 shadow-card">
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
              Venta completada
            </p>
            <h2
              className="mt-2 text-2xl font-black text-ink"
              id="sale-receipt-title"
            >
              Comprobante #{receipt.id}
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              {new Date(receipt.createdAt).toLocaleString('es-DO')}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pago: {receipt.paymentMethod}
            </p>
            <p className="mt-5 text-3xl font-black text-ink">
              {currency.format(receipt.totalAmount)}
            </p>
            <button
              className="button-primary mt-7 w-full"
              onClick={() => setReceipt(null)}
              type="button"
            >
              Nueva venta
            </button>
          </article>
        </section>
      )}
    </main>
  );
}
