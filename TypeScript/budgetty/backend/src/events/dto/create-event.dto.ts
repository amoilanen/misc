import { IsDate, IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
} 