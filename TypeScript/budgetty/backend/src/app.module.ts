import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Event } from './events/entities/event.entity';
import { Category } from './categories/entities/category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Event, Category],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    EventsModule,
    CategoriesModule,
    AuthModule,
  ],
})
export class AppModule {} 