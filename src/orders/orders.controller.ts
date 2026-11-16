import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('CLIENTE')
  @ApiOperation({
    summary: 'Checkout exclusivo con MockPay (Genera URL de pago)',
  })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      default: {
        summary: 'Checkout con MockPay',
        value: {
          addressId: 1,
          paymentMethod: 'MOCKPAY',
          notes: 'Entregar en recepción',
        },
      },
    },
  })
  @Post('checkout-mockpay')
  async checkoutMockPay(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.checkoutMockPay(req.user.id, createOrderDto);
  }

  @Roles('CLIENTE')
  @ApiOperation({
    summary: 'Reintentar el enlace de pago de un pedido pendiente',
  })
  @Post(':id/payment-link')
  retryPayment(
    @Param('id', ParseIntPipe) orderId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.retryPayment(req.user.id, orderId);
  }

  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Ver mis pedidos' })
  @Get('my-orders')
  findMyOrders(
    @Req() req: AuthenticatedRequest,
    @Query() queryDto: OrderQueryDto,
  ) {
    return this.ordersService.findMyOrders(req.user.id, queryDto);
  }

  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Ver todos los pedidos (Cola de logística)' })
  @Get()
  findAll(@Query() queryDto: OrderQueryDto) {
    return this.ordersService.findAll(queryDto);
  }

  @Roles('ADMINISTRADOR', 'CAJERO')
  @ApiOperation({ summary: 'Actualizar estado del pedido (Logística)' })
  @ApiBody({
    type: UpdateOrderStatusDto,
    examples: {
      default: {
        summary: 'Marcar como enviado',
        value: { status: 'EN_CAMINO' },
      },
    },
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
