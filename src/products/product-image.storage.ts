import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface ProductImageUpload {
  buffer: Buffer;
  mimetype: string;
}

export const productImageDirectory = join(
  process.cwd(),
  'uploads',
  'products',
);

function getImageExtension(file: ProductImageUpload): string {
  const { buffer, mimetype } = file;
  const isPng =
    mimetype === 'image/png' &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg =
    mimetype === 'image/jpeg' &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isWebp =
    mimetype === 'image/webp' &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if (isPng) return '.png';
  if (isJpeg) return '.jpg';
  if (isWebp) return '.webp';
  throw new BadRequestException('El archivo no es una imagen JPEG, PNG o WebP válida.');
}

export async function saveProductImage(
  file: ProductImageUpload,
): Promise<string> {
  const extension = getImageExtension(file);
  const fileName = `${randomUUID()}${extension}`;
  await mkdir(productImageDirectory, { recursive: true });
  await writeFile(join(productImageDirectory, fileName), file.buffer, {
    flag: 'wx',
  });
  return `/uploads/products/${fileName}`;
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const match =
    /^\/uploads\/products\/([0-9a-f-]{36}\.(?:png|jpg|webp))$/i.exec(imageUrl);
  if (!match) return;
  await unlink(join(productImageDirectory, match[1]));
}
