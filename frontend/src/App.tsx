import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { AuthGuard, RoleGuard } from './components/RouteGuards';
import { SectionErrorBoundary } from './components/SectionErrorBoundary';
import AdminDashboard from './features/auth/AdminDashboard';
import AuthPage from './features/auth/AuthPage';
import CustomerDashboard from './features/auth/CustomerDashboard';
import StaffDashboard from './features/auth/StaffDashboard';
import ProductCatalogPage from './features/productos/ProductCatalogPage';
import { useAuthStore } from './stores/authStore';

const InventoryPage = lazy(() => import('./features/productos/InventoryPage'));
const CategoryManagementPage = lazy(
  () => import('./features/productos/CategoryManagementPage'),
);
const PosPage = lazy(() => import('./features/pos/PosPage'));
const SalesHistoryPage = lazy(() => import('./features/pos/SalesHistoryPage'));
const OrdersPage = lazy(() => import('./features/pedidos/OrdersPage'));
const CustomerCartPage = lazy(
  () => import('./features/pedidos/CustomerCartPage'),
);
const CheckoutPage = lazy(() => import('./features/pedidos/CheckoutPage'));
const CashRegisterPage = lazy(() => import('./features/caja/CashRegisterPage'));
const StaffManagementPage = lazy(
  () => import('./features/usuarios/StaffManagementPage'),
);

function HomePage() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'ADMINISTRADOR') {
    return <AdminDashboard />;
  }
  if (user?.role === 'CAJERO') return <StaffDashboard />;
  if (user?.role === 'CLIENTE') return <CustomerDashboard />;
  return <ProductCatalogPage />;
}

function LazySection({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary>
      <Suspense
        fallback={
          <main className="mx-auto max-w-7xl px-4 py-10">
            <LoadingSkeleton cards={3} />
          </main>
        }
      >
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <SectionErrorBoundary>
              <HomePage />
            </SectionErrorBoundary>
          }
        />
        <Route
          path="productos"
          element={
            <SectionErrorBoundary>
              <ProductCatalogPage />
            </SectionErrorBoundary>
          }
        />
        <Route
          path="login"
          element={
            <SectionErrorBoundary>
              <AuthPage mode="login" />
            </SectionErrorBoundary>
          }
        />
        <Route
          path="registro"
          element={
            <SectionErrorBoundary>
              <AuthPage mode="register" />
            </SectionErrorBoundary>
          }
        />
        <Route element={<AuthGuard />}>
          <Route element={<RoleGuard allowed={['CLIENTE']} />}>
            <Route
              path="carrito"
              element={
                <LazySection>
                  <CustomerCartPage />
                </LazySection>
              }
            />
            <Route
              path="checkout"
              element={
                <LazySection>
                  <CheckoutPage />
                </LazySection>
              }
            />
            <Route
              path="mis-pedidos"
              element={
                <LazySection>
                  <OrdersPage staff={false} />
                </LazySection>
              }
            />
          </Route>
          <Route element={<RoleGuard allowed={['ADMINISTRADOR', 'CAJERO']} />}>
            <Route
              path="inventario"
              element={
                <LazySection>
                  <InventoryPage />
                </LazySection>
              }
            />
            <Route
              path="pos"
              element={
                <LazySection>
                  <PosPage />
                </LazySection>
              }
            />
            <Route
              path="ventas"
              element={
                <LazySection>
                  <SalesHistoryPage />
                </LazySection>
              }
            />
            <Route
              path="pedidos"
              element={
                <LazySection>
                  <OrdersPage staff />
                </LazySection>
              }
            />
          </Route>
          <Route element={<RoleGuard allowed={['ADMINISTRADOR']} />}>
            <Route
              path="admin/productos"
              element={
                <LazySection>
                  <InventoryPage />
                </LazySection>
              }
            />
            <Route
              path="admin/categorias"
              element={
                <LazySection>
                  <CategoryManagementPage />
                </LazySection>
              }
            />
            <Route
              path="admin/usuarios"
              element={
                <LazySection>
                  <StaffManagementPage />
                </LazySection>
              }
            />
            <Route
              path="caja"
              element={
                <LazySection>
                  <CashRegisterPage />
                </LazySection>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}
