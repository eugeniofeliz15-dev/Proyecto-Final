import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('UsersService staff safeguards', () => {
  it('does not deactivate the only active administrator', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 4,
      email: 'admin@example.com',
      role: 'ADMINISTRADOR',
      deletedAt: null,
    });
    const count = jest.fn().mockResolvedValue(1);
    const update = jest.fn();
    const prisma = {
      user: { findUnique, count, update },
    } as unknown as PrismaService;
    const service = new UsersService(prisma);

    await expect(service.remove(4)).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });

  it('does not return password hashes when deactivating staff', async () => {
    const user = {
      id: 8,
      email: 'cashier@example.com',
      role: 'CAJERO',
      deletedAt: null,
    };
    const findUnique = jest.fn().mockResolvedValue(user);
    const update = jest.fn().mockResolvedValue({
      id: user.id,
      email: user.email,
      firstName: 'Cajero',
      lastName: 'Demo',
      phone: null,
      role: user.role,
      createdAt: new Date(),
    });
    const prisma = {
      user: { findUnique, update },
    } as unknown as PrismaService;
    const service = new UsersService(prisma);

    const result = await service.remove(user.id);

    expect(result).not.toHaveProperty('password');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ password: true }),
      }),
    );
  });

  it('does not demote the only active administrator', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 4,
      email: 'admin@example.com',
      role: 'ADMINISTRADOR',
      deletedAt: null,
    });
    const count = jest.fn().mockResolvedValue(1);
    const update = jest.fn();
    const prisma = {
      user: { findUnique, count, update },
    } as unknown as PrismaService;
    const service = new UsersService(prisma);

    await expect(service.update(4, { role: 'CAJERO' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(update).not.toHaveBeenCalled();
  });
});
