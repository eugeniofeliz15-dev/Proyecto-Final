import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const productImagesPath = join(process.cwd(), 'uploads', 'products');
  mkdirSync(productImagesPath, { recursive: true });
  app.use(
    '/uploads/products',
    express.static(productImagesPath, {
      immutable: true,
      maxAge: '1y',
      index: false,
    }),
  );

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins?.length ? allowedOrigins : false });

  // 2. Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. Prefijo global
  app.setGlobalPrefix('api');

  // 4. Configuración de Swagger con orden lógico
  const config = new DocumentBuilder()
    .setTitle('POS E-commerce API')
    .setDescription('API para el sistema de punto de venta y e-commerce')
    .setVersion('1.0')
    .addBearerAuth()
    // 👇 ORDEN LÓGICO: Auth primero, luego el flujo de negocio
    .addTag('Auth', '🔐 Autenticación y registro de usuarios')
    .addTag('Users', '👥 Gestión de usuarios (Solo Admin)')
    .addTag('Categories', '📂 Categorías de productos')
    .addTag('Products', '🛍️ Catálogo de productos')
    .addTag('Cart', '🛒 Carrito de compras')
    .addTag('Orders', '📦 Órdenes y checkout')
    .addTag('Sales', '💰 Ventas POS (Punto de Venta)')
    .addTag('Cash Register', '💵 Caja registradora')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Puerto y host para Render
  const port = process.env.PORT || 10000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
}
void bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API:', error);
  process.exitCode = 1;
});
