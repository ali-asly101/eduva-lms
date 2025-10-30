// backend/db-scripts/migrate.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

// Auto-detect database connection
function createPool() {
  if (process.env.DATABASE_URL) {
    console.log('🌐 Using Neon/Cloud database');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    console.log('🐘 Using local PostgreSQL database');
    return new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: String(process.env.DB_PASSWORD || ''),
    });
  }
}

const pool = createPool();

class SimpleMigrator {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        rollback_sql TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  async getApplied() {
    const result = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    return result.rows.map(row => row.filename);
  }

  async getMigrationFiles() {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      return [];
    }
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

parseMigration(filename) {
  const upFilePath = path.join(__dirname, 'migrations', filename);
  const downFilePath = path.join(__dirname, 'rollback', filename);
  
  // Check if separate rollback file exists
  if (fs.existsSync(downFilePath)) {
    console.log(`Using separate rollback file: rollback/${filename}`);
    const upSql = fs.readFileSync(upFilePath, 'utf8');
    const downSql = fs.readFileSync(downFilePath, 'utf8');
    
    return {
      filename,
      upSql: upSql.trim(),
      downSql: downSql.trim()
    };
  }
  
  // Fall back to single file with -- ROLLBACK separator
  console.log(`Using single file with ROLLBACK separator: ${filename}`);
  const content = fs.readFileSync(upFilePath, 'utf8');
  const parts = content.split(/^-- ROLLBACK$/m);
  
  if (parts.length !== 2) {
    throw new Error(`${filename} must have either a separate rollback/${filename} file OR exactly one "-- ROLLBACK" separator`);
  }

  return {
    filename,
    upSql: parts[0].trim(),
    downSql: parts[1].trim()
  };
}

  async runMigration(migration) {
    console.log(`Running: ${migration.filename}`);
    
    await pool.query('BEGIN');
    try {
      await pool.query(migration.upSql);
      await pool.query(
        'INSERT INTO migrations (filename, rollback_sql) VALUES ($1, $2)',
        [migration.filename, migration.downSql]
      );
      await pool.query('COMMIT');
      console.log(`✅ ${migration.filename} completed`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`❌ ${migration.filename} failed:`, error.message);
      throw error;
    }
  }

  async rollbackMigration(filename) {
    console.log(`Rolling back: ${filename}`);
    
    const result = await pool.query(
      'SELECT rollback_sql FROM migrations WHERE filename = $1',
      [filename]
    );

    if (result.rows.length === 0) {
      throw new Error(`Migration ${filename} not found`);
    }

    const rollbackSql = result.rows[0].rollback_sql;

    await pool.query('BEGIN');
    try {
      await pool.query(rollbackSql);
      await pool.query('DELETE FROM migrations WHERE filename = $1', [filename]);
      await pool.query('COMMIT');
      console.log(`✅ ${filename} rolled back`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`❌ Rollback of ${filename} failed:`, error.message);
      throw error;
    }
  }

  async migrate() {
    await this.init();
    
    const applied = await this.getApplied();
    const files = await this.getMigrationFiles();
    
    const pending = files.filter(file => !applied.includes(file));
    
    if (pending.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`Running ${pending.length} migrations...`);
    
    for (const file of pending) {
      const migration = this.parseMigration(file);
      await this.runMigration(migration);
    }
    
    console.log('🎉 All migrations complete!');
  }

  async rollback(targetFile) {
    await this.init();
    
    if (!targetFile) {
      // Rollback last migration
      const result = await pool.query(
        'SELECT filename FROM migrations ORDER BY applied_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }
      
      targetFile = result.rows[0].filename;
    }

    await this.rollbackMigration(targetFile);
    console.log('🔄 Rollback complete!');
  }

  async status() {
    await this.init();
    
    const applied = await this.getApplied();
    const files = await this.getMigrationFiles();
    
    console.log('\n📊 Migration Status:');
    console.log('==================');
    
    files.forEach(file => {
      const status = applied.includes(file) ? '✅' : '⏳';
      console.log(`${status} ${file}`);
    });
    
    console.log(`\nTotal: ${files.length} files, ${applied.length} applied\n`);
  }

  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('Database connection successful');
      console.log(`Current time: ${result.rows[0].current_time}`);
      console.log(`PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  }
}

// CLI
const command = process.argv[2] || 'migrate';
const target = process.argv[3];
const migrator = new SimpleMigrator();

try {
  switch (command) {
    case 'status':
      await migrator.status();
      break;
    case 'rollback':
      await migrator.rollback(target);
      break;
    case 'test':
      await migrator.testConnection();
      break;
    default:
      await migrator.migrate();
  }
} catch (error) {
  console.error('Failed:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}