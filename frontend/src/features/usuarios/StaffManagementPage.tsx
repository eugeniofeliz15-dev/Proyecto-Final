import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../stores/authStore';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  UserRecord,
} from '../../types/api';
import { userService } from './userService';

const staffFields = z.object({
  firstName: z.string().trim().min(1, 'Escribe el nombre.'),
  lastName: z.string().trim().min(1, 'Escribe el apellido.'),
  email: z.string().trim().email('Escribe un correo válido.'),
  role: z.enum(['ADMINISTRADOR', 'CAJERO']),
  password: z.string().optional(),
  phone: z.string().trim().optional(),
});

type StaffFormValues = z.infer<typeof staffFields>;

const initialValues: StaffFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'CAJERO',
  password: '',
  phone: '',
};

function displayName(user: UserRecord) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sin nombre'
  );
}

export default function StaffManagementPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const isEditingSelf = editing?.id === currentUser?.id;
  const users = useApi<UserRecord[]>();
  const saveUser = useApi<UserRecord>();
  const deactivateUser = useApi<UserRecord>();

  const schema = useMemo(
    () =>
      staffFields.superRefine((values, context) => {
        if (!editing && !values.password) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'La contraseña inicial es obligatoria.',
          });
        } else if (values.password && values.password.length < 6) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['password'],
            message: 'La contraseña debe tener al menos 6 caracteres.',
          });
        }
      }),
    [editing],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const loadUsers = useCallback(async () => {
    await users.execute(() => userService.findAll());
  }, [users.execute]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    reset(
      editing
        ? {
            firstName: editing.firstName ?? '',
            lastName: editing.lastName ?? '',
            email: editing.email,
            role: editing.role === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'CAJERO',
            password: '',
            phone: editing.phone ?? '',
          }
        : initialValues,
    );
  }, [editing, reset]);

  const submit = handleSubmit(async (values) => {
    const userData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      role: isEditingSelf && editing ? editing.role : values.role,
      phone: values.phone || undefined,
    };

    const saved = editing
      ? await saveUser.execute(() => {
          const update: UpdateStaffInput = {
            ...userData,
            ...(values.password ? { password: values.password } : {}),
          };
          return userService.update(editing.id, update);
        })
      : await saveUser.execute(() => {
          const create: CreateStaffInput = {
            ...userData,
            password: values.password ?? '',
          };
          return userService.create(create);
        });

    if (!saved) return;
    setEditing(null);
    reset(initialValues);
    await loadUsers();
  });

  const deactivate = async (staff: UserRecord) => {
    if (staff.id === currentUser?.id) return;
    const confirmed = window.confirm(
      `¿Desactivar a ${displayName(staff)}? Ya no podrá iniciar sesión y sus ventas se conservarán.`,
    );
    if (!confirmed) return;

    const deactivated = await deactivateUser.execute(() =>
      userService.remove(staff.id),
    );
    if (!deactivated) return;
    if (editing?.id === staff.id) setEditing(null);
    await loadUsers();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-widest text-coral">
          Administración
        </p>
        <h1 className="mt-2 text-4xl font-black text-ink">
          Personal y accesos
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Administra las cuentas activas de administradores y cajeros. Las
          cuentas desactivadas conservan su historial.
        </p>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-ink">
            {editing ? `Editar ${displayName(editing)}` : 'Crear personal'}
          </h2>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="staff-first-name"
                >
                  Nombre
                </label>
                <input
                  autoComplete="given-name"
                  className="field"
                  id="staff-first-name"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="staff-last-name"
                >
                  Apellido
                </label>
                <input
                  autoComplete="family-name"
                  className="field"
                  id="staff-last-name"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="staff-email"
              >
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                className="field"
                id="staff-email"
                type="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="staff-role"
              >
                Rol
              </label>
              <select
                className="field"
                disabled={isEditingSelf}
                id="staff-role"
                {...register('role')}
              >
                <option value="CAJERO">Cajero</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
              {isEditingSelf && (
                <p className="mt-1 text-xs text-slate-500">
                  No puedes cambiar tu propio rol.
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="staff-password"
              >
                {editing ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
              </label>
              <input
                autoComplete="new-password"
                className="field"
                id="staff-password"
                placeholder={
                  editing ? 'Dejar vacía para conservar la actual' : ''
                }
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="staff-phone"
              >
                Teléfono{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                autoComplete="tel"
                className="field"
                id="staff-phone"
                {...register('phone')}
              />
            </div>
            {(saveUser.error || deactivateUser.error) && (
              <p
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {saveUser.error ?? deactivateUser.error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                className="button-primary"
                disabled={isSubmitting || saveUser.loading}
                type="submit"
              >
                {isSubmitting || saveUser.loading
                  ? 'Guardando...'
                  : editing
                    ? 'Guardar cambios'
                    : 'Crear cuenta'}
              </button>
              {editing && (
                <button
                  className="button-secondary"
                  onClick={() => setEditing(null)}
                  type="button"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-coral">
                Equipo
              </p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                Personal activo
              </h2>
            </div>
            <button
              className="button-secondary"
              disabled={users.loading}
              onClick={() => void loadUsers()}
              type="button"
            >
              Actualizar
            </button>
          </div>
          {users.error && (
            <p
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {users.error}
            </p>
          )}
          {users.loading ? (
            <div className="mt-5">
              <LoadingSkeleton cards={3} />
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Persona
                    </th>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Correo
                    </th>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Rol
                    </th>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Creado
                    </th>
                    <th className="pb-3 font-semibold" scope="col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(users.data ?? []).map((staff) => (
                    <tr key={staff.id}>
                      <td className="py-4 pr-4 font-semibold text-ink">
                        {displayName(staff)}
                        {staff.id === currentUser?.id && (
                          <span className="ml-2 text-xs font-normal text-slate-500">
                            Tú
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {staff.email}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {staff.role === 'ADMINISTRADOR'
                          ? 'Administrador'
                          : 'Cajero'}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {new Date(staff.createdAt).toLocaleDateString('es-DO')}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            aria-label={`Editar ${displayName(staff)}`}
                            className="button-secondary !px-3 !py-2"
                            onClick={() => setEditing(staff)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            aria-label={`Desactivar ${displayName(staff)}`}
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={
                              staff.id === currentUser?.id ||
                              deactivateUser.loading
                            }
                            onClick={() => void deactivate(staff)}
                            title={
                              staff.id === currentUser?.id
                                ? 'No puedes desactivar tu propia cuenta'
                                : undefined
                            }
                            type="button"
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users.error && users.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Aún no hay personal activo registrado.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
