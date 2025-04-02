import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CategoryRuleDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  patterns: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludePatterns?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @ValidateNested()
  @Type(() => CategoryRuleDto)
  @IsOptional()
  rules?: CategoryRuleDto;
} 