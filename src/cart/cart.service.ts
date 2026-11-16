import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { publicProductSelect } from '../products/dto/public-product.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(customerId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: { include: { product: { select: publicProductSelect } } },
      },
    });

    // Si no tiene carrito, creamos uno vacío
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId },
        include: {
          items: { include: { product: { select: publicProductSelect } } },
        },
      });
    }

    return cart;
  }

  async addToCart(customerId: number, addToCartDto: AddToCartDto) {
    // Verificar que el producto existe y tiene stock
    const product = await this.prisma.product.findFirst({
      where: { id: addToCartDto.productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.stock === 0) throw new BadRequestException('Producto agotado');

    // Obtener o crear el carrito
    let cart = await this.prisma.cart.findUnique({ where: { customerId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { customerId } });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: addToCartDto.productId },
    });

    const requestedQuantity =
      (existingItem?.quantity ?? 0) + addToCartDto.quantity;
    if (requestedQuantity > product.stock) {
      throw new BadRequestException(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${requestedQuantity}`,
      );
    }

    if (existingItem) {
      // Actualizar cantidad si ya existe
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: addToCartDto.quantity } },
      });
    } else {
      // Crear nuevo item en el carrito
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: addToCartDto.productId,
          quantity: addToCartDto.quantity,
        },
      });
    }
  }

  async removeFromCart(customerId: number, productId: number) {
    const cart = await this.prisma.cart.findUnique({ where: { customerId } });
    if (!cart) throw new NotFoundException('Carrito no encontrado');

    const item = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });
    if (!item) throw new NotFoundException('Producto no está en el carrito');

    return this.prisma.cartItem.delete({ where: { id: item.id } });
  }
}