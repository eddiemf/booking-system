import { integer, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './timestamps';

export const usersTable = pgTable('users', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const establishmentsTable = pgTable('establishments', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id),
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
  ...timestamps,
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishmentsTable.id),
});

export const serviceOfferingsTable = pgTable(
  'service_offerings',
  {
    id: uuid().primaryKey(),
    code: varchar({ length: 10 }).notNull().unique(),
    ...timestamps,
    serviceId: uuid('service_id')
      .notNull()
      .references(() => servicesTable.id),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resourcesTable.id),
    maxCapacity: integer('max_capacity').notNull().default(1),
    durationMinutes: integer('duration_minutes').notNull(),
    slotIntervalMinutes: integer('slot_interval_minutes').notNull(),
  },
  (table) => ({
    uniqueServiceResource: unique().on(table.serviceId, table.resourceId),
  })
);

export const bookingsTable = pgTable('bookings', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => usersTable.id),
  customerCode: varchar('customer_code', { length: 10 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  establishmentId: uuid('establishment_id')
    .notNull()
    .references(() => establishmentsTable.id),
  establishmentCode: varchar('establishment_code', { length: 10 }).notNull(),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => servicesTable.id),
  serviceCode: varchar('service_code', { length: 10 }).notNull(),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resourcesTable.id),
  resourceCode: varchar('resource_code', { length: 10 }).notNull(),
  resourceName: varchar('resource_name', { length: 255 }).notNull(),
  startsAt: varchar('starts_at', { length: 30 }).notNull(),
  endsAt: varchar('ends_at', { length: 30 }).notNull(),
  status: varchar({ length: 20 }).notNull().default('confirmed'),
  ...timestamps,
});

export const schedulesTable = pgTable('schedules', {
  id: uuid().primaryKey(),
  code: varchar({ length: 10 }).notNull().unique(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  ...timestamps,
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resourcesTable.id),
});
