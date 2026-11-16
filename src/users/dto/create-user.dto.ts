import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type StaffRole = 'ADMINISTRADOR' | 'CAJERO';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@tienda.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: ['ADMINISTRADOR', 'CAJERO'], example: 'CAJERO' })
  @IsIn(['ADMINISTRADOR', 'CAJERO'])
  @IsOptional()
  role?: StaffRole;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '555-1234' })
  @IsOptional()
  @IsString()
  phone?: string;
}
