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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request.interface';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() createEventDto: CreateEventDto, @Req() req: RequestWithUser) {
    return this.eventsService.create(createEventDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all events' })
  findAll(@Req() req: RequestWithUser) {
    return this.eventsService.findAll(req.user);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event statistics' })
  getStats(
    @Req() req: RequestWithUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.eventsService.getStats(
      req.user,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('category/:categoryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events by category' })
  findByCategory(
    @Req() req: RequestWithUser,
    @Param('categoryId') categoryId: string,
  ) {
    return this.eventsService.findByCategory(req.user, categoryId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateEventDto>,
    @Req() req: RequestWithUser,
  ) {
    return this.eventsService.update(id, updateData, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.remove(id, req.user);
  }
} 