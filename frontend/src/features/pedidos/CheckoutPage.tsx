import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { useCarrito } from '../../hooks/useCarrito';
import { notifyStockSync } from '../../hooks/useStockSync';
import type { Address, CheckoutResponse } from '../../types/api';
import { orderService } from './orderService';

const addressSchema = z.object({
  street: z.string().trim().min(2, 'Escribe la calle y número.'),
  city: z.string().trim().min(2, 'Escribe la ciudad.'),
  state: z.string().trim().min(2, 'Escribe la provincia o estado.'),
  zipCode: z.string().trim().min(2, 'Escribe el código postal.'),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const checkoutSchema = z.object({
  addressId: z.coerce.number().int().min(1, 'Selecciona una dirección.'),
  paymentMethod: z.literal('MOCKPAY'),
  notes: z.string().trim().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

export default function CheckoutPage() {
  const { items, total, clear, loading: cartLoading } = useCarrito();
  const addresses = useApi<Address[]>();
  const addressMutation = useApi<Address>();
  const checkoutMutation = useApi<CheckoutResponse>();
  const [completed, setCompleted] = useState<CheckoutResponse | null>(null);

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddress,
    formState: { errors: addressErrors, isSubmitting: savingAddress },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    },
  });
  const {
    register: registerCheckout,
    handleSubmit: handleCheckoutSubmit,
    setValue,
    formState: { errors: checkoutErrors, isSubmitting: submittingCheckout },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { addressId: 0, paymentMethod: 'MOCKPAY', notes: '' },
  });

  const loadAddresses = useCallback(async () => {
    const result = await addresses.execute(() => orderService.getAddresses());
    if (result?.length) {
      const selected = result.find((address) => address.isDefault) ?? result[0];
      setValue('addressId', selected.id);
    }
  }, [addresses.execute, setValue]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const saveAddress = async (values: AddressFormValues) => {
    const created = await addressMutation.execute(() =>
      orderService.createAddress(values),
    );
    if (!created) return;
    await loadAddresses();
    setValue('addressId', created.id);
    resetAddress({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    });
  };

  const submitCheckout = handleCheckoutSubmit(async (values) => {
    const result = await checkoutMutation.execute(() =>
      orderService.checkout(values),
    );
    if (!result) return;
    setCompleted(result);
    clear();
    notifyStockSync();
  });

  if (completed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-card sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
            Pedido creado
          </p>
          <h1 className="mt-3 text-3xl font-black text-ink">
            Pedido #{completed.order.id}
          </h1>
          <p className="mt-3 text-slate-600">
            El pedido quedó {completed.order.status.toLocaleLowerCase()} y está
            asociado a tu cuenta.
          </p>
          {completed.payment_error && (
            <p
              className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
              role="alert"
            >
              {completed.payment_error}
            </p>
          )}
          <p className="mt-5 text-2xl font-black text-ink">
            {currency.format(completed.order.totalAmount)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {completed.checkout_url && (
              <button
                className="button-primary"
                onClick={() => {
                  if (completed.checkout_url) {
                    window.location.assign(completed.checkout_url);
                  }
                }}
                type="button"
              >
                Continuar al pago
              </button>
            )}
            <Link className="button-secondary" to="/mis-pedidos">
              Ver mis pedidos
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-widest text-coral">
          Finalizar pedido
        </p>
        <h1 className="mt-2 text-4xl font-black text-ink">Checkout</h1>
      </section>
      {cartLoading ? (
        <div className="mt-8">
          <LoadingSkeleton cards={2} />
        </div>
      ) : items.length === 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-card">
          <h2 className="text-xl font-bold text-ink">
            No hay productos para pagar
          </h2>
          <Link className="button-primary mt-5" to="/">
            Volver al catálogo
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-ink">
                Dirección de entrega
              </h2>
              {addresses.loading ? (
                <div
                  aria-label="Cargando direcciones"
                  className="mt-5 h-12 animate-pulse rounded-xl bg-slate-200"
                />
              ) : (
                <div className="mt-5">
                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="address-select"
                  >
                    Elige una dirección
                  </label>
                  <select
                    className="field"
                    form="checkout-form"
                    id="address-select"
                    {...registerCheckout('addressId', { valueAsNumber: true })}
                  >
                    <option value={0}>Seleccionar dirección</option>
                    {(addresses.data ?? []).map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.street}, {address.city}, {address.state}{' '}
                        {address.isDefault ? '(Principal)' : ''}
                      </option>
                    ))}
                  </select>
                  {checkoutErrors.addressId && (
                    <p className="mt-1 text-sm text-red-600">
                      {checkoutErrors.addressId.message}
                    </p>
                  )}
                  {addresses.error && (
                    <p className="mt-2 text-sm text-red-700" role="alert">
                      {addresses.error}
                    </p>
                  )}
                </div>
              )}
              <form
                className="mt-6 border-t border-slate-100 pt-6"
                onSubmit={handleAddressSubmit(saveAddress)}
              >
                <h3 className="font-semibold text-ink">
                  Agregar otra dirección
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="address-street"
                    >
                      Calle y número
                    </label>
                    <input
                      className="field"
                      id="address-street"
                      autoComplete="street-address"
                      {...registerAddress('street')}
                    />
                    {addressErrors.street && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressErrors.street.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="address-city"
                    >
                      Ciudad
                    </label>
                    <input
                      className="field"
                      id="address-city"
                      autoComplete="address-level2"
                      {...registerAddress('city')}
                    />
                    {addressErrors.city && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressErrors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="address-state"
                    >
                      Provincia / Estado
                    </label>
                    <input
                      className="field"
                      id="address-state"
                      autoComplete="address-level1"
                      {...registerAddress('state')}
                    />
                    {addressErrors.state && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressErrors.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-sm font-semibold text-slate-700"
                      htmlFor="address-zip"
                    >
                      Código postal
                    </label>
                    <input
                      className="field"
                      id="address-zip"
                      autoComplete="postal-code"
                      {...registerAddress('zipCode')}
                    />
                    {addressErrors.zipCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {addressErrors.zipCode.message}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" {...registerAddress('isDefault')} />
                    Marcar como dirección principal
                  </label>
                </div>
                {addressMutation.error && (
                  <p className="mt-3 text-sm text-red-700" role="alert">
                    {addressMutation.error}
                  </p>
                )}
                <button
                  className="button-secondary mt-4"
                  disabled={savingAddress || addressMutation.loading}
                  type="submit"
                >
                  {savingAddress || addressMutation.loading
                    ? 'Guardando dirección...'
                    : 'Guardar dirección'}
                </button>
              </form>
            </section>
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-ink">Pago</h2>
              <p className="mt-2 text-sm text-slate-500">
                El pago se procesará de forma segura con MockPay.
              </p>
              <input
                form="checkout-form"
                type="hidden"
                {...registerCheckout('paymentMethod')}
              />
              <label
                className="mt-5 block text-sm font-semibold text-slate-700"
                htmlFor="delivery-notes"
              >
                Referencias para la entrega{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                className="field mt-2 min-h-24"
                id="delivery-notes"
                placeholder="Punto de referencia, horario u otra indicación"
                form="checkout-form"
                {...registerCheckout('notes')}
              />
            </section>
          </div>
          <aside className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-ink">Tu pedido</h2>
            <ul className="mt-4 space-y-3">
              {items.map(({ product, quantity }) => (
                <li
                  className="flex justify-between gap-3 text-sm"
                  key={product.id}
                >
                  <span className="text-slate-600">
                    {product.name} × {quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">
                    {currency.format(product.salePrice * quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 font-black text-ink">
              <span>Total</span>
              <span>{currency.format(total)}</span>
            </div>
            {checkoutMutation.error && (
              <p
                className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {checkoutMutation.error}
              </p>
            )}
            <form className="mt-6" id="checkout-form" onSubmit={submitCheckout}>
              <button
                className="button-primary w-full"
                disabled={
                  submittingCheckout ||
                  checkoutMutation.loading ||
                  addressMutation.loading ||
                  !addresses.data?.length
                }
                type="submit"
              >
                {submittingCheckout || checkoutMutation.loading
                  ? 'Creando pedido...'
                  : 'Crear pedido'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
