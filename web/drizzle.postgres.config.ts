import { defineConfig } from "drizzle-kit";
import "dotenv/config";
if (!process.env.APP_DATABASE_URL) {
	throw new Error("No process.env.POSTGRES_DATABASE_URL FOUND");
}

export default defineConfig({
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.APP_DATABASE_URL,
	},
	schema: "./src/db/postgres/schema.ts",
	out: "./drizzle/postgres",
});
