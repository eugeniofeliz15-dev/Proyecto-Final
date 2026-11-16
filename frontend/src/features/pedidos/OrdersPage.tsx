import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { notifyStockSync, useStockSync } from '../../hooks/useStockSync';
import type { OrderRecord, OrderStatus, Paginated } from '../../types/api';
import { orderService } from './orderService';

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

const statusLabels: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const statuses = Object.keys(statusLabels) as OrderStatus[];
const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['EN_CAMINO'],
  EN_CAMINO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

interface OrderCardProps {
  order: OrderRecord;
  staff: boolean;
  updating: boolean;
  retryingPayment: boolean;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onRetryPayment: (id: number) => void;
}

const OrderCard = memo(function OrderCard({
  order,
  staff,
  updating,
  retryingPayment,
  onStatusChange,
  onRetryPayment,
}: OrderCardProps) {
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status);
  const customerName = [order.customer?.firstName, order.customer?.lastName]
    .filter(Boolean)
    .join(' ');
  const selectableStatuses = [
    order.status,
    ...allowedOrderTransitions[order.status],
  ];

  useEffect(() => setNextStatus(order.status), [order.status]);

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Pedido #{order.id}
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {staff
              ? customerName || order.customer?.email || 'Cliente'
              : statusLabels[order.status]}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(order.createdAt).toLocaleString('es-DO')}
            {staff && ` · ${order.customer?.email ?? ''}`}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
          {statusLabels[order.status]}
        </span>
      </header>

      <section className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-ink">Dirección de entrega</h3>
          <address className="mt-2 not-italic text-sm leading-6 text-slate-600">
            {order.address.street}
            <br />
            {order.address.city}, {order.address.state} {order.address.zipCode}
          </address>
          {order.notes && (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-semibold text-ink">Referencias:</span>{' '}
              {order.notes}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">Productos</h3>
          <ul className="mt-2 space-y-2">
            {order.items.map((item) => (
              <li className="flex justify-between gap-3 text-sm" key={item.id}>
                <span className="text-slate-600">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="shrink-0 font-semibold text-ink">
                  {currency.format(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-slate-100 pt-3 font-black text-ink">
            <span>Total</span>
            <span>{currency.format(order.totalAmount)}</span>
          </p>
        </div>
      </section>

      {staff && (
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              className="mb-2 block text-sm font-semibold text-slate-700"
              htmlFor={`order-status-${order.id}`}
            >
              Cambiar estado
            </label>
            <select
              className="field"
              id={`order-status-${order.id}`}
              onChange={(event) => {
                const selected = statuses.find(
                  (status) => status === event.target.value,
                );
                if (selected) setNextStatus(selected);
              }}
              value={nextStatus}
            >
              {selectableStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <button
            className="button-primary"
            disabled={updating || nextStatus === order.status}
            onClick={() => onStatusChange(order.id, nextStatus)}
            type="button"
          >
            {updating ? 'Actualizando...' : 'Guardar estado'}
          </button>
        </div>
      )}
      {!staff && order.status === 'PENDIENTE' && (
        <button
          className="button-primary mt-5"
          disabled={retryingPayment}
          onClick={() => onRetryPayment(order.id)}
          type="button"
        >
          {retryingPayment ? 'Generando enlace...' : 'Continuar al pago'}
        </button>
      )}
    </article>
  );
});

interface OrdersPageProps {
  staff: boolean;
}

export default function OrdersPage({ staff }: OrdersPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const requestedStatus = searchParams.get('status');
  const status = statuses.find((item) => item === requestedStatus);
  const orders = useApi<Paginated<OrderRecord>>();
  const mutation = useApi<Pick<OrderRecord, 'id' | 'status' | 'updatedAt'>>();
  const paymentMutation = useApi<{ checkout_url: string }>();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [retryingPaymentId, setRetryingPaymentId] = useState<number | null>(
    null,
  );

  const loadOrders = useCallback(async () => {
    await orders.execute(() =>
      staff
        ? orderService.getQueue({ page, limit: 10, status })
        : orderService.getMyOrders({ page, limit: 10, status }),
    );
  }, [orders.execute, page, staff, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);
  useStockSync(loadOrders);

  const records = useMemo(() => orders.data?.data ?? [], [orders.data]);
  const totalPages = Math.max(1, orders.data?.meta.totalPages ?? 1);

  const updateQuery = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const changeStatus = async (id: number, status: OrderStatus) => {
    const previous = orders.data;
    if (!previous) return;
    orders.setData({
      ...previous,
      data: previous.data.map((order) =>
        order.id === id ? { ...order, status } : order,
      ),
    });
    setUpdatingId(id);
    const updated = await mutation.execute(() =>
      orderService.updateStatus(id, status),
    );
    if (updated) {
      orders.setData({
        ...previous,
        data: previous.data.map((order) =>
          order.id === id
            ? { ...order, status: updated.status, updatedAt: updated.updatedAt }
            : order,
        ),
      });
      notifyStockSync();
    } else {
      orders.setData(previous);
    }
    setUpdatingId(null);
  };

  const retryPayment = async (orderId: number) => {
    setRetryingPaymentId(orderId);
    const result = await paymentMutation.execute(() =>
      orderService.retryPayment(orderId),
    );
    setRetryingPaymentId(null);
    if (result) window.location.assign(result.checkout_url);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            {staff ? 'Logística' : 'Tienda en línea'}
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">
            {staff ? 'Cola de pedidos' : 'Mis pedidos'}
          </h1>
          <p className="mt-3 text-slate-500">
            {staff
              ? 'Revisa entregas y actualiza sus estados.'
              : 'Consulta el estado y los detalles de tus compras.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="button-secondary"
            disabled={orders.loading}
            onClick={() => void loadOrders()}
            type="button"
          >
            Actualizar
          </button>
          {!staff && (
            <Link className="button-secondary" to="/">
              Seguir comprando
            </Link>
          )}
        </div>
      </section>
      <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label
          className="w-full text-sm font-semibold text-slate-700 sm:w-64"
          htmlFor="order-status-filter"
        >
          Filtrar por estado
          <select
            className="field mt-2"
            id="order-status-filter"
            onChange={(event) => updateQuery('status', event.target.value)}
            value={status ?? ''}
          >
            <option value="">Todos los estados</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {mutation.error && (
        <p
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          No se pudo actualizar el estado: {mutation.error}
        </p>
      )}
      {paymentMutation.error && (
        <p
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          No se pudo generar el enlace de pago: {paymentMutation.error}
        </p>
      )}
      <section
        aria-label={staff ? 'Todos los pedidos' : 'Mis pedidos'}
        className="mt-8 space-y-5"
      >
        {orders.loading && records.length === 0 ? (
          <LoadingSkeleton cards={3} />
        ) : orders.error ? (
          <p
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            No se pudieron cargar los pedidos: {orders.error}
          </p>
        ) : records.length > 0 ? (
          records.map((order) => (
            <OrderCard
              key={order.id}
              onStatusChange={(id, status) => void changeStatus(id, status)}
              onRetryPayment={(id) => void retryPayment(id)}
              order={order}
              retryingPayment={retryingPaymentId === order.id}
              staff={staff}
              updating={updatingId === order.id}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-ink">
              Todavía no hay pedidos
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {staff
                ? 'Los nuevos pedidos aparecerán aquí.'
                : 'Cuando finalices una compra, la verás aquí.'}
            </p>
            {!staff && (
              <Link className="button-primary mt-5" to="/">
                Ver catálogo
              </Link>
            )}
          </div>
        )}
      </section>
      <nav
        aria-label="Paginación de pedidos"
        className="mt-6 flex items-center justify-between"
      >
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="button-secondary"
            disabled={page <= 1 || orders.loading}
            onClick={() => updateQuery('page', String(page - 1))}
            type="button"
          >
            Anterior
          </button>
          <button
            className="button-secondary"
            disabled={page >= totalPages || orders.loading}
            onClick={() => updateQuery('page', String(page + 1))}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </main>
  );
}
