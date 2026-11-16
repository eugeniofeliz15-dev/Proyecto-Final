import { api } from '../../lib/api';
import type {
  Category,
  CategoryInput,
  Paginated,
  Product,
  ProductInput,
  PublicProduct,
} from '../../types/api';

export interface ProductQuery {
  page: number;
  limit: number;
  categoryId?: number;
  q?: string;
}

function toProductFormData(
  input: Partial<ProductInput>,
  image?: File,
): FormData {
  const formData = new FormData();
  const fields: Array<keyof ProductInput> = [
    'name',
    'description',
    'costPrice',
    'salePrice',
    'stock',
    'categoryId',
  ];

  for (const field of fields) {
    const value = input[field];
    if (value !== undefined) formData.append(field, String(value));
  }
  if (image) formData.append('image', image);
  return formData;
}

export const productService = {
  async getPublic(query: ProductQuery) {
    const response = await api.get<Paginated<PublicProduct>>('/products/web', {
      params: query,
    });
    return response.data;
  },
  async getInventory(query: ProductQuery) {
    const response = await api.get<Paginated<Product>>('/products', {
      params: query,
    });
    return response.data;
  },
  async getCategories() {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
  async createCategory(input: CategoryInput) {
    const response = await api.post<Category>('/categories', input);
    return response.data;
  },
  async updateCategory(id: number, input: Partial<CategoryInput>) {
    const response = await api.patch<Category>(`/categories/${id}`, input);
    return response.data;
  },
  async removeCategory(id: number) {
    const response = await api.delete<Category>(`/categories/${id}`);
    return response.data;
  },
  async create(input: ProductInput, image?: File) {
    const response = await api.post<Product>(
      '/products',
      toProductFormData(input, image),
    );
    return response.data;
  },
  async update(id: number, input: Partial<ProductInput>, image?: File) {
    const response = await api.patch<Product>(
      `/products/${id}`,
      toProductFormData(input, image),
    );
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete<{ id: number }>(`/products/${id}`);
    return response.data;
  },
};
