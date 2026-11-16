import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MockPayWebhookDto } from './dto/mockpay-webhook.dto';
import { OrdersService } from './orders.service';
import { MockPayWebhookGuard } from './mockpay-webhook.guard';

@ApiTags('Orders')
@Controller('orders/webhooks')
@UseGuards(MockPayWebhookGuard)
export class MockPayWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('mockpay')
  @ApiOperation({
    summary: 'Webhook MockPay autenticado con el header x-mockpay-secret',
  })
  @ApiHeader({
    name: 'x-mockpay-secret',
    required: true,
    description: 'Debe coincidir con MOCKPAY_WEBHOOK_SECRET.',
  })
  handleMockPayWebhook(@Body() webhookData: MockPayWebhookDto) {
    return this.ordersService.handlePaymentWebhook(webhookData);
  }
}
