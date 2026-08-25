import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import pg from 'pg';

const { Pool } = pg;

const schema = `
  CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    reported_at TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    })
  : null;

const sqliteDatabasePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'toz.sqlite',
);

if (!pool) {
  mkdirSync(dirname(sqliteDatabasePath), { recursive: true });
}

const sqliteDatabase = pool ? null : new Database(sqliteDatabasePath);

if (sqliteDatabase) {
  sqliteDatabase.exec(schema.replaceAll('BIGSERIAL', 'INTEGER').replaceAll('DOUBLE PRECISION', 'REAL').replace('BIGSERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT').replace('TIMESTAMPTZ', 'TEXT').replace('NOW()', 'CURRENT_TIMESTAMP'));
}

export type Report = {
  latitude: number;
  longitude: number;
  accuracy: number;
  reportedAt: string;
};

export async function initializeDatabase(): Promise<void> {
  if (pool) {
    await pool.query(schema);
  }
}

export async function insertReport(report: Report): Promise<number> {
  if (pool) {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO reports (latitude, longitude, accuracy, reported_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [report.latitude, report.longitude, report.accuracy, report.reportedAt],
    );
    const insertedReport = result.rows[0];
    if (!insertedReport) {
      throw new Error('The report was not inserted.');
    }
    return insertedReport.id;
  }

  const result = sqliteDatabase!.prepare(`
    INSERT INTO reports (latitude, longitude, accuracy, reported_at)
    VALUES (@latitude, @longitude, @accuracy, @reportedAt)
  `).run(report);
  return Number(result.lastInsertRowid);
}

export async function listReports(): Promise<Array<Report & {
  id: number;
  createdAt: string;
}>> {
  if (pool) {
    const result = await pool.query<Report & { id: number; createdAt: string }>(`
      SELECT id, latitude, longitude, accuracy,
             reported_at AS "reportedAt", created_at AS "createdAt"
      FROM reports
      ORDER BY id DESC
    `);
    return result.rows;
  }

  return sqliteDatabase!.prepare(`
    SELECT id, latitude, longitude, accuracy,
           reported_at AS reportedAt, created_at AS createdAt
    FROM reports
    ORDER BY id DESC
  `).all() as Array<Report & {
    id: number;
    createdAt: string;
  }>;
}