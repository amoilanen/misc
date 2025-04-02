import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../src/users/entities/user.entity';
import { Event } from '../src/events/entities/event.entity';
import { Category } from '../src/categories/entities/category.entity';

export class TestHelper {
  static async createTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_NAME'),
            entities: [User, Event, Category],
            synchronize: true,
            dropSchema: true,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();
  }

  static async createTestingApp(): Promise<INestApplication> {
    const moduleFixture = await this.createTestingModule();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static async closeTestingApp(app: INestApplication): Promise<void> {
    await app.close();
  }
} 