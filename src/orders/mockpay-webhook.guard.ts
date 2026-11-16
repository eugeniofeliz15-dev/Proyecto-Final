import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class MockPayWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedSecret = this.configService.get<string>(
      'MOCKPAY_WEBHOOK_SECRET',
    );
    const receivedSecret = request.header('x-mockpay-secret');

    if (!expectedSecret || !receivedSecret) {
      throw new UnauthorizedException(
        'Autenticación del webhook no configurada',
      );
    }

    const expected = Buffer.from(expectedSecret);
    const received = Buffer.from(receivedSecret);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException('Autenticación del webhook inválida');
    }

    return true;
  }
}
