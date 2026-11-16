import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const name = createCategoryDto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException(
        'El nombre de la categoría debe tener al menos 2 caracteres.',
      );
    }
    const existingCategory = await this.prisma.category.findUnique({
      where: { name },
    });
    if (existingCategory) {
      throw new ConflictException('Ya existe una categoría con ese nombre.');
    }
    return this.prisma.category.create({
      data: {
        name,
        description: createCategoryDto.description?.trim() || undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null }, // <-- Solo categorías activas
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const name = updateCategoryDto.name?.trim();
    if (name !== undefined && name.length < 2) {
      throw new BadRequestException(
        'El nombre de la categoría debe tener al menos 2 caracteres.',
      );
    }
    if (name && name !== category.name) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { name },
      });
      if (existingCategory) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(updateCategoryDto.description !== undefined
          ? {
              description: updateCategoryDto.description.trim() || null,
            }
          : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const activeProducts = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (activeProducts > 0) {
      throw new ConflictException(
        'No se puede desactivar una categoría con productos activos. Reasigna o desactiva sus productos primero.',
      );
    }
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
