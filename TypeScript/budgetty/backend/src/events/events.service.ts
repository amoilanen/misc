import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/entities/user.entity';
import { ImportEventsDto, DateFormat } from './dto/import-events.dto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import * as moment from 'moment';

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

  async importFromCsv(
    fileBuffer: Buffer,
    importConfig: ImportEventsDto,
    user: User,
  ): Promise<{ imported: number; skipped: number; dateSkipped: number; errors: string[] }> {
    const { 
      dateColumn, 
      amountColumn, 
      descriptionColumn, 
      currencyColumn, 
      defaultCurrency = 'EUR',
      dateFormat = DateFormat.DD_MM_YYYY,
      delimiter = ';'
    } = importConfig;

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;
    let dateSkipped = 0;

    // Create a readable stream from the buffer
    const stream = Readable.from(fileBuffer);

    // Parse the CSV
    const records: any[] = await new Promise((resolve, reject) => {
      const parser = parse({
        delimiter,
        columns: (headers) => {
          // Remove BOM from first header if present
          if (headers[0] && headers[0].charCodeAt(0) === 0xFEFF) {
            headers[0] = headers[0].slice(1);
          }
          return headers;
        },
        skip_empty_lines: true,
        trim: true,
      });

      const results: any[] = [];
      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          results.push(record);
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', () => {
        resolve(results);
      });

      stream.pipe(parser);
    });

    // Process each record
    for (const record of records) {
      try {
        // Extract and validate required fields
        const dateStr = record[dateColumn];
        const amountStr = record[amountColumn];
        const description = record[descriptionColumn];
        const currency = currencyColumn ? record[currencyColumn] : defaultCurrency;

        // Skip records with missing date (future/reserved transactions)
        if (!dateStr) {
          dateSkipped++;
          continue;
        }

        // Check which other required fields are missing
        const missingFields = [];
        if (!amountStr) missingFields.push(amountColumn);
        if (!description) missingFields.push(descriptionColumn);

        if (missingFields.length > 0) {
          errors.push(`Missing required fields: ${missingFields.join(', ')} in record: ${JSON.stringify(record)}`);
          continue;
        }

        // Parse date according to the specified format
        let date: Date;
        try {
          date = moment(dateStr, dateFormat).toDate();
          if (isNaN(date.getTime())) {
            errors.push(`Invalid date format in record: ${dateStr}`);
            continue;
          }
        } catch (error) {
          errors.push(`Invalid date format in record: ${dateStr}`);
          continue;
        }

        // Parse amount
        let amount: number;
        try {
          // Handle different formats (e.g., "1,234.56" or "1.234,56")
          const cleanAmount = amountStr.replace(/\./g, '').replace(',', '.');
          amount = parseFloat(cleanAmount);
          if (isNaN(amount)) {
            errors.push(`Invalid amount format in record: ${amountStr}`);
            continue;
          }
        } catch (error) {
          errors.push(`Invalid amount format in record: ${amountStr}`);
          continue;
        }

        // Check for duplicates
        const existingEvent = await this.eventRepository.findOne({
          where: {
            userId: user.id,
            date,
            amount,
            description,
          },
        });

        if (existingEvent) {
          skipped++;
          continue;
        }

        // Create new event
        const event = this.eventRepository.create({
          date,
          amount,
          currency,
          description,
          user,
        });

        await this.eventRepository.save(event);
        imported++;
      } catch (error) {
        errors.push(`Error processing record: ${error.message}`);
        // Continue to the next record instead of stopping the entire import
        continue;
      }
    }

    return { 
      imported, 
      skipped, 
      dateSkipped,
      errors 
    };
  }
} 