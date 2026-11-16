import { BadRequestException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  it('rejects duplicate category names', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 1 });
    const create = jest.fn();
    const prisma = {
      category: { findUnique, create },
    } as unknown as PrismaService;
    const service = new CategoriesService(prisma);

    await expect(
      service.create({ name: 'Electrónica' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not deactivate a category that still has active products', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValue({ id: 2, name: 'Tecnología', deletedAt: null });
    const update = jest.fn();
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      category: { findUnique, update },
      product: { count },
    } as unknown as PrismaService;
    const service = new CategoriesService(prisma);

    await expect(service.remove(2)).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects category names that are blank after trimming', async () => {
    const create = jest.fn();
    const prisma = {
      category: { create, findUnique: jest.fn() },
    } as unknown as PrismaService;
    const service = new CategoriesService(prisma);

    await expect(service.create({ name: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
