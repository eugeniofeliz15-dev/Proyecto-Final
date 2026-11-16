import { memo, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import type { Paginated, SaleRecord } from '../../types/api';
import { salesService } from './salesService';

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

interface SaleRowProps {
  sale: SaleRecord;
}

const SaleRow = memo(function SaleRow({ sale }: SaleRowProps) {
  const cashierName = [sale.cashier.firstName, sale.cashier.lastName]
    .filter(Boolean)
    .join(' ');
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-4 font-semibold text-ink">#{sale.id}</td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {new Date(sale.createdAt).toLocaleString('es-DO')}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {cashierName || sale.cashier.email || 'Cajero'}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">{sale.paymentMethod}</td>
      <td className="px-4 py-4 text-sm text-slate-600">{sale.items.length}</td>
      <td className="px-4 py-4 text-right text-sm font-bold text-ink">
        {currency.format(sale.totalAmount)}
      </td>
    </tr>
  );
});

export default function SalesHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const date = searchParams.get('date') ?? '';
  const history = useApi<Paginated<SaleRecord>>();

  const loadSales = useCallback(async () => {
    await history.execute(() =>
      salesService.getHistory({
        page,
        limit: 10,
        ...(date ? { date } : {}),
      }),
    );
  }, [date, history.execute, page]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const sales = useMemo(() => history.data?.data ?? [], [history.data]);
  const totalPages = Math.max(1, history.data?.meta.totalPages ?? 1);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Punto de venta
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">
            Historial de ventas
          </h1>
          <p className="mt-3 text-slate-500">
            Consulta las ventas POS por día.
          </p>
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-700"
            htmlFor="sales-date"
          >
            Día de venta
          </label>
          <input
            className="field"
            id="sales-date"
            onChange={(event) => setFilter('date', event.target.value)}
            type="date"
            value={date}
          />
        </div>
      </section>

      <section
        aria-label="Ventas registradas"
        className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card"
      >
        {history.loading ? (
          <div className="p-5">
            <LoadingSkeleton cards={3} />
          </div>
        ) : history.error ? (
          <p
            className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            No fue posible cargar el historial: {history.error}
          </p>
        ) : sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Venta</th>
                  <th className="px-4 py-4 font-semibold">Fecha</th>
                  <th className="px-4 py-4 font-semibold">Cajero</th>
                  <th className="px-4 py-4 font-semibold">Pago</th>
                  <th className="px-4 py-4 font-semibold">Líneas</th>
                  <th className="px-4 py-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-14 text-center text-sm text-slate-500">
            No hay ventas para este día.
          </p>
        )}
      </section>

      <nav
        aria-label="Paginación del historial de ventas"
        className="mt-6 flex items-center justify-between"
      >
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="button-secondary"
            disabled={page <= 1 || history.loading}
            onClick={() => setFilter('page', String(page - 1))}
            type="button"
          >
            Anterior
          </button>
          <button
            className="button-secondary"
            disabled={page >= totalPages || history.loading}
            onClick={() => setFilter('page', String(page + 1))}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </main>
  );
}
