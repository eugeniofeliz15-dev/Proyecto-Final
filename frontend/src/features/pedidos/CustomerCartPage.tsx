import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../hooks/useCarrito';
import { getErrorMessage } from '../../lib/errors';

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

export default function CustomerCartPage() {
  const { items, total, remove, loading, error } = useCarrito();
  const [notice, setNotice] = useState<string | null>(null);

  const removeItem = async (productId: number) => {
    setNotice(null);
    try {
      await remove(productId);
    } catch (requestError: unknown) {
      setNotice(getErrorMessage(requestError, 'No se pudo actualizar el carrito.'));
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-widest text-coral">Tienda en línea</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Tu carrito</h1>
      </section>
      {loading ? (
        <section aria-label="Cargando carrito" aria-busy="true" className="mt-8 space-y-4">
          {[0, 1, 2].map((item) => (
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" key={item} />
          ))}
        </section>
      ) : items.length > 0 ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-slate-100 rounded-3xl border border-slate-100 bg-white px-5 shadow-card">
            {items.map(({ product, quantity }) => (
              <li className="flex items-center justify-between gap-4 py-5" key={product.id}>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{product.category.name} · Cantidad: {quantity}</p>
                  <p className="mt-2 text-sm font-bold text-ink">{currency.format(product.salePrice * quantity)}</p>
                </div>
                <button
                  className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => void removeItem(product.id)}
                  type="button"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold text-ink">Resumen</h2>
            <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-lg font-black text-ink">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
            {(error || notice) && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {notice ?? error}
              </p>
            )}
            <Link className="button-primary mt-6 w-full" to="/checkout">
              Continuar al checkout
            </Link>
          </aside>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="text-xl font-bold text-ink">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-slate-500">Explora el catálogo para encontrar productos.</p>
          <Link className="button-primary mt-6" to="/">Ver catálogo</Link>
          {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        </section>
      )}
    </main>
  );
}
