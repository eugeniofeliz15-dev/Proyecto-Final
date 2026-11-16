import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Audífonos Bluetooth Sony' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Inalámbricos con cancelación de ruido' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.5 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice: number;

  @ApiProperty({ example: 49.99 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice: number;

  @ApiProperty({ example: 50 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) =>
    typeof value === 'string' ? Number(value) : value,
  )
  @IsInt()
  @Min(1)
  categoryId: number;
}
