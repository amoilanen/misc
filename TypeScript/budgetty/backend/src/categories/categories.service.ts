import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, user: User): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      user,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(user: User): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId: user.id },
    });
  }

  async findOne(id: string, user: User): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateData: Partial<Category>,
    user: User,
  ): Promise<Category> {
    const category = await this.findOne(id, user);
    Object.assign(category, updateData);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, user: User): Promise<void> {
    const category = await this.findOne(id, user);
    await this.categoryRepository.remove(category);
  }

  async applyCategoryRules(user: User): Promise<void> {
    const categories = await this.findAll(user);
    const events = await this.eventRepository.find({
      where: { userId: user.id, categoryId: null },
    });

    for (const event of events) {
      for (const category of categories) {
        if (this.matchesCategoryRules(event, category)) {
          event.categoryId = category.id;
          await this.eventRepository.save(event);
          break;
        }
      }
    }
  }

  private matchesCategoryRules(event: Event, category: Category): boolean {
    if (!category.rules) return false;

    const { patterns, excludePatterns, minAmount, maxAmount, currency } = category.rules;

    // Check description patterns
    const matchesPattern = patterns.some(pattern =>
      event.description.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (!matchesPattern) return false;

    // Check exclude patterns
    if (excludePatterns?.length) {
      const matchesExcludePattern = excludePatterns.some(pattern =>
        event.description.toLowerCase().includes(pattern.toLowerCase()),
      );
      if (matchesExcludePattern) return false;
    }

    // Check amount range
    if (minAmount !== undefined && event.amount < minAmount) return false;
    if (maxAmount !== undefined && event.amount > maxAmount) return false;

    // Check currency
    if (currency && event.currency !== currency) return false;

    return true;
  }
} 