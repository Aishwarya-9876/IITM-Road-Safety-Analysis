import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.");

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
  max: 5
});
