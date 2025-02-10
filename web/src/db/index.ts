import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("Not found DATABASE_URL");
}

const poolConnection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test_db",
});

export const db = drizzle({ client: poolConnection });
