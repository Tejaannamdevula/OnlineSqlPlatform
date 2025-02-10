import mysql from "mysql2/promise";

export const connection = await mysql.createConnection({
  host: "host",
  user: "user",
  database: "database",
});
