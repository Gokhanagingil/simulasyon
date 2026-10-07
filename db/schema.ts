import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text().primaryKey(), username: text().notNull().unique(), name: text().notNull(),
  password: text().notNull(), trainer: integer().notNull().default(0),
});
export const logins = sqliteTable('logins', {
  token: text().primaryKey(), user_id: text().notNull().references(() => users.id, { onDelete: 'cascade' }), expires: integer().notNull(),
});
export const workshops = sqliteTable('workshops', {
  id: text().primaryKey(), name: text().notNull(), code: text().notNull().unique(), scenario_id: text().notNull(),
  status: text().notNull().default('ready'), elapsed: integer().notNull().default(0), started_at: integer(), created_at: integer().notNull(),
});
export const memberships = sqliteTable('memberships', {
  workshop_id: text().notNull().references(() => workshops.id), user_id: text().notNull().references(() => users.id), role_id: text().notNull(),
}, table => [primaryKey({ columns: [table.workshop_id, table.user_id] })]);
export const zoneStates = sqliteTable('zone_states', {
  workshop_id: text().notNull().references(() => workshops.id), zone_id: text().notNull(), status: text().notNull().default('open'), note: text().notNull().default(''),
}, table => [primaryKey({ columns: [table.workshop_id, table.zone_id] })]);
export const announcements = sqliteTable('announcements', {
  id: text().primaryKey(), workshop_id: text().notNull().references(() => workshops.id), title: text().notNull(),
  message: text().notNull(), role_id: text(), created_at: integer().notNull(),
});
export const notes = sqliteTable('notes', {
  workshop_id: text().notNull().references(() => workshops.id), user_id: text().notNull().references(() => users.id), text: text().notNull().default(''),
}, table => [primaryKey({ columns: [table.workshop_id, table.user_id] })]);
export const platformUsers = sqliteTable('platform_users', {
  id: text().primaryKey(), user_id: text().notNull().unique().references(() => users.id),
});
export const activity = sqliteTable('activity', {
  id: text().primaryKey(), workshop_id: text().notNull().references(() => workshops.id), actor_id: text().notNull().references(() => users.id), message: text().notNull(), created_at: integer().notNull(),
});
