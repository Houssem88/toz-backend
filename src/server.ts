import Fastify from 'fastify';
import { reportsRoutes } from './routes/reports.js';

const server = Fastify({
  logger: true,
});

server.get('/', async () => {
  return {
    name: 'TOZ API',
    status: 'ok',
  };
});

server.register(reportsRoutes);

const start = async () => {
  try {
    await server.listen({
      port: 3000,
      host: '127.0.0.1',
    });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

start();