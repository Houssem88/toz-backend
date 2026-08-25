import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const databasePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'toz.sqlite',
);
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);

database.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL NOT NULL,
    reported_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertReportStatement = database.prepare(`
  INSERT INTO reports (latitude, longitude, accuracy, reported_at)
  VALUES (@latitude, @longitude, @accuracy, @reportedAt)
`);

const listReportsStatement = database.prepare(`
  SELECT
    id,
    latitude,
    longitude,
    accuracy,
    reported_at AS reportedAt,
    created_at AS createdAt
  FROM reports
  ORDER BY id DESC
`);

export type Report = {
  latitude: number;
  longitude: number;
  accuracy: number;
  reportedAt: string;
};

export function insertReport(report: Report): number {
  const result = insertReportStatement.run(report);
  return Number(result.lastInsertRowid);
}

export function listReports(): Array<Report & {
  id: number;
  createdAt: string;
}> {
  return listReportsStatement.all() as Array<Report & {
    id: number;
    createdAt: string;
  }>;
}