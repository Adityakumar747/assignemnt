import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseDir = path.resolve(__dirname, '../data/postgres');
const port = parseInt(process.env.PGPORT || '5432', 10);

async function start() {
  console.log(`[DB Runner] Initializing local PostgreSQL server on port ${port}...`);
  const pg = new EmbeddedPostgres({
    port: port,
    databaseDir: databaseDir,
    persistent: true,
    user: 'postgres',
    password: 'postgrespassword'
  });

  try {
    await pg.initialise();
    console.log('[DB Runner] Database cluster initialized.');
  } catch (err) {
    // If already initialized, proceed to start
    console.log('[DB Runner] Cluster already exists or initialization skipped.');
  }

  await pg.start();
  console.log(`[DB Runner] PostgreSQL server running on port ${port}!`);
  console.log(`[DB Runner] Connection URL: postgresql://postgres:postgrespassword@localhost:${port}/postgres`);

  const shutdown = async () => {
    console.log('\n[DB Runner] Stopping PostgreSQL server...');
    await pg.stop();
    console.log('[DB Runner] Server stopped.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(err => {
  console.error('[DB Runner] Failed to start PostgreSQL:', err);
  process.exit(1);
});
