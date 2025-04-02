import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Event, event => event.user)
  events: Event[];

  @OneToMany(() => Category, category => category.user)
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 