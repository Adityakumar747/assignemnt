import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, async () => {
  console.log(`🚀 Mini ERP + CRM Backend API listening on http://localhost:${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);

  try {
    await prisma.$connect();
    console.log('✅ Database connection established successfully.');
  } catch (err: any) {
    console.error('❌ Database connection failed! Is PostgreSQL running?');
    console.error('   Hint: Run "npm run db:start" in the backend directory to start the embedded PostgreSQL cluster.');
  }
});

async function gracefulShutdown(signal: string) {
  console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Server] HTTP server and Prisma connection closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
