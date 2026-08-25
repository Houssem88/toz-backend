import Fastify from 'fastify';
import { initializeDatabase } from './database.js';
import { reportsRoutes } from './routes/reports.js';

const server = Fastify({
  logger: {
    base: {
      hostname: 'Houssem',
    },
  },
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

server.get('/', async () => {
  return {
    name: 'TOZ API',
    status: 'ok',
  };
});

server.register(reportsRoutes);

const start = async () => {
  try {
    await initializeDatabase();
    await server.listen({
      port,
      host,
    });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();