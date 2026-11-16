import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import type {
  CashRegister,
  CashRegisterStatus,
} from '../../types/api';
import { cashRegisterService } from './cashRegisterService';

const openingSchema = z.object({
  openingBalance: z.coerce.number().min(0, 'El monto no puede ser negativo.'),
});

const closingSchema = z.object({
  closingBalance: z.coerce.number().min(0, 'El monto no puede ser negativo.'),
});

type OpeningForm = z.infer<typeof openingSchema>;
type ClosingForm = z.infer<typeof closingSchema>;

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

function Reconciliation({ register }: { register: CashRegister }) {
  if (
    register.closingBalance === null ||
    register.expectedBalance === null ||
    register.difference === null
  ) {
    return null;
  }
  return (
    <section aria-labelledby="reconciliation-heading" className="mt-7 rounded-3xl bg-ink p-6 text-white sm:p-8">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-200">Conciliación</p>
      <h2 className="mt-2 text-2xl font-black" id="reconciliation-heading">Cierre de caja</h2>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/10 p-4">
          <dt className="text-sm text-slate-300">Efectivo reportado</dt>
          <dd className="mt-2 text-xl font-bold">{currency.format(register.closingBalance)}</dd>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <dt className="text-sm text-slate-300">Efectivo esperado (apertura + ventas POS en efectivo)</dt>
          <dd className="mt-2 text-xl font-bold">{currency.format(register.expectedBalance)}</dd>
        </div>
        <div className="rounded-2xl bg-white/10 p-4">
          <dt className="text-sm text-slate-300">Diferencia exacta</dt>
          <dd className={`mt-2 text-xl font-black ${register.difference === 0 ? 'text-emerald-300' : 'text-orange-200'}`}>
            {currency.format(register.difference)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default function CashRegisterPage() {
  const status = useApi<CashRegisterStatus>();
  const openMutation = useApi<CashRegister>();
  const closeMutation = useApi<CashRegister>();
  const {
    register: registerOpening,
    handleSubmit: handleOpeningSubmit,
    reset: resetOpening,
    formState: { errors: openingErrors, isSubmitting: openingSubmitting },
  } = useForm<OpeningForm>({
    resolver: zodResolver(openingSchema),
    defaultValues: { openingBalance: 0 },
  });
  const {
    register: registerClosing,
    handleSubmit: handleClosingSubmit,
    reset: resetClosing,
    formState: { errors: closingErrors, isSubmitting: closingSubmitting },
  } = useForm<ClosingForm>({
    resolver: zodResolver(closingSchema),
    defaultValues: { closingBalance: 0 },
  });

  const loadStatus = useCallback(async () => {
    await status.execute(() => cashRegisterService.getStatus());
  }, [status.execute]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const openRegister = handleOpeningSubmit(async (values) => {
    const result = await openMutation.execute(() =>
      cashRegisterService.open(values),
    );
    if (!result) return;
    resetOpening({ openingBalance: 0 });
    await loadStatus();
  });

  const closeRegister = handleClosingSubmit(async (values) => {
    const result = await closeMutation.execute(() =>
      cashRegisterService.close(values),
    );
    if (!result) return;
    resetClosing({ closingBalance: 0 });
    await loadStatus();
  });

  const currentRegister =
    status.data?.status === 'ABIERTA' ? status.data.data : null;
  const lastClosed =
    status.data?.status === 'CERRADA' ? status.data.data : undefined;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-widest text-coral">Administración</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Caja</h1>
        <p className="mt-3 text-slate-500">Apertura, cierre y conciliación de efectivo.</p>
      </section>

      {status.loading ? (
        <div className="mt-8"><LoadingSkeleton cards={2} /></div>
      ) : status.error ? (
        <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
          No se pudo consultar la caja: {status.error}
        </p>
      ) : currentRegister ? (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Caja abierta</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Turno en curso</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">Fondo inicial</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{currency.format(currentRegister.openingBalance)}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">Abierta desde</dt>
              <dd className="mt-1 font-semibold text-ink">{new Date(currentRegister.openedAt).toLocaleString('es-DO')}</dd>
            </div>
          </dl>
          <form className="mt-7 max-w-md border-t border-slate-100 pt-6" onSubmit={closeRegister}>
            <h3 className="font-bold text-ink">Cerrar caja</h3>
            <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700" htmlFor="closing-balance">
              Efectivo físico reportado
            </label>
            <input
              className="field"
              id="closing-balance"
              min="0"
              step="0.01"
              type="number"
              {...registerClosing('closingBalance', { valueAsNumber: true })}
            />
            {closingErrors.closingBalance && (
              <p className="mt-1 text-sm text-red-600">{closingErrors.closingBalance.message}</p>
            )}
            {closeMutation.error && <p className="mt-3 text-sm text-red-700" role="alert">{closeMutation.error}</p>}
            <button className="button-primary mt-5" disabled={closingSubmitting || closeMutation.loading} type="submit">
              {closingSubmitting || closeMutation.loading ? 'Cerrando caja...' : 'Confirmar cierre'}
            </button>
          </form>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Caja cerrada</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Abrir nueva caja</h2>
          <form className="mt-6 max-w-md" onSubmit={openRegister}>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="opening-balance">
              Fondo inicial
            </label>
            <input
              className="field"
              id="opening-balance"
              min="0"
              step="0.01"
              type="number"
              {...registerOpening('openingBalance', { valueAsNumber: true })}
            />
            {openingErrors.openingBalance && (
              <p className="mt-1 text-sm text-red-600">{openingErrors.openingBalance.message}</p>
            )}
            {openMutation.error && <p className="mt-3 text-sm text-red-700" role="alert">{openMutation.error}</p>}
            <button className="button-primary mt-5" disabled={openingSubmitting || openMutation.loading} type="submit">
              {openingSubmitting || openMutation.loading ? 'Abriendo caja...' : 'Abrir caja'}
            </button>
          </form>
        </section>
      )}
      {lastClosed && <Reconciliation register={lastClosed} />}
    </main>
  );
}
