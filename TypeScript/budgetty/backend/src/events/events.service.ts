import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, user: User): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      user,
    });
    return this.eventRepository.save(event);
  }

  async findAll(user: User): Promise<Event[]> {
    return this.eventRepository.find({
      where: { userId: user.id },
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByDateRange(
    user: User,
    startDate: Date,
    endDate: Date,
  ): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        userId: user.id,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });
  }

  async findByCategory(user: User, categoryId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        userId: user.id,
        categoryId,
      },
      order: { date: 'DESC' },
    });
  }

  async update(
    id: string,
    updateData: Partial<Event>,
    user: User,
  ): Promise<Event> {
    const event = await this.findOne(id, user);
    Object.assign(event, updateData);
    return this.eventRepository.save(event);
  }

  async remove(id: string, user: User): Promise<void> {
    const event = await this.findOne(id, user);
    await this.eventRepository.remove(event);
  }

  async getStats(user: User, startDate: Date, endDate: Date) {
    const events = await this.findByDateRange(user, startDate, endDate);
    
    const totalIncome = events
      .filter(event => event.amount > 0)
      .reduce((sum, event) => sum + event.amount, 0);

    const totalExpenses = events
      .filter(event => event.amount < 0)
      .reduce((sum, event) => sum + Math.abs(event.amount), 0);

    const categoryStats = events.reduce((acc, event) => {
      if (!event.categoryId) return acc;
      
      if (!acc[event.categoryId]) {
        acc[event.categoryId] = {
          income: 0,
          expenses: 0,
          count: 0,
        };
      }

      if (event.amount > 0) {
        acc[event.categoryId].income += event.amount;
      } else {
        acc[event.categoryId].expenses += Math.abs(event.amount);
      }
      acc[event.categoryId].count++;

      return acc;
    }, {});

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      categoryStats,
    };
  }
} 