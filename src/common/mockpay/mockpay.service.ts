import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class MockPayService {
  private readonly apiUrl: string;
  private readonly secretKey: string;
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('MOCKPAY_API_URL') || '';
    this.secretKey =
      this.configService.get<string>('MOCKPAY_SECRET_KEY') ||
      this.configService.get<string>('MOCKPAY_API_KEY') ||
      '';
    this.webhookUrl =
      this.configService.get<string>('MOCKPAY_WEBHOOK_URL') || '';
    this.webhookSecret =
      this.configService.get<string>('MOCKPAY_WEBHOOK_SECRET') || '';
  }

  assertConfigured(): void {
    if (!this.apiUrl) {
      throw new InternalServerErrorException(
        'Configura MOCKPAY_API_URL para habilitar el checkout.',
      );
    }
    if (!this.secretKey) {
      throw new InternalServerErrorException(
        'Configura MOCKPAY_API_KEY o MOCKPAY_SECRET_KEY para habilitar el checkout.',
      );
    }
    if (this.webhookUrl && !this.webhookSecret) {
      throw new InternalServerErrorException(
        'Configura MOCKPAY_WEBHOOK_SECRET cuando uses MOCKPAY_WEBHOOK_URL.',
      );
    }
  }

  async createPayment(
    amount: number,
    orderId: string,
    customerEmail: string,
  ): Promise<string> {
    this.assertConfigured();
    try {
      const payload = {
        amount: amount,
        currency: 'DOP', // Cambia a 'USD' si tu proyecto usa dólares
        description: `Pago de orden ${orderId}`,
        order_id: orderId,
        ...(this.webhookUrl ? { webhook_url: this.webhookUrl } : {}),
        customer: {
          email: customerEmail,
        },
      };

      const response = await fetch(
        `${this.apiUrl.replace(/\/+$/, '')}/payments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null);
        const message =
          isRecord(errorData) && typeof errorData.message === 'string'
            ? errorData.message
            : 'Error en la respuesta de MockPay';
        throw new Error(message);
      }

      const data: unknown = await response.json();
      const paymentUrl = isRecord(data)
        ? [data.payment_url, data.url, data.checkout_url].find(
            (value): value is string =>
              typeof value === 'string' && value.length > 0,
          )
        : undefined;
      if (!paymentUrl) {
        throw new InternalServerErrorException(
          'MockPay no devolvió un enlace de pago válido',
        );
      }
      return paymentUrl;
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error(
        'Error al crear el pago en MockPay:',
        error instanceof Error ? error.message : 'Error desconocido',
      );
      throw new InternalServerErrorException(
        'Error al generar el enlace de pago con MockPay',
      );
    }
  }
}
