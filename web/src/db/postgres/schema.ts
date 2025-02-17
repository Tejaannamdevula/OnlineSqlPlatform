import { pgTable, uuid, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
