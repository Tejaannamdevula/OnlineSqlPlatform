import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { NewUser, users } from "./schema";
import * as schema from "./schema";
if (!process.env.APP_DATABASE_URL) {
	throw new Error("No process.env.APP_DATABASE_URL FOUND");
}

export const pool = new Pool({
	connectionString: process.env.APP_DATABASE_URL,
	max: 10, // Maximum number of connections in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return an error if connection takes more than 2 seconds
});

export const appDb = drizzle(pool, { schema });

export const insertUser = async (user: NewUser) => {
	const [newUser] = await appDb
		.insert(users)
		.values({
			name: user.name,
			email: user.email,
			password: user.password,
			role: user.role,
		})
		.returning();

	return newUser;
};
