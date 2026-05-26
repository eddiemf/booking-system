import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const establishmentsTable = pgTable('establishments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
  userId: integer('user_id').references(() => usersTable.id),
});

export const servicesTable = pgTable('services', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  duration: integer().notNull(),
  ...timestamps,
  establishmentId: integer('establishment_id').references(() => establishmentsTable.id),
  userId: integer('user_id').references(() => usersTable.id),
});

export const resourcesTable = pgTable('resources', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull(),
  ...timestamps,
  establishmentId: integer('establishment_id').references(() => establishmentsTable.id),
});

export const schedulesTable = pgTable('schedules', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  ...timestamps,
  resourceId: integer('resource_id').references(() => resourcesTable.id),
});
