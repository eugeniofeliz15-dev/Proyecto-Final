import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useCarrito } from '../hooks/useCarrito';
import { useAuthStore } from '../stores/authStore';

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { items, clear } = useCarrito();
  const navigate = useNavigate();

  const signOut = () => {
    clear();
    clearSession();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-slate-200/70 bg-cream/90">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          <Link className="text-xl font-black tracking-tight text-ink" to="/">
            mercado<span className="text-coral">.</span>
          </Link>
          <div className="flex items-center gap-3 overflow-x-auto sm:gap-5">
            {user?.role === 'ADMINISTRADOR' && (
              <>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/admin/productos"
                >
                  Catálogo
                </NavLink>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/admin/usuarios"
                >
                  Usuarios
                </NavLink>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/admin/categorias"
                >
                  Categorías
                </NavLink>
              </>
            )}
            {(user?.role === 'ADMINISTRADOR' || user?.role === 'CAJERO') && (
              <>
                {user.role === 'CAJERO' && (
                  <NavLink
                    className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                    to="/inventario"
                  >
                    Inventario
                  </NavLink>
                )}
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/pos"
                >
                  POS
                </NavLink>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/ventas"
                >
                  Ventas
                </NavLink>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/pedidos"
                >
                  Pedidos
                </NavLink>
                {user.role === 'ADMINISTRADOR' && (
                  <NavLink
                    className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                    to="/caja"
                  >
                    Caja
                  </NavLink>
                )}
              </>
            )}
            {user?.role === 'CLIENTE' && (
              <>
                <NavLink
                  className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-ink"
                  to="/mis-pedidos"
                >
                  Mis pedidos
                </NavLink>
                <NavLink
                  className="whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600"
                  to="/carrito"
                >
                  Carrito {items.length > 0 && `(${items.length})`}
                </NavLink>
              </>
            )}
            {user ? (
              <>
                <span className="hidden max-w-40 truncate text-sm text-slate-500 md:block">
                  {user.email}
                </span>
                <button
                  className="button-secondary"
                  onClick={signOut}
                  type="button"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  className="text-sm font-semibold text-slate-600 hover:text-ink"
                  to="/login"
                >
                  Iniciar sesión
                </Link>
                <Link className="button-primary !px-4 !py-2.5" to="/registro">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="mt-20 border-t border-slate-200/70 px-4 py-8 text-center text-sm text-slate-500">
        Mercado POS · Catálogo y operaciones en un solo lugar
      </footer>
    </div>
  );
}
