import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error("No process.env.DATABASE_URL FOUND");
}

export default defineConfig({
	dialect: "mysql",

	dbCredentials: {
		url: process.env.DATABASE_URL,
	},

	schema: "./src/db/schema.ts",

	out: "./drizzle",
});
