import { Link } from 'react-router-dom';
import { useCarrito } from '../../hooks/useCarrito';
import { useAuthStore } from '../../stores/authStore';

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

export default function CustomerDashboard() {
  const user = useAuthStore((state) => state.user);
  const { items, total, loading, error } = useCarrito();
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-slate-800 to-coral px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-200">
          Espacio de cliente
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
          Tus compras, más simples.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-200">
          {user?.email
            ? `Bienvenido de nuevo. Sesión iniciada como ${user.email}.`
            : 'Explora productos, revisa tu carrito y sigue tus pedidos desde un solo lugar.'}
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-orange-50"
          to="/productos"
        >
          Explorar la tienda
        </Link>
      </section>

      <section
        aria-labelledby="customer-summary-title"
        className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"
      >
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Tu carrito
          </p>
          <h2
            className="mt-2 text-2xl font-black text-ink"
            id="customer-summary-title"
          >
            Resumen de compra
          </h2>
          {loading ? (
            <div
              aria-label="Cargando resumen del carrito"
              className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-100"
            />
          ) : (
            <div className="mt-5 rounded-2xl bg-orange-50 p-5">
              <p className="text-sm text-slate-600">
                {itemCount === 1 ? '1 producto' : `${itemCount} productos`}
              </p>
              <p className="mt-1 text-2xl font-black text-ink">
                {currency.format(total)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Subtotal de productos
              </p>
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Link className="button-primary mt-5 w-full" to="/carrito">
            Ver mi carrito
          </Link>
        </article>

        <div className="grid gap-5 sm:grid-cols-2">
          <article className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Catálogo
            </p>
            <h2 className="mt-3 text-xl font-bold text-ink">
              Encuentra algo para ti
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
              Busca productos disponibles y descubre las novedades de la tienda.
            </p>
            <Link className="button-secondary mt-5" to="/productos">
              Ver productos
            </Link>
          </article>
          <article className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Seguimiento
            </p>
            <h2 className="mt-3 text-xl font-bold text-ink">
              Tus pedidos, al día
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
              Consulta el estado y los detalles de tus compras recientes.
            </p>
            <Link className="button-secondary mt-5" to="/mis-pedidos">
              Ver mis pedidos
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
