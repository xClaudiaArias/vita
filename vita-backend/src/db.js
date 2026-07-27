import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// A "pool" manages multiple reusable connections instead of opening
// a brand new one for every query — this is the standard pattern.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
