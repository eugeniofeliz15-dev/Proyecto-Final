import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import type { PublicProductDto } from './dto/public-product.dto';
import { publicProductSelect } from './dto/public-product.dto';
import type { Prisma } from '../../generated/prisma';
import {
  deleteProductImage,
  saveProductImage,
  type ProductImageUpload,
} from './product-image.storage';

function productSearchFilter(query?: string): Prisma.ProductWhereInput {
  const search = query?.trim();
  if (!search) return {};
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      {
        category: {
          is: { name: { contains: search, mode: 'insensitive' } },
        },
      },
    ],
  };
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, image?: ProductImageUpload) {
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const imageUrl = image ? await saveProductImage(image) : undefined;
    try {
      return await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          description: createProductDto.description,
          costPrice: createProductDto.costPrice,
          salePrice: createProductDto.salePrice,
          stock: createProductDto.stock,
          categoryId: createProductDto.categoryId,
          ...(imageUrl ? { imageUrl } : {}),
        },
        include: { category: true },
      });
    } catch (error: unknown) {
      if (imageUrl) await this.cleanupImage(imageUrl);
      throw error;
    }
  }

  async findAll(paginationDto: ProductQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(paginationDto.categoryId
        ? { categoryId: paginationDto.categoryId }
        : {}),
      ...productSearchFilter(paginationDto.q),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
        include: { category: true },
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForWeb(paginationDto: ProductQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    const whereClause: Prisma.ProductWhereInput = {
      stock: { gt: 0 },
      deletedAt: null,
      ...(paginationDto.categoryId
        ? { categoryId: paginationDto.categoryId }
        : {}),
      ...productSearchFilter(paginationDto.q),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
        select: publicProductSelect,
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    const publicData: PublicProductDto[] = data;
    return {
      data: publicData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    image?: ProductImageUpload,
  ) {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    const imageUrl = image ? await saveProductImage(image) : undefined;
    let updatedProduct: Awaited<ReturnType<typeof this.prisma.product.update>>;
    try {
      updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          description: updateProductDto.description,
          costPrice: updateProductDto.costPrice,
          salePrice: updateProductDto.salePrice,
          stock: updateProductDto.stock,
          categoryId: updateProductDto.categoryId,
          ...(imageUrl ? { imageUrl } : {}),
        },
        include: { category: true },
      });
    } catch (error: unknown) {
      if (imageUrl) await this.cleanupImage(imageUrl);
      throw error;
    }

    if (imageUrl && product.imageUrl) {
      await this.cleanupImage(product.imageUrl);
    }
    return updatedProduct;
  }

  private async cleanupImage(imageUrl: string): Promise<void> {
    try {
      await deleteProductImage(imageUrl);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return;
      }
      this.logger.error(
        `No fue posible limpiar la imagen ${imageUrl}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Verifica que existe y no está eliminado

    // SOFT DELETE: En lugar de borrar, marcamos deletedAt
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
