import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ImportEventsDto } from './dto/import-events.dto';
import { RequestWithUser } from '../auth/interfaces/request.interface';
import { User } from '../users/entities/user.entity';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    // Add other required User properties if necessary, or cast appropriately
  } as User;

  const mockRequest: RequestWithUser = {
    user: mockUser,
  } as RequestWithUser;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: {
            // Mock implementations should match the service method signatures
            create: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockImplementation((id: string, user: User) => Promise.resolve({ id, user })),
            update: jest.fn().mockImplementation((id: string, data: Partial<CreateEventDto>, user: User) => Promise.resolve({ id, ...data, user })),
            remove: jest.fn().mockImplementation((id: string, user: User) => Promise.resolve()),
            importFromCsv: jest.fn().mockResolvedValue({ imported: 0, skipped: 0, dateSkipped: 0, errors: [] }),
          },
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call the create method of the EventsService', async () => {
      const createEventDto: CreateEventDto = {
        date: new Date(),
        amount: 100,
        currency: 'USD',
        description: 'Test Event',
        categoryId: 'cat1',
      };
      await controller.create(createEventDto, mockRequest);
      expect(service.create).toHaveBeenCalledWith(createEventDto, mockRequest.user);
    });
  });

  describe('findAll', () => {
    it('should call the findAll method of the EventsService', async () => {
      await controller.findAll(mockRequest);
      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user);
    });
  });

  describe('findOne', () => {
    it('should call the findOne method of the EventsService with the given id', async () => {
      const id = 'event1';
      await controller.findOne(id, mockRequest);
      expect(service.findOne).toHaveBeenCalledWith(id, mockRequest.user);
    });
  });

  describe('update', () => {
    it('should call the update method of the EventsService with the given id and updateEventDto', async () => {
      const id = 'event1';
      // Use Partial<CreateEventDto> as per the controller signature
      const updateEventDto: Partial<CreateEventDto> = {
        description: 'Updated Description',
        amount: 150,
        categoryId: 'cat2',
      };
      await controller.update(id, updateEventDto, mockRequest);
      expect(service.update).toHaveBeenCalledWith(id, updateEventDto, mockRequest.user);
    });
  });

  describe('remove', () => {
    it('should call the remove method of the EventsService with the given id', async () => {
      const id = 'event1';
      await controller.remove(id, mockRequest);
      expect(service.remove).toHaveBeenCalledWith(id, mockRequest.user);
    });
  });

  describe('importFromCsv', () => {
    it('should call the importFromCsv method of the EventsService with the given file and config', async () => {
      const file = {
        buffer: Buffer.from(''),
        originalname: 'test.csv',
        mimetype: 'text/csv',
        size: 0,
        stream: null, // Add other required properties or cast
        destination: '',
        filename: '',
        path: '',
      } as Express.Multer.File;
      const importEventsDto: ImportEventsDto = {
        dateColumn: 'date',
        amountColumn: 'amount',
        descriptionColumn: 'description',
      };
      const configJson = JSON.stringify(importEventsDto);
      await controller.importFromCsv(file, configJson, mockRequest);
      expect(service.importFromCsv).toHaveBeenCalledWith(file.buffer, importEventsDto, mockRequest.user);
    });
  });
});
