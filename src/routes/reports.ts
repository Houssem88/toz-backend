import type { FastifyInstance } from 'fastify';
import { insertReport, listReports } from '../database.js';
import type { Report } from '../database.js';

function isReport(value: unknown): value is Report {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const report = value as Record<string, unknown>;
  return (
    typeof report.latitude === 'number' &&
    Number.isFinite(report.latitude) &&
    report.latitude >= -90 &&
    report.latitude <= 90 &&
    typeof report.longitude === 'number' &&
    Number.isFinite(report.longitude) &&
    report.longitude >= -180 &&
    report.longitude <= 180 &&
    typeof report.accuracy === 'number' &&
    Number.isFinite(report.accuracy) &&
    report.accuracy >= 0 &&
    typeof report.reportedAt === 'string' &&
    !Number.isNaN(Date.parse(report.reportedAt))
  );
}

export async function reportsRoutes(server: FastifyInstance) {
  server.get('/reports', async (_request, reply) => {
    const reports = await listReports();
    const rows = reports
      .map(
        (report) => `
          <tr>
            <td>${report.id}</td>
            <td>${report.latitude.toFixed(6)}</td>
            <td>${report.longitude.toFixed(6)}</td>
            <td>${report.accuracy.toFixed(1)} m</td>
            <td>${report.reportedAt}</td>
            <td>${report.createdAt}</td>
          </tr>`,
      )
      .join('');

    return reply.type('text/html').send(`<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>TOZ - Signalements</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 2rem; color: #17202a; }
            header { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
            table { border-collapse: collapse; margin-top: 1.5rem; width: 100%; }
            th, td { border-bottom: 1px solid #d9dee3; padding: .75rem; text-align: left; }
            th { background: #f1f3f5; }
            a { color: #0b62d6; }
          </style>
        </head>
        <body>
          <header>
            <h1>Signalements TOZ</h1>
            <a href="/reports">Actualiser</a>
          </header>
          <p>${reports.length} signalement(s)</p>
          <table>
            <thead><tr><th>ID</th><th>Latitude</th><th>Longitude</th><th>Précision</th><th>Date du signalement</th><th>Enregistré le</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6">Aucun signalement</td></tr>'}</tbody>
          </table>
        </body>
      </html>`);
  });

  server.post('/reports', async (request, reply) => {
    if (!isReport(request.body)) {
      return reply.code(400).send({
        message: 'Invalid report. Expected coordinates, accuracy and reportedAt.',
      });
    }

    const reportId = await insertReport(request.body);
    server.log.info({ reportId }, 'Report saved');

    return reply.code(201).send({
      message: 'Report received',
      reportId,
      report: request.body,
    });
  });
}