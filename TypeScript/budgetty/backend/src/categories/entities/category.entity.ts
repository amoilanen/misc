import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  rules: {
    patterns: string[];
    excludePatterns?: string[];
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
  };

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.categories)
  user: User;

  @OneToMany(() => Event, event => event.category)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 