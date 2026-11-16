import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import type { Category, CategoryInput } from '../../types/api';
import { productService } from './productService';

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre no puede superar 80 caracteres.'),
  description: z
    .string()
    .trim()
    .max(250, 'La descripción no puede superar 250 caracteres.')
    .optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const initialValues: CategoryFormValues = {
  name: '',
  description: '',
};

export default function CategoryManagementPage() {
  const [editing, setEditing] = useState<Category | null>(null);
  const categories = useApi<Category[]>();
  const saveCategory = useApi<Category>();
  const deactivateCategory = useApi<Category>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues,
  });

  const loadCategories = useCallback(async () => {
    await categories.execute(() => productService.getCategories());
  }, [categories.execute]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
          }
        : initialValues,
    );
  }, [editing, reset]);

  const submit = handleSubmit(async (values) => {
    const input: CategoryInput = {
      name: values.name,
      description: values.description || undefined,
    };
    const saved = editing
      ? await saveCategory.execute(() =>
          productService.updateCategory(editing.id, input),
        )
      : await saveCategory.execute(() => productService.createCategory(input));

    if (!saved) return;
    setEditing(null);
    reset(initialValues);
    await loadCategories();
  });

  const deactivate = async (category: Category) => {
    const confirmed = window.confirm(
      `¿Desactivar la categoría "${category.name}"? Solo se podrá desactivar si no tiene productos activos.`,
    );
    if (!confirmed) return;

    const result = await deactivateCategory.execute(() =>
      productService.removeCategory(category.id),
    );
    if (!result) return;
    if (editing?.id === category.id) setEditing(null);
    await loadCategories();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-widest text-coral">
          Administración del catálogo
        </p>
        <h1 className="mt-2 text-4xl font-black text-ink">Categorías</h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          Crea y edita categorías para organizar el inventario. Las categorías
          con productos activos no se pueden desactivar.
        </p>
      </section>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-ink">
            {editing ? `Editar ${editing.name}` : 'Crear categoría'}
          </h2>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="category-name"
              >
                Nombre
              </label>
              <input
                className="field"
                id="category-name"
                maxLength={80}
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="category-description"
              >
                Descripción{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                className="field min-h-28 resize-y"
                id="category-description"
                maxLength={250}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
            {(saveCategory.error || deactivateCategory.error) && (
              <p
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {saveCategory.error ?? deactivateCategory.error}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                className="button-primary"
                disabled={isSubmitting || saveCategory.loading}
                type="submit"
              >
                {isSubmitting || saveCategory.loading
                  ? 'Guardando...'
                  : editing
                    ? 'Guardar cambios'
                    : 'Crear categoría'}
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
                Catálogo
              </p>
              <h2 className="mt-1 text-xl font-bold text-ink">
                Categorías activas
              </h2>
            </div>
            <button
              className="button-secondary"
              disabled={categories.loading}
              onClick={() => void loadCategories()}
              type="button"
            >
              Actualizar
            </button>
          </div>
          {categories.error && (
            <p
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {categories.error}
            </p>
          )}
          {categories.loading ? (
            <div className="mt-5">
              <LoadingSkeleton cards={3} />
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Categoría
                    </th>
                    <th className="pb-3 pr-4 font-semibold" scope="col">
                      Descripción
                    </th>
                    <th className="pb-3 font-semibold" scope="col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(categories.data ?? []).map((category) => (
                    <tr key={category.id}>
                      <td className="py-4 pr-4 font-semibold text-ink">
                        {category.name}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {category.description || 'Sin descripción'}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            aria-label={`Editar ${category.name}`}
                            className="button-secondary !px-3 !py-2"
                            onClick={() => setEditing(category)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            aria-label={`Desactivar ${category.name}`}
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={deactivateCategory.loading}
                            onClick={() => void deactivate(category)}
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
              {!categories.error && categories.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Aún no hay categorías activas.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
