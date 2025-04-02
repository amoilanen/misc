import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request.interface';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: RequestWithUser) {
    return this.categoriesService.create(createCategoryDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@Req() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCategoryDto>,
    @Req() req: RequestWithUser,
  ) {
    return this.categoriesService.update(id, updateData, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.remove(id, req.user);
  }

  @Post('apply-rules')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply category rules to uncategorized events' })
  applyCategoryRules(@Req() req: RequestWithUser) {
    return this.categoriesService.applyCategoryRules(req.user);
  }
} 