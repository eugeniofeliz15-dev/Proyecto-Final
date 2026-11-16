import { IsNumber, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El monto de cierre no puede ser negativo' })
  closingBalance: number;
}
