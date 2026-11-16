import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderStatusDto,
  UpdateOrderStatusDto,
} from './dto/update-order-status.dto';
import { MockPayService } from '../common/mockpay/mockpay.service';
import { publicProductSelect } from '../products/dto/public-product.dto';
import { MockPayWebhookDto } from './dto/mockpay-webhook.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { roundCurrency } from '../common/money';
import type { Prisma } from '../../generated/prisma';

const allowedOrderTransitions: Record<
  OrderStatusDto,
  readonly OrderStatusDto[]
> = {
  PENDIENTE: [OrderStatusDto.PAGADO, OrderStatusDto.CANCELADO],
  PAGADO: [OrderStatusDto.EN_CAMINO],
  EN_CAMINO: [OrderStatusDto.ENTREGADO],
  ENTREGADO: [],
  CANCELADO: [],
};

function isOrderStatusDto(value: string): value is OrderStatusDto {
  return Object.values(OrderStatusDto).some((status) => status === value);
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mockPayService: MockPayService,
  ) {}

  // ✅ MÉTODO CORREGIDO PARA COINCIDIR CON LA DOCUMENTACIÓN REAL DE MOCKPAY
  async handlePaymentWebhook(webhookData: MockPayWebhookDto) {
    const rawOrderId = (
      webhookData.metadata?.order_id ?? webhookData.order_id
    )?.replace(/^ORD-/, '');
    const orderId = Number(rawOrderId);
    if (!Number.isInteger(orderId) || orderId < 1) {
      throw new BadRequestException('ID de orden inválido en el webhook');
    }

    const isPaymentSuccess =
      webhookData.event === 'payment.succeeded' ||
      webhookData.status === 'SUCCEEDED';
    const isPaymentFailed =
      webhookData.event === 'payment.failed' || webhookData.status === 'FAILED';

    if (isPaymentSuccess) {
      await this.prisma.order.updateMany({
        where: { id: orderId, status: 'PENDIENTE' },
        data: { status: 'PAGADO' },
      });
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      return order;
    }

    if (isPaymentFailed) {
      return this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        if (order.status !== 'PENDIENTE') return order;

        const changed = await tx.order.updateMany({
          where: { id: orderId, status: 'PENDIENTE' },
          data: { status: 'CANCELADO' },
        });
        if (changed.count === 0) {
          const current = await tx.order.findUnique({ where: { id: orderId } });
          if (!current) throw new NotFoundException('Pedido no encontrado');
          return current;
        }

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return tx.order.findUniqueOrThrow({ where: { id: orderId } });
      });
    }

    throw new BadRequestException('Evento de webhook no reconocido');
  }

  async updateStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      const nextStatus = updateOrderStatusDto.status;
      if (
        !isOrderStatusDto(order.status) ||
        !allowedOrderTransitions[order.status].includes(nextStatus)
      ) {
        throw new BadRequestException(
          `No se puede cambiar un pedido de ${order.status} a ${nextStatus}`,
        );
      }

      const changed = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status: nextStatus },
      });
      if (changed.count === 0) {
        throw new ConflictException('El pedido cambió mientras se actualizaba');
      }

      if (nextStatus === 'CANCELADO') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.findUniqueOrThrow({ where: { id } });
    });
  }

  async findAll(queryDto: OrderQueryDto) {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
          address: true,
          items: {
            include: { product: { select: publicProductSelect } },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.order.count({ where }),
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

  async findMyOrders(customerId: number, queryDto: OrderQueryDto) {
    const { page = 1, limit = 10, status } = queryDto;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      customerId,
      ...(status ? { status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          address: true,
          items: {
            include: { product: { select: publicProductSelect } },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.order.count({ where }),
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

  async checkoutMockPay(customerId: number, createOrderDto: CreateOrderDto) {
    if (createOrderDto.paymentMethod !== 'MOCKPAY') {
      throw new BadRequestException('Este checkout requiere el método MOCKPAY');
    }
    this.mockPayService.assertConfigured();
    const customer = await this.prisma.user.findFirst({
      where: { id: customerId, role: 'CLIENTE', deletedAt: null },
      select: { email: true },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    const address = await this.prisma.address.findFirst({
      where: { id: createOrderDto.addressId, userId: customerId },
    });
    if (!address)
      throw new NotFoundException('Dirección de envío no encontrada');

    const cart = await this.prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: { include: { product: { select: publicProductSelect } } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const requestedByProduct = new Map<number, number>();
      for (const item of cart.items) {
        requestedByProduct.set(
          item.productId,
          (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, quantity] of requestedByProduct) {
        const item = cart.items.find(
          (cartItem) => cartItem.productId === productId,
        );
        if (!item || item.product.deletedAt) {
          throw new NotFoundException(
            `Producto con ID ${productId} no encontrado`,
          );
        }
        if (item.product.stock < quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${item.product.name}". Disponible: ${item.product.stock}, Solicitado: ${quantity}`,
          );
        }
      }

      const orderItemsData: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const item of cart.items) {
        const subtotal = roundCurrency(item.product.salePrice * item.quantity);
        totalAmount = roundCurrency(totalAmount + subtotal);

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          subtotal,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          customerId,
          addressId: createOrderDto.addressId,
          totalAmount,
          notes: createOrderDto.notes,
          status: 'PENDIENTE',
          items: { create: orderItemsData },
        },
        include: {
          items: {
            include: { product: { select: publicProductSelect } },
          },
          address: true,
        },
      });

      for (const [productId, quantity] of requestedByProduct) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            deletedAt: null,
            stock: { gte: quantity },
          },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: productId },
          });
          if (!product || product.deletedAt) {
            throw new NotFoundException(
              `Producto con ID ${productId} no encontrado`,
            );
          }
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${quantity}`,
          );
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return newOrder;
    });

    let checkoutUrl: string | null = null;
    let paymentError: string | undefined;
    try {
      checkoutUrl = await this.mockPayService.createPayment(
        order.totalAmount,
        `ORD-${order.id}`,
        customer.email,
      );
    } catch (error: unknown) {
      if (!(error instanceof InternalServerErrorException)) throw error;
      paymentError =
        'El pedido quedó creado y reservado, pero no se pudo generar el enlace. Puedes reintentarlo desde Mis pedidos.';
    }

    return {
      order,
      checkout_url: checkoutUrl,
      ...(paymentError ? { payment_error: paymentError } : {}),
      message: paymentError
        ? 'Pedido creado, pendiente de generar el enlace de pago.'
        : 'Orden creada exitosamente. Redirige al cliente a checkout_url para completar el pago.',
    };
  }

  async retryPayment(customerId: number, orderId: number) {
    this.mockPayService.assertConfigured();
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      select: { id: true, totalAmount: true, status: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status !== 'PENDIENTE') {
      throw new BadRequestException(
        'Solo se puede generar un enlace de pago para pedidos pendientes',
      );
    }

    const customer = await this.prisma.user.findFirst({
      where: { id: customerId, role: 'CLIENTE', deletedAt: null },
      select: { email: true },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return {
      checkout_url: await this.mockPayService.createPayment(
        order.totalAmount,
        `ORD-${order.id}`,
        customer.email,
      ),
    };
  }
}
