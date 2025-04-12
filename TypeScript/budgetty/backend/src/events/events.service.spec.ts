import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Category } from '@/categories/entities/category.entity';

describe('EventsService', () => {
  let service: EventsService;
  let repository: Repository<Event>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
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

    service = module.get<EventsService>(EventsService);
    repository = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all events', async () => {
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

    const events: Event[] = [
      { id: '1', description: 'Event 1', amount: 100, currency: 'USD', date: new Date(), userId: '1', categoryId: null, user: user, category: null, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', description: 'Event 2', amount: 200, currency: 'USD', date: new Date(), userId: '1', categoryId: null, user: user, category: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    jest.spyOn(repository, 'find').mockResolvedValue(events);

    expect(await service.findAll(user)).toEqual(events);
  });
});
