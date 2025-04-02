import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Event } from '../../events/entities/event.entity';

export async function seed(dataSource: DataSource) {
  // Create test user
  const userRepository = dataSource.getRepository(User);
  const user = await userRepository.save({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
  });

  // Create categories
  const categoryRepository = dataSource.getRepository(Category);
  const categories = await Promise.all([
    categoryRepository.save({
      name: 'Groceries',
      userId: user.id,
      rules: {
        patterns: ['PRISMA', 'LIDL', 'K-CITYMARKET', 'S-MARKET'],
        excludePatterns: ['PRISMA LAUNE LA'],
      },
    }),
    categoryRepository.save({
      name: 'Entertainment',
      userId: user.id,
      rules: {
        patterns: ['NETFLIX', 'SPOTIFY', 'DISNEYPLUS', 'YOUTUBE'],
      },
    }),
    categoryRepository.save({
      name: 'Transportation',
      userId: user.id,
      rules: {
        patterns: ['ABC', 'TANK', 'NESTE'],
      },
    }),
    categoryRepository.save({
      name: 'Healthcare',
      userId: user.id,
      rules: {
        patterns: ['LAKARI', 'APOTEK', 'HALPA'],
      },
    }),
    categoryRepository.save({
      name: 'Shopping',
      userId: user.id,
      rules: {
        patterns: ['VERKKOKAUPPA', 'AMAZON', 'EBAY'],
      },
    }),
  ]);

  // Create events
  const eventRepository = dataSource.getRepository(Event);
  const events = [
    {
      date: new Date('2024-03-01'),
      amount: -150.50,
      currency: 'EUR',
      description: 'PRISMA HOLMA LAHTI',
      categoryId: categories[0].id,
      userId: user.id,
    },
    {
      date: new Date('2024-03-02'),
      amount: -9.99,
      currency: 'EUR',
      description: 'NETFLIX',
      categoryId: categories[1].id,
      userId: user.id,
    },
    {
      date: new Date('2024-03-03'),
      amount: -45.00,
      currency: 'EUR',
      description: 'ABC HOLMA',
      categoryId: categories[2].id,
      userId: user.id,
    },
    {
      date: new Date('2024-03-04'),
      amount: -25.00,
      currency: 'EUR',
      description: 'LAKARI',
      categoryId: categories[3].id,
      userId: user.id,
    },
    {
      date: new Date('2024-03-05'),
      amount: -299.99,
      currency: 'EUR',
      description: 'VERKKOKAUPPA.COM',
      categoryId: categories[4].id,
      userId: user.id,
    },
    {
      date: new Date('2024-03-06'),
      amount: 3000.00,
      currency: 'EUR',
      description: 'SALARY',
      userId: user.id,
    },
  ];

  await eventRepository.save(events);
} 