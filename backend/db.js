// backend/db.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
console.log("[env] DATABASE_URL =", process.env.DATABASE_URL);
console.log("[env] DB_HOST =", process.env.DB_HOST);
const { Pool } = pkg;

// Build config
let config;
if (process.env.DATABASE_URL) {
  // Use SSL only if not localhost
  const isLocal =
    /localhost|127\.0\.0\.1/i.test(process.env.DATABASE_URL);
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
} else {
  // Local Postgres via separate vars
  const local = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "eduvadb",
    user: process.env.DB_USER || "eduva_user",
    ssl: false,
  };
  if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== "") {
    local.password = String(process.env.DB_PASSWORD);
  }
  config = local;
}


const pool = new Pool(config);

// Query wrapper function
export const q = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;

// Optional: quick self-test on startup (remove if you prefer)
if (process.env.NODE_ENV !== 'production') {
  pool
    .query('select 1 as ok')
    .then(() => console.log('[db] connected'))
    .catch((e) => console.error('[db] connection failed:', e.message));
}