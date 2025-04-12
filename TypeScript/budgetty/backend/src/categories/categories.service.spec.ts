import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Event } from '@/events/entities/event.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all categories', async () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [],
      categories: [],
      googleId: null,
      picture: null,
    };

    const categories: Category[] = [
      { id: '1', name: 'Category 1', userId: '1', events: [], rules: { patterns: ['pattern1'] }, user: user, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Category 2', userId: '1', events: [], rules: { patterns: ['pattern2'] }, user: user, createdAt: new Date(), updatedAt: new Date() },
    ];
    jest.spyOn(repository, 'find').mockResolvedValue(categories);

    expect(await service.findAll(user)).toEqual(categories);
  });
});
