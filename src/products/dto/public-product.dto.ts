import type { Category, Prisma, Product } from '../../../generated/prisma';

export const publicProductSelect = {
  id: true,
  name: true,
  description: true,
  salePrice: true,
  stock: true,
  categoryId: true,
  imageUrl: true,
  deletedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      description: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type PublicProductDto = Omit<Product, 'costPrice'> & {
  category: Category;
};
