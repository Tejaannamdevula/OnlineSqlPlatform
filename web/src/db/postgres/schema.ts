import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	serial,
	pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { InferInsertModel } from "drizzle-orm";
export const userRole = pgEnum("userRole", ["admin", "user"]);
export const problems = pgTable("problems", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description").notNull(),
	boilerplate: text("boilerplate").notNull(),
	solution: text("solution").notNull(),
	output: text("output").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`now()`) // Ensures auto-update on modification
		.notNull(),
});

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password").notNull(),
	role: userRole("userRole").default("user").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

export type NewUser = InferInsertModel<typeof users>;
