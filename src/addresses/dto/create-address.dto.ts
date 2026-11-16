import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Av. Winston Churchill 100' })
  @IsString()
  @MinLength(2)
  street: string;

  @ApiProperty({ example: 'Santo Domingo' })
  @IsString()
  @MinLength(2)
  city: string;

  @ApiProperty({ example: 'Distrito Nacional' })
  @IsString()
  @MinLength(2)
  state: string;

  @ApiProperty({ example: '10101' })
  @IsString()
  @MinLength(2)
  zipCode: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
