import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const usersTable = pgTable('users', {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const establishmentsTable = pgTable('establishments', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
  userId: uuid('user_id').references(() => usersTable.id),
});

export const servicesTable = pgTable('services', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  duration: integer().notNull(),
  ...timestamps,
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishmentsTable.id),
});

export const resourcesTable = pgTable('resources', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull(),
  ...timestamps,
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishmentsTable.id),
});

export const schedulesTable = pgTable('schedules', {
  id: uuid().primaryKey(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  ...timestamps,
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resourcesTable.id),
});
