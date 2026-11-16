import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaginationDto } from '../common/pagination.dto';
import { roundCurrency } from '../common/money';
import type { Prisma, Product } from '../../generated/prisma';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, cashierId: number) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const requestedByProduct = new Map<number, number>();
      for (const item of createSaleDto.items) {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productsById = new Map<number, Product>();
      for (const [productId, quantity] of requestedByProduct) {
        const product = await tx.product.findFirst({
          where: { id: productId, deletedAt: null },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto con ID ${productId} no encontrado`,
          );
        }
        if (product.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${quantity}`,
          );
        }
        productsById.set(productId, product);
      }

      const saleItemsData: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const item of createSaleDto.items) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Producto con ID ${item.productId} no encontrado`,
          );
        }

        const subtotal = roundCurrency(product.salePrice * item.quantity);
        totalAmount = roundCurrency(totalAmount + subtotal);

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.salePrice,
          subtotal: subtotal,
        });
      }

      const sale = await tx.sale.create({
        data: {
          cashierId,
          totalAmount,
          paymentMethod: createSaleDto.paymentMethod,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          cashier: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      for (const [productId, quantity] of requestedByProduct) {
        const updateResult = await tx.product.updateMany({
          where: { id: productId, deletedAt: null, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updateResult.count === 0) {
          const current = await tx.product.findUnique({
            where: { id: productId },
          });
          if (!current || current.deletedAt) {
            throw new NotFoundException(
              `Producto con ID ${productId} no encontrado`,
            );
          }
          throw new BadRequestException(
            `Stock insuficiente para "${current.name}". Disponible: ${current.stock}, Solicitado: ${quantity}`,
          );
        }
      }

      return sale;
    });
  }

  async findAll(paginationDto: PaginationDto, date?: string) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD');
      }
      const startDate = new Date(`${date}T00:00:00.000Z`);
      if (
        Number.isNaN(startDate.getTime()) ||
        startDate.toISOString().slice(0, 10) !== date
      ) {
        throw new BadRequestException(
          'La fecha debe ser un día válido en formato YYYY-MM-DD',
        );
      }
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: { include: { product: true } },
          cashier: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.sale.count({ where }),
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
}
