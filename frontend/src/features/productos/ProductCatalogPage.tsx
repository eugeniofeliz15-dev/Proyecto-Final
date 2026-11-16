import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useCarrito } from '../../hooks/useCarrito';
import { useDebounce } from '../../hooks/useDebounce';
import { useStockSync } from '../../hooks/useStockSync';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { getApiAssetUrl } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { Category, Paginated, PublicProduct } from '../../types/api';
import { productService } from './productService';
import { getErrorMessage } from '../../lib/errors';

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

interface ProductCardProps {
  product: PublicProduct;
  canAdd: boolean;
  isAuthenticated: boolean;
  onAdd: (product: PublicProduct) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  canAdd,
  isAuthenticated,
  onAdd,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getApiAssetUrl(product.imageUrl);

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-card transition hover:-translate-y-1">
      {imageUrl && !imageFailed ? (
        <img
          alt={product.name}
          className="h-44 w-full rounded-2xl object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
          src={imageUrl}
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-44 items-end rounded-2xl bg-gradient-to-br from-orange-100 via-rose-100 to-slate-100 p-5"
        >
          <span className="text-5xl font-black text-white/80">
            {product.name.trim().charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-2 pt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-coral">
          {product.category.name}
        </p>
        <h2 className="mt-2 text-lg font-bold text-ink">{product.name}</h2>
        <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
          {product.description || 'Un producto seleccionado para ti.'}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xl font-black text-ink">
              {currency.format(product.salePrice)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Disponibles: {product.stock}
            </p>
          </div>
          <button
            className="button-primary !px-3 !py-2.5"
            disabled={product.stock === 0 || (isAuthenticated && !canAdd)}
            onClick={() => onAdd(product)}
            type="button"
          >
            {canAdd
              ? 'Agregar'
              : isAuthenticated
                ? 'Solo clientes'
                : 'Iniciar sesión'}
          </button>
        </div>
      </div>
    </article>
  );
});

export default function ProductCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { add, error: cartError } = useCarrito();
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const pageFromUrl = Number(searchParams.get('page') ?? '1');
  const page =
    Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const categoryParam = searchParams.get('category');
  const categoryId =
    categoryParam && Number.isInteger(Number(categoryParam))
      ? Number(categoryParam)
      : undefined;
  const query = searchParams.get('q') ?? '';
  const debouncedQuery = useDebounce(query);
  const products = useApi<Paginated<PublicProduct>>();
  const categories = useApi<Category[]>();

  const loadProducts = useCallback(async () => {
    await products.execute(() =>
      productService.getPublic({
        page,
        limit: 12,
        categoryId,
        q: debouncedQuery.trim() || undefined,
      }),
    );
  }, [categoryId, debouncedQuery, page, products.execute]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useStockSync(loadProducts);

  useEffect(() => {
    void categories.execute(() => productService.getCategories());
  }, [categories.execute]);

  const visibleProducts = products.data?.data ?? [];

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const addToCart = async (product: PublicProduct) => {
    if (user?.role !== 'CLIENTE') {
      if (!user) navigate('/login');
      return;
    }
    if (product.stock < 1) return;
    setCartNotice(null);
    try {
      await add(product);
      setCartNotice(`${product.name} se agregó al carrito.`);
    } catch (error: unknown) {
      setCartNotice(getErrorMessage(error, 'No se pudo agregar el producto.'));
    }
  };

  const totalPages = Math.max(1, products.data?.meta.totalPages ?? 1);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:px-14 lg:py-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-200">
            Tienda en línea
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-6xl">
            Lo que necesitas, a un clic de distancia.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Explora el catálogo disponible y encuentra tu próximo favorito.
          </p>
        </div>
        <div aria-hidden="true" className="hidden justify-center lg:flex">
          <div className="flex h-56 w-56 rotate-6 items-center justify-center rounded-[3rem] bg-coral text-7xl font-black shadow-2xl">
            M
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="catalog-title">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-coral">
              Catálogo
            </p>
            <h2
              className="mt-2 text-3xl font-black text-ink"
              id="catalog-title"
            >
              Encuentra algo bueno
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-[26rem]">
            <div>
              <label className="sr-only" htmlFor="search-products">
                Buscar productos
              </label>
              <input
                className="field"
                id="search-products"
                onChange={(event) => updateFilter('q', event.target.value)}
                maxLength={100}
                placeholder="Buscar en el catálogo"
                type="search"
                value={query}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="category-filter">
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
                  id="category-filter"
                  onChange={(event) =>
                    updateFilter('category', event.target.value)
                  }
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
            </div>
          </div>
        </div>
        {categories.error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            No se pudieron cargar las categorías: {categories.error}
          </p>
        )}
        {(cartNotice || cartError) && (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {cartNotice ?? cartError}
          </p>
        )}

        <div className="mt-8">
          {products.loading ? (
            <LoadingSkeleton />
          ) : products.error ? (
            <p
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              role="alert"
            >
              No fue posible cargar el catálogo: {products.error}
            </p>
          ) : visibleProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard
                  canAdd={user?.role === 'CLIENTE'}
                  isAuthenticated={Boolean(user)}
                  key={product.id}
                  onAdd={addToCart}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <h3 className="text-lg font-bold text-ink">
                No encontramos productos
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Prueba con otra búsqueda o categoría.
              </p>
            </div>
          )}
        </div>

        <nav
          aria-label="Paginación del catálogo"
          className="mt-8 flex items-center justify-between"
        >
          <p className="text-sm text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="button-secondary"
              disabled={page <= 1 || products.loading}
              onClick={() => updateFilter('page', String(page - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              className="button-secondary"
              disabled={page >= totalPages || products.loading}
              onClick={() => updateFilter('page', String(page + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </nav>
        {user?.role !== 'CLIENTE' && (
          <p className="mt-5 text-center text-sm text-slate-500">
            <Link
              className="font-semibold text-ink underline decoration-coral"
              to="/registro"
            >
              Crea una cuenta de cliente
            </Link>{' '}
            para agregar productos al carrito.
          </p>
        )}
      </section>
    </main>
  );
}
