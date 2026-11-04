import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

// The whole application dataset (users, orders, customers, payments, ...) is kept
// as one versioned JSON document. The version column guards against two
// function instances overwriting each other's changes.
export const applicationState = pgTable("application_state", {
  id: text().primaryKey(),
  version: integer().notNull().default(0),
  data: jsonb().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Server-generated secrets (e.g. the login token signing key when JWT_SECRET is not set).
export const appSecrets = pgTable("app_secrets", {
  name: text().primaryKey(),
  value: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
