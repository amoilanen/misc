import { DataSource } from 'typeorm';
import { seed } from './seed';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'budgetty',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
});

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    
    await seed(dataSource);
    console.log('Seed completed successfully!');
    
    await dataSource.destroy();
    console.log('Data Source has been destroyed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

runSeed(); 