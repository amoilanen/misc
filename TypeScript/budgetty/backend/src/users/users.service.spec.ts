import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
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

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users: User[] = [
      { id: '1', email: 'test1@example.com', firstName: 'Test1', lastName: 'User1', isActive: true, createdAt: new Date(), updatedAt: new Date(), events: [], categories: [], googleId: null, picture: null },
      { id: '2', email: 'test2@example.com', firstName: 'Test2', lastName: 'User2', isActive: true, createdAt: new Date(), updatedAt: new Date(), events: [], categories: [], googleId: null, picture: null },
    ];
    jest.spyOn(repository, 'find').mockResolvedValue(users);

    expect(await service.findAll()).toEqual(users);
  });
});
