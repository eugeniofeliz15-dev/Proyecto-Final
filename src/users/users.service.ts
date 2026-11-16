import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Emails stay reserved after deactivation to preserve account history.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role ?? 'CAJERO',
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: ['ADMINISTRADOR', 'CAJERO'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
        role: { in: ['ADMINISTRADOR', 'CAJERO'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`Personal activo con ID ${id} no encontrado`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email ya está en uso');
      }
    }

    if (
      user.role === 'ADMINISTRADOR' &&
      updateUserDto.role === 'CAJERO' &&
      (await this.prisma.user.count({
        where: { role: 'ADMINISTRADOR', deletedAt: null },
      })) === 1
    ) {
      throw new ConflictException(
        'No se puede dejar la tienda sin un administrador activo.',
      );
    }

    const { password, ...userData } = updateUserDto;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (
      user.role === 'ADMINISTRADOR' &&
      (await this.prisma.user.count({
        where: { role: 'ADMINISTRADOR', deletedAt: null },
      })) === 1
    ) {
      throw new ConflictException(
        'No se puede desactivar al único administrador activo.',
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // Método interno para buscar por email (incluyendo eliminados, para login)
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
