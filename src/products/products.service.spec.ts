import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  deleteProductImage,
  productImageDirectory,
} from './product-image.storage';

describe('ProductsService public catalog', () => {
  it('filters by category and does not select acquisition cost', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      product: { findMany, count },
    } as unknown as PrismaService;
    const service = new ProductsService(prisma);

    await service.findAllForWeb({ page: 1, limit: 12, categoryId: 3 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stock: { gt: 0 },
          deletedAt: null,
          categoryId: 3,
        }),
        select: expect.objectContaining({
          salePrice: true,
          stock: true,
          imageUrl: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              deletedAt: true,
            },
          },
        }),
      }),
    );
    const query = findMany.mock.calls[0]?.[0] as
      | { select?: Record<string, unknown> }
      | undefined;
    expect(query?.select).not.toHaveProperty('costPrice');
  });
});

describe('ProductsService product images', () => {
  it('stores the uploaded file and persists its URL with the product', async () => {
    const categoryFindUnique = jest.fn().mockResolvedValue({ id: 1 });
    const create = jest.fn(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 9, ...data, imageUrl: data.imageUrl }),
    );
    const prisma = {
      category: { findUnique: categoryFindUnique },
      product: { create },
    } as unknown as PrismaService;
    const service = new ProductsService(prisma);
    const image = {
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a41cAAAAASUVORK5CYII=',
        'base64',
      ),
      mimetype: 'image/png',
    };
    let imageUrl: string | null = null;

    try {
      const product = await service.create(
        {
          name: 'Producto de prueba',
          costPrice: 1,
          salePrice: 2,
          stock: 1,
          categoryId: 1,
        },
        image,
      );
      imageUrl = product.imageUrl;

      expect(imageUrl).toMatch(/^\/uploads\/products\/.+\.png$/);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ imageUrl }),
        }),
      );
      await expect(
        readFile(join(productImageDirectory, basename(imageUrl ?? ''))),
      ).resolves.toEqual(image.buffer);
    } finally {
      if (imageUrl) await deleteProductImage(imageUrl);
    }
  });
});
