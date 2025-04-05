import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DateFormat {
  DD_MM_YYYY = 'DD/MM/YYYY',
  MM_DD_YYYY = 'MM/DD/YYYY',
  YYYY_MM_DD = 'YYYY/MM/DD',
  DD_MM_YY = 'DD/MM/YY',
  MM_DD_YY = 'MM/DD/YY',
  YY_MM_DD = 'YY/MM/DD',
}

export class ImportEventsDto {
  @ApiProperty({ description: 'Column name for date field' })
  @IsString()
  dateColumn: string;

  @ApiProperty({ description: 'Column name for amount field' })
  @IsString()
  amountColumn: string;

  @ApiProperty({ description: 'Column name for description field' })
  @IsString()
  descriptionColumn: string;

  @ApiProperty({ description: 'Column name for currency field (optional)' })
  @IsString()
  @IsOptional()
  currencyColumn?: string;

  @ApiProperty({ description: 'Default currency if not specified in CSV' })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiProperty({ 
    description: 'Date format in the CSV file',
    enum: DateFormat,
    default: DateFormat.DD_MM_YYYY
  })
  @IsEnum(DateFormat)
  @IsOptional()
  dateFormat?: DateFormat = DateFormat.DD_MM_YYYY;

  @ApiProperty({ description: 'CSV delimiter character' })
  @IsString()
  @IsOptional()
  delimiter?: string = ';';
} 