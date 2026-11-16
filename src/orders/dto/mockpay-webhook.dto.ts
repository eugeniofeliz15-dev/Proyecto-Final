import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class MockPayMetadataDto {
  @IsOptional()
  @IsString()
  order_id?: string;
}

export class MockPayWebhookDto {
  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MockPayMetadataDto)
  metadata?: MockPayMetadataDto;

  @IsOptional()
  @IsString()
  failure_reason?: string;
}
