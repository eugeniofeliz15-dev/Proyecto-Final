import { zodResolver } from '@hookform/resolvers/zod';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useApi } from '../../hooks/useApi';
import { notifyStockSync, useStockSync } from '../../hooks/useStockSync';
import { getApiAssetUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { Category, Paginated, Product } from '../../types/api';
import { productService } from './productService';

const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  salePrice: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  stock: z.coerce
    .number()
    .int()
    .min(0, 'El stock debe ser un entero no negativo.'),
  categoryId: z.coerce.number().int().min(1, 'Selecciona una categoría.'),
});

type ProductFormValues = z.infer<typeof productSchema>;

const defaultValues: ProductFormValues = {
  name: '',
  description: '',
  costPrice: 0,
  salePrice: 0,
  stock: 0,
  categoryId: 0,
};

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

interface ProductRowProps {
  product: Product;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  imageUrl: string | null;
}

const ProductRow = memo(function ProductRow({
  product,
  canManage,
  onEdit,
  onDelete,
  imageUrl,
}: ProductRowProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-4">
        {imageUrl && !imageFailed ? (
          <img
            alt={product.name}
            className="h-14 w-14 rounded-xl object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={imageUrl}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-400"
          >
            {product.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="font-semibold text-ink">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {product.description || 'Sin descripción'}
        </p>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {product.category.name}
      </td>
      <td className="px-4 py-4 text-sm font-medium text-slate-700">
        {product.stock}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">
        {currency.format(product.costPrice)}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-ink">
        {currency.format(product.salePrice)}
      </td>
      {canManage && (
        <td className="px-4 py-4">
          <div className="flex gap-2">
            <button
              className="button-secondary !px-3 !py-2"
              onClick={() => onEdit(product)}
              type="button"
            >
              Editar
            </button>
            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              onClick={() => onDelete(product)}
              type="button"
            >
              Eliminar
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === 'ADMINISTRADOR';
  const parsedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rawCategory = searchParams.get('category');
  const categoryId =
    rawCategory && Number.isInteger(Number(rawCategory))
      ? Number(rawCategory)
      : undefined;
  const products = useApi<Paginated<Product>>();
  const categories = useApi<Category[]>();
  const saveMutation = useApi<Product>();
  const deleteMutation = useApi<{ id: number }>();
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const loadProducts = useCallback(async () => {
    await products.execute(() =>
      productService.getInventory({ page, limit: 10, categoryId }),
    );
  }, [categoryId, page, products.execute]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useStockSync(loadProducts);

  useEffect(() => {
    void categories.execute(() => productService.getCategories());
  }, [categories.execute]);

  useEffect(() => {
    setImageFile(null);
    setImageError(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    reset(
      editing
        ? {
            name: editing.name,
            description: editing.description ?? '',
            costPrice: editing.costPrice,
            salePrice: editing.salePrice,
            stock: editing.stock,
            categoryId: editing.categoryId,
          }
        : defaultValues,
    );
  }, [editing, reset]);

  useEffect(() => {
    if (!imageFile) {
      setLocalImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setLocalImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const visibleProducts = useMemo(
    () => products.data?.data ?? [],
    [products.data],
  );

  const submitProduct = handleSubmit(async (values) => {
    const normalized = {
      ...values,
      description: values.description?.trim() || undefined,
    };
    const saved = editing
      ? await saveMutation.execute(() =>
          productService.update(editing.id, normalized, imageFile ?? undefined),
        )
      : await saveMutation.execute(() =>
          productService.create(normalized, imageFile ?? undefined),
        );

    if (!saved) return;
    setEditing(null);
    reset(defaultValues);
    notifyStockSync();
  });

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    const deleted = await deleteMutation.execute(() =>
      productService.remove(product.id),
    );
    if (!deleted) return;
    notifyStockSync();
  };

  const setCategoryFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value);
    else next.delete('category');
    next.delete('page');
    setSearchParams(next);
  };

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const totalPages = Math.max(1, products.data?.meta.totalPages ?? 1);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-coral">
            Inventario
          </p>
          <h1 className="mt-2 text-4xl font-black text-ink">Productos</h1>
          <p className="mt-3 text-slate-500">
            {canManage
              ? 'Administra el catálogo, los precios y las existencias.'
              : 'Consulta los productos y las existencias actuales.'}
          </p>
        </div>
        <div className="w-full sm:w-64">
          <label
            className="mb-2 block text-sm font-semibold text-slate-700"
            htmlFor="inventory-category"
          >
            Filtrar por categoría
          </label>
          {categories.loading ? (
            <div
              aria-label="Cargando categorías"
              className="h-12 animate-pulse rounded-xl bg-slate-200"
            />
          ) : (
            <select
              className="field"
              id="inventory-category"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryId?.toString() ?? ''}
            >
              <option value="">Todas las categorías</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {categories.error && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {categories.error}
            </p>
          )}
        </div>
      </section>

      {canManage && (
        <section className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-ink">
            {editing ? `Editar ${editing.name}` : 'Agregar producto'}
          </h2>
          <form
            className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            onSubmit={submitProduct}
          >
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-name"
              >
                Nombre
              </label>
              <input
                className="field"
                id="product-name"
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
                htmlFor="product-category"
              >
                Categoría
              </label>
              <select
                className="field"
                id="product-category"
                {...register('categoryId', { valueAsNumber: true })}
              >
                <option value={0}>Seleccionar categoría</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
              {!categories.loading && (categories.data?.length ?? 0) === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  No hay categorías activas en la API.
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-stock"
              >
                Stock
              </label>
              <input
                className="field"
                id="product-stock"
                min="0"
                type="number"
                {...register('stock', { valueAsNumber: true })}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.stock.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-cost"
              >
                Costo de adquisición
              </label>
              <input
                className="field"
                id="product-cost"
                min="0"
                step="0.01"
                type="number"
                {...register('costPrice', { valueAsNumber: true })}
              />
              {errors.costPrice && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.costPrice.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-price"
              >
                Precio de venta
              </label>
              <input
                className="field"
                id="product-price"
                min="0"
                step="0.01"
                type="number"
                {...register('salePrice', { valueAsNumber: true })}
              />
              {errors.salePrice && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.salePrice.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-description"
              >
                Descripción
              </label>
              <input
                className="field"
                id="product-description"
                {...register('description')}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label
                className="mb-2 block text-sm font-semibold text-slate-700"
                htmlFor="product-image"
              >
                Imagen del producto (JPEG, PNG o WebP; máximo 5 MB)
              </label>
              <input
                accept="image/jpeg,image/png,image/webp"
                className="field"
                id="product-image"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (
                    file &&
                    !['image/jpeg', 'image/png', 'image/webp'].includes(
                      file.type,
                    )
                  ) {
                    setImageFile(null);
                    setImageError('Selecciona una imagen JPEG, PNG o WebP.');
                    event.target.value = '';
                    return;
                  }
                  if (file && file.size > 5 * 1024 * 1024) {
                    setImageFile(null);
                    setImageError('La imagen no puede superar los 5 MB.');
                    event.target.value = '';
                    return;
                  }
                  setImageError(null);
                  setImageFile(file);
                }}
                ref={imageInputRef}
                type="file"
              />
              {imageError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {imageError}
                </p>
              )}
              {(localImagePreview || editing?.imageUrl) && (
                <img
                  alt={`Vista previa de ${editing?.name ?? 'nuevo producto'}`}
                  className="mt-3 h-28 w-28 rounded-xl object-cover"
                  src={
                    localImagePreview ??
                    getApiAssetUrl(editing?.imageUrl ?? null) ??
                    undefined
                  }
                />
              )}
            </div>
            <div className="flex gap-3 md:col-span-2 lg:col-span-3">
              <button
                className="button-primary"
                disabled={
                  isSubmitting ||
                  saveMutation.loading ||
                  (categories.data?.length ?? 0) === 0
                }
                type="submit"
              >
                {isSubmitting || saveMutation.loading
                  ? 'Guardando...'
                  : editing
                    ? 'Guardar cambios'
                    : 'Crear producto'}
              </button>
              {editing && (
                <button
                  className="button-secondary"
                  onClick={() => setEditing(null)}
                  type="button"
                >
                  Cancelar edición
                </button>
              )}
            </div>
            {saveMutation.error && (
              <p
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700 md:col-span-2 lg:col-span-3"
                role="alert"
              >
                {saveMutation.error}
              </p>
            )}
          </form>
        </section>
      )}

      <section
        className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card"
        aria-label="Lista de productos"
      >
        {products.loading ? (
          <div className="p-5">
            <LoadingSkeleton cards={3} />
          </div>
        ) : products.error ? (
          <p
            className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            No fue posible cargar el inventario: {products.error}
          </p>
        ) : visibleProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Imagen</th>
                  <th className="px-4 py-4 font-semibold">Producto</th>
                  <th className="px-4 py-4 font-semibold">Categoría</th>
                  <th className="px-4 py-4 font-semibold">Stock</th>
                  <th className="px-4 py-4 font-semibold">Costo</th>
                  <th className="px-4 py-4 font-semibold">Precio</th>
                  {canManage && (
                    <th className="px-4 py-4 font-semibold">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <ProductRow
                    canManage={canManage}
                    key={product.id}
                    onDelete={deleteProduct}
                    onEdit={setEditing}
                    product={product}
                    imageUrl={getApiAssetUrl(product.imageUrl)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-6 py-14 text-center text-sm text-slate-500">
            No hay productos para esta categoría.
          </p>
        )}
      </section>
      {deleteMutation.error && (
        <p
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {deleteMutation.error}
        </p>
      )}
      <nav
        aria-label="Paginación del inventario"
        className="mt-6 flex items-center justify-between"
      >
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="button-secondary"
            disabled={page <= 1 || products.loading}
            onClick={() => changePage(page - 1)}
            type="button"
          >
            Anterior
          </button>
          <button
            className="button-secondary"
            disabled={page >= totalPages || products.loading}
            onClick={() => changePage(page + 1)}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </main>
  );
}
