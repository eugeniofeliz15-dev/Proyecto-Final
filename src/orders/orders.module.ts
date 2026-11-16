import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CommonModule } from '../common/common.module'; // <-- Agregar esta línea
import { MockPayWebhookController } from './mockpay-webhook.controller';
import { MockPayWebhookGuard } from './mockpay-webhook.guard';

@Module({
  imports: [CommonModule], // <-- Agregar esta línea
  controllers: [OrdersController, MockPayWebhookController],
  providers: [OrdersService, MockPayWebhookGuard],
})
export class OrdersModule {}
