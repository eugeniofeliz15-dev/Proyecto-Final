import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const adminActions = [
  {
    label: 'Catálogo',
    title: 'Productos e inventario',
    description: 'Administra productos, costos, precios y existencias.',
    to: '/admin/productos',
    action: 'Administrar catálogo',
  },
  {
    label: 'Organización',
    title: 'Categorías',
    description: 'Crea, edita y desactiva categorías del catálogo.',
    to: '/admin/categorias',
    action: 'Gestionar categorías',
  },
  {
    label: 'Personal',
    title: 'Usuarios y accesos',
    description: 'Crea, edita y desactiva cuentas activas del equipo.',
    to: '/admin/usuarios',
    action: 'Gestionar equipo',
  },
  {
    label: 'Caja',
    title: 'Cierre y conciliación',
    description: 'Registra el efectivo físico y revisa la diferencia exacta.',
    to: '/caja',
    action: 'Abrir caja',
  },
  {
    label: 'Operación',
    title: 'Cola de pedidos',
    description: 'Revisa direcciones y actualiza el estado de pedidos web.',
    to: '/pedidos',
    action: 'Ver pedidos',
  },
  {
    label: 'Reportes',
    title: 'Historial de ventas',
    description: 'Consulta las ventas del POS y sus métodos de pago.',
    to: '/ventas',
    action: 'Consultar ventas',
  },
  {
    label: 'Punto de venta',
    title: 'Registrar una venta',
    description: 'Procesa compras presenciales y actualiza el inventario.',
    to: '/pos',
    action: 'Abrir POS',
  },
];

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-200">
          Administración
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
          Centro de control
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Gestiona la tienda, el equipo y las operaciones desde un solo lugar.
        </p>
        {user?.email && (
          <p className="mt-5 text-sm text-slate-400">
            Sesión de administrador: {user.email}
          </p>
        )}
      </section>

      <section aria-labelledby="admin-actions-title" className="mt-9">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Accesos administrativos
          </p>
          <h2
            className="mt-2 text-2xl font-black text-ink"
            id="admin-actions-title"
          >
            ¿Qué necesitas gestionar?
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {adminActions.map((item) => (
            <article
              className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-card transition hover:-translate-y-1"
              key={item.to}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-coral">
                {item.label}
              </p>
              <h3 className="mt-3 text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
              <Link className="button-secondary mt-5 self-start" to={item.to}>
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
