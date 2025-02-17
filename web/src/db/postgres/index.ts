import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

if (!process.env.APP_DATABASE_URL) {
	throw new Error("No process.env.APP_DATABASE_URL FOUND");
}

export const pool = new Pool({
	connectionString: process.env.APP_DATABASE_URL,
	max: 10, // Maximum number of connections in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
});

export const appDb = drizzle({ client: pool });
