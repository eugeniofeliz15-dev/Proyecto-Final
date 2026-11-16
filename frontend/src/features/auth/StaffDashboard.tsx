import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function StaffDashboard() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMINISTRADOR';

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-200">
          Panel operativo
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          Hola, {isAdmin ? 'administrador' : 'equipo'}.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Gestiona el catálogo y mantén la operación al día desde un solo lugar.
        </p>
      </section>
      <section
        aria-label="Accesos rápidos"
        className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Inventario
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">
            Productos y existencias
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulta el catálogo interno y los niveles actuales de stock.
          </p>
          <Link
            className="button-primary mt-6"
            to={isAdmin ? '/admin/productos' : '/inventario'}
          >
            Abrir inventario
          </Link>
        </article>
        {isAdmin && (
          <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Administración
            </p>
            <h2 className="mt-3 text-2xl font-bold text-ink">
              Control del catálogo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crea y actualiza productos, precios, costo y categorías.
            </p>
            <Link className="button-secondary mt-6" to="/admin/productos">
              Administrar productos
            </Link>
          </article>
        )}
        {isAdmin && (
          <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Equipo
            </p>
            <h2 className="mt-3 text-2xl font-bold text-ink">
              Accesos del personal
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crea cuentas de Administrador o Cajero y consulta el equipo
              activo.
            </p>
            <Link className="button-secondary mt-6" to="/admin/usuarios">
              Administrar usuarios
            </Link>
          </article>
        )}
        <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Punto de venta
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">
            Registrar una venta
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Procesa una venta de mostrador y actualiza el stock al confirmar.
          </p>
          <Link className="button-primary mt-6" to="/pos">
            Abrir POS
          </Link>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Ventas
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">
            Historial por día
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Consulta comprobantes, montos y métodos de pago.
          </p>
          <Link className="button-secondary mt-6" to="/ventas">
            Ver historial
          </Link>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Logística
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">Pedidos web</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Revisa direcciones y referencias, y actualiza el estado de cada
            pedido.
          </p>
          <Link className="button-secondary mt-6" to="/pedidos">
            Abrir cola
          </Link>
        </article>
        {isAdmin && (
          <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Caja
            </p>
            <h2 className="mt-3 text-2xl font-bold text-ink">
              Cierre y conciliación
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Registra el efectivo físico y revisa la diferencia exacta.
            </p>
            <Link className="button-secondary mt-6" to="/caja">
              Administrar caja
            </Link>
          </article>
        )}
      </section>
    </main>
  );
}
