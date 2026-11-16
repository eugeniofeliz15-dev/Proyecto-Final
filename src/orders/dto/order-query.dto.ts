import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/pagination.dto';
import { OrderStatusDto } from './update-order-status.dto';

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatusDto })
  @IsOptional()
  @IsEnum(OrderStatusDto)
  status?: OrderStatusDto;
}
